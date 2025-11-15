// Types pour l'API Reddit

export interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  score: number;
  num_comments: number;
  created_utc: number;
  selftext?: string;
  selftext_html?: string;
  url: string;
  thumbnail?: string;
  is_video: boolean;
  over_18: boolean;
  saved: boolean;
  likes: boolean | null; // true = upvoted, false = downvoted, null = no vote
  permalink: string;
  domain?: string;
  post_hint?: string;
  preview?: {
    images: Array<{
      source: {
        url: string;
        width: number;
        height: number;
      };
      resolutions: Array<{
        url: string;
        width: number;
        height: number;
      }>;
    }>;
  };
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  body_html?: string;
  score: number;
  created_utc: number;
  depth: number;
  replies?: RedditComment[] | string; // string si "more" children
  likes: boolean | null;
  permalink: string;
  is_submitter: boolean;
  stickied: boolean;
}

export interface RedditSubreddit {
  display_name: string;
  display_name_prefixed: string;
  title: string;
  description: string;
  description_html?: string;
  subscribers: number;
  public_description: string;
  icon_img?: string;
  banner_img?: string;
  user_is_subscriber: boolean;
}

export interface RedditListing<T> {
  kind: string;
  data: {
    children: Array<{
      kind: string;
      data: T;
    }>;
    after?: string;
    before?: string;
  };
}

export interface RedditAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface RedditUser {
  id: string;
  name: string;
  created_utc: number;
  link_karma: number;
  comment_karma: number;
  icon_img?: string;
}

