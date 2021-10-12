import { expect } from "chai";
import { sayHello } from "../src/hello_world.mjs";

describe("Placeholder test fixture", () => {
  it("Placeholder test", () => {
    expect(sayHello("world")).to.equal("Hello world");
  });
});
