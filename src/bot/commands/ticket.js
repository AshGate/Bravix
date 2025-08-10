import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Créer un ticket ou gérer les tickets')
        .addStringOption(option =>
            option.setName('raison')
                .setDescription('Raison du ticket (optionnel)')
                .setRequired(false))
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Configure le système de tickets'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Créer un nouveau ticket avec catégorie')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('Catégorie du ticket')
                        .setRequired(true)
                        .addChoices(
                            { name: '🎮 Support Général', value: 'support' },
                            { name: '🐛 Signaler un Bug', value: 'bug' },
                            { name: '💡 Demande de Fonctionnalité', value: 'feature' },
                            { name: '💰 Questions de Paiement', value: 'payment' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ajouter')
                .setDescription('Ajouter un membre au ticket actuel')
                .addUserOption(option =>
                    option.setName('membre')
                        .setDescription('Le membre à ajouter au ticket')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('retirer')
                .setDescription('Retirer un membre du ticket actuel')
                .addUserOption(option =>
                    option.setName('membre')
                        .setDescription('Le membre à retirer du ticket')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Afficher les statistiques des tickets')),

    execute: async (interaction) => {
        const subcommand = interaction.options.getSubcommand(false);
        
        // Si aucune sous-commande n'est utilisée, créer un ticket directement
        if (!subcommand) {
            const raison = interaction.options.getString('raison') || 'Support général';
            await interaction.client.createTicket(interaction, 'support', raison);
            return;
        }

        // Gérer les sous-commandes
        if (subcommand === 'setup') {
            await handleSetup(interaction);
        } else if (subcommand === 'create') {
            const category = interaction.options.getString('category');
            await interaction.client.createTicket(interaction, category);
        } else if (subcommand === 'ajouter') {
            const member = interaction.options.getUser('membre');
            await handleAddMember(interaction, member);
        } else if (subcommand === 'retirer') {
            const member = interaction.options.getUser('membre');
            await handleRemoveMember(interaction, member);
        } else if (subcommand === 'stats') {
            await handleStats(interaction);
        }
    }
};

const handleSetup = async (interaction) => {
    // Vérifier les permissions (Admin principal ou permissions serveur)
    const isMainAdmin = interaction.user.id === process.env.ADMIN_USER_ID;
    const hasAdminPerms = interaction.member.permissions.has('Administrator');
    
    if (!isMainAdmin && !hasAdminPerms) {
        return interaction.reply({
            content: '❌ Vous devez être administrateur pour utiliser cette commande.',
            flags: 64
        });
    }

    const setupEmbed = {
        color: 0x5865F2,
        title: '🎫 Système de Tickets',
        description: 'Cliquez sur l\'un des boutons ci-dessous pour créer un ticket selon votre besoin.',
        fields: [
            {
                name: '🎮 Support Général',
                value: 'Questions générales et aide',
                inline: true
            },
            {
                name: '🐛 Signaler un Bug',
                value: 'Rapporter un problème technique',
                inline: true
            },
            {
                name: '💡 Demande de Fonctionnalité',
                value: 'Suggérer une nouvelle fonctionnalité',
                inline: true
            },
            {
                name: '💰 Questions de Paiement',
                value: 'Problèmes liés aux transactions',
                inline: true
            }
        ],
        footer: {
            text: 'Un seul ticket ouvert par utilisateur à la fois'
        }
    };

    const components = [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 2,
                    label: 'Support',
                    custom_id: 'create_ticket_support'
                },
                {
                    type: 2,
                    style: 2,
                    label: 'Bug Report',
                    custom_id: 'create_ticket_bug'
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 2,
                    label: 'Feature Request',
                    custom_id: 'create_ticket_feature'
                },
                {
                    type: 2,
                    style: 2,
                    label: 'Paiement',
                    custom_id: 'create_ticket_payment'
                }
            ]
        }
    ];

    await interaction.reply({
        embeds: [setupEmbed],
        components: components
    });
};

