import React, { useEffect, useState } from 'react';
import { IndianRupee, Save, RefreshCw, Info, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { saPricing } from '../../api/super-admin';

const TYPE_META = {
  utility:        { label: 'Utility',        desc: 'Order confirmations, delivery updates, account alerts', color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  marketing:      { label: 'Marketing',       desc: 'Promotions, offers, newsletters, new product announcements', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  authentication: { label: 'Authentication',  desc: 'OTPs, verification codes, login prompts', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  service:        { label: 'Service',         desc: 'Customer-initiated conversations (free within 24h window)', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
};

function paiseToRupee(p) { return (p / 100).toFixed(2); }
function rupeeToPaise(r) { return Math.round(parseFloat(r || 0) * 100); }

function PricingRow({ pricing, onSave }) {
  const meta = TYPE_META[pricing.messageType] || { label: pricing.messageType, desc: '', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' };
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    metaBase: paiseToRupee(pricing.metaBasePrice),
    markup:   paiseToRupee(pricing.markupAmount),
    notes:    pricing.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const selling = (parseFloat(form.metaBase || 0) + parseFloat(form.markup || 0)).toFixed(2);
  const margin  = pricing.metaBasePrice > 0
    ? Math.round((pricing.markupAmount / pricing.metaBasePrice) * 100)
    : 0;

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await saPricing.update(pricing.id, {
        metaBasePrice: rupeeToPaise(form.metaBase),
        markupAmount:  rupeeToPaise(form.markup),
        notes: form.notes,
      });
      setMsg('success');
      setEdit(false);
      onSave?.();
    } catch (e) {
      setMsg('error');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const inp = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono';

  return (
    <div className={`border rounded-2xl p-5 ${meta.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className={`font-bold text-base ${meta.color}`}>{meta.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
        </div>
        {msg === 'success' && <CheckCircle2 size={16} className="text-green-400" />}
        {msg === 'error'   && <XCircle      size={16} className="text-red-400" />}
      </div>

      {!edit ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Meta charges you', `₹${paiseToRupee(pricing.metaBasePrice)}`, 'text-gray-400'],
              ['Your markup',      `₹${paiseToRupee(pricing.markupAmount)}`,  'text-indigo-400'],
              ['Hotel pays',       `₹${paiseToRupee(pricing.sellingPrice)}`,  'text-white font-semibold'],
            ].map(([label, val, cls]) => (
              <div key={label} className="bg-black/20 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                <p className={`text-lg ${cls}`}>{val}</p>
                <p className="text-[10px] text-gray-600">per message</p>
              </div>
            ))}
          </div>
          {pricing.markupAmount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <TrendingUp size={11} className="text-green-400" />
              <span className="text-green-400 font-medium">{margin}% margin</span> on Meta base price
            </div>
          )}
          {pricing.notes && <p className="text-xs text-gray-500 italic">{pricing.notes}</p>}
          <button onClick={() => setEdit(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            Edit pricing →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Meta charges you (₹)</label>
              <input type="number" step="0.01" min="0" value={form.metaBase}
                onChange={(e) => setForm((f) => ({ ...f, metaBase: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Your markup (₹)</label>
              <input type="number" step="0.01" min="0" value={form.markup}
                onChange={(e) => setForm((f) => ({ ...f, markup: e.target.value }))} className={inp} />
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-indigo-900/20 border border-indigo-700/30 rounded-xl">
            <IndianRupee size={13} className="text-indigo-400" />
            <span className="text-xs text-gray-400">Hotel will be charged</span>
            <span className="text-sm font-bold text-white ml-auto">₹{selling} / message</span>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
            <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. aligned with Meta Q2 2026 pricing" className={inp} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setEdit(false); setForm({ metaBase: paiseToRupee(pricing.metaBasePrice), markup: paiseToRupee(pricing.markupAmount), notes: pricing.notes || '' }); }}
              className="px-3 py-1.5 text-xs bg-gray-800 text-gray-400 rounded-xl hover:text-white transition-colors">
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50">
              {saving ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />} Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await saPricing.list();
      setPricing(res.data?.data || res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Message Pricing</h1>
        <p className="text-gray-500 text-sm">Set Meta base cost + your markup for each conversation type</p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-700/30 rounded-2xl">
        <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-gray-400 space-y-1">
          <p><span className="text-white font-medium">How pricing works:</span> Meta charges you a base rate per message type. You add your markup and hotels are billed the selling price (base + markup).</p>
          <p>Prices are in <span className="text-white">paise</span> internally but displayed as <span className="text-white">₹</span>. Changes take effect for new messages immediately.</p>
          <p className="text-gray-500">Current Meta India rates (approx): Utility ₹0.11, Marketing ₹0.60, Authentication ₹0.11, Service ₹0.00</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw size={20} className="text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pricing.map((p) => (
            <PricingRow key={p.id} pricing={p} onSave={load} />
          ))}
        </div>
      )}
    </div>
  );
}
