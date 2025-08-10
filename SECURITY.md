# 🔒 Guide de Sécurité - Bot Discord Serko

## ⚠️ IMPORTANT : Sécurité des Tokens

### 🚨 JAMAIS faire cela :
- ❌ Commiter le fichier `.env` dans Git
- ❌ Partager vos tokens Discord dans le code
- ❌ Publier vos tokens sur GitHub/GitLab
- ❌ Envoyer vos tokens par email/chat
- ❌ Stocker les tokens en dur dans le code

### ✅ Bonnes Pratiques :

#### 1. Variables d'Environnement
```bash
# Toujours utiliser des variables d'environnement
DISCORD_TOKEN=your_secret_token_here
```

#### 2. Fichier .env
- ✅ Créer un fichier `.env` local
- ✅ Ajouter `.env` au `.gitignore`
- ✅ Utiliser `.env.example` comme template

#### 3. Déploiement Sécurisé
- ✅ Configurer les variables sur Railway/Heroku
- ✅ Ne jamais exposer les tokens côté client
- ✅ Utiliser HTTPS en production

## 🔐 Configuration Sécurisée

### Étape 1 : Créer le fichier .env
```bash
# Copier le template
cp .env.example .env

# Éditer avec vos vraies valeurs
nano .env
```

### Étape 2 : Remplir les Variables
```env
# Remplacer par vos vraies valeurs
DISCORD_TOKEN=YOUR_REAL_BOT_TOKEN_HERE
DISCORD_CLIENT_ID=YOUR_CLIENT_ID_HERE
DISCORD_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
ADMIN_USER_ID=YOUR_DISCORD_USER_ID_HERE
```

### Étape 3 : Vérifier .gitignore
```bash
# Vérifier que .env est ignoré
git status
# .env ne doit PAS apparaître dans les fichiers à commiter
```

## 🌐 Déploiement sur Railway

### Configuration des Variables
1. **Aller dans Railway Dashboard**
2. **Sélectionner votre projet**
3. **Onglet "Variables"**
4. **Ajouter chaque variable individuellement :**

```
DISCORD_TOKEN = votre_token_secret
DISCORD_CLIENT_ID = votre_client_id
DISCORD_CLIENT_SECRET = votre_client_secret
ADMIN_USER_ID = votre_user_id
NODE_ENV = production
```

### ⚠️ Vérifications de Sécurité

#### Avant de Déployer :
```bash
# 1. Vérifier que .env n'est pas dans Git
git ls-files | grep .env
# Résultat attendu : rien (fichier ignoré)

# 2. Vérifier le .gitignore
cat .gitignore | grep .env
# Résultat attendu : .env

# 3. Vérifier qu'aucun token n'est dans le code
grep -r "YOUR_TOKEN" src/
# Résultat attendu : rien trouvé
```

## 🔍 Détection de Fuites

### Outils de Vérification
```bash
# Installer git-secrets
npm install -g git-secrets

# Scanner le repository
git secrets --scan

# Scanner l'historique
git secrets --scan-history
```

### Patterns à Détecter
- Tokens Discord : `MTIzNDU2.*`
- Client Secrets : `[a-zA-Z0-9]{32}`
- IDs Discord : `[0-9]{17,19}`

## 🚨 En Cas de Fuite

### Si vous avez exposé un token :

#### 1. Révoquer Immédiatement
- Aller sur [Discord Developer Portal](https://discord.com/developers/applications)
- Sélectionner votre application
- **Bot** → **Reset Token**
- Copier le nouveau token

#### 2. Mettre à Jour
```bash
# Mettre à jour .env local
DISCORD_TOKEN=nouveau_token_ici

# Mettre à jour Railway
# Dashboard → Variables → DISCORD_TOKEN → nouveau_token_ici
```

#### 3. Nettoyer l'Historique Git
```bash
# Si le token est dans l'historique Git
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch .env' \
--prune-empty --tag-name-filter cat -- --all

# Forcer le push
git push origin --force --all
```

## 🛡️ Sécurité Avancée

### Rotation des Tokens
- ✅ Changer les tokens régulièrement (tous les 3-6 mois)
- ✅ Utiliser des tokens différents pour dev/prod
- ✅ Monitorer l'utilisation des tokens

### Permissions Minimales
```javascript
// Donner seulement les permissions nécessaires
const permissions = [
    'ViewChannel',
    'SendMessages',
    'ManageMessages',
    'EmbedLinks',
    'AttachFiles',
    'ReadMessageHistory',
    'AddReactions',
    'UseSlashCommands',
    'ManageChannels',
    'ManageRoles'
];
```

### Validation des Entrées
```javascript
// Toujours valider les entrées utilisateur
const validateGuildId = (guildId) => {
    return /^\d{17,19}$/.test(guildId);
};

const validateUserId = (userId) => {
    return /^\d{17,19}$/.test(userId);
};
```

## 📋 Checklist de Sécurité

### Avant Déploiement :
- [ ] `.env` est dans `.gitignore`
- [ ] Aucun token dans le code source
- [ ] Variables configurées sur Railway
- [ ] Permissions Discord minimales
- [ ] HTTPS activé en production
- [ ] Logs ne contiennent pas de tokens

### Après Déploiement :
- [ ] Bot fonctionne correctement
- [ ] API de santé répond
- [ ] Aucune erreur dans les logs
- [ ] Tokens non exposés dans les réponses

## 🔗 Ressources

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Railway Documentation](https://docs.railway.app)
- [OWASP Security Guidelines](https://owasp.org)
- [Git Secrets](https://github.com/awslabs/git-secrets)

---

## 🆘 Support Sécurité

En cas de problème de sécurité :
1. **Révoquer immédiatement** tous les tokens
2. **Changer tous les mots de passe**
3. **Vérifier les logs** pour activité suspecte
4. **Contacter Discord** si nécessaire

**⚠️ La sécurité est CRITIQUE - Ne jamais compromettre sur ce point !**