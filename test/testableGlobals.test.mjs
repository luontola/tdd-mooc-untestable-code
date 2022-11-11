import { expect } from "chai";
import {
  FakePasswordHasher,
  PasswordService,
  SecurePasswordHasher,
  UserDao,
} from "../src/testableGlobals.mjs";

describe("Globals and singletons: enterprise application", () => {
  const userId = 123;
  let users;
  let hasher;
  let service;
  beforeEach(() => {
    users = new UserDao();
    hasher = new FakePasswordHasher();
    service = new PasswordService(users, hasher);
  });

  it("change password", () => {
    const userBefore = {
      userId,
      passwordHash: hasher.hashPassword("old-pw"),
    };
    users.save(userBefore);

    service.changePassword(userId, "old-pw", "new-pw");

    const userAfter = users.getById(userId);
    expect(userAfter.passwordHash).to.not.equal(userBefore.passwordHash);
    expect(hasher.verifyPassword(userAfter.passwordHash, "new-pw")).to.be.true;
  });

  it("old password did not match", () => {
    const userBefore = {
      userId,
      passwordHash: hasher.hashPassword("old-pw"),
    };
    users.save(userBefore);

    expect(() => {
      service.changePassword(userId, "wrong-pw", "new-pw");
    }).to.throw(Error, "wrong old password");

    const userAfter = users.getById(userId);
    expect(userAfter.passwordHash).to.equal(userBefore.passwordHash);
    expect(hasher.verifyPassword(userAfter.passwordHash, "old-pw")).to.be.true;
  });
});

function passwordHasherContract(hasher) {
  const hash = hasher.hashPassword("correct");

  it("correct password", () => {
    expect(hasher.verifyPassword(hash, "correct")).to.be.true;
  });

  it("wrong password", () => {
    expect(hasher.verifyPassword(hash, "wrong")).to.be.false;
  });
}

describe("SecurePasswordHasher", () => {
  const hasher = new SecurePasswordHasher();
  passwordHasherContract(hasher);
});

describe("FakePasswordHasher", () => {
  const hasher = new FakePasswordHasher();
  passwordHasherContract(hasher);

  it("hash format", () => {
    expect(hasher.hashPassword("abc")).to.equal("352441c2");
    expect(hasher.intToHex(0)).to.equal("00000000");
    expect(hasher.intToHex(1)).to.equal("00000001");
    expect(hasher.intToHex(-1)).to.equal("ffffffff");
  });
});
