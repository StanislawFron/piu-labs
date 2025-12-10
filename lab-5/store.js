import { generateId, getRandomColor } from './helpers.js';

class Store {
    constructor() {
        this.observers = [];
        this.state = {
            shapes: []
        };
        this.init();
    }

    init() {
        const saved = localStorage.getItem('shapes-app');
        if (saved) {
            try {
                this.state = JSON.parse(saved);
            } catch (e) {
                console.error(e);
            }
        }
    }

    subscribe(fn) {
        this.observers.push(fn);
    }

    notify() {
        this.observers.forEach(fn => fn(this.state));
        localStorage.setItem('shapes-app', JSON.stringify(this.state));
    }

    get shapes() {
        return this.state.shapes;
    }

    get counts() {
        return this.state.shapes.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, { square: 0, circle: 0 });
    }

    addShape(type) {
        this.state.shapes.push({
            id: generateId(),
            type,
            color: getRandomColor()
        });
        this.notify();
    }

    removeShape(id) {
        this.state.shapes = this.state.shapes.filter(s => s.id !== id);
        this.notify();
    }

    recolor(typeToRecolor) {
        this.state.shapes.forEach(shape => {
            if (shape.type === typeToRecolor) {
                shape.color = getRandomColor();
            }
        });
        this.notify();
    }
}

export const store = new Store();