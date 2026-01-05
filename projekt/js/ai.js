import { BOARD_SIZE } from './shipFactory.js';

export class AI {
    constructor(difficulty) {
        this.difficulty = difficulty;
        this.shotsFired = new Set();
        this.hitStack = [];
    }

    makeMove(gridToShootAt) {
        let index;
        
        if (this.difficulty === 'hard' && this.hitStack.length > 0) {
            index = this.getSmartNeighbor();
        } 
        
        if (index === undefined || index === null) {
            index = this.getRandomMove();
        }

        this.shotsFired.add(index);
        return index;
    }

    getRandomMove() {
        let index;
        let attempts = 0;
        do {
            index = Math.floor(Math.random() * (BOARD_SIZE * BOARD_SIZE));
            attempts++;
        } while (
            this.difficulty !== 'easy' && 
            this.shotsFired.has(index) && 
            attempts < 500
        );
        
        if (this.shotsFired.has(index)) {
             for(let i=0; i<100; i++) if(!this.shotsFired.has(i)) return i;
        }
        return index;
    }

    getSmartNeighbor() {
        const offsets = [-1, 1, -BOARD_SIZE, BOARD_SIZE];
        const baseIndex = this.hitStack[this.hitStack.length - 1];

        for (let offset of offsets) {
            const target = baseIndex + offset;
            
            const baseX = baseIndex % BOARD_SIZE;
            const targetX = target % BOARD_SIZE;
            
            if (Math.abs(offset) === 1 && Math.abs(baseX - targetX) !== 1) continue; 
            
            if (target >= 0 && target < BOARD_SIZE * BOARD_SIZE && !this.shotsFired.has(target)) {
                return target;
            }
        }
        
        this.hitStack.pop();
        if (this.hitStack.length > 0) return this.getSmartNeighbor();
        return null;
    }

    reportResult(index, isHit) {
        if (isHit && this.difficulty === 'hard') {
            this.hitStack.push(index);
        }
    }
}