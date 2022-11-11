import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";

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
