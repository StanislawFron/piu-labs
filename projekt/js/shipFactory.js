export const BOARD_SIZE = 10;

export function generateMatchFleets() {
    const fleetConfig = createFleetComposition();
    
    const playerResult = placeFleet(fleetConfig);
    const cpuResult = placeFleet(fleetConfig);

    return {
        playerFleet: playerResult.fleet,
        playerGrid: playerResult.grid,
        cpuFleet: cpuResult.fleet,
        cpuGrid: cpuResult.grid,
        totalCells: playerResult.totalCells,
        composition: fleetConfig 
    };
}

function createFleetComposition() {
    const minCells = 20;
    const maxCells = 40;
    let currentCells = 0;
    const ships = [];

    const baseSet = [4, 3, 2, 1];
    baseSet.forEach(size => {
        ships.push(size);
        currentCells += size;
    });

    while (currentCells < maxCells) {
        const nextSize = Math.floor(Math.random() * 4) + 1;

        if (currentCells + nextSize <= maxCells) {
            ships.push(nextSize);
            currentCells += nextSize;
        } else {
            if (currentCells >= minCells) break;
        }
    }

    return ships.sort((a, b) => b - a);
}

function placeFleet(shipSizes) {
    let placementGrid;
    let fleet;
    let success = false;
    let attempts = 0;

    while (!success && attempts < 1000) {
        placementGrid = new Array(BOARD_SIZE * BOARD_SIZE).fill(null);
        fleet = [];
        let currentPlacementSuccess = true;

        for (let i = 0; i < shipSizes.length; i++) {
            const size = shipSizes[i];
            const ship = tryPlaceShip(placementGrid, size, i);
            
            if (ship) {
                fleet.push(ship);
                ship.indices.forEach(idx => placementGrid[idx] = ship.id);
            } else {
                currentPlacementSuccess = false;
                break;
            }
        }

        if (currentPlacementSuccess) {
            success = true;
        }
        attempts++;
    }

    const simpleGrid = placementGrid.map(val => (val !== null ? 1 : 0));
    const totalCells = shipSizes.reduce((a, b) => a + b, 0);

    return { grid: simpleGrid, fleet: fleet, totalCells: totalCells };
}

function tryPlaceShip(grid, size, id) {
    let placementAttempts = 0;
    
    while (placementAttempts < 50) {
        const isHorizontal = Math.random() > 0.5;
        const startIndex = Math.floor(Math.random() * grid.length);
        const indices = [];

        const xStart = startIndex % BOARD_SIZE;
        const yStart = Math.floor(startIndex / BOARD_SIZE);

        if (isHorizontal) {
            if (xStart + size > BOARD_SIZE) { placementAttempts++; continue; }
        } else {
            if (yStart + size > BOARD_SIZE) { placementAttempts++; continue; }
        }

        let collision = false;
        const xMin = Math.max(0, xStart - 1);
        const xMax = Math.min(BOARD_SIZE - 1, isHorizontal ? xStart + size : xStart + 1);
        const yMin = Math.max(0, yStart - 1);
        const yMax = Math.min(BOARD_SIZE - 1, isHorizontal ? yStart + 1 : yStart + size);

        for (let y = yMin; y <= yMax; y++) {
            for (let x = xMin; x <= xMax; x++) {
                const checkIndex = y * BOARD_SIZE + x;
                if (grid[checkIndex] !== null) {
                    collision = true;
                    break;
                }
            }
            if (collision) break;
        }

        if (collision) {
            placementAttempts++;
            continue;
        }

        for (let i = 0; i < size; i++) {
            let idx = isHorizontal ? startIndex + i : startIndex + (i * BOARD_SIZE);
            indices.push(idx);
        }

        return {
            id: id,
            indices: indices,
            hits: 0,
            size: size,
            sunk: false
        };
    }
    return null;
}