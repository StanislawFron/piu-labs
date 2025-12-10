import { store } from './store.js';

const list = document.getElementById('shapes-list');
const outSquare = document.getElementById('count-square');
const outCircle = document.getElementById('count-circle');

const render = (state) => {
    const stats = store.counts;
    outSquare.value = stats.square;
    outCircle.value = stats.circle;

    const existingElements = new Map();
    Array.from(list.children).forEach(li => {
        existingElements.set(li.dataset.id, li);
    });

    const activeIds = new Set();

    state.shapes.forEach(shape => {
        activeIds.add(shape.id);
        
        let li = existingElements.get(shape.id);

        if (!li) {
            li = document.createElement('li');
            li.dataset.id = shape.id;
            li.classList.add(shape.type);
            list.appendChild(li);
        }

        if (li.style.backgroundColor !== shape.color) {
            li.style.backgroundColor = shape.color;
        }
    });

    existingElements.forEach((li, id) => {
        if (!activeIds.has(id)) {
            li.remove();
        }
    });
};

export const initUI = () => {
    store.subscribe(render);

    list.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (li && list.contains(li)) {
            store.removeShape(li.dataset.id);
        }
    });

    document.getElementById('add-square').addEventListener('click', () => store.addShape('square'));
    document.getElementById('add-circle').addEventListener('click', () => store.addShape('circle'));
    
    document.getElementById('recolor-squares').addEventListener('click', () => store.recolor('square'));
    document.getElementById('recolor-circles').addEventListener('click', () => store.recolor('circle'));

    render({ shapes: store.shapes });
};