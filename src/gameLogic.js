export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export function createInitialState(config = {}, rng = Math.random) {
  const width = config.width ?? 20;
  const height = config.height ?? 20;
  const start = config.start ?? { x: Math.floor(width / 2), y: Math.floor(height / 2) };

  const snake = [
    start,
    { x: start.x - 1, y: start.y },
    { x: start.x - 2, y: start.y }
  ];

  const food = placeFood(snake, width, height, rng);

  return {
    width,
    height,
    snake,
    direction: "right",
    food,
    score: 0,
    status: "running"
  };
}

export function isOppositeDirection(current, next) {
  return (
    (current === "up" && next === "down") ||
    (current === "down" && next === "up") ||
    (current === "left" && next === "right") ||
    (current === "right" && next === "left")
  );
}

export function applyDirection(currentDirection, requestedDirection) {
  if (!requestedDirection) return currentDirection;
  if (!DIRECTIONS[requestedDirection]) return currentDirection;
  if (isOppositeDirection(currentDirection, requestedDirection)) return currentDirection;
  return requestedDirection;
}

export function placeFood(snake, width, height, rng = Math.random) {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const freeCells = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  const index = Math.floor(rng() * freeCells.length);
  return freeCells[index];
}

export function advanceState(state, requestedDirection, rng = Math.random) {
  if (state.status !== "running") {
    return state;
  }

  const direction = applyDirection(state.direction, requestedDirection);
  const delta = DIRECTIONS[direction];
  const head = state.snake[0];
  const nextHead = { x: head.x + delta.x, y: head.y + delta.y };

  if (nextHead.x < 0 || nextHead.x >= state.width || nextHead.y < 0 || nextHead.y >= state.height) {
    return { ...state, direction, status: "gameover" };
  }

  const isEating = state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;
  const bodyToCheck = isEating ? state.snake : state.snake.slice(0, -1);
  const hitsBody = bodyToCheck.some((part) => part.x === nextHead.x && part.y === nextHead.y);

  if (hitsBody) {
    return { ...state, direction, status: "gameover" };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!isEating) {
    nextSnake.pop();
  }

  const nextScore = isEating ? state.score + 1 : state.score;
  const nextFood = isEating ? placeFood(nextSnake, state.width, state.height, rng) : state.food;

  return {
    ...state,
    snake: nextSnake,
    direction,
    score: nextScore,
    food: nextFood
  };
}