// DOM Elements
const board = document.getElementById('gameBoard');
const statusMessage = document.getElementById('statusMessage');
const resetButton = document.getElementById('resetButton');
const undoButton = document.getElementById('undoButton');
const darkModeToggle = document.getElementById('darkModeToggle');
const helpButton = document.getElementById('helpButton');
const helpModal = document.getElementById('helpModal');
const closeHelpModal = document.querySelector('.close');
const difficultySelect = document.getElementById('difficultySelect');
const playerWinsDisplay = document.getElementById('playerWins');
const aiWinsDisplay = document.getElementById('aiWins');
const drawsDisplay = document.getElementById('draws');
const playerStreakDisplay = document.getElementById('playerStreak');
const aiStreakDisplay = document.getElementById('aiStreak');
const timerDisplay = document.getElementById('timeLeft');
const startGameButton = document.getElementById('startGameButton');
const multiplayerToggle = document.getElementById('multiplayerToggle');

// Theme Buttons
const defaultThemeButton = document.getElementById('defaultTheme');
const darkThemeButton = document.getElementById('darkTheme');
const oceanThemeButton = document.getElementById('oceanTheme');
const forestThemeButton = document.getElementById('forestTheme');

// Audio Elements
const moveSound = document.getElementById('moveSound');
const winSound = document.getElementById('winSound');
const drawSound = document.getElementById('drawSound');

// Game State
let gameState = Array(9).fill('');
let currentPlayer = 'X';
let isGameActive = false;
let history = [];
let stats = {
  playerWins: 0,
  aiWins: 0,
  draws: 0,
  streaks: { player: 0, ai: 0 },
};
let timer = 10;
let interval = null;
let isFirstMove = true;

// Winning Conditions
const winningConditions = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// Initialize Game
function initGame() {
  createBoard();
  resetGame();
}

// Create Board
function createBoard() {
  board.innerHTML = '';
  gameState.fill('');
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.dataset.player = '';
    cell.addEventListener('click', handleCellClick);
    board.appendChild(cell);
  }
}

// Handle Cell Click
function handleCellClick(event) {
  if (!isGameActive) return;

  const index = event.target.dataset.index;
  if (gameState[index] !== '') return;

  if (isFirstMove) {
    isFirstMove = false;
  }

  updateGameState(index);
  checkForWinner();
  resetTimer();

  if (isGameActive && !multiplayerToggle.checked && currentPlayer === 'O') {
    stopTimer();
    setTimeout(() => {
      aiMove();
      if (isGameActive) {
        startTimer();
      }
    }, 500);
  }
}

// Update Game State
function updateGameState(index) {
  gameState[index] = currentPlayer;
  const cell = document.querySelector(`.cell[data-index='${index}']`);
  cell.textContent = currentPlayer;
  cell.dataset.player = currentPlayer;
  history.push(index);
  moveSound.play();
}

// Check for Winner
function checkForWinner() {
  for (const condition of winningConditions) {
    const [a, b, c] = condition;
    if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
      statusMessage.textContent = `${currentPlayer} wins!`;
      isGameActive = false;
      updateScore(currentPlayer);
      stopTimer();
      winSound.play();

      // Highlight winning cells
      document.querySelector(`.cell[data-index='${a}']`).classList.add('winning-cell');
      document.querySelector(`.cell[data-index='${b}']`).classList.add('winning-cell');
      document.querySelector(`.cell[data-index='${c}']`).classList.add('winning-cell');
      return;
    }
  }

  if (!gameState.includes('')) {
    statusMessage.textContent = "It's a draw!";
    isGameActive = false;
    updateScore('draw');
    stopTimer();
    drawSound.play();
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusMessage.textContent = `${currentPlayer}'s turn`;
  }
}

// AI Move
function aiMove() {
  if (!isGameActive) return;

  let bestMove;

  switch (difficultySelect.value) {
    case 'easy':
      bestMove = getRandomMove();
      break;
    case 'medium':
      if (Math.random() < 0.5) {
        bestMove = getBestMove();
      } else {
        bestMove = getRandomMove();
      }
      break;
    case 'hard':
      bestMove = getBestMove();
      break;
  }

  updateGameState(bestMove);
  checkForWinner();
}

// Get Random Move
function getRandomMove() {
  let available = gameState.map((val, idx) => (val === '' ? idx : null)).filter(val => val !== null);
  return available[Math.floor(Math.random() * available.length)];
}

