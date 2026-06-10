import React, { useState } from 'react';
import { X, Loader2, Building2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { saHotels } from '../../../api/super-admin';

const PLANS = ['trial','basic','standard','premium','enterprise'];
const CYCLES = ['monthly','quarterly','annual'];

export default function CreateHotelModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', hotelCode: '', contactPerson: '', email: '',
    mobile: '', address: '', gstNumber: '',
    phoneNumberId: '', wabaId: '', accessToken: '',
    timezone: 'Asia/Kolkata', country: 'IN',
    plan: 'trial', billingCycle: 'monthly',
    adminName: 'Hotel Admin', adminPassword: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await saHotels.create(form);
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create hotel');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const lbl = 'block text-xs font-medium text-gray-400 mb-1';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center">
              <Building2 size={15} className="text-indigo-400" />
            </div>
            <h2 className="font-semibold text-white">Create Hotel Account</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* Hotel Info */}
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-3 pb-2 border-b border-gray-800">Hotel Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Hotel Name *</label>
                <input required value={form.name} onChange={set('name')} placeholder="The Grand Palace Hotel" className={inp} />
              </div>
              <div>
                <label className={lbl}>Hotel Code *</label>
                <input required value={form.hotelCode} onChange={set('hotelCode')} placeholder="GPH001" className={inp} />
              </div>
              <div>
                <label className={lbl}>Contact Person</label>
                <input value={form.contactPerson} onChange={set('contactPerson')} placeholder="Rajesh Kumar" className={inp} />
              </div>
              <div>
                <label className={lbl}>Admin Email *</label>
                <input required type="email" value={form.email} onChange={set('email')} placeholder="admin@hotel.com" className={inp} />
              </div>
              <div>
                <label className={lbl}>Mobile</label>
                <input value={form.mobile} onChange={set('mobile')} placeholder="+919876543210" className={inp} />
              </div>
              <div>
                <label className={lbl}>GST Number</label>
                <input value={form.gstNumber} onChange={set('gstNumber')} placeholder="22AAAAA0000A1Z5" className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Address</label>
                <textarea value={form.address} onChange={set('address')} placeholder="Hotel address…" rows={2} className={inp} />
              </div>
            </div>
          </div>

          {/* WhatsApp Config */}
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-3 pb-2 border-b border-gray-800">WhatsApp Configuration</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Phone Number ID *</label>
                <input required value={form.phoneNumberId} onChange={set('phoneNumberId')} placeholder="100435043277…" className={inp} />
              </div>
              <div>
                <label className={lbl}>WABA ID *</label>
                <input required value={form.wabaId} onChange={set('wabaId')} placeholder="162135950912…" className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Access Token <span className="text-gray-600 font-normal">(optional — can be added later)</span></label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={form.accessToken}
                    onChange={set('accessToken')}
                    placeholder="EAAxxxxxxxxxx… (WhatsApp Business API permanent token)"
                    className={`${inp} pr-10 font-mono text-xs`}
                  />
                  <button type="button" onClick={() => setShowToken((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Stored encrypted. Used to send WhatsApp messages on behalf of this hotel.</p>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-3 pb-2 border-b border-gray-800">Subscription</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Plan</label>
                <select value={form.plan} onChange={set('plan')} className={inp}>
                  {PLANS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Billing Cycle</label>
                <select value={form.billingCycle} onChange={set('billingCycle')} className={inp}>
                  {CYCLES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Timezone</label>
                <select value={form.timezone} onChange={set('timezone')} className={inp}>
                  {['Asia/Kolkata','Asia/Dubai','Asia/Singapore','Europe/London','America/New_York','UTC'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Admin User */}
          <div>
            <p className="text-xs font-semibold text-gray-300 mb-3 pb-2 border-b border-gray-800">Initial Admin User</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Admin Name *</label>
                <input required value={form.adminName} onChange={set('adminName')} placeholder="Hotel Admin" className={inp} />
              </div>
              <div>
                <label className={lbl}>Admin Password *</label>
                <input required type="password" value={form.adminPassword} onChange={set('adminPassword')}
                  placeholder="Min 8 chars, upper+lower+num+special" className={inp} />
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1.5">User will be forced to change password on first login.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : 'Create Hotel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
