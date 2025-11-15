import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { RedditPost } from '../types/reddit';
import { redditApi } from '../services/redditApi';
import PostCard from '../components/PostCard';

type SavedScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

export default function SavedScreen() {
  const navigation = useNavigation<SavedScreenNavigationProp>();
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [after, setAfter] = useState<string | undefined>();

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (!refresh && posts.length === 0) {
        setLoading(true);
      }

      const { posts: savedPosts, after: newAfter } =
        await redditApi.getSavedPosts(25, refresh ? undefined : after);

      if (refresh) {
        setPosts(savedPosts);
      } else {
        setPosts(prev => [...prev, ...savedPosts]);
      }

      setAfter(newAfter);
    } catch (error) {
      console.error('Erreur lors du chargement des posts sauvegardés:', error);
      Alert.alert('Erreur', 'Impossible de charger les posts sauvegardés');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setAfter(undefined);
    loadSavedPosts(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && after) {
      setLoadingMore(true);
      loadSavedPosts(false);
    }
  }, [after, loadingMore]);

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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aucun post sauvegardé
            </Text>
          </View>
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
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

