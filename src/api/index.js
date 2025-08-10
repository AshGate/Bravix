import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

// Importer les routes
import ticketsRouter from './routes/tickets.js';
import authRouter from './routes/auth.js';
import serkoRouter from './routes/serko.js';

// Charger les variables d'environnement
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration du bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Collections pour les commandes
client.commands = new Collection();
client.tickets = new Collection();

// Configuration Express et Socket.IO pour l'interface web
const app = express();
const server = createServer(app);

// CORS plus permissif pour Railway
app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// Middleware pour parser JSON
app.use(express.json());

// 🔧 CORRECTION CRITIQUE : Chemin correct pour les fichiers statiques
const distPath = path.resolve(__dirname, '../../dist');
console.log('📁 Chemin des fichiers statiques (résolu):', distPath);

// Vérifier si le dossier dist existe
import { existsSync } from 'fs';
if (existsSync(distPath)) {
    console.log('✅ Dossier dist trouvé, servir les fichiers statiques');
    app.use(express.static(distPath));
} else {
    console.error('❌ Dossier dist non trouvé à:', distPath);
    console.log('🔧 Tentative de construction automatique...');
    
    // Essayer de construire automatiquement
    try {
        const { execSync } = await import('child_process');
        console.log('🔨 Construction du projet en cours...');
        execSync('npm run build', { cwd: path.resolve(__dirname, '../..'), stdio: 'inherit' });
        console.log('✅ Construction terminée');
    } catch (buildError) {
        console.error('❌ Erreur lors de la construction:', buildError.message);
    }
}

// Configuration Socket.IO
const io = new Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Stockage des données en mémoire
const ticketData = {
    tickets: new Map(),
    stats: {
        totalTickets: 0,
        openTickets: 0,
        closedTickets: 0,
        averageResponseTime: 0
    },
    globalTicketCounter: 0
};

// Stockage des configurations par serveur
const serverConfigs = new Map();

// Configuration automatique du rôle support spécifique
const AUTO_SUPPORT_ROLE_ID = '1223303584360300605';

// Stockage des panneaux de tickets par serveur
const ticketPanels = new Map();

// Fonction pour obtenir la configuration d'un serveur
const getServerConfig = (guildId) => {
    if (!serverConfigs.has(guildId)) {
        // Configuration par défaut avec le rôle support automatique
        serverConfigs.set(guildId, {
            supportRoles: [AUTO_SUPPORT_ROLE_ID]
        });
        console.log(`✅ Configuration automatique créée pour ${guildId} avec rôle support: ${AUTO_SUPPORT_ROLE_ID}`);
    }
    
    const config = serverConfigs.get(guildId);
    
    // S'assurer que le rôle support automatique est toujours présent
    if (!config.supportRoles) {
        config.supportRoles = [];
    }
    
    if (!config.supportRoles.includes(AUTO_SUPPORT_ROLE_ID)) {
        config.supportRoles.push(AUTO_SUPPORT_ROLE_ID);
        serverConfigs.set(guildId, config);
        console.log(`✅ Rôle support automatique ajouté à ${guildId}: ${AUTO_SUPPORT_ROLE_ID}`);
    }
    
    return serverConfigs.get(guildId);
};

// Fonction pour obtenir les panneaux d'un serveur
const getServerPanels = (guildId) => {
    if (!ticketPanels.has(guildId)) {
        ticketPanels.set(guildId, new Map());
    }
    return ticketPanels.get(guildId);
};

