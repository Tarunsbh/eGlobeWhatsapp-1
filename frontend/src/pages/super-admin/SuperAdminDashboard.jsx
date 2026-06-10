import React, { useEffect, useState } from 'react';
import {
  Building2, Users, MessageSquare, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, Clock, IndianRupee, Activity, RefreshCw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { saDashboard } from '../../api/super-admin';
import { format } from 'date-fns';

function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend != null && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value?.toLocaleString?.() ?? value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

function ActivityItem({ item }) {
  const actionColor = {
    'hotel.create': 'text-green-400',
    'hotel.suspend': 'text-red-400',
    'hotel.activate': 'text-green-400',
    'user.create': 'text-blue-400',
    'user.delete': 'text-red-400',
    'super_admin.login': 'text-indigo-400',
    'invoice.create': 'text-yellow-400',
    'subscription.update': 'text-purple-400',
  }[item.action] || 'text-gray-400';

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-800/50 last:border-0">
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-mono font-medium ${actionColor}`}>{item.action}</span>
          {item.hotel && (
            <span className="text-xs text-gray-500">on <span className="text-gray-300">{item.hotel.name}</span></span>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-0.5">
          by {item.superAdmin?.name || item.user?.name || 'System'} · {format(new Date(item.createdAt), 'dd MMM HH:mm')}
        </p>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, aRes, gRes] = await Promise.all([
        saDashboard.stats(),
        saDashboard.activity(20),
        saDashboard.growth(),
      ]);
      setStats(sRes.data?.data || sRes.data);
      setActivity(aRes.data?.data || aRes.data || []);
      setGrowth(gRes.data?.data || gRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={24} className="text-indigo-400 animate-spin" />
    </div>
  );

  const cards = stats ? [
    { label: 'Total Hotels', value: stats.hotels.total, sub: `${stats.hotels.active} active`, icon: Building2, color: 'bg-indigo-600' },
    { label: 'Active Hotels', value: stats.hotels.active, sub: `${stats.hotels.trial} on trial`, icon: CheckCircle2, color: 'bg-green-600' },
    { label: 'Suspended', value: stats.hotels.suspended, icon: XCircle, color: 'bg-red-600' },
    { label: 'Trial Accounts', value: stats.hotels.trial, icon: Clock, color: 'bg-yellow-600' },
    { label: 'Total Users', value: stats.users.total, sub: `${stats.users.active} active`, icon: Users, color: 'bg-blue-600' },
    { label: 'Total Revenue', value: `₹${((stats.revenue.total || 0) / 100).toLocaleString('en-IN')}`, sub: `₹${((stats.revenue.monthly || 0) / 100).toLocaleString('en-IN')} this month`, icon: IndianRupee, color: 'bg-purple-600' },
    { label: 'Messages Sent', value: stats.messages.total, sub: `${stats.messages.failed} failed`, icon: MessageSquare, color: 'bg-cyan-600' },
    { label: 'Overdue Invoices', value: stats.invoices.overdue, icon: AlertTriangle, color: stats.invoices.overdue > 0 ? 'bg-orange-600' : 'bg-gray-700' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Master Control Dashboard</h1>
          <p className="text-gray-500 text-sm">Platform-wide overview</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Hotel Growth (6 months)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={growth} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
          <div className="overflow-y-auto max-h-[200px]">
            {activity.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No activity yet</p>
            ) : (
              activity.map((item) => <ActivityItem key={item.id} item={item} />)
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      {stats && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Platform Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Message Delivery', value: stats.messages.total > 0 ? `${(((stats.messages.total - stats.messages.failed) / stats.messages.total) * 100).toFixed(1)}%` : 'N/A', ok: true },
              { label: 'Active Sessions', value: stats.users.active, ok: true },
              { label: 'This Month Messages', value: stats.messages.thisMonth?.toLocaleString?.() || 0, ok: true },
              { label: 'Overdue Invoices', value: stats.invoices.overdue, ok: stats.invoices.overdue === 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className={`w-2 h-2 rounded-full ${item.ok ? 'bg-green-400' : 'bg-red-400'}`} />
                <div>
                  <p className="text-white font-semibold text-sm">{item.value}</p>
                  <p className="text-gray-500 text-xs">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
