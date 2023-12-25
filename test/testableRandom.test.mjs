import { describe, test } from "vitest";
import { expect } from "chai";
import { diceHandValue, diceRoll } from "../src/testableRandom.mjs";

describe("Randomness: a dice game", () => {
  // When testing random number generation, you can't know what each function
  // call will return, but you can test known invariants. For example in this
  // case, all the values are known to be between 1 and 6. And if we throw the
  // dice repeatedly, it should eventually return all the 6 possible values.
  test("dice rolls are between 1 and 6", () => {
    const rolls = new Set();
    for (let i = 0; i < 100; i++) {
      rolls.add(diceRoll());
    }
    expect(rolls).to.have.all.keys([1, 2, 3, 4, 5, 6]);
  });

  test("one pair", () => {
    expect(diceHandValue(1, 1)).to.equal(101);
    expect(diceHandValue(6, 6)).to.equal(106);
  });

  test("high die", () => {
    expect(diceHandValue(1, 2)).to.equal(2);
    expect(diceHandValue(6, 4)).to.equal(6);
  });
});
