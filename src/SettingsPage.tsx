import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Store, Globe, Moon, Sun, DollarSign, Save, CheckCircle, Smartphone, Mail, MapPin, Camera, MessageCircle, Loader, Wifi, WifiOff, RefreshCw, Clock, Brain, Plus, Trash2 } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { startWhatsAppSession, getWhatsAppStatus, stopWhatsAppSession } from './api';

const currencies = [
  { code: 'EGP', label: { ar: 'جنيه مصري', en: 'Egyptian Pound' }, symbol: 'ج.م' },
  { code: 'SAR', label: { ar: 'ريال سعودي', en: 'Saudi Riyal' }, symbol: 'ر.س' },
  { code: 'USD', label: { ar: 'دولار أمريكي', en: 'US Dollar' }, symbol: '$' },
  { code: 'AED', label: { ar: 'درهم إماراتي', en: 'UAE Dirham' }, symbol: 'د.إ' },
  { code: 'EUR', label: { ar: 'يورو', en: 'Euro' }, symbol: '€' },
];

const countries = [
  { code: '20', label: { ar: 'مصر', en: 'Egypt' } },
  { code: '966', label: { ar: 'المملكة العربية السعودية', en: 'Saudi Arabia' } },
  { code: '971', label: { ar: 'الإمارات', en: 'UAE' } },
  { code: '212', label: { ar: 'المغرب', en: 'Morocco' } },
  { code: '213', label: { ar: 'الجزائر', en: 'Algeria' } },
  { code: '216', label: { ar: 'تونس', en: 'Tunisia' } },
  { code: '218', label: { ar: 'ليبيا', en: 'Libya' } },
  { code: '249', label: { ar: 'السودان', en: 'Sudan' } },
  { code: '970', label: { ar: 'فلسطين', en: 'Palestine' } },
  { code: '972', label: { ar: 'إسرائيل', en: 'Israel' } },
  { code: '962', label: { ar: 'الأردن', en: 'Jordan' } },
  { code: '963', label: { ar: 'سوريا', en: 'Syria' } },
  { code: '961', label: { ar: 'لبنان', en: 'Lebanon' } },
];

