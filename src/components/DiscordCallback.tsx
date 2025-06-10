import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const DiscordCallback: React.FC = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      // Envoyer l'erreur à la fenêtre parent
      window.opener?.postMessage({
        type: 'DISCORD_AUTH_ERROR',
        error: `Erreur Discord: ${error}`
      }, window.location.origin);
      window.close();
      return;
    }

    if (code && state) {
      try {
        // Envoyer le code à la fenêtre parent
        window.opener?.postMessage({
          type: 'DISCORD_AUTH_SUCCESS',
          code: code,
          state: JSON.parse(decodeURIComponent(state))
        }, window.location.origin);
        window.close();
      } catch (parseError) {
        window.opener?.postMessage({
          type: 'DISCORD_AUTH_ERROR',
          error: 'Erreur lors du traitement de la réponse Discord'
        }, window.location.origin);
        window.close();
      }
    } else {
      window.opener?.postMessage({
        type: 'DISCORD_AUTH_ERROR',
        error: 'Paramètres d\'authentification manquants'
      }, window.location.origin);
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Traitement de l'authentification...</h2>
        <p className="text-gray-300">Cette fenêtre va se fermer automatiquement.</p>
      </div>
    </div>
  );
};

export default DiscordCallback;