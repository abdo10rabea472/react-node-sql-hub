import { useState, useEffect, lazy, Suspense, memo, useCallback } from 'react';
import { LayoutDashboard, Users, Bell, Settings, LogOut, Search, Sun, Moon, Menu, X, ShoppingCart, Globe, Camera, UserCog, Heart, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { useSettings } from './SettingsContext';
import type { User } from './App';

// Lazy load ALL pages
const AdvancedDashboard = lazy(() => import('./AdvancedDashboard'));
const CustomersPage = lazy(() => import('./CustomersPage'));
const StudioPage = lazy(() => import('./StudioPage'));
const WeddingPage = lazy(() => import('./WeddingPage'));
const PurchasesPage = lazy(() => import('./PurchasesPage'));
const MyReportsPage = lazy(() => import('./MyReportsPage'));
const UsersPage = lazy(() => import('./UsersPage'));
const SettingsPage = lazy(() => import('./SettingsPage'));
const AccountDetailsPage = lazy(() => import('./AccountDetailsPage'));

interface DashboardProps { user: User; onLogout: () => void; }

const translations = {
  ar: { dashboard: "لوحة التحكم", users: "الموظفين", settings: "الإعدادات", logout: "تسجيل خروج", welcome: "مرحباً بك، استوديو", stats: "نظرة عامة على الأداء والإحصائيات المتقدمة", search: "ابحث هنا...", studio: "الاستوديو", wedding: "الزفاف", customers: "العملاء", purchases: "المشتريات", reports: "التقارير" },
  en: { dashboard: "Dashboard", users: "Employees", settings: "Settings", logout: "Sign Out", welcome: "Welcome back, Studio", stats: "Here's what's happening with your projects today", search: "Search anything...", studio: "Studio", wedding: "Wedding", customers: "Customers", purchases: "Purchases", reports: "Reports" },
};

const navItems = [
  { icon: LayoutDashboard, key: 'dashboard' as const },
  { icon: Users, key: 'customers' as const },
  { icon: Camera, key: 'studio' as const },
  { icon: Heart, key: 'wedding' as const },
  { icon: ShoppingCart, key: 'purchases' as const },
  { icon: ClipboardList, key: 'reports' as const },
  { icon: UserCog, key: 'users' as const },
  { icon: Settings, key: 'settings' as const },
];

const PageLoader = memo(() => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
));

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { settings, updateSettings } = useSettings();
  const lang = settings.lang; const theme = settings.theme;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const t = translations[lang];

  useEffect(() => { document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const toggleLang = useCallback(() => updateSettings({ lang: settings.lang === 'ar' ? 'en' : 'ar' }), [settings.lang, updateSettings]);
  const toggleTheme = useCallback(() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }), [settings.theme, updateSettings]);

  const sidebarWidth = isSidebarCollapsed ? 'w-[72px]' : 'w-[260px]';
  const mainMargin = isSidebarCollapsed ? 'lg:ms-[72px]' : 'lg:ms-[260px]';

  const renderContent = () => {
    const fallback = <PageLoader />;
    switch (activeNav) {
      case 1: return <Suspense fallback={fallback}><CustomersPage /></Suspense>;
      case 2: return <Suspense fallback={fallback}><StudioPage user={user} /></Suspense>;
      case 3: return <Suspense fallback={fallback}><WeddingPage user={user} /></Suspense>;
      case 4: return <Suspense fallback={fallback}><PurchasesPage user={user} /></Suspense>;
      case 5: return <Suspense fallback={fallback}><MyReportsPage userId={user.id} /></Suspense>;
      case 6: return <Suspense fallback={fallback}><UsersPage /></Suspense>;
      case 7: return <Suspense fallback={fallback}><SettingsPage /></Suspense>;
      case 8: return <Suspense fallback={fallback}><AccountDetailsPage user={user} onUpdate={() => {}} /></Suspense>;
      default: return <Suspense fallback={fallback}><AdvancedDashboard userName={user.name} userId={user.id} /></Suspense>;
    }
  };

  return (
    <div className="flex min-h-screen">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${sidebarWidth} h-screen fixed top-0 start-0 z-[999] bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 overflow-y-auto overflow-x-hidden ${isSidebarOpen ? 'translate-x-0' : 'max-lg:-translate-x-full rtl:max-lg:translate-x-full'}`}>
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-5'} h-16 border-b border-white/10 shrink-0`}>
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary/30 shrink-0">
            {settings.studioName.charAt(0)}
          </div>
          {!isSidebarCollapsed && <span className="text-base font-extrabold tracking-tight text-white truncate">{settings.studioName.split(' ')[0]}</span>}
          <button className="lg:hidden ms-auto text-sidebar-foreground/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>

        <nav className="flex-1 py-3 px-2.5">
          <ul className="space-y-0.5">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeNav === idx;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => { setActiveNav(idx); setSidebarOpen(false); }}
                    title={isSidebarCollapsed ? t[item.key] : undefined}
                    className={`flex items-center gap-3 w-full ${isSidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 rounded-xl text-sm font-medium transition-all text-start group relative ${isActive ? 'bg-primary/15 text-white font-semibold' : 'text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${isActive ? 'bg-gradient-to-br from-primary to-primary/70 text-white shadow-md shadow-primary/30' : 'group-hover:text-sidebar-foreground'}`}>
                      <Icon size={18} />
                    </div>
                    {!isSidebarCollapsed && <span className="truncate">{t[item.key]}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden lg:flex justify-center py-2 border-t border-white/10">
          <button onClick={() => setSidebarCollapsed(!isSidebarCollapsed)} className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground/50 hover:text-white hover:bg-white/10 transition-all">
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className={`border-t border-white/10 ${isSidebarCollapsed ? 'p-2' : 'p-4'} space-y-2 shrink-0`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-1'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs shrink-0">{user.name.charAt(0).toUpperCase()}</div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/50">{user.role === 'admin' ? (lang === 'ar' ? 'مدير النظام' : 'Admin') : user.role}</p>
              </div>
            )}
          </div>
          <button onClick={onLogout} title={isSidebarCollapsed ? t.logout : undefined} className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-all">
            <LogOut size={16} />
            {!isSidebarCollapsed && t.logout}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${mainMargin} min-h-screen flex flex-col w-full overflow-x-hidden transition-all duration-200`}>
        <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-5 lg:px-7 sticky top-0 z-[900]">
          <div className="flex items-center gap-3">
            <button className="lg:hidden w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted transition-all" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="hidden sm:flex items-center gap-2.5 bg-muted border border-transparent rounded-xl px-3.5 h-10 w-[280px] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <Search size={17} className="text-muted-foreground" /><input type="text" placeholder={t.search} className="flex-1 bg-transparent border-none outline-none text-sm text-foreground font-cairo placeholder:text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={toggleLang} className="h-9 px-3 rounded-xl border border-border bg-card text-muted-foreground text-xs font-bold hover:bg-muted hover:text-foreground transition-all flex items-center gap-1.5"><Globe size={16} /><span className="hidden sm:inline">{lang === 'ar' ? 'EN' : 'AR'}</span></button>
            <button onClick={toggleTheme} className="h-9 w-9 rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center justify-center">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button onClick={() => setNotificationsOpen(true)} className="h-9 w-9 rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center justify-center relative"><Bell size={17} /><span className="absolute top-1.5 end-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card" /></button>
            <div onClick={() => setActiveNav(8)} className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs ms-1 cursor-pointer hover:scale-105 transition-transform shadow-md shadow-primary/20">{user.name.charAt(0).toUpperCase()}</div>
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
