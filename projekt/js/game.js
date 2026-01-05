import { generateMatchFleets } from './shipFactory.js';
import { AI } from './ai.js';

const difficulty = localStorage.getItem('battleship_difficulty') || 'medium';
const ai = new AI(difficulty);

const state = {
    playerFleet: [],
    cpuFleet: [],
    playerHP: 0,
    cpuHP: 0,
    turn: 'player', 
    isGameOver: false,
    fleetConfig: []
};

const playerBoardEl = document.getElementById('player-board');
const cpuBoardEl = document.getElementById('cpu-board');
const statusEl = document.getElementById('game-status');
const resetBtn = document.getElementById('reset-btn');
const cpuFleetStatusEl = document.getElementById('cpu-fleet-status');
const playerFleetStatusEl = document.getElementById('player-fleet-status');

function initGame() {
    state.isGameOver = false;
    state.turn = 'player';
    statusEl.textContent = "Twój ruch!";
    statusEl.style.color = "white";
    cpuBoardEl.classList.remove('locked');

    const gameData = generateMatchFleets();
    
    state.playerFleet = gameData.playerFleet;
    state.cpuFleet = gameData.cpuFleet;
    state.fleetConfig = gameData.composition;
    
    state.playerHP = gameData.totalCells;
    state.cpuHP = gameData.totalCells;

    ai.shotsFired.clear();
    ai.hitStack = [];

    renderBoards();
    updateFleetStatusUI();
}

function renderBoards() {
    playerBoardEl.innerHTML = '';
    cpuBoardEl.innerHTML = '';
    const BOARD_SIZE = 10;

    const playerShipIndices = new Set();
    state.playerFleet.forEach(ship => ship.indices.forEach(i => playerShipIndices.add(i)));

    for(let i=0; i < BOARD_SIZE*BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        if (playerShipIndices.has(i)) cell.classList.add('ship-present');
        playerBoardEl.appendChild(cell);
    }

    const cpuShipIndices = new Set();
    state.cpuFleet.forEach(ship => ship.indices.forEach(i => cpuShipIndices.add(i)));

    for(let i=0; i < BOARD_SIZE*BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        if (cpuShipIndices.has(i)) cell.classList.add('ship-present');
        cell.addEventListener('click', handlePlayerClick);
        cpuBoardEl.appendChild(cell);
    }
}

function updateFleetStatusUI() {
    cpuFleetStatusEl.innerHTML = generateStatusHTML(state.cpuFleet, state.fleetConfig);
    playerFleetStatusEl.innerHTML = generateStatusHTML(state.playerFleet, state.fleetConfig);
}

function generateStatusHTML(fleet, config) {
    const totalCounts = {};
    config.forEach(size => {
        totalCounts[size] = (totalCounts[size] || 0) + 1;
    });

    const sunkCounts = {};
    fleet.forEach(ship => {
        if (ship.sunk) {
            sunkCounts[ship.size] = (sunkCounts[ship.size] || 0) + 1;
        }
    });

    const uniqueSizes = Object.keys(totalCounts).sort((a,b) => b-a);
    
    let html = '<div class="fleet-list">';
    uniqueSizes.forEach(size => {
        const total = totalCounts[size];
        const sunk = sunkCounts[size] || 0;
        const isAllSunk = sunk === total;
        
        const statusClass = isAllSunk ? 'status-complete' : 'status-active';

        html += `
            <div class="fleet-item ${statusClass}">
                <span class="ship-label">Statki ${size}-masztowe:</span>
                <span class="ship-count">${sunk}/${total}</span>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function handlePlayerClick(e) {
    if (state.isGameOver || state.turn !== 'player') return;
    const cell = e.target;
    if (cell.classList.contains('hit') || cell.classList.contains('miss') || cell.classList.contains('sunk')) return;

    const index = parseInt(cell.dataset.index);
    const result = processShot(index, state.cpuFleet, cell, 'cpu');
    
    if (result.isHit) {
        statusEl.textContent = "TRAFIENIE! Strzelasz dalej!";
        statusEl.style.color = "#e74c3c";
        checkWinCondition();
    } else {
        if (!state.isGameOver) {
            state.turn = 'cpu';
            statusEl.textContent = "PUDŁO. Tura komputera...";
            statusEl.style.color = "white";
            cpuBoardEl.classList.add('locked');
            setTimeout(cpuTurn, 800);
        }
    }
}

function cpuTurn() {
    if (state.isGameOver) return;
    const targetIndex = ai.makeMove(state.playerFleet);
    const cell = playerBoardEl.children[targetIndex];
    const result = processShot(targetIndex, state.playerFleet, cell, 'player');
    
    ai.reportResult(targetIndex, result.isHit);

    if (result.isHit) {
        if (!state.isGameOver) {
            statusEl.textContent = "Komputer trafił! Strzela ponownie...";
            setTimeout(cpuTurn, 1000);
        }
        checkWinCondition();
    } else {
        if (!state.isGameOver) {
            state.turn = 'player';
            statusEl.textContent = "Komputer spudłował. Twój ruch!";
            cpuBoardEl.classList.remove('locked');
        }
    }
}

function processShot(index, fleet, cellElement, targetName) {
    const ship = fleet.find(s => s.indices.includes(index));
    
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    cellElement.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);

    if (ship) {
        ship.hits++;
        if (targetName === 'cpu') state.cpuHP--; else state.playerHP--;
        
        if (ship.hits >= ship.size) {
            ship.sunk = true;
            markShipAsSunk(ship, targetName === 'cpu' ? cpuBoardEl : playerBoardEl);
        } else {
            cellElement.classList.add('hit');
        }

        updateFleetStatusUI(); 
        return { isHit: true };
    } else {
        cellElement.classList.add('miss');
        return { isHit: false };
    }
}

function markShipAsSunk(ship, boardElement) {
    ship.indices.forEach(idx => {
        const cell = boardElement.children[idx];
        cell.classList.remove('hit');
        cell.classList.add('sunk');
    });
}

function checkWinCondition() {
    if (state.cpuHP <= 0) endGame(true);
    else if (state.playerHP <= 0) endGame(false);
}

function endGame(playerWon) {
    state.isGameOver = true;
    statusEl.innerHTML = playerWon 
        ? "<span style='color:#2ecc71; font-size:1.4rem'>WYGRANA!</span>" 
        : "<span style='color:#e74c3c; font-size:1.4rem'>PRZEGRANA!</span>";
    cpuBoardEl.classList.add('locked');
}

if(resetBtn) resetBtn.addEventListener('click', initGame);

initGame();