// Chargement des commandes
const loadCommands = async () => {
    try {
        console.log('📋 Chargement des commandes...');
        const commandsPath = join(__dirname, '../bot/commands');
        
        if (!existsSync(commandsPath)) {
            console.warn('⚠️ Dossier commands non trouvé à:', commandsPath);
            return;
        }
        
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const filePath = join(commandsPath, file);
                const fileUrl = new URL(`file://${filePath.replace(/\\/g, '/')}`);
                const command = await import(fileUrl.href);
                if (command.default && command.default.data && command.default.execute) {
                    client.commands.set(command.default.data.name, command.default);
                    console.log(`✅ Commande chargée: ${command.default.data.name}`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de ${file}:`, error.message);
            }
        }
        console.log(`📋 ${client.commands.size} commandes chargées au total`);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des commandes:', error);
    }
};

// Chargement des événements
const loadEvents = async () => {
    try {
        console.log('🎯 Chargement des événements...');
        const eventsPath = join(__dirname, '../bot/events');
        
        if (!existsSync(eventsPath)) {
            console.warn('⚠️ Dossier events non trouvé à:', eventsPath);
            return;
        }
        
        const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            try {
                const filePath = join(eventsPath, file);
                const fileUrl = new URL(`file://${filePath.replace(/\\/g, '/')}`);
                const event = await import(fileUrl.href);
                if (event.default) {
                    if (event.default.once) {
                        client.once(event.default.name, (...args) => event.default.execute(...args));
                    } else {
                        client.on(event.default.name, (...args) => event.default.execute(...args));
                    }
                    console.log(`✅ Événement chargé: ${event.default.name}`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de ${file}:`, error.message);
            }
        }
        console.log(`🎯 Événements chargés`);
    } catch (error) {
        console.error('❌ Erreur lors du chargement des événements:', error);
    }
};

// Route de santé améliorée
app.get('/api/health', (req, res) => {
    const healthData = {
        status: 'OK',
        message: 'Bot Discord Serko - Système de Tickets',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        railway: {
            url: process.env.RAILWAY_STATIC_URL || 'Non défini',
            domain: process.env.RAILWAY_PUBLIC_DOMAIN || 'Non défini'
        },
        paths: {
            distPath: distPath,
            distExists: existsSync(distPath),
            currentDir: __dirname
        },
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.version
        },
        bot: {
            connected: client.isReady(),
            user: client.user?.tag || 'Non connecté',
            guilds: client.guilds?.cache?.size || 0,
            ping: client.ws.ping || 0
        }
    };
    
    res.json(healthData);
});

// Route pour lister les serveurs du bot
app.get('/api/debug/guilds', (req, res) => {
    if (!client.isReady()) {
        return res.status(503).json({ error: 'Bot non connecté' });
    }

    const guilds = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        owner: guild.ownerId
    }));

    console.log(`🔍 Debug: ${guilds.length} serveurs trouvés`);
    res.json({ 
        guilds, 
        total: guilds.length,
        timestamp: new Date().toISOString()
    });
});

// Route pour les statistiques
app.get('/api/stats', (req, res) => {
    try {
        const stats = {
            ...ticketData.stats,
            ticketsToday: Array.from(ticketData.tickets.values())
                .filter(ticket => {
                    const today = new Date();
                    const ticketDate = new Date(ticket.createdAt);
                    return ticketDate.toDateString() === today.toDateString();
                }).length
        };
        console.log('📊 Stats demandées:', stats);
        res.json(stats);
    } catch (error) {
        console.error('❌ Erreur API stats:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

// Utiliser les routes modulaires
app.use('/api/tickets', ticketsRouter);
app.use('/api/auth', authRouter);
app.use('/api/serko', serkoRouter);

// Socket.IO pour les mises à jour en temps réel
io.on('connection', (socket) => {
    console.log('🌐 Interface web connectée');
    
    socket.on('disconnect', () => {
        console.log('🌐 Interface web déconnectée');
    });
});

// Fonctions utilitaires pour les tickets
client.createTicket = async (interaction, category, customReason = null) => {
    try {
        const guild = interaction.guild;
        const user = interaction.user;
        const config = getServerConfig(guild.id);
        
        console.log(`🎫 Création de ticket demandée par ${user.tag} (catégorie: ${category})`);
        
        // Vérifier si l'interaction a déjà été traitée
        if (interaction.replied) {
            console.warn('⚠️ Interaction déjà traitée pour la création de ticket');
            return;
        }
        
        const existingTicket = Array.from(ticketData.tickets.values())
            .find(ticket => ticket.userId === user.id && ticket.status === 'open');
        
        if (existingTicket) {
            return interaction.editReply({
                content: `❌ Vous avez déjà un ticket ouvert: <#${existingTicket.channelId}>`
            });
        }

        // L'interaction est déjà déférée par interactionCreate.js
        await interaction.editReply({
            content: '🎫 Création de votre ticket en cours...'
        });

        ticketData.globalTicketCounter++;
        const ticketNumber = ticketData.globalTicketCounter;
        
        const channelName = `ticket-${ticketNumber}-${user.username}`.toLowerCase();
        
        let ticketCategory = null;
        
        if (config.ticketCategoryId) {
            ticketCategory = guild.channels.cache.get(config.ticketCategoryId);
        }
        
        if (!ticketCategory) {
            ticketCategory = guild.channels.cache.find(c => 
                c.type === 4 && c.name.toLowerCase().includes('ticket')
            );
            
            if (!ticketCategory) {
                try {
                    ticketCategory = await guild.channels.create({
                        name: '🎫 TICKETS',
                        type: 4,
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: ['ViewChannel']
                            }
                        ]
                    });
                } catch (error) {
                    console.log('⚠️ Impossible de créer la catégorie, création du ticket sans catégorie');
                }
            }
        }
        
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: 0,
            parent: ticketCategory?.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: ['ViewChannel']
                },
                {
                    id: user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AttachFiles']
                }
            ]
        });

        // Ajouter automatiquement les permissions pour le rôle support configuré
        // Ajouter les permissions pour tous les rôles support configurés
        await addSupportPermissions(ticketChannel, guild, config);
        
        // Ajouter automatiquement les permissions pour les administrateurs
        const adminRoles = guild.roles.cache.filter(role => 
            role.permissions.has('Administrator') && !role.managed
        );
        
        for (const [roleId, role] of adminRoles) {
            await ticketChannel.permissionOverwrites.edit(roleId, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true,
                ManageMessages: true,
                ManageChannels: true
            });
            console.log(`✅ Permissions administrateur ajoutées pour le rôle: ${role.name}`);
        }

        const ticket = {
            id: ticketNumber,
            channelId: ticketChannel.id,
            userId: user.id,
            username: user.username,
            category: category,
            status: 'open',
            createdAt: new Date().toISOString(),
            claimedBy: null,
            messages: [],
            participants: [],
            reason: customReason,
            guildId: guild.id
        };

        ticketData.tickets.set(ticketChannel.id, ticket);
        ticketData.stats.totalTickets++;
        ticketData.stats.openTickets++;

        const welcomeEmbed = {
            color: 0x5865F2,
            title: `🎫 Ticket #${ticketNumber}`,
            description: `Bonjour ${user}, merci d'avoir créé un ticket!\n\n**Catégorie:** ${category}\n**Status:** Ouvert${customReason ? `\n**Raison:** ${customReason}` : ''}\n\nUn membre de l'équipe vous répondra bientôt. En attendant, décrivez votre problème en détail.`,
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Serko Ticket System'
            }
        };

        let mentions = user.toString();
        if (config.supportRoleId && guild.roles.cache.has(config.supportRoleId)) {
            mentions += ` <@&${config.supportRoleId}>`;
        }

        await ticketChannel.send({
            content: mentions,
            embeds: [welcomeEmbed],
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

        await interaction.editReply({
            content: `✅ Votre ticket **#${ticketNumber}** a été créé: ${ticketChannel}`
        });

        console.log(`✅ Ticket #${ticketNumber} créé avec succès pour ${user.tag}`);

        if (config.logsChannelId) {
            const logsChannel = guild.channels.cache.get(config.logsChannelId);
            if (logsChannel) {
                const logEmbed = {
                    color: 0x57F287,
                    title: '🎫 Nouveau Ticket Créé',
                    fields: [
                        { name: 'Ticket', value: `#${ticket.id} (<#${ticketChannel.id}>)`, inline: true },
                        { name: 'Utilisateur', value: `${user} (${user.tag})`, inline: true },
                        { name: 'Catégorie', value: category, inline: true }
                    ],
                    timestamp: new Date().toISOString()
                };
                if (customReason) {
                    logEmbed.fields.push({ name: 'Raison', value: customReason, inline: false });
                }
                await logsChannel.send({ embeds: [logEmbed] });
            }
        }

        io.emit('ticketCreated', ticket);

    } catch (error) {
        console.error('❌ Erreur lors de la création du ticket:', error);
        
        try {
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({
                    content: '❌ Une erreur est survenue lors de la création du ticket.'
                });
            } else if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Une erreur est survenue lors de la création du ticket.',
                    flags: 64
                });
            }
        } catch (replyError) {
            console.error('❌ Impossible de répondre à l\'erreur de création de ticket:', replyError);
        }
    }
};

