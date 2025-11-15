import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { RedditSubreddit } from '../types/reddit';
import { redditApi } from '../services/redditApi';
import { storage } from '../utils/storage';

type SubredditsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

export default function SubredditsScreen() {
  const navigation = useNavigation<SubredditsScreenNavigationProp>();
  const [subreddits, setSubreddits] = useState<RedditSubreddit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubreddits();
  }, []);

  const loadSubreddits = async () => {
    try {
      setLoading(true);
      const { subreddits: subredditsData } =
        await redditApi.getSubscribedSubreddits(100);

      setSubreddits(subredditsData);
      const names = subredditsData.map(s => s.display_name);
      await storage.setSubscribedSubreddits(names);
    } catch (error) {
      console.error('Erreur lors du chargement des subreddits:', error);
      Alert.alert('Erreur', 'Impossible de charger les subreddits');
    } finally {
      setLoading(false);
    }
  };

  const handleSubredditPress = (subreddit: RedditSubreddit) => {
    // Navigation vers la recherche avec le subreddit pré-rempli
    navigation.navigate('Search', { subreddit: subreddit.display_name });
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
        data={subreddits}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.subredditItem}
            onPress={() => handleSubredditPress(item)}>
            <View style={styles.subredditInfo}>
              <Text style={styles.subredditName}>
                {item.display_name_prefixed}
              </Text>
              <Text style={styles.subredditDescription} numberOfLines={2}>
                {item.public_description || item.description}
              </Text>
              <Text style={styles.subredditSubscribers}>
                {item.subscribers.toLocaleString()} membres
              </Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.display_name}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Aucun subreddit abonné
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
  subredditItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subredditInfo: {
    flex: 1,
  },
  subredditName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 4,
  },
  subredditDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  subredditSubscribers: {
    fontSize: 12,
    color: '#999',
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

