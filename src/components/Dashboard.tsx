import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Ticket, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface Stats {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  ticketsToday: number;
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
}

interface DashboardProps {
  stats: Stats;
  tickets: TicketData[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, tickets }) => {
  // Données pour le graphique en barres (tickets par jour sur 7 jours)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });

  const chartData = last7Days.map(date => {
    const dayTickets = tickets.filter(ticket => {
      const ticketDate = new Date(ticket.createdAt);
      return ticketDate.toDateString() === date.toDateString();
    });

    return {
      date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      tickets: dayTickets.length
    };
  });

  // Données pour le graphique en secteurs
  const categoryData = tickets.reduce((acc, ticket) => {
    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryData).map(([category, count]) => ({
    name: category,
    value: count
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ComponentType<any>;
    color: string;
    trend?: string;
  }> = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10 hover:border-white/20 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
              <span className="text-green-400 text-xs">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total des Tickets"
          value={stats.totalTickets}
          icon={Ticket}
          color="bg-blue-600"
        />
        <StatCard
          title="Tickets Ouverts"
          value={stats.openTickets}
          icon={Clock}
          color="bg-yellow-600"
        />
        <StatCard
          title="Tickets Fermés"
          value={stats.closedTickets}
          icon={CheckCircle}
          color="bg-green-600"
        />
        <StatCard
          title="Tickets Aujourd'hui"
          value={stats.ticketsToday}
          icon={TrendingUp}
          color="bg-purple-600"
          trend="+12% cette semaine"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Tickets des 7 derniers jours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Bar dataKey="tickets" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Répartition par catégorie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-black/20 backdrop-blur-md rounded-lg p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Activité Récente</h3>
        <div className="space-y-3">
          {tickets.slice(0, 5).map((ticket) => (
            <div key={ticket.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                <div>
                  <p className="text-white font-medium">Ticket #{ticket.id}</p>
                  <p className="text-gray-400 text-sm">{ticket.username} • {ticket.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${ticket.status === 'open' ? 'text-yellow-400' : 'text-green-400'}`}>
                  {ticket.status === 'open' ? 'Ouvert' : 'Fermé'}
                </p>
                <p className="text-gray-400 text-xs">
                  {new Date(ticket.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;