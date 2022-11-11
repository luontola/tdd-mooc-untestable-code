import { expect } from "chai";
import {
  hashPassword,
  PasswordService,
  UserDao,
  verifyPassword,
} from "../src/testableGlobals.mjs";

describe("Globals and singletons: enterprise application", () => {
  const userId = 123;
  let users;
  let service;
  beforeEach(() => {
    users = new UserDao();
    service = new PasswordService(users);
  });

  it("change password", () => {
    const userBefore = {
      userId,
      passwordHash: hashPassword("old-pw"),
    };
    users.save(userBefore);

    service.changePassword(userId, "old-pw", "new-pw");

    const userAfter = users.getById(userId);
    expect(userAfter.passwordHash).to.not.equal(userBefore.passwordHash);
    expect(verifyPassword(userAfter.passwordHash, "new-pw")).to.be.true;
  });

  it("old password did not match", () => {
    const userBefore = {
      userId,
      passwordHash: hashPassword("old-pw"),
    };
    users.save(userBefore);

    expect(() => {
      service.changePassword(userId, "wrong-pw", "new-pw");
    }).to.throw(Error, "wrong old password");

    const userAfter = users.getById(userId);
    expect(userAfter.passwordHash).to.equal(userBefore.passwordHash);
    expect(verifyPassword(userAfter.passwordHash, "old-pw")).to.be.true;
  });
});
