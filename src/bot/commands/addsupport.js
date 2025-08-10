import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('addsupport')
        .setDescription('Ajouter ou retirer un rôle support qui aura accès à tous les tickets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ajouter un rôle support')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Le rôle à ajouter comme support')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Retirer un rôle support')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Le rôle à retirer du support')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Voir la liste des rôles support'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Supprimer tous les rôles support')),

    execute: async (interaction) => {
        // Vérifier les permissions (Admin principal ou permissions serveur)
        const isMainAdmin = interaction.user.id === process.env.ADMIN_USER_ID;
        const hasAdminPerms = interaction.member.permissions.has('Administrator');
        
        if (!isMainAdmin && !hasAdminPerms) {
            return interaction.reply({
                content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                ephemeral: true
            });
        }

        const { getServerConfig, serverConfigs } = await import('../../api/index.js');
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const config = getServerConfig(guildId);

        // Initialiser la liste des rôles support si elle n'existe pas
        if (!config.supportRoles) {
            config.supportRoles = [];
        }

        switch (subcommand) {
            case 'add':
                await handleAddSupport(interaction, config, serverConfigs, guildId);
                break;
            case 'remove':
                await handleRemoveSupport(interaction, config, serverConfigs, guildId);
                break;
            case 'list':
                await handleListSupport(interaction, config);
                break;
            case 'clear':
                await handleClearSupport(interaction, config, serverConfigs, guildId);
                break;
        }
    }
};

