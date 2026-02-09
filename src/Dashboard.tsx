import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
    LayoutDashboard, Users, Bell, BarChart3, Settings, LogOut,
    Search, Sun, Moon, Menu, X, TrendingUp, ShoppingCart,
    DollarSign, UserPlus, ArrowUpRight,
    ArrowDownRight, MoreHorizontal, Eye, ChevronRight,
    Zap, Globe, Loader, Camera, FileText, UserCog
} from 'lucide-react';

import { getStats } from './api';
import UsersPage from './UsersPage';
import PricingPage from './PricingPage';
import SettingsPage from './SettingsPage';
import CustomersPage from './CustomersPage';
import InvoicesPage from './InvoicesPage';

import { useSettings } from './SettingsContext';
import type { User } from './App';


import './Dashboard.css';


interface DashboardProps {
    user: User;
    onLogout: () => void;
}

const translations = {
    ar: {
        dashboard: "لوحة التحكم",
        users: "المستخدمين",
        settings: "الإعدادات",
        logout: "تسجيل خروج",
        welcome: "مرحباً بك، استوديو",
        stats: "نظرة عامة على الأداء والإحصائيات المتقدمة",
        activeUsers: "المستخدمين النشطين",
        totalOrders: "الطلبات المكتملة",
        revenue: "إجمالي الأرباح",
        conversion: "معدل التحويل",
        theme: "المظهر",
        language: "اللغة",
        search: "ابحث هنا...",
        analytics: "تحليلات البيانات",
        recentActivity: "النشاط الأخير",
        notifications: "التنبيهات",
        viewAll: "عرض الكل",
        viewReport: "عرض التقرير",
        topProducts: "أفضل المنتجات",
        newUser: "مستخدم جديد مسجل",
        orderComplete: "طلب مكتمل",
        paymentReceived: "دفعة مستلمة",
        newReview: "تقييم جديد",
        minutesAgo: "دقائق مضت",
        hoursAgo: "ساعات مضت",
        weekly: "أسبوعي",
        monthly: "شهري",
        yearly: "سنوي",
        salesOverview: "نظرة عامة على المبيعات",
        visitors: "الزوار",
        orders: "الطلبات",
        sales: "المبيعات",
        product: "المنتج",
        sold: "مباع",
        revenue2: "الإيرادات",
        growth: "النمو",
        pricing: "اسعار الصاله",
        customers: "العملاء",
        invoices: "الفواتير"
    },

    en: {
        dashboard: "Dashboard",
        users: "Users",
        settings: "Settings",
        logout: "Sign Out",
        welcome: "Welcome back, Studio",
        stats: "Here's what's happening with your projects today",
        activeUsers: "Active Users",
        totalOrders: "Total Orders",
        revenue: "Revenue",
        conversion: "Conversion Rate",
        theme: "Theme",
        language: "Language",
        search: "Search anything...",
        analytics: "Analytics",
        recentActivity: "Recent Activity",
        notifications: "Notifications",
        viewAll: "View All",
        viewReport: "View Report",
        topProducts: "Top Products",
        newUser: "New User Registered",
        orderComplete: "Order Completed",
        paymentReceived: "Payment Received",
        newReview: "New Review",
        minutesAgo: "minutes ago",
        hoursAgo: "hours ago",
        weekly: "Weekly",
        monthly: "Monthly",
        yearly: "Yearly",
        salesOverview: "Sales Overview",
        visitors: "Visitors",
        orders: "Orders",
        sales: "Sales",
        product: "Product",
        sold: "Sold",
        revenue2: "Revenue",
        growth: "Growth",
        pricing: "Pricing",
        customers: "Customers",
        invoices: "Invoices"
    }

};


const navItems = [
    { icon: LayoutDashboard, key: 'dashboard' as const },
    { icon: Users, key: 'customers' as const },
    { icon: FileText, key: 'invoices' as const },
    { icon: Camera, key: 'pricing' as const },
    { icon: UserCog, key: 'users' as const },
    { icon: Bell, key: 'notifications' as const },
    { icon: BarChart3, key: 'analytics' as const },
    { icon: Settings, key: 'settings' as const },
];


const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }
};

