import express from 'express';
import { ticketData, io } from '../index.js';

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

// Route pour obtenir tous les tickets
router.get('/', (req, res) => {
    try {
        const tickets = Array.from(ticketData.tickets.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        console.log(`🎫 ${tickets.length} tickets demandés`);
        res.json(tickets);
    } catch (error) {
        console.error('❌ Erreur API tickets:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

// Route pour ajouter un participant à un ticket
router.post('/:ticketId/participants', requireAuth, async (req, res) => {
    try {
        const ticketId = parseInt(req.params.ticketId);
        const { userId } = req.body;
        
        console.log(`👥 Ajout du participant ${userId} au ticket ${ticketId} par ${req.userId}`);
        
        // Trouver le ticket par ID
        const ticket = Array.from(ticketData.tickets.values()).find(t => t.id === ticketId);
        if (!ticket) {
            console.log(`❌ Ticket ${ticketId} non trouvé`);
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }

        // Vérifier que l'ID utilisateur est valide (format Discord)
        if (!/^\d{17,19}$/.test(userId)) {
            return res.status(400).json({ error: 'ID utilisateur Discord invalide (doit être 17-19 chiffres)' });
        }

        // Ajouter le participant
        if (!ticket.participants) {
            ticket.participants = [];
        }
        
        if (!ticket.participants.includes(userId)) {
            ticket.participants.push(userId);
            ticketData.tickets.set(ticket.channelId, ticket);
            
            // Émettre la mise à jour
            io.emit('ticketUpdated', ticket);
            
            console.log(`✅ Participant ${userId} ajouté au ticket ${ticketId}`);
            res.json({ 
                success: true, 
                message: 'Participant ajouté avec succès',
                ticket: ticket
            });
        } else {
            res.status(400).json({ error: 'Participant déjà présent dans le ticket' });
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout du participant:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

// Route pour retirer un participant d'un ticket
router.delete('/:ticketId/participants/:userId', requireAuth, async (req, res) => {
    try {
        const ticketId = parseInt(req.params.ticketId);
        const userId = req.params.userId;
        
        console.log(`👥 Retrait du participant ${userId} du ticket ${ticketId} par ${req.userId}`);
        
        // Trouver le ticket par ID
        const ticket = Array.from(ticketData.tickets.values()).find(t => t.id === ticketId);
        if (!ticket) {
            console.log(`❌ Ticket ${ticketId} non trouvé`);
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }

        // Empêcher de retirer le créateur du ticket
        if (userId === ticket.userId) {
            return res.status(400).json({ error: 'Impossible de retirer le créateur du ticket' });
        }

        // Retirer le participant
        if (ticket.participants) {
            const initialLength = ticket.participants.length;
            ticket.participants = ticket.participants.filter(id => id !== userId);
            
            if (ticket.participants.length < initialLength) {
                ticketData.tickets.set(ticket.channelId, ticket);
                
                // Émettre la mise à jour
                io.emit('ticketUpdated', ticket);
                
                console.log(`✅ Participant ${userId} retiré du ticket ${ticketId}`);
                res.json({ 
                    success: true, 
                    message: 'Participant retiré avec succès',
                    ticket: ticket
                });
            } else {
                res.status(400).json({ error: 'Participant non trouvé dans ce ticket' });
            }
        } else {
            res.status(400).json({ error: 'Aucun participant à retirer' });
        }
    } catch (error) {
        console.error('❌ Erreur lors du retrait du participant:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

// Route pour fermer un ticket
router.post('/:ticketId/close', requireAuth, async (req, res) => {
    try {
        const ticketId = parseInt(req.params.ticketId);
        
        console.log(`🔒 Fermeture du ticket ${ticketId} par ${req.userId}`);
        
        // Trouver le ticket par ID
        const ticket = Array.from(ticketData.tickets.values()).find(t => t.id === ticketId);
        if (!ticket) {
            console.log(`❌ Ticket ${ticketId} non trouvé pour fermeture`);
            console.log(`🔍 Tickets disponibles:`, Array.from(ticketData.tickets.values()).map(t => `ID: ${t.id}, Channel: ${t.channelId}`));
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }

        console.log(`✅ Ticket trouvé: ${ticket.id} (${ticket.channelId})`);

        // Vérifier si le ticket est déjà fermé
        if (ticket.status === 'closed') {
            return res.status(400).json({ error: 'Ce ticket est déjà fermé' });
        }

        // Fermer le ticket
        ticket.status = 'closed';
        ticket.closedAt = new Date().toISOString();
        ticket.closedBy = req.userId === 'admin' ? 'Panel Serko' : req.userId;
        ticketData.tickets.set(ticket.channelId, ticket);
        
        // Mettre à jour les stats
        ticketData.stats.openTickets = Math.max(0, ticketData.stats.openTickets - 1);
        ticketData.stats.closedTickets++;
        
        // Émettre la mise à jour
        io.emit('ticketUpdated', ticket);
        io.emit('statsUpdated', ticketData.stats);
        
        console.log(`✅ Ticket ${ticketId} fermé avec succès par ${req.userId}`);
        res.json({ 
            success: true, 
            message: 'Ticket fermé avec succès', 
            ticket: ticket 
        });
    } catch (error) {
        console.error('❌ Erreur lors de la fermeture du ticket:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

// Route pour rouvrir un ticket
router.post('/:ticketId/reopen', requireAuth, async (req, res) => {
    try {
        const ticketId = parseInt(req.params.ticketId);
        
        console.log(`🔓 Réouverture du ticket ${ticketId} par ${req.userId}`);
        
        // Trouver le ticket par ID
        const ticket = Array.from(ticketData.tickets.values()).find(t => t.id === ticketId);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }

        // Vérifier si le ticket est fermé
        if (ticket.status !== 'closed') {
            return res.status(400).json({ error: 'Ce ticket n\'est pas fermé' });
        }

        // Rouvrir le ticket
        ticket.status = 'open';
        ticket.reopenedAt = new Date().toISOString();
        ticket.reopenedBy = req.userId === 'admin' ? 'Panel Serko' : req.userId;
        delete ticket.closedAt;
        delete ticket.closedBy;
        ticketData.tickets.set(ticket.channelId, ticket);
        
        // Mettre à jour les stats
        ticketData.stats.openTickets++;
        ticketData.stats.closedTickets = Math.max(0, ticketData.stats.closedTickets - 1);
        
        // Émettre la mise à jour
        io.emit('ticketUpdated', ticket);
        io.emit('statsUpdated', ticketData.stats);
        
        console.log(`✅ Ticket ${ticketId} rouvert avec succès par ${req.userId}`);
        res.json({ 
            success: true, 
            message: 'Ticket rouvert avec succès', 
            ticket: ticket 
        });
    } catch (error) {
        console.error('❌ Erreur lors de la réouverture du ticket:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

// Route pour obtenir les détails d'un ticket spécifique
router.get('/:ticketId', (req, res) => {
    try {
        const ticketId = parseInt(req.params.ticketId);
        
        // Trouver le ticket par ID
        const ticket = Array.from(ticketData.tickets.values()).find(t => t.id === ticketId);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket non trouvé' });
        }

        console.log(`🔍 Détails du ticket ${ticketId} demandés`);
        res.json(ticket);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération du ticket:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

export default router;