// Fonction utilitaire pour ajouter les permissions support à un canal
const addSupportPermissions = async (channel, guild, config) => {
    try {
        console.log(`🔧 Ajout des permissions support pour le canal: ${channel.name}`);
        
        // 1. Rôles support configurés manuellement avec /addsupport
        if (config.supportRoles && config.supportRoles.length > 0) {
            console.log(`📋 Rôles support configurés: ${config.supportRoles.length}`);
            for (const roleId of config.supportRoles) {
                const role = guild.roles.cache.get(roleId);
                if (role) {
                    await channel.permissionOverwrites.edit(roleId, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true,
                        AttachFiles: true,
                        ManageMessages: true
                    });
                    if (roleId === AUTO_SUPPORT_ROLE_ID) {
                        console.log(`✅ Permissions support ajoutées pour: ${role.name} (rôle automatique)`);
                    } else {
                        console.log(`✅ Permissions support ajoutées pour: ${role.name} (configuré manuellement)`);
                    }
                }
            }
        }

        // 2. Rôle support principal configuré avec /config support
        if (config.supportRoleId && guild.roles.cache.has(config.supportRoleId)) {
            const supportRole = guild.roles.cache.get(config.supportRoleId);
            await channel.permissionOverwrites.edit(config.supportRoleId, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true,
                ManageMessages: true
            });
            console.log(`✅ Permissions support ajoutées pour: ${supportRole.name} (rôle principal)`);
        }

        // 3. Détection automatique des rôles support (fallback)
        if ((!config.supportRoles || config.supportRoles.length === 0) && !config.supportRoleId) {
            const supportRoles = guild.roles.cache.filter(role => 
                (role.name.toLowerCase().includes('support') ||
                role.name.toLowerCase().includes('staff') ||
                role.name.toLowerCase().includes('mod') ||
                role.name.toLowerCase().includes('helper') ||
                role.permissions.has('ManageMessages')) &&
                !role.managed
            );
            
            for (const [roleId, role] of supportRoles) {
                await channel.permissionOverwrites.edit(roleId, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    AttachFiles: true,
                    ManageMessages: true
                });
                console.log(`✅ Permissions automatiques ajoutées pour: ${role.name} (détection auto)`);
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout des permissions support:', error);
    }
};

