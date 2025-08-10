import React, { useState } from 'react';
import { Search, Filter, Clock, CheckCircle, User, Calendar, Hash, Users } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  participants?: string[];
}

interface TicketListProps {
  tickets: Ticket[];
}

const TicketList: React.FC<TicketListProps> = ({ tickets }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filtrage des tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Obtenir les catégories uniques
  const categories = Array.from(new Set(tickets.map(ticket => ticket.category)));

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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom d'utilisateur ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all" className="bg-gray-800">Tous les statuts</option>
            <option value="open" className="bg-gray-800">Ouvert</option>
            <option value="closed" className="bg-gray-800">Fermé</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all" className="bg-gray-800">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category} value={category} className="bg-gray-800 capitalize">
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-black/20 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            Tickets ({filteredTickets.length})
          </h2>
        </div>

        <div className="divide-y divide-white/10">
          {filteredTickets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-400">Aucun ticket trouvé</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
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

                  {/* Date and Actions */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </span>
                    </div>

                    {ticket.status === 'open' && (
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Clock className="h-4 w-4" />
                        <span>En cours</span>
                      </div>
                    )}

                    {ticket.status === 'closed' && ticket.closedAt && (
                      <div className="flex items-center space-x-1 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          Fermé le {format(new Date(ticket.closedAt), 'dd MMM HH:mm', { locale: fr })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-2 pl-6 text-sm text-gray-400 space-y-1">
                  {ticket.claimedBy && (
                    <div>Pris en charge par: {ticket.claimedBy}</div>
                  )}
                  {ticket.closedBy && (
                    <div>Fermé par: {ticket.closedBy}</div>
                  )}
                  {ticket.participants && ticket.participants.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>
                        {ticket.participants.length} participant{ticket.participants.length > 1 ? 's' : ''} supplémentaire{ticket.participants.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketList;