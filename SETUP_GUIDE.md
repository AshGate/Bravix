# 🚀 Guide de Configuration - Bot Discord Serko

## 📋 Étapes de Configuration

### 1. 🤖 Créer une Application Discord

1. **Allez sur le Discord Developer Portal :**
   - Visitez : https://discord.com/developers/applications
   - Connectez-vous avec votre compte Discord

2. **Créer une nouvelle application :**
   - Cliquez sur "New Application"
   - Donnez un nom à votre bot (ex: "Serko Tickets")
   - Cliquez sur "Create"

### 2. 🔑 Obtenir les Informations Nécessaires

#### **A. Client ID (Application ID)**
1. Dans votre application, allez dans l'onglet "General Information"
2. Copiez l'**Application ID** (c'est votre `DISCORD_CLIENT_ID`)

#### **B. Token du Bot**
1. Allez dans l'onglet "Bot" (dans le menu de gauche)
2. Cliquez sur "Add Bot" si ce n'est pas déjà fait
3. Dans la section "Token", cliquez sur "Copy" pour copier le token
4. ⚠️ **IMPORTANT** : Ne partagez JAMAIS ce token !

#### **C. Votre ID Discord Personnel**
1. Dans Discord, activez le "Mode Développeur" :
   - Paramètres → Avancé → Mode développeur (ON)
2. Clic droit sur votre nom d'utilisateur
3. Sélectionnez "Copier l'ID utilisateur"

### 3. 📝 Configurer le fichier .env

Remplacez les valeurs dans votre fichier `.env` :

```env
# Bot Configuration (REQUIS)
DISCORD_TOKEN=YOUR_REAL_BOT_TOKEN_HERE
DISCORD_CLIENT_ID=YOUR_CLIENT_ID_HERE

# Admin User ID (REQUIS - votre ID Discord personnel)
ADMIN_USER_ID=YOUR_DISCORD_USER_ID_HERE

# Web Dashboard
WEB_PORT=3001
```

### 4. 🔗 Inviter le Bot sur votre Serveur

1. **Générer le lien d'invitation :**
   - Dans le Developer Portal, allez dans "OAuth2" → "URL Generator"
   - Cochez "bot" dans les scopes
   - Cochez ces permissions dans "Bot Permissions" :
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

2. **Inviter le bot :**
   - Copiez l'URL générée
   - Ouvrez-la dans votre navigateur
   - Sélectionnez votre serveur Discord
   - Autorisez les permissions

### 5. 🚀 Démarrer le Bot

```bash
npm run dev
```

Vous devriez voir :
```
🚀 Démarrage du système Serko...
✅ Variables d'environnement vérifiées
📋 X commandes chargées
🎯 Événements chargés
🌐 Serveur web démarré sur http://localhost:3001
🤖 Bot connecté en tant que VotreBot#1234!
🎉 Système Serko démarré avec succès !
```

### 6. 🎯 Tester le Système

1. **Dans Discord, tapez :**
   ```
   /deploy
   ```
   (Pour déployer les commandes slash)

2. **Créer un panneau de tickets :**
   ```
   /ticket setup
   ```

3. **Accéder au panneau web :**
   ```
   !panel [ID_DE_VOTRE_SERVEUR]
   ```

## 🔧 Résolution de Problèmes

### ❌ "DISCORD_TOKEN manquant"
- Vérifiez que vous avez bien copié le token depuis le Developer Portal
- Assurez-vous qu'il n'y a pas d'espaces avant/après le token

### ❌ "DISCORD_CLIENT_ID manquant"
- Copiez l'Application ID depuis l'onglet "General Information"
- C'est un nombre de 18-19 chiffres

### ❌ "Bot non connecté"
- Vérifiez que le token est correct
- Assurez-vous que le bot est invité sur votre serveur
- Vérifiez les permissions du bot

### ❌ "Serveur non trouvé"
- Vérifiez que l'ID du serveur est correct
- Assurez-vous que le bot est présent sur le serveur
- Vérifiez que vous avez les permissions d'administrateur

## 📞 Support

Si vous avez des problèmes :
1. Vérifiez les logs dans la console
2. Testez l'API de santé : http://localhost:3001/api/health
3. Vérifiez que toutes les variables d'environnement sont définies

## 🎉 Fonctionnalités Disponibles

Une fois configuré, vous pourrez :
- ✅ Créer des tickets avec `/ticket create`
- ✅ Configurer le système avec `/config`
- ✅ Créer des embeds personnalisés avec `/embed`
- ✅ Utiliser le panneau web Serko
- ✅ Créer des panneaux de tickets personnalisés
- ✅ Gérer les participants des tickets
- ✅ Voir les statistiques en temps réel