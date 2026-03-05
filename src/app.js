import { advanceState, createInitialState } from "./gameLogic.js";

const GRID_SIZE = 20;
const TICK_MS = 140;
const MAX_DIRECTION_QUEUE = 2;

const board = document.querySelector("[data-board]");
const scoreEl = document.querySelector("[data-score]");
const statusEl = document.querySelector("[data-status]");
const restartButton = document.querySelector("[data-action='restart']");
const pauseButton = document.querySelector("[data-action='pause']");
const controlButtons = document.querySelectorAll("[data-direction]");

let directionQueue = [];
let state = createInitialState({ width: GRID_SIZE, height: GRID_SIZE });
const cells = [];

function setStatusText() {
  if (state.status === "gameover") {
    statusEl.textContent = "Game Over";
  } else if (state.status === "paused") {
    statusEl.textContent = "Paused";
  } else {
    statusEl.textContent = "Running";
  }
}

function togglePause() {
  if (state.status === "gameover") return;

  state = {
    ...state,
    status: state.status === "paused" ? "running" : "paused"
  };

  pauseButton.textContent = state.status === "paused" ? "Resume" : "Pause";
  setStatusText();
}

function restart() {
  state = createInitialState({ width: GRID_SIZE, height: GRID_SIZE });
  directionQueue = [];
  pauseButton.textContent = "Pause";
  pauseButton.disabled = false;
  render();
}

function queueDirection(direction) {
  if (!direction || state.status === "gameover") return;

  const lastQueued = directionQueue[directionQueue.length - 1];
  const baseDirection = lastQueued || state.direction;

  if (direction === baseDirection) return;
  if (directionQueue.length >= MAX_DIRECTION_QUEUE) return;

  directionQueue.push(direction);
}

function tick() {
  if (state.status === "paused") {
    return;
  }

  const nextDirection = directionQueue.shift() || null;
  state = advanceState(state, nextDirection);

  if (state.status === "gameover") {
    pauseButton.disabled = true;
  }

  render();
}

function setupBoard() {
  board.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
  const totalCells = GRID_SIZE * GRID_SIZE;

  for (let i = 0; i < totalCells; i += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    board.appendChild(cell);
    cells.push(cell);
  }
}

function clearBoardClasses() {
  for (const cell of cells) {
    cell.classList.remove("snake", "food", "head");
  }
}

function render() {
  scoreEl.textContent = String(state.score);
  setStatusText();
  board.setAttribute("data-state", state.status);

  clearBoardClasses();

  for (let i = 0; i < state.snake.length; i += 1) {
    const part = state.snake[i];
    const index = part.y * state.width + part.x;
    const cell = cells[index];
    if (cell) {
      cell.classList.add("snake");
      if (i === 0) {
        cell.classList.add("head");
      }
    }
  }

  if (state.food) {
    const foodIndex = state.food.y * state.width + state.food.x;
    const foodCell = cells[foodIndex];
    if (foodCell) {
      foodCell.classList.add("food");
    }
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " ", "r"].includes(key)) {
    event.preventDefault();
  }

  if (key === " ") {
    togglePause();
    return;
  }

  if (key === "r") {
    restart();
    return;
  }

  const directionByKey = {
    arrowup: "up",
    w: "up",
    arrowdown: "down",
    s: "down",
    arrowleft: "left",
    a: "left",
    arrowright: "right",
    d: "right"
  };

  queueDirection(directionByKey[key]);
});

for (const button of controlButtons) {
  button.addEventListener("click", () => {
    queueDirection(button.getAttribute("data-direction"));
  });
}

restartButton.addEventListener("click", restart);
pauseButton.addEventListener("click", togglePause);

setupBoard();
render();
setInterval(tick, TICK_MS);