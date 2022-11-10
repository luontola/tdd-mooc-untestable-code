import { expect } from "chai";
import {
  daysUntilChristmas,
  diceHandValue,
  diceRoll,
  parsePeopleCsv,
  readUtf8File,
} from "../src/testable.mjs";

describe("File system: parse CSV file", () => {
  it("read file", async () => {
    expect(await readUtf8File("./test/dummy.txt")).to.equal("dummy file\n");
  });

  it("parse CSV", () => {
    const input = `
      Loid,Forger,,Male
      Anya,Forger,6,Female
      Yor,Forger,27,Female`;
    expect(parsePeopleCsv(input)).to.deep.equal([
      { firstName: "Loid", lastName: "Forger", gender: "m" },
      { firstName: "Anya", lastName: "Forger", age: 6, gender: "f" },
      { firstName: "Yor", lastName: "Forger", age: 27, gender: "f" },
    ]);
  });
});

describe("Time: days until Christmas", () => {
  it("Christmas Day", () => {
    expect(daysUntilChristmas(new Date("2022-12-25T00:00:00"))).to.equal(0);
    expect(daysUntilChristmas(new Date("2022-12-25T12:00:00"))).to.equal(0);
    expect(daysUntilChristmas(new Date("2022-12-25T23:59:59"))).to.equal(0);
  });

  it("Christmas Eve", () => {
    expect(daysUntilChristmas(new Date("2022-12-24T00:00:00"))).to.equal(1);
    expect(daysUntilChristmas(new Date("2022-12-24T12:00:00"))).to.equal(1);
    expect(daysUntilChristmas(new Date("2022-12-24T23:59:59"))).to.equal(1);
  });

  it("1st of December", () => {
    expect(daysUntilChristmas(new Date("2022-12-01"))).to.equal(24);
  });

  it("the day after Christmas", () => {
    expect(daysUntilChristmas(new Date("2022-12-26"))).to.equal(364);
  });

  it("Midsummer's Day", () => {
    expect(daysUntilChristmas(new Date("2022-06-25"))).to.equal(183);
  });
});

describe("Randomness: a dice game", () => {
  it("dice rolls are between 1 and 6", () => {
    const roll = diceRoll();
    expect(roll).to.greaterThan(0.9);
    expect(roll).to.lessThan(6.1);
  });

  it("one pair", () => {
    expect(diceHandValue(1, 1)).to.equal(101);
    expect(diceHandValue(6, 6)).to.equal(106);
  });

  it("high die", () => {
    expect(diceHandValue(1, 2)).to.equal(2);
    expect(diceHandValue(6, 4)).to.equal(6);
  });
});
