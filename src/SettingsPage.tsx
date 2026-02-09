import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User, Store, Globe, Moon, Sun, DollarSign,
    Save, CheckCircle, Smartphone, Mail, MapPin, Camera
} from 'lucide-react';
import { useSettings } from './SettingsContext';
import './SettingsPage.css';

const currencies = [
    { code: 'SAR', label: { ar: 'ريال سعودي', en: 'Saudi Riyal' }, symbol: 'ر.س' },
    { code: 'USD', label: { ar: 'دولار أمريكي', en: 'US Dollar' }, symbol: '$' },
    { code: 'EGP', label: { ar: 'جنيه مصري', en: 'Egyptian Pound' }, symbol: 'ج.م' },
    { code: 'AED', label: { ar: 'درهم إماراتي', en: 'UAE Dirham' }, symbol: 'د.إ' },
    { code: 'EUR', label: { ar: 'يورو', en: 'Euro' }, symbol: '€' },
];

const translations = {
    ar: {
        title: 'الإعدادات',
        subtitle: 'تخصيص تفاصيل الاستوديو وإعدادات النظام والعملات',
        profile: 'الملف الشخصي',
        studio: 'إعدادات الاستوديو',
        system: 'النظام والعملات',
        studioName: 'اسم الاستوديو',
        studioEmail: 'البريد الإلكتروني للعمل',
        studioAddress: 'العنوان الرسمي',
        currency: 'العملة الافتراضية',
        currencyHint: 'سيتم استخدامه في جميع الفواتير والأسعار',
        language: 'لغة النظام',
        theme: 'المظهر الخارجي',
        save: 'حفظ التغييرات',
        success: 'تم حفظ الإعدادات بنجاح',
        phone: 'رقم الهاتف',
        adminName: 'اسم المدير',
        dark: 'داكن',
        light: 'فاتح',
    },
    en: {
        title: 'Settings',
        subtitle: 'Customize studio details, system preferences, and currencies',
        profile: 'Personal Profile',
        studio: 'Studio Settings',
        system: 'System & Currency',
        studioName: 'Studio Name',
        studioEmail: 'Business Email',
        studioAddress: 'Official Address',
        currency: 'Default Currency',
        currencyHint: 'This will be used for all invoices and pricing',
        language: 'System Language',
        theme: 'Appearance',
        save: 'Save Changes',
        success: 'Settings saved successfully',
        phone: 'Phone Number',
        adminName: 'Admin Name',
        dark: 'Dark',
        light: 'Light',
    }
};

const SettingsPage: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const lang = settings.lang;
    const t = translations[lang];

    const [activeTab, setActiveTab] = useState<'studio' | 'profile' | 'system'>('studio');
    const [selectedCurrency, setSelectedCurrency] = useState(settings.currency);
    const [showToast, setShowToast] = useState(false);

    // Form states
    const [studioName, setStudioName] = useState(settings.studioName);
    const [adminName, setAdminName] = useState('Admin Studio');
    const [email, setEmail] = useState('contact@stodio.com');

    // Sync local state when settings are loaded from DB
    useEffect(() => {
        setStudioName(settings.studioName);
        setSelectedCurrency(settings.currency);
    }, [settings]);


    const handleSave = () => {
        updateSettings({
            currency: selectedCurrency,
            studioName: studioName,
            lang: settings.lang,
            theme: settings.theme,
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <div className="settings-page">
            <header className="settings-header">
                <h1 className="settings-title">{t.title}</h1>
                <p className="settings-subtitle">{t.subtitle}</p>
            </header>

            <div className="settings-container">
                <aside className="settings-tabs">
                    <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <User size={18} /> <span>{t.profile}</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'studio' ? 'active' : ''}`} onClick={() => setActiveTab('studio')}>
                        <Store size={18} /> <span>{t.studio}</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
                        <Globe size={18} /> <span>{t.system}</span>
                    </button>
                </aside>

                <main className="settings-content">
                    <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="settings-card">

                        {activeTab === 'profile' && (
                            <div className="settings-section">
                                <div className="section-header"><User size={20} /> <h3>{t.profile}</h3></div>
                                <div className="form-grid">
                                    <div className="form-group"><label>{t.adminName}</label>
                                        <input value={adminName} onChange={e => setAdminName(e.target.value)} />
                                    </div>
                                    <div className="form-group"><label>{t.phone}</label>
                                        <div className="input-wrap"><Smartphone size={16} /><input defaultValue="+966 50 000 0000" /></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'studio' && (
                            <div className="settings-section">
                                <div className="section-header"><Store size={20} /> <h3>{t.studio}</h3></div>
                                <div className="form-grid">
                                    <div className="form-group full"><label>{t.studioName}</label>
                                        <div className="input-wrap"><Camera size={16} />
                                            <input value={studioName} onChange={e => setStudioName(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-group"><label>{t.studioEmail}</label>
                                        <div className="input-wrap"><Mail size={16} /><input value={email} onChange={e => setEmail(e.target.value)} /></div>
                                    </div>
                                    <div className="form-group"><label>{t.studioAddress}</label>
                                        <div className="input-wrap"><MapPin size={16} /><input defaultValue="Riyadh, Saudi Arabia" /></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="settings-section">
                                <div className="section-header"><DollarSign size={20} /> <h3>{t.system}</h3></div>
                                <div className="form-grid">
                                    <div className="form-group full">
                                        <label>{t.currency}</label>
                                        <p className="field-hint">{t.currencyHint}</p>
                                        <div className="currency-selector">
                                            {currencies.map(curr => (
                                                <button key={curr.code} className={`currency-opt ${selectedCurrency === curr.code ? 'selected' : ''}`} onClick={() => setSelectedCurrency(curr.code)}>
                                                    <span className="curr-sym">{curr.symbol}</span>
                                                    <span className="curr-name">{curr.label[lang]} ({curr.code})</span>
                                                    {selectedCurrency === curr.code && <CheckCircle size={16} className="check" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="form-group half"><label>{t.language}</label>
                                        <div className="input-wrap"><Globe size={16} />
                                            <select value={settings.lang} onChange={e => updateSettings({ lang: e.target.value as 'ar' | 'en' })}>
                                                <option value="ar">العربية (Arabic)</option>
                                                <option value="en">English</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group half"><label>{t.theme}</label>
                                        <div className="theme-toggle-simple">
                                            <button className={`theme-opt ${settings.theme === 'light' ? 'active' : ''}`} onClick={() => updateSettings({ theme: 'light' })}>
                                                <Sun size={14} /> <span>{t.light}</span>
                                            </button>
                                            <button className={`theme-opt ${settings.theme === 'dark' ? 'active' : ''}`} onClick={() => updateSettings({ theme: 'dark' })}>
                                                <Moon size={14} /> <span>{t.dark}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="settings-footer">
                            <button className="save-settings-btn" onClick={handleSave}><Save size={18} /> {t.save}</button>
                        </div>
                    </motion.div>
                </main>
            </div>

            {showToast && (
                <motion.div className="settings-toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <CheckCircle size={18} /> <span>{t.success}</span>
                </motion.div>
            )}
        </div>
    );
};

export default SettingsPage;
