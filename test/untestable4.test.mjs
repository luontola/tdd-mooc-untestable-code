import { PasswordService } from "../src/untestable4.mjs";

describe("Untestable 4: enterprise application", () => {
  let service;
  beforeEach(() => {
    service = new PasswordService();
  });

  afterEach(() => {
    service.close();
  });

  it("todo", async () => {
    // TODO: write proper tests
  });
});
