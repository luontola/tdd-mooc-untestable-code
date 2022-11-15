import { PasswordService, PostgresUserDao } from "../src/untestable4.mjs";

describe("Untestable 4: enterprise application", () => {
  let service;
  beforeEach(() => {
    service = new PasswordService();
  });

  afterEach(() => {
    PostgresUserDao.getInstance().close();
  });

  it("todo", async () => {
    // TODO: write proper tests
  });
});
