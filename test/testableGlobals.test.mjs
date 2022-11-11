import { expect } from "chai";
import { PasswordService, UserDao } from "../src/testableGlobals.mjs";

describe("Globals and singletons: enterprise application", () => {
  const userId = 123;
  let users;
  let service;
  beforeEach(() => {
    users = new UserDao();
    service = new PasswordService(users);
  });

  it("change password", () => {
    users.save({ userId, password: "old-pw" });

    service.changePassword(userId, "old-pw", "new-pw");

    expect(users.getById(userId).password).to.equal("new-pw");
  });

  it("old password did not match", () => {
    users.save({ userId, password: "old-pw" });

    expect(() => {
      service.changePassword(userId, "wrong-pw", "new-pw");
    }).to.throw(Error, "wrong old password");

    expect(users.getById(userId).password).to.equal("old-pw");
  });
});
