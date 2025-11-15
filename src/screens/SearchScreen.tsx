import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { RedditPost } from '../types/reddit';
import { redditApi } from '../services/redditApi';
import PostCard from '../components/PostCard';

type SearchScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Search'
>;
type SearchScreenRouteProp = RouteProp<RootStackParamList, 'Search'>;

export default function SearchScreen() {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const route = useRoute<SearchScreenRouteProp>();
  const initialSubreddit = route.params?.subreddit;

  const [query, setQuery] = useState('');
  const [subreddit, setSubreddit] = useState(initialSubreddit || '');
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [after, setAfter] = useState<string | undefined>();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un terme de recherche');
      return;
    }

    try {
      setLoading(true);
      const { posts: searchPosts, after: newAfter } =
        await redditApi.searchPosts(
          query,
          subreddit || undefined,
          'relevance',
          25,
        );

      setPosts(searchPosts);
      setAfter(newAfter);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      Alert.alert('Erreur', 'Impossible d\'effectuer la recherche');
    } finally {
      setLoading(false);
    }
  }, [query, subreddit]);

  const handleLoadMore = useCallback(async () => {
    if (!loading && after) {
      try {
        setLoading(true);
        const { posts: morePosts, after: newAfter } =
          await redditApi.searchPosts(
            query,
            subreddit || undefined,
            'relevance',
            25,
            after,
          );

        setPosts(prev => [...prev, ...morePosts]);
        setAfter(newAfter);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [query, subreddit, after, loading]);

  const handlePostPress = (post: RedditPost) => {
    navigation.navigate('PostDetail', {
      postId: post.id,
      subreddit: post.subreddit,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Rechercher..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        {subreddit ? (
          <View style={styles.subredditContainer}>
            <Text style={styles.subredditLabel}>r/</Text>
            <TextInput
              style={styles.subredditInput}
              placeholder="subreddit (optionnel)"
              placeholderTextColor="#999"
              value={subreddit}
              onChangeText={setSubreddit}
            />
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}>
          <Text style={styles.searchButtonText}>Rechercher</Text>
        </TouchableOpacity>
      </View>

      {loading && posts.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF4500" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <PostCard post={item} onPress={() => handlePostPress(item)} />
          )}
          keyExtractor={item => item.id}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Aucun résultat. Effectuez une recherche pour commencer.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  subredditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subredditLabel: {
    fontSize: 16,
    color: '#FF4500',
    fontWeight: 'bold',
    marginRight: 4,
  },
  subredditInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#FF4500',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

