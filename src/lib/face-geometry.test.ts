import { test } from "node:test";
import assert from "node:assert/strict";
import { squareBox, faceCropStyle } from "./face-geometry";

test("le carré reste dans l'image et est carré en pixels", () => {
  const b = squareBox({ x: 10, y: 10, width: 60, height: 80 }, 400, 300);
  assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= 1 + 1e-9 && b.y + b.h <= 1 + 1e-9);
  assert.ok(Math.abs(b.w * 400 - b.h * 300) < 1e-6);
});
test("un visage au bord est ramené dans l'image", () => {
  const b = squareBox({ x: 380, y: 280, width: 20, height: 20 }, 400, 300);
  assert.ok(b.x + b.w <= 1 + 1e-9 && b.y + b.h <= 1 + 1e-9);
});
test("le style de recadrage agrandit l'image selon la taille du visage", () => {
  const s = faceCropStyle({ x: 0.25, y: 0.5, w: 0.25, h: 0.5 });
  assert.equal(s.width, "400%");
  assert.equal(s.left, "-100%");
  assert.equal(s.top, "-100%");
});
