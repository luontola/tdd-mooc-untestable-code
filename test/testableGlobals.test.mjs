import { afterAll, beforeAll, beforeEach, describe, test } from "vitest";
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
import { readFileSync } from "fs";

const exec = util.promisify(child_process.exec);

// These example tests went the whole nine yards in using test doubles, to show
// how it is done. There are fake implementations for all the hard-to-test
// dependencies, and contract tests to make sure that the fake and the real
// implementations are functionally equivalent.

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

  test("change password", async () => {
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

  test("old password did not match", async () => {
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

    // It's important to test that there were no unwanted side effects. It would be bad
    // if somebody could change the password without knowing the old password.
    const userAfter = await users.getById(userId);
    expect(userAfter.passwordHash).to.equal(userBefore.passwordHash);
    expect(hasher.verifyPassword(userAfter.passwordHash, "old-pw")).to.be.true;
  });
});

// This is an example of a contract test: a set of tests that are run against
// multiple implementations. Some testing frameworks might have built-in support
// for it, for example JUnit supports it via inheritance. Vitest doesn't have
// official support for it, but it's quite easy to do yourself like this:

function PasswordHasherContract(hasher) {
  const hash = hasher.hashPassword("correct");

  test("correct password", () => {
    expect(hasher.verifyPassword(hash, "correct")).to.be.true;
  });

  test("wrong password", () => {
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

  // In the contract we can't assume anything about the format of the hashed password,
  // because the contract tests must work for every implementation. To test particular
  // implementations more thoroughly, some implementation specific tests may be needed:
  test("hash format", () => {
    expect(hasher.hashPassword("abc")).to.equal("352441c2");
    expect(hasher.intToHex(0)).to.equal("00000000");
    expect(hasher.intToHex(1)).to.equal("00000001");
    expect(hasher.intToHex(-1)).to.equal("ffffffff");
  });
});

// If the CI server doesn't isolate each test run to its own VM, we need to be careful
// about avoiding port collisions. That could be done by giving each process a random
// port. This function shows how to ask from Docker Compose that in which port the
// database is running. By using a modern CI server which isolates each build, you could
// avoid this hassle and just use fixed ports.
async function dockerComposePort(service, privatePort) {
  const result = await exec(`docker compose port ${service} ${privatePort}`);
  const [host, port] = result.stdout.trim().split(":");
  return { host, port };
}

// The tests will need to know the database's username and password to be able to connect
// to the database. A simple way would be to have store the local environment's
// configuration in a .env file. Both Docker Compose and Node.js can work with .env files.
// Here is demonstrated another way: reading the environment variables from the Docker
// container's configuration.
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
  // supports dynamic port mapping on the host à la "127.0.0.1::5432"
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
  await db.query(readFileSync("./src/create-tables.sql", { encoding: "utf8", flag: "r" }));
}

async function dropTables(db) {
  await db.query(readFileSync("./src/drop-tables.sql", { encoding: "utf8", flag: "r" }));
}

async function truncateTables(db) {
  await db.query("truncate users");
}

// Once again, contract tests for the DAO (database access object). Maintaining
// fake implementations of all the DAO classes is lots of work, and anyway some
// implementation details will leak through (e.g. transactions and constraints),
// so you might not want to go this far. It's better to design the code so that
// the business logic is not coupled to the database (though that's hard). Or,
// you could use fakes or mocks in moderation, or take the productivity hit of
// having slow tests in some part of the codebase.

function UserDaoContract(daoProvider) {
  // These tests use generated user IDs to avoid conflicts between the tests.
  // Database tests should be designed carefully to not assume the presence or
  // absence of unrelated rows in the same database tables. The following tests
  // could be run in any order or even in parallel.
  let userIdSeq = 100;
  let dao;
  beforeEach(() => {
    dao = daoProvider();
  });

  test("get user by ID", async () => {
    const user1a = {
      userId: ++userIdSeq,
      passwordHash: "abc",
    };
    const user2a = {
      userId: ++userIdSeq,
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

  test("create and update user", async () => {
    const user = {
      userId: ++userIdSeq,
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

  // Ideally you would empty and recreate the database between every test. But
  // that can be very slow, and slow tests lead to bad productivity. Typically,
  // you would empty the database before or after the whole suite of tests has
  // been run (as below in the beforeAll block), instead of between each test.
  // That requires designing the tests so that they don't mind the database
  // containing rows from other tests or from previous runs of the same test.
  beforeAll(async () => {
    db = await connectTestDb();
    if (true) {
      // option 1: recreate tables between tests (more robust)
      await dropTables(db);
      await createTables(db);
    } else {
      // option 2: assume tables exist and just empty them between tests (faster)
      await truncateTables(db);
    }
    dao = new PostgresUserDao(db);
  });

  // The original test stub had a gotcha of calling PostgresUserDao.getInstance().close()
  // after the test is done. The singleton would keep hold of the closed
  // database connection, so the following test runs would fail because some
  // state remained from previous tests. Here the test is in control of managing
  // the database connection, and avoiding singletons keeps the tests isolated.
  afterAll(async () => {
    await db.end();
  });

  UserDaoContract(() => dao);
});

describe("InMemoryUserDao", () => {
  const dao = new InMemoryUserDao();
  UserDaoContract(() => dao);
});
