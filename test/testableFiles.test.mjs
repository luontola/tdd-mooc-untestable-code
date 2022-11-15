import { expect } from "chai";
import { parsePeopleCsv, readUtf8File } from "../src/testableFiles.mjs";

describe("File system: CSV file parsing", () => {
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
