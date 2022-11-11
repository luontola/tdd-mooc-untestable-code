import argon2 from "@node-rs/argon2";
import { crc32 } from "@node-rs/crc32";

export class PostgresUserDao {
  constructor(db) {
    this.db = db;
  }

  async getById(userId) {
    const { rows } = await this.db.query("select 1 as x");
    return rows[0].x;
  }

  async save(user) {}
}

function clone(obj) {
  // TODO: could also use structuredClone, but it would require upgrading to Node.js 17.0
  if (obj) {
    return { ...obj };
  }
  return null;
}

export class InMemoryUserDao {
  users = {};

  async getById(userId) {
    return clone(this.users[userId]);
  }

  async save(user) {
    this.users[user.userId] = clone(user);
  }
}

export class SecurePasswordHasher {
  hashPassword(password) {
    return argon2.hashSync(password);
  }

  verifyPassword(hash, password) {
    return argon2.verifySync(hash, password);
  }
}

export class FakePasswordHasher {
  intToHex(n) {
    return (n >>> 0).toString(16).padStart(8, "0");
  }

  hashPassword(password) {
    return this.intToHex(crc32(password));
  }

  verifyPassword(hash, password) {
    return this.hashPassword(password) === hash;
  }
}

export class PasswordService {
  constructor(users, hasher) {
    this.users = users;
    this.hasher = hasher;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await this.users.getById(userId);
    if (!this.hasher.verifyPassword(user.passwordHash, oldPassword)) {
      throw new Error("wrong old password");
    }
    user.passwordHash = this.hasher.hashPassword(newPassword);
    await this.users.save(user);
  }
}
