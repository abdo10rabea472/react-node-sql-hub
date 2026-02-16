import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Area,
  ScatterChart, Scatter, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import {
  TrendingUp, DollarSign, Users, ShoppingCart,
  Activity, Target,
  ArrowUpRight, ArrowDownRight, Sparkles, Brain, Lightbulb,
  Clock
} from 'lucide-react';
import { useSettings } from './SettingsContext';
import { getStats } from './api';
import api from './api';

interface AdvancedDashboardProps {
  userName: string;
  userId: number;
}

// ──────── Data generators ────────
const generateMonthlyRevenue = () => {
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((m, i) => ({
    month: m,
    monthEn: monthsEn[i],
    revenue: Math.floor(Math.random() * 40000) + 10000,
    expenses: Math.floor(Math.random() * 20000) + 5000,
    profit: 0,
    sessions: Math.floor(Math.random() * 200) + 50,
    weddings: Math.floor(Math.random() * 15) + 2,
  })).map(d => ({ ...d, profit: d.revenue - d.expenses }));
};

const generateHeatmapData = () => {
  const days = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  return days.flatMap((day, di) =>
    hours.map((hour) => ({
      day, dayIndex: di, hour,
      value: Math.floor(Math.random() * 100),
    }))
  );
};

const generateBubbleData = () =>
  Array.from({ length: 20 }, () => ({
    x: Math.floor(Math.random() * 100),
    y: Math.floor(Math.random() * 100),
    z: Math.floor(Math.random() * 500) + 100,
  }));

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

// ──────── Sub-components ────────

const GaugeChart = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
  const pct = Math.min(value / max, 1);
  const angle = pct * 180;
  const r = 70;
  const cx = 80;
  const cy = 80;
  const startAngle = Math.PI;
  const endAngle = Math.PI - (angle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy - r * Math.sin(endAngle);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="100" viewBox="0 0 160 100">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="hsl(var(--border))" strokeWidth="12" strokeLinecap="round" />
        <motion.path
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`}
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <text x={cx} y={cy - 10} textAnchor="middle" className="fill-foreground text-xl font-black">{Math.round(pct * 100)}%</text>
        <text x={cx} y={cy + 8} textAnchor="middle" className="fill-muted-foreground text-[10px] font-bold">{label}</text>
      </svg>
    </div>
  );
};

const HeatmapChart = ({ data, lang }: { data: any[]; lang: string }) => {
  const days = lang === 'ar' ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'] : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="flex gap-1 mb-1 ms-14">
          {hours.map(h => (
            <div key={h} className="flex-1 text-center text-[9px] font-bold text-muted-foreground">{h}:00</div>
          ))}
        </div>
        {days.map((day, di) => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <span className="w-12 text-[10px] font-bold text-muted-foreground text-end">{day}</span>
            {hours.map(h => {
              const cell = data.find(d => d.dayIndex === di && d.hour === h);
              const intensity = cell ? cell.value / maxVal : 0;
              return (
                <motion.div
                  key={h}
                  className="flex-1 h-7 rounded-md cursor-pointer relative group"
                  style={{
                    background: `hsl(199, 89%, ${95 - intensity * 55}%)`,
                  }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: (di * 12 + (h - 8)) * 0.01 }}
                  whileHover={{ scale: 1.2, zIndex: 10 }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                    {cell?.value || 0} {lang === 'ar' ? 'عملية' : 'ops'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const WaterfallChart = ({ data, lang }: { data: any[]; lang: string }) => {
  const items = [
    { name: lang === 'ar' ? 'الإيرادات' : 'Revenue', value: data.reduce((s, d) => s + d.revenue, 0), type: 'positive' },
    { name: lang === 'ar' ? 'جلسات التصوير' : 'Sessions', value: Math.floor(data.reduce((s, d) => s + d.revenue, 0) * 0.4), type: 'positive' },
    { name: lang === 'ar' ? 'حفلات الزفاف' : 'Weddings', value: Math.floor(data.reduce((s, d) => s + d.revenue, 0) * 0.35), type: 'positive' },
    { name: lang === 'ar' ? 'خدمات أخرى' : 'Other', value: Math.floor(data.reduce((s, d) => s + d.revenue, 0) * 0.25), type: 'positive' },
    { name: lang === 'ar' ? 'المصروفات' : 'Expenses', value: -data.reduce((s, d) => s + d.expenses, 0), type: 'negative' },
    { name: lang === 'ar' ? 'الضرائب' : 'Taxes', value: -Math.floor(data.reduce((s, d) => s + d.revenue, 0) * 0.05), type: 'negative' },
  ];
  let cumulative = 0;
  const processed = items.map(item => {
    const start = cumulative;
    cumulative += item.value;
    return { ...item, start, end: cumulative };
  });
  processed.push({ name: lang === 'ar' ? 'صافي الربح' : 'Net Profit', value: cumulative, start: 0, end: cumulative, type: 'total' });

  const maxVal = Math.max(...processed.map(p => Math.max(Math.abs(p.start), Math.abs(p.end))));

  return (
    <div className="space-y-2">
      {processed.map((item, i) => {
        const barWidth = Math.abs(item.value) / maxVal * 100;
        const color = item.type === 'positive' ? '#10b981' : item.type === 'negative' ? '#ef4444' : '#0ea5e9';
        return (
          <motion.div key={i} className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <span className="w-24 text-[11px] font-bold text-muted-foreground text-end shrink-0 truncate">{item.name}</span>
            <div className="flex-1 h-7 bg-muted/30 rounded-lg overflow-hidden relative">
              <motion.div className="h-full rounded-lg" style={{ background: color }}
                initial={{ width: 0 }} animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }} />
            </div>
            <span className={`text-xs font-black w-20 text-end ${item.type === 'negative' ? 'text-destructive' : 'text-success'}`}>
              {item.value >= 0 ? '+' : ''}{(item.value / 1000).toFixed(1)}K
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

const SmartInsight = ({ icon: Icon, title, description, type }: { icon: any; title: string; description: string; type: 'success' | 'warning' | 'info' }) => {
  const colors = {
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    info: 'border-primary/30 bg-primary/5',
  };
  const iconColors = {
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    info: 'text-primary bg-primary/10',
  };
  return (
    <motion.div className={`p-4 rounded-2xl border ${colors[type]} flex items-start gap-3`}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColors[type]}`}>
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

