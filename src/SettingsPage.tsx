import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Store, Globe, Moon, Sun, DollarSign, Save, CheckCircle, Smartphone, Mail, MapPin, Camera, MessageCircle, Loader, Wifi, WifiOff, RefreshCw, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { startWhatsAppSession, getWhatsAppStatus, stopWhatsAppSession, getStudioSettings, updateStudioSettings } from './api';

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
  ar: { title: 'الإعدادات', subtitle: 'تخصيص تفاصيل الاستوديو وإعدادات النظام والعملات', profile: 'الملف الشخصي', studio: 'إعدادات الاستوديو', system: 'النظام والعملات', studioName: 'اسم الاستوديو', studioEmail: 'البريد الإلكتروني للعمل', studioAddress: 'العنوان الرسمي', currency: 'العملة الافتراضية', currencyHint: 'سيتم استخدامه في جميع الفواتير والأسعار', language: 'لغة النظام', theme: 'المظهر الخارجي', save: 'حفظ التغييرات', success: 'تم حفظ الإعدادات بنجاح', phone: 'رقم الهاتف', adminName: 'اسم المدير', dark: 'داكن', light: 'فاتح', whatsapp: 'واتساب', waTitle: 'ربط الواتساب', waSubtitle: 'ربط جلسة الواتساب لإرسال الفواتير للعملاء', waStart: 'بدء الجلسة', waStop: 'فصل الجلسة وتغيير الحساب', waConnected: 'متصل ✓', waDisconnected: 'غير متصل', waStarting: 'جاري الاتصال...', waHint: 'بعد بدء الجلسة، سيظهر رمز QR هنا. افتح واتساب على هاتفك > الأجهزة المرتبطة > ربط جهاز > امسح الرمز.', waChangeHint: 'لتغيير الحساب: اضغط "فصل الجلسة وتغيير الحساب" ثم ابدأ جلسة جديدة وامسح رمز QR بالحساب الجديد.', waDisconnectConfirm: 'سيتم فصل الواتساب وحذف بيانات الجلسة. هل تريد المتابعة؟', country: 'البلد', countryHint: 'سيتم إضافة رمز الدولة تلقائياً لأرقام العملاء عند الإرسال',
    attendance: 'الحضور والخصومات', attTitle: 'إعدادات الحضور والخصومات', attSubtitle: 'تحديد قواعد التأخير والخصومات والوقت الإضافي',
    graceMinutes: 'فترة السماح (بالدقائق)', graceHint: 'المدة المسموح بها للتأخير قبل بدء الخصم',
    deductionType: 'نوع الخصم', deductionRate: 'قيمة الخصم', 
    perMinute: 'لكل دقيقة', perHour: 'لكل ساعة', perHalfDay: 'لنصف اليوم',
    deductionHint: 'قيمة الخصم بالعملة المحلية حسب نوع الخصم المحدد',
    overtimeMultiplier: 'معامل الوقت الإضافي', overtimeHint: 'مضاعف أجر الساعة للعمل الإضافي (مثال: 1.5 = ساعة ونصف)',
    halfDayDeduction: 'خصم نصف اليوم (%)', halfDayHint: 'نسبة الخصم عند الغياب نصف يوم من المرتب اليومي',
    absentDeduction: 'خصم الغياب (%)', absentHint: 'نسبة الخصم عند الغياب يوم كامل من المرتب اليومي',
  },
  en: { title: 'Settings', subtitle: 'Customize studio details, system preferences, and currencies', profile: 'Personal Profile', studio: 'Studio Settings', system: 'System & Currency', studioName: 'Studio Name', studioEmail: 'Business Email', studioAddress: 'Official Address', currency: 'Default Currency', currencyHint: 'This will be used for all invoices and pricing', language: 'System Language', theme: 'Appearance', save: 'Save Changes', success: 'Settings saved successfully', phone: 'Phone Number', adminName: 'Admin Name', dark: 'Dark', light: 'Light', whatsapp: 'WhatsApp', waTitle: 'WhatsApp Connection', waSubtitle: 'Connect WhatsApp session to send invoices to customers', waStart: 'Start Session', waStop: 'Disconnect & Change Account', waConnected: 'Connected ✓', waDisconnected: 'Disconnected', waStarting: 'Connecting...', waHint: 'After starting, a QR code will appear here. Open WhatsApp > Linked Devices > Link a Device > Scan the code.', waChangeHint: 'To change account: Click "Disconnect & Change Account" then start a new session and scan QR with the new account.', waDisconnectConfirm: 'This will disconnect WhatsApp and delete session data. Continue?', country: 'Country', countryHint: 'Country code will be automatically added to customer numbers when sending',
    attendance: 'Attendance & Deductions', attTitle: 'Attendance & Deduction Settings', attSubtitle: 'Configure late penalties, deduction rules, and overtime rates',
    graceMinutes: 'Grace Period (minutes)', graceHint: 'Allowed late time before deductions start',
    deductionType: 'Deduction Type', deductionRate: 'Deduction Amount',
    perMinute: 'Per Minute', perHour: 'Per Hour', perHalfDay: 'Per Half Day',
    deductionHint: 'Deduction amount in local currency based on selected type',
    overtimeMultiplier: 'Overtime Multiplier', overtimeHint: 'Hourly rate multiplier for overtime (e.g., 1.5 = time and a half)',
    halfDayDeduction: 'Half Day Deduction (%)', halfDayHint: 'Deduction percentage for half-day absence from daily salary',
    absentDeduction: 'Absent Deduction (%)', absentHint: 'Deduction percentage for full-day absence from daily salary',
  },
};

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const lang = settings.lang;
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'studio' | 'profile' | 'system' | 'whatsapp' | 'attendance'>('studio');
  const [selectedCurrency, setSelectedCurrency] = useState(settings.currency);
  const [selectedCountry, setSelectedCountry] = useState(settings.countryCode);
  const [showToast, setShowToast] = useState(false);
  const [studioName, setStudioName] = useState(settings.studioName);
  const [adminName, setAdminName] = useState('Admin Studio');
  const [email, setEmail] = useState('contact@stodio.com');

  // Attendance settings
  const [graceMinutes, setGraceMinutes] = useState('15');
  const [deductionType, setDeductionType] = useState('per_minute');
  const [deductionRate, setDeductionRate] = useState('1');
  const [overtimeMultiplier, setOvertimeMultiplier] = useState('1.5');
  const [halfDayDeduction, setHalfDayDeduction] = useState('50');
  const [absentDeduction, setAbsentDeduction] = useState('100');
  const [attSaving, setAttSaving] = useState(false);

  useEffect(() => { setStudioName(settings.studioName); setSelectedCurrency(settings.currency); setSelectedCountry(settings.countryCode); }, [settings]);

  // Load attendance settings from DB
  useEffect(() => {
    getStudioSettings().then(res => {
      if (res.data) {
        setGraceMinutes(String(res.data.late_grace_minutes ?? 15));
        setDeductionType(res.data.deduction_type || 'per_minute');
        setDeductionRate(String(res.data.deduction_rate ?? 1));
        setOvertimeMultiplier(String(res.data.overtime_rate_multiplier ?? 1.5));
        setHalfDayDeduction(String(res.data.half_day_deduction_percent ?? 50));
        setAbsentDeduction(String(res.data.absent_deduction_percent ?? 100));
      }
    }).catch(() => {});
  }, []);

  const [waStatus, setWaStatus] = useState<'disconnected' | 'starting' | 'qr' | 'connected'>('disconnected');
  const [waLoading, setWaLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const checkWaStatus = async () => { try { const res = await getWhatsAppStatus(); const s = res.data; setWaStatus(s.connected ? 'connected' : s.status === 'qr' ? 'qr' : s.status === 'starting' ? 'starting' : 'disconnected'); setQrCode(s.qrCode || null); } catch { setWaStatus('disconnected'); setQrCode(null); } };
  useEffect(() => { checkWaStatus(); }, []);
  useEffect(() => { if (waStatus === 'starting' || waStatus === 'qr') { const interval = setInterval(checkWaStatus, 3000); return () => clearInterval(interval); } }, [waStatus]);

  const handleStartWa = async () => {
    setWaLoading(true);
    try { const res = await startWhatsAppSession(); const s = res.data; setWaStatus(s.status === 'qr' ? 'qr' : s.connected ? 'connected' : 'starting'); setQrCode(s.qrCode || null); } catch { setWaStatus('disconnected'); } finally { setWaLoading(false); }
  };
  const handleStopWa = async () => {
    if (!window.confirm(t.waDisconnectConfirm)) return;
    setWaLoading(true);
    try { await stopWhatsAppSession(); setWaStatus('disconnected'); setQrCode(null); } catch {} finally { setWaLoading(false); }
  };

  const handleSave = () => { updateSettings({ currency: selectedCurrency, studioName, lang: settings.lang, theme: settings.theme, countryCode: selectedCountry }); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

  const handleSaveAttendance = async () => {
    setAttSaving(true);
    try {
      await updateStudioSettings({
        late_grace_minutes: parseInt(graceMinutes),
        deduction_type: deductionType,
        deduction_rate: parseFloat(deductionRate),
        overtime_rate_multiplier: parseFloat(overtimeMultiplier),
        half_day_deduction_percent: parseInt(halfDayDeduction),
        absent_deduction_percent: parseInt(absentDeduction),
      });
      setShowToast(true); setTimeout(() => setShowToast(false), 3000);
    } catch {} finally { setAttSaving(false); }
  };

  const tabs = [
    { key: 'profile' as const, icon: User, label: t.profile },
    { key: 'studio' as const, icon: Store, label: t.studio },
    { key: 'system' as const, icon: Globe, label: t.system },
    { key: 'attendance' as const, icon: Clock, label: t.attendance },
    { key: 'whatsapp' as const, icon: MessageCircle, label: t.whatsapp },
  ];

  const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo";

  return (
    <div className="animate-fade-in">
      {showToast && (
        <motion.div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-2 shadow-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <CheckCircle size={18} />{t.success}
        </motion.div>
      )}

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
                    <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} className={inputClass + ' cursor-pointer'}>
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

            {/* Attendance & Deductions Settings */}
            {activeTab === 'attendance' && (
              <div className="p-7">
                <div className="flex items-center gap-2.5 text-sky-500 mb-2"><Clock size={20} /><h3 className="text-base font-bold text-foreground">{t.attTitle}</h3></div>
                <p className="text-sm text-muted-foreground mb-6">{t.attSubtitle}</p>
                
                <div className="space-y-6">
                  {/* Grace Period */}
                  <div className="bg-muted/50 border border-border rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" />{lang === 'ar' ? 'قواعد التأخير' : 'Late Rules'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">{t.graceMinutes}</label>
                        <p className="text-[11px] text-muted-foreground mb-2">{t.graceHint}</p>
                        <input type="number" min="0" max="120" value={graceMinutes} onChange={e => setGraceMinutes(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">{t.deductionType}</label>
                        <select value={deductionType} onChange={e => setDeductionType(e.target.value)} className={inputClass + ' cursor-pointer'}>
                          <option value="per_minute">{t.perMinute}</option>
                          <option value="per_hour">{t.perHour}</option>
                          <option value="per_half_day">{t.perHalfDay}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">{t.deductionRate} ({settings.currency})</label>
                      <p className="text-[11px] text-muted-foreground mb-2">{t.deductionHint}</p>
                      <input type="number" min="0" step="0.5" value={deductionRate} onChange={e => setDeductionRate(e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  {/* Overtime */}
                  <div className="bg-muted/50 border border-border rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2"><Clock size={16} className="text-emerald-500" />{lang === 'ar' ? 'الوقت الإضافي' : 'Overtime'}</h4>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">{t.overtimeMultiplier}</label>
                      <p className="text-[11px] text-muted-foreground mb-2">{t.overtimeHint}</p>
                      <input type="number" min="1" max="5" step="0.1" value={overtimeMultiplier} onChange={e => setOvertimeMultiplier(e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  {/* Absence Deductions */}
                  <div className="bg-muted/50 border border-border rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2"><XCircle size={16} className="text-red-500" />{lang === 'ar' ? 'خصومات الغياب' : 'Absence Deductions'}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">{t.halfDayDeduction}</label>
                        <p className="text-[11px] text-muted-foreground mb-2">{t.halfDayHint}</p>
                        <input type="number" min="0" max="100" value={halfDayDeduction} onChange={e => setHalfDayDeduction(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">{t.absentDeduction}</label>
                        <p className="text-[11px] text-muted-foreground mb-2">{t.absentHint}</p>
                        <input type="number" min="0" max="200" value={absentDeduction} onChange={e => setAbsentDeduction(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button onClick={handleSaveAttendance} disabled={attSaving} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 shadow-md shadow-primary/20">
                    {attSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}{t.save}
                  </button>
                </div>
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
                  {qrCode && (
                    <div className="flex flex-col items-center gap-4 my-6 p-6 bg-white rounded-xl border-4 border-emerald-500/10 shadow-xl">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                        <img src={qrCode} alt="Scan WhatsApp QR Code" className="w-[240px] h-[240px] object-contain rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <p className="text-xs text-gray-500 text-center max-w-xs">{t.waHint}</p>
                    </div>
                  )}
                  {waStatus === 'connected' && (
                    <p className="text-xs text-muted-foreground mt-3">{t.waChangeHint}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end px-7 py-4 border-t border-border bg-muted/30">
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-primary/20"><Save size={16} />{t.save}</button>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;