import { expect } from "chai";
import { sum } from "../src/example.mjs";

describe("Example test fixture", () => {
  it("Example test", () => {
    expect(sum(1, 2)).to.equal(3);
  });
});
