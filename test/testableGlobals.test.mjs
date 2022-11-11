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

  it("change password", async () => {
    const userBefore = {
      userId,
      passwordHash: hasher.hashPassword("old-pw"),
    };
    await users.save(userBefore);

    await service.changePassword(userId, "old-pw", "new-pw");

    const userAfter = await users.getById(userId);
    expect(userAfter.passwordHash).to.not.equal(userBefore.passwordHash);
    expect(hasher.verifyPassword(userAfter.passwordHash, "new-pw")).to.be.true;
  });

  it("old password did not match", async () => {
    const userBefore = {
      userId,
      passwordHash: hasher.hashPassword("old-pw"),
    };
    await users.save(userBefore);

    let error;
    try {
      await service.changePassword(userId, "wrong-pw", "new-pw");
    } catch (e) {
      error = e;
    }
    expect(error).to.deep.equal(new Error("wrong old password"));

    const userAfter = await users.getById(userId);
    expect(userAfter.passwordHash).to.equal(userBefore.passwordHash);
    expect(hasher.verifyPassword(userAfter.passwordHash, "old-pw")).to.be.true;
  });
});

function PasswordHasherContract(hasher) {
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
  PasswordHasherContract(hasher);
});

describe("FakePasswordHasher", () => {
  const hasher = new FakePasswordHasher();
  PasswordHasherContract(hasher);

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

function UserDaoContract(daoProvider) {
  let dao;
  beforeEach(() => {
    dao = daoProvider();
  });

  it("get user by ID", async () => {
    const user1a = {
      userId: 100,
      passwordHash: "abc",
    };
    const user2a = {
      userId: 200,
      passwordHash: "xyz",
    };
    await dao.save(user1a);
    await dao.save(user2a);

    const user1b = await dao.getById(user1a.userId);
    const user2b = await dao.getById(user2a.userId);
    expect(user1b).to.deep.equal(user1a, "get user1 by ID");
    expect(user2b).to.deep.equal(user2a, "get user2 by ID");
    expect(user1b).to.not.equal(user1a, "makes defensive copies");
    expect(await dao.getById(666)).to.equal(null, "non-existing ID");
  });

  it("create and update user", async () => {
    const user = {
      userId: 100,
      passwordHash: "abc",
    };
    await dao.save(user);
    expect(await dao.getById(user.userId)).to.deep.equal(user, "after create");

    user.passwordHash = "xyz";

    expect(await dao.getById(user.userId)).to.not.deep.equal(user, "before update");
    await dao.save(user);
    expect(await dao.getById(user.userId)).to.deep.equal(user, "after update");
  });
}

describe("PostgresUserDao", async () => {
  let db;
  let dao;

  before(async () => {
    db = await connectTestDb();
    await dropTables(db);
    await createTables(db);
    dao = new PostgresUserDao(db);
  });

  after(async () => {
    await db.end();
  });

  UserDaoContract(() => dao);
});

describe("InMemoryUserDao", () => {
  const dao = new InMemoryUserDao();
  UserDaoContract(() => dao);
});
