import { generateMatchFleets } from './shipFactory.js';
import { BoardState } from './boardState.js';
import { AI } from './ai.js';

const difficulty = localStorage.getItem('battleship_difficulty') || 'medium';
const ai = new AI(difficulty);

const playerState = new BoardState('player');
const cpuState = new BoardState('cpu');

const playerBoardEl = document.getElementById('player-board');
const cpuBoardEl = document.getElementById('cpu-board');
const statusEl = document.getElementById('game-status');
const resetBtn = document.getElementById('reset-btn');
const backBtn = document.querySelector('.back-btn');
const cpuFleetStatusEl = document.getElementById('cpu-fleet-status');
const playerFleetStatusEl = document.getElementById('player-fleet-status');

let gameState = {
    turn: 'player',
    isGameOver: false,
    fleetConfig: []
};

function initGame() {
    const savedGame = localStorage.getItem('battleship_active_game');

    if (savedGame) {
        restoreGame(JSON.parse(savedGame));
    } else {
        startNewGame();
    }

    updateFleetStatusUI();
}

function startNewGame() {
    gameState.isGameOver = false;
    gameState.turn = 'player';
    statusEl.textContent = "Twój ruch!";
    statusEl.style.color = "white";

    const gameData = generateMatchFleets();
    gameState.fleetConfig = gameData.composition;

    const savedPlayerFleet = localStorage.getItem('battleship_player_fleet');
    if (savedPlayerFleet) {
        playerState.loadFleet(JSON.parse(savedPlayerFleet));
    } else {
        window.location.href = 'setup.html';
        return;
    }

    cpuState.loadFleet(gameData.cpuFleet);
    cpuState.setLocked(false);
    
    ai.shotsFired.clear();
    ai.hitStack = [];
    
    saveGameState();
}

function restoreGame(data) {
    gameState.turn = data.turn;
    gameState.isGameOver = data.isGameOver;
    gameState.fleetConfig = data.fleetConfig;

    playerState.restoreState(data.playerGrid, data.playerShips);
    cpuState.restoreState(data.cpuGrid, data.cpuShips);
    ai.loadState(data.aiState);

    if (gameState.isGameOver) {
        statusEl.innerHTML = data.statusText;
        cpuState.setLocked(true);
    } else if (gameState.turn === 'player') {
        statusEl.textContent = "Twój ruch! (Wczytano grę)";
        cpuState.setLocked(false);
    } else {
        statusEl.textContent = "Ruch komputera... (Wczytano grę)";
        cpuState.setLocked(true);
        setTimeout(cpuTurn, 800);
    }
}

function saveGameState() {
    const data = {
        turn: gameState.turn,
        isGameOver: gameState.isGameOver,
        fleetConfig: gameState.fleetConfig,
        playerGrid: playerState.grid,
        playerShips: playerState.ships,
        cpuGrid: cpuState.grid,
        cpuShips: cpuState.ships,
        aiState: ai.getState(),
        statusText: statusEl.innerHTML
    };
    localStorage.setItem('battleship_active_game', JSON.stringify(data));
}

playerState.subscribe(data => {
    handleBoardUpdate(data, playerBoardEl, 'player');
    saveGameState();
});

cpuState.subscribe(data => {
    handleBoardUpdate(data, cpuBoardEl, 'cpu');
    saveGameState();
});

function handleBoardUpdate(data, boardElement, owner) {
    if (data.type === 'INIT_BOARD') {
        renderBoardStructure(boardElement, owner, data.grid, data.ships);
    } 
    else if (data.type === 'UPDATE_CELL') {
        const cell = boardElement.children[data.index];
        if (cell) {
            cell.classList.add(data.status);
            
            if (data.status === 'hit' || data.status === 'sunk') {
                cell.classList.add('ship-present'); 
                createExplosion(cell);
            }
        }
        updateFleetStatusUI();
    }
    else if (data.type === 'LOCK_STATE') {
        if (data.locked) boardElement.classList.add('locked');
        else boardElement.classList.remove('locked');
    }
}

