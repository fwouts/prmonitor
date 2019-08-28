import { PullRequestReference } from "../github-api/api";
import {
  Comment,
  PullRequest,
  Review,
  ReviewState
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
      name: "prmonitor"
    },
    number: 1
  };
  private _reviewerLogins: string[] = [];
  private _comments: Comment[] = [];
  private _reviews: Review[] = [];

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

  reviewRequested(logins: string[]) {
    this._reviewerLogins = logins;
    return this;
  }

  addComment(login: string, timestamp?: number) {
    this._comments.push({
      authorLogin: login,
      createdAt: this.time(timestamp)
    });
    return this;
  }

  addReview(login: string, state: ReviewState, timestamp?: number) {
    this._reviews.push({
      authorLogin: login,
      state,
      submittedAt: this.time(timestamp)
    });
    return this;
  }

  build(): PullRequest {
    return {
      author: {
        login: this._author,
        avatarUrl: ""
      },
      title: "PR",
      repoOwner: this._ref.repo.owner,
      repoName: this._ref.repo.name,
      pullRequestNumber: this._ref.number,
      nodeId: `${this._ref.repo.owner}/${this._ref.repo.name}/${this._ref.number}`,
      updatedAt: "1 June 2019",
      htmlUrl: `http://github.com/${this._ref.repo.owner}/${this._ref.repo.name}/${this._ref.number}`,
      reviewRequested: this._reviewerLogins.includes(this._seenAs),
      requestedReviewers: this._reviewerLogins,
      comments: this._comments,
      reviews: this._reviews
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