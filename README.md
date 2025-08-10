# Bot Discord avec Système de Tickets

Un bot Discord complet avec un système de tickets avancé et une interface web de gestion.

## 🚀 Fonctionnalités

### Bot Discord
- **Système de tickets complet** avec création via boutons et commandes slash
- **Catégories multiples** : Support, Bug Report, Feature Request, Paiement
- **Gestion des permissions** et rôles automatique
- **Système de claim** pour les membres du support
- **Ajout/Retrait de membres** dans les tickets avec `/ticket ajouter` et `/ticket retirer`
- **Embeds personnalisés** avec boutons interactifs via `/embed`
- **Panneaux prédéfinis** pour administration, info, support et rôles
- **Transcripts automatiques** lors de la fermeture
- **Logs détaillés** de toutes les actions
- **Commandes slash** intuitives

### Interface Web
- **Dashboard en temps réel** avec statistiques et graphiques
- **Gestion des tickets** avec filtres et recherche
- **Monitoring du bot** avec statut de connexion
- **Affichage des participants** aux tickets
- **Design moderne** avec thème Discord-like
- **Responsive design** pour tous les appareils

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd discord-ticket-bot
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration**
- Copier `.env.example` vers `.env`
- Remplir les variables d'environnement :
  - `DISCORD_TOKEN` : Token de votre bot Discord
  - `DISCORD_CLIENT_ID` : ID de l'application Discord
  - `DISCORD_GUILD_ID` : ID de votre serveur Discord
  - `TICKET_CATEGORY_ID` : ID de la catégorie pour les tickets
  - `LOGS_CHANNEL_ID` : ID du salon de logs
  - `TRANSCRIPT_CHANNEL_ID` : ID du salon pour les transcripts
  - `SUPPORT_ROLE_ID` : ID du rôle support
  - `ADMIN_ROLE_ID` : ID du rôle admin
  - `MODERATOR_ROLE_ID` : ID du rôle modérateur
  - Variables optionnelles pour les rôles de sélection

4. **Démarrer le bot et l'interface web**
```bash
npm run dev
```

## 🎮 Utilisation

### Commandes Discord

#### Gestion des Tickets
- `/ticket setup` - Configurer le panneau de création de tickets
- `/ticket create [category]` - Créer un ticket manuellement  
- `/ticket ajouter [membre]` - Ajouter un membre au ticket actuel
- `/ticket retirer [membre]` - Retirer un membre du ticket actuel
- `/ticket stats` - Afficher les statistiques

#### Embeds et Panneaux
- `/embed` - Créer un embed personnalisé avec boutons
- `/panel admin` - Panneau d'administration
- `/panel info` - Panneau d'informations du serveur
- `/panel support` - Panneau de support avancé
- `/panel roles` - Panneau de sélection de rôles

#### Administration
- `/deploy` - Déployer les commandes slash (admin seulement)

### Création d'Embeds Personnalisés

La commande `/embed` permet de créer des embeds avec des boutons personnalisés :

```
/embed titre:"Mon Titre" description:"Ma description" couleur:"5865F2" boutons:"Bouton1:primary:action1,Bouton2:success:action2"
```

**Paramètres disponibles :**
- `titre` : Titre de l'embed (requis)
- `description` : Description de l'embed (requis)
- `couleur` : Couleur en hexadécimal sans # (optionnel)
- `image` : URL d'une image (optionnel)
- `thumbnail` : URL d'une miniature (optionnel)
- `footer` : Texte du footer (optionnel)
- `boutons` : Format `label:style:id` séparés par des virgules (optionnel)

**Styles de boutons disponibles :**
- `primary` ou `bleu` : Bouton bleu
- `secondary` ou `gris` : Bouton gris
- `success` ou `vert` : Bouton vert
- `danger` ou `rouge` : Bouton rouge

### Gestion des Membres dans les Tickets

#### Ajouter un membre
```
/ticket ajouter @utilisateur
```
- Permet au créateur du ticket ou au staff d'ajouter des membres
- Le membre ajouté reçoit une notification par DM
- L'action est loggée dans le canal de logs

#### Retirer un membre
```
/ticket retirer @utilisateur
```
- Permet de retirer des membres du ticket
- Impossible de retirer le créateur du ticket
- Seuls les admins peuvent retirer des membres du staff

### Permissions
- **Créateur du ticket** : Peut ajouter/retirer des membres
- **Staff** (Support/Modérateur) : Peut ajouter/retirer des membres, utiliser les panneaux
- **Admin** : Peut ajouter/retirer n'importe qui, y compris le staff, accès complet

### Interface Web

L'interface web est accessible sur `http://localhost:5173` et propose :
- **Dashboard** : Vue d'ensemble avec statistiques et graphiques
- **Tickets** : Liste détaillée avec filtres, recherche et affichage des participants
- **Configuration** : Paramètres du bot (en développement)

## 🔧 Structure du Projet

```
src/
├── bot/                    # Code du bot Discord
│   ├── commands/          # Commandes slash
│   │   ├── ticket.js      # Gestion complète des tickets
│   │   ├── embed.js       # Création d'embeds personnalisés
│   │   ├── panel.js       # Panneaux prédéfinis
│   │   └── deploy.js      # Déploiement des commandes
│   ├── events/            # Gestionnaires d'événements
│   │   ├── ready.js       # Événement de connexion
│   │   └── interactionCreate.js # Gestion des interactions et boutons
│   └── index.js           # Point d'entrée du bot
├── components/            # Composants React
│   ├── Dashboard.tsx      # Tableau de bord
│   ├── TicketList.tsx     # Liste des tickets avec participants
│   └── BotStatus.tsx      # Statut de connexion
└── App.tsx               # Application principale
```

## 🎨 Fonctionnalités Avancées

### Système de Tickets
- **Création automatique** de salons privés
- **Permissions granulaires** par rôle
- **Boutons interactifs** pour la gestion
- **Système de claim** pour éviter les doublons
- **Gestion des participants** avec ajout/retrait dynamique
- **Réouverture** des tickets fermés
- **Suppression automatique** après confirmation

### Embeds et Panneaux Interactifs
- **Embeds personnalisés** avec jusqu'à 25 boutons (5 par ligne)
- **Panneaux prédéfinis** pour différents usages
- **Système de rôles** avec attribution/retrait automatique
- **Boutons d'administration** avec actions spécialisées
- **Support multi-niveaux** avec création automatique de tickets

### Gestion des Participants
- **Ajout sécurisé** avec vérification des permissions
- **Notifications automatiques** par DM
- **Logs détaillés** de toutes les actions
- **Protection du créateur** (impossible à retirer)
- **Gestion des rôles** (staff protégé sauf par admin)

### Interface de Gestion
- **Temps réel** avec Socket.IO
- **Graphiques interactifs** avec Recharts
- **Filtres avancés** par statut, catégorie, date
- **Affichage des participants** avec compteur
- **Historique complet** des actions
- **Export des données** (à venir)

## 🔒 Sécurité

- **Permissions Discord** strictes par salon
- **Validation des données** côté serveur
- **Logs détaillés** de toutes les actions
- **Limitation d'un ticket** par utilisateur
- **Système de rôles** pour l'accès aux fonctionnalités
- **Protection contre les abus** (vérifications multiples)
- **Contrôle des boutons** avec permissions appropriées

## 🚀 Déploiement

Pour un déploiement en production :
1. Configurer une base de données (MongoDB, PostgreSQL)
2. Utiliser un reverse proxy (nginx)
3. Configurer les variables d'environnement
4. Utiliser PM2 pour la gestion des processus

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Ouvrir des issues pour les bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation
- Optimiser le code

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.