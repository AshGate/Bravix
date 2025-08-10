import { ticketData, io, getServerConfig } from '../index.js';

export default {
    name: 'interactionCreate',
    execute: async (interaction) => {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error('❌ Erreur lors de l\'exécution de la commande:', error);
                const errorMessage = '❌ Une erreur est survenue lors de l\'exécution de cette commande.';
                
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: errorMessage, flags: 64 });
                    } else {
                        await interaction.reply({ content: errorMessage, flags: 64 });
                    }
                } catch (replyError) {
                    console.error('❌ Impossible de répondre à l\'interaction:', replyError);
                }
            }
        } else if (interaction.isButton()) {
            const { customId } = interaction;

            try {
                // Vérifier si l'interaction a déjà été traitée
                if (interaction.replied || interaction.deferred) {
                    console.warn('⚠️ Interaction déjà traitée:', customId);
                    return;
                }

                console.log(`🔘 Bouton cliqué: ${customId} par ${interaction.user.tag}`);

                // Protection anti-spam pour les boutons
                const userId = interaction.user.id;
                const now = Date.now();
                
                if (!global.buttonInteractionCache) {
                    global.buttonInteractionCache = new Map();
                }
                
                const buttonCacheKey = `${userId}_${customId}`;
                const lastInteraction = global.buttonInteractionCache.get(buttonCacheKey);
                
                if (lastInteraction && (now - lastInteraction) < 3000) {
                    console.warn(`⚠️ Interaction bouton ignorée (trop récente): ${customId} par ${interaction.user.tag}`);
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.editReply({
                        content: '⚠️ Veuillez patienter avant de cliquer à nouveau.'
                    });
                    return;
                }
                
                global.buttonInteractionCache.set(buttonCacheKey, now);
                
                // Nettoyer le cache périodiquement
                setTimeout(() => {
                    global.buttonInteractionCache.delete(buttonCacheKey);
                }, 5000);

                // Déférer l'interaction immédiatement selon le type de bouton
                const updateButtons = ['claim_ticket', 'close_ticket', 'reopen_ticket', 'delete_ticket'];
                if (updateButtons.includes(customId)) {
                    await interaction.deferUpdate();
                } else {
                    await interaction.deferReply({ ephemeral: true });
                }

                // Gestion des boutons de tickets depuis le panel Serko
                if (customId.startsWith('serko_ticket_')) {
                    const parts = customId.split('_');
                    const category = parts[2]; // serko_ticket_[category]_[id]
                    await interaction.client.createTicket(interaction, category);
                }
                // Gestion des boutons de tickets depuis le panel
                else if (customId.startsWith('panel_ticket_')) {
                    const category = customId.replace('panel_ticket_', '');
                    await interaction.client.createTicket(interaction, category);
                }
                // Gestion des boutons de configuration depuis le panel
                else if (customId === 'panel_config') {
                    await handlePanelConfig(interaction);
                }
                // Gestion des boutons de statistiques depuis le panel
                else if (customId === 'panel_stats') {
                    await handlePanelStats(interaction);
                }
                // Gestion du bouton d'aide
                else if (customId === 'panel_help') {
                    await handlePanelHelp(interaction);
                }
                // Boutons de configuration spécifiques avec sélecteurs
                else if (customId.startsWith('config_select_')) {
                    await handleConfigSelect(interaction);
                }
                
                // Gestion des boutons de tickets existants
                else if (customId.startsWith('create_ticket_')) {
                    const category = customId.replace('create_ticket_', '');
                    await interaction.client.createTicket(interaction, category);
                } else if (customId === 'claim_ticket') {
                    await handleClaimTicket(interaction);
                } else if (customId === 'close_ticket') {
                    await handleCloseTicket(interaction);
                } else if (customId === 'reopen_ticket') {
                    await handleReopenTicket(interaction);
                } else if (customId === 'delete_ticket') {
                    await handleDeleteTicket(interaction);
                }
                
                // Gestion des boutons d'embed personnalisés
                else if (customId.startsWith('embed_')) {
                    await handleCustomEmbedButton(interaction);
                }
                
                // Gestion des boutons de panneaux prédéfinis
                else if (customId.startsWith('admin_')) {
                    await handleAdminButton(interaction);
                } else if (customId.startsWith('info_')) {
                    await handleInfoButton(interaction);
                } else if (customId.startsWith('support_')) {
                    await handleSupportButton(interaction);
                } else if (customId.startsWith('role_')) {
                    await handleRoleButton(interaction);
                }
                // Bouton non reconnu
                else {
                    console.warn(`⚠️ Bouton non reconnu: ${customId}`);
                    await interaction.editReply({
                        content: '❌ Cette action n\'est pas reconnue.'
                    });
                }
            } catch (error) {
                console.error(`❌ Erreur lors du traitement du bouton ${customId}:`, error);
                
                try {
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({
                            content: '❌ Une erreur est survenue lors du traitement de cette action.'
                        });
                    } else if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Une erreur est survenue lors du traitement de cette action.',
                            flags: 64
                        });
                    }
                } catch (replyError) {
                    console.error('❌ Impossible de répondre à l\'erreur d\'interaction:', replyError);
                }
            }
        } else if (interaction.isStringSelectMenu()) {
            try {
                // Déférer immédiatement pour les menus de sélection
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.deferReply({ ephemeral: true });
                }

                // Gestion des menus de sélection pour la configuration
                if (interaction.customId.startsWith('config_select_')) {
                    await handleConfigSelection(interaction);
                }
            } catch (error) {
                console.error('❌ Erreur lors du traitement du menu de sélection:', error);
                
                try {
                    if (interaction.deferred && !interaction.replied) {
                        await interaction.editReply({
                            content: '❌ Une erreur est survenue lors du traitement de cette sélection.'
                        });
                    } else if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Une erreur est survenue lors du traitement de cette sélection.',
                            flags: 64
                        });
                    }
                } catch (replyError) {
                    console.error('❌ Impossible de répondre à l\'erreur de sélection:', replyError);
                }
            }
        }
    }
};

