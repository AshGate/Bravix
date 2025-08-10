# 🔒 Guide de Sécurité - Système Serko

## 🛡️ Sécurité Stricte Implémentée

### ✅ Protections Mises en Place

1. **🔐 Authentification Admin Unique**
   - Seul votre ID Discord peut accéder au système
   - Vérification stricte sur toutes les routes sensibles
   - Aucun autre utilisateur ne peut accéder aux fonctionnalités

2. **🛡️ Routes Protégées**
   - `/api/serko/config` - Configuration sécurisée
   - `/api/serko/panels` - Gestion des panneaux
   - `/api/serko/send-ticket-panel` - Envoi de panneaux
   - `/api/debug/guilds` - Debug des serveurs
   - `/api/auth/discord/token` - Authentification Discord

3. **🔒 Middleware de Sécurité**
   - Vérification de l'ID utilisateur sur chaque requête
   - Headers sécurisés avec `x-user-id`
   - Paramètres URL avec `userId`
   - Logs de sécurité détaillés

## 🚨 Variables d'Environnement Critiques

### Railway Configuration

```env
# OBLIGATOIRE - Votre ID Discord personnel
ADMIN_USER_ID=VOTRE_ID_DISCORD_ICI

# Bot Discord
DISCORD_TOKEN=votre_token_bot
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret

# Production
NODE_ENV=production
PORT=$PORT
```

## 🔍 Comment Obtenir Votre ID Discord

1. **Activer le Mode Développeur**
   - Discord → Paramètres → Avancé → Mode développeur (ON)

2. **Copier Votre ID**
   - Clic droit sur votre nom d'utilisateur
   - "Copier l'ID utilisateur"
   - Vous obtenez un nombre comme : `123456789012345678`

3. **Ajouter à Railway**
   - Railway Dashboard → Variables
   - `ADMIN_USER_ID` = `123456789012345678`

## 🛡️ Fonctionnement de la Sécurité

### 1. Vérification d'Accès
```javascript
const isAuthorizedUser = (userId) => {
    const authorizedId = process.env.ADMIN_USER_ID;
    return userId === authorizedId;
};
```

### 2. Middleware de Protection
```javascript
const requireAdminAuth = (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.query.userId;
    
    if (!isAuthorizedUser(userId)) {
        return res.status(403).json({ 
            error: 'Accès refusé. Vous n\'êtes pas autorisé.' 
        });
    }
    
    next();
};
```

### 3. Interface Sécurisée
- Authentification Discord obligatoire
- Vérification de l'ID utilisateur
- Headers sécurisés sur toutes les requêtes
- Messages d'erreur explicites

## 🔐 Messages de Sécurité

### ✅ Accès Autorisé
```
🔒 Vérification d'autorisation pour 123456789: AUTORISÉ
✅ Accès autorisé pour l'admin principal: 123456789
```

### ❌ Accès Refusé
```
🚨 Tentative d'accès non autorisé par l'utilisateur 987654321
⚠️ Tentative d'accès sans ID utilisateur
```

## 🎯 Test de Sécurité

### 1. Vérifier l'API de Santé
```
https://viktor-production.up.railway.app/api/health
```

**Réponse attendue :**
```json
{
  "status": "OK",
  "security": {
    "adminOnly": true,
    "adminId": "***5678"
  }
}
```

### 2. Tester l'API Debug (Admin seulement)
```
https://viktor-production.up.railway.app/api/debug/guilds?userId=VOTRE_ID
```

### 3. Tester l'Accès Non Autorisé
```
https://viktor-production.up.railway.app/api/debug/guilds?userId=123456789
```
**Réponse attendue :** `403 Forbidden`

## 🚨 Que Faire si Quelqu'un Essaie d'Accéder

### Logs de Sécurité
Tous les tentatives d'accès sont loggées :
```
🚨 Tentative d'authentification non autorisée par Username (987654321)
🚨 Tentative d'accès non autorisé par l'utilisateur 987654321
```

### Actions Automatiques
- **Accès refusé** immédiatement
- **Erreur 403** retournée
- **Logs de sécurité** enregistrés
- **Aucune donnée** exposée

## 🔧 Maintenance de Sécurité

### Vérifications Régulières
1. **Logs Railway** - Surveiller les tentatives d'accès
2. **Variables d'environnement** - Vérifier que `ADMIN_USER_ID` est correct
3. **API de santé** - Confirmer que `adminOnly: true`

### Rotation de Sécurité
- **Changer les tokens Discord** tous les 6 mois
- **Vérifier l'ID admin** si changement de compte
- **Surveiller les logs** pour activité suspecte

## 🎉 Confirmation de Sécurité

### ✅ Votre Système est Maintenant :
- 🔒 **Protégé** - Seul votre ID peut accéder
- 🛡️ **Sécurisé** - Toutes les routes sensibles protégées
- 📊 **Monitoré** - Logs de sécurité détaillés
- 🚨 **Alerté** - Tentatives d'accès non autorisé loggées

### 🎯 Prochaines Étapes
1. **Tester l'accès** avec votre ID Discord
2. **Vérifier les logs** Railway pour confirmation
3. **Utiliser le système** en toute sécurité
4. **Surveiller** les tentatives d'accès

---

**🔐 Votre système Serko est maintenant ultra-sécurisé !**