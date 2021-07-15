import { PaginationResults } from "@octokit/plugin-paginate-rest/dist-types/types";
import { Octokit } from "@octokit/rest";
import { GetResponseDataTypeFromEndpointMethod } from "@octokit/types";

/**
 * A simple wrapper around GitHub's API.
 */
export interface GitHubApi {
  /**
   * Returns the information about the current authenticated user.
   */
  loadAuthenticatedUser(): Promise<
    GetResponseDataTypeFromEndpointMethod<Octokit["users"]["getAuthenticated"]>
  >;

  /**
   * Returns the full list of pull requests matching a given query.
   */
  searchPullRequests(query: string): Promise<
    // Note: There might be a more efficient way to represent this type.
    PaginationResults<
      GetResponseDataTypeFromEndpointMethod<
        Octokit["search"]["issuesAndPullRequests"]
      >["items"][number]
    >
  >;

  /**
   * Returns the details of a pull request.
   */
  loadPullRequestDetails(
    pr: PullRequestReference
  ): Promise<GetResponseDataTypeFromEndpointMethod<Octokit["pulls"]["get"]>>;

  /**
   * Returns the full list of reviews for a pull request.
   */
  loadReviews(
    pr: PullRequestReference
  ): Promise<
    GetResponseDataTypeFromEndpointMethod<Octokit["pulls"]["listReviews"]>
  >;

  /**
   * Returns the full list of comments for a pull request.
   */
  loadComments(
    pr: PullRequestReference
  ): Promise<
    GetResponseDataTypeFromEndpointMethod<Octokit["issues"]["listComments"]>
  >;

  /**
   * Returns the full list of commits for a pull request.
   */
  loadCommits(
    pr: PullRequestReference
  ): Promise<
    GetResponseDataTypeFromEndpointMethod<Octokit["pulls"]["listCommits"]>
  >;
}

export interface RepoReference {
  owner: string;
  name: string;
}

export interface PullRequestReference {
  repo: RepoReference;
  number: number;
}