// Fonction pour gérer le bouton d'aide
const handlePanelHelp = async (interaction) => {
    const helpEmbed = {
        color: 0x5865F2,
        title: '📖 Guide d\'Utilisation - Serko',
        description: 'Voici comment utiliser le système de tickets Serko de manière optimale.',
        fields: [
            {
                name: '🚀 Démarrage Rapide',
                value: '• **`!panel`** - Accéder à la page d\'accueil\n• **`!panel [ID_SERVEUR]`** - Panneau spécifique\n• **`/ticket setup`** - Configurer les tickets\n• **`/deploy`** - Déployer les commandes',
                inline: false
            },
            {
                name: '🎫 Gestion des Tickets',
                value: '• **`/ticket create`** - Créer un ticket\n• **`/ticket ajouter @user`** - Ajouter un membre\n• **`/ticket retirer @user`** - Retirer un membre\n• **`/ticket stats`** - Voir les statistiques',
                inline: true
            },
            {
                name: '⚙️ Configuration',
                value: '• **`/config show`** - Voir la config\n• **`/config category`** - Définir catégorie\n• **`/config logs`** - Salon de logs\n• **`/config support`** - Rôle support',
                inline: true
            },
            {
                name: '🎨 Personnalisation',
                value: '• **`/embed`** - Créer des embeds\n• **`/panel admin`** - Panneau admin\n• **`/panel roles`** - Sélection de rôles\n• **Interface web** - Créateur de panneaux',
                inline: false
            },
            {
                name: '🔗 Liens Utiles',
                value: '• **Page d\'accueil** - Cliquez sur "Ouvrir le Panneau Serko"\n• **Documentation** - Guide complet intégré\n• **Support** - Créez un ticket pour obtenir de l\'aide',
                inline: false
            }
        ],
        footer: {
            text: 'Serko Help • Pour plus d\'aide, visitez le panneau web'
        },
        timestamp: new Date().toISOString()
    };

    await interaction.editReply({
        embeds: [helpEmbed]
    });
};

// Nouvelle fonction pour gérer la configuration depuis le panel
const handlePanelConfig = async (interaction) => {
    // Vérifier les permissions
    const isMainAdmin = interaction.user.id === process.env.ADMIN_USER_ID;
    const hasAdminPerms = interaction.member.permissions.has('Administrator');
    
    if (!isMainAdmin && !hasAdminPerms) {
        return interaction.editReply({
            content: '❌ Vous devez être administrateur pour accéder à la configuration.'
        });
    }

    const config = getServerConfig(interaction.guild.id);
    const guild = interaction.guild;

    const configEmbed = {
        color: 0xF39C12,
        title: '⚙️ Serko - Configuration du Système',
        description: 'Configurez les paramètres du système de tickets pour ce serveur.',
        fields: [
            {
                name: '📁 Catégorie des Tickets',
                value: config.ticketCategoryId ? 
                    (guild.channels.cache.get(config.ticketCategoryId)?.name || '❌ Catégorie introuvable') : 
                    '⚠️ Non configurée (création automatique)',
                inline: true
            },
            {
                name: '📋 Salon de Logs',
                value: config.logsChannelId ? 
                    `<#${config.logsChannelId}>` : 
                    '⚠️ Non configuré',
                inline: true
            },
            {
                name: '📄 Salon des Transcripts',
                value: config.transcriptChannelId ? 
                    `<#${config.transcriptChannelId}>` : 
                    '⚠️ Non configuré',
                inline: true
            },
            {
                name: '🛡️ Rôle de Support',
                value: config.supportRoleId ? 
                    `<@&${config.supportRoleId}>` : 
                    '⚠️ Non configuré (détection automatique)',
                inline: true
            }
        ],
        footer: {
            text: 'Serko Configuration • Utilisez les menus déroulants ci-dessous'
        },
        timestamp: new Date().toISOString()
    };

    // Créer les menus de sélection pour chaque type de configuration
    const components = [
        {
            type: 1,
            components: [
                {
                    type: 3, // SELECT_MENU
                    custom_id: 'config_select_category',
                    placeholder: '📁 Choisir une catégorie pour les tickets',
                    options: guild.channels.cache
                        .filter(channel => channel.type === 4) // GUILD_CATEGORY
                        .map(category => ({
                            label: category.name,
                            value: category.id,
                            description: `Utiliser ${category.name} pour les tickets`
                        }))
                        .slice(0, 25) // Discord limite à 25 options
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 3, // SELECT_MENU
                    custom_id: 'config_select_logs',
                    placeholder: '📋 Choisir un salon pour les logs',
                    options: guild.channels.cache
                        .filter(channel => channel.type === 0) // GUILD_TEXT
                        .map(channel => ({
                            label: `#${channel.name}`,
                            value: channel.id,
                            description: `Logs dans #${channel.name}`
                        }))
                        .slice(0, 25)
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 3, // SELECT_MENU
                    custom_id: 'config_select_transcripts',
                    placeholder: '📄 Choisir un salon pour les transcripts',
                    options: guild.channels.cache
                        .filter(channel => channel.type === 0) // GUILD_TEXT
                        .map(channel => ({
                            label: `#${channel.name}`,
                            value: channel.id,
                            description: `Transcripts dans #${channel.name}`
                        }))
                        .slice(0, 25)
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 3, // SELECT_MENU
                    custom_id: 'config_select_support',
                    placeholder: '🛡️ Choisir un rôle de support',
                    options: guild.roles.cache
                        .filter(role => !role.managed && role.name !== '@everyone')
                        .map(role => ({
                            label: role.name,
                            value: role.id,
                            description: `Rôle de support: ${role.name}`
                        }))
                        .slice(0, 25)
                }
            ]
        }
    ];

    await interaction.editReply({
        embeds: [configEmbed],
        components: components
    });
};

// Nouvelle fonction pour gérer les sélections de configuration
const handleConfigSelection = async (interaction) => {
    const { serverConfigs } = await import('../index.js');
    const configType = interaction.customId.replace('config_select_', '');
    const selectedValue = interaction.values[0];
    const guildId = interaction.guild.id;

    // Initialiser la config du serveur si elle n'existe pas
    if (!serverConfigs.has(guildId)) {
        serverConfigs.set(guildId, {});
    }

    const config = serverConfigs.get(guildId);
    const guild = interaction.guild;

    let successMessage = '';
    let selectedItem = '';

    switch (configType) {
        case 'category':
            const category = guild.channels.cache.get(selectedValue);
            config.ticketCategoryId = selectedValue;
            selectedItem = category.name;
            successMessage = `✅ Catégorie des tickets définie sur **${selectedItem}**`;
            break;

        case 'logs':
            const logsChannel = guild.channels.cache.get(selectedValue);
            config.logsChannelId = selectedValue;
            selectedItem = `#${logsChannel.name}`;
            successMessage = `✅ Salon de logs défini sur ${logsChannel}`;
            break;

        case 'transcripts':
            const transcriptChannel = guild.channels.cache.get(selectedValue);
            config.transcriptChannelId = selectedValue;
            selectedItem = `#${transcriptChannel.name}`;
            successMessage = `✅ Salon des transcripts défini sur ${transcriptChannel}`;
            break;

        case 'support':
            const supportRole = guild.roles.cache.get(selectedValue);
            config.supportRoleId = selectedValue;
            selectedItem = supportRole.name;
            successMessage = `✅ Rôle de support défini sur ${supportRole}`;
            break;
    }

    serverConfigs.set(guildId, config);

    const successEmbed = {
        color: 0x57F287,
        title: '✅ Configuration Mise à Jour',
        description: successMessage,
        footer: {
            text: 'Serko Configuration'
        },
        timestamp: new Date().toISOString()
    };

    await interaction.editReply({
        embeds: [successEmbed]
    });
};

// Nouvelle fonction pour gérer les statistiques depuis le panel
const handlePanelStats = async (interaction) => {
    const guild = interaction.guild;
    
    const statsEmbed = {
        color: 0x3498DB,
        title: '📊 Serko - Statistiques du Système',
        description: `Statistiques en temps réel pour **${guild.name}**`,
        fields: [
            {
                name: '🎫 Total des Tickets',
                value: ticketData.stats.totalTickets.toString(),
                inline: true
            },
            {
                name: '🔓 Tickets Ouverts',
                value: ticketData.stats.openTickets.toString(),
                inline: true
            },
            {
                name: '🔒 Tickets Fermés',
                value: ticketData.stats.closedTickets.toString(),
                inline: true
            },
            {
                name: '👥 Membres du Serveur',
                value: guild.memberCount.toString(),
                inline: true
            },
            {
                name: '💬 Salons',
                value: guild.channels.cache.size.toString(),
                inline: true
            },
            {
                name: '🎭 Rôles',
                value: guild.roles.cache.size.toString(),
                inline: true
            }
        ],
        footer: {
            text: 'Serko Statistics • Données en temps réel'
        },
        timestamp: new Date().toISOString()
    };

    await interaction.editReply({
        embeds: [statsEmbed]
    });
};

// Fonctions existantes pour les tickets...
const handleClaimTicket = async (interaction) => {
    const ticket = ticketData.tickets.get(interaction.channel.id);
    if (!ticket) {
        return interaction.editReply({ 
            content: '❌ Ce ticket n\'existe pas.'
        });
    }

    if (ticket.claimedBy) {
        return interaction.editReply({ 
            content: `❌ Ce ticket est déjà claim par <@${ticket.claimedBy}>.`
        });
    }

    // Vérifier et ajouter automatiquement les permissions support
    const config = getServerConfig(interaction.guild.id);
    await ensureSupportAccess(interaction.channel, interaction.guild, config);
    ticket.claimedBy = interaction.user.id;
    ticketData.tickets.set(interaction.channel.id, ticket);

    const claimEmbed = {
        color: 0x57F287,
        description: `✅ ${interaction.user} a claim ce ticket.`,
        timestamp: new Date().toISOString()
    };

    await interaction.editReply({ embeds: [claimEmbed] });
    
    // Log dans le canal de logs si configuré
    if (config.logsChannelId) {
        const logsChannel = interaction.guild.channels.cache.get(config.logsChannelId);
        if (logsChannel) {
            const logEmbed = {
                color: 0x57F287,
                title: '👋 Ticket Claim',
                fields: [
                    { name: 'Ticket', value: `#${ticket.id} (<#${interaction.channel.id}>)`, inline: true },
                    { name: 'Claim par', value: `${interaction.user} (${interaction.user.tag})`, inline: true }
                ],
                timestamp: new Date().toISOString()
            };
            await logsChannel.send({ embeds: [logEmbed] });
        }
    }
    
    io.emit('ticketUpdated', ticket);
};

