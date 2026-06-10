import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Building2, CheckCircle2,
  XCircle, Trash2, Eye, Users, RefreshCw, X, AlertCircle, PauseCircle, PlayCircle,
} from 'lucide-react';
import { saHotels } from '../../api/super-admin';
import { format } from 'date-fns';
import CreateHotelModal from './modals/CreateHotelModal';

const STATUS_BADGE = {
  ACTIVE:    { label: 'Active',    cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  TRIAL:     { label: 'Trial',     cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  EXPIRED:   { label: 'Expired',   cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

const PLAN_COLOR = {
  TRIAL:      'text-gray-400',
  STARTER:    'text-gray-400',
  BASIC:      'text-blue-400',
  STANDARD:   'text-indigo-400',
  PREMIUM:    'text-purple-400',
  ENTERPRISE: 'text-amber-400',
};

/* ── Suspend Reason Modal ─────────────────────────────────── */
function SuspendModal({ hotelName, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <PauseCircle size={16} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Suspend Hotel</p>
              <p className="text-xs text-gray-500">{hotelName}</p>
            </div>
          </div>
          <label className="block text-xs text-gray-400 mb-1.5">Reason for suspension</label>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Payment overdue, policy violation…"
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-xl text-sm transition-colors">
            Cancel
          </button>
          <button onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={!reason.trim()}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-40">
            Suspend
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm Modal ─────────────────────────────────── */
function DeleteModal({ hotelName, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <Trash2 size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Delete Hotel</p>
            <p className="text-xs text-gray-500">{hotelName}</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 mb-5">
          This will permanently delete the hotel and all associated data. <span className="text-red-400 font-medium">This cannot be undone.</span>
        </p>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 hover:text-white rounded-xl text-sm transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Hotel Row ────────────────────────────────────────────── */
function HotelRow({ hotel, onRefresh }) {
  const navigate = useNavigate();
  const [working, setWorking] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const act = async (fn) => {
    setWorking(true);
    try { await fn(); await onRefresh(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setWorking(false); }
  };

  const badge = STATUS_BADGE[hotel.status] || STATUS_BADGE.TRIAL;

  return (
    <>
      <tr className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors group">
        {/* Hotel name */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center text-indigo-400 text-xs font-bold flex-shrink-0">
              {hotel.name[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{hotel.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{hotel.hotelCode || '—'} · {hotel.contactPerson || '—'}</p>
            </div>
          </div>
        </td>

        {/* Mobile */}
        <td className="py-3 px-4 text-xs text-gray-400">{hotel.mobile || '—'}</td>

        {/* Status */}
        <td className="py-3 px-4">
          <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>
            {badge.label}
          </span>
        </td>

        {/* Plan */}
        <td className="py-3 px-4">
          <span className={`text-xs font-medium tracking-wide ${PLAN_COLOR[hotel.plan] || 'text-gray-400'}`}>
            {hotel.plan}
          </span>
        </td>

        {/* Users */}
        <td className="py-3 px-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Users size={12} />{hotel._count?.users ?? 0}</span>
        </td>

        {/* Created */}
        <td className="py-3 px-4 text-xs text-gray-500">
          {format(new Date(hotel.createdAt), 'dd MMM yyyy')}
        </td>

        {/* Actions — always visible, no dropdown */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-1.5">
            {/* View */}
            <button
              onClick={() => navigate(`/super-admin/hotels/${hotel.id}`)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-xs font-medium transition-all"
              title="View Details"
            >
              <Eye size={12} /> View
            </button>

            {/* Activate / Suspend toggle */}
            {working ? (
              <div className="px-2.5 py-1.5">
                <RefreshCw size={12} className="animate-spin text-gray-500" />
              </div>
            ) : hotel.status === 'SUSPENDED' ? (
              <button
                onClick={() => act(() => saHotels.activate(hotel.id))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-all"
                title="Activate Hotel"
              >
                <PlayCircle size={12} /> Activate
              </button>
            ) : (
              <button
                onClick={() => setShowSuspend(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 text-xs font-medium transition-all"
                title="Suspend Hotel"
              >
                <PauseCircle size={12} /> Suspend
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all opacity-0 group-hover:opacity-100"
              title="Delete Hotel"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </td>
      </tr>

      {showSuspend && (
        <SuspendModal
          hotelName={hotel.name}
          onConfirm={(reason) => { setShowSuspend(false); act(() => saHotels.suspend(hotel.id, reason)); }}
          onClose={() => setShowSuspend(false)}
        />
      )}
      {showDelete && (
        <DeleteModal
          hotelName={hotel.name}
          onConfirm={() => { setShowDelete(false); act(() => saHotels.delete(hotel.id)); }}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function HotelsManagementPage() {
  const [hotels, setHotels] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await saHotels.list({ search, status, plan, limit: PAGE_SIZE, offset: page * PAGE_SIZE });
      const d = res.data?.data || res.data;
      setHotels(d.hotels || []);
      setTotal(d.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, status, plan, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Hotels</h1>
          <p className="text-gray-500 text-sm">{total.toLocaleString()} total accounts</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
          <Plus size={15} /> Create Hotel
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search hotels…"
            className="pl-8 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Status</option>
          {['TRIAL','ACTIVE','SUSPENDED','EXPIRED'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(0); }}
          className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Plans</option>
          {['TRIAL','BASIC','STANDARD','PREMIUM','ENTERPRISE'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {(search || status || plan) && (
          <button onClick={() => { setSearch(''); setStatus(''); setPlan(''); setPage(0); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-gray-400 hover:text-white rounded-xl text-sm transition-colors">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/50">
                {['Hotel', 'Mobile', 'Status', 'Plan', 'Users', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500 text-sm">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-400" />Loading hotels…
                </td></tr>
              ) : hotels.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500 text-sm">No hotels found</td></tr>
              ) : (
                hotels.map((h) => <HotelRow key={h.id} hotel={h} onRefresh={load} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors">Prev</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateHotelModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
}
