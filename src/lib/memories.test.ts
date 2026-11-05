import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePhoto, captionSchema } from "./memories";

test("public contributions accept a JPEG without an account field", () => {
  assert.equal(validatePhoto({ type: "image/jpeg", size: 100 }), "jpg");
});
test("reject non-image uploads", () => {
  assert.throws(() => validatePhoto({ type: "image/svg+xml", size: 100 }));
});
test("accept 10 MiB and reject a larger photo", () => {
  assert.equal(validatePhoto({ type: "image/png", size: 10485760 }), "png");
  assert.throws(() => validatePhoto({ type: "image/png", size: 10485761 }));
});
test("reject empty uploads", () => {
  assert.throws(() => validatePhoto({ type: "image/jpeg", size: 0 }));
});
test("reject captions exceeding 200 characters", () => {
  assert.equal(captionSchema.safeParse("a".repeat(201)).success, false);
});import { memoryOfTheDay, yearsAgo, validateAudio, commentSchema } from "./memories";
test("memory of the day is the same all day and changes the next day", () => {
  const items = [1, 2, 3];
  assert.equal(memoryOfTheDay(items, new Date("2026-11-05T01:00Z")), memoryOfTheDay(items, new Date("2026-11-05T22:00Z")));
  assert.notEqual(memoryOfTheDay(items, new Date("2026-11-05")), memoryOfTheDay(items, new Date("2026-11-06")));
});
test("years ago uses date or approximate year", () => {
  assert.equal(yearsAgo({ takenOn: "2023-08-24", year: null }, new Date("2026-11-05")), 3);
  assert.equal(yearsAgo({ takenOn: null, year: 2020 }, new Date("2026-11-05")), 6);
});
test("voice notes are limited to 10 MB", () => {
  assert.equal(validateAudio({ type: "audio/webm;codecs=opus", size: 10485760 }).ext, "webm");
  assert.throws(() => validateAudio({ type: "audio/webm", size: 10485761 }));
});
test("comments need text", () => {
  assert.equal(commentSchema.safeParse({ author: "", body: "  " }).success, false);
});
