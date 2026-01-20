export const BOARD_SIZE = 10;

export function generateMatchFleets() {
    const fleetConfig = createFleetComposition();
    
    const cpuResult = placeFleet(fleetConfig);

    return {
        cpuFleet: cpuResult.fleet,
        cpuGrid: cpuResult.grid,
        composition: fleetConfig,
        totalCells: fleetConfig.reduce((a, b) => a + b, 0)
    };
}

export function createFleetComposition() {
    return [4, 3, 3, 2, 2, 2, 2, 1, 1, 1];
}

function placeFleet(shipSizes) {
    let placementGrid;
    let fleet;
    let success = false;
    let attempts = 0;

    while (!success && attempts < 5000) {
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
    return { grid: simpleGrid, fleet: fleet };
}

export function tryPlaceShip(grid, size, id) {
    let placementAttempts = 0;
    
    while (placementAttempts < 200) {
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