const handleAddMember = async (interaction, member) => {
    const { ticketData, getServerConfig } = await import('../index.js');
    
    // Vérifier si on est dans un ticket
    const ticket = ticketData.tickets.get(interaction.channel.id);
    if (!ticket) {
        return interaction.reply({
            content: '❌ Cette commande ne peut être utilisée que dans un ticket.',
            flags: 64
        });
    }

    // Vérifier les permissions (créateur du ticket, staff ou admin principal)
    const isCreator = ticket.userId === interaction.user.id;
    const isMainAdmin = interaction.user.id === process.env.ADMIN_USER_ID;
    const hasAdminPerms = interaction.member.permissions.has('Administrator');
    const hasModPerms = interaction.member.permissions.has('ManageMessages');

    if (!isCreator && !isMainAdmin && !hasAdminPerms && !hasModPerms) {
        return interaction.reply({
            content: '❌ Vous n\'avez pas la permission d\'ajouter des membres à ce ticket.',
            flags: 64
        });
    }

    try {
        // Vérifier si le membre est déjà dans le ticket
        const memberPermissions = interaction.channel.permissionOverwrites.cache.get(member.id);
        if (memberPermissions && memberPermissions.allow.has('ViewChannel')) {
            return interaction.reply({
                content: `❌ ${member} a déjà accès à ce ticket.`,
                flags: 64
            });
        }

        // Ajouter les permissions au membre
        await interaction.channel.permissionOverwrites.edit(member.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true
        });

        // Vérifier et ajouter automatiquement les permissions support si nécessaire
        const config = getServerConfig(interaction.guild.id);
        if (config.supportRoleId && interaction.guild.roles.cache.has(config.supportRoleId)) {
            const supportRole = interaction.guild.roles.cache.get(config.supportRoleId);
            const currentPerms = interaction.channel.permissionOverwrites.cache.get(config.supportRoleId);
            
            if (!currentPerms || !currentPerms.allow.has('ViewChannel')) {
                await interaction.channel.permissionOverwrites.edit(config.supportRoleId, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    AttachFiles: true,
                    ManageMessages: true
                });
                console.log(`✅ Permissions support automatiquement ajoutées pour: ${supportRole.name}`);
            }
        }

        // Ajouter le membre à la liste des participants du ticket
        if (!ticket.participants) {
            ticket.participants = [];
        }
        if (!ticket.participants.includes(member.id)) {
            ticket.participants.push(member.id);
        }
        ticketData.tickets.set(interaction.channel.id, ticket);

        const addEmbed = {
            color: 0x57F287,
            title: '✅ Membre Ajouté',
            description: `${member} a été ajouté au ticket par ${interaction.user}.`,
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Système de Tickets'
            }
        };

        await interaction.reply({ embeds: [addEmbed] });

        // Notifier le membre ajouté
        try {
            await member.send({
                embeds: [{
                    color: 0x5865F2,
                    title: '🎫 Vous avez été ajouté à un ticket',
                    description: `Vous avez été ajouté au ticket **#${ticket.id}** dans le serveur **${interaction.guild.name}**.`,
                    fields: [
                        { name: 'Catégorie', value: ticket.category, inline: true },
                        { name: 'Ajouté par', value: interaction.user.tag, inline: true }
                    ],
                    timestamp: new Date().toISOString()
                }]
            });
        } catch (error) {
            console.log(`Impossible d'envoyer un DM à ${member.tag}`);
        }

        // Log dans le canal de logs si configuré
        const config = getServerConfig(interaction.guild.id);
        if (config.logsChannelId) {
            const logsChannel = interaction.guild.channels.cache.get(config.logsChannelId);
            if (logsChannel) {
                const logEmbed = {
                    color: 0x57F287,
                    title: '👥 Membre Ajouté au Ticket',
                    fields: [
                        { name: 'Ticket', value: `#${ticket.id} (<#${interaction.channel.id}>)`, inline: true },
                        { name: 'Membre Ajouté', value: `${member} (${member.tag})`, inline: true },
                        { name: 'Ajouté par', value: `${interaction.user} (${interaction.user.tag})`, inline: true }
                    ],
                    timestamp: new Date().toISOString()
                };
                await logsChannel.send({ embeds: [logEmbed] });
            }
        }

    } catch (error) {
        console.error('Erreur lors de l\'ajout du membre:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de l\'ajout du membre.',
            flags: 64
        });
    }
};

