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
