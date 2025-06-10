export default {
    name: 'messageCreate',
    execute: async (message) => {
        // Ignorer les messages des bots
        if (message.author.bot) return;

        // Ignorer les messages qui ne sont pas des commandes !panel
        if (!message.content.toLowerCase().startsWith('!panel')) return;

        const content = message.content.toLowerCase().trim();
        
        // Vérifier si c'est exactement !panel (sans arguments)
        if (content === '!panel') {
            console.log(`📱 Commande !panel reçue de ${message.author.tag} dans ${message.guild?.name || 'DM'}`);
            await handlePanelCommand(message);
            return;
        }
        
        // Vérifier si c'est !panel avec un ID de serveur
        const parts = message.content.trim().split(/\s+/);
        if (parts.length === 2 && parts[0].toLowerCase() === '!panel') {
            const guildId = parts[1];
            console.log(`📱 Commande !panel avec guild ID reçue: ${guildId} de ${message.author.tag} dans ${message.guild?.name || 'DM'}`);
            await handlePanelWithGuildId(message, guildId);
            return;
        }
    }
};

const handlePanelCommand = async (message) => {
    console.log(`🔧 Traitement de la commande !panel pour ${message.author.tag}`);
    
    // Vérifier si on a déjà traité cette commande récemment (protection anti-spam)
    const userId = message.author.id;
    const channelId = message.channel.id;
    const messageId = message.id;
    const now = Date.now();
    
    // Cache global pour éviter les doublons (expire après 10 secondes)
    if (!global.panelCommandCache) {
        global.panelCommandCache = new Map();
    }
    
    // Clé unique basée sur l'utilisateur, le canal et l'heure
    const cacheKey = `${userId}_${channelId}_panel`;
    const lastCommand = global.panelCommandCache.get(cacheKey);
    
    if (lastCommand && (now - lastCommand.timestamp) < 10000) {
        console.log(`⚠️ Commande !panel ignorée (déjà traitée récemment) pour ${message.author.tag}`);
        return;
    }
    
    // Marquer cette commande comme traitée
    global.panelCommandCache.set(cacheKey, {
        timestamp: now,
        messageId: messageId,
        processed: true
    });
    
    // Nettoyer le cache périodiquement
    setTimeout(() => {
        global.panelCommandCache.delete(cacheKey);
    }, 15000);
    
    console.log('⏳ Message de commande laissé visible pendant 5 secondes...');

    // Générer le lien vers le panel Serko
    const panelUrl = getRailwayUrl();

    const panelEmbed = {
        color: 0x5865F2,
        title: '🎛️ Panel Serko - Système de Tickets Discord',
        description: '**Accédez au panel de gestion complet !**\n\n🔐 **Mot de passe requis pour l\'authentification**\n\n🎯 **Cliquez sur le lien ci-dessous puis entrez le mot de passe**',
        fields: [
            {
                name: '🚀 Fonctionnalités Principales',
                value: '• **Création de tickets** avec embeds personnalisés\n• **Gestion des participants** avec ID Discord\n• **Fermeture de tickets** depuis le panel\n• **Lecture en temps réel** des tickets\n• **Configuration complète** du système',
                inline: false
            },
            {
                name: '🔐 Authentification Sécurisée',
                value: '• **Mot de passe fixe** : `SerkoAdmin2024!@$`\n• **Accès protégé** au panel\n• **Interface sécurisée**\n• **Gestion administrative**',
                inline: true
            },
            {
                name: '⚡ Actions Disponibles',
                value: '• **Créer des panneaux** de tickets\n• **Ajouter/Retirer** des utilisateurs\n• **Fermer des tickets** directement\n• **Voir les statistiques** temps réel',
                inline: true
            }
        ],
        footer: {
            text: 'Panel Serko • Authentification par Mot de Passe'
        },
        timestamp: new Date().toISOString()
    };

    // Utiliser la structure correcte pour les boutons Discord
    const components = [
        {
            type: 1, // ACTION_ROW
            components: [
                {
                    type: 2, // BUTTON
                    style: 5, // Link button
                    label: 'Ouvrir le Panel Serko',
                    emoji: { name: '🎛️' },
                    url: panelUrl
                },
                {
                    type: 2, // BUTTON
                    style: 1, // Primary
                    label: 'Support Rapide',
                    emoji: { name: '🎮' },
                    custom_id: 'panel_ticket_support'
                },
                {
                    type: 2, // BUTTON
                    style: 2, // Secondary
                    label: 'Guide d\'Utilisation',
                    emoji: { name: '📖' },
                    custom_id: 'panel_help'
                }
            ]
        }
    ];

    try {
        const sentMessage = await message.channel.send({
            embeds: [panelEmbed],
            components: components
        });
        
        // Stocker l'ID du message envoyé pour éviter les doublons
        global.panelCommandCache.set(`${cacheKey}_sent`, {
            timestamp: now,
            messageId: sentMessage.id
        });
        
        console.log('✅ Message de panel Serko envoyé avec mot de passe');

        // Supprimer le message de commande APRÈS 5 secondes
        setTimeout(async () => {
            try {
                await message.delete();
                console.log('✅ Message de commande supprimé après 5 secondes');
            } catch (error) {
                console.log('⚠️ Impossible de supprimer le message de commande:', error.message);
            }
        }, 5000);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du message de panel:', error);
    }
};

