import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Créer des panneaux prédéfinis')
        .addSubcommand(subcommand =>
            subcommand
                .setName('admin')
                .setDescription('Panneau d\'administration'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Panneau d\'informations du serveur'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('support')
                .setDescription('Panneau de support avancé'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('roles')
                .setDescription('Panneau de sélection de rôles')),

    execute: async (interaction) => {
        const subcommand = interaction.options.getSubcommand();

        // Vérifier les permissions (Admin principal ou permissions serveur)
        const isMainAdmin = interaction.user.id === process.env.ADMIN_USER_ID;
        const hasAdminPerms = interaction.member.permissions.has('Administrator');
        const hasModPerms = interaction.member.permissions.has('ManageMessages');

        if (!isMainAdmin && !hasAdminPerms && !hasModPerms) {
            return interaction.reply({
                content: '❌ Vous devez avoir des permissions de modération pour utiliser cette commande.',
                ephemeral: true
            });
        }

        switch (subcommand) {
            case 'admin':
                await createAdminPanel(interaction);
                break;
            case 'info':
                await createInfoPanel(interaction);
                break;
            case 'support':
                await createSupportPanel(interaction);
                break;
            case 'roles':
                await createRolesPanel(interaction);
                break;
        }
    }
};

const createAdminPanel = async (interaction) => {
    const embed = new EmbedBuilder()
        .setTitle('🛠️ Panneau d\'Administration')
        .setDescription('Utilisez les boutons ci-dessous pour accéder aux différentes fonctions d\'administration.')
        .setColor(0xED4245)
        .addFields(
            { name: '📊 Statistiques', value: 'Voir les stats du serveur', inline: true },
            { name: '🔧 Configuration', value: 'Modifier les paramètres', inline: true },
            { name: '📋 Logs', value: 'Consulter les journaux', inline: true }
        )
        .setFooter({ text: 'Panneau réservé aux administrateurs' })
        .setTimestamp();

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('admin_stats')
                .setLabel('Statistiques')
                .setEmoji('📊')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('admin_config')
                .setLabel('Configuration')
                .setEmoji('🔧')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('admin_logs')
                .setLabel('Logs')
                .setEmoji('📋')
                .setStyle(ButtonStyle.Secondary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('admin_backup')
                .setLabel('Sauvegarde')
                .setEmoji('💾')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('admin_maintenance')
                .setLabel('Maintenance')
                .setEmoji('⚠️')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.reply({
        embeds: [embed],
        components: [row1, row2]
    });
};

const createInfoPanel = async (interaction) => {
    const guild = interaction.guild;
    
    const embed = new EmbedBuilder()
        .setTitle(`ℹ️ Informations - ${guild.name}`)
        .setDescription('Bienvenue sur notre serveur Discord ! Voici les informations importantes.')
        .setColor(0x5865F2)
        .setThumbnail(guild.iconURL())
        .addFields(
            { name: '👥 Membres', value: guild.memberCount.toString(), inline: true },
            { name: '📅 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
            { name: '🎭 Rôles', value: guild.roles.cache.size.toString(), inline: true }
        )
        .setFooter({ text: `ID du serveur: ${guild.id}` })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('info_rules')
                .setLabel('Règlement')
                .setEmoji('📜')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('info_help')
                .setLabel('Aide')
                .setEmoji('❓')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('info_contact')
                .setLabel('Contact')
                .setEmoji('📧')
                .setStyle(ButtonStyle.Success)
        );

    await interaction.reply({
        embeds: [embed],
        components: [row]
    });
};

const createSupportPanel = async (interaction) => {
    const embed = new EmbedBuilder()
        .setTitle('🎫 Support Avancé')
        .setDescription('Choisissez le type de support dont vous avez besoin. Notre équipe est là pour vous aider !')
        .setColor(0x57F287)
        .addFields(
            { name: '🚀 Support Prioritaire', value: 'Pour les problèmes urgents', inline: true },
            { name: '🔧 Support Technique', value: 'Problèmes techniques', inline: true },
            { name: '💰 Support Facturation', value: 'Questions de paiement', inline: true }
        )
        .setFooter({ text: 'Temps de réponse moyen: 2-4 heures' })
        .setTimestamp();

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('support_priority')
                .setLabel('Support Prioritaire')
                .setEmoji('🚀')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('support_technical')
                .setLabel('Support Technique')
                .setEmoji('🔧')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('support_billing')
                .setLabel('Facturation')
                .setEmoji('💰')
                .setStyle(ButtonStyle.Success)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('support_general')
                .setLabel('Question Générale')
                .setEmoji('💬')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('support_feedback')
                .setLabel('Feedback')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.reply({
        embeds: [embed],
        components: [row1, row2]
    });
};

const createRolesPanel = async (interaction) => {
    const embed = new EmbedBuilder()
        .setTitle('🎭 Sélection de Rôles')
        .setDescription('Cliquez sur les boutons pour obtenir ou retirer des rôles.')
        .setColor(0xF1C40F)
        .addFields(
            { name: '🔔 Notifications', value: 'Recevoir les annonces', inline: true },
            { name: '🎮 Gaming', value: 'Accès aux salons gaming', inline: true },
            { name: '🎨 Créatif', value: 'Accès aux salons créatifs', inline: true }
        )
        .setFooter({ text: 'Vous pouvez changer vos rôles à tout moment' })
        .setTimestamp();

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('role_notifications')
                .setLabel('Notifications')
                .setEmoji('🔔')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('role_gaming')
                .setLabel('Gaming')
                .setEmoji('🎮')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('role_creative')
                .setLabel('Créatif')
                .setEmoji('🎨')
                .setStyle(ButtonStyle.Secondary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('role_events')
                .setLabel('Événements')
                .setEmoji('🎉')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('role_dev')
                .setLabel('Développement')
                .setEmoji('💻')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.reply({
        embeds: [embed],
        components: [row1, row2]
    });
};