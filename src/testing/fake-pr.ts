import { PullRequestReference } from "../github-api/api";
import {
  Comment,
  Commit,
  PullRequest,
  Review,
  ReviewState,
} from "../storage/loaded-state";

export function fakePullRequest() {
  return new FakePullRequestBuilder();
}

class FakePullRequestBuilder {
  private _author = "kevin";
  private _seenAs = "fwouts";
  private _ref: PullRequestReference = {
    repo: {
      owner: "zenclabs",
      name: "prmonitor",
    },
    number: 1,
  };
  private _reviewerLogins: string[] = [];
  private _reviewerTeams: string[] = [];
  private _teamMap: Record<string, string[]> = {};
  private _comments: Comment[] = [];
  private _reviews: Review[] = [];
  private _commits: Commit[] = [];
  private _draft = false;

  private _nextTimestamp = 1;

  author(login: string) {
    this._author = login;
    return this;
  }

  seenAs(login: string) {
    this._seenAs = login;
    return this;
  }

  ref(owner: string, name: string, number: number) {
    this._ref.repo.owner = owner;
    this._ref.repo.name = name;
    this._ref.number = number;
    return this;
  }

  draft() {
    this._draft = true;
    return this;
  }

  reviewRequested(logins: string[], teams?: string[]) {
    this._reviewerLogins = logins;
    this._reviewerTeams = teams || [];
    return this;
  }

  teams(teamMap: Record<string, string[]>) {
    this._teamMap = teamMap;
    return this;
  }

  addComment(login: string, timestamp?: number) {
    this._comments.push({
      authorLogin: login,
      createdAt: this.time(timestamp),
    });
    return this;
  }

  addReview(login: string, state: ReviewState, timestamp?: number) {
    this._reviewerLogins = this._reviewerLogins.filter(
      (reviewer) => reviewer !== login
    );
    this._reviews.push({
      authorLogin: login,
      state,
      submittedAt: this.time(timestamp),
    });
    return this;
  }

  addCommit(timestamp?: number) {
    this._commits.push({
      authorLogin: this._author,
      createdAt: this.time(timestamp),
    });
    return this;
  }

  build(): PullRequest {
    const reviewTeamRequested = this._reviewerTeams.some((teamName) => {
      const members = this._teamMap[teamName] || [];
      return members.includes(this._seenAs);
    });
    const reviewRequested =
      this._reviewerLogins.includes(this._seenAs) || reviewTeamRequested;
    return {
      author: {
        login: this._author,
        avatarUrl: "",
      },
      changeSummary: {
        changedFiles: 5,
        additions: 100,
        deletions: 50,
      },
      title: "PR",
      repoOwner: this._ref.repo.owner,
      repoName: this._ref.repo.name,
      pullRequestNumber: this._ref.number,
      nodeId: `${this._ref.repo.owner}/${this._ref.repo.name}/${this._ref.number}`,
      draft: this._draft,
      updatedAt: "1 June 2019",
      htmlUrl: `http://github.com/${this._ref.repo.owner}/${this._ref.repo.name}/${this._ref.number}`,
      reviewRequested: reviewRequested,
      requestedReviewers: this._reviewerLogins,
      requestedTeams: this._reviewerTeams,
      comments: this._comments,
      reviews: this._reviews,
      reviewDecision: "REVIEW_REQUIRED",
    };
  }

  private time(timestamp?: number) {
    if (!timestamp) {
      timestamp = this._nextTimestamp;
    }
    this._nextTimestamp = timestamp + 1;
    return new Date(timestamp).toISOString();
  }
}
