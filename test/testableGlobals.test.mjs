import { expect } from "chai";
import {
  FakePasswordHasher,
  InMemoryUserDao,
  PasswordService,
  SecurePasswordHasher,
} from "../src/testableGlobals.mjs";

describe("Globals and singletons: enterprise application", () => {
  const userId = 123;
  let users;
  let hasher;
  let service;
  beforeEach(() => {
    users = new InMemoryUserDao();
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

describe("InMemoryUserDao", () => {
  const dao = new InMemoryUserDao();

  it("get user by ID", () => {
    const user1a = {
      userId: 100,
      passwordHash: "abc",
    };
    const user2a = {
      userId: 200,
      passwordHash: "xyz",
    };
    dao.save(user1a);
    dao.save(user2a);

    const user1b = dao.getById(user1a.userId);
    const user2b = dao.getById(user2a.userId);
    expect(user1b).to.deep.equal(user1a, "get user1 by ID");
    expect(user2b).to.deep.equal(user2a, "get user2 by ID");
    expect(user1b).to.not.equal(user1a, "makes defensive copies");
    expect(dao.getById(666)).to.equal(null, "non-existing ID");
  });

  it("create and update user", () => {
    const user = {
      userId: 100,
      passwordHash: "abc",
    };
    dao.save(user);
    expect(dao.getById(user.userId)).to.deep.equal(user, "after create");

    user.passwordHash = "xyz";

    expect(dao.getById(user.userId)).to.not.deep.equal(user, "before update");
    dao.save(user);
    expect(dao.getById(user.userId)).to.deep.equal(user, "after update");
  });
});