const ChartCard = ({ title, subtitle, children, className = '', actions }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
  actions?: React.ReactNode;
}) => (
  <motion.div className={`bg-card border border-border rounded-2xl p-5 ${className}`}
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}
    </div>
    {children}
  </motion.div>
);

// ──────── Main component ────────

const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ userName }) => {
  const { settings } = useSettings();
  const lang = settings.lang;
  const currency = settings.currency;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'analytics' | 'insights'>('overview');

  useEffect(() => {
    setLoading(true);
    Promise.all([getStats(), api.get('/purchases.php')])
      .then(([statsRes, purchasesRes]) => {
        setStats({
          ...statsRes.data,
          purchases: purchasesRes.data,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const monthlyData = useMemo(() => generateMonthlyRevenue(), []);
  const heatmapData = useMemo(() => generateHeatmapData(), []);
  const bubbleData = useMemo(() => generateBubbleData(), []);

  const totalRevenue = stats?.revenue || 0;
  const totalOrders = stats?.totalOrders || 0;
  const activeUsers = stats?.activeUsers || 0;
  const dailySales = stats?.dailySales || 0;

  const pieData = useMemo(() => [
    { name: lang === 'ar' ? 'تصوير' : 'Sessions', value: Math.floor(totalRevenue * 0.4) || 35 },
    { name: lang === 'ar' ? 'زفاف' : 'Weddings', value: Math.floor(totalRevenue * 0.35) || 30 },
    { name: lang === 'ar' ? 'طباعة' : 'Prints', value: Math.floor(totalRevenue * 0.15) || 20 },
    { name: lang === 'ar' ? 'أخرى' : 'Other', value: Math.floor(totalRevenue * 0.1) || 15 },
  ], [totalRevenue, lang]);

  const radialData = useMemo(() => [
    { name: lang === 'ar' ? 'الهدف' : 'Target', value: 75, fill: '#0ea5e9' },
    { name: lang === 'ar' ? 'الأداء' : 'Performance', value: 60, fill: '#10b981' },
    { name: lang === 'ar' ? 'النمو' : 'Growth', value: 45, fill: '#f59e0b' },
  ], [lang]);

  const distributionData = useMemo(() => [
    { range: '0-1K', count: 15 }, { range: '1-5K', count: 35 },
    { range: '5-10K', count: 45 }, { range: '10-20K', count: 28 },
    { range: '20-50K', count: 12 }, { range: '50K+', count: 5 },
  ], []);

  const smartInsights = useMemo(() => {
    const insights = [];
    if (dailySales > 0) {
      insights.push({
        icon: TrendingUp,
        title: lang === 'ar' ? 'أداء ممتاز اليوم!' : 'Great Performance Today!',
        description: lang === 'ar'
          ? `حققت مبيعات بقيمة ${dailySales.toLocaleString()} ${currency} اليوم. استمر!`
          : `You made ${dailySales.toLocaleString()} ${currency} in sales today. Keep it up!`,
        type: 'success' as const,
      });
    }
    insights.push({
      icon: Lightbulb,
      title: lang === 'ar' ? 'اقتراح ذكي' : 'Smart Suggestion',
      description: lang === 'ar'
        ? 'أوقات الذروة بين 10 صباحاً و 2 ظهراً. جدول الحجوزات المهمة في هذه الفترة.'
        : 'Peak hours are between 10 AM and 2 PM. Schedule important bookings during this time.',
      type: 'info' as const,
    });
    insights.push({
      icon: Brain,
      title: lang === 'ar' ? 'تحليل الاتجاهات' : 'Trend Analysis',
      description: lang === 'ar'
        ? 'حفلات الزفاف تمثل 35% من الإيرادات. فكّر في توسيع خدمات الزفاف.'
        : 'Weddings represent 35% of revenue. Consider expanding wedding services.',
      type: 'warning' as const,
    });
    return insights;
  }, [dailySales, currency, lang]);

  const statCards = useMemo(() => [
    {
      icon: DollarSign,
      title: lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
      value: totalRevenue.toLocaleString(),
      unit: currency,
      change: '+12.5%',
      positive: true,
      gradient: 'from-sky-500 to-cyan-400',
      shadow: 'shadow-sky-500/20',
    },
    {
      icon: ShoppingCart,
      title: lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders',
      value: totalOrders.toLocaleString(),
      unit: '',
      change: '+8.2%',
      positive: true,
      gradient: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/20',
    },
    {
      icon: Users,
      title: lang === 'ar' ? 'العملاء النشطين' : 'Active Clients',
      value: activeUsers.toLocaleString(),
      unit: '',
      change: '+5.1%',
      positive: true,
      gradient: 'from-violet-500 to-purple-400',
      shadow: 'shadow-violet-500/20',
    },
    {
      icon: Activity,
      title: lang === 'ar' ? 'مبيعات اليوم' : "Today's Sales",
      value: dailySales.toLocaleString(),
      unit: currency,
      change: dailySales > 0 ? '+100%' : '0%',
      positive: dailySales > 0,
      gradient: 'from-amber-500 to-orange-400',
      shadow: 'shadow-amber-500/20',
    },
  ], [totalRevenue, totalOrders, activeUsers, dailySales, currency, lang]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl">
        <p className="text-xs font-bold text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-[11px] font-semibold" style={{ color: p.color }}>
            {p.name}: {p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-bold text-sm">
            {lang === 'ar' ? 'جاري تحميل لوحة التحكم...' : 'Loading dashboard...'}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <motion.h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            {lang === 'ar' ? `مرحباً، ${userName}` : `Welcome, ${userName}`} <span className="inline-block animate-bounce">👋</span>
          </motion.h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'لوحة التحكم المتقدمة — تحليلات شاملة ورؤى ذكية' : 'Advanced Dashboard — Comprehensive analytics & smart insights'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['overview', 'analytics', 'insights'] as const).map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSection === s
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {s === 'overview' ? (lang === 'ar' ? 'نظرة عامة' : 'Overview')
                : s === 'analytics' ? (lang === 'ar' ? 'تحليلات' : 'Analytics')
                : (lang === 'ar' ? 'رؤى ذكية' : 'Insights')}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i}
              className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white cursor-pointer group"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02, y: -2 }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm ${card.positive ? '' : 'text-red-200'}`}>
                    {card.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {card.change}
                  </span>
                </div>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">{card.title}</p>
                <h3 className="text-2xl sm:text-3xl font-black">
                  {card.value} <span className="text-sm font-bold opacity-60">{card.unit}</span>
                </h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ──── OVERVIEW ──── */}
        {activeSection === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Row 1: Area + Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 mb-4">
              <ChartCard title={lang === 'ar' ? 'الإيرادات والمصروفات' : 'Revenue & Expenses'}
                subtitle={lang === 'ar' ? 'المقارنة الشهرية للأداء المالي' : 'Monthly financial performance comparison'}>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey={lang === 'ar' ? 'month' : 'monthEn'} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" fill="url(#colorRevenue)" stroke="#0ea5e9" strokeWidth={2.5}
                      name={lang === 'ar' ? 'الإيرادات' : 'Revenue'} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5"
                      dot={{ fill: '#ef4444', r: 3 }} name={lang === 'ar' ? 'المصروفات' : 'Expenses'} />
                    <Bar dataKey="profit" fill="#10b981" opacity={0.4} radius={[4, 4, 0, 0]}
                      name={lang === 'ar' ? 'الربح' : 'Profit'} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={lang === 'ar' ? 'توزيع الخدمات' : 'Service Distribution'}
                subtitle={lang === 'ar' ? 'نسبة كل خدمة من الإيرادات' : 'Revenue share per service'}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      paddingAngle={4} dataKey="value" animationBegin={0} animationDuration={1200}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pieData.map((d, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                      {d.name}
                    </span>
                  ))}
                </div>
              </ChartCard>
            </div>

            {/* Row 2: Bar Chart + Gauges */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <ChartCard title={lang === 'ar' ? 'الطلبات الشهرية' : 'Monthly Orders'}
                subtitle={lang === 'ar' ? 'جلسات التصوير وحفلات الزفاف' : 'Sessions & weddings breakdown'}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey={lang === 'ar' ? 'month' : 'monthEn'} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sessions" fill="#0ea5e9" radius={[6, 6, 0, 0]}
                      name={lang === 'ar' ? 'جلسات' : 'Sessions'} />
                    <Bar dataKey="weddings" fill="#ec4899" radius={[6, 6, 0, 0]}
                      name={lang === 'ar' ? 'زفاف' : 'Weddings'} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={lang === 'ar' ? 'مقاييس الأداء' : 'Performance Gauges'}
                subtitle={lang === 'ar' ? 'مؤشرات الأداء الرئيسية' : 'Key performance indicators'}>
                <div className="grid grid-cols-3 gap-2">
                  <GaugeChart value={totalOrders} max={Math.max(totalOrders * 1.5, 100)}
                    label={lang === 'ar' ? 'الطلبات' : 'Orders'} color="#0ea5e9" />
                  <GaugeChart value={activeUsers} max={Math.max(activeUsers * 2, 50)}
                    label={lang === 'ar' ? 'العملاء' : 'Clients'} color="#10b981" />
                  <GaugeChart value={dailySales} max={Math.max(totalRevenue / 30, 1000)}
                    label={lang === 'ar' ? 'اليوم' : 'Today'} color="#f59e0b" />
                </div>
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={100}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={radialData}
                      startAngle={180} endAngle={0}>
                      <RadialBar dataKey="value" cornerRadius={10} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </motion.div>
        )}

        {/* ──── ANALYTICS ──── */}
        {activeSection === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Heatmap */}
            <ChartCard title={lang === 'ar' ? 'خريطة حرارية — ساعات النشاط' : 'Activity Heatmap'}
              subtitle={lang === 'ar' ? 'أوقات الذروة خلال الأسبوع' : 'Peak times during the week'}
              className="mb-4">
              <HeatmapChart data={heatmapData} lang={lang} />
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Waterfall */}
              <ChartCard title={lang === 'ar' ? 'مخطط الشلال — تحليل الربح' : 'Waterfall — Profit Breakdown'}
                subtitle={lang === 'ar' ? 'تفصيل مصادر الإيرادات والمصروفات' : 'Revenue sources & expenses breakdown'}>
                <WaterfallChart data={monthlyData} lang={lang} />
              </ChartCard>

              {/* Bubble / Scatter */}
              <ChartCard title={lang === 'ar' ? 'مخطط الفقاعات — العملاء' : 'Bubble Chart — Clients'}
                subtitle={lang === 'ar' ? 'توزيع العملاء حسب القيمة والنشاط' : 'Client distribution by value & activity'}>
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" dataKey="x" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))"
                      name={lang === 'ar' ? 'النشاط' : 'Activity'} />
                    <YAxis type="number" dataKey="y" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))"
                      name={lang === 'ar' ? 'القيمة' : 'Value'} />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={bubbleData} fill="#0ea5e9" fillOpacity={0.6}>
                      {bubbleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Distribution + Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <ChartCard title={lang === 'ar' ? 'مخطط التوزيع — قيم الفواتير' : 'Distribution — Invoice Values'}
                subtitle={lang === 'ar' ? 'توزيع الفواتير حسب النطاق السعري' : 'Invoice distribution by price range'}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} name={lang === 'ar' ? 'العدد' : 'Count'}>
                      {distributionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title={lang === 'ar' ? 'اتجاهات الأداء الزمني' : 'Performance Trends'}
                subtitle={lang === 'ar' ? 'تحليل الاتجاهات على مدار العام' : 'Year-long trend analysis'}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey={lang === 'ar' ? 'month' : 'monthEn'} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5}
                      dot={{ fill: '#0ea5e9', r: 4 }} name={lang === 'ar' ? 'الإيرادات' : 'Revenue'} />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2}
                      dot={{ fill: '#10b981', r: 3 }} name={lang === 'ar' ? 'الربح' : 'Profit'} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </motion.div>
        )}

        {/* ──── INSIGHTS ──── */}
        {activeSection === 'insights' && (
          <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  {lang === 'ar' ? 'اقتراحات القرارات الذكية' : 'Smart Decision Suggestions'}
                </h3>
                <div className="space-y-3">
                  {smartInsights.map((insight, i) => (
                    <SmartInsight key={i} {...insight} />
                  ))}

                  <SmartInsight icon={Target}
                    title={lang === 'ar' ? 'هدف الشهر' : 'Monthly Goal'}
                    description={lang === 'ar'
                      ? `لتحقيق هدف ${(totalRevenue * 1.2).toLocaleString()} ${currency}، تحتاج ${Math.ceil((totalRevenue * 0.2) / 30)} ${currency} يومياً إضافياً.`
                      : `To reach ${(totalRevenue * 1.2).toLocaleString()} ${currency}, you need an extra ${Math.ceil((totalRevenue * 0.2) / 30)} ${currency}/day.`}
                    type="info" />

                  <SmartInsight icon={Clock}
                    title={lang === 'ar' ? 'تحسين الجدولة' : 'Schedule Optimization'}
                    description={lang === 'ar'
                      ? 'يوما الخميس والجمعة هما الأكثر ازدحاماً. خصص موارد إضافية في عطلة نهاية الأسبوع.'
                      : 'Thursday and Friday are the busiest days. Allocate extra resources for weekends.'}
                    type="warning" />
                </div>
              </div>

              <div className="space-y-4">
                <ChartCard title={lang === 'ar' ? 'مؤشر الأداء العام' : 'Overall Performance'}
                  subtitle={lang === 'ar' ? 'مقارنة بالأهداف المحددة' : 'Compared to set targets'}>
                  <div className="space-y-4">
                    {[
                      { label: lang === 'ar' ? 'الإيرادات' : 'Revenue', pct: 72, color: '#0ea5e9' },
                      { label: lang === 'ar' ? 'العملاء' : 'Clients', pct: 58, color: '#10b981' },
                      { label: lang === 'ar' ? 'الرضا' : 'Satisfaction', pct: 91, color: '#f59e0b' },
                      { label: lang === 'ar' ? 'الكفاءة' : 'Efficiency', pct: 67, color: '#8b5cf6' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-bold text-foreground">{item.label}</span>
                          <span className="text-xs font-black" style={{ color: item.color }}>{item.pct}%</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full"
                            style={{ background: item.color }}
                            initial={{ width: 0 }} animate={{ width: `${item.pct}%` }}
                            transition={{ duration: 1, delay: i * 0.15 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>

                {/* Recent users mini-table */}
                {stats?.recentUsers && (
                  <ChartCard title={lang === 'ar' ? 'أحدث العملاء' : 'Latest Clients'}>
                    <div className="space-y-2">
                      {stats.recentUsers.slice(0, 5).map((u: any, i: number) => (
                        <motion.div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all"
                          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {u.name?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground">{u.role}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                            {u.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </ChartCard>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedDashboard;
