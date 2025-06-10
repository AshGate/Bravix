import React, { useEffect, useState } from 'react';
import { Bot, Shield, AlertCircle, CheckCircle, Loader, ExternalLink, Settings } from 'lucide-react';

interface DiscordAuthProps {
  guildId: string;
  onAuthSuccess: (userData: any) => void;
  onAuthError: (error: string) => void;
}

// Déterminer l'URL de base selon l'environnement
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Côté client
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3001';
    }
    // En production (Railway), utiliser l'URL actuelle
    return window.location.origin;
  }
  // Côté serveur (fallback)
  return process.env.RAILWAY_STATIC_URL || 'http://localhost:3001';
};

const DiscordAuth: React.FC<DiscordAuthProps> = ({ guildId, onAuthSuccess, onAuthError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<'loading' | 'configured' | 'missing'>('loading');

  // 🔧 CORRECTION CRITIQUE : Récupérer le Client ID depuis l'API
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        console.log('🔍 Vérification de la configuration Discord...');
        
        // Essayer d'abord l'API de configuration Discord
        const configResponse = await fetch(`${getBaseUrl()}/api/discord-config`);
        if (configResponse.ok) {
          const configData = await configResponse.json();
          console.log('📊 Configuration Discord reçue:', configData);
          
          if (configData.configured && configData.clientId && 
              configData.clientId !== 'your_client_id_here' && 
              configData.clientId !== '') {
            setClientId(configData.clientId);
            setConfigStatus('configured');
            console.log('✅ Client ID configuré correctement');
          } else {
            setConfigStatus('missing');
            setError('❌ DISCORD_CLIENT_ID non configuré dans Railway');
            console.error('❌ Client ID manquant ou invalide:', configData);
          }
        } else {
          // Fallback vers l'API de santé
          const healthResponse = await fetch(`${getBaseUrl()}/api/health`);
          if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            if (healthData.discord?.configured) {
              // Essayer de récupérer depuis les variables d'environnement côté client
              const envClientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
              if (envClientId && envClientId !== 'your_client_id_here' && envClientId !== '') {
                setClientId(envClientId);
                setConfigStatus('configured');
              } else {
                setConfigStatus('missing');
                setError('❌ DISCORD_CLIENT_ID non configuré dans Railway');
              }
            } else {
              setConfigStatus('missing');
              setError('❌ Configuration Discord manquante');
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification de la configuration:', error);
        setConfigStatus('missing');
        setError('❌ Impossible de vérifier la configuration Discord');
      }
    };

    fetchClientId();
  }, []);

  const handleDiscordAuth = () => {
    setIsLoading(true);
    setError(null);

    // 🔧 CORRECTION CRITIQUE : Vérifier que le Client ID est disponible
    if (!clientId || clientId === 'your_client_id_here' || clientId === '') {
      setError('❌ Configuration Discord manquante. Le DISCORD_CLIENT_ID n\'est pas configuré correctement dans Railway.');
      setIsLoading(false);
      return;
    }

    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/discord/callback`);
    const scope = encodeURIComponent('identify guilds');
    const state = encodeURIComponent(JSON.stringify({ guildId, timestamp: Date.now() }));

    console.log('🔐 Démarrage de l\'authentification Discord...');
    console.log('📍 URL de base:', getBaseUrl());
    console.log('🎯 Guild ID:', guildId);
    console.log('🔑 Client ID utilisé:', clientId);

    // URL d'autorisation Discord
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;

    // Ouvrir la popup d'authentification
    const popup = window.open(
      authUrl,
      'discord-auth',
      'width=500,height=700,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      setError('Impossible d\'ouvrir la popup d\'authentification. Vérifiez que les popups ne sont pas bloquées.');
      setIsLoading(false);
      return;
    }

    // Écouter les messages de la popup
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
        popup.close();
        window.removeEventListener('message', handleMessage);

        try {
          console.log('✅ Code d\'authentification reçu');
          
          // Échanger le code contre un token
          const response = await fetch(`${getBaseUrl()}/api/auth/discord/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: event.data.code,
              state: { guildId }
            }),
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Authentification réussie:', userData.user.username);
            onAuthSuccess(userData);
          } else {
            const errorData = await response.json();
            console.error('❌ Erreur d\'authentification:', errorData);
            onAuthError(errorData.error || 'Erreur lors de l\'authentification');
          }
        } catch (error) {
          console.error('❌ Erreur lors de l\'échange du token:', error);
          onAuthError('Erreur de connexion au serveur');
        } finally {
          setIsLoading(false);
        }
      } else if (event.data.type === 'DISCORD_AUTH_ERROR') {
        popup.close();
        window.removeEventListener('message', handleMessage);
        setError(event.data.error || 'Erreur lors de l\'authentification');
        setIsLoading(false);
        onAuthError(event.data.error || 'Erreur lors de l\'authentification');
      }
    };

    window.addEventListener('message', handleMessage);

    // Vérifier si la popup est fermée manuellement
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        if (isLoading) {
          setError('Authentification annulée');
          setIsLoading(false);
          onAuthError('Authentification annulée');
        }
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">🔒 Authentification Sécurisée</h1>
          <p className="text-gray-300 mb-6">
            Pour accéder au panneau Serko, vous devez vous connecter avec Discord et vérifier vos permissions d'administrateur.
          </p>

          {/* Status de configuration */}
          {configStatus === 'loading' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-blue-400">
                <Loader className="h-5 w-5 animate-spin" />
                <span className="text-sm">Vérification de la configuration...</span>
              </div>
            </div>
          )}

          {configStatus === 'missing' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-red-400 mb-3">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Configuration Discord Manquante</span>
              </div>
              <div className="text-left text-sm text-red-300 space-y-2">
                <p><strong>🔧 Solution :</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Allez dans <strong>Railway Dashboard</strong></li>
                  <li>Cliquez sur votre projet</li>
                  <li>Onglet <strong>"Variables"</strong></li>
                  <li>Ajoutez : <code className="bg-black/30 px-1 rounded">DISCORD_CLIENT_ID</code></li>
                  <li>Valeur : Votre vrai Client ID Discord (18-19 chiffres)</li>
                  <li>Ajoutez aussi : <code className="bg-black/30 px-1 rounded">VITE_DISCORD_CLIENT_ID</code></li>
                  <li>Même valeur que DISCORD_CLIENT_ID</li>
                  <li>Sauvegardez et redéployez</li>
                </ol>
                <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                  <p><strong>📍 Où trouver votre Client ID :</strong></p>
                  <p>Discord Developer Portal → Votre App → General Information → Application ID</p>
                </div>
              </div>
            </div>
          )}

          {error && configStatus !== 'missing' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <h3 className="text-blue-400 font-medium mb-2">Informations de Connexion</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>🌐 Environnement: {window.location.hostname === 'localhost' ? 'Développement' : 'Production'}</div>
              <div>🔗 URL: {getBaseUrl()}</div>
              <div>🎯 Serveur ID: {guildId}</div>
              <div>🔑 Client ID: {
                configStatus === 'loading' ? '⏳ Vérification...' :
                configStatus === 'configured' ? '✅ Configuré' : 
                '❌ Non configuré'
              }</div>
            </div>
          </div>

          <button
            onClick={handleDiscordAuth}
            disabled={isLoading || configStatus !== 'configured'}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
          >
            {isLoading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Authentification...</span>
              </>
            ) : configStatus === 'configured' ? (
              <>
                <Bot className="h-5 w-5" />
                <span>Se connecter avec Discord</span>
              </>
            ) : (
              <>
                <Settings className="h-5 w-5" />
                <span>Configuration requise</span>
              </>
            )}
          </button>

          {configStatus === 'missing' && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-yellow-400 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Action Requise</span>
              </div>
              <p className="text-yellow-300 text-xs">
                Configurez DISCORD_CLIENT_ID et VITE_DISCORD_CLIENT_ID dans Railway pour continuer.
              </p>
              <a
                href="https://railway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 mt-2 text-yellow-400 hover:text-yellow-300 text-xs"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Ouvrir Railway Dashboard</span>
              </a>
            </div>
          )}

          <div className="mt-6 space-y-3 text-sm text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Connexion sécurisée via OAuth2</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Vérification automatique des permissions admin</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Accès restreint à l'administrateur principal</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500">
              En vous connectant, vous acceptez que nous vérifiions vos permissions d'administrateur sur le serveur Discord spécifié.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscordAuth;