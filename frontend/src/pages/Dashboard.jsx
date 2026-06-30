import { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiUsers, FiDollarSign, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;
  if (!stats) return <div className="text-center py-10 text-red-500">Failed to load dashboard</div>;

  const cards = [
    {
      title: 'Total Members',
      value: stats.members?.active || 0,
      subtitle: `${stats.members?.total || 0} total`,
      icon: FiUsers,
      color: 'bg-blue-500'
    },
    {
      title: 'Available Fund',
      value: `₹${(stats.fund?.available || 0).toLocaleString()}`,
      subtitle: `In: ₹${(stats.fund?.total_in || 0).toLocaleString()} | Out: ₹${(stats.fund?.total_out || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Active Loans',
      value: stats.loans?.active_count || 0,
      subtitle: `Outstanding: ₹${(stats.loans?.total_outstanding || 0).toLocaleString()}`,
      icon: FiTrendingUp,
      color: 'bg-orange-500'
    },
    {
      title: 'Interest Earned',
      value: `₹${(stats.total_interest_earned || 0).toLocaleString()}`,
      subtitle: 'Total from all loans',
      icon: FiDollarSign,
      color: 'bg-purple-500'
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Collection */}
      {stats.current_month_collection && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Current Month Collection ({stats.current_month_collection.month}/{stats.current_month_collection.year})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">₹{stats.current_month_collection.collected?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Collected</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">₹{stats.current_month_collection.expected?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Expected</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.current_month_collection.paid || 0}</p>
              <p className="text-sm text-gray-500">Paid</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats.current_month_collection.unpaid || 0}</p>
              <p className="text-sm text-gray-500">Unpaid</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
