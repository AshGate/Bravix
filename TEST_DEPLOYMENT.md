# 🧪 Test du Déploiement Railway

## ✅ Étape 1 : API de Base - RÉUSSIE
Votre URL `https://viktor-production.up.railway.app/` fonctionne !

## 🔍 Étape 2 : Tests à Effectuer

### 1. **Tester l'API de Santé**
Visitez : `https://viktor-production.up.railway.app/api/health`

**Résultat attendu :**
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "bot": {
    "connected": true,
    "user": "VotreBot#1234",
    "guilds": 1,
    "ping": 50
  }
}
```

### 2. **Vérifier les Serveurs Disponibles**
Visitez : `https://viktor-production.up.railway.app/api/debug/guilds`

**Cela vous montrera :**
- Tous les serveurs où votre bot est présent
- Les IDs exacts des serveurs
- Le nombre de membres

### 3. **Tester dans Discord**
Dans votre serveur Discord, tapez :
```
!panel [ID_DU_SERVEUR]
```

**Le bot devrait :**
- Supprimer votre message
- Envoyer un embed avec le lien Railway
- Le lien devrait pointer vers votre URL Railway

### 4. **Tester le Panneau Web**
Cliquez sur le lien généré par le bot, cela devrait :
- Vous rediriger vers la page d'authentification Discord
- Après connexion, vous donner accès au panneau Serko

## 🚨 Si Problèmes

### Bot non connecté ?
1. Vérifiez les variables d'environnement dans Railway
2. Consultez les logs Railway
3. Assurez-vous que `DISCORD_TOKEN` est correct

### Serveur non trouvé ?
1. Utilisez `/api/debug/guilds` pour voir les serveurs disponibles
2. Vérifiez que le bot est bien sur votre serveur
3. Copiez l'ID exact depuis l'API debug

### Erreur de permissions ?
1. Réinvitez le bot avec toutes les permissions
2. Vérifiez que vous êtes admin du serveur
3. Utilisez `/deploy` dans Discord pour déployer les commandes

## 📋 Checklist de Validation

- [ ] API de base fonctionne (`/`)
- [ ] API de santé fonctionne (`/api/health`)
- [ ] API debug fonctionne (`/api/debug/guilds`)
- [ ] Bot répond dans Discord (`!panel`)
- [ ] Lien Railway généré correctement
- [ ] Authentification Discord fonctionne
- [ ] Panneau Serko accessible

## 🎯 Prochaines Étapes

Une fois tous les tests validés :
1. **Configurez votre serveur** via le panneau Serko
2. **Créez des panneaux de tickets** personnalisés
3. **Testez le système de tickets** complet
4. **Invitez le bot** sur d'autres serveurs si nécessaire

---

**🚀 Votre déploiement Railway est opérationnel !**