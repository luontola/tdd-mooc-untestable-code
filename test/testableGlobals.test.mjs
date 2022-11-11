import { expect } from "chai";
import {
  FakePasswordHasher,
  InMemoryUserDao,
  PasswordService,
  PostgresUserDao,
  SecurePasswordHasher,
} from "../src/testableGlobals.mjs";
import util from "node:util";
import child_process from "node:child_process";
import pg from "pg";

const exec = util.promisify(child_process.exec);

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

async function dockerComposePort(service, privatePort) {
  const result = await exec(`docker compose port ${service} ${privatePort}`);
  const [host, port] = result.stdout.trim().split(":");
  return { host, port };
}

async function dockerComposeEnv(service) {
  const ps = await exec(`docker compose ps --quiet ${service}`);
  const containerId = ps.stdout.trim();

  const inspect = await exec(`docker inspect ${containerId}`);
  const env = JSON.parse(inspect.stdout)[0].Config.Env;
  return env
    .map((s) => s.split("="))
    .reduce((m, [k, v]) => {
      m[k] = v;
      return m;
    }, {});
}

async function connectTestDb() {
  const service = "db";
  const privatePort = "5432";
  const { host, port } = await dockerComposePort(service, privatePort);
  const env = await dockerComposeEnv(service);
  return new pg.Pool({
    host,
    port,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_USER,
  });
}

async function createTables(db) {
  await db.query(`create table users
                  (
                      user_id       integer primary key,
                      password_hash varchar(100) not null
                  )`);
}

async function dropTables(db) {
  await db.query(`drop table if exists users`);
}

describe("PostgresUserDao", () => {
  let db;
  let dao;

  before(async () => {
    db = await connectTestDb();
    await createTables(db);
    dao = new PostgresUserDao(db);
  });

  after(async () => {
    await dropTables(db);
  });

  it("spike", async () => {
    const user = await dao.getById(666);
    expect(user).to.equal(1);
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