// Get Best Move using Minimax Algorithm
function getBestMove() {
  let bestMove = -1;
  let bestScore = -Infinity;

  let available = gameState.map((val, idx) => (val === '' ? idx : null)).filter(val => val !== null);

  for (let move of available) {
    gameState[move] = 'O';
    let score = minimax(gameState, 0, false);
    gameState[move] = '';

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// Minimax Algorithm
function minimax(board, depth, isMaximizingPlayer) {
  let winner = checkWinner(board);

  if (winner === 'O') return 1;
  if (winner === 'X') return -1;
  if (board.every(cell => cell !== '')) return 0;

  if (isMaximizingPlayer) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        best = Math.max(best, minimax(board, depth + 1, false));
        board[i] = '';
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'X';
        best = Math.min(best, minimax(board, depth + 1, true));
        board[i] = '';
      }
    }
    return best;
  }
}

// Check Winner
function checkWinner(board) {
  for (const condition of winningConditions) {
    const [a, b, c] = condition;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

// Update Score
function updateScore(result) {
  if (result === 'X') {
    stats.playerWins++;
    stats.streaks.player++;
    stats.streaks.ai = 0;
  } else if (result === 'O') {
    stats.aiWins++;
    stats.streaks.ai++;
    stats.streaks.player = 0;
  } else {
    stats.draws++;
  }
  playerWinsDisplay.textContent = stats.playerWins;
  aiWinsDisplay.textContent = stats.aiWins;
  drawsDisplay.textContent = stats.draws;
  playerStreakDisplay.textContent = stats.streaks.player;
  aiStreakDisplay.textContent = stats.streaks.ai;
}

// Reset Game
function resetGame() {
  stopTimer();
  gameState.fill('');
  currentPlayer = 'X';
  isGameActive = false;
  isFirstMove = true;
  document.querySelectorAll('.cell').forEach(cell => {
    cell.textContent = '';
    cell.dataset.player = '';
    cell.classList.remove('winning-cell');
  });
  statusMessage.textContent = "Click 'Start Game' to begin!";
  history = [];
  difficultySelect.disabled = false;
  startGameButton.disabled = false;
}

// Start Game
function startGame() {
  resetGame();
  isGameActive = true;
  startTimer();
  statusMessage.textContent = "Your turn!";
  startGameButton.disabled = true;
  difficultySelect.disabled = true;
}

// Undo Move
function undoMove() {
  if (history.length === 0 || !isGameActive) return;
  let lastMove = history.pop();
  gameState[lastMove] = '';
  const cell = document.querySelector(`.cell[data-index='${lastMove}']`);
  cell.textContent = '';
  cell.dataset.player = '';
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
}

// Start Timer
function startTimer() {
  stopTimer();
  timer = 10;
  timerDisplay.textContent = timer;
  interval = setInterval(() => {
    if (!isGameActive) {
      stopTimer();
      return;
    }

    timer--;
    timerDisplay.textContent = timer;

    if (timer <= 0) {
      stopTimer();
      isGameActive = false;
      statusMessage.textContent = `${currentPlayer} ran out of time!`;
      updateScore(currentPlayer === 'X' ? 'O' : 'X');
    }
  }, 1000);
}

// Reset Timer
function resetTimer() {
  stopTimer();
  startTimer();
}

// Stop Timer
function stopTimer() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

// Set Theme Function
function setTheme(theme) {
  document.body.className = theme;
  localStorage.setItem('theme', theme);
}

// Event Listeners for Theme Buttons
defaultThemeButton.addEventListener('click', () => setTheme('default'));
darkThemeButton.addEventListener('click', () => setTheme('dark'));
oceanThemeButton.addEventListener('click', () => setTheme('ocean'));
forestThemeButton.addEventListener('click', () => setTheme('forest'));

// Help Modal
helpButton.addEventListener('click', () => (helpModal.style.display = 'block'));
closeHelpModal.addEventListener('click', () => (helpModal.style.display = 'none'));

// Event Listeners
resetButton.addEventListener('click', resetGame);
undoButton.addEventListener('click', undoMove);
startGameButton.addEventListener('click', startGame);

// Keyboard Controls
document.addEventListener('keydown', (event) => {
  if (!isGameActive) return;

  const key = event.key;
  if (key >= 1 && key <= 9) {
    const index = key - 1;
    if (gameState[index] === '') {
      handleCellClick({ target: document.querySelector(`.cell[data-index='${index}']`) });
    }
  }
});

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'default';
setTheme(savedTheme);

// Initialize Game
initGame();