import argon2 from "@node-rs/argon2";

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

export class SecurePasswordHasher {
  hashPassword(password) {
    return argon2.hashSync(password);
  }

  verifyPassword(hash, password) {
    return argon2.verifySync(hash, password);
  }
}

export class PasswordService {
  constructor(users, hasher) {
    this.users = users;
    this.hasher = hasher;
  }

  changePassword(userId, oldPassword, newPassword) {
    const user = this.users.getById(userId);
    if (!this.hasher.verifyPassword(user.passwordHash, oldPassword)) {
      throw new Error("wrong old password");
    }
    user.passwordHash = this.hasher.hashPassword(newPassword);
    this.users.save(user);
  }
}
