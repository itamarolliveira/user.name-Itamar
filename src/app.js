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
let canvas;
let ctx;
let cellSize = 0;
let drawSize = 0;
let dpr = 1;

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

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  drawSize = Math.max(240, Math.floor(board.clientWidth));
  cellSize = drawSize / GRID_SIZE;

  canvas.width = Math.floor(drawSize * dpr);
  canvas.height = Math.floor(drawSize * dpr);
  canvas.style.width = `${drawSize}px`;
  canvas.style.height = `${drawSize}px`;

  render();
}

function setupBoard() {
  canvas = document.createElement("canvas");
  canvas.className = "board-canvas";
  board.replaceChildren(canvas);
  ctx = canvas.getContext("2d");

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

function getCenter(point) {
  return {
    x: point.x * cellSize + cellSize / 2,
    y: point.y * cellSize + cellSize / 2
  };
}

function drawGrid() {
  ctx.fillStyle = "#f9fcff";
  ctx.fillRect(0, 0, drawSize, drawSize);

  ctx.strokeStyle = "#e2edf7";
  ctx.lineWidth = 1;

  for (let i = 1; i < GRID_SIZE; i += 1) {
    const p = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, drawSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(drawSize, p);
    ctx.stroke();
  }
}

function drawFood(food) {
  if (!food) return;

  const c = getCenter(food);
  const r = cellSize * 0.26;

  const grad = ctx.createRadialGradient(c.x - r * 0.4, c.y - r * 0.5, r * 0.2, c.x, c.y, r);
  grad.addColorStop(0, "#ff95ad");
  grad.addColorStop(1, "#ef476f");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2f9e44";
  ctx.lineWidth = Math.max(2, cellSize * 0.08);
  ctx.beginPath();
  ctx.moveTo(c.x, c.y - r - cellSize * 0.02);
  ctx.lineTo(c.x + cellSize * 0.08, c.y - r - cellSize * 0.14);
  ctx.stroke();
}

function drawSnake(snake) {
  if (snake.length === 0) return;

  ctx.strokeStyle = "#2a9d8f";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = cellSize * 0.62;
  ctx.beginPath();

  snake.forEach((part, i) => {
    const c = getCenter(part);
    if (i === 0) {
      ctx.moveTo(c.x, c.y);
    } else {
      ctx.lineTo(c.x, c.y);
    }
  });

  ctx.stroke();

  snake.forEach((part, i) => {
    const c = getCenter(part);
    const isHead = i === 0;
    const isTail = i === snake.length - 1;

    let radius = cellSize * 0.3;
    if (isHead) radius = cellSize * 0.34;
    if (isTail) radius = cellSize * 0.22;

    const grad = ctx.createRadialGradient(c.x - radius * 0.5, c.y - radius * 0.5, radius * 0.3, c.x, c.y, radius);
    grad.addColorStop(0, isHead ? "#3eb8ac" : "#4dc5b9");
    grad.addColorStop(1, isHead ? "#1d6f66" : "#2a9d8f");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  drawSnakeHeadFeatures(snake[0], state.direction);
}

function drawSnakeHeadFeatures(head, direction) {
  const c = getCenter(head);

  const vectors = {
    up: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }
  };

  const fwd = vectors[direction] || vectors.right;
  const side = { x: -fwd.y, y: fwd.x };

  const eyeDistance = cellSize * 0.1;
  const eyeForward = cellSize * 0.14;
  const eyeRadius = Math.max(2, cellSize * 0.055);

  const eyeA = {
    x: c.x + fwd.x * eyeForward + side.x * eyeDistance,
    y: c.y + fwd.y * eyeForward + side.y * eyeDistance
  };

  const eyeB = {
    x: c.x + fwd.x * eyeForward - side.x * eyeDistance,
    y: c.y + fwd.y * eyeForward - side.y * eyeDistance
  };

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(eyeA.x, eyeA.y, eyeRadius, 0, Math.PI * 2);
  ctx.arc(eyeB.x, eyeB.y, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  const pupilForward = cellSize * 0.02;
  const pupilRadius = Math.max(1, cellSize * 0.025);

  ctx.fillStyle = "#203040";
  ctx.beginPath();
  ctx.arc(eyeA.x + fwd.x * pupilForward, eyeA.y + fwd.y * pupilForward, pupilRadius, 0, Math.PI * 2);
  ctx.arc(eyeB.x + fwd.x * pupilForward, eyeB.y + fwd.y * pupilForward, pupilRadius, 0, Math.PI * 2);
  ctx.fill();

  const mouth = {
    x: c.x + fwd.x * cellSize * 0.26,
    y: c.y + fwd.y * cellSize * 0.26
  };

  ctx.strokeStyle = "#ef476f";
  ctx.lineWidth = Math.max(1.5, cellSize * 0.035);
  ctx.beginPath();
  ctx.moveTo(mouth.x, mouth.y);
  ctx.lineTo(mouth.x + fwd.x * cellSize * 0.12 + side.x * cellSize * 0.04, mouth.y + fwd.y * cellSize * 0.12 + side.y * cellSize * 0.04);
  ctx.moveTo(mouth.x, mouth.y);
  ctx.lineTo(mouth.x + fwd.x * cellSize * 0.12 - side.x * cellSize * 0.04, mouth.y + fwd.y * cellSize * 0.12 - side.y * cellSize * 0.04);
  ctx.stroke();
}

function render() {
  if (!ctx) return;

  scoreEl.textContent = String(state.score);
  setStatusText();
  board.setAttribute("data-state", state.status);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  drawGrid();
  drawFood(state.food);
  drawSnake(state.snake);
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