import { describe, test } from "vitest";
import { expect } from "chai";
import { daysUntilChristmas } from "../src/untestable1.mjs";

describe("Untestable 1: days until Christmas", () => {
  test("todo", () => {
    // TODO: write proper tests
    expect(daysUntilChristmas()).to.be.a("number");
  });
});
