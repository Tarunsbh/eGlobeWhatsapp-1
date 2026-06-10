import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Search, RefreshCw, Filter } from 'lucide-react';
import { saAudit, saHotels } from '../../api/super-admin';
import { format } from 'date-fns';

const ACTION_COLORS = {
  'hotel.create': 'text-green-400 bg-green-500/10',
  'hotel.delete': 'text-red-400 bg-red-500/10',
  'hotel.suspend': 'text-orange-400 bg-orange-500/10',
  'hotel.activate': 'text-green-400 bg-green-500/10',
  'hotel.update': 'text-blue-400 bg-blue-500/10',
  'user.create': 'text-cyan-400 bg-cyan-500/10',
  'user.delete': 'text-red-400 bg-red-500/10',
  'user.disable': 'text-orange-400 bg-orange-500/10',
  'user.enable': 'text-green-400 bg-green-500/10',
  'user.password_reset': 'text-yellow-400 bg-yellow-500/10',
  'super_admin.login': 'text-indigo-400 bg-indigo-500/10',
  'invoice.create': 'text-purple-400 bg-purple-500/10',
  'subscription.update': 'text-purple-400 bg-purple-500/10',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', hotelId: '', limit: 100 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lRes, hRes] = await Promise.all([
        saAudit.list({ action: filters.action || undefined, hotelId: filters.hotelId || undefined, limit: filters.limit }),
        saHotels.list({ limit: 500 }),
      ]);
      setLogs(lRes.data?.data || lRes.data || []);
      const hData = hRes.data?.data || hRes.data;
      setHotels(hData.hotels || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const inp = 'px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-500 text-sm">Complete action trail — immutable</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input placeholder="Filter by action (e.g. hotel.create)" value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
            className={`${inp} pl-8 w-60`} />
        </div>
        <select value={filters.hotelId} onChange={(e) => setFilters((f) => ({ ...f, hotelId: e.target.value }))} className={inp}>
          <option value="">All Hotels</option>
          {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <select value={filters.limit} onChange={(e) => setFilters((f) => ({ ...f, limit: +e.target.value }))} className={inp}>
          {[50, 100, 200, 500].map((n) => <option key={n} value={n}>Last {n}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw size={20} className="text-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/30">
                  {['Timestamp', 'Action', 'Resource', 'Actor', 'Hotel', 'IP'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-500 text-sm">No audit logs found</td></tr>
                ) : logs.map((log) => {
                  const actionCls = ACTION_COLORS[log.action] || 'text-gray-400 bg-gray-500/10';
                  return (
                    <tr key={log.id?.toString()} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-md ${actionCls}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-400">
                        <span className="font-medium">{log.resource}</span>
                        {log.resourceId && <span className="text-gray-600"> #{log.resourceId.slice(0,8)}</span>}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-300">
                        {log.superAdmin ? (
                          <span className="flex items-center gap-1">
                            <span className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] text-white font-bold">{log.superAdmin.name[0]}</span>
                            {log.superAdmin.name}
                          </span>
                        ) : log.user ? (
                          <span>{log.user.name}</span>
                        ) : <span className="text-gray-600">System</span>}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">{log.hotel?.name || '—'}</td>
                      <td className="py-3 px-4 text-xs text-gray-600 font-mono">{log.ip || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
