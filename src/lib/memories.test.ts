import { test, expect } from "bun:test";
import { validatePhoto, captionSchema } from "./memories";

test("public contributions accept a JPEG without an account field", () => {
  expect(validatePhoto({ type: "image/jpeg", size: 100 })).toBe("jpg");
});
test("reject non-image uploads", () => {
  expect(() => validatePhoto({ type: "image/svg+xml", size: 100 })).toThrow();
});
test("accept 10 MiB and reject a larger photo", () => {
  expect(validatePhoto({ type: "image/png", size: 10485760 })).toBe("png");
  expect(() => validatePhoto({ type: "image/png", size: 10485761 })).toThrow();
});
test("reject empty uploads", () => {
  expect(() => validatePhoto({ type: "image/jpeg", size: 0 })).toThrow();
});
test("reject captions exceeding 200 characters", () => {
  expect(captionSchema.safeParse("a".repeat(201)).success).toBe(false);
});