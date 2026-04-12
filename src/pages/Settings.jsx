import { useEffect, useState } from 'react';
import {
  User, Building2, Bell, Mail, Shield, Save,
  Key, Monitor, Smartphone, Lock,
  Clock3, SlidersHorizontal, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Settings() {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const canEditRole = (userProfile?.role || 'analyst') === 'admin';

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [form, setForm] = useState({
    displayName: userProfile?.displayName || currentUser?.displayName || '',
    company: userProfile?.company || '',
    role: userProfile?.role || 'analyst',
    emailNotif: userProfile?.notifications?.email ?? true,
    pushNotif: userProfile?.notifications?.push ?? true,
    smsNotif: userProfile?.notifications?.sms ?? false,
    riskThreshold: userProfile?.preferences?.riskThreshold ?? 60,
    slaWarningHours: userProfile?.preferences?.slaWarningHours ?? 48,
    digestTime: userProfile?.preferences?.digestTime || '08:00',
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      displayName: userProfile?.displayName || currentUser?.displayName || prev.displayName,
      company: userProfile?.company || prev.company,
      role: userProfile?.role || prev.role,
      emailNotif: userProfile?.notifications?.email ?? prev.emailNotif,
      pushNotif: userProfile?.notifications?.push ?? prev.pushNotif,
      smsNotif: userProfile?.notifications?.sms ?? prev.smsNotif,
      riskThreshold: userProfile?.preferences?.riskThreshold ?? prev.riskThreshold,
      slaWarningHours: userProfile?.preferences?.slaWarningHours ?? prev.slaWarningHours,
      digestTime: userProfile?.preferences?.digestTime ?? prev.digestTime,
    }));
  }, [currentUser?.displayName, userProfile]);

  const updateField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const getPreferencesPayload = () => ({
    riskThreshold: Number(form.riskThreshold),
    slaWarningHours: Number(form.slaWarningHours),
    digestTime: form.digestTime,
  });

  const handleSaveAccount = async () => {
    setLoading(true);
    try {
      await updateUserProfile({
        displayName: form.displayName,
        company: form.company,
        role: form.role,
        notifications: {
          email: form.emailNotif,
          push: form.pushNotif,
          sms: form.smsNotif,
        },
        preferences: getPreferencesPayload(),
      });
      setLastSavedAt(new Date());
      toast.success('Settings updated in Firestore');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await updateUserProfile({ preferences: getPreferencesPayload() });
      setLastSavedAt(new Date());
      toast.success('Preferences saved to Firestore');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User, subtitle: 'Profile and access' },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Key },
    { id: 'preferences', label: 'Preferences', icon: Monitor },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-6">
      <div className="stat-card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Profile & Settings</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Manage account identity, alert channels, integrations, and operational defaults.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-fit">
            <Shield className="w-4 h-4 text-brand-600" />
            {lastSavedAt ? `Last saved at ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No changes saved yet'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px,1fr] gap-4 sm:gap-6">
        {/* Left rail */}
        <aside className="space-y-4">
          <div className="stat-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{form.displayName || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{currentUser?.email || 'No email'}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Role</p>
                <p className="text-xs font-semibold text-slate-700 capitalize mt-0.5">{form.role}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Company</p>
                <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">{form.company || 'Not set'}</p>
              </div>
            </div>
          </div>

          <div className="stat-card p-2">
            <div className="grid grid-cols-2 gap-1 xl:flex xl:flex-col">
              {tabs.map(({ id, label, icon: Icon, subtitle }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`group flex items-center justify-center sm:justify-between gap-2 min-w-0 w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-brand-50 text-brand-700 border border-brand-100'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4" />
                  <div className="text-left min-w-0">
                    <p>{label}</p>
                    {subtitle && <p className="text-[10px] text-slate-400 leading-tight hidden xl:block">{subtitle}</p>}
                  </div>
                </div>
                <ChevronRight className={`hidden sm:block w-4 h-4 transition-transform ${activeTab === id ? 'text-brand-500' : 'text-slate-300 group-hover:text-slate-400'}`} />
              </button>
            ))}
            </div>
          </div>
        </aside>

        {/* Content workspace */}
        <section className="space-y-4">
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="stat-card space-y-5">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Account Identity</h3>
                  <p className="text-sm text-slate-500 mt-1">Update personal and organization details shown across dashboards and alerts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="settings-display-name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input id="settings-display-name" name="displayName" type="text" value={form.displayName} onChange={updateField('displayName')} className="input-field pl-10" placeholder="Your name" autoComplete="name" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settings-company" className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input id="settings-company" name="company" type="text" value={form.company} onChange={updateField('company')} className="input-field pl-10" placeholder="Company name" autoComplete="organization" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="settings-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input id="settings-email" name="email" type="email" value={currentUser?.email || ''} disabled className="input-field pl-10 bg-slate-50 text-slate-500" autoComplete="email" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settings-role" className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                    <select id="settings-role" name="role" value={form.role} onChange={updateField('role')} className="input-field" disabled={!canEditRole}>
                      <option value="analyst">Analyst</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Administrator</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    {!canEditRole && (
                      <p className="text-xs text-slate-400 mt-1">Only administrators can change roles.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-700">Security Notice</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Authentication credentials are managed by Firebase Auth. Password, MFA, and session policies are configured through your auth provider.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center sm:justify-start">
                <button onClick={handleSaveAccount} disabled={loading} className="btn-primary flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Account Settings
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="stat-card space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">Notification Center</h3>
                <p className="text-sm text-slate-500">Configure how alert events are delivered to your operations team.</p>
              </div>

              <div className="stat-card space-y-4">
                {[
                  { key: 'emailNotif', label: 'Email Notifications', desc: 'Receive alerts via email for high-risk shipments', icon: Mail },
                  { key: 'pushNotif', label: 'Push Notifications', desc: 'Get real-time browser push notifications', icon: Bell },
                  { key: 'smsNotif', label: 'SMS Notifications', desc: 'Receive text messages for critical SLA breaches', icon: Smartphone },
                ].map(({ key, label, desc, icon: Icon }) => (
                  <div key={key} className="grid grid-cols-[1fr_auto] items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer self-center flex-shrink-0">
                      <input
                        name={key}
                        type="checkbox"
                        checked={form[key]}
                        onChange={updateField(key)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-brand-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                    </label>
                  </div>
                ))}

                <div>
                  <label htmlFor="settings-digest-time" className="block text-sm font-medium text-slate-700 mb-1.5">Daily Digest Time</label>
                  <div className="relative max-w-xs">
                    <Clock3 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="settings-digest-time" name="digestTime" type="time" value={form.digestTime} onChange={updateField('digestTime')} className="input-field pl-10" />
                  </div>
                </div>
              </div>

              <div className="flex justify-center sm:justify-start">
                <button onClick={handleSaveAccount} disabled={loading} className="btn-primary flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Notification Settings
                </button>
              </div>
            </div>
          )}

          {/* API Keys / Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div className="stat-card space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">API Integrations</h3>
                <p className="text-sm text-slate-500">All third-party provider keys are backend-managed only.</p>
              </div>

              <div className="stat-card space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">Provider key policy</p>
                  <p className="text-xs text-slate-500 mt-1">
                    OpenWeather, Google Routes, and News API credentials are configured on the backend only and are never stored in the browser or user profile.
                  </p>
                </div>
              </div>

              <div className="stat-card p-4 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Secure Storage</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Provider keys are backend-only. Frontend calls secure proxy endpoints through VITE_BACKEND_URL.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div className="stat-card space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">Operational Preferences</h3>
                <p className="text-sm text-slate-500">Tune sensitivity for predictive alerts and SLA guardrails.</p>
              </div>

              <div className="stat-card space-y-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-700">Risk Alert Threshold</p>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">Shipments above this score trigger proactive alerts.</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <input
                      id="settings-risk-threshold"
                      name="riskThreshold"
                      type="range"
                      min="20"
                      max="90"
                      value={form.riskThreshold}
                      onChange={updateField('riskThreshold')}
                      className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brand-600"
                    />
                    <span className="text-lg font-bold text-brand-600 w-12 text-left sm:text-center">{form.riskThreshold}%</span>
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                    <span>More alerts</span>
                    <span>Fewer alerts</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <label htmlFor="settings-sla-warning-hours" className="block text-sm font-medium text-slate-700 mb-1.5">SLA Warning Window</label>
                  <p className="text-xs text-slate-500 mb-3">Trigger warnings this many hours before the SLA deadline.</p>
                  <select id="settings-sla-warning-hours" name="slaWarningHours" value={form.slaWarningHours} onChange={updateField('slaWarningHours')} className="input-field max-w-xs">
                    <option value={24}>24 hours</option>
                    <option value={48}>48 hours (recommended)</option>
                    <option value={72}>72 hours</option>
                    <option value={96}>96 hours</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-center sm:justify-start">
                <button onClick={handleSavePreferences} disabled={loading} className="btn-primary flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
