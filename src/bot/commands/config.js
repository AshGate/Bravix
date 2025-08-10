import { SlashCommandBuilder, ChannelType } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configuration du bot pour ce serveur')
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Afficher la configuration actuelle'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('category')
                .setDescription('Définir la catégorie pour les tickets')
                .addChannelOption(option =>
                    option.setName('categorie')
                        .setDescription('La catégorie où créer les tickets')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Définir le salon de logs')
                .addChannelOption(option =>
                    option.setName('salon')
                        .setDescription('Le salon pour les logs du bot')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('transcripts')
                .setDescription('Définir le salon des transcripts')
                .addChannelOption(option =>
                    option.setName('salon')
                        .setDescription('Le salon pour les transcripts des tickets')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('support')
                .setDescription('Définir le rôle de support')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Le rôle qui peut gérer les tickets')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Réinitialiser la configuration du serveur')),

    execute: async (interaction) => {
        // Vérifier les permissions (Admin principal ou permissions serveur)
        const isMainAdmin = interaction.user.id === process.env.ADMIN_USER_ID;
        const hasAdminPerms = interaction.member.permissions.has('Administrator');
        
        if (!isMainAdmin && !hasAdminPerms) {
            return interaction.reply({
                content: '❌ Vous devez être administrateur pour utiliser cette commande.',
                flags: 64
            });
        }

        const { serverConfigs } = await import('../index.js');
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        // Initialiser la config du serveur si elle n'existe pas
        if (!serverConfigs.has(guildId)) {
            serverConfigs.set(guildId, {});
        }

        const config = serverConfigs.get(guildId);

        switch (subcommand) {
            case 'show':
                await handleShowConfig(interaction, config);
                break;
            case 'category':
                const category = interaction.options.getChannel('categorie');
                config.ticketCategoryId = category.id;
                serverConfigs.set(guildId, config);
                await interaction.reply({
                    embeds: [{
                        color: 0x57F287,
                        title: '✅ Configuration Mise à Jour',
                        description: `Catégorie des tickets définie sur **${category.name}**`,
                        timestamp: new Date().toISOString()
                    }]
                });
                break;
            case 'logs':
                const logsChannel = interaction.options.getChannel('salon');
                config.logsChannelId = logsChannel.id;
                serverConfigs.set(guildId, config);
                await interaction.reply({
                    embeds: [{
                        color: 0x57F287,
                        title: '✅ Configuration Mise à Jour',
                        description: `Salon de logs défini sur ${logsChannel}`,
                        timestamp: new Date().toISOString()
                    }]
                });
                break;
            case 'transcripts':
                const transcriptChannel = interaction.options.getChannel('salon');
                config.transcriptChannelId = transcriptChannel.id;
                serverConfigs.set(guildId, config);
                await interaction.reply({
                    embeds: [{
                        color: 0x57F287,
                        title: '✅ Configuration Mise à Jour',
                        description: `Salon des transcripts défini sur ${transcriptChannel}`,
                        timestamp: new Date().toISOString()
                    }]
                });
                break;
            case 'support':
                const supportRole = interaction.options.getRole('role');
                config.supportRoleId = supportRole.id;
                serverConfigs.set(guildId, config);
                await interaction.reply({
                    embeds: [{
                        color: 0x57F287,
                        title: '✅ Configuration Mise à Jour',
                        description: `Rôle de support défini sur ${supportRole}`,
                        timestamp: new Date().toISOString()
                    }]
                });
                break;
            case 'reset':
                serverConfigs.set(guildId, {});
                await interaction.reply({
                    embeds: [{
                        color: 0xED4245,
                        title: '🔄 Configuration Réinitialisée',
                        description: 'Toute la configuration de ce serveur a été supprimée.',
                        timestamp: new Date().toISOString()
                    }]
                });
                break;
        }
    }
};

const handleShowConfig = async (interaction, config) => {
    const guild = interaction.guild;
    
    const fields = [];
    
    // Catégorie des tickets
    if (config.ticketCategoryId) {
        const category = guild.channels.cache.get(config.ticketCategoryId);
        fields.push({
            name: '📁 Catégorie des Tickets',
            value: category ? category.name : '❌ Catégorie introuvable',
            inline: true
        });
    } else {
        fields.push({
            name: '📁 Catégorie des Tickets',
            value: '⚠️ Non configurée (création automatique)',
            inline: true
        });
    }
    
    // Salon de logs
    if (config.logsChannelId) {
        const logsChannel = guild.channels.cache.get(config.logsChannelId);
        fields.push({
            name: '📋 Salon de Logs',
            value: logsChannel ? `<#${logsChannel.id}>` : '❌ Salon introuvable',
            inline: true
        });
    } else {
        fields.push({
            name: '📋 Salon de Logs',
            value: '⚠️ Non configuré',
            inline: true
        });
    }
    
    // Salon des transcripts
    if (config.transcriptChannelId) {
        const transcriptChannel = guild.channels.cache.get(config.transcriptChannelId);
        fields.push({
            name: '📄 Salon des Transcripts',
            value: transcriptChannel ? `<#${transcriptChannel.id}>` : '❌ Salon introuvable',
            inline: true
        });
    } else {
        fields.push({
            name: '📄 Salon des Transcripts',
            value: '⚠️ Non configuré',
            inline: true
        });
    }
    
    // Rôle de support
    if (config.supportRoleId) {
        const supportRole = guild.roles.cache.get(config.supportRoleId);
        fields.push({
            name: '🛡️ Rôle de Support',
            value: supportRole ? `<@&${supportRole.id}>` : '❌ Rôle introuvable',
            inline: true
        });
    } else {
        fields.push({
            name: '🛡️ Rôle de Support',
            value: '⚠️ Non configuré (détection automatique)',
            inline: true
        });
    }

    const embed = {
        color: 0x5865F2,
        title: '⚙️ Configuration du Bot',
        description: `Configuration actuelle pour **${guild.name}**`,
        fields: fields,
        footer: {
            text: 'Utilisez /config <option> pour modifier la configuration'
        },
        timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
};