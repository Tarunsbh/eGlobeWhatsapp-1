import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText, Plus, RefreshCw, IndianRupee, CheckCircle2,
  AlertTriangle, MessageSquare, TrendingUp, X, BarChart3,
} from 'lucide-react';
import { saBilling, saHotels, saUsage } from '../../api/super-admin';
import { format, parseISO, subMonths } from 'date-fns';

const STATUS_CFG = {
  DRAFT:   { label: 'Draft',   cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  SENT:    { label: 'Sent',    cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  PAID:    { label: 'Paid',    cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  OVERDUE: { label: 'Overdue', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  VOID:    { label: 'Void',    cls: 'bg-gray-600/15 text-gray-500 border-gray-600/30' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status?.toUpperCase()] || STATUS_CFG.DRAFT;
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>;
}

const inp = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

function ManualInvoiceModal({ hotels, onClose, onCreated }) {
  const [form, setForm] = useState({ hotelId: '', amount: '', description: '', taxPercent: 18 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await saBilling.generate(form.hotelId, {
        amount: Math.round(parseFloat(form.amount) * 100),
        description: form.description,
        taxPercent: +form.taxPercent,
      });
      onCreated?.(); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Error generating invoice'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2"><FileText size={15} /> Manual Invoice</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        {error && <p className="text-red-400 text-xs mb-3 bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hotel</label>
            <select required value={form.hotelId} onChange={set('hotelId')} className={inp}>
              <option value="">Select hotel…</option>
              {hotels.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.hotelCode})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Amount (₹)</label>
            <input required type="number" step="0.01" value={form.amount} onChange={set('amount')} placeholder="199.00" className={inp} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <input required value={form.description} onChange={set('description')} placeholder="Monthly subscription — Standard Plan" className={inp} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">GST %</label>
            <input type="number" min="0" max="100" value={form.taxPercent} onChange={set('taxPercent')} className={inp} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
              {loading ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsageInvoiceModal({ hotels, onClose, onCreated }) {
  const thisMonth = format(new Date(), 'yyyy-MM');
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');

  const [form, setForm] = useState({
    hotelId: '', month: thisMonth, includeSubscription: false, taxPercent: 18,
  });
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const loadPreview = async () => {
    if (!form.hotelId) return;
    setLoadingPreview(true); setPreview(null); setError('');
    try {
      const res = await saUsage.hotel(form.hotelId, form.month);
      setPreview(res.data?.data || res.data || {});
    } catch { setError('Could not load usage data for preview'); }
    finally { setLoadingPreview(false); }
  };

  useEffect(() => {
    if (form.hotelId && form.month) loadPreview();
  }, [form.hotelId, form.month]);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await saUsage.generateInvoice(form.hotelId, {
        month: form.month,
        includeSubscription: form.includeSubscription,
        taxPercent: +form.taxPercent,
      });
      onCreated?.(); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Error generating invoice'); }
    finally { setLoading(false); }
  };

  const messageCost = preview?.totalCost || 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2"><MessageSquare size={15} /> Invoice from Usage</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Generate an invoice based on actual WhatsApp message usage for a billing month.</p>
        {error && <p className="text-red-400 text-xs mb-3 bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>}
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Hotel</label>
              <select required value={form.hotelId} onChange={set('hotelId')} className={inp}>
                <option value="">Select hotel…</option>
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Billing Month</label>
              <select value={form.month} onChange={set('month')} className={inp}>
                <option value={thisMonth}>{thisMonth} (current)</option>
                <option value={lastMonth}>{lastMonth} (last month)</option>
                {Array.from({ length: 4 }, (_, i) => {
                  const m = format(subMonths(new Date(), i + 2), 'yyyy-MM');
                  return <option key={m} value={m}>{m}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Usage preview */}
          {loadingPreview && (
            <div className="flex items-center gap-2 text-xs text-gray-500 p-3 bg-gray-800/50 rounded-xl">
              <RefreshCw size={11} className="animate-spin" /> Loading usage data…
            </div>
          )}
          {preview && !loadingPreview && (
            <div className="p-3 bg-gray-800/60 border border-gray-700/40 rounded-xl space-y-2">
              <p className="text-xs text-gray-400 font-medium">Usage Preview — {form.month}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['Messages', preview.totalMessages ?? 0, 'text-white'],
                  ['Message Cost', `₹${((preview.totalCost || 0) / 100).toFixed(2)}`, 'text-indigo-300'],
                  ['Your Markup', `₹${((preview.totalMarkup || 0) / 100).toFixed(2)}`, 'text-green-400'],
                ].map(([l, v, cls]) => (
                  <div key={l}>
                    <p className="text-[10px] text-gray-500">{l}</p>
                    <p className={`text-sm font-bold ${cls}`}>{v}</p>
                  </div>
                ))}
              </div>
              {(preview.totalMessages === 0 || preview.totalMessages == null) && (
                <p className="text-xs text-amber-400 text-center">⚠ No message usage found for this period</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="inclSub" checked={form.includeSubscription}
              onChange={(e) => setForm((f) => ({ ...f, includeSubscription: e.target.checked }))}
              className="rounded border-gray-600 bg-gray-800 text-indigo-500" />
            <label htmlFor="inclSub" className="text-xs text-gray-400">Include subscription fee in this invoice</label>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">GST %</label>
            <input type="number" min="0" max="100" value={form.taxPercent} onChange={set('taxPercent')} className={inp} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm">Cancel</button>
            <button type="submit" disabled={loading || !form.hotelId}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
              {loading ? 'Generating…' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsageSummarySection({ hotels }) {
  const thisMonth = format(new Date(), 'yyyy-MM');
  const lastMonth = format(subMonths(new Date(), 1), 'yyyy-MM');
  const [month, setMonth] = useState(thisMonth);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await saUsage.summary(month);
      const payload = res.data?.data || res.data;
      setSummary(payload?.hotels || []);
    } catch { setSummary([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [month]);

  const totals = summary.reduce((acc, h) => ({
    messages: acc.messages + (h.totalMessages || 0),
    cost: acc.cost + (h.totalCost || 0),
    markup: acc.markup + (h.totalMarkup || 0),
  }), { messages: 0, cost: 0, markup: 0 });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <BarChart3 size={14} className="text-indigo-400" />
        <span className="text-sm font-semibold text-white">Message Usage Summary</span>
        <div className="ml-auto">
          <select value={month} onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value={thisMonth}>{thisMonth} (current)</option>
            <option value={lastMonth}>{lastMonth}</option>
            {Array.from({ length: 4 }, (_, i) => {
              const m = format(subMonths(new Date(), i + 2), 'yyyy-MM');
              return <option key={m} value={m}>{m}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Month totals */}
      {!loading && summary.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-gray-800/40 border-b border-gray-800">
          {[
            ['Total Messages', totals.messages.toLocaleString(), 'text-white'],
            ['Total Billed (₹)', (totals.cost / 100).toFixed(2), 'text-indigo-300'],
            ['Markup Earned (₹)', (totals.markup / 100).toFixed(2), 'text-green-400'],
          ].map(([l, v, cls]) => (
            <div key={l} className="px-5 py-3 bg-gray-900">
              <p className="text-xs text-gray-500">{l}</p>
              <p className={`text-lg font-bold ${cls}`}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <RefreshCw size={18} className="text-indigo-400 animate-spin" />
        </div>
      ) : summary.length === 0 ? (
        <div className="py-10 text-center text-gray-500 text-sm">No usage data for {month}</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/20">
              {['Hotel', 'Messages', 'Meta Cost', 'Markup', 'Total Billed', 'Invoice'].map((h) => (
                <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.map((h) => (
              <tr key={h.hotelId} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 px-4 text-sm text-white">{h.hotelName || h.hotelId}</td>
                <td className="py-2.5 px-4 text-sm text-gray-300">{(h.totalMessages || 0).toLocaleString()}</td>
                <td className="py-2.5 px-4 text-sm text-gray-400">₹{((h.totalMetaCost || 0) / 100).toFixed(2)}</td>
                <td className="py-2.5 px-4 text-sm text-green-400">₹{((h.totalMarkup || 0) / 100).toFixed(2)}</td>
                <td className="py-2.5 px-4 text-sm font-semibold text-white">₹{((h.totalCost || 0) / 100).toFixed(2)}</td>
                <td className="py-2.5 px-4 text-xs text-gray-500">
                  {h.invoiceId ? (
                    <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={11} /> Invoiced</span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [showUsage, setShowUsage] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, hRes] = await Promise.all([
        saBilling.list({ status: statusFilter || undefined }),
        saHotels.list({ limit: 500 }),
      ]);
      setInvoices(iRes.data?.data || iRes.data || []);
      const hData = hRes.data?.data || hRes.data;
      setHotels(hData?.hotels || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const summary = {
    total: invoices.reduce((s, i) => s + (i.total || 0), 0),
    paid: invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + (i.total || 0), 0),
    overdue: invoices.filter((i) => i.status === 'OVERDUE').length,
  };

  const voidInvoice = async (id) => {
    if (!window.confirm('Void this invoice? This cannot be undone.')) return;
    await saBilling.updateStatus(id, 'void');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Billing & Invoices</h1>
          <p className="text-gray-500 text-sm">{invoices.length} invoices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUsage(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-xl transition-colors border border-gray-700">
            <MessageSquare size={14} /> Usage Invoice
          </button>
          <button onClick={() => setShowManual(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus size={14} /> Manual Invoice
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Billed',       value: `₹${(summary.total / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: IndianRupee,  color: 'bg-indigo-600' },
          { label: 'Revenue Collected',  value: `₹${(summary.paid / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,  icon: CheckCircle2, color: 'bg-green-600' },
          { label: 'Overdue Invoices',   value: summary.overdue, icon: AlertTriangle, color: summary.overdue > 0 ? 'bg-red-600' : 'bg-gray-700' },
        ].map((c) => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
              <c.icon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Usage summary section */}
      <UsageSummarySection hotels={hotels} />

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['', 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
              statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Invoices table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw size={20} className="text-indigo-400 animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/30">
                {['Invoice #', 'Hotel', 'Description', 'Subtotal', 'GST', 'Total', 'Status', 'Due Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-gray-500 text-sm">No invoices found</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-xs text-white font-mono">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{inv.hotel?.name || '—'}</td>
                  <td className="py-3 px-4 text-xs text-gray-500 max-w-[180px] truncate">{inv.description || '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">₹{((inv.subtotal || 0) / 100).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{inv.taxPercent}%</td>
                  <td className="py-3 px-4 text-sm font-semibold text-white">₹{((inv.total || 0) / 100).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4"><StatusBadge status={inv.status} /></td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {inv.dueDate ? format(parseISO(inv.dueDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 text-xs">
                      {inv.status === 'DRAFT' && (
                        <button onClick={async () => { await saBilling.updateStatus(inv.id, 'sent'); load(); }}
                          className="text-blue-400 hover:text-blue-300 transition-colors">Send</button>
                      )}
                      {!['PAID', 'VOID'].includes(inv.status) && (
                        <button onClick={async () => { await saBilling.updateStatus(inv.id, 'paid'); load(); }}
                          className="text-green-400 hover:text-green-300 transition-colors">Mark Paid</button>
                      )}
                      {!['VOID', 'PAID'].includes(inv.status) && (
                        <button onClick={() => voidInvoice(inv.id)}
                          className="text-red-400 hover:text-red-300 transition-colors">Void</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showManual && <ManualInvoiceModal hotels={hotels} onClose={() => setShowManual(false)} onCreated={load} />}
      {showUsage && <UsageInvoiceModal hotels={hotels} onClose={() => setShowUsage(false)} onCreated={load} />}
    </div>
  );
}
