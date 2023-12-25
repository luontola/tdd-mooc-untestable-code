import { describe, test } from "vitest";
import { expect } from "chai";
import { parsePeopleCsv, readUtf8File } from "../src/testableFiles.mjs";

describe("File system: CSV file parsing", () => {
  // Since we only need to read files, we can commit the test data in this repository.
  // If we would also need to test writing files, then we would need to create a temporary
  // directory for the duration of the tests, and delete it after the test is done.
  test("read file", async () => {
    expect(await readUtf8File("./test/dummy.txt")).to.equal("dummy file\n");
  });

  // A big benefit of parsePeopleCsv no longer being coupled to the file system, is that
  // you can see all the input and output at the same time, inside this test. Otherwise,
  // if the input came from a file, you would need to navigate to the file and open it
  // side-by-side with this test to see them both for visual inspection.
  test("parse CSV", () => {
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

  // The above test could be improved. It couples into one test multiple responsibilities.
  // It's better to have each test focus on testing just one thing, as below.
  describe("CSV parsing, more atomically", () => {
    test("parses name", () => {
      const person = parsePeopleCsv("Anya,Forger,6,Female")[0];
      expect(person.firstName).to.equal("Anya");
      expect(person.lastName).to.equal("Forger");
    });

    test("parses age", () => {
      expect(parsePeopleCsv("x,x,6,Female")[0].age).to.equal(6);
      expect(parsePeopleCsv("x,x,,Female")[0].age, "age is optional").to.equal(undefined);
    });

    test("parses gender", () => {
      expect(parsePeopleCsv("x,x,1,Male")[0].gender).to.equal("m");
      expect(parsePeopleCsv("x,x,1,Female")[0].gender).to.equal("f");
      expect(parsePeopleCsv("x,x,1,female")[0].gender, "gender is case-insensitive").to.equal("f");
    });

    test("skips empty lines", () => {
      const input = `
      A,A,1,Male

      B,B,1,Male
      `;
      expect(parsePeopleCsv(input)).to.deep.equal([
        { firstName: "A", lastName: "A", age: 1, gender: "m" },
        { firstName: "B", lastName: "B", age: 1, gender: "m" },
      ]);
    });

    test("trims whitespace around values", () => {
      const input = "  A  ,  B  ,  1  ,  Male  ";
      expect(parsePeopleCsv(input)).to.deep.equal([{ firstName: "A", lastName: "B", age: 1, gender: "m" }]);
    });
  });
});
