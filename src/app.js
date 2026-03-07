import { advanceState, createInitialState } from "./gameLogic.js";

const GRID_SIZE = 20;
const TICK_MS = 140;
const MAX_DIRECTION_QUEUE = 2;

const PALETTE = {
  board: "#090d12",
  grid: "#161d27",
  snakeShadow: "#0f3b2c",
  snakeBody: "#1f7a55",
  snakeHighlight: "rgba(122, 242, 184, 0.55)",
  head: "#2ea674",
  eye: "#eef4f8",
  pupil: "#111820",
  tongue: "#e84364",
  foodA: "#ff7b97",
  foodB: "#e63956",
  stem: "#5fbf4a"
};

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

function normalizeVector(vec) {
  const length = Math.hypot(vec.x, vec.y) || 1;
  return { x: vec.x / length, y: vec.y / length };
}

function drawGrid() {
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 0, drawSize, drawSize);

  ctx.strokeStyle = PALETTE.grid;
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
  const r = cellSize * 0.25;

  const grad = ctx.createRadialGradient(c.x - r * 0.45, c.y - r * 0.5, r * 0.2, c.x, c.y, r);
  grad.addColorStop(0, PALETTE.foodA);
  grad.addColorStop(1, PALETTE.foodB);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = PALETTE.stem;
  ctx.lineWidth = Math.max(2, cellSize * 0.08);
  ctx.beginPath();
  ctx.moveTo(c.x, c.y - r);
  ctx.lineTo(c.x + cellSize * 0.08, c.y - r - cellSize * 0.16);
  ctx.stroke();
}

function drawSnake(snake) {
  if (snake.length === 0) return;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = PALETTE.snakeShadow;
  ctx.lineWidth = cellSize * 0.74;
  ctx.beginPath();
  snake.forEach((part, i) => {
    const c = getCenter(part);
    if (i === 0) ctx.moveTo(c.x, c.y);
    else ctx.lineTo(c.x, c.y);
  });
  ctx.stroke();

  ctx.strokeStyle = PALETTE.snakeBody;
  ctx.lineWidth = cellSize * 0.62;
  ctx.beginPath();
  snake.forEach((part, i) => {
    const c = getCenter(part);
    if (i === 0) ctx.moveTo(c.x, c.y);
    else ctx.lineTo(c.x, c.y);
  });
  ctx.stroke();

  ctx.strokeStyle = PALETTE.snakeHighlight;
  ctx.lineWidth = cellSize * 0.18;
  ctx.beginPath();
  snake.forEach((part, i) => {
    const c = getCenter(part);
    if (i === 0) ctx.moveTo(c.x, c.y);
    else ctx.lineTo(c.x, c.y);
  });
  ctx.stroke();

  drawScalePattern(snake);
  drawSnakeHeadFeatures(snake[0], state.direction);
}

function drawScalePattern(snake) {
  for (let i = 1; i < snake.length - 1; i += 1) {
    const current = getCenter(snake[i]);
    const prev = getCenter(snake[i - 1]);
    const next = getCenter(snake[i + 1]);

    const dir = normalizeVector({ x: prev.x - next.x, y: prev.y - next.y });
    const normal = { x: -dir.y, y: dir.x };

    const offset = cellSize * 0.12;
    const r = cellSize * 0.05;

    ctx.fillStyle = "rgba(11, 36, 27, 0.55)";
    ctx.beginPath();
    ctx.arc(current.x + normal.x * offset, current.y + normal.y * offset, r, 0, Math.PI * 2);
    ctx.arc(current.x - normal.x * offset, current.y - normal.y * offset, r, 0, Math.PI * 2);
    ctx.fill();
  }
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

  const headRadius = cellSize * 0.34;
  const headGrad = ctx.createRadialGradient(c.x - headRadius * 0.45, c.y - headRadius * 0.5, headRadius * 0.2, c.x, c.y, headRadius);
  headGrad.addColorStop(0, "#46c68b");
  headGrad.addColorStop(1, PALETTE.head);

  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(c.x, c.y, headRadius, 0, Math.PI * 2);
  ctx.fill();

  const eyeDistance = cellSize * 0.11;
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

  ctx.fillStyle = PALETTE.eye;
  ctx.beginPath();
  ctx.arc(eyeA.x, eyeA.y, eyeRadius, 0, Math.PI * 2);
  ctx.arc(eyeB.x, eyeB.y, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  const pupilLength = cellSize * 0.04;
  ctx.strokeStyle = PALETTE.pupil;
  ctx.lineWidth = Math.max(1.5, cellSize * 0.02);
  ctx.beginPath();
  ctx.moveTo(eyeA.x, eyeA.y - pupilLength);
  ctx.lineTo(eyeA.x, eyeA.y + pupilLength);
  ctx.moveTo(eyeB.x, eyeB.y - pupilLength);
  ctx.lineTo(eyeB.x, eyeB.y + pupilLength);
  ctx.stroke();

  const mouth = {
    x: c.x + fwd.x * cellSize * 0.3,
    y: c.y + fwd.y * cellSize * 0.3
  };

  ctx.strokeStyle = PALETTE.tongue;
  ctx.lineWidth = Math.max(1.5, cellSize * 0.03);
  ctx.beginPath();
  ctx.moveTo(mouth.x, mouth.y);
  ctx.lineTo(mouth.x + fwd.x * cellSize * 0.14 + side.x * cellSize * 0.06, mouth.y + fwd.y * cellSize * 0.14 + side.y * cellSize * 0.06);
  ctx.moveTo(mouth.x, mouth.y);
  ctx.lineTo(mouth.x + fwd.x * cellSize * 0.14 - side.x * cellSize * 0.06, mouth.y + fwd.y * cellSize * 0.14 - side.y * cellSize * 0.06);
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