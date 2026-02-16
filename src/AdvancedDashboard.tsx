import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// ──── Data ────
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

const genMonthly = () => {
  const m = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const mEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return m.map((name, i) => {
    const rev = Math.floor(Math.random() * 40000) + 10000;
    const exp = Math.floor(Math.random() * 20000) + 5000;
    return { name, nameEn: mEn[i], revenue: rev, expenses: exp, profit: rev - exp, sessions: Math.floor(Math.random() * 200) + 50, weddings: Math.floor(Math.random() * 15) + 2 };
  });
};

const genHeatmap = () => {
  const days = 7, hours = 12;
  return Array.from({ length: days * hours }, (_, idx) => ({
    day: idx % days, hour: Math.floor(idx / days) + 8,
    value: Math.floor(Math.random() * 100),
  }));
};

// ──── SVG Chart Components ────

const SVGAreaChart = ({ data, width = 600, height = 220, lang }: { data: any[]; width?: number; height?: number; lang: string }) => {
  const pad = { t: 10, r: 10, b: 30, l: 50 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const maxRev = Math.max(...data.map(d => d.revenue));
  const xStep = w / (data.length - 1);

  const revPoints = data.map((d, i) => `${pad.l + i * xStep},${pad.t + h - (d.revenue / maxRev) * h}`).join(' ');
  const expPoints = data.map((d, i) => `${pad.l + i * xStep},${pad.t + h - (d.expenses / maxRev) * h}`).join(' ');
  const areaPath = `${pad.l},${pad.t + h} ${revPoints} ${pad.l + (data.length - 1) * xStep},${pad.t + h}`;

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <g key={pct}>
          <line x1={pad.l} y1={pad.t + h * (1 - pct)} x2={pad.l + w} y2={pad.t + h * (1 - pct)}
            stroke="hsl(var(--border))" strokeDasharray="4" />
          <text x={pad.l - 5} y={pad.t + h * (1 - pct) + 4} textAnchor="end"
            className="fill-muted-foreground" fontSize="9" fontWeight="600">
            {Math.round(maxRev * pct / 1000)}K
          </text>
        </g>
      ))}
      {/* Area */}
      <motion.polygon points={areaPath} fill="url(#areaGrad)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
      {/* Revenue line */}
      <motion.polyline points={revPoints} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.5 }} />
      {/* Expenses line */}
      <motion.polyline points={expPoints} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.5, delay: 0.3 }} />
      {/* Dots + labels */}
      {data.map((d, i) => (
        <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
          <circle cx={pad.l + i * xStep} cy={pad.t + h - (d.revenue / maxRev) * h} r={hovered === i ? 5 : 3} fill="#0ea5e9" />
          <text x={pad.l + i * xStep} y={pad.t + h + 18} textAnchor="middle"
            className="fill-muted-foreground" fontSize="8" fontWeight="600">
            {lang === 'ar' ? d.name.slice(0, 3) : d.nameEn}
          </text>
          {hovered === i && (
            <g>
              <rect x={pad.l + i * xStep - 45} y={pad.t + h - (d.revenue / maxRev) * h - 38}
                width="90" height="30" rx="6" className="fill-foreground" opacity="0.9" />
              <text x={pad.l + i * xStep} y={pad.t + h - (d.revenue / maxRev) * h - 18}
                textAnchor="middle" className="fill-background" fontSize="10" fontWeight="700">
                {d.revenue.toLocaleString()}
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
};

const SVGBarChart = ({ data, width = 500, height = 220, lang }: { data: any[]; width?: number; height?: number; lang: string }) => {
  const pad = { t: 10, r: 10, b: 30, l: 40 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const max = Math.max(...data.map(d => Math.max(d.sessions, d.weddings * 10)));
  const barW = (w / data.length) * 0.35;
  const gap = w / data.length;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const sH = (d.sessions / max) * h;
        const wH = ((d.weddings * 10) / max) * h;
        return (
          <g key={i}>
            <motion.rect x={pad.l + i * gap + gap * 0.1} y={pad.t + h - sH} width={barW} height={sH}
              rx="4" fill="#0ea5e9"
              initial={{ height: 0, y: pad.t + h }} animate={{ height: sH, y: pad.t + h - sH }}
              transition={{ duration: 0.6, delay: i * 0.05 }} />
            <motion.rect x={pad.l + i * gap + gap * 0.1 + barW + 2} y={pad.t + h - wH} width={barW} height={wH}
              rx="4" fill="#ec4899"
              initial={{ height: 0, y: pad.t + h }} animate={{ height: wH, y: pad.t + h - wH }}
              transition={{ duration: 0.6, delay: i * 0.05 + 0.1 }} />
            <text x={pad.l + i * gap + gap * 0.5} y={pad.t + h + 16} textAnchor="middle"
              className="fill-muted-foreground" fontSize="8" fontWeight="600">
              {lang === 'ar' ? d.name.slice(0, 3) : d.nameEn}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const SVGPieChart = ({ data, size = 180 }: { data: { name: string; value: number }[]; size?: number }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2, r = size * 0.35, ir = size * 0.22;
  let cumAngle = -Math.PI / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const angle = (d.value / total) * Math.PI * 2;
        const startAngle = cumAngle;
        cumAngle += angle;
        const endAngle = cumAngle;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const ix1 = cx + ir * Math.cos(startAngle);
        const iy1 = cy + ir * Math.sin(startAngle);
        const ix2 = cx + ir * Math.cos(endAngle);
        const iy2 = cy + ir * Math.sin(endAngle);
        const largeArc = angle > Math.PI ? 1 : 0;
        const path = `M${ix1},${iy1} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 ${largeArc} 0 ${ix1},${iy1}`;
        return (
          <motion.path key={i} d={path} fill={COLORS[i]}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="hover:opacity-80 transition-opacity cursor-pointer" style={{ transformOrigin: `${cx}px ${cy}px` }} />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground" fontSize="14" fontWeight="800">
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-muted-foreground" fontSize="8" fontWeight="600">
        Total
      </text>
    </svg>
  );
};

const GaugeChart = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
  const pct = Math.min(value / (max || 1), 1);
  const r = 60, cx = 70, cy = 70;
  const startX = cx - r, endAngle = Math.PI - pct * Math.PI;
  const ex = cx + r * Math.cos(endAngle), ey = cy - r * Math.sin(endAngle);
  const largeArc = pct > 0.5 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="85" viewBox="0 0 140 85">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="round" />
        <motion.path
          d={`M ${startX} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground" fontSize="18" fontWeight="800">{Math.round(pct * 100)}%</text>
        <text x={cx} y={cy + 8} textAnchor="middle" className="fill-muted-foreground" fontSize="9" fontWeight="600">{label}</text>
      </svg>
    </div>
  );
};

const HeatmapChart = ({ data, lang }: { data: any[]; lang: string }) => {
  const dayNames = lang === 'ar' ? ['سبت','أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة'] : ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[480px]">
        <div className="flex gap-1 mb-1 ms-14">
          {hours.map(h => <div key={h} className="flex-1 text-center text-[8px] font-bold text-muted-foreground">{h}:00</div>)}
        </div>
        {dayNames.map((day, di) => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <span className="w-12 text-[9px] font-bold text-muted-foreground text-end">{day}</span>
            {hours.map((h, hi) => {
              const cell = data.find(d => d.day === di && d.hour === h);
              const intensity = cell ? cell.value / maxVal : 0;
              return (
                <motion.div key={hi} className="flex-1 h-6 rounded cursor-pointer relative group"
                  style={{ background: `hsl(199, 89%, ${95 - intensity * 55}%)` }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: (di * 12 + hi) * 0.008 }}
                  whileHover={{ scale: 1.15, zIndex: 10 }}>
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                    {cell?.value || 0}
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
  const totalRev = data.reduce((s, d) => s + d.revenue, 0);
  const totalExp = data.reduce((s, d) => s + d.expenses, 0);
  const items = [
    { name: lang === 'ar' ? 'الإيرادات' : 'Revenue', value: totalRev, type: 'positive' },
    { name: lang === 'ar' ? 'جلسات' : 'Sessions', value: Math.floor(totalRev * 0.4), type: 'positive' },
    { name: lang === 'ar' ? 'زفاف' : 'Weddings', value: Math.floor(totalRev * 0.35), type: 'positive' },
    { name: lang === 'ar' ? 'المصروفات' : 'Expenses', value: -totalExp, type: 'negative' },
    { name: lang === 'ar' ? 'صافي' : 'Net', value: totalRev - totalExp, type: 'total' },
  ];
  const maxVal = Math.max(...items.map(i => Math.abs(i.value)));

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const barW = (Math.abs(item.value) / maxVal) * 100;
        const color = item.type === 'positive' ? '#10b981' : item.type === 'negative' ? '#ef4444' : '#0ea5e9';
        return (
          <motion.div key={i} className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
            <span className="w-20 text-[10px] font-bold text-muted-foreground text-end shrink-0 truncate">{item.name}</span>
            <div className="flex-1 h-6 bg-muted/30 rounded-lg overflow-hidden">
              <motion.div className="h-full rounded-lg" style={{ background: color }}
                initial={{ width: 0 }} animate={{ width: `${barW}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }} />
            </div>
            <span className={`text-[10px] font-black w-16 text-end ${item.type === 'negative' ? 'text-destructive' : 'text-success'}`}>
              {item.value >= 0 ? '+' : ''}{(item.value / 1000).toFixed(1)}K
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

// ──── Reusable wrappers ────

const SmartInsight = ({ icon: Icon, title, description, type }: { icon: any; title: string; description: string; type: 'success' | 'warning' | 'info' }) => {
  const colors = { success: 'border-success/30 bg-success/5', warning: 'border-warning/30 bg-warning/5', info: 'border-primary/30 bg-primary/5' };
  const iconColors = { success: 'text-success bg-success/10', warning: 'text-warning bg-warning/10', info: 'text-primary bg-primary/10' };
  return (
    <motion.div className={`p-4 rounded-2xl border ${colors[type]} flex items-start gap-3`}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColors[type]}`}><Icon size={18} /></div>
      <div>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

const ChartCard = ({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) => (
  <motion.div className={`bg-card border border-border rounded-2xl p-5 ${className}`}
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <div className="mb-4">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </motion.div>
);

// ──── Main ────

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
      .then(([s, p]) => setStats({ ...s.data, purchases: p.data }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const monthlyData = useMemo(() => genMonthly(), []);
  const heatmapData = useMemo(() => genHeatmap(), []);

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

  const statCards = useMemo(() => [
    { icon: DollarSign, title: lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue', value: totalRevenue.toLocaleString(), unit: currency, change: '+12.5%', positive: true, gradient: 'from-sky-500 to-cyan-400', shadow: 'shadow-sky-500/20' },
    { icon: ShoppingCart, title: lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders', value: totalOrders.toLocaleString(), unit: '', change: '+8.2%', positive: true, gradient: 'from-emerald-500 to-teal-400', shadow: 'shadow-emerald-500/20' },
    { icon: Users, title: lang === 'ar' ? 'العملاء النشطين' : 'Active Clients', value: activeUsers.toLocaleString(), unit: '', change: '+5.1%', positive: true, gradient: 'from-violet-500 to-purple-400', shadow: 'shadow-violet-500/20' },
    { icon: Activity, title: lang === 'ar' ? 'مبيعات اليوم' : "Today's Sales", value: dailySales.toLocaleString(), unit: currency, change: dailySales > 0 ? '+100%' : '0%', positive: dailySales > 0, gradient: 'from-amber-500 to-orange-400', shadow: 'shadow-amber-500/20' },
  ], [totalRevenue, totalOrders, activeUsers, dailySales, currency, lang]);

  const smartInsights = useMemo(() => [
    ...(dailySales > 0 ? [{
      icon: TrendingUp,
      title: lang === 'ar' ? 'أداء ممتاز اليوم!' : 'Great Performance Today!',
      description: lang === 'ar' ? `حققت مبيعات بقيمة ${dailySales.toLocaleString()} ${currency} اليوم.` : `You made ${dailySales.toLocaleString()} ${currency} in sales today.`,
      type: 'success' as const,
    }] : []),
    { icon: Lightbulb, title: lang === 'ar' ? 'اقتراح ذكي' : 'Smart Suggestion', description: lang === 'ar' ? 'أوقات الذروة بين 10 صباحاً و 2 ظهراً. جدول الحجوزات المهمة في هذه الفترة.' : 'Peak hours are between 10 AM and 2 PM. Schedule important bookings then.', type: 'info' as const },
    { icon: Brain, title: lang === 'ar' ? 'تحليل الاتجاهات' : 'Trend Analysis', description: lang === 'ar' ? 'حفلات الزفاف تمثل 35% من الإيرادات. فكّر في توسيع خدمات الزفاف.' : 'Weddings = 35% of revenue. Consider expanding wedding services.', type: 'warning' as const },
  ], [dailySales, currency, lang]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-bold text-sm">{lang === 'ar' ? 'جاري تحميل لوحة التحكم...' : 'Loading dashboard...'}</p>
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
            {lang === 'ar' ? 'لوحة التحكم المتقدمة — تحليلات شاملة ورؤى ذكية' : 'Advanced Dashboard — Analytics & Smart Insights'}
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
            <motion.div key={i} className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white cursor-pointer group"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02, y: -2 }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Icon size={20} /></div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                    {card.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{card.change}
                  </span>
                </div>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">{card.title}</p>
                <h3 className="text-2xl sm:text-3xl font-black">{card.value} <span className="text-sm font-bold opacity-60">{card.unit}</span></h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeSection === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-4 mb-4">
              <ChartCard title={lang === 'ar' ? 'الإيرادات والمصروفات' : 'Revenue & Expenses'}
                subtitle={lang === 'ar' ? 'المقارنة الشهرية' : 'Monthly comparison'}>
                <SVGAreaChart data={monthlyData} lang={lang} />
                <div className="flex gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />{lang === 'ar' ? 'الإيرادات' : 'Revenue'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />{lang === 'ar' ? 'المصروفات' : 'Expenses'}
                  </span>
                </div>
              </ChartCard>

              <ChartCard title={lang === 'ar' ? 'توزيع الخدمات' : 'Services'}>
                <div className="flex justify-center"><SVGPieChart data={pieData} /></div>
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {pieData.map((d, i) => (
                    <span key={i} className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />{d.name}
                    </span>
                  ))}
                </div>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <ChartCard title={lang === 'ar' ? 'الطلبات الشهرية' : 'Monthly Orders'}
                subtitle={lang === 'ar' ? 'جلسات التصوير وحفلات الزفاف' : 'Sessions & weddings'}>
                <SVGBarChart data={monthlyData} lang={lang} />
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />{lang === 'ar' ? 'جلسات' : 'Sessions'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />{lang === 'ar' ? 'زفاف' : 'Weddings'}
                  </span>
                </div>
              </ChartCard>

              <ChartCard title={lang === 'ar' ? 'مقاييس الأداء' : 'Performance Gauges'}
                subtitle={lang === 'ar' ? 'مؤشرات الأداء الرئيسية' : 'Key performance indicators'}>
                <div className="grid grid-cols-3 gap-2">
                  <GaugeChart value={totalOrders} max={Math.max(totalOrders * 1.5, 100)} label={lang === 'ar' ? 'الطلبات' : 'Orders'} color="#0ea5e9" />
                  <GaugeChart value={activeUsers} max={Math.max(activeUsers * 2, 50)} label={lang === 'ar' ? 'العملاء' : 'Clients'} color="#10b981" />
                  <GaugeChart value={dailySales} max={Math.max(totalRevenue / 30, 1000)} label={lang === 'ar' ? 'اليوم' : 'Today'} color="#f59e0b" />
                </div>
              </ChartCard>
            </div>
          </motion.div>
        )}

        {activeSection === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ChartCard title={lang === 'ar' ? 'خريطة حرارية — ساعات النشاط' : 'Activity Heatmap'}
              subtitle={lang === 'ar' ? 'أوقات الذروة خلال الأسبوع' : 'Peak times during the week'} className="mb-4">
              <HeatmapChart data={heatmapData} lang={lang} />
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <ChartCard title={lang === 'ar' ? 'مخطط الشلال — تحليل الربح' : 'Waterfall — Profit Breakdown'}>
                <WaterfallChart data={monthlyData} lang={lang} />
              </ChartCard>

              <ChartCard title={lang === 'ar' ? 'اتجاهات الأداء' : 'Performance Trends'}
                subtitle={lang === 'ar' ? 'تحليل الاتجاهات السنوية' : 'Year-long trend analysis'}>
                <SVGAreaChart data={monthlyData} lang={lang} height={200} />
              </ChartCard>
            </div>
          </motion.div>
        )}

        {activeSection === 'insights' && (
          <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  {lang === 'ar' ? 'اقتراحات القرارات الذكية' : 'Smart Decision Suggestions'}
                </h3>
                <div className="space-y-3">
                  {smartInsights.map((insight, i) => <SmartInsight key={i} {...insight} />)}
                  <SmartInsight icon={Target}
                    title={lang === 'ar' ? 'هدف الشهر' : 'Monthly Goal'}
                    description={lang === 'ar' ? `لتحقيق هدف ${(totalRevenue * 1.2).toLocaleString()} ${currency}، تحتاج ${Math.ceil((totalRevenue * 0.2) / 30)} ${currency} يومياً إضافياً.` : `To reach ${(totalRevenue * 1.2).toLocaleString()} ${currency}, you need an extra ${Math.ceil((totalRevenue * 0.2) / 30)} ${currency}/day.`}
                    type="info" />
                  <SmartInsight icon={Clock}
                    title={lang === 'ar' ? 'تحسين الجدولة' : 'Schedule Optimization'}
                    description={lang === 'ar' ? 'يوما الخميس والجمعة هما الأكثر ازدحاماً. خصص موارد إضافية.' : 'Thursday and Friday are the busiest. Allocate extra resources.'}
                    type="warning" />
                </div>
              </div>

              <div className="space-y-4">
                <ChartCard title={lang === 'ar' ? 'مؤشر الأداء العام' : 'Overall Performance'}>
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
                          <motion.div className="h-full rounded-full" style={{ background: item.color }}
                            initial={{ width: 0 }} animate={{ width: `${item.pct}%` }}
                            transition={{ duration: 1, delay: i * 0.15 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartCard>

                {stats?.recentUsers && (
                  <ChartCard title={lang === 'ar' ? 'أحدث العملاء' : 'Latest Clients'}>
                    <div className="space-y-2">
                      {stats.recentUsers.slice(0, 5).map((u: any, i: number) => (
                        <motion.div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all"
                          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{u.name?.charAt(0)}</div>
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
