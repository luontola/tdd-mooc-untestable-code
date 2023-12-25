import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";

// To test file access, the test would need to write a file. That makes each
// test more complicated than it needs to be: there's the unnecessary indirection
// of having to write a file to pass the data to the function under test.
//
// Here we have decoupled the file reading and CSV parsing, so we can easily test
// the CSV parsing with multiple parameters. parsePeopleCsv also no longer needs
// to be asynchronous, which makes calling it easier.

export async function readUtf8File(path) {
  return await readFile(path, { encoding: "utf8" });
}

export function parsePeopleCsv(csvData) {
  const records = parse(csvData, {
    skip_empty_lines: true,
    trim: true,
  });
  return records.map(([firstName, lastName, age, gender]) => {
    const person = {
      firstName,
      lastName,
      gender: gender.charAt(0).toLowerCase(),
    };
    if (age !== "") {
      person.age = parseInt(age);
    }
    return person;
  });
}
