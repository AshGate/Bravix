import React, { useState } from 'react';
import { Lock, Key, Shield, CheckCircle, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  userId?: string;
  username?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, userId, username }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Veuillez entrer le mot de passe');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          password: password.trim(),
          userId: userId || 'unknown',
          username: username || 'unknown'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onAuthSuccess(data);
          onClose();
        }, 1000);
      } else {
        setError(data.error || 'Mot de passe incorrect');
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">🔒 Panel Serko - Authentification</h2>
          <p className="text-gray-300 text-sm">
            Entrez le mot de passe administrateur pour accéder au panel
          </p>
          {username && (
            <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
              <p className="text-blue-300 text-sm">
                👤 Connexion en tant que: <strong>{username}</strong>
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mot de Passe Administrateur
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Entrez le mot de passe"
                className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading || success}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                disabled={loading || success}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Authentification réussie ! Redirection...</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || success || !password.trim()}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Authentifié !</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Se Connecter</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading || success}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-3 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Accès sécurisé par mot de passe</span>
          </div>
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Panel administrateur Serko</span>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-yellow-300 text-xs">
              <strong>🔐 Sécurité :</strong> Le mot de passe est : <code className="bg-black/30 px-1 rounded">SerkoAdmin2024!@$</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;