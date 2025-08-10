import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Ticket, 
  BarChart3, 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Eye, 
  EyeOff,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  UserMinus,
  RefreshCw,
  Hash,
  Calendar,
  User,
  AlertCircle,
  Loader
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AuthModal from './AuthModal';

// Déterminer l'URL de base selon l'environnement
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3001';
    }
    return window.location.origin;
  }
  return process.env.RAILWAY_STATIC_URL || 'http://localhost:3001';
};

interface SerkoConfig {
  ticketCategoryId?: string;
  logsChannelId?: string;
  transcriptChannelId?: string;
  supportRoleId?: string;
}

interface Guild {
  id: string;
  name: string;
  memberCount: number;
  channels: Channel[];
  textChannels: Channel[];
  categories: Channel[];
  roles: Role[];
}

interface Channel {
  id: string;
  name: string;
  type: number;
  position: number;
}

interface Role {
  id: string;
  name: string;
  color: number;
  position: number;
}

interface Panel {
  id: string;
  guildId: string;
  title: string;
  description: string;
  color: string;
  buttons: PanelButton[];
  channelId: string;
  createdAt: string;
  updatedAt: string;
  messageId?: string;
  sentAt?: string;
}

interface PanelButton {
  id: string;
  label: string;
  style: 'primary' | 'secondary' | 'success' | 'danger';
  category: string;
}

interface TicketData {
  id: number;
  channelId: string;
  userId: string;
  username: string;
  category: string;
  status: 'open' | 'closed';
  createdAt: string;
  claimedBy?: string;
  closedAt?: string;
  closedBy?: string;
  participants?: string[];
  reason?: string;
  guildId: string;
}

interface Stats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  ticketsToday: number;
}

interface SerkoProps {
  guildId?: string | null;
  onGuildIdChange?: (guildId: string | null) => void;
  embedded?: boolean;
}