const handleAddSupport = async (interaction, config, serverConfigs, guildId) => {
    const role = interaction.options.getRole('role');
    
    // Importer la constante du rôle automatique
    const { AUTO_SUPPORT_ROLE_ID } = await import('../../api/index.js');
    
    if (config.supportRoles.includes(role.id)) {
        return interaction.reply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Rôle Déjà Ajouté',
                description: role.id === AUTO_SUPPORT_ROLE_ID ? 
                    `Le rôle ${role} est le rôle support automatique du système.` :
                    `Le rôle ${role} est déjà dans la liste des rôles support.`,
                timestamp: new Date().toISOString()
            }],
            ephemeral: true
        });
    }

    config.supportRoles.push(role.id);
    serverConfigs.set(guildId, config);

    // Ajouter le rôle à tous les tickets existants
    const { ticketData } = await import('../../api/index.js');
    const guild = interaction.guild;
    let ticketsUpdated = 0;

    for (const [channelId, ticket] of ticketData.tickets) {
        if (ticket.guildId === guildId && ticket.status === 'open') {
            try {
                const channel = guild.channels.cache.get(channelId);
                if (channel) {
                    await channel.permissionOverwrites.edit(role.id, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true,
                        AttachFiles: true,
                        ManageMessages: true
                    });
                    ticketsUpdated++;
                }
            } catch (error) {
                console.error(`❌ Erreur lors de l'ajout du rôle ${role.name} au ticket ${channelId}:`, error);
            }
        }
    }

    await interaction.reply({
        embeds: [{
            color: 0x57F287,
            title: '✅ Rôle Support Ajouté',
            description: `Le rôle ${role} a été ajouté à la liste des rôles support.`,
            fields: [
                {
                    name: '📊 Tickets Mis à Jour',
                    value: `${ticketsUpdated} tickets existants ont été mis à jour avec les nouvelles permissions.`,
                    inline: false
                },
                {
                    name: '🔧 Type de Rôle',
                    value: role.id === AUTO_SUPPORT_ROLE_ID ? 
                        '🤖 Rôle support automatique du système' : 
                        '👤 Rôle support ajouté manuellement',
                    inline: false
                },
                {
                    name: '🔧 Permissions Accordées',
                    value: '• Voir les tickets\n• Envoyer des messages\n• Lire l\'historique\n• Joindre des fichiers\n• Gérer les messages',
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        }]
    });

    console.log(`✅ Rôle support ajouté: ${role.name} (${role.id}) pour ${guild.name}`);
    console.log(`📊 ${ticketsUpdated} tickets mis à jour avec les nouvelles permissions`);
};

const handleRemoveSupport = async (interaction, config, serverConfigs, guildId) => {
    const role = interaction.options.getRole('role');
    
    if (!config.supportRoles.includes(role.id)) {
        return interaction.reply({
            embeds: [{
                color: 0xED4245,
                title: '❌ Rôle Non Trouvé',
                description: `Le rôle ${role} n'est pas dans la liste des rôles support.`,
                timestamp: new Date().toISOString()
            }],
            ephemeral: true
        });
    }

    config.supportRoles = config.supportRoles.filter(roleId => roleId !== role.id);
    serverConfigs.set(guildId, config);

    // Retirer le rôle de tous les tickets existants (optionnel)
    const { ticketData } = await import('../../api/index.js');
    const guild = interaction.guild;
    let ticketsUpdated = 0;

    for (const [channelId, ticket] of ticketData.tickets) {
        if (ticket.guildId === guildId && ticket.status === 'open') {
            try {
                const channel = guild.channels.cache.get(channelId);
                if (channel) {
                    await channel.permissionOverwrites.delete(role.id);
                    ticketsUpdated++;
                }
            } catch (error) {
                console.error(`❌ Erreur lors du retrait du rôle ${role.name} du ticket ${channelId}:`, error);
            }
        }
    }

    await interaction.reply({
        embeds: [{
            color: 0xED4245,
            title: '✅ Rôle Support Retiré',
            description: `Le rôle ${role} a été retiré de la liste des rôles support.`,
            fields: [
                {
                    name: '📊 Tickets Mis à Jour',
                    value: `${ticketsUpdated} tickets existants ont été mis à jour (permissions retirées).`,
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        }]
    });

    console.log(`✅ Rôle support retiré: ${role.name} (${role.id}) pour ${guild.name}`);
};

const handleListSupport = async (interaction, config) => {
    const guild = interaction.guild;
    
    // Importer la constante du rôle automatique
    const { AUTO_SUPPORT_ROLE_ID } = await import('../../api/index.js');
    
    if (!config.supportRoles || config.supportRoles.length === 0) {
        return interaction.reply({
            embeds: [{
                color: 0xF39C12,
                title: '📋 Rôles Support',
                description: 'Aucun rôle support configuré.\n\nUtilisez `/addsupport add @role` pour ajouter un rôle.',
                timestamp: new Date().toISOString()
            }],
            ephemeral: true
        });
    }

    const supportRolesList = config.supportRoles
        .map(roleId => {
            const role = guild.roles.cache.get(roleId);
            if (role) {
                const roleType = roleId === AUTO_SUPPORT_ROLE_ID ? ' 🤖 (Automatique)' : ' 👤 (Manuel)';
                return `• ${role} (${role.name})${roleType}`;
            } else {
                return `• ❌ Rôle introuvable (${roleId})`;
            }
        })
        .join('\n');

    await interaction.reply({
        embeds: [{
            color: 0x5865F2,
            title: '📋 Rôles Support Configurés',
            description: `**${config.supportRoles.length}** rôle(s) support configuré(s) :\n\n${supportRolesList}`,
            fields: [
                {
                    name: '🔧 Permissions Accordées',
                    value: '• Accès à tous les tickets\n• Envoyer des messages\n• Gérer les messages\n• Joindre des fichiers',
                    inline: false
                }
            ],
            footer: {
                text: 'Ces rôles ont automatiquement accès à tous les nouveaux tickets'
            },
            timestamp: new Date().toISOString()
        }],
        ephemeral: true
    });
};

const handleClearSupport = async (interaction, config, serverConfigs, guildId) => {
    if (!config.supportRoles || config.supportRoles.length === 0) {
        return interaction.reply({
            embeds: [{
                color: 0xF39C12,
                title: '⚠️ Aucun Rôle à Supprimer',
                description: 'Il n\'y a aucun rôle support configuré à supprimer.',
                timestamp: new Date().toISOString()
            }],
            ephemeral: true
        });
    }

    const roleCount = config.supportRoles.length;
    config.supportRoles = [];
    serverConfigs.set(guildId, config);

    await interaction.reply({
        embeds: [{
            color: 0xED4245,
            title: '🗑️ Rôles Support Supprimés',
            description: `Tous les rôles support (${roleCount}) ont été supprimés de la configuration.`,
            fields: [
                {
                    name: '⚠️ Important',
                    value: 'Les permissions des tickets existants ne sont pas automatiquement retirées. Utilisez `/addsupport remove` pour retirer les permissions individuellement si nécessaire.',
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        }]
    });

    console.log(`🗑️ Tous les rôles support supprimés pour ${interaction.guild.name} (${roleCount} rôles)`);
};