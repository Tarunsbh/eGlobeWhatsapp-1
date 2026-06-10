import React, { useEffect, useState } from 'react';
import {
  Activity, RefreshCw, Server, Cpu, Database, MessageSquare,
  Building2, Users, TrendingUp, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { saDashboard } from '../../api/super-admin';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function SystemMonitoringPage() {
  const [stats, setStats] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, gRes] = await Promise.all([saDashboard.stats(), saDashboard.growth()]);
      setStats(sRes.data?.data || sRes.data);
      setGrowth(gRes.data?.data || gRes.data || []);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  // Auto-refresh every 60s
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t); }, []);

  const hotelPie = stats ? [
    { name: 'Active', value: stats.hotels.active },
    { name: 'Trial', value: stats.hotels.trial },
    { name: 'Suspended', value: stats.hotels.suspended },
    { name: 'Other', value: Math.max(0, stats.hotels.total - stats.hotels.active - stats.hotels.trial - stats.hotels.suspended) },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">System Monitoring</h1>
          <p className="text-gray-500 text-sm">Last updated: {lastRefresh.toLocaleTimeString()} (auto-refresh: 60s)</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={24} className="text-indigo-400 animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* System status banner */}
          <div className="bg-green-900/20 border border-green-800/40 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            <div>
              <p className="text-green-300 font-semibold text-sm">All Systems Operational</p>
              <p className="text-green-600 text-xs">{stats.hotels.active} hotels actively using the platform</p>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Hotels', value: stats.hotels.total, icon: Building2, color: 'bg-indigo-600', sub: `${stats.hotels.active} active` },
              { label: 'Platform Users', value: stats.users.total, icon: Users, color: 'bg-blue-600', sub: `${stats.users.active} online` },
              { label: 'Messages Sent', value: stats.messages.total?.toLocaleString(), icon: MessageSquare, color: 'bg-green-600', sub: `${stats.messages.thisMonth?.toLocaleString()} this month` },
              { label: 'Failed Messages', value: stats.messages.failed, icon: AlertTriangle, color: stats.messages.failed > 0 ? 'bg-red-600' : 'bg-gray-700', sub: stats.messages.total > 0 ? `${((stats.messages.failed / stats.messages.total) * 100).toFixed(2)}% rate` : 'N/A' },
            ].map((m) => (
              <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.color} mb-3`}>
                  <m.icon size={16} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{m.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.label}</p>
                {m.sub && <p className="text-xs text-gray-600 mt-0.5">{m.sub}</p>}
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hotel growth */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Hotel Signups (6 months)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} name="New Hotels" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Hotel status pie */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Hotel Status Distribution</h3>
              {hotelPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={hotelPie} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                      {hotelPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-600 text-sm text-center py-8">No data yet</p>
              )}
            </div>
          </div>

          {/* Revenue summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Revenue Overview</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Revenue', value: `₹${((stats.revenue.total || 0) / 100).toLocaleString('en-IN')}`, color: 'text-green-400' },
                { label: 'Monthly Revenue', value: `₹${((stats.revenue.monthly || 0) / 100).toLocaleString('en-IN')}`, color: 'text-indigo-400' },
                { label: 'Overdue Invoices', value: stats.invoices.overdue, color: stats.invoices.overdue > 0 ? 'text-red-400' : 'text-green-400' },
              ].map((r) => (
                <div key={r.label} className="p-4 bg-white/5 rounded-xl text-center">
                  <p className={`text-2xl font-bold ${r.color}`}>{r.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{r.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
