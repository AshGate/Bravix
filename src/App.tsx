import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import BotStatus from './components/BotStatus';
import SerkoPanel from './components/SerkoPanel';
import { Bot, Ticket, Settings, BarChart3, Sparkles } from 'lucide-react';

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

const socket = io(getBaseUrl());

interface Ticket {
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
}

interface Stats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  ticketsToday: number;
}

function App() {
  const [activeTab, setActiveTab] = useState<'serko' | 'dashboard' | 'tickets' | 'settings'>('serko');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    ticketsToday: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [guildId, setGuildId] = useState<string | null>(null);

  useEffect(() => {
    // Charger les données initiales
    fetchStats();
    fetchTickets();

    // Écouter les événements Socket.IO
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    socket.on('ticketCreated', (ticket: Ticket) => {
      setTickets(prev => [ticket, ...prev]);
      fetchStats();
    });

    socket.on('ticketUpdated', (ticket: Ticket) => {
      setTickets(prev => prev.map(t => t.channelId === ticket.channelId ? ticket : t));
      fetchStats();
    });

    socket.on('ticketDeleted', (ticket: Ticket) => {
      setTickets(prev => prev.filter(t => t.channelId !== ticket.channelId));
      fetchStats();
    });

    // Écouter les messages pour changer d'onglet
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SWITCH_TAB' && event.data.tab) {
        setActiveTab(event.data.tab);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('ticketCreated');
      socket.off('ticketUpdated');
      socket.off('ticketDeleted');
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/api/tickets`);
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
    }
  };

  const tabs = [
    { id: 'serko' as const, name: 'Panel Serko', icon: Sparkles },
    { id: 'dashboard' as const, name: 'Dashboard', icon: BarChart3 },
    { id: 'tickets' as const, name: 'Tickets', icon: Ticket },
    { id: 'settings' as const, name: 'Configuration', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8 text-blue-400" />
              <h1 className="text-xl font-bold text-white">Serko - Système de Tickets Discord</h1>
            </div>
            <div className="flex items-center space-x-4">
              <BotStatus isConnected={isConnected} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex space-x-1 bg-black/20 backdrop-blur-md rounded-lg p-1">
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
                  {tab.id === 'serko' && guildId && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'serko' && (
            <SerkoPanel 
              guildId={guildId} 
              onGuildIdChange={setGuildId}
              embedded={true}
            />
          )}
          {activeTab === 'dashboard' && <Dashboard stats={stats} tickets={tickets} />}
          {activeTab === 'tickets' && <TicketList tickets={tickets} />}
          {activeTab === 'settings' && (
            <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
              <p className="text-gray-300 mb-4">
                Pour une configuration complète, utilisez l'onglet Panel Serko.
              </p>
              <button
                onClick={() => setActiveTab('serko')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Ouvrir le Panel Serko
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;