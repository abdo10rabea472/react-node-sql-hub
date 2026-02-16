import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Filter, Calendar, User as UserIcon, Eye, X, Loader, AlertTriangle, ChevronLeft, ChevronRight, Clock, Info, ShoppingCart, DollarSign } from 'lucide-react';
import api from './api';
import { useSettings } from './SettingsContext';
import { getStats } from './api';

interface Activity {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    action: string;
    entity_type: string;
    entity_id: number;
    details: string;
    created_at: string;
}

const t = {
    ar: {
        title: 'تقارير الأنشطة',
        subtitle: 'سجل كامل لجميع العمليات والأنشطة في النظام',
        search: 'البحث عن نشاط...',
        user: 'المستخدم',
        action: 'الوصف',
        type: 'النوع',
        date: 'التاريخ',
        details: 'التفاصيل',
        noActivities: 'لا توجد سجلات حالياً',
        loading: 'جاري تحميل التقارير...',
        error: 'خطأ في تحميل البيانات',
        retry: 'إعادة المحاولة',
        filterAll: 'كل الأنواع',
        filterInvoices: 'فواتير',
        filterWedding: 'زفاف',
        filterUsers: 'مستخدمين',
        stats: {
            total: 'إجمالي العمليات',
            activeUser: 'المستخدم الأكثر نشاطاً',
            peakTime: 'وقت الذروة',
            typesAnalysis: 'تحليل أنواع العمليات'
        },
        todaySummary: 'ملخص نشاط اليوم',
        personalStats: 'إحصائياتك اليومية',
        userActions: 'عملياتك اليوم',
        totalPersonalSales: 'مبيعاتك اليوم',
        completedInvoices: 'الفواتير المكتملة',
        addedCustomers: 'عملاء جدد',
        todayPurchases: 'مشتريات اليوم',
        todayBalance: 'صافي الربح اليومي',
        close: 'إغلاق',
        activityDetails: 'تفاصيل النشاط'
    },
    en: {
        title: 'Activity Reports',
        subtitle: 'Complete history of all system operations and activities',
        search: 'Search activities...',
        user: 'User',
        action: 'Description',
        type: 'Type',
        date: 'Date',
        details: 'Details',
        noActivities: 'No activity logs found',
        loading: 'Loading reports...',
        error: 'Error loading data',
        retry: 'Retry',
        filterAll: 'All Types',
        filterInvoices: 'Invoices',
        filterWedding: 'Wedding',
        filterUsers: 'Users',
        close: 'Close',
        activityDetails: 'Activity Details',
        stats: {
            total: 'Total Operations',
            activeUser: 'Most Active User',
            peakTime: 'Peak Activity',
            typesAnalysis: 'Actions Analysis'
        },
        todaySummary: "Today's Summary",
        personalStats: 'Your Daily Stats',
        userActions: "Your Actions Today",
        totalPersonalSales: 'Your Sales Today',
        completedInvoices: 'Invoices Issued',
        addedCustomers: 'New Customers',
        todayPurchases: 'Today Purchases',
        todayBalance: 'Daily Net Profit',
    }
};

const ITEMS_PER_PAGE = 10;