function renderBoardStructure(container, owner, gridData, ships) {
    container.innerHTML = '';
    
    const shipIndices = new Set();
    if (ships) {
        ships.forEach(s => s.indices.forEach(idx => shipIndices.add(idx)));
    }

    gridData.forEach((cellData, index) => {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = index;
        
        if (cellData && (cellData.type === 'hit' || cellData.type === 'miss' || cellData.type === 'sunk')) {
            cell.classList.add(cellData.type);
        }

        const isShip = shipIndices.has(index);

        if (owner === 'player' && isShip) {
            cell.classList.add('ship-present');
        }
        
        if (owner === 'cpu' && isShip && (cellData && (cellData.type === 'hit' || cellData.type === 'sunk'))) {
            cell.classList.add('ship-present');
        }

        if (owner === 'cpu') {
            cell.addEventListener('click', handlePlayerClick);
        }

        container.appendChild(cell);
    });
}

function handlePlayerClick(e) {
    if (gameState.isGameOver || gameState.turn !== 'player') return;
    
    const index = parseInt(e.target.dataset.index);
    const attackResult = cpuState.receiveAttack(index);

    if (attackResult.result === 'already_shot' || attackResult.result === 'invalid') return;

    if (attackResult.result === 'hit') {
        statusEl.textContent = "TRAFIENIE! Strzelasz dalej!";
        statusEl.style.color = "#e74c3c";
        checkWinCondition();
    } else {
        gameState.turn = 'cpu';
        statusEl.textContent = "PUDŁO. Tura komputera...";
        statusEl.style.color = "white";
        cpuState.setLocked(true);
        saveGameState(); 
        setTimeout(cpuTurn, 800);
    }
}

function cpuTurn() {
    if (gameState.isGameOver) return;

    const targetIndex = ai.makeMove(null); 
    const attackResult = playerState.receiveAttack(targetIndex);

    ai.reportResult(targetIndex, attackResult.result === 'hit');

    if (attackResult.result === 'hit') {
        statusEl.textContent = "Komputer trafił! Strzela ponownie...";
        checkWinCondition();
        if (!gameState.isGameOver) setTimeout(cpuTurn, 1000);
    } else {
        gameState.turn = 'player';
        statusEl.textContent = "Komputer spudłował. Twój ruch!";
        cpuState.setLocked(false);
        saveGameState();
    }
}

function createExplosion(cell) {
    if (gameState.isGameOver) return; 
    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    cell.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);
}

function checkWinCondition() {
    if (cpuState.isDefeated()) endGame(true);
    else if (playerState.isDefeated()) endGame(false);
}

function endGame(playerWon) {
    gameState.isGameOver = true;
    statusEl.innerHTML = playerWon 
        ? "<span style='color:#2ecc71; font-size:1.4rem'>WYGRANA!</span>" 
        : "<span style='color:#e74c3c; font-size:1.4rem'>PRZEGRANA!</span>";
    cpuState.setLocked(true);
    saveGameState();
}

function updateFleetStatusUI() {
    cpuFleetStatusEl.innerHTML = generateStatusHTML(cpuState.ships, gameState.fleetConfig);
    playerFleetStatusEl.innerHTML = generateStatusHTML(playerState.ships, gameState.fleetConfig);
}

function generateStatusHTML(fleet, config) {
    if (!fleet || !config) return '';
    
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

if(resetBtn) resetBtn.addEventListener('click', () => {
    if (confirm("Czy na pewno chcesz zresetować grę? (Twoje ustawienie statków zostanie zachowane, ale wylosujemy nowego przeciwnika)")) {
        localStorage.removeItem('battleship_active_game');
        startNewGame();
    }
});

if(backBtn) backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('battleship_active_game');
    window.location.href = 'index.html';
});

initGame();