const handleRemoveMember = async (interaction, member) => {
    const { ticketData, getServerConfig } = await import('../index.js');
    
    // Vérifier si on est dans un ticket
    const ticket = ticketData.tickets.get(interaction.channel.id);
    if (!ticket) {
        return interaction.reply({
            content: '❌ Cette commande ne peut être utilisée que dans un ticket.',
            flags: 64
        });
    }

    // Vérifier les permissions
    const isCreator = ticket.userId === interaction.user.id;
    const isMainAdmin = interaction.user.id === process.env.ADMIN_USER_ID;
    const hasAdminPerms = interaction.member.permissions.has('Administrator');
    const hasModPerms = interaction.member.permissions.has('ManageMessages');

    if (!isCreator && !isMainAdmin && !hasAdminPerms && !hasModPerms) {
        return interaction.reply({
            content: '❌ Vous n\'avez pas la permission de retirer des membres de ce ticket.',
            flags: 64
        });
    }

    // Empêcher de retirer le créateur du ticket
    if (member.id === ticket.userId) {
        return interaction.reply({
            content: '❌ Vous ne pouvez pas retirer le créateur du ticket.',
            flags: 64
        });
    }

    try {
        // Vérifier si le membre a accès au ticket
        const memberPermissions = interaction.channel.permissionOverwrites.cache.get(member.id);
        if (!memberPermissions || !memberPermissions.allow.has('ViewChannel')) {
            return interaction.reply({
                content: `❌ ${member} n'a pas accès à ce ticket.`,
                flags: 64
            });
        }

        // Retirer les permissions du membre
        await interaction.channel.permissionOverwrites.delete(member.id);

        // Retirer le membre de la liste des participants
        if (ticket.participants) {
            ticket.participants = ticket.participants.filter(id => id !== member.id);
            ticketData.tickets.set(interaction.channel.id, ticket);
        }

        const removeEmbed = {
            color: 0xED4245,
            title: '❌ Membre Retiré',
            description: `${member} a été retiré du ticket par ${interaction.user}.`,
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Système de Tickets'
            }
        };

        await interaction.reply({ embeds: [removeEmbed] });

        // Log dans le canal de logs si configuré
        const config = getServerConfig(interaction.guild.id);
        if (config.logsChannelId) {
            const logsChannel = interaction.guild.channels.cache.get(config.logsChannelId);
            if (logsChannel) {
                const logEmbed = {
                    color: 0xED4245,
                    title: '👥 Membre Retiré du Ticket',
                    fields: [
                        { name: 'Ticket', value: `#${ticket.id} (<#${interaction.channel.id}>)`, inline: true },
                        { name: 'Membre Retiré', value: `${member} (${member.tag})`, inline: true },
                        { name: 'Retiré par', value: `${interaction.user} (${interaction.user.tag})`, inline: true }
                    ],
                    timestamp: new Date().toISOString()
                };
                await logsChannel.send({ embeds: [logEmbed] });
            }
        }

    } catch (error) {
        console.error('Erreur lors du retrait du membre:', error);
        await interaction.reply({
            content: '❌ Une erreur est survenue lors du retrait du membre.',
            flags: 64
        });
    }
};

const handleStats = async (interaction) => {
    const { ticketData } = await import('../index.js');
    
    const statsEmbed = {
        color: 0x5865F2,
        title: '📊 Statistiques des Tickets',
        fields: [
            {
                name: '📈 Total des Tickets',
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
            }
        ],
        timestamp: new Date().toISOString(),
        footer: {
            text: 'Système de Tickets'
        }
    };

    await interaction.reply({ embeds: [statsEmbed] });
};