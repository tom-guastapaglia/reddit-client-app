# Reddit Client App

Application React Native permettant de parcourir et interagir avec le contenu Reddit des subreddits auxquels vous êtes abonné.

## Fonctionnalités

- 📱 **Parcourir les posts** : Affiche les posts des subreddits auxquels vous êtes abonné
- 💬 **Voir les commentaires** : Charge et affiche les commentaires d'un post
- ⭐ **Sauvegarder/Désauvegarder** : Sauvegardez vos posts favoris pour les retrouver plus tard
- ⬆️⬇️ **Voter** : Upvotez ou downvotez les posts et commentaires
- 🔍 **Rechercher** : Recherchez des posts dans vos communautés favorites
- 📋 **Gérer les subreddits** : Consultez la liste de vos subreddits abonnés

**Note importante** : Cette application n'automatise aucune action. Toutes les interactions (voter, sauvegarder, commenter) sont effectuées manuellement par l'utilisateur dans l'application.

## Prérequis

- Node.js >= 18
- npm ou yarn
- React Native CLI
- Pour iOS : Xcode et CocoaPods
- Pour Android : Android Studio et SDK Android

## Installation

1. **Cloner le dépôt** (si applicable) ou naviguer dans le dossier du projet

2. **Installer les dépendances** :
```bash
npm install
# ou
yarn install
```

3. **Configuration iOS** (si vous développez pour iOS) :
```bash
cd ios
pod install
cd ..
```

4. **Configuration des variables d'environnement** :

Créez un fichier `.env` à la racine du projet en copiant `env.example` :

```bash
cp env.example .env
```

Puis remplissez les valeurs dans `.env` avec les informations de votre application Reddit :

```env
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_REDIRECT_URI=redditclient://auth
REDDIT_USER_AGENT=reddit-client-app/1.0.0
```

**Note** : Pour iOS, vous devrez peut-être ajouter la configuration dans `ios/RedditClientApp/Info.plist` pour le schéma d'URL personnalisé. Pour Android, configurez le schéma dans `android/app/src/main/AndroidManifest.xml`.

### Obtenir les credentials Reddit

1. Allez sur https://www.reddit.com/prefs/apps
2. Cliquez sur "create another app..." ou "create app"
3. Remplissez le formulaire :
   - **Name** : Nom de votre application
   - **Type** : "web app" ou "installed app"
   - **Redirect URI** : `redditclient://auth` (pour mobile)
   - **Description** : Description de votre app
4. Notez le **Client ID** (sous le nom de l'app) et le **Client Secret**

## Structure du projet

```
reddit-client-app/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── PostCard.tsx
│   │   └── CommentItem.tsx
│   ├── navigation/          # Configuration de la navigation
│   │   └── AppNavigator.tsx
│   ├── screens/             # Écrans de l'application
│   │   ├── HomeScreen.tsx
│   │   ├── PostDetailScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── SubredditsScreen.tsx
│   │   ├── SavedScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/            # Services API
│   │   └── redditApi.ts
│   ├── types/               # Types TypeScript
│   │   ├── reddit.ts
│   │   └── navigation.ts
│   └── utils/               # Utilitaires
│       └── storage.ts
├── App.tsx                  # Point d'entrée de l'application
├── index.js                 # Point d'entrée React Native
├── package.json
├── tsconfig.json
└── babel.config.js
```

## Utilisation

### Démarrer le serveur Metro

```bash
npm start
# ou
yarn start
```

### Lancer sur iOS

```bash
npm run ios
# ou
yarn ios
```

### Lancer sur Android

```bash
npm run android
# ou
yarn android
```

## Authentification

L'application utilise OAuth2 pour s'authentifier avec Reddit. Lors du premier lancement, vous serez redirigé vers Reddit pour autoriser l'application. Une fois autorisée, l'application stockera votre token d'accès de manière sécurisée.

## API Reddit

L'application utilise l'API Reddit officielle pour :
- Récupérer les posts des subreddits
- Charger les commentaires
- Effectuer des votes (upvote/downvote)
- Sauvegarder/désauvegarder des posts
- Rechercher des posts
- Récupérer les informations de l'utilisateur

Toutes les actions sont effectuées via l'API Reddit et nécessitent une authentification OAuth2.

## Développement

### Vérification des types TypeScript

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Technologies utilisées

- **React Native** : Framework mobile
- **TypeScript** : Typage statique
- **React Navigation** : Navigation entre les écrans
- **Axios** : Client HTTP pour les appels API
- **AsyncStorage** : Stockage local pour les tokens et données
- **Reddit API** : API officielle de Reddit

## Limitations

- L'application nécessite une connexion Internet active
- L'authentification OAuth2 doit être configurée correctement
- Certaines fonctionnalités Reddit avancées ne sont pas implémentées (modération, création de posts, etc.)

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

Ce projet est en cours de développement.
