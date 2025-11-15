import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { RedditPost } from '../types/reddit';
import { redditApi } from '../services/redditApi';

interface PostCardProps {
  post: RedditPost;
  onPress: () => void;
  onUpdate?: (post: RedditPost) => void;
}

export default function PostCard({ post, onPress, onUpdate }: PostCardProps) {
  const [saved, setSaved] = useState(post.saved);
  const [likes, setLikes] = useState(post.likes);
  const [score, setScore] = useState(post.score);
  const [loading, setLoading] = useState(false);

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(diff / 86400);

    if (days > 0) {
      return `${days}j`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${Math.floor(diff / 60)}min`;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const handleUpvote = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const previousLikes = likes;
      const previousScore = score;

      if (likes === true) {
        // Retirer le vote
        await redditApi.removeVote(post.id);
        setLikes(null);
        setScore(previousScore - 1);
      } else {
        // Upvoter
        if (previousLikes === false) {
          setScore(previousScore + 2); // +1 pour retirer le downvote, +1 pour l'upvote
        } else {
          setScore(previousScore + 1);
        }
        await redditApi.upvote(post.id);
        setLikes(true);
      }

      if (onUpdate) {
        onUpdate({
          ...post,
          likes: likes === true ? null : true,
          score: likes === true ? score - 1 : score + (previousLikes === false ? 2 : 1),
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'upvote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownvote = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const previousLikes = likes;
      const previousScore = score;

      if (likes === false) {
        // Retirer le vote
        await redditApi.removeVote(post.id);
        setLikes(null);
        setScore(previousScore + 1);
      } else {
        // Downvoter
        if (previousLikes === true) {
          setScore(previousScore - 2); // -1 pour retirer l'upvote, -1 pour le downvote
        } else {
          setScore(previousScore - 1);
        }
        await redditApi.downvote(post.id);
        setLikes(false);
      }

      if (onUpdate) {
        onUpdate({
          ...post,
          likes: likes === false ? null : false,
          score: likes === false ? score + 1 : score - (previousLikes === true ? 2 : 1),
        });
      }
    } catch (error) {
      console.error('Erreur lors du downvote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (loading) return;

    try {
      setLoading(true);
      if (saved) {
        await redditApi.unsavePost(post.id);
        setSaved(false);
      } else {
        await redditApi.savePost(post.id);
        setSaved(true);
      }

      if (onUpdate) {
        onUpdate({ ...post, saved: !saved });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = () => {
    if (post.url && !post.is_video) {
      Linking.openURL(post.url);
    }
  };

  const getThumbnail = () => {
    if (post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default') {
      return post.thumbnail;
    }
    if (post.preview?.images?.[0]?.source?.url) {
      return post.preview.images[0].source.url.replace(/&amp;/g, '&');
    }
    return null;
  };

  const thumbnail = getThumbnail();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subreddit}>{post.subreddit_name_prefixed}</Text>
          <Text style={styles.author}>u/{post.author}</Text>
          <Text style={styles.time}>{formatTime(post.created_utc)}</Text>
        </View>

        <Text style={styles.title}>{post.title}</Text>

        {post.selftext ? (
          <Text style={styles.selftext} numberOfLines={3}>
            {post.selftext}
          </Text>
        ) : null}

        {thumbnail ? (
          <TouchableOpacity onPress={handleOpenLink} style={styles.thumbnailContainer}>
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.voteContainer}>
            <TouchableOpacity
              onPress={handleUpvote}
              disabled={loading}
              style={[styles.voteButton, likes === true && styles.voteButtonActive]}>
              <Text style={[styles.voteText, likes === true && styles.voteTextActive]}>
                ▲
              </Text>
            </TouchableOpacity>
            <Text style={styles.score}>{formatNumber(score)}</Text>
            <TouchableOpacity
              onPress={handleDownvote}
              disabled={loading}
              style={[styles.voteButton, likes === false && styles.voteButtonActive]}>
              <Text style={[styles.voteText, likes === false && styles.voteTextActive]}>
                ▼
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.commentButton} onPress={onPress}>
            <Text style={styles.commentText}>
              💬 {formatNumber(post.num_comments)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={styles.saveButton}>
            <Text style={[styles.saveText, saved && styles.saveTextActive]}>
              {saved ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subreddit: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF4500',
    marginRight: 8,
  },
  author: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  selftext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  thumbnailContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    padding: 4,
  },
  voteButtonActive: {
    opacity: 0.7,
  },
  voteText: {
    fontSize: 16,
    color: '#999',
  },
  voteTextActive: {
    color: '#FF4500',
  },
  score: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  commentButton: {
    flex: 1,
    marginLeft: 16,
  },
  commentText: {
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontSize: 18,
    color: '#999',
  },
  saveTextActive: {
    color: '#FF4500',
  },
});