/* Mini sparkline chart component */
const MiniChart = ({ data, color }: { data: number[]; color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 120;
    const h = 40;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return (
        <svg width={w} height={h} className="mini-chart">
            <defs>
                <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon
                points={`0,${h} ${points} ${w},${h}`}
                fill={`url(#grad-${color})`}
            />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

/* Animated bar chart for analytics */
const BarChartVisual = ({ lang }: { lang: 'ar' | 'en' }) => {
    const days = lang === 'ar'
        ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
        : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const values = [65, 45, 80, 55, 90, 70, 85];
    const values2 = [40, 30, 55, 35, 60, 50, 65];
    const max = 100;

    return (
        <div className="bar-chart">
            {days.map((day, i) => (
                <div key={day} className="bar-group">
                    <div className="bars-wrapper">
                        <motion.div
                            className="bar bar-primary"
                            initial={{ height: 0 }}
                            animate={{ height: `${(values[i] / max) * 100}%` }}
                            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                        <motion.div
                            className="bar bar-secondary"
                            initial={{ height: 0 }}
                            animate={{ height: `${(values2[i] / max) * 100}%` }}
                            transition={{ delay: i * 0.1 + 0.05, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                    </div>
                    <span className="bar-label">{day}</span>
                </div>
            ))}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    const { settings, updateSettings } = useSettings();
    const lang = settings.lang;
    const theme = settings.theme;

    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeNav, setActiveNav] = useState(0);
    const [chartPeriod, setChartPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');


    // Real data from API
    const [stats, setStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const t = translations[lang];

    useEffect(() => {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
    }, [lang]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Fetch stats from API
    useEffect(() => {
        if (activeNav === 0) {
            setStatsLoading(true);
            getStats()
                .then(res => setStats(res.data))
                .catch(() => { })
                .finally(() => setStatsLoading(false));
        }
    }, [activeNav]);

    const toggleLang = () => updateSettings({ lang: settings.lang === 'ar' ? 'en' : 'ar' });
    const toggleTheme = () => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });


    const statCards = useMemo(() => [
        {
            icon: Users, title: t.activeUsers, value: stats ? stats.totalUsers.toLocaleString() : '...',
            change: `${stats?.activeUsers || 0} ${lang === 'ar' ? 'نشط' : 'active'}`, positive: true, color: '#6366f1',
            data: [30, 40, 35, 50, 49, 60, 70, 91, 85, stats?.totalUsers || 95]
        },
        {
            icon: ShoppingCart, title: t.totalOrders, value: stats ? stats.activeUsers.toLocaleString() : '...',
            change: `+${stats?.admins || 0} ${lang === 'ar' ? 'مدير' : 'admins'}`, positive: true, color: '#10b981',
            data: [20, 25, 30, 28, 35, 40, 38, 42, 45, stats?.activeUsers || 50]
        },
        {
            icon: DollarSign, title: t.revenue, value: stats ? stats.editors.toLocaleString() : '...',
            change: lang === 'ar' ? 'محررين' : 'editors', positive: true, color: '#f59e0b',
            data: [45, 52, 49, 55, 60, 58, 65, 70, 68, stats?.editors || 5]
        },
        {
            icon: TrendingUp, title: t.conversion, value: stats ? stats.bannedUsers.toLocaleString() : '...',
            change: `${stats?.inactiveUsers || 0} ${lang === 'ar' ? 'غير نشط' : 'inactive'}`, positive: (stats?.bannedUsers || 0) === 0, color: '#ef4444',
            data: [5, 4, 5, 4, 4, 3, 4, 3, 2, stats?.bannedUsers || 0]
        },
    ], [stats, lang, t]);


    // Recent activities from real data
    const activities = useMemo(() => stats?.recentUsers?.map((u: any) => ({
        icon: UserPlus,
        text: u.name,
        time: new Date(u.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        color: u.role === 'admin' ? '#ef4444' : u.role === 'editor' ? '#f59e0b' : '#6366f1',
    })) || [], [stats, lang]);


    return (
        <div className="dash-layout">
            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        className="sidebar-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`dash-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="dash-logo-section">
                    <div className="dash-logo-icon">
                        <Zap size={22} />
                    </div>
                    <span className="dash-logo-text">{settings.studioName.split(' ')[0]}</span>

                    <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="dash-nav">
                    <ul className="dash-nav-links">
                        {navItems.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.key}>
                                    <button
                                        className={`dash-nav-item ${activeNav === idx ? 'active' : ''}`}
                                        onClick={() => { setActiveNav(idx); setSidebarOpen(false); }}
                                    >
                                        <div className="nav-icon-wrap">
                                            <Icon size={20} />
                                        </div>
                                        <span>{t[item.key]}</span>
                                        {idx === 2 && (
                                            <span className="nav-badge">3</span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="dash-sidebar-footer">
                    <div className="dash-user-card">
                        <div className="dash-user-avatar">
                            <span>{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="dash-user-info">
                            <p className="dash-user-name">{user.name}</p>
                            <p className="dash-user-role">{user.role === 'admin' ? (lang === 'ar' ? 'مدير النظام' : 'Administrator') : user.role === 'editor' ? (lang === 'ar' ? 'محرر' : 'Editor') : (lang === 'ar' ? 'مستخدم' : 'User')}</p>
                        </div>
                    </div>
                    <button className="dash-logout-btn" onClick={onLogout}>
                        <LogOut size={18} />
                        <span>{t.logout}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dash-main">
                {/* Header */}
                <header className="dash-header">
                    <div className="dash-header-left">
                        <button className="dash-mobile-toggle" onClick={() => setSidebarOpen(true)}>
                            <Menu size={22} />
                        </button>
                        <div className="dash-search-box">
                            <Search size={18} className="search-icon" />
                            <input type="text" placeholder={t.search} />
                        </div>
                    </div>

                    <div className="dash-header-right">
                        <button className="dash-header-btn" onClick={toggleLang} title={t.language}>
                            <Globe size={18} />
                            <span className="btn-label">{lang === 'ar' ? 'EN' : 'AR'}</span>
                        </button>
                        <button className="dash-header-btn" onClick={toggleTheme} title={t.theme}>
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button className="dash-header-btn notification-btn">
                            <Bell size={18} />
                            <span className="notification-dot" />
                        </button>
                        <div className="dash-header-avatar">
                            <span>{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                {activeNav === 1 ? (
                    <div className="dash-content">
                        <CustomersPage />
                    </div>
                ) : activeNav === 2 ? (
                    <div className="dash-content">
                        <InvoicesPage user={user} />
                    </div>

                ) : activeNav === 3 ? (
                    <div className="dash-content">
                        <PricingPage />
                    </div>
                ) : activeNav === 4 ? (
                    <div className="dash-content">
                        <UsersPage />
                    </div>
                ) : activeNav === 7 ? (
                    <div className="dash-content">
                        <SettingsPage />
                    </div>
                ) : (



                    <motion.div
                        className="dash-content"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={activeNav}
                    >
                        {/* Welcome Section */}
                        <motion.div className="dash-welcome" variants={itemVariants}>
                            <div>
                                <h1 className="dash-welcome-title">
                                    {lang === 'ar' ? `مرحباً، ${user.name}` : `Welcome, ${user.name}`} <span className="wave">👋</span>
                                </h1>
                                <p className="dash-welcome-subtitle">{t.stats}</p>
                            </div>
                        </motion.div>

                        {/* Stat Cards */}
                        <AnimatePresence mode="wait">
                            {statsLoading ? (
                                <motion.div
                                    key="loader"
                                    className="dash-stats-loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <Loader size={24} className="spin" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="stats-grid"
                                    className="dash-stats-grid"
                                    initial="hidden"
                                    animate="visible"
                                    variants={containerVariants}
                                >
                                    {statCards.map((stat: any, idx: number) => {
                                        const Icon = stat.icon;
                                        return (
                                            <motion.div
                                                key={idx}
                                                className="dash-stat-card"
                                                variants={itemVariants}
                                                initial="hidden"
                                                animate="visible"
                                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                            >
                                                <div className="stat-card-header">
                                                    <div className="stat-icon-wrap" style={{ background: `${stat.color}15`, color: stat.color }}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <button className="stat-more-btn">
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </div>
                                                <div className="stat-card-body">
                                                    <p className="stat-card-title">{stat.title}</p>
                                                    <div className="stat-card-row">
                                                        <h3 className="stat-card-value">{stat.value}</h3>
                                                        <MiniChart data={stat.data} color={stat.color} />
                                                    </div>
                                                    <div className={`stat-card-change ${stat.positive ? 'positive' : 'negative'}`}>
                                                        {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                        <span>{stat.change}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>


                        {/* Main Grid */}
                        <div className="dash-main-grid">
                            {/* Analytics Chart */}
                            <motion.div className="dash-card dash-chart-card" variants={itemVariants}>
                                <div className="dash-card-header">
                                    <div>
                                        <h3 className="dash-card-title">{t.salesOverview}</h3>
                                        <p className="dash-card-subtitle">
                                            {lang === 'ar' ? 'مقارنة المبيعات والزوار' : 'Sales vs Visitors comparison'}
                                        </p>
                                    </div>
                                    <div className="chart-period-tabs">
                                        {(['weekly', 'monthly', 'yearly'] as const).map(period => (
                                            <button
                                                key={period}
                                                className={`period-tab ${chartPeriod === period ? 'active' : ''}`}
                                                onClick={() => setChartPeriod(period)}
                                            >
                                                {t[period]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="chart-legend">
                                    <div className="legend-item">
                                        <span className="legend-dot" style={{ background: '#6366f1' }} />
                                        <span>{t.sales}</span>
                                    </div>
                                    <div className="legend-item">
                                        <span className="legend-dot" style={{ background: '#a5b4fc' }} />
                                        <span>{t.visitors}</span>
                                    </div>
                                </div>
                                <BarChartVisual lang={lang} />
                            </motion.div>

                            {/* Recent Activity */}
                            <motion.div className="dash-card dash-activity-card" variants={itemVariants}>
                                <div className="dash-card-header">
                                    <h3 className="dash-card-title">{t.recentActivity}</h3>
                                    <button className="view-all-btn">
                                        {t.viewAll} <ChevronRight size={14} />
                                    </button>
                                </div>
                                <div className="activity-list">
                                    {activities.map((act: { icon: any; text: string; time: string; color: string }, idx: number) => {
                                        const Icon = act.icon;
                                        return (
                                            <motion.div
                                                key={idx}
                                                className="activity-item"
                                                initial={{ opacity: 0, x: lang === 'ar' ? 20 : -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.3 + idx * 0.1 }}
                                            >
                                                <div className="activity-icon" style={{ background: `${act.color}15`, color: act.color }}>
                                                    <Icon size={18} />
                                                </div>
                                                <div className="activity-info">
                                                    <p className="activity-text">{act.text}</p>
                                                    <p className="activity-time">{act.time}</p>
                                                </div>
                                                <button className="activity-action">
                                                    <Eye size={16} />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </div>

                        {/* Recent Users Table */}
                        {stats?.recentUsers && stats.recentUsers.length > 0 && (
                            <motion.div className="dash-card dash-table-card" variants={itemVariants}>
                                <div className="dash-card-header">
                                    <div>
                                        <h3 className="dash-card-title">{lang === 'ar' ? 'أحدث المستخدمين' : 'Recent Users'}</h3>
                                        <p className="dash-card-subtitle">
                                            {lang === 'ar' ? 'آخر المستخدمين المسجلين في النظام' : 'Latest registered users in the system'}
                                        </p>
                                    </div>
                                    <button className="view-all-btn" onClick={() => setActiveNav(1)}>
                                        {t.viewAll} <ChevronRight size={14} />
                                    </button>
                                </div>
                                <div className="dash-table-wrapper">
                                    <table className="dash-table">
                                        <thead>
                                            <tr>
                                                <th>{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                                                <th>{lang === 'ar' ? 'البريد' : 'Email'}</th>
                                                <th>{lang === 'ar' ? 'الدور' : 'Role'}</th>
                                                <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recentUsers.map((u: any, idx: number) => (
                                                <motion.tr
                                                    key={u.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.4 + idx * 0.08 }}
                                                >
                                                    <td>
                                                        <div className="product-cell">
                                                            <div className="product-thumb" style={{ background: `${u.role === 'admin' ? '#ef4444' : u.role === 'editor' ? '#f59e0b' : '#6366f1'}15` }}>
                                                                <UserPlus size={16} style={{ color: u.role === 'admin' ? '#ef4444' : u.role === 'editor' ? '#f59e0b' : '#6366f1' }} />
                                                            </div>
                                                            <span>{u.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="td-mono" style={{ direction: 'ltr', textAlign: 'start' }}>{u.email}</td>
                                                    <td>
                                                        <span className={`growth-badge ${u.role === 'admin' ? 'negative' : 'positive'}`}>
                                                            {u.role === 'admin' ? (lang === 'ar' ? 'مدير' : 'Admin') : u.role === 'editor' ? (lang === 'ar' ? 'محرر' : 'Editor') : (lang === 'ar' ? 'مستخدم' : 'User')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`growth-badge ${u.status === 'active' ? 'positive' : 'negative'}`}>
                                                            {u.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : u.status === 'inactive' ? (lang === 'ar' ? 'غير نشط' : 'Inactive') : (lang === 'ar' ? 'محظور' : 'Banned')}
                                                        </span>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
