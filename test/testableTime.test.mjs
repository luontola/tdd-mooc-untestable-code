import { describe, test } from "vitest";
import { expect } from "chai";
import { daysUntilChristmas } from "../src/testableTime.mjs";

describe("Time: days until Christmas", () => {
  test("Christmas Day", () => {
    expect(daysUntilChristmas(new Date("2022-12-25T00:00:00"))).to.equal(0);
    expect(daysUntilChristmas(new Date("2022-12-25T12:00:00"))).to.equal(0);
    expect(daysUntilChristmas(new Date("2022-12-25T23:59:59"))).to.equal(0);
  });

  test("Christmas Eve", () => {
    expect(daysUntilChristmas(new Date("2022-12-24T00:00:00"))).to.equal(1);
    expect(daysUntilChristmas(new Date("2022-12-24T12:00:00"))).to.equal(1);
    expect(daysUntilChristmas(new Date("2022-12-24T23:59:59"))).to.equal(1);
  });

  test("1st of December", () => {
    expect(daysUntilChristmas(new Date("2022-12-01"))).to.equal(24);
  });

  test("the day after Christmas", () => {
    expect(daysUntilChristmas(new Date("2022-12-26"))).to.equal(364);
  });

  test("Midsummer's Day", () => {
    expect(daysUntilChristmas(new Date("2022-06-25"))).to.equal(183);
  });
});
