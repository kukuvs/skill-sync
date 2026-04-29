import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeSkillPath, resolveInside } from "../src/paths.js";

void test("normalizeSkillPath accepts nested unicode paths", () => {
  assert.equal(normalizeSkillPath("/разработка/x-uikit/button/"), "разработка/x-uikit/button");
});

void test("normalizeSkillPath rejects traversal", () => {
  assert.throws(() => normalizeSkillPath("../secret"), /unsafe segment/);
  assert.throws(() => normalizeSkillPath("skills/../secret"), /unsafe segment/);
});

void test("resolveInside refuses paths outside the base directory", () => {
  assert.throws(() => resolveInside("tmp/base", "../outside"), /outside/);
});
