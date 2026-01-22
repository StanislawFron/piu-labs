import Observer from './observer.js';
import { BOARD_SIZE } from './shipFactory.js';

export class BoardState extends Observer {
    constructor(id) {
        super();
        this.id = id;
        this.grid = new Array(BOARD_SIZE * BOARD_SIZE).fill(null);
        this.ships = [];
        this.totalHP = 0;
        this.isLocked = false;
    }

    loadFleet(fleetData) {
        this.grid.fill(null);
        this.ships = fleetData;
        this.totalHP = 0;

        this.ships.forEach(ship => {
            this.totalHP += ship.size;
            ship.hits = 0;
            ship.sunk = false;
            ship.indices.forEach(index => {
                this.grid[index] = { type: 'ship', shipId: ship.id };
            });
        });

        this.notify({ type: 'INIT_BOARD', grid: this.grid, ships: this.ships });
    }

    restoreState(savedGrid, savedShips) {
        this.grid = savedGrid;
        this.ships = savedShips;
        this.totalHP = 0;

        this.ships.forEach(ship => {
            if (!ship.sunk) {
                this.totalHP += (ship.size - ship.hits);
            }
        });

        this.notify({ type: 'INIT_BOARD', grid: this.grid, ships: this.ships });
    }

    receiveAttack(index) {
        if (index < 0 || index >= this.grid.length) return { result: 'invalid' };
        
        const cell = this.grid[index];

        if (cell && (cell.type === 'hit' || cell.type === 'miss' || cell.type === 'sunk')) {
            return { result: 'already_shot' };
        }

        if (cell && cell.type === 'ship') {
            const ship = this.ships.find(s => s.id === cell.shipId);
            ship.hits++;
            this.totalHP--;
            
            this.grid[index] = { type: 'hit', shipId: ship.id };

            let isSunk = false;
            if (ship.hits >= ship.size) {
                ship.sunk = true;
                isSunk = true;
                this.markShipAsSunk(ship);
            } else {
                this.notify({ type: 'UPDATE_CELL', index, status: 'hit' });
            }

            return { result: 'hit', ship: ship, isSunk: isSunk };
        } else {
            this.grid[index] = { type: 'miss' };
            this.notify({ type: 'UPDATE_CELL', index, status: 'miss' });
            return { result: 'miss' };
        }
    }

    markShipAsSunk(ship) {
        ship.indices.forEach(index => {
            this.grid[index] = { type: 'sunk', shipId: ship.id };
            this.notify({ type: 'UPDATE_CELL', index, status: 'sunk' });
        });
    }

    setLocked(locked) {
        this.isLocked = locked;
        this.notify({ type: 'LOCK_STATE', locked });
    }

    isDefeated() {
        return this.totalHP <= 0;
    }
}