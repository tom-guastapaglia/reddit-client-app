import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { RedditPost, RedditComment } from '../types/reddit';
import { redditApi } from '../services/redditApi';
import PostCard from '../components/PostCard';
import CommentItem from '../components/CommentItem';

type PostDetailScreenRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

export default function PostDetailScreen() {
  const route = useRoute<PostDetailScreenRouteProp>();
  const { postId, subreddit } = route.params;

  const [post, setPost] = useState<RedditPost | null>(null);
  const [comments, setComments] = useState<RedditComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPostAndComments();
  }, [postId, subreddit]);

  const loadPostAndComments = async () => {
    try {
      setLoading(true);
      const { post: postData, comments: commentsData } =
        await redditApi.getPostComments(subreddit, postId, 'best');

      setPost(postData);
      setComments(commentsData);
    } catch (error) {
      console.error('Erreur lors du chargement du post:', error);
      Alert.alert('Erreur', 'Impossible de charger le post');
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost: RedditPost) => {
    setPost(updatedPost);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centerContainer}>
        <Text>Post introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <PostCard post={post} onPress={() => {}} onUpdate={handlePostUpdate} />
      <View style={styles.commentsContainer}>
        <Text style={styles.commentsTitle}>
          Commentaires ({comments.length})
        </Text>
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </View>
    </ScrollView>
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
  commentsContainer: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
});

