import { pullRequestState } from "./status";

describe("pullRequestState", () => {
  test("incoming", () => {
    expect(pullRequestState());
  });

  test("not involved", () => {});
});