// Fonction utilitaire pour s'assurer que le support a accès au ticket
const ensureSupportAccess = async (channel, guild, config) => {
    const { addSupportPermissions } = await import('../../api/index.js');
    await addSupportPermissions(channel, guild, config);
};

const handleCloseTicket = async (interaction) => {
    const ticket = ticketData.tickets.get(interaction.channel.id);
    if (!ticket) {
        return interaction.editReply({ 
            content: '❌ Ce ticket n\'existe pas dans notre système. Vérifiez que ce canal est bien un ticket créé par Serko.'
        });
    }

    // Vérifier si le ticket est déjà fermé
    if (ticket.status === 'closed') {
        return interaction.editReply({ 
            content: '❌ Ce ticket est déjà fermé.'
        });
    }

    // Vérifier et ajouter automatiquement les permissions support avant fermeture
    const config = getServerConfig(interaction.guild.id);
    await ensureSupportAccess(interaction.channel, interaction.guild, config);
    // Créer le transcript
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const transcript = messages.reverse().map(msg => 
        `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}`
    ).join('\n');

    // Mettre à jour le ticket
    ticket.status = 'closed';
    ticket.closedAt = new Date().toISOString();
    ticket.closedBy = interaction.user.id;
    ticketData.tickets.set(interaction.channel.id, ticket);
    ticketData.stats.openTickets = Math.max(0, ticketData.stats.openTickets - 1);
    ticketData.stats.closedTickets++;

    const closeEmbed = {
        color: 0xED4245,
        title: '🔒 Ticket Fermé',
        description: `Ce ticket a été fermé par ${interaction.user}.`,
        timestamp: new Date().toISOString()
    };

    await interaction.editReply({
        embeds: [closeEmbed],
        components: [{
            type: 1,
            components: [
                {
                    type: 2,
                    style: 3,
                    label: 'Réouvrir',
                    custom_id: 'reopen_ticket'
                },
                {
                    type: 2,
                    style: 4,
                    label: 'Supprimer',
                    custom_id: 'delete_ticket'
                }
            ]
        }]
    });

    // Envoyer le transcript si configuré
    if (config.transcriptChannelId) {
        const transcriptChannel = interaction.guild.channels.cache.get(config.transcriptChannelId);
        if (transcriptChannel) {
            const transcriptEmbed = {
                color: 0x5865F2,
                title: `📋 Transcript - Ticket #${ticket.id}`,
                fields: [
                    { name: 'Utilisateur', value: `<@${ticket.userId}>`, inline: true },
                    { name: 'Catégorie', value: ticket.category, inline: true },
                    { name: 'Fermé par', value: `<@${interaction.user.id}>`, inline: true }
                ],
                timestamp: new Date().toISOString()
            };

            await transcriptChannel.send({
                embeds: [transcriptEmbed],
                files: [{
                    attachment: Buffer.from(transcript, 'utf8'),
                    name: `ticket-${ticket.id}-transcript.txt`
                }]
            });
        }
    }

    // Log dans le canal de logs si configuré
    if (config.logsChannelId) {
        const logsChannel = interaction.guild.channels.cache.get(config.logsChannelId);
        if (logsChannel) {
            const logEmbed = {
                color: 0xED4245,
                title: '🔒 Ticket Fermé',
                fields: [
                    { name: 'Ticket', value: `#${ticket.id} (<#${interaction.channel.id}>)`, inline: true },
                    { name: 'Fermé par', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                    { name: 'Durée', value: `${Math.round((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60))} minutes`, inline: true }
                ],
                timestamp: new Date().toISOString()
            };
            await logsChannel.send({ embeds: [logEmbed] });
        }
    }

    io.emit('ticketUpdated', ticket);
    io.emit('statsUpdated', ticketData.stats);
};

const handleReopenTicket = async (interaction) => {
    const ticket = ticketData.tickets.get(interaction.channel.id);
    if (!ticket) {
        return interaction.editReply({ 
            content: '❌ Ce ticket n\'existe pas.'
        });
    }

    // Vérifier si le ticket est fermé
    if (ticket.status !== 'closed') {
        return interaction.editReply({ 
            content: '❌ Ce ticket n\'est pas fermé.'
        });
    }

    ticket.status = 'open';
    ticket.reopenedAt = new Date().toISOString();
    ticket.reopenedBy = interaction.user.id;
    delete ticket.closedAt;
    delete ticket.closedBy;
    ticketData.tickets.set(interaction.channel.id, ticket);
    ticketData.stats.openTickets++;
    ticketData.stats.closedTickets = Math.max(0, ticketData.stats.closedTickets - 1);

    const reopenEmbed = {
        color: 0x57F287,
        title: '🔓 Ticket Réouvert',
        description: `Ce ticket a été réouvert par ${interaction.user}.`,
        timestamp: new Date().toISOString()
    };

    await interaction.editReply({
        embeds: [reopenEmbed],
        components: [{
            type: 1,
            components: [
                {
                    type: 2,
                    style: 3,
                    label: 'Claim',
                    custom_id: 'claim_ticket'
                },
                {
                    type: 2,
                    style: 4,
                    label: 'Fermer',
                    custom_id: 'close_ticket'
                }
            ]
        }]
    });

    // Log dans le canal de logs si configuré
    const config = getServerConfig(interaction.guild.id);
    if (config.logsChannelId) {
        const logsChannel = interaction.guild.channels.cache.get(config.logsChannelId);
        if (logsChannel) {
            const logEmbed = {
                color: 0x57F287,
                title: '🔓 Ticket Réouvert',
                fields: [
                    { name: 'Ticket', value: `#${ticket.id} (<#${interaction.channel.id}>)`, inline: true },
                    { name: 'Réouvert par', value: `${interaction.user} (${interaction.user.tag})`, inline: true }
                ],
                timestamp: new Date().toISOString()
            };
            await logsChannel.send({ embeds: [logEmbed] });
        }
    }

    io.emit('ticketUpdated', ticket);
    io.emit('statsUpdated', ticketData.stats);
};

const handleDeleteTicket = async (interaction) => {
    const ticket = ticketData.tickets.get(interaction.channel.id);
    if (!ticket) {
        return interaction.editReply({ 
            content: '❌ Ce ticket n\'existe pas.'
        });
    }

    await interaction.editReply({ 
        content: '🗑️ Ce ticket sera supprimé dans 5 secondes...'
    });

    // Log dans le canal de logs si configuré
    const config = getServerConfig(interaction.guild.id);
    if (config.logsChannelId) {
        const logsChannel = interaction.guild.channels.cache.get(config.logsChannelId);
        if (logsChannel) {
            const logEmbed = {
                color: 0xED4245,
                title: '🗑️ Ticket Supprimé',
                fields: [
                    { name: 'Ticket', value: `#${ticket.id}`, inline: true },
                    { name: 'Supprimé par', value: `${interaction.user} (${interaction.user.tag})`, inline: true },
                    { name: 'Utilisateur', value: `<@${ticket.userId}>`, inline: true }
                ],
                timestamp: new Date().toISOString()
            };
            await logsChannel.send({ embeds: [logEmbed] });
        }
    }

    setTimeout(async () => {
        ticketData.tickets.delete(interaction.channel.id);
        io.emit('ticketDeleted', ticket);
        await interaction.channel.delete();
    }, 5000);
};

// Nouvelles fonctions pour les boutons personnalisés
const handleCustomEmbedButton = async (interaction) => {
    const buttonId = interaction.customId.replace('embed_', '');
    
    // Ici vous pouvez ajouter la logique pour chaque bouton personnalisé
    // Par exemple, créer des actions spécifiques selon l'ID du bouton
    
    await interaction.editReply({
        content: `✅ Bouton "${buttonId}" activé ! Vous pouvez personnaliser cette action dans le code.`
    });
};

const handleAdminButton = async (interaction) => {
    const action = interaction.customId.replace('admin_', '');
    
    // Vérifier les permissions admin
    if (!interaction.member.permissions.has('Administrator')) {
        return interaction.editReply({
            content: '❌ Vous devez être administrateur pour utiliser cette fonction.'
        });
    }

    switch (action) {
        case 'stats':
            const guild = interaction.guild;
            const statsEmbed = {
                color: 0x5865F2,
                title: '📊 Statistiques du Serveur',
                fields: [
                    { name: '👥 Membres', value: guild.memberCount.toString(), inline: true },
                    { name: '💬 Salons', value: guild.channels.cache.size.toString(), inline: true },
                    { name: '🎭 Rôles', value: guild.roles.cache.size.toString(), inline: true },
                    { name: '🎫 Tickets Ouverts', value: ticketData.stats.openTickets.toString(), inline: true },
                    { name: '📋 Total Tickets', value: ticketData.stats.totalTickets.toString(), inline: true }
                ],
                timestamp: new Date().toISOString()
            };
            await interaction.editReply({ embeds: [statsEmbed] });
            break;
            
        case 'config':
            await interaction.editReply({
                content: '⚙️ Utilisez `/config show` pour voir la configuration actuelle ou `/config <option>` pour modifier.'
            });
            break;
            
        case 'logs':
            const config = getServerConfig(interaction.guild.id);
            if (config.logsChannelId) {
                const logsChannel = interaction.guild.channels.cache.get(config.logsChannelId);
                await interaction.editReply({
                    content: `📋 Canal de logs configuré: ${logsChannel || '❌ Canal introuvable'}`
                });
            } else {
                await interaction.editReply({
                    content: '📋 Aucun canal de logs configuré. Utilisez `/config logs` pour en définir un.'
                });
            }
            break;
            
        case 'backup':
            await interaction.editReply({
                content: '💾 Sauvegarde en cours de développement...'
            });
            break;
            
        case 'maintenance':
            await interaction.editReply({
                content: '⚠️ Mode maintenance en cours de développement...'
            });
            break;
    }
};

const handleInfoButton = async (interaction) => {
    const action = interaction.customId.replace('info_', '');
    
    switch (action) {
        case 'rules':
            await interaction.editReply({
                content: '📜 Voici le règlement du serveur:\n\n1. Respectez tous les membres\n2. Pas de spam\n3. Utilisez les bons salons\n4. Suivez les ToS Discord'
            });
            break;
            
        case 'help':
            await interaction.editReply({
                content: '❓ **Aide disponible:**\n\n• `/ticket` - Gestion des tickets\n• `/embed` - Créer des embeds\n• `/panel` - Panneaux prédéfinis\n• `/config` - Configuration du bot\n• `!panel` - Panneau interactif\n\nPour plus d\'aide, contactez un modérateur.'
            });
            break;
            
        case 'contact':
            await interaction.editReply({
                content: '📧 **Nous contacter:**\n\n• Créez un ticket avec `/ticket create`\n• Utilisez `!panel` pour le panneau interactif\n• Mentionnez un modérateur\n• Envoyez un DM aux admins'
            });
            break;
    }
};

const handleSupportButton = async (interaction) => {
    const supportType = interaction.customId.replace('support_', '');
    
    // Créer un ticket selon le type de support
    const categoryMap = {
        'priority': 'support',
        'technical': 'bug',
        'billing': 'payment',
        'general': 'support',
        'feedback': 'feature'
    };
    
    const category = categoryMap[supportType] || 'support';
    await interaction.client.createTicket(interaction, category);
};

const handleRoleButton = async (interaction) => {
    const roleType = interaction.customId.replace('role_', '');
    
    // Ici vous devriez configurer les IDs de rôles via /config ou les détecter automatiquement
    const roleMap = {
        'notifications': 'notifications',
        'gaming': 'gaming',
        'creative': 'creative',
        'events': 'events',
        'dev': 'dev'
    };
    
    const roleName = roleMap[roleType];
    
    if (!roleName) {
        return interaction.editReply({
            content: '❌ Ce rôle n\'est pas configuré.'
        });
    }
    
    // Chercher le rôle par nom (vous pouvez aussi ajouter une config pour les IDs)
    const role = interaction.guild.roles.cache.find(r => 
        r.name.toLowerCase().includes(roleName.toLowerCase())
    );
    
    if (!role) {
        return interaction.editReply({
            content: `❌ Rôle "${roleName}" introuvable sur ce serveur.`
        });
    }
    
    const member = interaction.member;
    
    if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        await interaction.editReply({
            content: `✅ Rôle **${role.name}** retiré !`
        });
    } else {
        await member.roles.add(role);
        await interaction.editReply({
            content: `✅ Rôle **${role.name}** ajouté !`
        });
    }
};