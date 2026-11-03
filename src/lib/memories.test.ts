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
});