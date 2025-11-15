import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  PostDetail: {
    postId: string;
    subreddit: string;
  };
  Search: {
    subreddit?: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Subreddits: undefined;
  Saved: undefined;
  Profile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

