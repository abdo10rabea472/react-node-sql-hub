import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Bell, Settings, LogOut, Search, Sun, Moon, Menu, X, ShoppingCart, Globe, Camera, FileText, UserCog, Heart, Sparkles, ClipboardList, Aperture } from 'lucide-react';
import UsersPage from './UsersPage';
import PricingPage from './PricingPage';
import SettingsPage from './SettingsPage';
import CustomersPage from './CustomersPage';
import InvoicesPage from './InvoicesPage';
import WeddingPricingPage from './WeddingPricingPage';
import WeddingInvoicesPage from './WeddingInvoicesPage';
import PurchasesPage from './PurchasesPage';
import AccountDetailsPage from './AccountDetailsPage';
import NotificationCenter from './NotificationCenter';
import MyReportsPage from './MyReportsPage';
const AdvancedDashboard = lazy(() => import('./AdvancedDashboard'));
import { useSettings } from './SettingsContext';
import type { User } from './App';

interface DashboardProps { user: User; onLogout: () => void; }

const translations = {
  ar: { dashboard: "لوحة التحكم", users: "المستخدمين", settings: "الإعدادات", logout: "تسجيل خروج", welcome: "مرحباً بك، استوديو", stats: "نظرة عامة على الأداء والإحصائيات المتقدمة", activeUsers: "المستخدمين النشطين", totalOrders: "الطلبات المكتملة", revenue: "إجمالي الأرباح", conversion: "معدل التحويل", theme: "المظهر", language: "اللغة", search: "ابحث هنا...", recentActivity: "النشاط الأخير", viewAll: "عرض الكل", weekly: "أسبوعي", monthly: "شهري", yearly: "سنوي", salesOverview: "نظرة عامة على المبيعات", visitors: "الزوار", sales: "المبيعات", pricing: "اسعار الصاله", customers: "العملاء", invoices: "الفواتير", weddingPricing: "أسعار الزفاف", weddingInvoices: "فواتير الزفاف", purchases: "المشتريات", reports: "التقارير" },
  en: { dashboard: "Dashboard", users: "Users", settings: "Settings", logout: "Sign Out", welcome: "Welcome back, Studio", stats: "Here's what's happening with your projects today", activeUsers: "Active Users", totalOrders: "Total Orders", revenue: "Revenue", conversion: "Conversion Rate", theme: "Theme", language: "Language", search: "Search anything...", recentActivity: "Recent Activity", viewAll: "View All", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly", salesOverview: "Sales Overview", visitors: "Visitors", sales: "Sales", pricing: "Pricing", customers: "Customers", invoices: "Invoices", weddingPricing: "Wedding Pricing", weddingInvoices: "Wedding Invoices", purchases: "Purchases", reports: "Reports" },
};

const navItems = [
  { icon: LayoutDashboard, key: 'dashboard' as const },
  { icon: Users, key: 'customers' as const },
  { icon: FileText, key: 'invoices' as const },
  { icon: Camera, key: 'pricing' as const },
  { icon: Sparkles, key: 'weddingPricing' as const },
  { icon: Heart, key: 'weddingInvoices' as const },
  { icon: ShoppingCart, key: 'purchases' as const },
  { icon: ClipboardList, key: 'reports' as const },
  { icon: UserCog, key: 'users' as const },
  { icon: Settings, key: 'settings' as const },
];

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { settings, updateSettings } = useSettings();
  const lang = settings.lang; const theme = settings.theme;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const t = translations[lang];

  useEffect(() => { document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const toggleLang = () => updateSettings({ lang: settings.lang === 'ar' ? 'en' : 'ar' });
  const toggleTheme = () => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });

  const renderContent = () => {
    if (activeNav === 1) return <CustomersPage />;
    if (activeNav === 2) return <InvoicesPage user={user} />;
    if (activeNav === 3) return <PricingPage />;
    if (activeNav === 4) return <WeddingPricingPage />;
    if (activeNav === 5) return <WeddingInvoicesPage user={user} />;
    if (activeNav === 6) return <PurchasesPage user={user} />;
    if (activeNav === 7) return <MyReportsPage userId={user.id} />;
    if (activeNav === 8) return <UsersPage />;
    if (activeNav === 9) return <SettingsPage />;
    if (activeNav === 10) return <AccountDetailsPage user={user} onUpdate={() => {}} />;

    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-[300px]"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
        <AdvancedDashboard userName={user.name} userId={user.id} />
      </Suspense>
    );
  };

  return (
    <div className="flex min-h-screen">
      <AnimatePresence>{isSidebarOpen && <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} />}</AnimatePresence>

      {/* Sidebar */}
      <aside className={`w-[260px] h-screen fixed top-0 start-0 z-[999] bg-sidebar text-sidebar-foreground flex flex-col p-5 transition-transform duration-300 overflow-y-auto ${isSidebarOpen ? 'translate-x-0' : 'max-lg:-translate-x-full rtl:max-lg:translate-x-full'}`}>
        <div className="flex items-center gap-3 px-2.5 mb-7">
          <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-cyan-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/30"><Aperture size={20} /></div>
          <span className="text-lg font-extrabold tracking-tight text-white">{settings.studioName.split(' ')[0]}</span>
          <button className="lg:hidden ms-auto text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>

        <nav className="flex-1">
          <ul className="space-y-0.5">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <button onClick={() => { setActiveNav(idx); setSidebarOpen(false); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-start ${activeNav === idx ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeNav === idx ? 'bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-md shadow-sky-500/25' : ''}`}><Icon size={18} /></div>
                    <span>{t[item.key]}</span>
                    {idx === 2 && <span className="ms-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10 space-y-2.5">
          <div className="flex items-center gap-3 px-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shrink-0">{user.name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{user.name}</p><p className="text-xs text-slate-400">{user.role === 'admin' ? (lang === 'ar' ? 'مدير النظام' : 'Admin') : user.role}</p></div>
          </div>
          <button onClick={onLogout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-all"><LogOut size={16} />{t.logout}</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ms-[260px] min-h-screen flex flex-col w-full overflow-x-hidden">
        <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-5 lg:px-7 sticky top-0 z-[900]">
          <div className="flex items-center gap-3">
            <button className="lg:hidden w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted transition-all" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="hidden sm:flex items-center gap-2.5 bg-muted border border-transparent rounded-lg px-3.5 h-10 w-[280px] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <Search size={17} className="text-muted-foreground" /><input type="text" placeholder={t.search} className="flex-1 bg-transparent border-none outline-none text-sm text-foreground font-cairo placeholder:text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={toggleLang} className="h-9 px-3 rounded-lg border border-border bg-card text-muted-foreground text-xs font-bold hover:bg-muted hover:text-foreground transition-all flex items-center gap-1.5"><Globe size={16} /><span className="hidden sm:inline">{lang === 'ar' ? 'EN' : 'AR'}</span></button>
            <button onClick={toggleTheme} className="h-9 w-9 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center justify-center">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button onClick={() => setNotificationsOpen(true)} className="h-9 w-9 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center justify-center relative"><Bell size={17} /><span className="absolute top-1.5 end-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card" /></button>
            <div onClick={() => setActiveNav(9)} className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs ms-1 cursor-pointer hover:scale-105 transition-transform shadow-md shadow-sky-500/20">{user.name.charAt(0).toUpperCase()}</div>
            <NotificationCenter isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
          </div>
        </header>

        <div className="flex-1 p-3 sm:p-5 lg:p-7 max-w-[1400px] w-full mx-auto overflow-x-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;