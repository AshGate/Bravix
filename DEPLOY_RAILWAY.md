# 🚀 Guide de Déploiement Railway - Bot Discord Serko

## 📋 Étapes de Déploiement

### 1. 🔗 Créer un Projet Railway

1. **Aller sur Railway :**
   - Visitez : https://railway.app
   - Connectez-vous avec GitHub

2. **Créer un nouveau projet :**
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository

### 2. ⚙️ Configuration des Variables d'Environnement

Dans Railway, allez dans **Variables** et ajoutez :

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

### 3. 🔧 Variables Automatiques Railway

Railway fournit automatiquement :
- `PORT` : Port assigné par Railway
- `RAILWAY_STATIC_URL` : URL de votre application
- `RAILWAY_PUBLIC_DOMAIN` : Domaine public

### 4. 🚀 Déploiement

1. **Push votre code sur GitHub :**
   ```bash
   git add .
   git commit -m "Préparation pour Railway"
   git push origin main
   ```

2. **Railway déploie automatiquement** dès que vous connectez le repo

### 5. 🔍 Obtenir l'URL de votre Application

1. **Dans Railway Dashboard :**
   - Allez dans votre projet
   - Onglet "Settings" → "Domains"
   - Votre URL sera quelque chose comme : `https://votre-app-name.railway.app`

2. **Ou utilisez l'API de debug :**
   ```
   https://votre-app.railway.app/api/debug/guilds
   ```

### 6. 🎯 Tester le Déploiement

1. **Vérifier l'API de santé :**
   ```
   https://votre-app.railway.app/api/health
   ```

2. **Vérifier les serveurs disponibles :**
   ```
   https://votre-app.railway.app/api/debug/guilds
   ```

3. **Tester dans Discord :**
   ```
   !panel [ID_SERVEUR]
   ```

## 🔧 Résolution de Problèmes

### ❌ "Unknown Guild"
1. Vérifiez l'API debug : `/api/debug/guilds`
2. Assurez-vous que le bot est sur votre serveur
3. Vérifiez les permissions du bot

### ❌ "Bot non connecté"
1. Vérifiez `DISCORD_TOKEN` dans les variables Railway
2. Consultez les logs Railway
3. Vérifiez que le token est valide

### ❌ "Site inaccessible"
1. Attendez quelques minutes après le déploiement
2. Vérifiez les logs Railway pour les erreurs
3. Assurez-vous que `PORT=$PORT` est défini

## 📊 Monitoring

### Logs en Temps Réel
Dans Railway Dashboard → **Deployments** → **View Logs**

### Métriques
- CPU et RAM dans le dashboard Railway
- Logs d'erreurs automatiques
- Uptime monitoring

## 🎉 Succès !

Une fois déployé, votre bot sera accessible via :
- **URL principale :** `https://votre-app.railway.app`
- **API de santé :** `https://votre-app.railway.app/api/health`
- **Debug serveurs :** `https://votre-app.railway.app/api/debug/guilds`
- **Panneau Serko :** Via `!panel [ID_SERVEUR]` dans Discord

---

**🚀 Votre bot Discord Serko est maintenant déployé sur Railway !**