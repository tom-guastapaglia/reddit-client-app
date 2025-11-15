import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { RedditPost } from '../types/reddit';
import { redditApi } from '../services/redditApi';
import { storage } from '../utils/storage';
import PostCard from '../components/PostCard';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [after, setAfter] = useState<string | undefined>();
  const [subscribedSubreddits, setSubscribedSubreddits] = useState<string[]>([]);

  useEffect(() => {
    loadSubscribedSubreddits();
  }, []);

  useEffect(() => {
    if (subscribedSubreddits.length > 0) {
      loadPosts();
    }
  }, [subscribedSubreddits]);

  const loadSubscribedSubreddits = async () => {
    try {
      const saved = await storage.getSubscribedSubreddits();
      if (saved.length > 0) {
        setSubscribedSubreddits(saved);
      } else {
        // Charger depuis l'API si pas de cache
        const { subreddits } = await redditApi.getSubscribedSubreddits();
        const names = subreddits.map(s => s.display_name);
        setSubscribedSubreddits(names);
        await storage.setSubscribedSubreddits(names);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des subreddits:', error);
      Alert.alert('Erreur', 'Impossible de charger les subreddits');
    }
  };

  const loadPosts = async (refresh: boolean = false) => {
    if (subscribedSubreddits.length === 0) {
      setLoading(false);
      return;
    }

    try {
      if (refresh) {
        setRefreshing(true);
      } else if (!refresh && posts.length === 0) {
        setLoading(true);
      }

      const { posts: newPosts, after: newAfter } =
        await redditApi.getMultiSubredditPosts(
          subscribedSubreddits,
          'hot',
          25,
          refresh ? undefined : after,
        );

      if (refresh) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setAfter(newAfter);
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
      Alert.alert('Erreur', 'Impossible de charger les posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setAfter(undefined);
    loadPosts(true);
  }, [subscribedSubreddits]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && after) {
      setLoadingMore(true);
      loadPosts(false);
    }
  }, [after, loadingMore, subscribedSubreddits]);

  const handlePostPress = (post: RedditPost) => {
    navigation.navigate('PostDetail', {
      postId: post.id,
      subreddit: post.subreddit,
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={() => handlePostPress(item)} />
        )}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF4500"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#FF4500" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

