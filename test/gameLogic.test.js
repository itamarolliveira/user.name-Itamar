import test from "node:test";
import assert from "node:assert/strict";

import { advanceState, applyDirection, placeFood } from "../src/gameLogic.js";

test("applyDirection ignores opposite direction", () => {
  assert.equal(applyDirection("right", "left"), "right");
  assert.equal(applyDirection("up", "down"), "up");
});

test("snake moves one cell in current direction", () => {
  const state = {
    width: 10,
    height: 10,
    snake: [
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 }
    ],
    direction: "right",
    food: { x: 9, y: 9 },
    score: 0,
    status: "running"
  };

  const next = advanceState(state, null, () => 0);
  assert.deepEqual(next.snake[0], { x: 5, y: 4 });
  assert.equal(next.snake.length, 3);
});

test("snake grows and increases score when eating", () => {
  const state = {
    width: 10,
    height: 10,
    snake: [
      { x: 4, y: 4 },
      { x: 3, y: 4 },
      { x: 2, y: 4 }
    ],
    direction: "right",
    food: { x: 5, y: 4 },
    score: 0,
    status: "running"
  };

  const next = advanceState(state, null, () => 0);
  assert.equal(next.score, 1);
  assert.equal(next.snake.length, 4);
});

test("game over when hitting wall", () => {
  const state = {
    width: 5,
    height: 5,
    snake: [
      { x: 4, y: 2 },
      { x: 3, y: 2 },
      { x: 2, y: 2 }
    ],
    direction: "right",
    food: { x: 0, y: 0 },
    score: 0,
    status: "running"
  };

  const next = advanceState(state, null, () => 0);
  assert.equal(next.status, "gameover");
});

test("game over when hitting itself", () => {
  const state = {
    width: 6,
    height: 6,
    snake: [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 }
    ],
    direction: "left",
    food: { x: 0, y: 0 },
    score: 0,
    status: "running"
  };

  const next = advanceState(state, "down", () => 0);
  assert.equal(next.status, "gameover");
});

test("placeFood chooses a free cell", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 }
  ];

  const food = placeFood(snake, 3, 3, () => 0);
  assert.deepEqual(food, { x: 0, y: 1 });
});