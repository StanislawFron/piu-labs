const COLUMN_IDS = ['todo', 'inprogress', 'done'];
let kanbanState = { todo: [], inprogress: [], done: [] };

const generateUniqueId = () => '_' + Math.random().toString(36).substr(2, 9);
const generateRandomPastelColor = () => `hsl(${Math.floor(Math.random() * 360)}, 80%, 90%)`;

const saveStateToLocalStorage = () => {
    localStorage.setItem('kanbanData', JSON.stringify(kanbanState));
    COLUMN_IDS.forEach(columnId => {
        const counterElement = document.querySelector(`#${columnId} small`);
        if (counterElement) counterElement.innerText = `(${kanbanState[columnId].length})`;
    });
};

const renderBoard = () => {
    COLUMN_IDS.forEach(columnId => {
        const tasksContainer = document.querySelector(`#${columnId} > div`);
        tasksContainer.innerHTML = '';
        kanbanState[columnId].forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.dataset.taskId = task.id;
            taskElement.style.backgroundColor = task.color;
            taskElement.innerHTML = `
                        <p contenteditable="true">${task.content}</p>
                        <footer>
                            <button data-action="movePrevious">←</button>
                            <span>
                                <button data-action="randomizeColor">Losuj kolor</button>
                                <button data-action="deleteTask" style="color:red">Usuń</button>
                            </span>
                            <button data-action="moveNext">→</button>
                        </footer>
                    `;
            tasksContainer.appendChild(taskElement);
        });
    });
    saveStateToLocalStorage();
};

const boardActions = {
    addNewTask: (columnId) => {
        kanbanState[columnId].push({ id: generateUniqueId(), content: 'Zadanie...', color: generateRandomPastelColor() });
        renderBoard();
    },
    deleteTask: (columnId, taskId) => {
        if (confirm('Usunąć?')) {
            kanbanState[columnId] = kanbanState[columnId].filter(task => task.id !== taskId);
            renderBoard();
        }
    },
    movePrevious: (columnId, taskId) => moveTaskBetweenColumns(columnId, taskId, -1),
    moveNext: (columnId, taskId) => moveTaskBetweenColumns(columnId, taskId, 1),
    randomizeColor: (columnId, taskId) => {
        const task = kanbanState[columnId].find(t => t.id === taskId);
        if (task) { task.color = generateRandomPastelColor(); renderBoard(); }
    },
    randomizeColumnColors: (columnId) => {
        kanbanState[columnId].forEach(task => task.color = generateRandomPastelColor());
        renderBoard();
    },
    sortColumnAlphabetically: (columnId) => {
        kanbanState[columnId].sort((a, b) => a.content.localeCompare(b.content));
        renderBoard();
    }
};

const moveTaskBetweenColumns = (currentColumnId, taskId, directionOffset) => {
    const currentColumnIndex = COLUMN_IDS.indexOf(currentColumnId);
    const targetColumnIndex = currentColumnIndex + directionOffset;
    if (targetColumnIndex >= 0 && targetColumnIndex < COLUMN_IDS.length) {
        const taskIndex = kanbanState[currentColumnId].findIndex(t => t.id === taskId);
        const [taskToMove] = kanbanState[currentColumnId].splice(taskIndex, 1);
        kanbanState[COLUMN_IDS[targetColumnIndex]].push(taskToMove);
        renderBoard();
    }
};

document.querySelector('main').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;

    const actionType = button.dataset.action;
    const columnElement = button.closest('section');
    const columnId = columnElement.id;

    const taskElement = button.closest('div');
    const taskId = (taskElement && taskElement.dataset.taskId) ? taskElement.dataset.taskId : null;

    if (boardActions[actionType]) boardActions[actionType](columnId, taskId);
    
});

document.querySelector('main').addEventListener('input', event => {
    if (event.target.tagName === 'P') {
        const taskCard = event.target.closest('div');
        const columnSection = taskCard.closest('section');
        const task = kanbanState[columnSection.id].find(t => t.id === taskCard.dataset.taskId);
        if (task) {
            task.content = event.target.innerText;
            localStorage.setItem('kanbanData', JSON.stringify(kanbanState));
        }
    }
});

const storedKanbanData = localStorage.getItem('kanbanData');
if (storedKanbanData) kanbanState = JSON.parse(storedKanbanData);
renderBoard();