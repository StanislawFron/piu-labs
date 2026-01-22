import { createFleetComposition, BOARD_SIZE } from './shipFactory.js';

const boardEl = document.getElementById('setup-board');
const dockEl = document.getElementById('ship-dock');
const rotateBtn = document.getElementById('rotate-btn');
const startBtn = document.getElementById('start-game-btn');
const statusEl = document.getElementById('setup-status');

let state = {
    ships: [],
    isHorizontal: true,
    draggedShipId: null
};

function initSetup() {
    const savedData = localStorage.getItem('battleship_setup_state');
    
    if (savedData) {
        state = JSON.parse(savedData);
        state.draggedShipId = null;
    } else {
        const sizes = createFleetComposition();
        state.ships = sizes.map((size, index) => ({
            id: index,
            size: size,
            placed: false,
            indices: []
        }));
    }

    renderBoard();
    renderDock();
    checkGameReady();
}

function renderBoard() {
    boardEl.innerHTML = '';
    const occupiedCells = new Map();
    state.ships.filter(s => s.placed).forEach(ship => {
        ship.indices.forEach(idx => occupiedCells.set(idx, ship.id));
    });

    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;

        if (occupiedCells.has(i)) {
            cell.classList.add('ship-present');
            cell.style.cursor = 'pointer';
            cell.title = "Kliknij, aby usunąć";
            cell.addEventListener('click', () => removeShipFromBoard(occupiedCells.get(i)));
        } else {
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('dragleave', handleDragLeave);
            cell.addEventListener('drop', handleDrop);
        }

        boardEl.appendChild(cell);
    }
}

function renderDock() {
    dockEl.innerHTML = '';
    state.ships.forEach(ship => {
        if (!ship.placed) {
            const shipEl = document.createElement('div');
            shipEl.classList.add('ship-draggable');
            shipEl.draggable = true;
            shipEl.dataset.id = ship.id;
            
            const pixelWidth = ship.size * 30;
            shipEl.style.width = `${pixelWidth}px`; 
            shipEl.textContent = `${ship.size}`;

            shipEl.addEventListener('dragstart', handleDragStart);
            dockEl.appendChild(shipEl);
        }
    });
}

function handleDragStart(e) {
    state.draggedShipId = parseInt(e.target.dataset.id);
    e.dataTransfer.setData('text/plain', state.draggedShipId);
}

function handleDragOver(e) {
    e.preventDefault();
    const cell = e.target;
    const index = parseInt(cell.dataset.index);
    const ship = state.ships.find(s => s.id === state.draggedShipId);
    
    if (!ship) return;

    const isValid = validatePlacement(index, ship.size, state.isHorizontal);
    highlightCells(index, ship.size, state.isHorizontal, isValid);
}

function handleDragLeave(e) {
    clearHighlights();
}

function handleDrop(e) {
    e.preventDefault();
    clearHighlights();
    
    const cell = e.target;
    const startIndex = parseInt(cell.dataset.index);
    const ship = state.ships.find(s => s.id === state.draggedShipId);

    if (ship && validatePlacement(startIndex, ship.size, state.isHorizontal)) {
        placeShip(ship, startIndex, state.isHorizontal);
    }
}

function validatePlacement(startIndex, size, isHorizontal) {
    const x = startIndex % BOARD_SIZE;
    const y = Math.floor(startIndex / BOARD_SIZE);

    if (isHorizontal) {
        if (x + size > BOARD_SIZE) return false;
    } else {
        if (y + size > BOARD_SIZE) return false;
    }

    const targetIndices = [];
    for(let i=0; i<size; i++) {
        targetIndices.push(isHorizontal ? startIndex + i : startIndex + (i * BOARD_SIZE));
    }

    const occupiedIndices = getAllOccupiedIndices();

    for (let idx of targetIndices) {
        const tx = idx % BOARD_SIZE;
        const ty = Math.floor(idx / BOARD_SIZE);

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = tx + dx;
                const ny = ty + dy;

                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
                    const neighborIdx = ny * BOARD_SIZE + nx;
                    if (occupiedIndices.has(neighborIdx)) {
                        return false;
                    }
                }
            }
        }
    }

    return true;
}

function getAllOccupiedIndices() {
    const set = new Set();
    state.ships.filter(s => s.placed).forEach(s => {
        s.indices.forEach(idx => set.add(idx));
    });
    return set;
}

function placeShip(ship, startIndex, isHorizontal) {
    const indices = [];
    for(let i=0; i<ship.size; i++) {
        indices.push(isHorizontal ? startIndex + i : startIndex + (i * BOARD_SIZE));
    }

    ship.placed = true;
    ship.indices = indices;
    
    autoSave();
    renderBoard();
    renderDock();
    checkGameReady();
}

function removeShipFromBoard(shipId) {
    const ship = state.ships.find(s => s.id === shipId);
    if (ship) {
        ship.placed = false;
        ship.indices = [];
        autoSave();
        renderBoard();
        renderDock();
        checkGameReady();
    }
}

function highlightCells(startIndex, size, isHorizontal, isValid) {
    clearHighlights();
    const cells = boardEl.children;
    const className = isValid ? 'valid-hover' : 'invalid-hover';

    for(let i=0; i<size; i++) {
        let idx = isHorizontal ? startIndex + i : startIndex + (i * BOARD_SIZE);
        if (idx < cells.length) {
            const startY = Math.floor(startIndex / BOARD_SIZE);
            const curY = Math.floor(idx / BOARD_SIZE);
            
            if (isHorizontal && startY !== curY) break;

            cells[idx].classList.add(className);
        }
    }
}

function clearHighlights() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(c => {
        c.classList.remove('valid-hover');
        c.classList.remove('invalid-hover');
    });
}

function autoSave() {
    localStorage.setItem('battleship_setup_state', JSON.stringify(state));
}

function checkGameReady() {
    const allPlaced = state.ships.every(s => s.placed);
    startBtn.disabled = !allPlaced;
    statusEl.textContent = allPlaced ? "Gotowy do walki! Naciśnij GRAJ." : "Rozmieść wszystkie statki.";
    statusEl.style.color = allPlaced ? "#2ecc71" : "white";
}

rotateBtn.addEventListener('click', () => {
    state.isHorizontal = !state.isHorizontal;
    rotateBtn.innerText = state.isHorizontal ? "OBRÓĆ (R): POZIOMO" : "OBRÓĆ (R): PIONOWO";
});

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') rotateBtn.click();
});

startBtn.addEventListener('click', () => {
    const finalFleet = state.ships.map(s => ({
        id: s.id,
        size: s.size,
        indices: s.indices,
        hits: 0,
        sunk: false
    }));

    localStorage.setItem('battleship_player_fleet', JSON.stringify(finalFleet));
    
    localStorage.removeItem('battleship_active_game');
    
    window.location.href = 'game.html';
});

initSetup();