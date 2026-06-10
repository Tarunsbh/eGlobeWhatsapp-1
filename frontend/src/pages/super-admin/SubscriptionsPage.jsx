import React, { useEffect, useState, useCallback } from 'react';
import {
  CreditCard, RefreshCw, CheckCircle2, ChevronDown, ChevronUp,
  Building2, Calendar, Users, AlertTriangle, TrendingUp, Package,
} from 'lucide-react';
import { saSubscriptions, saHotels, saUsage } from '../../api/super-admin';
import { format, parseISO } from 'date-fns';

const PLAN_CFG = {
  TRIAL:      { cls: 'bg-gray-500/15 text-gray-300 border-gray-500/30',     badge: 'bg-gray-700 text-gray-300' },
  BASIC:      { cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30',     badge: 'bg-blue-900/40 text-blue-300' },
  STANDARD:   { cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', badge: 'bg-indigo-900/40 text-indigo-300' },
  PREMIUM:    { cls: 'bg-purple-500/15 text-purple-300 border-purple-500/30', badge: 'bg-purple-900/40 text-purple-300' },
  ENTERPRISE: { cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30',  badge: 'bg-amber-900/40 text-amber-300' },
};
const STATUS_CFG = {
  ACTIVE:    { cls: 'bg-green-500/15 text-green-300 border-green-500/30',   label: 'Active' },
  TRIAL:     { cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30',      label: 'Trial' },
  SUSPENDED: { cls: 'bg-red-500/15 text-red-300 border-red-500/30',         label: 'Suspended' },
  EXPIRED:   { cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30', label: 'Expired' },
  CANCELLED: { cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30',      label: 'Cancelled' },
};

function planBadge(plan = '') {
  const key = plan.toUpperCase();
  const cfg = PLAN_CFG[key] || PLAN_CFG.TRIAL;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>{plan}</span>;
}
function statusBadge(status = '') {
  const key = status.toUpperCase();
  const cfg = STATUS_CFG[key] || STATUS_CFG.ACTIVE;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>;
}

function AssignPlanModal({ hotel, plans, onClose, onSaved }) {
  const [planId, setPlanId] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inp = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

  const save = async () => {
    if (!planId) return;
    setSaving(true); setError('');
    try {
      await saSubscriptions.update(hotel.id, planId, billingCycle);
      onSaved?.();
      onClose();
    } catch (e) { setError(e.response?.data?.message || 'Error updating subscription'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <h3 className="font-semibold text-white mb-1">Assign Plan</h3>
        <p className="text-xs text-gray-500 mb-4">{hotel.name} · {hotel.hotelCode}</p>
        {error && <p className="text-red-400 text-xs mb-3 bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Plan</label>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={inp}>
              <option value="">Select plan…</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName} — ₹{(p.monthlyPrice / 100).toLocaleString('en-IN')}/mo
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Billing Cycle</label>
            <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)} className={inp}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm">Cancel</button>
          <button onClick={save} disabled={saving || !planId}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Assign Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

function HotelSubRow({ hotel, plans, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [usage, setUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const sub = hotel.subscriptions?.[0];
  const month = format(new Date(), 'yyyy-MM');

  const loadUsage = async () => {
    if (usage) { setExpanded((e) => !e); return; }
    setLoadingUsage(true);
    setExpanded(true);
    try {
      const res = await saUsage.hotel(hotel.id, month);
      setUsage(res.data?.data || res.data || {});
    } catch { setUsage({}); }
    finally { setLoadingUsage(false); }
  };

  const renewalDate = sub?.currentPeriodEnd
    ? format(parseISO(sub.currentPeriodEnd), 'dd MMM yyyy')
    : '—';

  return (
    <>
      <tr className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors group">
        <td className="py-3 px-4">
          <div>
            <p className="text-sm font-medium text-white">{hotel.name}</p>
            <p className="text-[10px] text-gray-500 font-mono">{hotel.hotelCode}</p>
          </div>
        </td>
        <td className="py-3 px-4">{statusBadge(hotel.status)}</td>
        <td className="py-3 px-4">{planBadge(sub?.plan?.plan || hotel.plan || 'TRIAL')}</td>
        <td className="py-3 px-4 text-xs text-gray-400">{renewalDate}</td>
        <td className="py-3 px-4 text-xs text-gray-400">
          {sub?.billingCycle ? (
            <span className="capitalize">{sub.billingCycle}</span>
          ) : '—'}
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-2">
            <button onClick={() => setShowAssign(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 bg-indigo-500/10 rounded-lg">
              Change Plan
            </button>
            <button onClick={loadUsage}
              className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 bg-white/5 rounded-lg flex items-center gap-1">
              {loadingUsage ? <RefreshCw size={10} className="animate-spin" /> : null}
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              Usage
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-800/50 bg-gray-900/40">
          <td colSpan={6} className="px-6 py-4">
            {loadingUsage ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <RefreshCw size={12} className="animate-spin" /> Loading usage…
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Messages Sent', usage?.totalMessages ?? 0, 'text-white'],
                  ['Total Cost (₹)', usage?.totalCost != null ? (usage.totalCost / 100).toFixed(2) : '0.00', 'text-indigo-300'],
                  ['Meta Cost (₹)', usage?.totalMetaCost != null ? (usage.totalMetaCost / 100).toFixed(2) : '0.00', 'text-gray-300'],
                  ['Markup Earned (₹)', usage?.totalMarkup != null ? (usage.totalMarkup / 100).toFixed(2) : '0.00', 'text-green-400'],
                ].map(([label, val, cls]) => (
                  <div key={label} className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className={`text-base font-bold ${cls}`}>{val}</p>
                    <p className="text-[10px] text-gray-600">{month}</p>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
      {showAssign && (
        <AssignPlanModal hotel={hotel} plans={plans}
          onClose={() => setShowAssign(false)}
          onSaved={() => { onRefresh?.(); setShowAssign(false); }} />
      )}
    </>
  );
}

function PlanCard({ plan }) {
  const key = plan.plan?.toUpperCase() || 'BASIC';
  const cfg = PLAN_CFG[key] || PLAN_CFG.BASIC;
  return (
    <div className={`border rounded-2xl p-5 ${cfg.cls}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-white">{plan.displayName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{plan.description || plan.name}</p>
        </div>
        <Package size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
      </div>
      <p className="text-2xl font-bold text-white mb-1">
        ₹{(plan.monthlyPrice / 100).toLocaleString('en-IN')}
        <span className="text-sm text-gray-500 font-normal">/mo</span>
      </p>
      {plan.annualPrice > 0 && (
        <p className="text-xs text-gray-500 mb-3">₹{(plan.annualPrice / 100).toLocaleString('en-IN')}/year</p>
      )}
      <div className="grid grid-cols-2 gap-1 text-xs text-gray-400">
        {[
          ['Users', plan.maxUsers],
          ['Contacts', plan.maxContacts >= 999999 ? 'Unlimited' : plan.maxContacts?.toLocaleString()],
          ['Campaigns/mo', plan.maxCampaigns >= 9999 ? 'Unlimited' : plan.maxCampaigns],
          ['WA Numbers', plan.maxWhatsappNumbers],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span>{k}</span><span className="text-white font-medium">{v}</span>
          </div>
        ))}
      </div>
      {plan.features && Array.isArray(plan.features) && (
        <div className="flex flex-wrap gap-1 mt-3">
          {plan.features.map((f) => (
            <span key={f} className="text-[10px] px-1.5 py-0.5 bg-white/10 text-gray-400 rounded-md">{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, hRes] = await Promise.all([
        saSubscriptions.plans(),
        saHotels.list({ limit: 500 }),
      ]);
      setPlans(pRes.data?.data || pRes.data || []);
      const hData = hRes.data?.data || hRes.data;
      setHotels(hData?.hotels || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = hotels.filter((h) =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.hotelCode.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: hotels.length,
    active: hotels.filter((h) => h.status === 'ACTIVE').length,
    trial: hotels.filter((h) => h.status === 'TRIAL').length,
    suspended: hotels.filter((h) => h.status === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Subscriptions</h1>
        <p className="text-gray-500 text-sm">Manage hotel plans, billing cycles, and usage</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Hotels',   value: stats.total,     icon: Building2,  color: 'bg-indigo-600' },
          { label: 'Active',         value: stats.active,    icon: CheckCircle2, color: 'bg-green-600' },
          { label: 'On Trial',       value: stats.trial,     icon: Calendar,   color: 'bg-blue-600' },
          { label: 'Suspended',      value: stats.suspended, icon: AlertTriangle, color: stats.suspended > 0 ? 'bg-red-600' : 'bg-gray-700' },
        ].map((c) => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
              <c.icon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hotel subscriptions table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <Building2 size={14} className="text-gray-500" />
          <span className="text-sm font-semibold text-white">Hotel Subscriptions</span>
          <div className="ml-auto">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hotel…"
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48" />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw size={20} className="text-indigo-400 animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/20">
                {['Hotel', 'Status', 'Plan', 'Renews', 'Cycle', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-500 text-sm">No hotels found</td></tr>
              ) : filtered.map((h) => (
                <HotelSubRow key={h.id} hotel={h} plans={plans} onRefresh={load} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Available Plans grid */}
      {!loading && plans.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Package size={14} className="text-indigo-400" /> Available Plans
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((p) => <PlanCard key={p.id} plan={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
