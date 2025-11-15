import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { redditApi } from '../services/redditApi';
import { storage } from '../utils/storage';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const authUrl = redditApi.getAuthorizationUrl();
      
      // Ouvrir le navigateur pour l'authentification
      const canOpen = await Linking.canOpenURL(authUrl);
      if (canOpen) {
        await Linking.openURL(authUrl);
        // Note: Dans une vraie application, vous devriez utiliser un deep link
        // pour capturer le code de retour et compléter l'authentification
        Alert.alert(
          'Authentification',
          'Après avoir autorisé l\'application, vous serez redirigé vers l\'app.',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le navigateur');
      }
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'authentification');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur est déjà connecté
  React.useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getAccessToken();
      if (token) {
        // L'utilisateur est déjà connecté, naviguer vers l'écran principal
        // Note: Vous devriez vérifier si le token est toujours valide
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    };
    checkAuth();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reddit Client</Text>
        <Text style={styles.subtitle}>
          Connectez-vous avec votre compte Reddit pour commencer
        </Text>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Se connecter avec Reddit</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          L'application nécessite l'autorisation pour lire vos subreddits et
          interagir avec le contenu.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#FF4500',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