const SerkoPanel: React.FC<SerkoProps> = ({ guildId: propGuildId, onGuildIdChange, embedded = false }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'panels' | 'tickets' | 'stats'>('config');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration
  const [config, setConfig] = useState<SerkoConfig>({});
  const [guild, setGuild] = useState<Guild | null>(null);
  
  // Panneaux
  const [panels, setPanels] = useState<Panel[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  const [panelForm, setPanelForm] = useState({
    title: '',
    description: '',
    color: '5865F2',
    channelId: '',
    buttons: [] as PanelButton[]
  });
  
  // Tickets en temps réel
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    ticketsToday: 0
  });
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [newParticipantId, setNewParticipantId] = useState('');

  // Guild ID fixe
  const guildId = propGuildId || '868065181895385088';

  useEffect(() => {
    if (embedded) {
      // En mode embedded, on simule l'authentification
      setIsAuthenticated(true);
      setUser({ id: 'admin', username: 'Admin' });
      loadData();
    } else {
      // En mode standalone, on demande l'authentification
      setShowAuthModal(true);
    }
  }, [embedded]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      setupWebSocket();
    }
  }, [isAuthenticated, guildId]);

  const setupWebSocket = () => {
    // Simuler WebSocket avec polling pour les tickets
    const interval = setInterval(() => {
      if (isAuthenticated) {
        loadTickets();
        loadStats();
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadConfig(),
        loadPanels(),
        loadTickets(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/serko/config?guild=${guildId}`, {
        headers: {
          'x-user-id': user?.id || 'admin'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        setGuild(data.guild);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
    }
  };

  const loadPanels = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/serko/panels?guild=${guildId}`, {
        headers: {
          'x-user-id': user?.id || 'admin'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPanels(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des panneaux:', error);
    }
  };

  const loadTickets = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/tickets`, {
        headers: {
          'x-user-id': user?.id || 'admin'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filtrer les tickets pour ce serveur
        const guildTickets = data.filter((ticket: TicketData) => ticket.guildId === guildId);
        setTickets(guildTickets);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/stats`, {
        headers: {
          'x-user-id': user?.id || 'admin'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData.user);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const savePanel = async () => {
    try {
      setLoading(true);
      
      const url = editingPanel 
        ? `${getBaseUrl()}/api/serko/panels/${editingPanel.id}?guild=${guildId}`
        : `${getBaseUrl()}/api/serko/panels?guild=${guildId}`;
      
      const method = editingPanel ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'admin'
        },
        body: JSON.stringify(panelForm)
      });

      if (response.ok) {
        await loadPanels();
        resetPanelForm();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde du panneau');
    } finally {
      setLoading(false);
    }
  };

  const sendPanel = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${getBaseUrl()}/api/serko/send-ticket-panel?guild=${guildId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'admin'
        },
        body: JSON.stringify({
          ...panelForm,
          panelId: editingPanel?.id
        })
      });

      if (response.ok) {
        await loadPanels();
        resetPanelForm();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setError('Erreur lors de l\'envoi du panneau');
    } finally {
      setLoading(false);
    }
  };

  const closeTicket = async (ticketId: number) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/tickets/${ticketId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'admin'
        }
      });

      if (response.ok) {
        await loadTickets();
        await loadStats();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la fermeture');
      }
    } catch (error) {
      console.error('Erreur lors de la fermeture:', error);
      setError('Erreur lors de la fermeture du ticket');
    }
  };

  const reopenTicket = async (ticketId: number) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/tickets/${ticketId}/reopen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'admin'
        }
      });

      if (response.ok) {
        await loadTickets();
        await loadStats();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la réouverture');
      }
    } catch (error) {
      console.error('Erreur lors de la réouverture:', error);
      setError('Erreur lors de la réouverture du ticket');
    }
  };

  const addParticipant = async (ticketId: number, userId: string) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/tickets/${ticketId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'admin'
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        await loadTickets();
        setNewParticipantId('');
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      setError('Erreur lors de l\'ajout du participant');
    }
  };

  const removeParticipant = async (ticketId: number, userId: string) => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/tickets/${ticketId}/participants/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || 'admin'
        }
      });

      if (response.ok) {
        await loadTickets();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors du retrait');
      }
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
      setError('Erreur lors du retrait du participant');
    }
  };

  const resetPanelForm = () => {
    setPanelForm({
      title: '',
      description: '',
      color: '5865F2',
      channelId: '',
      buttons: []
    });
    setEditingPanel(null);
  };

  const editPanel = (panel: Panel) => {
    setPanelForm({
      title: panel.title,
      description: panel.description,
      color: panel.color,
      channelId: panel.channelId,
      buttons: panel.buttons
    });
    setEditingPanel(panel);
    setActiveTab('panels');
  };

  const duplicatePanel = (panel: Panel) => {
    setPanelForm({
      title: `${panel.title} (Copie)`,
      description: panel.description,
      color: panel.color,
      channelId: panel.channelId,
      buttons: panel.buttons
    });
    setEditingPanel(null);
    setActiveTab('panels');
  };

  const addButton = () => {
    const newButton: PanelButton = {
      id: `btn_${Date.now()}`,
      label: 'Nouveau Bouton',
      style: 'primary',
      category: 'support'
    };
    setPanelForm(prev => ({
      ...prev,
      buttons: [...prev.buttons, newButton]
    }));
  };

  const updateButton = (index: number, field: keyof PanelButton, value: string) => {
    setPanelForm(prev => ({
      ...prev,
      buttons: prev.buttons.map((btn, i) => 
        i === index ? { ...btn, [field]: value } : btn
      )
    }));
  };

  const removeButton = (index: number) => {
    setPanelForm(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'closed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      support: 'bg-blue-500/20 text-blue-400',
      bug: 'bg-red-500/20 text-red-400',
      feature: 'bg-purple-500/20 text-purple-400',
      payment: 'bg-green-500/20 text-green-400'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/20 text-gray-400';
  };

  if (!isAuthenticated) {
    return (
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        userId={user?.id}
        username={user?.username}
      />
    );
  }

  const tabs = [
    { id: 'config' as const, name: 'Configuration', icon: Settings },
    { id: 'panels' as const, name: `Panneaux (${panels.length})`, icon: MessageSquare },
    { id: 'tickets' as const, name: `Tickets (${tickets.length})`, icon: Ticket },
    { id: 'stats' as const, name: 'Statistiques', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">🎛️ Panel Serko</h1>
              <p className="text-gray-300">
                Serveur: <span className="font-medium text-blue-400">{guild?.name || 'Chargement...'}</span>
                {guild && <span className="text-gray-400 ml-2">({guild.memberCount} membres)</span>}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Connecté en tant que</p>
                <p className="text-white font-medium">{user?.username || 'Admin'}</p>
              </div>
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-1 border border-white/10 mb-6">
          <div className="flex space-x-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">⚙️ Configuration du Serveur</h2>
              
              {guild ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Informations du Serveur</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nom:</span>
                        <span className="text-white">{guild.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Membres:</span>
                        <span className="text-white">{guild.memberCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Canaux:</span>
                        <span className="text-white">{guild.channels.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rôles:</span>
                        <span className="text-white">{guild.roles.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Configuration Actuelle</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Catégorie Tickets:</span>
                        <span className="text-white">
                          {config.ticketCategoryId ? '✅ Configurée' : '⚠️ Non configurée'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Canal Logs:</span>
                        <span className="text-white">
                          {config.logsChannelId ? '✅ Configuré' : '⚠️ Non configuré'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Canal Transcripts:</span>
                        <span className="text-white">
                          {config.transcriptChannelId ? '✅ Configuré' : '⚠️ Non configuré'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rôle Support:</span>
                        <span className="text-white">
                          {config.supportRoleId ? '✅ Configuré' : '⚠️ Non configuré'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Chargement de la configuration...</p>
                </div>
              )}
            </div>
          )}

          {/* Panels Tab */}
          {activeTab === 'panels' && (
            <div className="space-y-6">
              {/* Existing Panels */}
              {panels.length > 0 && (
                <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">📋 Panneaux Existants</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {panels.map((panel) => (
                      <div key={panel.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-white truncate">{panel.title}</h4>
                            <p className="text-sm text-gray-400 truncate">{panel.description}</p>
                          </div>
                          <div className="flex space-x-1 ml-2">
                            <button
                              onClick={() => editPanel(panel)}
                              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                              title="Éditer"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => duplicatePanel(panel)}
                              className="p-1 text-green-400 hover:text-green-300 transition-colors"
                              title="Dupliquer"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Boutons:</span>
                            <span className="text-white">{panel.buttons.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Statut:</span>
                            <span className={panel.messageId ? 'text-green-400' : 'text-yellow-400'}>
                              {panel.messageId ? 'Actif' : 'Sauvegardé'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Créé:</span>
                            <span className="text-white">
                              {format(new Date(panel.createdAt), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Panel Creation Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {editingPanel ? '✏️ Modifier le Panneau' : '➕ Créer un Panneau'}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Titre du Panneau
                      </label>
                      <input
                        type="text"
                        value={panelForm.title}
                        onChange={(e) => setPanelForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Ex: Système de Support"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={panelForm.description}
                        onChange={(e) => setPanelForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Décrivez le panneau et son utilisation..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Couleur (Hex)
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={panelForm.color}
                          onChange={(e) => setPanelForm(prev => ({ ...prev, color: e.target.value.replace('#', '') }))}
                          placeholder="5865F2"
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div 
                          className="w-10 h-10 rounded-lg border border-white/10"
                          style={{ backgroundColor: `#${panelForm.color}` }}
                        />
                      </div>
                    </div>

                    {/* Channel */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Canal de Destination
                      </label>
                      <select
                        value={panelForm.channelId}
                        onChange={(e) => setPanelForm(prev => ({ ...prev, channelId: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="" className="bg-gray-800">Sélectionner un canal</option>
                        {guild?.textChannels.map(channel => (
                          <option key={channel.id} value={channel.id} className="bg-gray-800">
                            #{channel.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Buttons */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">
                          Boutons ({panelForm.buttons.length}/25)
                        </label>
                        <button
                          onClick={addButton}
                          disabled={panelForm.buttons.length >= 25}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-sm transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {panelForm.buttons.map((button, index) => (
                          <div key={button.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <input
                                type="text"
                                value={button.label}
                                onChange={(e) => updateButton(index, 'label', e.target.value)}
                                placeholder="Label du bouton"
                                className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <select
                                value={button.style}
                                onChange={(e) => updateButton(index, 'style', e.target.value)}
                                className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="primary" className="bg-gray-800">Bleu</option>
                                <option value="secondary" className="bg-gray-800">Gris</option>
                                <option value="success" className="bg-gray-800">Vert</option>
                                <option value="danger" className="bg-gray-800">Rouge</option>
                              </select>
                            </div>
                            <div className="flex items-center justify-between">
                              <select
                                value={button.category}
                                onChange={(e) => updateButton(index, 'category', e.target.value)}
                                className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="support" className="bg-gray-800">Support</option>
                                <option value="bug" className="bg-gray-800">Bug Report</option>
                                <option value="feature" className="bg-gray-800">Feature Request</option>
                                <option value="payment" className="bg-gray-800">Paiement</option>
                              </select>
                              <button
                                onClick={() => removeButton(index)}
                                className="ml-2 p-1 text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-4">
                      <button
                        onClick={savePanel}
                        disabled={loading || !panelForm.title || !panelForm.description}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        <span>{editingPanel ? 'Mettre à Jour' : 'Sauvegarder'}</span>
                      </button>
                      
                      <button
                        onClick={sendPanel}
                        disabled={loading || !panelForm.title || !panelForm.description || !panelForm.channelId}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                      >
                        <Send className="h-4 w-4" />
                        <span>Envoyer dans Discord</span>
                      </button>
                      
                      {editingPanel && (
                        <button
                          onClick={resetPanelForm}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Annuler</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {showPreview && (
                  <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">👁️ Aperçu</h3>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Discord Embed Preview */}
                    <div className="bg-gray-800 rounded-lg p-4 border-l-4" style={{ borderLeftColor: `#${panelForm.color}` }}>
                      <h4 className="text-white font-semibold mb-2">{panelForm.title || 'Titre du Panneau'}</h4>
                      <p className="text-gray-300 text-sm mb-4">{panelForm.description || 'Description du panneau...'}</p>
                      
                      {/* Buttons Preview */}
                      <div className="space-y-2">
                        {Array.from({ length: Math.ceil(panelForm.buttons.length / 5) }).map((_, rowIndex) => (
                          <div key={rowIndex} className="flex space-x-2">
                            {panelForm.buttons.slice(rowIndex * 5, (rowIndex + 1) * 5).map((button, btnIndex) => {
                              const buttonColors = {
                                primary: 'bg-blue-600 text-white',
                                secondary: 'bg-gray-600 text-white',
                                success: 'bg-green-600 text-white',
                                danger: 'bg-red-600 text-white'
                              };
                              
                              return (
                                <div
                                  key={btnIndex}
                                  className={`px-3 py-1 rounded text-sm font-medium ${buttonColors[button.style]}`}
                                >
                                  {button.label}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 text-xs text-gray-500">
                        Serko Ticket System
                      </div>
                    </div>
                    
                    {/* Preview Info */}
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Couleur:</span>
                        <span className="text-white">#{panelForm.color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Boutons:</span>
                        <span className="text-white">{panelForm.buttons.length}/25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Canal:</span>
                        <span className="text-white">
                          {panelForm.channelId ? 
                            guild?.textChannels.find(c => c.id === panelForm.channelId)?.name || 'Canal inconnu' : 
                            'Non sélectionné'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {!showPreview && (
                  <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10 flex items-center justify-center">
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Afficher l'Aperçu</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              {/* Ticket Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-black/20 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Ticket className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total</p>
                      <p className="text-xl font-bold text-white">{stats.totalTickets}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-600 rounded-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Ouverts</p>
                      <p className="text-xl font-bold text-white">{stats.openTickets}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Fermés</p>
                      <p className="text-xl font-bold text-white">{stats.closedTickets}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 backdrop-blur-md rounded-lg p-4 border border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Aujourd'hui</p>
                      <p className="text-xl font-bold text-white">{stats.ticketsToday}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tickets List */}
              <div className="bg-black/20 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white">
                    🎫 Tickets en Temps Réel ({tickets.length})
                  </h2>
                </div>

                <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
                  {tickets.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Aucun ticket trouvé</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <div key={ticket.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Ticket Number */}
                            <div className="flex items-center space-x-2">
                              <Hash className="h-4 w-4 text-gray-400" />
                              <span className="text-white font-mono font-medium">
                                {ticket.id}
                              </span>
                            </div>

                            {/* User Info */}
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-white font-medium">{ticket.username}</span>
                            </div>

                            {/* Participants Count */}
                            {ticket.participants && ticket.participants.length > 0 && (
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-blue-400" />
                                <span className="text-blue-400 text-sm font-medium">
                                  +{ticket.participants.length}
                                </span>
                              </div>
                            )}

                            {/* Category */}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                              {ticket.category}
                            </span>

                            {/* Status */}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                              {ticket.status === 'open' ? 'Ouvert' : 'Fermé'}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {ticket.status === 'open' ? (
                              <button
                                onClick={() => closeTicket(ticket.id)}
                                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                title="Fermer le ticket"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => reopenTicket(ticket.id)}
                                className="p-1 text-green-400 hover:text-green-300 transition-colors"
                                title="Rouvrir le ticket"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Ticket Details */}
                        {selectedTicket?.id === ticket.id && (
                          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Ticket Info */}
                              <div>
                                <h4 className="text-white font-medium mb-2">Informations</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Créé le:</span>
                                    <span className="text-white">
                                      {format(new Date(ticket.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                    </span>
                                  </div>
                                  {ticket.claimedBy && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Pris en charge par:</span>
                                      <span className="text-white">{ticket.claimedBy}</span>
                                    </div>
                                  )}
                                  {ticket.closedAt && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Fermé le:</span>
                                      <span className="text-white">
                                        {format(new Date(ticket.closedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                      </span>
                                    </div>
                                  )}
                                  {ticket.reason && (
                                    <div>
                                      <span className="text-gray-400">Raison:</span>
                                      <p className="text-white mt-1">{ticket.reason}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Participants Management */}
                              <div>
                                <h4 className="text-white font-medium mb-2">Participants</h4>
                                
                                {/* Add Participant */}
                                <div className="flex space-x-2 mb-3">
                                  <input
                                    type="text"
                                    value={newParticipantId}
                                    onChange={(e) => setNewParticipantId(e.target.value)}
                                    placeholder="ID Discord (17-19 chiffres)"
                                    className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <button
                                    onClick={() => addParticipant(ticket.id, newParticipantId)}
                                    disabled={!newParticipantId || !/^\d{17,19}$/.test(newParticipantId)}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-sm transition-colors"
                                  >
                                    <UserPlus className="h-3 w-3" />
                                  </button>
                                </div>

                                {/* Participants List */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Créateur:</span>
                                    <span className="text-white font-mono">{ticket.userId}</span>
                                  </div>
                                  
                                  {ticket.participants && ticket.participants.map((participantId) => (
                                    <div key={participantId} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-400">Participant:</span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-white font-mono">{participantId}</span>
                                        <button
                                          onClick={() => removeParticipant(ticket.id, participantId)}
                                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                        >
                                          <UserMinus className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">📊 Statistiques Détaillées</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalTickets}</div>
                  <div className="text-gray-400">Total des Tickets</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.openTickets}</div>
                  <div className="text-gray-400">Tickets Ouverts</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">{stats.closedTickets}</div>
                  <div className="text-gray-400">Tickets Fermés</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">{stats.ticketsToday}</div>
                  <div className="text-gray-400">Tickets Aujourd'hui</div>
                </div>
              </div>

              {guild && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Informations du Serveur</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nom:</span>
                        <span className="text-white">{guild.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Membres:</span>
                        <span className="text-white">{guild.memberCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Canaux:</span>
                        <span className="text-white">{guild.channels.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rôles:</span>
                        <span className="text-white">{guild.roles.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Système Serko</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Panneaux créés:</span>
                        <span className="text-white">{panels.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Panneaux actifs:</span>
                        <span className="text-white">{panels.filter(p => p.messageId).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Taux de fermeture:</span>
                        <span className="text-white">
                          {stats.totalTickets > 0 ? Math.round((stats.closedTickets / stats.totalTickets) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SerkoPanel;