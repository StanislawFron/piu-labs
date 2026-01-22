const mainMenu = document.getElementById('main-menu');
const diffSelection = document.getElementById('difficulty-selection');

const btnPlay = document.getElementById('btn-play');
const btnBack = document.getElementById('back-to-menu-btn');
const btnStartSetup = document.getElementById('start-setup-btn');
const btnOptions = document.getElementById('btn-options');
const btnCredits = document.getElementById('btn-credits');
const btnExit = document.getElementById('btn-exit');

if (btnPlay) {
    btnPlay.addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        diffSelection.classList.remove('hidden');
    });
}

if (btnBack) {
    btnBack.addEventListener('click', () => {
        diffSelection.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    });
}

if (btnStartSetup) {
    btnStartSetup.addEventListener('click', () => {
        const diff = document.getElementById('difficulty').value;
        localStorage.setItem('battleship_difficulty', diff);
        
        localStorage.removeItem('battleship_active_game');
        
        window.location.href = 'setup.html';
    });
}

if (btnOptions) {
    btnOptions.addEventListener('click', () => {
        alert('Opcje niedostępne w tej wersji.');
    });
}

if (btnCredits) {
    btnCredits.addEventListener('click', () => {
        alert('Gra w statki z modułem AI.');
    });
}

if (btnExit) {
    btnExit.addEventListener('click', () => {
        if (confirm("Czy na pewno chcesz zamknąć kartę?")) {
            window.close();
        }
    });
}