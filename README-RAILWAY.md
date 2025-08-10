# 🚀 Guide de Déploiement Railway - Bot Discord Serko

## 📋 Prérequis

1. **Compte Railway** : [Créer un compte](https://railway.app)
2. **Bot Discord configuré** avec token et permissions
3. **Variables d'environnement** prêtes

## 🔧 Étapes de Déploiement

### 1. Préparer le Projet

Le projet est maintenant configuré pour Railway avec :
- ✅ `railway.json` pour la configuration
- ✅ `Procfile` pour le démarrage
- ✅ Script `start` dans `package.json`
- ✅ Gestion des variables d'environnement
- ✅ Configuration CORS pour Railway

### 2. Déployer sur Railway

#### Option A : Via GitHub (Recommandé)

1. **Pusher le code sur GitHub**
```bash
git add .
git commit -m "Préparation pour Railway"
git push origin main
```

2. **Connecter à Railway**
- Aller sur [railway.app](https://railway.app)
- Cliquer sur "New Project"
- Sélectionner "Deploy from GitHub repo"
- Choisir votre repository

#### Option B : Via Railway CLI

1. **Installer Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Se connecter et déployer**
```bash
railway login
railway init
railway up
```

### 3. Configurer les Variables d'Environnement

Dans le dashboard Railway, aller dans **Variables** et ajouter :

```env
# Bot Configuration (OBLIGATOIRE)
DISCORD_TOKEN=votre_token_bot_discord
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret
ADMIN_USER_ID=votre_id_discord

# Configuration Production
NODE_ENV=production
PORT=$PORT

# Variables pour le client (optionnel)
VITE_DISCORD_CLIENT_ID=votre_client_id
```

### 4. Variables d'Environnement Automatiques

Railway fournit automatiquement :
- `PORT` : Port assigné par Railway
- `RAILWAY_STATIC_URL` : URL de votre application
- `RAILWAY_PUBLIC_DOMAIN` : Domaine public

### 5. Configuration des Permissions Discord

Assurez-vous que votre bot a ces permissions :
- ✅ Read Messages/View Channels
- ✅ Send Messages
- ✅ Manage Messages
- ✅ Embed Links
- ✅ Attach Files
- ✅ Read Message History
- ✅ Add Reactions
- ✅ Use Slash Commands
- ✅ Manage Channels
- ✅ Manage Roles

## 🔍 Vérification du Déploiement

### 1. Vérifier les Logs
Dans Railway, aller dans **Deployments** → **View Logs**

Vous devriez voir :
```
🚀 Démarrage du système Serko...
✅ Variables d'environnement vérifiées
📋 X commandes chargées
🎯 Événements chargés
🌐 Serveur web démarré sur le port XXXX
🤖 Connexion du bot Discord...
🤖 Bot connecté en tant que VotreBot#1234!
🎉 Système Serko démarré avec succès !
```

### 2. Tester l'API
Accéder à `https://votre-app.railway.app/api/health`

Réponse attendue :
```json
{
  "status": "OK",
  "message": "Bot Discord Serko - Système de Tickets",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "bot": {
    "connected": true,
    "user": "VotreBot#1234",
    "guilds": 1,
    "ping": 50
  }
}
```

### 3. Tester les Commandes Discord
Dans votre serveur Discord :
```
/deploy
/ticket setup
!panel [ID_SERVEUR]
```

## 🐛 Résolution de Problèmes

### Erreur : "Bot non connecté"
- ✅ Vérifier `DISCORD_TOKEN` dans les variables Railway
- ✅ Vérifier que le token est valide
- ✅ Vérifier les logs pour les erreurs de connexion

### Erreur : "Port déjà utilisé"
- ✅ Railway gère automatiquement le port via `$PORT`
- ✅ Ne pas définir `WEB_PORT` manuellement

### Erreur : "CORS"
- ✅ Le code gère automatiquement les domaines Railway
- ✅ Vérifier `RAILWAY_STATIC_URL` dans les logs

### Erreur : "Commandes non déployées"
- ✅ Utiliser `/deploy` après le premier déploiement
- ✅ Vérifier les permissions du bot

## 📊 Monitoring

### Logs en Temps Réel
```bash
railway logs --follow
```

### Métriques
- CPU et RAM dans le dashboard Railway
- Logs d'erreurs automatiques
- Uptime monitoring

## 🔄 Mises à Jour

### Déploiement Automatique
Railway redéploie automatiquement à chaque push sur la branche principale.

### Déploiement Manuel
```bash
railway up
```

## 🌐 Domaine Personnalisé

1. Dans Railway, aller dans **Settings** → **Domains**
2. Ajouter votre domaine personnalisé
3. Configurer les DNS selon les instructions

## 💾 Sauvegarde

⚠️ **Important** : Ce bot utilise le stockage en mémoire. Pour la production, considérez :
- Base de données PostgreSQL (Railway addon)
- Redis pour le cache
- Stockage persistant pour les transcripts

## 🎯 Optimisations Production

1. **Base de données** : Ajouter PostgreSQL
2. **Cache** : Ajouter Redis
3. **Monitoring** : Intégrer Sentry
4. **Logs** : Configurer un service de logs
5. **Backup** : Automatiser les sauvegardes

## 📞 Support

En cas de problème :
1. Vérifier les logs Railway
2. Tester l'API de santé
3. Vérifier les variables d'environnement
4. Consulter la documentation Railway

---

✅ **Votre bot Discord Serko est maintenant déployé sur Railway !**