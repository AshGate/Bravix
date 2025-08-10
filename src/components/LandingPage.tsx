import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  Settings, 
  Ticket, 
  MessageSquare,
  Star,
  ArrowRight,
  CheckCircle,
  Globe,
  Lock,
  Sparkles,
  AlertCircle,
  Loader,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  onDiscordAuth: () => void;
  guildId?: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ onDiscordAuth, guildId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Charger les informations de debug au montage
  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          setDebugInfo(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des infos debug:', error);
      }
    };

    loadDebugInfo();
  }, []);

  const handleDiscordLogin = () => {
    setIsLoading(true);
    console.log('🚀 Redirection vers l\'authentification Discord...');
    console.log('🎯 Guild ID:', guildId);
    console.log('🌐 URL actuelle:', window.location.href);
    onDiscordAuth();
  };

  const features = [
    {
      icon: Ticket,
      title: "Système de Tickets Avancé",
      description: "Création automatique de tickets avec catégories, permissions et gestion complète",
      color: "text-blue-400"
    },
    {
      icon: Settings,
      title: "Configuration Intuitive",
      description: "Interface web moderne pour configurer tous les aspects du système",
      color: "text-green-400"
    },
    {
      icon: BarChart3,
      title: "Statistiques en Temps Réel",
      description: "Tableaux de bord avec graphiques et métriques détaillées",
      color: "text-purple-400"
    },
    {
      icon: Users,
      title: "Gestion des Participants",
      description: "Ajout/retrait de membres dans les tickets avec notifications automatiques",
      color: "text-yellow-400"
    },
    {
      icon: MessageSquare,
      title: "Panneaux Personnalisés",
      description: "Créez des panneaux de tickets avec boutons et embeds sur mesure",
      color: "text-pink-400"
    },
    {
      icon: Shield,
      title: "Sécurité Renforcée",
      description: "Permissions granulaires, logs détaillés et protection anti-spam",
      color: "text-red-400"
    }
  ];

  const stats = [
    { label: "Serveurs Actifs", value: "1,000+", icon: Globe },
    { label: "Tickets Traités", value: "50,000+", icon: Ticket },
    { label: "Utilisateurs", value: "25,000+", icon: Users },
    { label: "Uptime", value: "99.9%", icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Serko</h1>
                  <p className="text-xs text-gray-300">Système de Tickets Discord</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">
                    {debugInfo?.bot?.connected ? 'Bot Connecté' : 'Railway Actif'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">Système de Tickets Nouvelle Génération</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Gérez vos tickets
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  comme un pro
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Serko révolutionne la gestion des tickets Discord avec une interface moderne, 
                des fonctionnalités avancées et une expérience utilisateur exceptionnelle.
              </p>
            </div>

            {/* CTA Section */}
            <div className="mb-16">
              {guildId ? (
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 border border-white/10 max-w-2xl mx-auto">
                  <div className="mb-6">
                    <Lock className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">🔒 Accès Sécurisé Détecté</h3>
                    <p className="text-gray-300 mb-4">
                      Connectez-vous avec Discord pour accéder au panneau de configuration sécurisé
                    </p>
                    
                    {/* Informations de debug détaillées */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                      <h4 className="text-blue-400 font-medium mb-3">🔍 Informations de Connexion</h4>
                      <div className="text-sm text-blue-300 space-y-2 text-left">
                        <div className="flex justify-between">
                          <span>🌐 URL:</span>
                          <span className="font-mono">{window.location.origin}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🎯 Serveur ID:</span>
                          <span className="font-mono">{guildId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🔧 Mode:</span>
                          <span>{window.location.hostname === 'localhost' ? 'Développement' : 'Production Railway'}</span>
                        </div>
                        {debugInfo && (
                          <>
                            <div className="flex justify-between">
                              <span>🤖 Bot:</span>
                              <span>{debugInfo.bot?.connected ? '✅ Connecté' : '❌ Déconnecté'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>🏥 API:</span>
                              <span>{debugInfo.status === 'OK' ? '✅ Opérationnelle' : '❌ Erreur'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleDiscordLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 hover:shadow-2xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="h-6 w-6 animate-spin" />
                        <span>Connexion...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="h-6 w-6" />
                        <span>Se connecter avec Discord</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                  
                  <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-400">
                    <Shield className="h-4 w-4" />
                    <span>Connexion sécurisée via OAuth2</span>
                  </div>

                  {/* Avertissement de sécurité */}
                  <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-yellow-400 mb-1">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium text-sm">Accès Restreint</span>
                    </div>
                    <p className="text-yellow-300 text-xs">
                      Seul l'administrateur principal peut accéder à ce système.
                    </p>
                  </div>

                  {/* Liens de debug pour l'admin */}
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <h4 className="text-white font-medium mb-3">🔧 Liens de Debug (Admin)</h4>
                    <div className="space-y-2">
                      <a
                        href="/api/health"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span className="text-gray-300 text-sm">API de Santé</span>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                      <a
                        href={`/api/debug/guilds?userId=VOTRE_ID_DISCORD`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <span className="text-gray-300 text-sm">Debug Serveurs</span>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Remplacez VOTRE_ID_DISCORD par votre vrai ID Discord
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-300 mb-4">
                    Pour accéder au panneau, utilisez la commande dans Discord :
                  </p>
                  <div className="bg-black/30 border border-white/10 rounded-lg p-4 max-w-md mx-auto mb-4">
                    <code className="text-blue-400 font-mono text-lg">!panel [ID_SERVEUR]</code>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-blue-300 text-sm">
                      💡 <strong>Astuce :</strong> Tapez cette commande dans votre serveur Discord pour obtenir un lien sécurisé vers ce panneau.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-200">
                    <Icon className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Fonctionnalités Puissantes
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Découvrez tout ce que Serko peut faire pour améliorer la gestion de votre communauté Discord
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index} 
                    className="bg-black/20 backdrop-blur-md rounded-xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105 group"
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl p-12 border border-white/10">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Pourquoi Choisir Serko ?
                </h2>
                <p className="text-xl text-gray-300">
                  La solution complète pour une gestion professionnelle de vos tickets Discord
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {[
                    "Interface web moderne et intuitive",
                    "Configuration sans code nécessaire",
                    "Statistiques et analytics détaillées",
                    "Système de permissions granulaire",
                    "Notifications automatiques",
                    "Sauvegarde et transcripts automatiques"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                      <span className="text-white font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-black/20 rounded-2xl p-8 border border-white/10">
                  <div className="text-center">
                    <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-4">Évaluation Communauté</h3>
                    <div className="flex justify-center space-x-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-4">
                      "Serko a transformé notre gestion de support. Interface magnifique et fonctionnalités complètes !"
                    </p>
                    <p className="text-sm text-gray-400">- Administrateur de serveur Discord</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Serko</span>
            </div>
            <p className="text-gray-400 mb-4">
              Système de tickets Discord nouvelle génération
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>© 2024 Serko. Tous droits réservés.</span>
              <span>•</span>
              <span>Déployé sur Railway</span>
              <span>•</span>
              <span>Sécurisé par OAuth2</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;