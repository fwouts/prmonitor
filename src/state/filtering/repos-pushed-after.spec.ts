import { repoWasPushedAfter } from "./repos-pushed-after";

describe("repoWasPushedAfter", () => {
  it("always returns true when pushedAfter = null", () => {
    const predicate = repoWasPushedAfter(null);
    expect(
      predicate({
        owner: "test",
        name: "test",
        pushedAt: "2012-03-15T17:00:11Z"
      })
    ).toBe(true);
    expect(
      predicate({
        owner: "test",
        name: "test",
        pushedAt: "2052-03-15T17:00:11Z"
      })
    ).toBe(true);
  });

  it("filters correctly", () => {
    const predicate = repoWasPushedAfter("2012-03-15T17:00:11Z");
    expect(
      predicate({
        owner: "test",
        name: "test",
        pushedAt: "2010-03-15T17:00:11Z"
      })
    ).toBe(false);
    expect(
      predicate({
        owner: "test",
        name: "test",
        pushedAt: "2020-03-15T17:00:11Z"
      })
    ).toBe(true);
  });
});
