import express from 'express';
import { serverConfigs, getServerConfig, ticketPanels, getServerPanels } from '../index.js';

const router = express.Router();

// Middleware de vérification d'authentification
const requireAuth = (req, res, next) => {
    const userId = req.headers['x-user-id'] || req.query.userId;
    
    // Pour l'instant, on accepte 'admin' comme utilisateur valide
    if (userId === 'admin' || userId === process.env.ADMIN_USER_ID) {
        req.userId = userId;
        next();
    } else {
        console.log(`🚨 Tentative d'accès non autorisé par l'utilisateur ${userId}`);
        res.status(403).json({ error: 'Accès refusé. Authentification requise.' });
    }
};

// Route pour obtenir la configuration d'un serveur
router.get('/config', async (req, res) => {
    try {
        const guildId = req.query.guild;
        console.log(`⚙️ Configuration demandée pour le serveur: ${guildId}`);
        
        if (!guildId) {
            console.error('❌ ID de serveur manquant');
            return res.status(400).json({ error: 'ID de serveur requis' });
        }

        // Importer le client depuis l'index principal
        const { client } = await import('../index.js');

        if (!client.isReady()) {
            console.error('❌ Bot Discord non connecté');
            return res.status(503).json({ error: 'Bot Discord non connecté. Vérifiez la connexion.' });
        }

        console.log(`🔍 Recherche du serveur ${guildId}...`);
        console.log(`📊 Total serveurs en cache: ${client.guilds.cache.size}`);
        
        let guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
            console.log(`⚠️ Serveur ${guildId} non trouvé dans le cache, tentative de fetch...`);
            
            try {
                await client.guilds.fetch();
                console.log(`🔄 Cache des guildes rafraîchi. Nouveau total: ${client.guilds.cache.size}`);
                
                guild = client.guilds.cache.get(guildId);
                
                if (!guild) {
                    console.log(`🔍 Tentative de fetch direct du serveur ${guildId}...`);
                    guild = await client.guilds.fetch(guildId);
                    console.log(`✅ Serveur trouvé via fetch direct: ${guild.name}`);
                }
            } catch (fetchError) {
                console.error(`❌ Impossible de récupérer le serveur ${guildId}:`, fetchError.message);
                
                if (fetchError.code === 50001) {
                    return res.status(403).json({ 
                        error: 'Le bot n\'a pas accès à ce serveur. Vérifiez que le bot est bien invité sur le serveur avec les bonnes permissions.' 
                    });
                } else if (fetchError.code === 10004) {
                    return res.status(404).json({ 
                        error: 'Serveur introuvable. Vérifiez que l\'ID du serveur est correct et que le serveur existe toujours.' 
                    });
                } else {
                    return res.status(404).json({ 
                        error: `Serveur non trouvé ou bot non présent sur ce serveur. Code d'erreur: ${fetchError.code || 'UNKNOWN'}` 
                    });
                }
            }
        }

        if (!guild) {
            console.error(`❌ Serveur ${guildId} définitivement introuvable`);
            return res.status(404).json({ 
                error: 'Serveur non trouvé. Le bot n\'est peut-être pas présent sur ce serveur ou l\'ID est incorrect.' 
            });
        }

        console.log(`✅ Serveur trouvé: ${guild.name} (${guild.memberCount} membres)`);

        const config = getServerConfig(guildId);
        
        const allChannels = guild.channels.cache;
        console.log(`🔍 Analyse du serveur ${guild.name}:`);
        console.log(`   - Total canaux: ${allChannels.size}`);

        const textChannels = allChannels
            .filter(channel => {
                const isTextChannel = channel.type === 0;
                if (isTextChannel) {
                    console.log(`   - Canal texte trouvé: #${channel.name} (${channel.id})`);
                }
                return isTextChannel;
            })
            .map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                position: channel.position || 0
            }))
            .sort((a, b) => a.position - b.position);

        const categories = allChannels
            .filter(channel => {
                const isCategory = channel.type === 4;
                if (isCategory) {
                    console.log(`   - Catégorie trouvée: ${channel.name} (${channel.id})`);
                }
                return isCategory;
            })
            .map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                position: channel.position || 0
            }))
            .sort((a, b) => a.position - b.position);

        const roles = guild.roles.cache
            .filter(role => role.name !== '@everyone' && !role.managed)
            .map(role => ({
                id: role.id,
                name: role.name,
                color: role.color,
                position: role.position
            }))
            .sort((a, b) => b.position - a.position);

        const guildData = {
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            channels: [...textChannels, ...categories],
            textChannels: textChannels,
            categories: categories,
            roles: roles
        };

        console.log(`✅ Configuration envoyée pour ${guild.name}:`);
        console.log(`   - Canaux texte: ${textChannels.length}`);
        console.log(`   - Catégories: ${categories.length}`);
        console.log(`   - Rôles: ${roles.length}`);

        res.json({
            config: config,
            guild: guildData
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de la configuration:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

// Route pour sauvegarder la configuration
router.post('/config', requireAuth, (req, res) => {
    try {
        const guildId = req.query.guild;
        const newConfig = req.body;
        
        console.log(`💾 Sauvegarde de configuration pour ${guildId}:`, newConfig);
        
        if (!guildId) {
            return res.status(400).json({ error: 'ID de serveur requis' });
        }

        serverConfigs.set(guildId, newConfig);
        
        console.log(`✅ Configuration mise à jour pour ${guildId}`);
        
        res.json({ success: true, message: 'Configuration sauvegardée avec succès' });
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la configuration:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde: ' + error.message });
    }
});

// Route pour obtenir les panneaux
router.get('/panels', (req, res) => {
    try {
        const guildId = req.query.guild;
        
        if (!guildId) {
            return res.status(400).json({ error: 'ID de serveur requis' });
        }

        const panels = getServerPanels(guildId);
        const panelsArray = Array.from(panels.values());
        
        console.log(`📋 ${panelsArray.length} panneaux demandés pour ${guildId}`);
        res.json(panelsArray);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des panneaux:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

// Route pour sauvegarder un panneau
router.post('/panels', requireAuth, async (req, res) => {
    try {
        const guildId = req.query.guild;
        const panelData = req.body;
        
        if (!guildId) {
            return res.status(400).json({ error: 'ID de serveur requis' });
        }

        const panelId = `panel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const panel = {
            id: panelId,
            guildId: guildId,
            ...panelData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageId: null,
            channelId: panelData.channelId
        };

        const panels = getServerPanels(guildId);
        panels.set(panelId, panel);
        
        console.log(`💾 Panneau sauvegardé: ${panelId} pour ${guildId}`);
        
        res.json({ 
            success: true, 
            panel: panel,
            message: 'Panneau sauvegardé avec succès' 
        });
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du panneau:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde: ' + error.message });
    }
});

// Route pour mettre à jour un panneau
router.put('/panels/:panelId', requireAuth, async (req, res) => {
    try {
        const guildId = req.query.guild;
        const panelId = req.params.panelId;
        const panelData = req.body;
        
        if (!guildId) {
            return res.status(400).json({ error: 'ID de serveur requis' });
        }

        const panels = getServerPanels(guildId);
        const existingPanel = panels.get(panelId);
        
        if (!existingPanel) {
            return res.status(404).json({ error: 'Panneau non trouvé' });
        }

        const updatedPanel = {
            ...existingPanel,
            ...panelData,
            updatedAt: new Date().toISOString()
        };

        panels.set(panelId, updatedPanel);
        
        console.log(`✏️ Panneau mis à jour: ${panelId} pour ${guildId}`);
        
        res.json({ 
            success: true, 
            panel: updatedPanel,
            message: 'Panneau mis à jour avec succès' 
        });
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du panneau:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour: ' + error.message });
    }
});

// Route pour supprimer un panneau
router.delete('/panels/:panelId', requireAuth, async (req, res) => {
    try {
        const guildId = req.query.guild;
        const panelId = req.params.panelId;
        
        if (!guildId) {
            return res.status(400).json({ error: 'ID de serveur requis' });
        }

        const panels = getServerPanels(guildId);
        const panel = panels.get(panelId);
        
        if (!panel) {
            return res.status(404).json({ error: 'Panneau non trouvé' });
        }

        panels.delete(panelId);
        
        console.log(`🗑️ Panneau supprimé: ${panelId} pour ${guildId}`);
        
        res.json({ 
            success: true, 
            message: 'Panneau supprimé avec succès' 
        });
    } catch (error) {
        console.error('❌ Erreur lors de la suppression du panneau:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression: ' + error.message });
    }
});

// Route pour envoyer un panneau de tickets
router.post('/send-ticket-panel', requireAuth, async (req, res) => {
    try {
        const guildId = req.query.guild;
        const { title, description, color, buttons, channelId, panelId } = req.body;
        
        console.log(`📤 Envoi de panneau pour ${guildId} dans le canal ${channelId}`);
        
        if (!guildId) {
            return res.status(400).json({ error: 'ID de serveur requis' });
        }

        // Importer le client depuis l'index principal
        const { client } = await import('../index.js');

        if (!client.isReady()) {
            return res.status(503).json({ error: 'Bot Discord non connecté' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Serveur non trouvé ou bot non présent' });
        }

        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Canal non trouvé' });
        }

        const botMember = guild.members.cache.get(client.user.id);
        if (!channel.permissionsFor(botMember).has(['SendMessages', 'EmbedLinks'])) {
            return res.status(403).json({ error: 'Le bot n\'a pas les permissions nécessaires dans ce canal' });
        }

        const embed = {
            color: parseInt(color, 16),
            title: title,
            description: description,
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Serko Ticket System'
            }
        };

        const components = [];
        if (buttons && buttons.length > 0) {
            for (let i = 0; i < buttons.length; i += 5) {
                const row = {
                    type: 1,
                    components: buttons.slice(i, i + 5).map(button => ({
                        type: 2,
                        style: getButtonStyle(button.style),
                        label: button.label,
                        custom_id: `serko_ticket_${button.category}_${button.id}`
                    }))
                };
                components.push(row);
            }
        }

        const sentMessage = await channel.send({
            embeds: [embed],
            components: components
        });

        if (panelId) {
            const panels = getServerPanels(guildId);
            const panel = panels.get(panelId);
            
            if (panel) {
                panel.messageId = sentMessage.id;
                panel.sentAt = new Date().toISOString();
                panels.set(panelId, panel);
                console.log(`🔗 Message ID ${sentMessage.id} associé au panneau ${panelId}`);
            }
        }

        console.log(`✅ Panneau de tickets envoyé dans #${channel.name} (${guild.name})`);
        
        res.json({ 
            success: true, 
            message: 'Panneau de tickets envoyé avec succès',
            messageId: sentMessage.id,
            channelId: channelId
        });
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du panneau:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi du panneau: ' + error.message });
    }
});

// Fonction utilitaire pour convertir le style de bouton
const getButtonStyle = (style) => {
    switch (style) {
        case 'primary': return 1;
        case 'secondary': return 2;
        case 'success': return 3;
        case 'danger': return 4;
        default: return 2;
    }
};

export default router;