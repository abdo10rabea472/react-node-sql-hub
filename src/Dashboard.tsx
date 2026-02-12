import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Bell, Settings, LogOut, Search, Sun, Moon, Menu, X, TrendingUp, ShoppingCart, DollarSign, UserPlus, ArrowUpRight, ArrowDownRight, MoreHorizontal, Eye, ChevronRight, Aperture, Globe, Loader, Camera, FileText, UserCog, Heart, Sparkles } from 'lucide-react';
import { getStats } from './api';
import UsersPage from './UsersPage';
import PricingPage from './PricingPage';
import SettingsPage from './SettingsPage';
import CustomersPage from './CustomersPage';
import InvoicesPage from './InvoicesPage';
import WeddingPricingPage from './WeddingPricingPage';
import WeddingInvoicesPage from './WeddingInvoicesPage';
import { useSettings } from './SettingsContext';
import type { User } from './App';

interface DashboardProps { user: User; onLogout: () => void; }

const translations = {
  ar: { dashboard: "لوحة التحكم", users: "المستخدمين", settings: "الإعدادات", logout: "تسجيل خروج", welcome: "مرحباً بك، استوديو", stats: "نظرة عامة على الأداء والإحصائيات المتقدمة", activeUsers: "المستخدمين النشطين", totalOrders: "الطلبات المكتملة", revenue: "إجمالي الأرباح", conversion: "معدل التحويل", theme: "المظهر", language: "اللغة", search: "ابحث هنا...", recentActivity: "النشاط الأخير", viewAll: "عرض الكل", weekly: "أسبوعي", monthly: "شهري", yearly: "سنوي", salesOverview: "نظرة عامة على المبيعات", visitors: "الزوار", sales: "المبيعات", pricing: "اسعار الصاله", customers: "العملاء", invoices: "الفواتير", weddingPricing: "أسعار الزفاف", weddingInvoices: "فواتير الزفاف" },
  en: { dashboard: "Dashboard", users: "Users", settings: "Settings", logout: "Sign Out", welcome: "Welcome back, Studio", stats: "Here's what's happening with your projects today", activeUsers: "Active Users", totalOrders: "Total Orders", revenue: "Revenue", conversion: "Conversion Rate", theme: "Theme", language: "Language", search: "Search anything...", recentActivity: "Recent Activity", viewAll: "View All", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly", salesOverview: "Sales Overview", visitors: "Visitors", sales: "Sales", pricing: "Pricing", customers: "Customers", invoices: "Invoices", weddingPricing: "Wedding Pricing", weddingInvoices: "Wedding Invoices" },
};

const navItems = [
  { icon: LayoutDashboard, key: 'dashboard' as const },
  { icon: Users, key: 'customers' as const },
  { icon: FileText, key: 'invoices' as const },
  { icon: Camera, key: 'pricing' as const },
  { icon: Sparkles, key: 'weddingPricing' as const },
  { icon: Heart, key: 'weddingInvoices' as const },
  { icon: UserCog, key: 'users' as const },
  { icon: Settings, key: 'settings' as const },
];

const MiniChart = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1;
  const w = 120; const h = 40;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="shrink-0 opacity-90">
      <defs><linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#grad-${color})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const BarChartVisual = ({ lang }: { lang: 'ar' | 'en' }) => {
  const days = lang === 'ar' ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'] : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const values = [65, 45, 80, 55, 90, 70, 85]; const values2 = [40, 30, 55, 35, 60, 50, 65]; const max = 100;
  return (
    <div className="flex items-end justify-between gap-3 h-[200px] px-2">
      {days.map((day, i) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-2.5 h-full">
          <div className="flex gap-1 items-end flex-1 w-full">
            <motion.div className="flex-1 rounded-t-md bg-gradient-to-t from-sky-600 to-sky-500" initial={{ height: 0 }} animate={{ height: `${(values[i] / max) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.6 }} style={{ minHeight: 4 }} />
            <motion.div className="flex-1 rounded-t-md bg-sky-200 dark:bg-sky-500/20" initial={{ height: 0 }} animate={{ height: `${(values2[i] / max) * 100}%` }} transition={{ delay: i * 0.1 + 0.05, duration: 0.6 }} style={{ minHeight: 4 }} />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{day}</span>
        </div>
      ))}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { settings, updateSettings } = useSettings();
  const lang = settings.lang; const theme = settings.theme;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(0);
  const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const t = translations[lang];

  useEffect(() => { document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { if (activeNav === 0) { setStatsLoading(true); getStats().then(res => setStats(res.data)).catch(() => {}).finally(() => setStatsLoading(false)); } }, [activeNav]);

  const toggleLang = () => updateSettings({ lang: settings.lang === 'ar' ? 'en' : 'ar' });
  const toggleTheme = () => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });

  const statCards = useMemo(() => [
    { icon: Users, title: t.activeUsers, value: stats ? stats.totalUsers.toLocaleString() : '...', change: `${stats?.activeUsers || 0} ${lang === 'ar' ? 'نشط' : 'active'}`, positive: true, color: '#0ea5e9', data: [30, 40, 35, 50, 49, 60, 70, 91, 85, stats?.totalUsers || 95] },
    { icon: ShoppingCart, title: t.totalOrders, value: stats ? stats.activeUsers.toLocaleString() : '...', change: `+${stats?.admins || 0} ${lang === 'ar' ? 'مدير' : 'admins'}`, positive: true, color: '#10b981', data: [20, 25, 30, 28, 35, 40, 38, 42, 45, stats?.activeUsers || 50] },
    { icon: DollarSign, title: t.revenue, value: stats ? stats.editors.toLocaleString() : '...', change: lang === 'ar' ? 'محررين' : 'editors', positive: true, color: '#f59e0b', data: [45, 52, 49, 55, 60, 58, 65, 70, 68, stats?.editors || 5] },
    { icon: TrendingUp, title: t.conversion, value: stats ? stats.bannedUsers.toLocaleString() : '...', change: `${stats?.inactiveUsers || 0} ${lang === 'ar' ? 'غير نشط' : 'inactive'}`, positive: (stats?.bannedUsers || 0) === 0, color: '#ef4444', data: [5, 4, 5, 4, 4, 3, 4, 3, 2, stats?.bannedUsers || 0] },
  ], [stats, lang, t]);

  const activities = useMemo(() => stats?.recentUsers?.map((u: any) => ({
    icon: UserPlus, text: u.name,
    time: new Date(u.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    color: u.role === 'admin' ? '#ef4444' : u.role === 'editor' ? '#f59e0b' : '#0ea5e9',
  })) || [], [stats, lang]);

  const renderContent = () => {
    if (activeNav === 1) return <CustomersPage />;
    if (activeNav === 2) return <InvoicesPage user={user} />;
    if (activeNav === 3) return <PricingPage />;
    if (activeNav === 4) return <WeddingPricingPage />;
    if (activeNav === 5) return <WeddingInvoicesPage user={user} />;
    if (activeNav === 6) return <UsersPage />;
    if (activeNav === 7) return <SettingsPage />;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="dashboard">
        <div className="mb-5 sm:mb-7">
          <h1 className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight">{lang === 'ar' ? `مرحباً، ${user.name}` : `Welcome, ${user.name}`} <span className="inline-block animate-bounce">👋</span></h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.stats}</p>
        </div>

        <AnimatePresence mode="wait">
          {statsLoading ? (
            <div className="flex items-center justify-center min-h-[120px]"><Loader size={24} className="animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {statCards.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                    className="bg-card border border-border rounded-xl p-3 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, ${stat.color}, ${stat.color}88)` }} />
                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15`, color: stat.color }}><Icon size={18} /></div>
                      <button className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all hidden sm:block"><MoreHorizontal size={16} /></button>
                    </div>
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 sm:mb-1.5 truncate">{stat.title}</p>
                    <div className="flex items-end justify-between gap-2 sm:gap-3 mb-1.5 sm:mb-2.5">
                      <h3 className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight leading-none">{stat.value}</h3>
                      <div className="hidden sm:block"><MiniChart data={stat.data} color={stat.color} /></div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${stat.positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {stat.positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{stat.change}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-4 sm:gap-5 mb-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div><h3 className="font-bold text-foreground text-sm">{t.salesOverview}</h3><p className="text-xs text-muted-foreground mt-0.5">{lang === 'ar' ? 'مقارنة المبيعات والزوار' : 'Sales vs Visitors comparison'}</p></div>
              <div className="flex gap-0.5 bg-muted p-0.5 rounded-lg">
                {(['weekly', 'monthly', 'yearly'] as const).map(p => <button key={p} onClick={() => setChartPeriod(p)} className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${chartPeriod === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t[p]}</button>)}
              </div>
            </div>
            <div className="flex gap-5 mb-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" />{t.sales}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium"><span className="w-2.5 h-2.5 rounded-full bg-sky-200" />{t.visitors}</div>
            </div>
            <BarChartVisual lang={lang} />
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-foreground text-sm">{t.recentActivity}</h3>
              <button className="flex items-center gap-1 text-primary text-xs font-semibold hover:bg-primary/5 px-2 py-1 rounded-lg transition-all">{t.viewAll}<ChevronRight size={14} /></button>
            </div>
            <div className="space-y-1">
              {activities.map((act: any, idx: number) => {
                const Icon = act.icon;
                return (
                  <motion.div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-all group" initial={{ opacity: 0, x: lang === 'ar' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + idx * 0.1 }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${act.color}15`, color: act.color }}><Icon size={18} /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground truncate">{act.text}</p><p className="text-xs text-muted-foreground">{act.time}</p></div>
                    <button className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted p-1.5 rounded-lg transition-all"><Eye size={15} /></button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {stats?.recentUsers && stats.recentUsers.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex justify-between items-start mb-5">
              <div><h3 className="font-bold text-foreground text-sm">{lang === 'ar' ? 'أحدث المستخدمين' : 'Recent Users'}</h3><p className="text-xs text-muted-foreground mt-0.5">{lang === 'ar' ? 'آخر المستخدمين المسجلين في النظام' : 'Latest registered users'}</p></div>
              <button onClick={() => setActiveNav(1)} className="flex items-center gap-1 text-primary text-xs font-semibold hover:bg-primary/5 px-2 py-1 rounded-lg transition-all">{t.viewAll}<ChevronRight size={14} /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">{[lang === 'ar' ? 'الاسم' : 'Name', lang === 'ar' ? 'البريد' : 'Email', lang === 'ar' ? 'الدور' : 'Role', lang === 'ar' ? 'الحالة' : 'Status'].map(h => <th key={h} className="px-4 py-2.5 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody>
                  {stats.recentUsers.map((u: any, idx: number) => (
                    <motion.tr key={u.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + idx * 0.08 }}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${u.role === 'admin' ? '#ef4444' : u.role === 'editor' ? '#f59e0b' : '#0ea5e9'}15` }}><UserPlus size={15} style={{ color: u.role === 'admin' ? '#ef4444' : u.role === 'editor' ? '#f59e0b' : '#0ea5e9' }} /></div><span className="text-sm font-medium">{u.name}</span></div></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums" dir="ltr">{u.email}</td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-success/10 text-success'}`}>{u.role === 'admin' ? (lang === 'ar' ? 'مدير' : 'Admin') : u.role === 'editor' ? (lang === 'ar' ? 'محرر' : 'Editor') : (lang === 'ar' ? 'مستخدم' : 'User')}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${u.status === 'active' ? 'bg-success/10 text-success' : 'bg-red-500/10 text-red-500'}`}>{u.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}</span></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
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
            <button className="h-9 w-9 rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-all flex items-center justify-center relative"><Bell size={17} /><span className="absolute top-1.5 end-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-card" /></button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs ms-1 cursor-pointer hover:scale-105 transition-transform shadow-md shadow-sky-500/20">{user.name.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="flex-1 p-3 sm:p-5 lg:p-7 max-w-[1400px] w-full mx-auto overflow-x-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};