const MyReportsPage: React.FC<{ userId?: number }> = ({ userId }) => {
    const { settings } = useSettings();
    const lang = settings.lang;
    const l = t[lang];
    const [activities, setActivities] = useState<Activity[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [salaries, setSalaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [page, setPage] = useState(1);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [viewMode, setViewMode] = useState<'today' | 'history'>('today');

    const [statsData, setStatsData] = useState<any>(null);

    const fetchActivities = async () => {
        setLoading(true);
        setError(false);
        try {
            const [resAct, resPur, resStats, resExp, resSal] = await Promise.all([
                api.get(`/activity.php`, { params: { user_id: userId } }),
                api.get(`/purchases.php`),
                getStats(),
                api.get('/expenses.php?path=expenses').catch(() => ({ data: [] })),
                api.get('/expenses.php?path=salaries').catch(() => ({ data: [] })),
            ]);
            setActivities(resAct.data);
            setPurchases(resPur.data);
            setStatsData(resStats.data);
            setExpenses(Array.isArray(resExp.data) ? resExp.data : []);
            setSalaries(Array.isArray(resSal.data) ? resSal.data : []);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, [userId]);

    const formatDate = (dateString: string) => {
        // ...
        return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'invoice': return 'text-sky-500 bg-sky-500/10';
            case 'wedding_invoice': return 'text-pink-500 bg-pink-500/10';
            case 'user': return 'text-amber-500 bg-amber-500/10';
            case 'wedding_album': return 'text-rose-500 bg-rose-500/10';
            default: return 'text-slate-500 bg-slate-500/10';
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
            <Loader className="animate-spin text-primary" size={32} />
            <p className="text-muted-foreground font-semibold">{l.loading}</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertTriangle size={32} />
            </div>
            <div>
                <h3 className="text-lg font-bold">{l.error}</h3>
                <button onClick={fetchActivities} className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all">
                    {l.retry}
                </button>
            </div>
        </div>
    );

    const getAnalysis = () => {
        const today = new Date().toISOString().split('T')[0];
        const userActivities = activities.filter(a => !userId || a.user_id === userId);
        const todayActivities = userActivities.filter(a => a.created_at.split('T')[0] === today);

        // Pre-fill with backend stats if available (Much more accurate)
        const stats: any = {
            total: userActivities.length,
            todayTotal: todayActivities.length,
            todayInvoices: 0,
            todaySales: statsData?.dailySales ? Number(statsData.dailySales) : 0,
            todayPurchases: 0,
            todayExpenses: 0,
            todaySalaries: 0,
            todayCustomers: 0,
            todayBalance: (statsData?.dailySales ? Number(statsData.dailySales) : 0),
            totalExpenses: expenses.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0),
            totalSalaries: salaries.reduce((s: number, e: any) => s + (Number(e.net_salary) || 0), 0),
            byType: {},
            byUser: {},
            peakHour: 0
        };

        const hours: any = {};

        todayActivities.forEach(a => {
            if (a.entity_type === 'invoice' || a.entity_type === 'wedding_invoice') {
                stats.todayInvoices++;
            }
            if (a.entity_type === 'customer' || a.action.includes('عميل')) {
                stats.todayCustomers++;
            }
        });

        purchases.forEach(p => {
            const pDate = (p.created_at || '').split('T')[0];
            if (pDate === today) {
                stats.todayPurchases += Number(p.total_amount || p.amount || 0);
            }
        });

        expenses.forEach((e: any) => {
            const eDate = (e.created_at || e.expense_date || '').split('T')[0];
            if (eDate === today) {
                stats.todayExpenses += Number(e.amount || 0);
            }
        });

        salaries.forEach((s: any) => {
            const sDate = (s.paid_at || '').split('T')[0];
            if (sDate === today) {
                stats.todaySalaries += Number(s.net_salary || 0);
            }
        });

        stats.todayBalance = stats.todaySales - stats.todayPurchases - stats.todayExpenses - stats.todaySalaries;

        userActivities.forEach(a => {
            stats.byType[a.entity_type] = (stats.byType[a.entity_type] || 0) + 1;
            if (a.user_name) {
                stats.byUser[a.user_name] = (stats.byUser[a.user_name] || 0) + 1;
            }
            const hour = new Date(a.created_at).getHours();
            hours[hour] = (hours[hour] || 0) + 1;
        });

        let mostActiveUser = '-';
        let maxUserAct = 0;
        Object.entries(stats.byUser).forEach(([user, count]: any) => {
            if (count > maxUserAct) {
                maxUserAct = count;
                mostActiveUser = user;
            }
        });
        stats.mostActiveUser = mostActiveUser;

        let peakHour = 0;
        let maxHourAct = 0;
        Object.entries(hours).forEach(([hour, count]: any) => {
            if (count > maxHourAct) {
                maxHourAct = count;
                peakHour = Number(hour);
            }
        });
        stats.peakHour = peakHour;

        return stats;
    };

    const analysis = getAnalysis();

    const displayActivities = activities.filter(a => {
        const today = new Date().toISOString().split('T')[0];
        const isToday = a.created_at.split('T')[0] === today;
        const matchesUser = !userId || a.user_id === userId;
        const matchesView = viewMode === 'today' ? isToday : true;

        const matchesSearch = a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.user_name && a.user_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = !filterType || a.entity_type === filterType;

        return matchesUser && matchesView && matchesSearch && matchesType;
    });

    const totalPages = Math.ceil(displayActivities.length / ITEMS_PER_PAGE);
    const paginatedItems = displayActivities.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                        <FileText size={28} className="text-primary" />
                        {l.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{l.subtitle}</p>
                </div>
            </div>

            {/* Daily Analysis Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-primary to-primary/80 p-5 rounded-2xl text-white shadow-xl shadow-primary/20">
                    <div className="flex items-center gap-2 opacity-80 mb-2"><FileText size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{l.totalPersonalSales}</span></div>
                    <div className="text-xl font-black">{analysis.todaySales.toLocaleString()} <span className="text-xs opacity-70">{settings.currency}</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
                    className="bg-rose-500 p-5 rounded-2xl text-white shadow-xl shadow-rose-500/20">
                    <div className="flex items-center gap-2 opacity-80 mb-2"><ShoppingCart size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{l.todayPurchases}</span></div>
                    <div className="text-xl font-black">{analysis.todayPurchases.toLocaleString()} <span className="text-xs opacity-70">{settings.currency}</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    className="bg-orange-500 p-5 rounded-2xl text-white shadow-xl shadow-orange-500/20">
                    <div className="flex items-center gap-2 opacity-80 mb-2"><DollarSign size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'مصاريف عادية' : 'Expenses'}</span></div>
                    <div className="text-xl font-black">{analysis.totalExpenses.toLocaleString()} <span className="text-xs opacity-70">{settings.currency}</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                    className="bg-violet-500 p-5 rounded-2xl text-white shadow-xl shadow-violet-500/20">
                    <div className="flex items-center gap-2 opacity-80 mb-2"><UserIcon size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'المرتبات' : 'Salaries'}</span></div>
                    <div className="text-xl font-black">{analysis.totalSalaries.toLocaleString()} <span className="text-xs opacity-70">{settings.currency}</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                    className="bg-emerald-500 p-5 rounded-2xl text-white shadow-xl shadow-emerald-500/20">
                    <div className="flex items-center gap-2 opacity-80 mb-2"><DollarSign size={16} /><span className="text-[10px] font-black uppercase tracking-widest">{l.todayBalance}</span></div>
                    <div className="text-xl font-black">{analysis.todayBalance.toLocaleString()} <span className="text-xs opacity-70">{settings.currency}</span></div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}
                    className="bg-card border border-border p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2"><Calendar size={16} className="text-sky-500" /><span className="text-[10px] font-black uppercase tracking-widest">{l.completedInvoices}</span></div>
                    <div className="text-xl font-black text-foreground">{analysis.todayInvoices}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                    className="bg-card border border-border p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2"><UserIcon size={16} className="text-emerald-500" /><span className="text-[10px] font-black uppercase tracking-widest">{l.addedCustomers}</span></div>
                    <div className="text-xl font-black text-foreground">{analysis.todayCustomers}</div>
                </motion.div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-1 bg-muted p-1 rounded-2xl border border-border">
                    <button onClick={() => { setViewMode('today'); setPage(1); }} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'today' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                        {lang === 'ar' ? 'التقرير اليومي' : 'Daily Report'}
                    </button>
                    <button onClick={() => { setViewMode('history'); setPage(1); }} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'history' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                        {lang === 'ar' ? 'السجل الكامل' : 'Full History'}
                    </button>
                </div>
                {viewMode === 'today' && (
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {lang === 'ar' ? 'مباشر من النظام' : 'Live from system'}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-3 mb-6 bg-card border border-border p-4 rounded-2xl shadow-sm">
                <div className="flex-1 min-w-[280px] relative group">
                    <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder={l.search}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full ps-11 pe-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary/50 outline-none transition-all font-cairo"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-muted-foreground" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-11 px-4 rounded-xl border border-border bg-muted/50 text-sm font-bold focus:border-primary/50 outline-none font-cairo cursor-pointer min-w-[140px]"
                    >
                        <option value="">{l.filterAll}</option>
                        <option value="invoice">{l.filterInvoices}</option>
                        <option value="wedding_invoice">{l.filterWedding}</option>
                        <option value="user">{l.filterUsers}</option>
                    </select>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">{l.user}</th>
                                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">{l.action}</th>
                                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">{l.type}</th>
                                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">{l.date}</th>
                                <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-muted-foreground font-bold italic">
                                        <Info className="mx-auto mb-2 opacity-20" size={48} />
                                        {l.noActivities}
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((a, idx) => (
                                    <motion.tr
                                        key={a.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                                                    {a.user_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold truncate max-w-[120px]">{a.user_name || 'System'}</p>
                                                    <p className="text-[10px] text-muted-foreground lowercase truncate max-w-[120px]">{a.user_email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-foreground">{a.action}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${getTypeColor(a.entity_type)}`}>
                                                {a.entity_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium whitespace-nowrap">
                                                <Clock size={12} />
                                                {formatDate(a.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <button
                                                onClick={() => setSelectedActivity(a)}
                                                className="p-2 rounded-lg bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-border bg-muted/20 flex justify-center items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-40 transition-all"
                        >
                            {lang === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                        <div className="flex items-center gap-1 mx-2">
                            <span className="text-sm font-bold text-primary">{page}</span>
                            <span className="text-sm text-muted-foreground font-medium">/ {totalPages}</span>
                        </div>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-40 transition-all"
                        >
                            {lang === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedActivity && (
                    <div className="fixed inset-0 z-[1002] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedActivity(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/30">
                                <h3 className="text-lg font-black flex items-center gap-2">
                                    <Info size={20} className="text-primary" />
                                    {l.activityDetails}
                                </h3>
                                <button onClick={() => setSelectedActivity(null)} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-all"><X size={18} /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-[100px_1fr] gap-4">
                                    <span className="text-xs font-black text-muted-foreground uppercase self-center">{l.user}:</span>
                                    <div className="flex items-center gap-2 font-bold text-sm">
                                        <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px]">{selectedActivity.user_name?.charAt(0)}</div>
                                        {selectedActivity.user_name} ({selectedActivity.user_email})
                                    </div>

                                    <span className="text-xs font-black text-muted-foreground uppercase self-center">{l.action}:</span>
                                    <span className="font-bold text-sm">{selectedActivity.action}</span>

                                    <span className="text-xs font-black text-muted-foreground uppercase self-center">{l.type}:</span>
                                    <span className={`w-fit px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${getTypeColor(selectedActivity.entity_type)}`}>{selectedActivity.entity_type}</span>

                                    <span className="text-xs font-black text-muted-foreground uppercase self-center">{l.date}:</span>
                                    <span className="text-xs font-bold text-muted-foreground">{formatDate(selectedActivity.created_at)}</span>
                                </div>

                                {selectedActivity.details && (
                                    <div className="pt-6 border-t border-border">
                                        <p className="text-xs font-black text-muted-foreground uppercase mb-3">{l.details}</p>
                                        <div className="bg-muted p-4 rounded-2xl border border-border overflow-auto max-h-[200px] dir-ltr">
                                            <pre className="text-[11px] font-mono leading-relaxed text-blue-600 dark:text-blue-400">
                                                {JSON.stringify(JSON.parse(selectedActivity.details), null, 4)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
                                <button onClick={() => setSelectedActivity(null)} className="px-6 py-2.5 rounded-xl bg-card border border-border font-bold text-sm hover:bg-muted transition-all">{l.close}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyReportsPage;
