# 🆔 Comment Obtenir l'ID de Votre Serveur Discord

## 📋 Étapes Simples :

### 1. **Activer le Mode Développeur**
- Ouvrir Discord
- Aller dans **Paramètres utilisateur** (roue dentée)
- **Avancé** → Activer **Mode développeur**

### 2. **Copier l'ID du Serveur**
- **Clic droit** sur le nom de votre serveur (en haut à gauche)
- Sélectionner **"Copier l'ID du serveur"**
- Vous obtenez un nombre comme : `123456789012345678`

### 3. **Utiliser la Commande**
```
!panel 123456789012345678
```
(Remplacez par votre vrai ID)

## 🤖 **Vérifier que le Bot est sur Votre Serveur**

### Le bot doit être présent sur votre serveur pour fonctionner !

**Lien d'invitation du bot :**
```
https://discord.com/api/oauth2/authorize?client_id=VOTRE_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### **Permissions Requises :**
- ✅ Administrateur (recommandé)
- ✅ Gérer les salons
- ✅ Gérer les rôles
- ✅ Envoyer des messages
- ✅ Utiliser les commandes slash

## 🎯 **Test Rapide**

1. **Vérifier que le bot est en ligne** sur votre serveur
2. **Taper** `/deploy` pour déployer les commandes
3. **Taper** `!panel` pour obtenir les instructions
4. **Utiliser** `!panel VOTRE_ID_SERVEUR`

## ❓ **Problèmes Courants**

### Bot pas sur le serveur ?
- Inviter le bot avec le lien ci-dessus
- Vérifier les permissions

### ID incorrect ?
- L'ID doit faire 17-19 chiffres
- Pas d'espaces, pas de caractères spéciaux

### Commande ne fonctionne pas ?
- Vérifier que le bot est en ligne
- Utiliser `/deploy` d'abord
- Vérifier les permissions

---

**🎉 Une fois configuré, vous pourrez accéder au panneau Serko complet !**