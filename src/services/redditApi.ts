import axios, { AxiosInstance } from 'axios';
import Config from 'react-native-config';
import { storage } from '../utils/storage';
import {
  RedditPost,
  RedditComment,
  RedditSubreddit,
  RedditListing,
  RedditAuthResponse,
  RedditUser,
} from '../types/reddit';

const REDDIT_BASE_URL = 'https://www.reddit.com';
const REDDIT_OAUTH_URL = 'https://oauth.reddit.com';

class RedditApiService {
  private client: AxiosInstance;
  private oauthClient: AxiosInstance | null = null;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private userAgent: string;

  constructor() {
    // Ces valeurs viennent de variables d'environnement via react-native-config
    this.clientId = Config.REDDIT_CLIENT_ID || '';
    this.clientSecret = Config.REDDIT_CLIENT_SECRET || '';
    this.redirectUri = Config.REDDIT_REDIRECT_URI || 'redditclient://auth';
    this.userAgent = Config.REDDIT_USER_AGENT || 'reddit-client-app/1.0.0';

    this.client = axios.create({
      baseURL: REDDIT_BASE_URL,
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    this.initializeOAuthClient();
  }

  private async initializeOAuthClient() {
    const accessToken = await storage.getAccessToken();
    if (accessToken) {
      this.setOAuthClient(accessToken);
    }
  }

  private setOAuthClient(accessToken: string) {
    this.oauthClient = axios.create({
      baseURL: REDDIT_OAUTH_URL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': this.userAgent,
      },
    });
  }

  /**
   * Authentification OAuth2 avec Reddit
   */
  async authenticate(code: string): Promise<RedditAuthResponse> {
    try {
      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        }),
        {
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': this.userAgent,
          },
        },
      );

      const authData: RedditAuthResponse = response.data;
      await storage.setAccessToken(authData.access_token);
      if (authData.refresh_token) {
        await storage.setRefreshToken(authData.refresh_token);
      }
      const expiry = Date.now() + authData.expires_in * 1000;
      await storage.setTokenExpiry(expiry);
      this.setOAuthClient(authData.access_token);

      return authData;
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      throw error;
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshAccessToken(): Promise<string> {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    try {
      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
        {
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': this.userAgent,
          },
        },
      );

      const authData: RedditAuthResponse = response.data;
      await storage.setAccessToken(authData.access_token);
      const expiry = Date.now() + authData.expires_in * 1000;
      await storage.setTokenExpiry(expiry);
      this.setOAuthClient(authData.access_token);

      return authData.access_token;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      await storage.clearAuth();
      throw error;
    }
  }

  /**
   * Vérifier si le token est valide et le rafraîchir si nécessaire
   */
  private async ensureValidToken(): Promise<void> {
    const expiry = await storage.getTokenExpiry();
    if (!expiry || Date.now() >= expiry - 60000) {
      // Rafraîchir si expiré ou expire dans moins d'une minute
      await this.refreshAccessToken();
    }
  }

  /**
   * Obtenir l'URL d'autorisation OAuth
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      state: 'random_state_string',
      redirect_uri: this.redirectUri,
      duration: 'permanent',
      scope: 'read save vote identity',
    });

    return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  }

  /**
   * Récupérer les posts d'un subreddit
   */
  async getSubredditPosts(
    subreddit: string,
    sort: 'hot' | 'new' | 'top' | 'rising' = 'hot',
    limit: number = 25,
    after?: string,
  ): Promise<{ posts: RedditPost[]; after?: string }> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await this.oauthClient.get<RedditListing<RedditPost>>(
        `/r/${subreddit}/${sort}.json`,
        {
          params: {
            limit,
            after,
          },
        },
      );

      const posts = response.data.data.children.map(child => child.data);
      return {
        posts,
        after: response.data.data.after,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des posts:', error);
      throw error;
    }
  }

  /**
   * Récupérer les posts de plusieurs subreddits (front page personnalisée)
   */
  async getMultiSubredditPosts(
    subreddits: string[],
    sort: 'hot' | 'new' | 'top' = 'hot',
    limit: number = 25,
    after?: string,
  ): Promise<{ posts: RedditPost[]; after?: string }> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    const subredditString = subreddits.join('+');
    try {
      const response = await this.oauthClient.get<RedditListing<RedditPost>>(
        `/r/${subredditString}/${sort}.json`,
        {
          params: {
            limit,
            after,
          },
        },
      );

      const posts = response.data.data.children.map(child => child.data);
      return {
        posts,
        after: response.data.data.after,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des posts:', error);
      throw error;
    }
  }

  /**
   * Récupérer les commentaires d'un post
   */
  async getPostComments(
    subreddit: string,
    postId: string,
    sort: 'best' | 'top' | 'new' | 'controversial' | 'old' = 'best',
  ): Promise<{ post: RedditPost; comments: RedditComment[] }> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await this.oauthClient.get<
        [RedditListing<RedditPost>, RedditListing<RedditComment>]
      >(`/r/${subreddit}/comments/${postId}.json`, {
        params: {
          sort,
        },
      });

      const post = response.data[0].data.children[0].data;
      const comments = response.data[1].data.children.map(child => child.data);

      return { post, comments };
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      throw error;
    }
  }

  /**
   * Upvoter un post ou commentaire
   */
  async upvote(id: string, isComment: boolean = false): Promise<void> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    try {
      await this.oauthClient.post('/api/vote', null, {
        params: {
          id: isComment ? `t1_${id}` : `t3_${id}`,
          dir: 1,
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'upvote:', error);
      throw error;
    }
  }

  /**
   * Downvoter un post ou commentaire
   */
  async downvote(id: string, isComment: boolean = false): Promise<void> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    try {
      await this.oauthClient.post('/api/vote', null, {
        params: {
          id: isComment ? `t1_${id}` : `t3_${id}`,
          dir: -1,
        },
      });
    } catch (error) {
      console.error('Erreur lors du downvote:', error);
      throw error;
    }
  }

  /**
   * Retirer un vote
   */
  async removeVote(id: string, isComment: boolean = false): Promise<void> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    try {
      await this.oauthClient.post('/api/vote', null, {
        params: {
          id: isComment ? `t1_${id}` : `t3_${id}`,
          dir: 0,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du vote:', error);
      throw error;
    }
  }

  /**
   * Sauvegarder un post
   */
  async savePost(id: string): Promise<void> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    try {
      await this.oauthClient.post('/api/save', null, {
        params: {
          id: `t3_${id}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Désauvegarder un post
   */
  async unsavePost(id: string): Promise<void> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    try {
      await this.oauthClient.post('/api/unsave', null, {
        params: {
          id: `t3_${id}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la désauvegarde:', error);
      throw error;
    }
  }

  /**
   * Rechercher des posts
   */
  async searchPosts(
    query: string,
    subreddit?: string,
    sort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'relevance',
    limit: number = 25,
    after?: string,
  ): Promise<{ posts: RedditPost[]; after?: string }> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    try {
      const endpoint = subreddit
        ? `/r/${subreddit}/search.json`
        : '/search.json';

      const response = await this.oauthClient.get<RedditListing<RedditPost>>(
        endpoint,
        {
          params: {
            q: query,
            sort,
            limit,
            after,
            restrict_sr: subreddit ? 'true' : 'false',
          },
        },
      );

      const posts = response.data.data.children.map(child => child.data);
      return {
        posts,
        after: response.data.data.after,
      };
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }
  }

  /**
   * Récupérer les subreddits auxquels l'utilisateur est abonné
   */
  async getSubscribedSubreddits(
    limit: number = 100,
    after?: string,
  ): Promise<{ subreddits: RedditSubreddit[]; after?: string }> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await this.oauthClient.get<RedditListing<RedditSubreddit>>(
        '/subreddits/mine/subscriber.json',
        {
          params: {
            limit,
            after,
          },
        },
      );

      const subreddits = response.data.data.children.map(child => child.data);
      return {
        subreddits,
        after: response.data.data.after,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des subreddits:', error);
      throw error;
    }
  }

  /**
   * Récupérer les posts sauvegardés de l'utilisateur
   */
  async getSavedPosts(
    limit: number = 25,
    after?: string,
  ): Promise<{ posts: RedditPost[]; after?: string }> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await this.oauthClient.get<RedditListing<RedditPost>>(
        '/user/me/saved.json',
        {
          params: {
            limit,
            after,
          },
        },
      );

      const posts = response.data.data.children.map(child => child.data);
      return {
        posts,
        after: response.data.data.after,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des posts sauvegardés:', error);
      throw error;
    }
  }

  /**
   * Récupérer les informations de l'utilisateur
   */
  async getMe(): Promise<RedditUser> {
    await this.ensureValidToken();

    if (!this.oauthClient) {
      throw new Error('Non authentifié');
    }

    try {
      const response = await this.oauthClient.get<{ data: RedditUser }>(
        '/api/v1/me',
      );

      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des infos utilisateur:', error);
      throw error;
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    await storage.clearAuth();
    this.oauthClient = null;
  }
}

export const redditApi = new RedditApiService();

