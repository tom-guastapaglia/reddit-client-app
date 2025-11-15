import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RedditComment } from '../types/reddit';
import { redditApi } from '../services/redditApi';

interface CommentItemProps {
  comment: RedditComment;
  depth?: number;
}

export default function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  const [likes, setLikes] = useState(comment.likes);
  const [score, setScore] = useState(comment.score);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
        await redditApi.removeVote(comment.id, true);
        setLikes(null);
        setScore(previousScore - 1);
      } else {
        if (previousLikes === false) {
          setScore(previousScore + 2);
        } else {
          setScore(previousScore + 1);
        }
        await redditApi.upvote(comment.id, true);
        setLikes(true);
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
        await redditApi.removeVote(comment.id, true);
        setLikes(null);
        setScore(previousScore + 1);
      } else {
        if (previousLikes === true) {
          setScore(previousScore - 2);
        } else {
          setScore(previousScore - 1);
        }
        await redditApi.downvote(comment.id, true);
        setLikes(false);
      }
    } catch (error) {
      console.error('Erreur lors du downvote:', error);
    } finally {
      setLoading(false);
    }
  };

  // Si le commentaire est une chaîne "more", on ne peut pas l'afficher
  if (typeof comment === 'string' || !comment.body) {
    return null;
  }

  // Si le commentaire est supprimé
  if (comment.body === '[deleted]' || comment.body === '[removed]') {
    return (
      <View style={[styles.container, { marginLeft: depth * 16 }]}>
        <Text style={styles.deletedText}>Commentaire supprimé</Text>
      </View>
    );
  }

  const replies = Array.isArray(comment.replies)
    ? comment.replies
    : [];

  return (
    <View style={[styles.container, { marginLeft: depth * 16 }]}>
      <TouchableOpacity
        onPress={() => setCollapsed(!collapsed)}
        style={styles.header}>
        <View style={styles.authorRow}>
          <Text style={styles.author}>
            {comment.is_submitter && '👤 '}u/{comment.author}
          </Text>
          {comment.stickied && (
            <Text style={styles.stickied}>📌 Épinglé</Text>
          )}
          <Text style={styles.time}>{formatTime(comment.created_utc)}</Text>
        </View>
      </TouchableOpacity>

      {!collapsed && (
        <>
          <Text style={styles.body}>{comment.body}</Text>

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
          </View>

          {replies.length > 0 && (
            <View style={styles.replies}>
              {replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  header: {
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  author: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 8,
  },
  stickied: {
    fontSize: 10,
    color: '#FF4500',
    marginRight: 8,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 10,
    color: '#999',
  },
  body: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  deletedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 14,
    color: '#999',
  },
  voteTextActive: {
    color: '#FF4500',
  },
  score: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 8,
    minWidth: 30,
    textAlign: 'center',
  },
  replies: {
    marginTop: 8,
  },
});

