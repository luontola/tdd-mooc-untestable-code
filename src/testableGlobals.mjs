import argon2 from "@node-rs/argon2";
import { crc32 } from "@node-rs/crc32";

// The old PostgresUserDao was a singleton, and it managed the database connection
// by itself. It had the assumption that only one database connection would exist
// for the lifetime of the process. But tests will need to recreate the application
// multiple times, for each test. Giving the database connection to PostgresUserDao
// as a constructor parameter (i.e. using dependency injection) gives the tests
// control over the database.

export class PostgresUserDao {
  constructor(db) {
    this.db = db;
  }

  #rowToUser(row) {
    return { userId: row.user_id, passwordHash: row.password_hash };
  }

  async getById(userId) {
    const { rows } = await this.db.query(
      `select user_id, password_hash
       from users
       where user_id = $1`,
      [userId],
    );
    return rows.map(this.#rowToUser)[0] || null;
  }

  async save(user) {
    await this.db.query(
      `insert into users (user_id, password_hash)
       values ($1, $2)
       on conflict (user_id) do update
           set password_hash = excluded.password_hash`,
      [user.userId, user.passwordHash],
    );
  }
}

export class InMemoryUserDao {
  users = {};

  async getById(userId) {
    return structuredClone(this.users[userId]) || null;
  }

  async save(user) {
    this.users[user.userId] = structuredClone(user);
  }
}

// Real-life password hashing algorithms are slow by design. It's debatable
// whether it's worth having a fast dummy algorithm for testing, as shown below.
// You shouldn't anyway have many tests depend on authentication, so a slow
// hashing algorithm might not slow down the test suite noticeably.

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

// The old PasswordService was tightly coupled to the database and the
// encryption algorithm. Using dependency injection (i.e. passing them in as
// constructor parameters) gives the tests the ability to replace them with
// test doubles.

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