// Route catch-all pour React Router - DOIT ÊTRE EN DERNIER
app.get('*', (req, res) => {
    console.log(`🌐 Route catch-all pour React: ${req.path}`);
    
    const indexPath = path.join(distPath, 'index.html');
    if (existsSync(indexPath)) {
        console.log('✅ Envoi du fichier index.html');
        res.sendFile(indexPath);
    } else {
        console.error('❌ index.html non trouvé à:', indexPath);
        res.status(404).send(`
            <html>
                <head><title>Serko - Erreur de déploiement</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <h1>🚀 Serko - Système de Tickets Discord</h1>
                    <h2>❌ Erreur de déploiement</h2>
                    <p>Le fichier index.html n'a pas été trouvé.</p>
                    <p>Chemin recherché: ${indexPath}</p>
                    <p>Veuillez exécuter <code>npm run build</code> pour générer les fichiers.</p>
                    <hr>
                    <p><a href="/api/health" style="color: #fff;">Vérifier l'API</a></p>
                    <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Recharger la Page
                    </button>
                </body>
            </html>
        `);
    }
});

// Initialisation du bot
const init = async () => {
    try {
        console.log('🚀 Démarrage du système Serko...');
        console.log('📋 Vérification des variables d\'environnement...');
        
        if (!process.env.DISCORD_TOKEN) {
            console.warn('⚠️ DISCORD_TOKEN manquant - Le bot Discord ne sera pas démarré');
        }
        
        if (!process.env.DISCORD_CLIENT_ID) {
            console.warn('⚠️ DISCORD_CLIENT_ID manquant - Certaines fonctionnalités peuvent ne pas fonctionner');
        }
        
        console.log('✅ Variables d\'environnement vérifiées');
        
        await loadCommands();
        await loadEvents();
        
        const PORT = process.env.PORT || process.env.WEB_PORT || 3001;
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🌐 Serveur web démarré sur le port ${PORT}`);
            console.log(`📊 API de santé disponible sur /api/health`);
            console.log(`🔍 Debug des serveurs disponible sur /api/debug/guilds`);
            console.log(`🎯 Interface React servie depuis: ${distPath}`);
            console.log(`🌍 URL Railway: ${process.env.RAILWAY_STATIC_URL || 'Non définie'}`);
            
            if (process.env.NODE_ENV !== 'production') {
                console.log(`🎯 Interface web accessible sur http://localhost:${PORT}`);
            }
        });

        if (process.env.DISCORD_TOKEN) {
            console.log('🤖 Connexion du bot Discord...');
            await client.login(process.env.DISCORD_TOKEN);
        } else {
            console.log('⚠️ Bot Discord non démarré (token manquant)');
        }
        
        console.log('🎉 Système Serko démarré avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        console.log('🔄 Serveur web maintenu actif pour debug');
    }
};

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Rejection non gérée à', promise, 'raison:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exception non capturée:', error);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
    console.log('🛑 Arrêt du système Serko...');
    if (client.isReady()) {
        client.destroy();
    }
    server.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Arrêt du système Serko (SIGTERM)...');
    if (client.isReady()) {
        client.destroy();
    }
    server.close();
    process.exit(0);
});

// Exporter les données pour l'interface web et les autres modules
export { ticketData, io, serverConfigs, getServerConfig, ticketPanels, getServerPanels, client, addSupportPermissions };

// Démarrer l'initialisation
init();