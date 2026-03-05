import { advanceState, createInitialState } from "./gameLogic.js";

const GRID_SIZE = 20;
const TICK_MS = 140;

const board = document.querySelector("[data-board]");
const scoreEl = document.querySelector("[data-score]");
const statusEl = document.querySelector("[data-status]");
const restartButton = document.querySelector("[data-action='restart']");
const pauseButton = document.querySelector("[data-action='pause']");
const controlButtons = document.querySelectorAll("[data-direction]");

let pendingDirection = null;
let state = createInitialState({ width: GRID_SIZE, height: GRID_SIZE });

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
  pendingDirection = null;
  pauseButton.textContent = "Pause";
  render();
}

function setDirection(direction) {
  pendingDirection = direction;
}

function tick() {
  if (state.status === "paused") {
    return;
  }
  state = advanceState(state, pendingDirection);
  pendingDirection = null;
  render();
}

function render() {
  scoreEl.textContent = String(state.score);
  setStatusText();

  board.innerHTML = "";
  const cells = state.width * state.height;

  for (let i = 0; i < cells; i += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    board.appendChild(cell);
  }

  for (const part of state.snake) {
    const index = part.y * state.width + part.x;
    const cell = board.children[index];
    if (cell) {
      cell.classList.add("snake");
    }
  }

  if (state.food) {
    const foodIndex = state.food.y * state.width + state.food.x;
    const foodCell = board.children[foodIndex];
    if (foodCell) {
      foodCell.classList.add("food");
    }
  }
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(key)) {
    event.preventDefault();
  }

  if (key === " ") {
    togglePause();
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

  const direction = directionByKey[key];
  if (direction) {
    setDirection(direction);
  }
});

for (const button of controlButtons) {
  button.addEventListener("click", () => {
    const direction = button.getAttribute("data-direction");
    setDirection(direction);
  });
}

restartButton.addEventListener("click", restart);
pauseButton.addEventListener("click", togglePause);

render();
setInterval(tick, TICK_MS);