import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";

// Singletons: DAO

function clone(obj) {
  // TODO: could also use structuredClone, but it would require upgrading to Node.js 17.0
  if (obj) {
    return { ...obj };
  }
  return null;
}

export class UserDao {
  users = {};

  getById(userId) {
    return clone(this.users[userId]);
  }

  save(user) {
    this.users[user.userId] = clone(user);
  }
}

export class PasswordService {
  constructor(users) {
    this.users = users;
  }

  changePassword(userId, oldPassword, newPassword) {
    const user = this.users.getById(userId);
    // This is code isn't meant to be secure. Always store passwords using bcrypt or similar algorithm
    // which is designed for passwords. See https://auth0.com/blog/hashing-passwords-one-way-road-to-security/
    if (oldPassword !== user.password) {
      throw new Error("wrong old password");
    } else {
      user.password = newPassword;
    }
    this.users.save(user);
  }
}

// File system: parse CSV

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

// TODO: Network sockets

// Time: days until Christmas

const millisPerDay = 24 * 60 * 60 * 1000;

export function daysUntilChristmas(now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const christmasDay = new Date(now.getFullYear(), 12 - 1, 25);
  if (today.getTime() > christmasDay.getTime()) {
    christmasDay.setFullYear(now.getFullYear() + 1);
  }
  const diffMillis = christmasDay.getTime() - today.getTime();
  return Math.floor(diffMillis / millisPerDay);
}

// TODO: Concurrency

// Randomness: rolling dice in a dice game

export function diceRoll() {
  const min = 1;
  const max = 6;
  return Math.floor(Math.random() * (max + 1 - min) + min);
}

export function diceHandValue(die1, die2) {
  if (die1 === die2) {
    // one pair
    return 100 + die1;
  } else {
    // high die
    return Math.max(die1, die2);
  }
}
