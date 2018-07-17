// See GraphQL request.
export interface PullRequest {
    url: string;
    title: string;
    updatedAt: string;
    reviews: {
      nodes: {
        author: {
          login: string;
        };
        createdAt: string;
        state: string;
      }[];
    };
    comments: {
      nodes: {
        author: {
          login: string;
        };
        createdAt: string;
      }[];
    };
    author: {
      login: string;
    };
    assignees: {
      nodes: {
        login: string;
      }[];
    };
    reviewRequests: {
      nodes: {
        requestedReviewer: {
          login: string;
        };
      }[];
    };
  }
  
  export type Timestamp = number;
