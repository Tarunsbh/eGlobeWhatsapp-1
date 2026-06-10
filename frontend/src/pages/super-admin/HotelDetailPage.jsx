import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Users, MessageSquare, RefreshCw, Plus,
  Edit, Trash2, KeyRound, UserCheck, UserX, MoreVertical, CheckCircle2, XCircle,
  CreditCard, FileText, ChevronRight, Eye, EyeOff, Save, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { saHotels, saUsers, saSubscriptions, saBilling } from '../../api/super-admin';
import { format } from 'date-fns';

const ROLE_BADGE = {
  ADMIN: 'bg-indigo-500/20 text-indigo-300',
  OWNER: 'bg-purple-500/20 text-purple-300',
  MANAGER: 'bg-blue-500/20 text-blue-300',
  AGENT: 'bg-gray-500/20 text-gray-300',
  GENERAL_MANAGER: 'bg-cyan-500/20 text-cyan-300',
  FRONT_OFFICE: 'bg-teal-500/20 text-teal-300',
  RESERVATIONS: 'bg-sky-500/20 text-sky-300',
  MARKETING: 'bg-pink-500/20 text-pink-300',
  ACCOUNTANT: 'bg-amber-500/20 text-amber-300',
};

function UserRow({ user, hotelId, onRefresh }) {
  const [working, setWorking] = useState(false);

  const act = async (fn) => {
    setWorking(true);
    try { await fn(); await onRefresh(); }
    catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setWorking(false); }
  };

  return (
    <tr className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-4">
        <div>
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${ROLE_BADGE[user.role] || 'bg-gray-500/20 text-gray-300'}`}>
          {user.role.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
          {user.isActive ? '● Active' : '● Inactive'}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">
        {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'dd MMM HH:mm') : 'Never'}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <button disabled={working} title="Reset Password"
            onClick={() => { const p = prompt('New password:'); if (p) act(() => saUsers.resetPassword(hotelId, user.id, p)); }}
            className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-300 transition-colors">
            <KeyRound size={13} />
          </button>
          {user.isActive ? (
            <button disabled={working} title="Disable"
              onClick={() => act(() => saUsers.disable(hotelId, user.id))}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-colors">
              <UserX size={13} />
            </button>
          ) : (
            <button disabled={working} title="Enable"
              onClick={() => act(() => saUsers.enable(hotelId, user.id))}
              className="p-1.5 rounded-lg hover:bg-green-500/20 text-gray-400 hover:text-green-300 transition-colors">
              <UserCheck size={13} />
            </button>
          )}
          <button disabled={working} title="Delete"
            onClick={() => { if (confirm('Delete user?')) act(() => saUsers.delete(hotelId, user.id)); }}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddUserModal({ hotelId, onClose, onAdded }) {
  const [form, setForm] = useState({ email: '', name: '', role: 'AGENT', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inp = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await saUsers.create(hotelId, form); onAdded?.(); onClose(); }
    catch (err) { setError(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
        <h3 className="font-semibold text-white mb-4">Add User</h3>
        {error && <p className="text-red-400 text-sm mb-3 bg-red-900/20 px-3 py-2 rounded-xl">{error}</p>}
        <form onSubmit={submit} className="space-y-3">
          <input required value={form.name} onChange={set('name')} placeholder="Full Name" className={inp} />
          <input required type="email" value={form.email} onChange={set('email')} placeholder="Email" className={inp} />
          <input value={form.phone} onChange={set('phone')} placeholder="Phone (optional)" className={inp} />
          <select value={form.role} onChange={set('role')} className={inp}>
            {['ADMIN','OWNER','GENERAL_MANAGER','FRONT_OFFICE','RESERVATIONS','MARKETING','ACCOUNTANT','MANAGER','AGENT'].map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <input required type="password" value={form.password} onChange={set('password')} placeholder="Password" className={inp} />
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
              {loading ? 'Adding…' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [users, setUsers] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);

  // WhatsApp config edit state
  const [waForm, setWaForm] = useState({ phoneNumberId: '', wabaId: '', businessId: '', accessToken: '' });
  const [showToken, setShowToken] = useState(false);
  const [waSaving, setWaSaving] = useState(false);
  const [waMsg, setWaMsg] = useState(null); // { type: 'success'|'error', text }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, uRes, sRes, iRes] = await Promise.all([
        saHotels.get(id),
        saUsers.list(id),
        saSubscriptions.get(id),
        saBilling.list({ hotelId: id }),
      ]);
      const h = hRes.data?.data || hRes.data;
      setHotel(h);
      setWaForm({ phoneNumberId: h.phoneNumberId || '', wabaId: h.wabaId || '', businessId: h.businessId || '', accessToken: '' });
      setUsers(uRes.data?.data || uRes.data || []);
      setSubscription(sRes.data?.data || sRes.data);
      setInvoices((iRes.data?.data || iRes.data || []).slice(0, 20));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={24} className="text-indigo-400 animate-spin" />
    </div>
  );
  if (!hotel) return <div className="text-gray-400 text-center py-16">Hotel not found</div>;

  const STATUS_COLOR = { ACTIVE: 'text-green-400', TRIAL: 'text-yellow-400', SUSPENDED: 'text-red-400', EXPIRED: 'text-gray-400' };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: `Users (${users.length})` },
    { id: 'subscription', label: 'Subscription' },
    { id: 'invoices', label: `Invoices (${invoices.length})` },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/super-admin/hotels')}
          className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center text-indigo-300 text-lg font-bold">
            {hotel.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{hotel.name}</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">{hotel.hotelCode}</span>
              <span className={`font-medium ${STATUS_COLOR[hotel.status]}`}>● {hotel.status}</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="ml-auto flex gap-2">
          {hotel.status !== 'ACTIVE' && (
            <button onClick={async () => { await saHotels.activate(id); load(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 rounded-xl text-xs font-medium transition-colors">
              <CheckCircle2 size={13} /> Activate
            </button>
          )}
          {hotel.status !== 'SUSPENDED' && (
            <button onClick={async () => { const r = prompt('Reason?'); if (r) { await saHotels.suspend(id, r); load(); } }}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 rounded-xl text-xs font-medium transition-colors">
              <XCircle size={13} /> Suspend
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Users', value: hotel._count?.users || 0, icon: Users, color: 'text-blue-400' },
          { label: 'Guests', value: hotel._count?.guests || 0, icon: Users, color: 'text-green-400' },
          { label: 'Campaigns', value: hotel._count?.campaigns || 0, icon: MessageSquare, color: 'text-purple-400' },
          { label: 'Messages', value: hotel._count?.messages || 0, icon: MessageSquare, color: 'text-cyan-400' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
            <s.icon size={20} className={s.color} />
            <div>
              <p className="text-xl font-bold text-white">{s.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 flex gap-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? 'text-indigo-400 border-indigo-500' : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Hotel Information</h3>
            {[
              ['Hotel Code', hotel.hotelCode],
              ['Contact Person', hotel.contactPerson || '—'],
              ['Mobile', hotel.mobile || '—'],
              ['GST Number', hotel.gstNumber || '—'],
              ['Timezone', hotel.timezone],
              ['Country', hotel.country],
              ['Created', format(new Date(hotel.createdAt), 'dd MMM yyyy HH:mm')],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="text-white font-medium">{v}</span>
              </div>
            ))}
          </div>
          {/* WhatsApp Config — editable, synced with hotel panel settings */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">WhatsApp Configuration</h3>
              {/* Token status badge */}
              {hotel.tokens?.length > 0 ? (
                <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                  <ShieldCheck size={11} /> Token on file
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">
                  <AlertTriangle size={11} /> No token
                </span>
              )}
            </div>

            {waMsg && (
              <div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs border ${
                waMsg.type === 'success'
                  ? 'bg-green-900/20 border-green-800 text-green-400'
                  : 'bg-red-900/20 border-red-800 text-red-400'
              }`}>
                {waMsg.type === 'success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                {waMsg.text}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Phone Number ID</label>
                  <input
                    value={waForm.phoneNumberId}
                    onChange={(e) => setWaForm((f) => ({ ...f, phoneNumberId: e.target.value }))}
                    placeholder="100435043277…"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">WABA ID</label>
                  <input
                    value={waForm.wabaId}
                    onChange={(e) => setWaForm((f) => ({ ...f, wabaId: e.target.value }))}
                    placeholder="162135950912…"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Business ID <span className="text-gray-600">(optional)</span></label>
                <input
                  value={waForm.businessId}
                  onChange={(e) => setWaForm((f) => ({ ...f, businessId: e.target.value }))}
                  placeholder="Meta Business ID"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Access Token
                  <span className="text-gray-600 font-normal ml-1">
                    {hotel.tokens?.length > 0
                      ? `— leave blank to keep existing (updated ${format(new Date(hotel.tokens[0].updatedAt), 'dd MMM yyyy')})`
                      : '— no token stored yet'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={waForm.accessToken}
                    onChange={(e) => setWaForm((f) => ({ ...f, accessToken: e.target.value }))}
                    placeholder={hotel.tokens?.length > 0 ? 'Enter new token to replace…' : 'EAAxxxxxxxxxx…'}
                    className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <button type="button" onClick={() => setShowToken((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              disabled={waSaving}
              onClick={async () => {
                setWaSaving(true); setWaMsg(null);
                try {
                  await saHotels.update(id, {
                    phoneNumberId: waForm.phoneNumberId,
                    wabaId: waForm.wabaId,
                    businessId: waForm.businessId,
                    ...(waForm.accessToken && { accessToken: waForm.accessToken }),
                  });
                  setWaMsg({ type: 'success', text: 'WhatsApp configuration saved.' });
                  setWaForm((f) => ({ ...f, accessToken: '' }));
                  load();
                } catch (e) {
                  setWaMsg({ type: 'error', text: e.response?.data?.message || 'Save failed' });
                } finally {
                  setWaSaving(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              {waSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              Save WhatsApp Config
            </button>

            {hotel.suspensionReason && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl">
                <p className="text-xs text-red-400 font-medium">Suspension Reason</p>
                <p className="text-xs text-red-300 mt-0.5">{hotel.suspensionReason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Staff Users</h3>
            <button onClick={() => setShowAddUser(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors">
              <Plus size={13} /> Add User
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/30">
                {['User', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500 text-sm">No users found</td></tr>
              ) : (
                users.map((u) => <UserRow key={u.id} user={u} hotelId={id} onRefresh={load} />)
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'subscription' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Subscription Details</h3>
          {subscription ? (
            <div className="space-y-3">
              {[
                ['Plan', subscription.plan?.displayName || subscription.plan?.name],
                ['Status', subscription.status],
                ['Billing Cycle', subscription.billingCycle],
                ['Period Start', format(new Date(subscription.currentPeriodStart), 'dd MMM yyyy')],
                ['Period End', format(new Date(subscription.currentPeriodEnd), 'dd MMM yyyy')],
                ['Auto Renew', subscription.autoRenew ? 'Yes' : 'No'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-gray-800 pb-2.5">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
              {subscription.plan && (
                <div className="p-4 bg-indigo-900/20 border border-indigo-800/40 rounded-xl mt-3">
                  <p className="text-xs font-semibold text-indigo-300 mb-2">Plan Limits</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      ['Max Users', subscription.plan.maxUsers],
                      ['Max Contacts', subscription.plan.maxContacts?.toLocaleString()],
                      ['Max Campaigns/mo', subscription.plan.maxCampaigns],
                      ['WA Numbers', subscription.plan.maxWhatsappNumbers],
                      ['API Calls/mo', subscription.plan.maxApiCallsPerMonth?.toLocaleString()],
                      ['Automations', subscription.plan.maxAutomations],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-indigo-900/20 rounded-lg p-2">
                        <p className="text-indigo-300 font-semibold">{v}</p>
                        <p className="text-gray-500">{k}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No active subscription</p>
          )}
        </div>
      )}

      {tab === 'invoices' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-white">Invoices</h3>
            <button onClick={() => { const amt = prompt('Amount (in paise, e.g. 19900 = ₹199):'); const desc = prompt('Description:'); if (amt && desc) saBilling.generate(id, { amount: +amt, description: desc }).then(load); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-colors">
              <Plus size={13} /> Generate Invoice
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-800/30">
                {['Invoice #', 'Total', 'Status', 'Due Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500 text-sm">No invoices</td></tr>
              ) : invoices.map((inv) => {
                const STATUS = { DRAFT: 'text-gray-400', SENT: 'text-blue-400', PAID: 'text-green-400', OVERDUE: 'text-red-400', VOID: 'text-gray-600' };
                return (
                  <tr key={inv.id} className="border-b border-gray-800/50 hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-sm text-white font-mono">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-sm text-white">₹{((inv.total || 0) / 100).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4"><span className={`text-xs font-medium ${STATUS[inv.status]}`}>{inv.status}</span></td>
                    <td className="py-3 px-4 text-xs text-gray-500">{format(new Date(inv.dueDate), 'dd MMM yyyy')}</td>
                    <td className="py-3 px-4">
                      {inv.status !== 'PAID' && (
                        <button onClick={async () => { await saBilling.updateStatus(inv.id, 'paid'); load(); }}
                          className="text-xs text-green-400 hover:text-green-300 transition-colors">Mark Paid</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddUser && <AddUserModal hotelId={id} onClose={() => setShowAddUser(false)} onAdded={load} />}
    </div>
  );
}
