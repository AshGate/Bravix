import express from 'express';

const router = express.Router();

// Mot de passe fixe pour l'accès au panel
const ADMIN_PASSWORD = 'SerkoAdmin2024!@$';

// Route pour vérifier le mot de passe
router.post('/verify-password', (req, res) => {
    try {
        const { password, userId, username } = req.body;
        
        console.log(`🔍 Tentative de connexion avec mot de passe pour: ${username} (${userId})`);
        
        if (!password) {
            return res.status(400).json({ error: 'Mot de passe requis' });
        }

        if (!userId || !username) {
            return res.status(400).json({ error: 'Informations utilisateur requises' });
        }

        if (password !== ADMIN_PASSWORD) {
            console.log(`❌ Mot de passe incorrect pour ${username}`);
            return res.status(401).json({ error: 'Mot de passe incorrect' });
        }

        console.log(`✅ Authentification réussie pour ${username} (${userId})`);
        
        res.json({
            success: true,
            user: {
                id: userId,
                username: username
            },
            message: 'Authentification réussie'
        });

    } catch (error) {
        console.error('❌ Erreur lors de la vérification du mot de passe:', error);
        res.status(500).json({ error: 'Erreur serveur: ' + error.message });
    }
});

// Route pour obtenir les informations d'authentification (debug)
router.get('/info', (req, res) => {
    res.json({
        authType: 'password',
        passwordLength: ADMIN_PASSWORD.length,
        message: 'Authentification par mot de passe fixe',
        timestamp: new Date().toISOString()
    });
});

export default router;