const handlePanelWithGuildId = async (message, guildId) => {
    console.log(`🔧 Traitement de la commande !panel avec guild ID: ${guildId}`);
    
    // Vérifier si on a déjà traité cette commande récemment (protection anti-spam)
    const userId = message.author.id;
    const channelId = message.channel.id;
    const messageId = message.id;
    const now = Date.now();
    
    // Cache global pour éviter les doublons
    if (!global.panelGuildCommandCache) {
        global.panelGuildCommandCache = new Map();
    }
    
    // Clé unique basée sur l'utilisateur, le canal, le guild et l'heure
    const cacheKey = `${userId}_${channelId}_${guildId}`;
    const lastCommand = global.panelGuildCommandCache.get(cacheKey);
    
    if (lastCommand && (now - lastCommand.timestamp) < 10000) {
        console.log(`⚠️ Commande !panel ${guildId} ignorée (déjà traitée récemment) pour ${message.author.tag}`);
        return;
    }
    
    // Marquer cette commande comme traitée
    global.panelGuildCommandCache.set(cacheKey, {
        timestamp: now,
        messageId: messageId,
        guildId: guildId,
        processed: true
    });
    
    // Nettoyer le cache périodiquement
    setTimeout(() => {
        global.panelGuildCommandCache.delete(cacheKey);
    }, 15000);
    
    console.log('⏳ Message de commande laissé visible pendant 3 secondes...');

    // Vérifier si l'ID est valide (18-19 chiffres)
    if (!/^\d{17,19}$/.test(guildId)) {
        console.log(`❌ ID de serveur invalide: ${guildId}`);
        const errorEmbed = {
            color: 0xED4245,
            title: '❌ ID de Serveur Invalide',
            description: 'L\'ID du serveur Discord doit être composé de 17 à 19 chiffres.',
            fields: [
                {
                    name: '📝 Format Correct',
                    value: '```!panel 123456789012345678```',
                    inline: false
                },
                {
                    name: '🔍 Comment obtenir l\'ID',
                    value: '1. Activez le mode développeur\n2. Clic droit sur le serveur\n3. "Copier l\'ID du serveur"',
                    inline: false
                }
            ],
            footer: {
                text: 'Panel Serko • Veuillez réessayer avec un ID valide'
            }
        };

        try {
            await message.channel.send({ embeds: [errorEmbed] });
            console.log('✅ Message d\'erreur envoyé pour ID invalide');
            
            // Supprimer le message de commande après 3 secondes
            setTimeout(async () => {
                try {
                    await message.delete();
                    console.log('✅ Message de commande invalide supprimé');
                } catch (error) {
                    console.log('⚠️ Impossible de supprimer le message:', error.message);
                }
            }, 3000);
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi du message d\'erreur:', error);
        }
        return;
    }

    // Forcer le rafraîchissement du cache des guildes
    console.log(`🔄 Rafraîchissement du cache des guildes...`);
    try {
        await message.client.guilds.fetch();
        console.log(`✅ Cache des guildes rafraîchi. Guildes disponibles: ${message.client.guilds.cache.size}`);
        
        // Lister toutes les guildes pour debug
        message.client.guilds.cache.forEach(guild => {
            console.log(`   - ${guild.name} (${guild.id})`);
        });
    } catch (error) {
        console.error('❌ Erreur lors du rafraîchissement du cache:', error);
    }

    // Vérifier si le bot a accès à ce serveur
    const guild = message.client.guilds.cache.get(guildId);
    if (!guild) {
        console.log(`❌ Serveur non trouvé après rafraîchissement: ${guildId}`);
        
        // Essayer de fetch le serveur spécifiquement
        try {
            console.log(`🔍 Tentative de fetch direct du serveur ${guildId}...`);
            const fetchedGuild = await message.client.guilds.fetch(guildId);
            console.log(`✅ Serveur trouvé via fetch direct: ${fetchedGuild.name}`);
            
            // Continuer avec le serveur fetché
            await processPanelAccess(message, fetchedGuild, guildId);
            return;
        } catch (fetchError) {
            console.log(`❌ Impossible de fetch le serveur ${guildId}:`, fetchError.message);
        }
        
        const notFoundEmbed = {
            color: 0xED4245,
            title: '❌ Serveur Non Trouvé',
            description: `Le bot n'a pas accès au serveur avec l'ID \`${guildId}\` ou ce serveur n'existe pas.`,
            fields: [
                {
                    name: '🔍 Vérifications',
                    value: '• Le bot est-il présent sur ce serveur ?\n• L\'ID est-il correct ?\n• Le serveur existe-t-il toujours ?',
                    inline: false
                },
                {
                    name: '💡 Solution',
                    value: `Assurez-vous que le bot est invité sur le serveur et que l\'ID est correct.\n\n**Serveurs où le bot est présent :**\n${message.client.guilds.cache.map(g => `• ${g.name} (\`${g.id}\`)`).join('\n') || 'Aucun serveur trouvé'}`,
                    inline: false
                }
            ],
            footer: {
                text: 'Panel Serko • Vérifiez l\'ID du serveur'
            }
        };

        try {
            await message.channel.send({ embeds: [notFoundEmbed] });
            console.log('✅ Message d\'erreur envoyé pour serveur non trouvé');
            
            // Supprimer le message de commande après 3 secondes
            setTimeout(async () => {
                try {
                    await message.delete();
                    console.log('✅ Message de commande supprimé');
                } catch (error) {
                    console.log('⚠️ Impossible de supprimer le message:', error.message);
                }
            }, 3000);
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi du message d\'erreur:', error);
        }
        return;
    }

    await processPanelAccess(message, guild, guildId);
};

const processPanelAccess = async (message, guild, guildId) => {
    // Générer l'URL Railway correcte
    const panelUrl = `${getRailwayUrl()}/?guild=${guildId}`;
    
    console.log(`✅ Accès autorisé pour ${message.author.tag} sur ${guild.name}`);
    console.log(`🔗 URL Panel générée: ${panelUrl}`);
    
    const successEmbed = {
        color: 0x57F287,
        title: '🎛️ Accès au Panel Serko',
        description: `**Serveur :** ${guild.name}\n**Membres :** ${guild.memberCount}\n\n🔐 **Mot de passe requis pour l\'authentification**\n\n🎯 **Cliquez sur le lien puis entrez le mot de passe !**`,
        fields: [
            {
                name: '🔗 Lien d\'Accès Direct',
                value: `[**🎛️ Ouvrir le Panel Serko pour ${guild.name}**](${panelUrl})\n*Panel pré-configuré pour ce serveur*`,
                inline: false
            },
            {
                name: '🔐 Authentification Sécurisée',
                value: '• **Mot de passe** : `SerkoAdmin2024!@$`\n• **Accès protégé** au panel\n• **Interface sécurisée**\n• **Gestion administrative**',
                inline: true
            },
            {
                name: '⚡ Fonctionnalités Disponibles',
                value: '• **Créer des embeds** de tickets\n• **Ajouter/Retirer** des utilisateurs\n• **Fermer des tickets** directement\n• **Voir les tickets** en temps réel',
                inline: true
            }
        ],
        footer: {
            text: `Panel Serko • Gestion Sécurisée pour ${guild.name}`
        },
        timestamp: new Date().toISOString()
    };

    // Structure correcte des boutons Discord
    const components = [
        {
            type: 1, // ACTION_ROW
            components: [
                {
                    type: 2, // BUTTON
                    style: 5, // Link button
                    label: `🎛️ Panel Serko - ${guild.name}`,
                    emoji: { name: '🚀' },
                    url: panelUrl
                },
                {
                    type: 2, // BUTTON
                    style: 1, // Primary
                    label: 'Créer un Ticket',
                    emoji: { name: '🎫' },
                    custom_id: 'panel_ticket_support'
                },
                {
                    type: 2, // BUTTON
                    style: 2, // Secondary
                    label: 'Statistiques',
                    emoji: { name: '📊' },
                    custom_id: 'panel_stats'
                }
            ]
        }
    ];

    try {
        const sentMessage = await message.channel.send({
            embeds: [successEmbed],
            components: components
        });
        
        console.log('✅ Message de succès envoyé avec lien vers le Panel et mot de passe');
        console.log(`🎛️ URL finale: ${panelUrl}`);

        // Supprimer le message de commande APRÈS 3 secondes
        setTimeout(async () => {
            try {
                await message.delete();
                console.log('✅ Message de commande supprimé après 3 secondes');
            } catch (error) {
                console.log('⚠️ Impossible de supprimer le message de commande:', error.message);
            }
        }, 3000);
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du message de succès:', error);
    }
};

const getRailwayUrl = () => {
    // Essayer différentes variables d'environnement Railway
    if (process.env.RAILWAY_STATIC_URL) {
        return process.env.RAILWAY_STATIC_URL;
    }
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    // URL par défaut
    return 'http://localhost:3001';
};