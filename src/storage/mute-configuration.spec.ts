import { PullRequestReference } from "../github-api/api";
import { addMute, MuteConfiguration } from "./mute-configuration";

const PR_1: PullRequestReference = {
  repo: {
    owner: "zenclabs",
    name: "prmonitor"
  },
  number: 1
};

describe("MuteConfiguration", () => {
  describe("addMute", () => {
    test("next-update", () => {
      expect(addMute(createEmptyConfig(), PR_1, "next-update"))
        .toMatchInlineSnapshot(`
        Object {
          "ignored": Object {},
          "mutedPullRequests": Array [
            Object {
              "number": 1,
              "repo": Object {
                "name": "prmonitor",
                "owner": "zenclabs",
              },
              "until": Object {
                "kind": "next-update",
                "mutedAtTimestamp": 1565397432269,
              },
            },
          ],
        }
      `);
    });
    test.todo("1-hour");
    test.todo("forever");
    test.todo("repo");
    test.todo("owner");
    it("does not duplicate");
  });

  describe("removePullRequestMute", () => {
    it("removes all mutes");
    it("does not fail when empty");
  });

  describe("removeOwnerMute", () => {
    it("removes when ignore-all");
    it("removes when ignore-only");
    it("does not fail when empty");
  });

  describe("removeRepositoryMute", () => {
    it("removes only repository when there are more ignored repositories");
    it("removes ignore configuration when no more ignored repositories");
    it("defaults to removing when ignore-all");
    it("does not fail when empty");
  });
});

function createEmptyConfig(): MuteConfiguration {
  return {
    mutedPullRequests: []
  };
}