const translations = {
  ar: { title: 'الإعدادات', subtitle: 'تخصيص تفاصيل الاستوديو وإعدادات النظام والعملات', profile: 'الملف الشخصي', studio: 'إعدادات الاستوديو', system: 'النظام والعملات', studioName: 'اسم الاستوديو', studioEmail: 'البريد الإلكتروني للعمل', studioAddress: 'العنوان الرسمي', currency: 'العملة الافتراضية', currencyHint: 'سيتم استخدامه في جميع الفواتير والأسعار', language: 'لغة النظام', theme: 'المظهر الخارجي', save: 'حفظ التغييرات', success: 'تم حفظ الإعدادات بنجاح', phone: 'رقم الهاتف', adminName: 'اسم المدير', dark: 'داكن', light: 'فاتح', whatsapp: 'واتساب', waTitle: 'ربط الواتساب', waSubtitle: 'ربط جلسة الواتساب لإرسال الفواتير للعملاء', waStart: 'بدء الجلسة', waStop: 'فصل الجلسة وتغيير الحساب', waConnected: 'متصل ✓', waDisconnected: 'غير متصل', waStarting: 'جاري الاتصال...', waHint: 'بعد بدء الجلسة، سيظهر رمز QR هنا. افتح واتساب على هاتفك > الأجهزة المرتبطة > ربط جهاز > امسح الرمز.', waChangeHint: 'لتغيير الحساب: اضغط "فصل الجلسة وتغيير الحساب" ثم ابدأ جلسة جديدة وامسح رمز QR بالحساب الجديد.', waDisconnectConfirm: 'سيتم فصل الواتساب وحذف بيانات الجلسة. هل تريد المتابعة؟', country: 'البلد', countryHint: 'سيتم إضافة رمز الدولة تلقائياً لأرقام العملاء عند الإرسال', deductions: 'الخصومات والحوافز', aiModels: 'نماذج الذكاء الاصطناعي', deductionMode: 'وضع الخصم', perMinute: 'لكل دقيقة', perHour: 'لكل ساعة', perHalfDay: 'لكل نصف يوم', graceMinutes: 'فترة السماح (دقائق)', overtimeMultiplier: 'معامل الوقت الإضافي', deductionAmount: 'مبلغ الخصم' },
  en: { title: 'Settings', subtitle: 'Customize studio details, system preferences, and currencies', profile: 'Personal Profile', studio: 'Studio Settings', system: 'System & Currency', studioName: 'Studio Name', studioEmail: 'Business Email', studioAddress: 'Official Address', currency: 'Default Currency', currencyHint: 'This will be used for all invoices and pricing', language: 'System Language', theme: 'Appearance', save: 'Save Changes', success: 'Settings saved successfully', phone: 'Phone Number', adminName: 'Admin Name', dark: 'Dark', light: 'Light', whatsapp: 'WhatsApp', waTitle: 'WhatsApp Connection', waSubtitle: 'Connect WhatsApp session to send invoices to customers', waStart: 'Start Session', waStop: 'Disconnect & Change Account', waConnected: 'Connected ✓', waDisconnected: 'Disconnected', waStarting: 'Connecting...', waHint: 'After starting, a QR code will appear here. Open WhatsApp > Linked Devices > Link a Device > Scan the code.', waChangeHint: 'To change account: Click "Disconnect & Change Account" then start a new session and scan QR with the new account.', waDisconnectConfirm: 'This will disconnect WhatsApp and delete session data. Continue?', country: 'Country', countryHint: 'Country code will be automatically added to customer numbers when sending', deductions: 'Deductions & Incentives', aiModels: 'AI Models', deductionMode: 'Deduction Mode', perMinute: 'Per Minute', perHour: 'Per Hour', perHalfDay: 'Per Half Day', graceMinutes: 'Grace Period (minutes)', overtimeMultiplier: 'Overtime Multiplier', deductionAmount: 'Deduction Amount' },
};

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const lang = settings.lang;
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'studio' | 'profile' | 'system' | 'whatsapp' | 'deductions' | 'aiModels'>('studio');
  const [selectedCurrency, setSelectedCurrency] = useState(settings.currency);
  const [selectedCountry, setSelectedCountry] = useState(settings.countryCode);
  const [showToast, setShowToast] = useState(false);
  const [studioName, setStudioName] = useState(settings.studioName);
  const [adminName, setAdminName] = useState('Admin Studio');
  const [email, setEmail] = useState('contact@stodio.com');

  useEffect(() => { setStudioName(settings.studioName); setSelectedCurrency(settings.currency); setSelectedCountry(settings.countryCode); }, [settings]);

  const [waStatus, setWaStatus] = useState<'disconnected' | 'starting' | 'qr' | 'connected'>('disconnected');
  const [waLoading, setWaLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const checkWaStatus = async () => { try { const res = await getWhatsAppStatus(); const s = res.data; setWaStatus(s.connected ? 'connected' : s.status === 'qr' ? 'qr' : s.status === 'starting' ? 'starting' : 'disconnected'); setQrCode(s.qrCode || null); } catch { setWaStatus('disconnected'); setQrCode(null); } };
  useEffect(() => { checkWaStatus(); }, []);
  useEffect(() => { if (waStatus === 'starting' || waStatus === 'qr') { const interval = setInterval(checkWaStatus, 3000); return () => clearInterval(interval); } }, [waStatus]);

  const handleStartWa = async () => {
    setWaLoading(true);
    try {
      const res = await startWhatsAppSession();
      const s = res.data;
      setWaStatus(s.status === 'qr' ? 'qr' : s.connected ? 'connected' : 'starting');
      setQrCode(s.qrCode || null);
    } catch (err) {
      console.error(err);
      setWaStatus('disconnected');
    } finally {
      setWaLoading(false);
    }
  };

  const handleStopWa = async () => {
    if (!window.confirm(t.waDisconnectConfirm)) return;
    setWaLoading(true);
    try {
      await stopWhatsAppSession();
      setWaStatus('disconnected');
      setQrCode(null);
    } catch (err) {
      console.error(err);
    } finally {
      setWaLoading(false);
    }
  };

  const handleSave = () => { updateSettings({ currency: selectedCurrency, studioName, lang: settings.lang, theme: settings.theme, countryCode: selectedCountry }); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

  const tabs = [
    { key: 'profile' as const, icon: User, label: t.profile },
    { key: 'studio' as const, icon: Store, label: t.studio },
    { key: 'system' as const, icon: Globe, label: t.system },
    { key: 'deductions' as const, icon: Clock, label: t.deductions },
    { key: 'aiModels' as const, icon: Brain, label: t.aiModels },
    { key: 'whatsapp' as const, icon: MessageCircle, label: t.whatsapp },
  ];

  const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo";

  return (
    <div className="animate-fade-in">
      <header className="mb-7">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        <aside className="bg-card border border-border rounded-xl p-2.5 flex lg:flex-col gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all text-start whitespace-nowrap ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <tab.icon size={18} /><span>{tab.label}</span>
            </button>
          ))}
        </aside>

        <main>
          <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {activeTab === 'profile' && (
              <div className="p-7">
                <div className="flex items-center gap-2.5 text-primary mb-6"><User size={20} /><h3 className="text-base font-bold text-foreground">{t.profile}</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div><label className="block text-xs font-semibold text-foreground mb-2">{t.adminName}</label><input value={adminName} onChange={e => setAdminName(e.target.value)} className={inputClass} /></div>
                  <div><label className="block text-xs font-semibold text-foreground mb-2">{t.phone}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"><Smartphone size={16} className="text-muted-foreground" /><input defaultValue="+201068694941" className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-cairo" /></div></div>
                </div>
              </div>
            )}

            {activeTab === 'studio' && (
              <div className="p-7">
                <div className="flex items-center gap-2.5 text-primary mb-6"><Store size={20} /><h3 className="text-base font-bold text-foreground">{t.studio}</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2"><label className="block text-xs font-semibold text-foreground mb-2">{t.studioName}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"><Camera size={16} className="text-muted-foreground" /><input value={studioName} onChange={e => setStudioName(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-cairo" /></div></div>
                  <div><label className="block text-xs font-semibold text-foreground mb-2">{t.studioEmail}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"><Mail size={16} className="text-muted-foreground" /><input value={email} onChange={e => setEmail(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-cairo" /></div></div>
                  <div><label className="block text-xs font-semibold text-foreground mb-2">{t.studioAddress}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"><MapPin size={16} className="text-muted-foreground" /><input defaultValue="Riyadh, Saudi Arabia" className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-cairo" /></div></div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="p-7">
                <div className="flex items-center gap-2.5 text-primary mb-6"><DollarSign size={20} /><h3 className="text-base font-bold text-foreground">{t.system}</h3></div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">{t.currency}</label>
                    <p className="text-xs text-muted-foreground mb-3">{t.currencyHint}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {currencies.map(curr => (
                        <button key={curr.code} onClick={() => setSelectedCurrency(curr.code)} className={`flex items-center gap-2.5 px-3.5 py-3 rounded-lg border text-start transition-all ${selectedCurrency === curr.code ? 'border-primary/50 bg-primary/5 text-primary' : 'border-border bg-muted hover:border-border hover:bg-muted/80 text-foreground'}`}>
                          <span className="w-9 h-9 rounded-lg bg-card shadow-sm flex items-center justify-center font-extrabold text-xs text-primary">{curr.symbol}</span>
                          <span className="flex-1 text-sm font-semibold">{curr.label[lang]} ({curr.code})</span>
                          {selectedCurrency === curr.code && <CheckCircle size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">{t.country}</label>
                    <p className="text-xs text-muted-foreground mb-3">{t.countryHint}</p>
                    <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo cursor-pointer">
                      {countries.map(c => <option key={c.code} value={c.code}>{c.label[lang]} (+{c.code})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div><label className="block text-xs font-semibold text-foreground mb-2">{t.language}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50"><Globe size={16} className="text-muted-foreground" /><select value={settings.lang} onChange={e => updateSettings({ lang: e.target.value as 'ar' | 'en' })} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-cairo cursor-pointer"><option value="ar">العربية (Arabic)</option><option value="en">English</option></select></div></div>
                    <div><label className="block text-xs font-semibold text-foreground mb-2">{t.theme}</label><div className="flex gap-1 bg-muted p-1 rounded-lg"><button onClick={() => updateSettings({ theme: 'light' })} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all ${settings.theme === 'light' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}><Sun size={14} />{t.light}</button><button onClick={() => updateSettings({ theme: 'dark' })} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-bold transition-all ${settings.theme === 'dark' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}><Moon size={14} />{t.dark}</button></div></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deductions' && (
              <div className="p-7">
                <div className="flex items-center gap-2.5 text-primary mb-6"><Clock size={20} /><h3 className="text-base font-bold text-foreground">{t.deductions}</h3></div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-2">{t.deductionMode}</label>
                    <div className="flex gap-2">
                      {(['minute', 'hour', 'half_day'] as const).map(mode => (
                        <button key={mode} onClick={() => updateSettings({ deductionRules: { ...settings.deductionRules, mode } })}
                          className={`flex-1 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${settings.deductionRules.mode === mode ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground hover:text-foreground'}`}>
                          {mode === 'minute' ? t.perMinute : mode === 'hour' ? t.perHour : t.perHalfDay}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">{t.graceMinutes}</label>
                      <input type="number" value={settings.deductionRules.graceMinutes} onChange={e => updateSettings({ deductionRules: { ...settings.deductionRules, graceMinutes: Number(e.target.value) } })}
                        className={inputClass} />
                      <p className="text-[10px] text-muted-foreground mt-1">{lang === 'ar' ? 'المدة المسموحة قبل بدء الخصم' : 'Allowed time before deduction starts'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">{t.overtimeMultiplier}</label>
                      <input type="number" step="0.1" value={settings.deductionRules.overtimeMultiplier} onChange={e => updateSettings({ deductionRules: { ...settings.deductionRules, overtimeMultiplier: Number(e.target.value) } })}
                        className={inputClass} />
                      <p className="text-[10px] text-muted-foreground mt-1">{lang === 'ar' ? 'مثال: 1.5 = ساعة ونصف أجر لكل ساعة إضافية' : 'e.g. 1.5 = 1.5x pay per OT hour'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                      <label className="block text-[10px] font-bold text-muted-foreground mb-2">{t.perMinute} ({settings.currency})</label>
                      <input type="number" step="0.1" value={settings.deductionRules.perMinute} onChange={e => updateSettings({ deductionRules: { ...settings.deductionRules, perMinute: Number(e.target.value) } })}
                        className={inputClass} />
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                      <label className="block text-[10px] font-bold text-muted-foreground mb-2">{t.perHour} ({settings.currency})</label>
                      <input type="number" step="1" value={settings.deductionRules.perHour} onChange={e => updateSettings({ deductionRules: { ...settings.deductionRules, perHour: Number(e.target.value) } })}
                        className={inputClass} />
                    </div>
                    <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                      <label className="block text-[10px] font-bold text-muted-foreground mb-2">{t.perHalfDay} ({settings.currency})</label>
                      <input type="number" step="1" value={settings.deductionRules.perHalfDay} onChange={e => updateSettings({ deductionRules: { ...settings.deductionRules, perHalfDay: Number(e.target.value) } })}
                        className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'aiModels' && (
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5 text-primary"><Brain size={20} /><h3 className="text-base font-bold text-foreground">{t.aiModels}</h3></div>
                  <button onClick={() => {
                    const newModel = { id: `model_${Date.now()}`, name: '', provider: 'openai', apiKey: '', endpoint: '', isActive: false };
                    updateSettings({ aiModels: [...settings.aiModels, newModel] });
                  }} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all">
                    <Plus size={14} />{lang === 'ar' ? 'إضافة نموذج' : 'Add Model'}
                  </button>
                </div>

                {/* Built-in model info */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CheckCircle size={14} className="text-emerald-600" /></div>
                    <span className="text-xs font-bold text-emerald-600">{lang === 'ar' ? 'النموذج المدمج (Lovable AI)' : 'Built-in Model (Lovable AI)'}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{lang === 'ar' ? 'النموذج المدمج يعمل تلقائياً - google/gemini-3-flash-preview. يمكنك إضافة نماذج خارجية أدناه.' : 'Built-in model works automatically - google/gemini-3-flash-preview. Add external models below.'}</p>
                </div>

                {settings.aiModels.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain size={40} className="mx-auto opacity-20 mb-3" />
                    <p className="text-sm">{lang === 'ar' ? 'لا يوجد نماذج خارجية مضافة' : 'No external models added'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {settings.aiModels.map((model, idx) => (
                      <div key={model.id} className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                          <div className="flex gap-2">
                            <button onClick={() => {
                              const updated = settings.aiModels.map(m => m.id === model.id ? { ...m, isActive: !m.isActive } : m);
                              updateSettings({ aiModels: updated });
                            }} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${model.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                              {model.isActive ? (lang === 'ar' ? '✓ مفعّل' : '✓ Active') : (lang === 'ar' ? 'معطّل' : 'Inactive')}
                            </button>
                            <button onClick={() => {
                              updateSettings({ aiModels: settings.aiModels.filter(m => m.id !== model.id) });
                            }} className="w-7 h-7 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1">{lang === 'ar' ? 'اسم النموذج' : 'Model Name'}</label>
                            <input value={model.name} onChange={e => { const updated = settings.aiModels.map(m => m.id === model.id ? { ...m, name: e.target.value } : m); updateSettings({ aiModels: updated }); }}
                              className={inputClass} placeholder="gpt-4, claude-3, etc." />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1">{lang === 'ar' ? 'المزود' : 'Provider'}</label>
                            <select value={model.provider} onChange={e => { const updated = settings.aiModels.map(m => m.id === model.id ? { ...m, provider: e.target.value } : m); updateSettings({ aiModels: updated }); }}
                              className={inputClass}>
                              <option value="openai">OpenAI</option>
                              <option value="anthropic">Anthropic</option>
                              <option value="google">Google AI</option>
                              <option value="custom">{lang === 'ar' ? 'مخصص' : 'Custom'}</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1">{lang === 'ar' ? 'مفتاح API' : 'API Key'}</label>
                            <input type="password" value={model.apiKey} onChange={e => { const updated = settings.aiModels.map(m => m.id === model.id ? { ...m, apiKey: e.target.value } : m); updateSettings({ aiModels: updated }); }}
                              className={inputClass} placeholder="sk-..." />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1">{lang === 'ar' ? 'نقطة النهاية (Endpoint)' : 'Endpoint URL'}</label>
                            <input value={model.endpoint} onChange={e => { const updated = settings.aiModels.map(m => m.id === model.id ? { ...m, endpoint: e.target.value } : m); updateSettings({ aiModels: updated }); }}
                              className={inputClass} placeholder="https://api.openai.com/v1/chat/completions" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <div className="p-7">
                <div className="flex items-center gap-2.5 text-green-600 mb-2"><MessageCircle size={20} /><h3 className="text-base font-bold text-foreground">{t.waTitle}</h3></div>
                <p className="text-sm text-muted-foreground mb-6">{t.waSubtitle}</p>
                <div className="bg-muted rounded-xl p-5 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {waStatus === 'connected' ? <Wifi size={20} className="text-green-500" /> : waStatus === 'qr' ? <Smartphone size={20} className="text-amber-500 animate-pulse" /> : <WifiOff size={20} className="text-muted-foreground" />}
                      <span className={`text-sm font-bold ${waStatus === 'connected' ? 'text-green-500' : (waStatus === 'starting' || waStatus === 'qr') ? 'text-amber-500' : 'text-muted-foreground'}`}>
                        {waStatus === 'connected' ? t.waConnected : waStatus === 'qr' ? (lang === 'ar' ? 'امسح رمز QR من واتساب' : 'Scan QR from WhatsApp') : waStatus === 'starting' ? t.waStarting : t.waDisconnected}
                      </span>
                    </div>
                    {waStatus === 'connected' ? (
                      <button onClick={handleStopWa} disabled={waLoading} className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-semibold hover:bg-destructive/20 transition-all disabled:opacity-50 flex items-center gap-2">
                        {waLoading && <Loader size={14} className="animate-spin" />}<RefreshCw size={14} />{t.waStop}
                      </button>
                    ) : (
                      <button onClick={handleStartWa} disabled={waLoading || waStatus === 'starting'} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-all disabled:opacity-50 flex items-center gap-2">
                        {(waLoading || waStatus === 'starting') ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        {(waLoading || waStatus === 'starting') ? t.waStarting : t.waStart}
                      </button>
                    )}
                  </div>
                  {/* Active QR Display */}
                  {qrCode && (
                    <div className="flex flex-col items-center gap-4 my-6 p-6 bg-white rounded-xl border-4 border-emerald-500/10 shadow-xl animate-in fade-in zoom-in duration-300">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                        <img
                          src={qrCode}
                          alt="Scan WhatsApp QR Code"
                          className="w-[240px] h-[240px] object-contain rounded-lg"
                          onError={(e) => {
                            // If image fails, revert to simple placeholder text
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) parent.innerHTML = '<div class="w-[240px] h-[240px] flex items-center justify-center bg-gray-100 text-gray-400 text-xs">QR Load Error</div>';
                          }}
                        />
                      </div>
                      <div className="text-center space-y-1.5">
                        <p className="text-base font-bold text-gray-800">{lang === 'ar' ? 'افتح واتساب على هاتفك' : 'Open WhatsApp on your phone'}</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-full">
                          <span>{lang === 'ar' ? 'القائمة' : 'Menu'}</span>
                          <span>›</span>
                          <span>{lang === 'ar' ? 'الأجهزة المرتبطة' : 'Linked Devices'}</span>
                          <span>›</span>
                          <span>{lang === 'ar' ? 'ربط جهاز' : 'Link a Device'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {waStatus === 'starting' && !qrCode && (
                    <div className="flex flex-col items-center justify-center gap-4 my-8 p-10 bg-muted/30 rounded-xl border border-dashed border-border/60">
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                        <Loader size={40} className="relative z-10 animate-spin text-emerald-600" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-bold text-foreground">{lang === 'ar' ? 'جاري تحضير الجلسة...' : 'Preparing session...'}</p>
                        <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'يرجى الانتظار بضع ثواني' : 'Please wait a few seconds'}</p>
                      </div>
                    </div>
                  )}

                  {/* Instructions (Only show if not connected and no QR) */}
                  {waStatus === 'disconnected' && !qrCode && (
                    <div className="flex flex-col items-center justify-center gap-3 my-8 py-10 text-muted-foreground opacity-60">
                      <Smartphone size={48} strokeWidth={1.5} />
                      <p className="text-sm font-medium">{lang === 'ar' ? 'اضغط "بدء الجلسة" لربط حسابك' : 'Click "Start Session" to connect account'}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border mt-6">{t.waHint}</p>
                  <p className="text-xs text-amber-600 bg-amber-500/5 p-3 rounded-lg border border-amber-500/20 mt-2 flex items-start gap-2"><RefreshCw size={14} className="shrink-0 mt-0.5" />{t.waChangeHint}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end px-7 py-4 border-t border-border bg-muted/30">
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-primary/20"><Save size={18} /> {t.save}</button>
            </div>
          </motion.div>
        </main>
      </div>

      {showToast && (
        <motion.div className="fixed bottom-7 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-5 py-3 rounded-full flex items-center gap-2 text-sm font-bold shadow-xl z-[3000]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <CheckCircle size={18} /> {t.success}
        </motion.div>
      )}
    </div>
  );
};

export default SettingsPage;
