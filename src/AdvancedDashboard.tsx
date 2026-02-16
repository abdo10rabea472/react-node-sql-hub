import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, DollarSign, Users, ShoppingCart, Activity, Target,
  ArrowUpRight, ArrowDownRight, Sparkles, Brain, Lightbulb, Clock,
  BarChart3, PieChart, Calendar, CreditCard, Package, Wallet,
  TrendingDown, Award, Zap, AlertTriangle, CheckCircle, Star,
  Receipt, UserPlus, Percent, Layers, Hash, ArrowUp, ArrowDown, ClipboardList
} from 'lucide-react';
import { useSettings } from './SettingsContext';
import api from './api';

interface AdvancedDashboardProps { userName: string; userId: number; }

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1', '#84cc16'];

// ──── SVG Charts ────

const SVGAreaChart = ({ data, width = 600, height = 200, lang }: { data: any[]; width?: number; height?: number; lang: string }) => {
  const pad = { t: 10, r: 10, b: 25, l: 45 };
  const w = width - pad.l - pad.r, h = height - pad.t - pad.b;
  if (!data.length) return <p className="text-center text-muted-foreground text-xs py-6">{lang === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>;
  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  const xStep = w / Math.max(data.length - 1, 1);
  const revPts = data.map((d, i) => `${pad.l + i * xStep},${pad.t + h - (d.revenue / maxRev) * h}`).join(' ');
  const expPts = data.map((d, i) => `${pad.l + i * xStep},${pad.t + h - (d.expenses / maxRev) * h}`).join(' ');
  const area = `${pad.l},${pad.t + h} ${revPts} ${pad.l + (data.length - 1) * xStep},${pad.t + h}`;
  const [hov, setHov] = useState<number | null>(null);
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" /></linearGradient></defs>
      {[0, 0.25, 0.5, 0.75, 1].map(p => (<g key={p}><line x1={pad.l} y1={pad.t + h * (1 - p)} x2={pad.l + w} y2={pad.t + h * (1 - p)} stroke="hsl(var(--border))" strokeDasharray="4" /><text x={pad.l - 5} y={pad.t + h * (1 - p) + 4} textAnchor="end" className="fill-muted-foreground" fontSize="8" fontWeight="600">{Math.round(maxRev * p / 1000)}K</text></g>))}
      <motion.polygon points={area} fill="url(#ag)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
      <motion.polyline points={revPts} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
      <motion.polyline points={expPts} fill="none" stroke="hsl(var(--destructive))" strokeWidth="1.5" strokeDasharray="5 3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.2 }} />
      {data.map((d, i) => (<g key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} className="cursor-pointer"><circle cx={pad.l + i * xStep} cy={pad.t + h - (d.revenue / maxRev) * h} r={hov === i ? 4 : 2.5} fill="hsl(var(--primary))" /><text x={pad.l + i * xStep} y={pad.t + h + 14} textAnchor="middle" className="fill-muted-foreground" fontSize="7">{lang === 'ar' ? d.name?.slice(0, 3) : d.nameEn}</text>{hov === i && <g><rect x={pad.l + i * xStep - 35} y={pad.t + h - (d.revenue / maxRev) * h - 30} width="70" height="22" rx="5" className="fill-foreground" opacity="0.9" /><text x={pad.l + i * xStep} y={pad.t + h - (d.revenue / maxRev) * h - 15} textAnchor="middle" className="fill-background" fontSize="9" fontWeight="700">{d.revenue.toLocaleString()}</text></g>}</g>))}
    </svg>
  );
};

const SVGBarChart = ({ data, dataKey1, dataKey2, width = 500, height = 180, lang }: { data: any[]; dataKey1: string; dataKey2?: string; width?: number; height?: number; lang: string }) => {
  const pad = { t: 10, r: 10, b: 25, l: 35 };
  const w = width - pad.l - pad.r, h = height - pad.t - pad.b;
  if (!data.length) return <p className="text-center text-muted-foreground text-xs py-6">{lang === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>;
  const max = Math.max(...data.map(d => Math.max(d[dataKey1] || 0, dataKey2 ? d[dataKey2] || 0 : 0)), 1);
  const barW = dataKey2 ? (w / data.length) * 0.3 : (w / data.length) * 0.5;
  const gap = w / data.length;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const h1 = ((d[dataKey1] || 0) / max) * h;
        const h2 = dataKey2 ? ((d[dataKey2] || 0) / max) * h : 0;
        return (<g key={i}>
          <motion.rect x={pad.l + i * gap + gap * 0.1} y={pad.t + h - h1} width={barW} height={h1} rx="3" fill="hsl(var(--primary))" initial={{ height: 0, y: pad.t + h }} animate={{ height: h1, y: pad.t + h - h1 }} transition={{ duration: 0.5, delay: i * 0.04 }} />
          {dataKey2 && <motion.rect x={pad.l + i * gap + gap * 0.1 + barW + 2} y={pad.t + h - h2} width={barW} height={h2} rx="3" fill="#ec4899" initial={{ height: 0, y: pad.t + h }} animate={{ height: h2, y: pad.t + h - h2 }} transition={{ duration: 0.5, delay: i * 0.04 + 0.1 }} />}
          <text x={pad.l + i * gap + gap * 0.5} y={pad.t + h + 14} textAnchor="middle" className="fill-muted-foreground" fontSize="7">{lang === 'ar' ? d.name?.slice(0, 3) : d.nameEn}</text>
        </g>);
      })}
    </svg>
  );
};

const SVGPieChart = ({ data, size = 160 }: { data: { name: string; value: number }[]; size?: number }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <p className="text-center text-muted-foreground text-xs py-4">—</p>;
  const cx = size / 2, cy = size / 2, r = size * 0.35, ir = size * 0.22;
  let cum = -Math.PI / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.filter(d => d.value > 0).map((d, i) => {
        const a = (d.value / total) * Math.PI * 2; const s = cum; cum += a; const e = cum;
        const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s), x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
        const ix1 = cx + ir * Math.cos(s), iy1 = cy + ir * Math.sin(s), ix2 = cx + ir * Math.cos(e), iy2 = cy + ir * Math.sin(e);
        const la = a > Math.PI ? 1 : 0;
        return <motion.path key={i} d={`M${ix1},${iy1} L${x1},${y1} A${r},${r} 0 ${la} 1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 ${la} 0 ${ix1},${iy1}`} fill={COLORS[i % COLORS.length]} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: i * 0.08 }} className="hover:opacity-80 cursor-pointer" style={{ transformOrigin: `${cx}px ${cy}px` }} />;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" className="fill-foreground" fontSize="12" fontWeight="800">{total.toLocaleString()}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-muted-foreground" fontSize="7">Total</text>
    </svg>
  );
};

const GaugeChart = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
  const pct = Math.min(value / (max || 1), 1);
  const r = 50, cx = 60, cy = 60;
  const endA = Math.PI - pct * Math.PI;
  const ex = cx + r * Math.cos(endA), ey = cy - r * Math.sin(endA);
  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
        <motion.path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${ex} ${ey}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground" fontSize="15" fontWeight="800">{Math.round(pct * 100)}%</text>
        <text x={cx} y={cy + 6} textAnchor="middle" className="fill-muted-foreground" fontSize="7">{label}</text>
      </svg>
    </div>
  );
};

const MiniBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="h-2 bg-muted rounded-full overflow-hidden flex-1">
    <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.min((value / (max || 1)) * 100, 100)}%` }} transition={{ duration: 0.8 }} />
  </div>
);

// ──── Wrappers ────
const Card = ({ title, subtitle, icon: Icon, children, className = '' }: { title: string; subtitle?: string; icon?: any; children: React.ReactNode; className?: string }) => (
  <motion.div className={`bg-card border border-border rounded-2xl p-4 ${className}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
    <div className="flex items-start justify-between mb-3">
      <div><h3 className="text-xs font-bold text-foreground">{title}</h3>{subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}</div>
      {Icon && <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0"><Icon size={14} /></div>}
    </div>
    {children}
  </motion.div>
);

const StatMini = ({ label, value, icon: Icon, color, trend }: { label: string; value: string; icon: any; color: string; trend?: string }) => (
  <motion.div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}><Icon size={16} style={{ color }} /></div>
    <div className="flex-1 min-w-0"><p className="text-[10px] text-muted-foreground font-semibold">{label}</p><p className="text-sm font-black text-foreground">{value}</p></div>
    {trend && <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-success' : trend.startsWith('-') ? 'text-destructive' : 'text-muted-foreground'}`}>{trend}</span>}
  </motion.div>
);

const Insight = ({ icon: Icon, title, desc, type }: { icon: any; title: string; desc: string; type: 'success' | 'warning' | 'info' | 'error' }) => {
  const c = { success: 'border-success/30 bg-success/5', warning: 'border-warning/30 bg-warning/5', info: 'border-primary/30 bg-primary/5', error: 'border-destructive/30 bg-destructive/5' };
  const ic = { success: 'text-success bg-success/10', warning: 'text-warning bg-warning/10', info: 'text-primary bg-primary/10', error: 'text-destructive bg-destructive/10' };
  return (
    <motion.div className={`p-3 rounded-xl border ${c[type]} flex items-start gap-3`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ic[type]}`}><Icon size={15} /></div>
      <div><h4 className="text-xs font-bold text-foreground">{title}</h4><p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p></div>
    </motion.div>
  );
};

// ──── Helpers ────
const MO_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MO_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function aggregateByMonth(inv: any[], wInv: any[], purch: any[], expenses: any[], salaries: any[]) {
  const m: Record<number, { revenue: number; expenses: number; invoices: number; weddings: number; regularExp: number; salaryExp: number }> = {};
  for (let i = 0; i < 12; i++) m[i] = { revenue: 0, expenses: 0, invoices: 0, weddings: 0, regularExp: 0, salaryExp: 0 };
  const yr = new Date().getFullYear();
  (inv || []).forEach((x: any) => { const d = new Date(x.created_at || x.date); if (d.getFullYear() === yr) { m[d.getMonth()].revenue += Number(x.total_amount) || 0; m[d.getMonth()].invoices += 1; } });
  (wInv || []).forEach((x: any) => { const d = new Date(x.created_at || x.date || x.wedding_date); if (d.getFullYear() === yr) { m[d.getMonth()].revenue += Number(x.total_amount) || 0; m[d.getMonth()].weddings += 1; } });
  (purch || []).forEach((x: any) => { const d = new Date(x.created_at || x.date || x.purchase_date); if (d.getFullYear() === yr) { m[d.getMonth()].expenses += Number(x.total_cost || x.amount || x.price) || 0; } });
  (expenses || []).forEach((x: any) => { const d = new Date(x.created_at || x.expense_date); if (d.getFullYear() === yr) { const amt = Number(x.amount) || 0; m[d.getMonth()].expenses += amt; m[d.getMonth()].regularExp += amt; } });
  (salaries || []).forEach((x: any) => { const mStr = x.month || ''; const parts = mStr.split('-'); if (parts.length === 2 && Number(parts[0]) === yr) { const amt = Number(x.net_salary) || 0; m[Number(parts[1]) - 1].expenses += amt; m[Number(parts[1]) - 1].salaryExp += amt; } });
  return Array.from({ length: 12 }, (_, i) => ({ name: MO_AR[i], nameEn: MO_EN[i], ...m[i], profit: m[i].revenue - m[i].expenses }));
}

// ──── Main ────
const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ userName }) => {
  const { settings } = useSettings();
  const lang = settings.lang, currency = settings.currency;
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [weddingInvoices, setWeddingInvoices] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'overview' | 'analytics' | 'insights'>('overview');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/invoices.php').catch(() => ({ data: [] })),
      api.get('/weddingInvoices.php').catch(() => ({ data: [] })),
      api.get('/purchases.php').catch(() => ({ data: [] })),
      api.get('/customers.php').catch(() => ({ data: [] })),
      api.get('/expenses.php?path=expenses').catch(() => ({ data: [] })),
      api.get('/expenses.php?path=salaries').catch(() => ({ data: [] })),
    ]).then(([a, b, c, d, e, s]) => {
      setInvoices(Array.isArray(a.data) ? a.data : []);
      setWeddingInvoices(Array.isArray(b.data) ? b.data : []);
      setPurchases(Array.isArray(c.data) ? c.data : []);
      setCustomers(Array.isArray(d.data) ? d.data : []);
      setExpenses(Array.isArray(e.data) ? e.data : []);
      setSalaries(Array.isArray(s.data) ? s.data : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const monthly = useMemo(() => aggregateByMonth(invoices, weddingInvoices, purchases, expenses, salaries), [invoices, weddingInvoices, purchases, expenses, salaries]);
  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  // ── Computed data ──
  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = monthly.reduce((s, m) => s + m.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
  const totalInvoices = invoices.length + weddingInvoices.length;
  const totalCustomers = customers.length;
  const today = new Date().toISOString().slice(0, 10);
  const dailySales = invoices.filter(i => (i.created_at || '').slice(0, 10) === today).reduce((s, i) => s + (Number(i.total_amount) || 0), 0)
    + weddingInvoices.filter(i => (i.created_at || '').slice(0, 10) === today).reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const regRevenue = invoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const wedRevenue = weddingInvoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const avgInvoice = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
  const avgPurchase = purchases.length > 0 ? totalExpenses / purchases.length : 0;
  const cm = new Date().getMonth();
  const pm = cm === 0 ? 11 : cm - 1;
  const cmRev = monthly[cm]?.revenue || 0;
  const pmRev = monthly[pm]?.revenue || 0;
  const revChange = pmRev > 0 ? ((cmRev - pmRev) / pmRev * 100).toFixed(1) : '0';
  const cmInv = monthly[cm]?.invoices + monthly[cm]?.weddings || 0;
  const pmInv = monthly[pm]?.invoices + monthly[pm]?.weddings || 0;
  const invChange = pmInv > 0 ? ((cmInv - pmInv) / pmInv * 100).toFixed(1) : '0';
  const bestMonth = monthly.reduce((best, m, i) => m.revenue > (best?.revenue || 0) ? { ...m, idx: i } : best, { revenue: 0, idx: 0 } as any);
  // worstMonth removed - unused
  const paidInvoices = invoices.filter(i => i.status === 'paid' || Number(i.paid_amount) >= Number(i.total_amount)).length;
  const partialInvoices = invoices.filter(i => i.status === 'partial' || (Number(i.paid_amount) > 0 && Number(i.paid_amount) < Number(i.total_amount))).length;
  const pendingInvoices = invoices.filter(i => i.status === 'pending' || Number(i.paid_amount) === 0).length;
  const collectedAmount = invoices.reduce((s, i) => s + (Number(i.paid_amount) || 0), 0) + weddingInvoices.reduce((s, i) => s + (Number(i.paid_amount) || 0), 0);
  const uncollectedAmount = totalRevenue - collectedAmount;
  const collectionRate = totalRevenue > 0 ? (collectedAmount / totalRevenue * 100) : 0;
  const revenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const monthsWithRevenue = monthly.filter(m => m.revenue > 0).length;
  const avgMonthlyRevenue = monthsWithRevenue > 0 ? totalRevenue / monthsWithRevenue : 0;
  const cumulativeRevenue = monthly.reduce((acc: number[], m) => { acc.push((acc[acc.length - 1] || 0) + m.revenue); return acc; }, []);
  const totalRegularExp = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalSalaries = salaries.reduce((s, e) => s + (Number(e.net_salary) || 0), 0);
  const totalAllExpenses = totalExpenses; // already includes expenses+salaries via aggregateByMonth
  const salaryRatio = totalAllExpenses > 0 ? (totalSalaries / totalAllExpenses * 100) : 0;

  // Top customers
  const customerRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach(i => { const n = i.customer_name || 'Unknown'; map[n] = (map[n] || 0) + (Number(i.total_amount) || 0); });
    weddingInvoices.forEach(i => { const n = i.customer_name || i.groom_name || 'Unknown'; map[n] = (map[n] || 0) + (Number(i.total_amount) || 0); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [invoices, weddingInvoices]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold text-xs">{t('جاري التحميل...', 'Loading...')}</p>
      </motion.div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div>
          <motion.h1 className="text-lg sm:text-xl font-black text-foreground" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            {t(`مرحباً، ${userName}`, `Welcome, ${userName}`)} 👋
          </motion.h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">{t('بيانات حقيقية من الفواتير والمشتريات والعملاء', 'Real data from invoices, purchases & customers')}</p>
        </div>
        <div className="flex gap-1.5">
          {(['overview', 'analytics', 'insights'] as const).map(s => (
            <button key={s} onClick={() => setActiveSection(s)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeSection === s ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {s === 'overview' ? t('نظرة عامة', 'Overview') : s === 'analytics' ? t('تحليلات', 'Analytics') : t('رؤى ذكية', 'Insights')}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {[
          { icon: DollarSign, title: t('إجمالي الإيرادات', 'Total Revenue'), value: `${totalRevenue.toLocaleString()} ${currency}`, change: `${Number(revChange) >= 0 ? '+' : ''}${revChange}%`, pos: Number(revChange) >= 0, grad: 'from-violet-500 to-purple-400' },
          { icon: ShoppingCart, title: t('الفواتير', 'Invoices'), value: totalInvoices.toString(), change: `${Number(invChange) >= 0 ? '+' : ''}${invChange}%`, pos: Number(invChange) >= 0, grad: 'from-emerald-500 to-teal-400' },
          { icon: Users, title: t('العملاء', 'Customers'), value: totalCustomers.toString(), change: `${totalCustomers}`, pos: true, grad: 'from-sky-500 to-cyan-400' },
          { icon: Activity, title: t('مبيعات اليوم', "Today's Sales"), value: `${dailySales.toLocaleString()} ${currency}`, change: dailySales > 0 ? `+${dailySales.toLocaleString()}` : '0', pos: dailySales > 0, grad: 'from-amber-500 to-orange-400' },
        ].map((c, i) => (
          <motion.div key={i} className="relative overflow-hidden rounded-xl p-3 sm:p-4 text-white" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ scale: 1.02 }}>
            <div className={`absolute inset-0 bg-gradient-to-br ${c.grad}`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2"><div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><c.icon size={16} /></div><span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 flex items-center gap-0.5">{c.pos ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{c.change}</span></div>
              <p className="text-white/70 text-[9px] font-bold uppercase tracking-wider mb-0.5">{c.title}</p>
              <h3 className="text-xl sm:text-2xl font-black">{c.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════════════ OVERVIEW ═══════════════ */}
        {activeSection === 'overview' && (
          <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Row 1: Mini stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <StatMini label={t('صافي الربح', 'Net Profit')} value={`${netProfit.toLocaleString()} ${currency}`} icon={Wallet} color="#10b981" trend={netProfit >= 0 ? '+' : '-'} />
              <StatMini label={t('هامش الربح', 'Profit Margin')} value={`${profitMargin.toFixed(1)}%`} icon={Percent} color="#8b5cf6" />
              <StatMini label={t('متوسط الفاتورة', 'Avg Invoice')} value={`${avgInvoice.toFixed(0)} ${currency}`} icon={Receipt} color="#f59e0b" />
              <StatMini label={t('المشتريات', 'Purchases')} value={purchases.length.toString()} icon={Package} color="#ef4444" />
              <StatMini label={t('متوسط الشراء', 'Avg Purchase')} value={`${avgPurchase.toFixed(0)} ${currency}`} icon={CreditCard} color="#ec4899" />
              <StatMini label={t('العائد/عميل', 'Rev/Customer')} value={`${revenuePerCustomer.toFixed(0)} ${currency}`} icon={UserPlus} color="#06b6d4" />
            </div>

            {/* Row 2: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <Card title={t('الإيرادات والمصروفات', 'Revenue & Expenses')} subtitle={t('شهري', 'Monthly')} icon={TrendingUp} className="lg:col-span-2">
                <SVGAreaChart data={monthly} lang={lang} />
                <div className="flex gap-3 mt-2">{[{ c: 'bg-primary', l: t('إيرادات', 'Revenue') }, { c: 'bg-destructive', l: t('مصروفات', 'Expenses') }].map((x, i) => <span key={i} className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground"><span className={`w-2 h-2 rounded-full ${x.c}`} />{x.l}</span>)}</div>
              </Card>
              <Card title={t('توزيع الإيرادات', 'Revenue Split')} icon={PieChart}>
                <div className="flex justify-center"><SVGPieChart data={[{ name: t('عادية', 'Regular'), value: regRevenue }, { name: t('زفاف', 'Wedding'), value: wedRevenue }]} size={140} /></div>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">{[{ n: t('عادية', 'Regular'), c: COLORS[0] }, { n: t('زفاف', 'Wedding'), c: COLORS[1] }].map((x, i) => <span key={i} className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: x.c }} />{x.n}</span>)}</div>
              </Card>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card title={t('الفواتير الشهرية', 'Monthly Invoices')} icon={BarChart3}>
                <SVGBarChart data={monthly} dataKey1="invoices" dataKey2="weddings" lang={lang} />
                <div className="flex gap-3 mt-2">{[{ c: 'bg-primary', l: t('عادية', 'Regular') }, { c: 'bg-pink-500', l: t('زفاف', 'Wedding') }].map((x, i) => <span key={i} className="flex items-center gap-1 text-[8px] font-bold text-muted-foreground"><span className={`w-2 h-2 rounded-full ${x.c}`} />{x.l}</span>)}</div>
              </Card>
              <Card title={t('مقاييس الأداء', 'Performance')} icon={Target}>
                <div className="grid grid-cols-3 gap-1">
                  <GaugeChart value={totalInvoices} max={Math.max(totalInvoices * 1.5, 10)} label={t('فواتير', 'Invoices')} color="hsl(var(--primary))" />
                  <GaugeChart value={totalCustomers} max={Math.max(totalCustomers * 2, 10)} label={t('عملاء', 'Clients')} color="#10b981" />
                  <GaugeChart value={dailySales} max={Math.max(avgMonthlyRevenue / 30, 1000)} label={t('اليوم', 'Today')} color="#f59e0b" />
                </div>
              </Card>
            </div>

            {/* Row 4: Payment & Collection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <StatMini label={t('مدفوعة', 'Paid')} value={paidInvoices.toString()} icon={CheckCircle} color="#10b981" />
              <StatMini label={t('جزئية', 'Partial')} value={partialInvoices.toString()} icon={Clock} color="#f59e0b" />
              <StatMini label={t('معلقة', 'Pending')} value={pendingInvoices.toString()} icon={AlertTriangle} color="#ef4444" />
              <StatMini label={t('محصّل', 'Collected')} value={`${collectedAmount.toLocaleString()}`} icon={DollarSign} color="#10b981" />
              <StatMini label={t('غير محصّل', 'Uncollected')} value={`${uncollectedAmount.toLocaleString()}`} icon={TrendingDown} color="#ef4444" />
            </div>

            {/* Row 5: Top Customers + Recent Invoices */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card title={t('أفضل العملاء', 'Top Customers')} icon={Award}>
                <div className="space-y-2">
                  {customerRevenue.length === 0 && <p className="text-center text-muted-foreground text-[10px] py-3">{t('لا يوجد بيانات', 'No data')}</p>}
                  {customerRevenue.map(([name, rev], i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-primary w-5">{i + 1}</span>
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">{name.charAt(0)}</div>
                      <span className="text-xs font-semibold text-foreground flex-1 truncate">{name}</span>
                      <span className="text-[10px] font-black text-foreground">{rev.toLocaleString()} {currency}</span>
                      <MiniBar value={rev} max={customerRevenue[0]?.[1] || 1} color="hsl(var(--primary))" />
                    </div>
                  ))}
                </div>
              </Card>
              <Card title={t('أحدث الفواتير', 'Recent Invoices')} icon={Receipt}>
                <div className="space-y-1.5">
                  {invoices.slice(0, 5).map((inv, i) => (
                    <div key={inv.id || i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-all">
                      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold">#{inv.id}</div><div><p className="text-[11px] font-semibold text-foreground">{inv.customer_name || t('عميل', 'Customer')}</p><p className="text-[9px] text-muted-foreground">{inv.created_at?.slice(0, 10)}</p></div></div>
                      <span className="text-[11px] font-black text-foreground">{Number(inv.total_amount || 0).toLocaleString()} {currency}</span>
                    </div>
                  ))}
                  {invoices.length === 0 && <p className="text-center text-muted-foreground text-[10px] py-3">{t('لا توجد فواتير', 'No invoices')}</p>}
                </div>
              </Card>
            </div>

            {/* Row 6: Monthly profit bars */}
            <Card title={t('الأرباح الشهرية', 'Monthly Profits')} icon={BarChart3}>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                {monthly.map((m, i) => {
                  const maxP = Math.max(...monthly.map(x => Math.abs(x.profit)), 1);
                  const pct = Math.abs(m.profit) / maxP * 100;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="h-16 w-full flex items-end justify-center">
                        <motion.div className="w-full max-w-[20px] rounded-t-sm" style={{ background: m.profit >= 0 ? '#10b981' : '#ef4444' }} initial={{ height: 0 }} animate={{ height: `${pct}%` }} transition={{ duration: 0.5, delay: i * 0.03 }} />
                      </div>
                      <span className="text-[7px] font-bold text-muted-foreground">{lang === 'ar' ? m.name.slice(0, 3) : m.nameEn}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Row 7: Collection rate + Expenses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <StatMini label={t('معدل التحصيل', 'Collection Rate')} value={`${collectionRate.toFixed(1)}%`} icon={Percent} color="#10b981" />
              <StatMini label={t('إجمالي المصروفات', 'Total Expenses')} value={`${totalExpenses.toLocaleString()} ${currency}`} icon={TrendingDown} color="#ef4444" />
              <StatMini label={t('متوسط شهري', 'Monthly Avg')} value={`${avgMonthlyRevenue.toFixed(0)} ${currency}`} icon={Calendar} color="#8b5cf6" />
            </div>
          </motion.div>
        )}

        {/* ═══════════════ ANALYTICS ═══════════════ */}
        {activeSection === 'analytics' && (
          <motion.div key="an" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Row 1: Profit analysis */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatMini label={t('إجمالي الإيرادات', 'Total Revenue')} value={`${totalRevenue.toLocaleString()}`} icon={ArrowUp} color="#10b981" />
              <StatMini label={t('إجمالي المصروفات', 'Total Expenses')} value={`${totalExpenses.toLocaleString()}`} icon={ArrowDown} color="#ef4444" />
              <StatMini label={t('صافي الربح', 'Net Profit')} value={`${netProfit.toLocaleString()}`} icon={Wallet} color={netProfit >= 0 ? '#10b981' : '#ef4444'} />
              <StatMini label={t('هامش الربح', 'Margin')} value={`${profitMargin.toFixed(1)}%`} icon={Percent} color="#8b5cf6" />
            </div>

            {/* Row 2: Waterfall + Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card title={t('تحليل الربح', 'Profit Breakdown')} icon={Layers}>
                <div className="space-y-2">
                  {[
                    { name: t('الإيرادات', 'Revenue'), value: totalRevenue, color: '#10b981', type: 'pos' },
                    { name: t('فواتير عادية', 'Regular'), value: regRevenue, color: '#8b5cf6', type: 'pos' },
                    { name: t('فواتير زفاف', 'Wedding'), value: wedRevenue, color: '#0ea5e9', type: 'pos' },
                    { name: t('المصروفات', 'Expenses'), value: totalExpenses, color: '#ef4444', type: 'neg' },
                    { name: t('صافي', 'Net'), value: netProfit, color: netProfit >= 0 ? '#10b981' : '#ef4444', type: netProfit >= 0 ? 'pos' : 'neg' },
                  ].map((item, i) => (
                    <motion.div key={i} className="flex items-center gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                      <span className="w-16 text-[9px] font-bold text-muted-foreground text-end truncate">{item.name}</span>
                      <MiniBar value={Math.abs(item.value)} max={Math.max(totalRevenue, totalExpenses, 1)} color={item.color} />
                      <span className={`text-[9px] font-black w-14 text-end ${item.type === 'neg' ? 'text-destructive' : 'text-success'}`}>{(item.value / 1000).toFixed(1)}K</span>
                    </motion.div>
                  ))}
                </div>
              </Card>
              <Card title={t('اتجاه الإيرادات', 'Revenue Trend')} icon={TrendingUp}>
                <SVGAreaChart data={monthly} lang={lang} height={180} />
              </Card>
            </div>

            {/* Row 3: Monthly table */}
            <Card title={t('الجدول الشهري', 'Monthly Breakdown')} icon={Calendar}>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead><tr className="border-b border-border">{[t('الشهر', 'Month'), t('إيرادات', 'Revenue'), t('مصروفات', 'Expenses'), t('ربح', 'Profit'), t('فواتير', 'Inv'), t('زفاف', 'Wed')].map((h, i) => <th key={i} className="py-2 px-1 text-muted-foreground font-bold text-start">{h}</th>)}</tr></thead>
                  <tbody>{monthly.map((m, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-1.5 px-1 font-bold text-foreground">{lang === 'ar' ? m.name : m.nameEn}</td>
                      <td className="py-1.5 px-1 text-success font-bold">{m.revenue.toLocaleString()}</td>
                      <td className="py-1.5 px-1 text-destructive font-bold">{m.expenses.toLocaleString()}</td>
                      <td className={`py-1.5 px-1 font-black ${m.profit >= 0 ? 'text-success' : 'text-destructive'}`}>{m.profit.toLocaleString()}</td>
                      <td className="py-1.5 px-1 font-bold">{m.invoices}</td>
                      <td className="py-1.5 px-1 font-bold">{m.weddings}</td>
                    </tr>
                  ))}</tbody>
                  <tfoot><tr className="border-t-2 border-border font-black">
                    <td className="py-2 px-1">{t('الإجمالي', 'Total')}</td>
                    <td className="py-2 px-1 text-success">{totalRevenue.toLocaleString()}</td>
                    <td className="py-2 px-1 text-destructive">{totalExpenses.toLocaleString()}</td>
                    <td className={`py-2 px-1 ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>{netProfit.toLocaleString()}</td>
                    <td className="py-2 px-1">{invoices.length}</td>
                    <td className="py-2 px-1">{weddingInvoices.length}</td>
                  </tr></tfoot>
                </table>
              </div>
            </Card>

            {/* Row 4: Comparison cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <StatMini label={t('أفضل شهر', 'Best Month')} value={lang === 'ar' ? MO_AR[bestMonth.idx] : MO_EN[bestMonth.idx]} icon={Star} color="#f59e0b" />
              <StatMini label={t('إيرادات أفضل شهر', 'Best Revenue')} value={`${bestMonth.revenue?.toLocaleString()}`} icon={Award} color="#10b981" />
              <StatMini label={t('فواتير عادية', 'Regular Inv')} value={invoices.length.toString()} icon={FileText} color="#8b5cf6" />
              <StatMini label={t('فواتير زفاف', 'Wedding Inv')} value={weddingInvoices.length.toString()} icon={Heart} color="#ec4899" />
              <StatMini label={t('نسبة الزفاف', 'Wedding %')} value={totalRevenue > 0 ? `${(wedRevenue / totalRevenue * 100).toFixed(0)}%` : '0%'} icon={PieChart} color="#06b6d4" />
              <StatMini label={t('عدد المشتريات', 'Purchases')} value={purchases.length.toString()} icon={ShoppingCart} color="#ef4444" />
            </div>

            {/* Row 5: Cumulative revenue */}
            <Card title={t('الإيرادات التراكمية', 'Cumulative Revenue')} icon={TrendingUp}>
              <SVGBarChart data={monthly.map((m, i) => ({ ...m, cumulative: cumulativeRevenue[i] }))} dataKey1="cumulative" lang={lang} />
            </Card>

            {/* Row 6: Expense analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card title={t('المصروفات الشهرية', 'Monthly Expenses')} icon={TrendingDown}>
                <SVGBarChart data={monthly} dataKey1="expenses" lang={lang} />
              </Card>
              <Card title={t('أحدث المشتريات', 'Recent Purchases')} icon={ShoppingCart}>
                <div className="space-y-1.5">
                  {purchases.slice(0, 5).map((p, i) => (
                    <div key={p.id || i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center text-destructive text-[9px] font-bold"><Package size={12} /></div><div><p className="text-[11px] font-semibold text-foreground truncate max-w-[120px]">{p.item_name || p.description || t('مشتريات', 'Purchase')}</p><p className="text-[9px] text-muted-foreground">{(p.created_at || p.purchase_date || '').slice(0, 10)}</p></div></div>
                      <span className="text-[11px] font-black text-destructive">{Number(p.total_cost || p.amount || p.price || 0).toLocaleString()} {currency}</span>
                    </div>
                  ))}
                  {purchases.length === 0 && <p className="text-center text-muted-foreground text-[10px] py-3">{t('لا توجد مشتريات', 'No purchases')}</p>}
                </div>
              </Card>
            </div>

            {/* Row 7: Payment status pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <Card title={t('حالة الدفع', 'Payment Status')} icon={CreditCard}>
                <SVGPieChart data={[{ name: t('مدفوعة', 'Paid'), value: paidInvoices }, { name: t('جزئية', 'Partial'), value: partialInvoices }, { name: t('معلقة', 'Pending'), value: pendingInvoices }]} size={120} />
              </Card>
              <Card title={t('التحصيل', 'Collection')} icon={DollarSign}>
                <div className="space-y-3 mt-2">
                  {[{ l: t('محصّل', 'Collected'), v: collectedAmount, c: '#10b981' }, { l: t('غير محصّل', 'Uncollected'), v: uncollectedAmount, c: '#ef4444' }].map((x, i) => (
                    <div key={i}><div className="flex justify-between mb-1"><span className="text-[10px] font-bold text-muted-foreground">{x.l}</span><span className="text-[10px] font-black" style={{ color: x.c }}>{x.v.toLocaleString()}</span></div><MiniBar value={x.v} max={totalRevenue || 1} color={x.c} /></div>
                  ))}
                </div>
              </Card>
              <Card title={t('مقارنة الشهر الحالي/السابق', 'Current vs Last Month')} icon={BarChart3}>
                <div className="space-y-3 mt-2">
                  {[{ l: t('الحالي', 'Current'), v: cmRev }, { l: t('السابق', 'Previous'), v: pmRev }].map((x, i) => (
                    <div key={i}><div className="flex justify-between mb-1"><span className="text-[10px] font-bold text-muted-foreground">{x.l}</span><span className="text-[10px] font-black text-foreground">{x.v.toLocaleString()}</span></div><MiniBar value={x.v} max={Math.max(cmRev, pmRev, 1)} color={i === 0 ? 'hsl(var(--primary))' : '#94a3b8'} /></div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ═══════════════ INSIGHTS ═══════════════ */}
        {activeSection === 'insights' && (
          <motion.div key="in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Row 1: Score cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatMini label={t('درجة الأداء', 'Performance')} value={`${Math.min(Math.round((totalRevenue / (totalRevenue + totalExpenses || 1)) * 100), 100)}/100`} icon={Zap} color="#8b5cf6" />
              <StatMini label={t('صحة الأعمال', 'Health')} value={profitMargin > 30 ? t('ممتاز', 'Excellent') : profitMargin > 10 ? t('جيد', 'Good') : t('ضعيف', 'Weak')} icon={Activity} color={profitMargin > 30 ? '#10b981' : '#f59e0b'} />
              <StatMini label={t('نمو الإيرادات', 'Revenue Growth')} value={`${revChange}%`} icon={TrendingUp} color={Number(revChange) >= 0 ? '#10b981' : '#ef4444'} trend={`${Number(revChange) >= 0 ? '+' : ''}${revChange}%`} />
              <StatMini label={t('التنوع', 'Diversification')} value={wedRevenue > 0 && regRevenue > 0 ? t('متوازن', 'Balanced') : t('أحادي', 'Single')} icon={Layers} color="#06b6d4" />
            </div>

            {/* Row 2: Actionable Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5"><Brain size={14} className="text-primary" />{t('إجراءات مقترحة لزيادة المبيعات', 'Actionable Steps to Boost Sales')}</h3>
                
                {/* ── Collection & Cash Flow ── */}
                {collectionRate < 60 && totalRevenue > 0 && <Insight icon={AlertTriangle} title={t('🚨 تحصيل حرج — تدخل فوري مطلوب', '🚨 Critical Collection')} desc={t(
                  `معدل التحصيل ${collectionRate.toFixed(0)}% فقط! لديك ${uncollectedAmount.toLocaleString()} ${currency} غير محصّل. الإجراء: تواصل فوراً مع العملاء المتأخرين عبر الواتساب أو الهاتف، واعرض خطط تقسيط للمبالغ الكبيرة، وحدد موعد نهائي للسداد مع كل عميل.`,
                  `Only ${collectionRate.toFixed(0)}% collected! ${uncollectedAmount.toLocaleString()} ${currency} outstanding. Action: Contact overdue clients immediately via WhatsApp/phone, offer installment plans for large amounts, set firm deadlines.`
                )} type="error" />}
                {collectionRate >= 60 && collectionRate < 85 && totalRevenue > 0 && <Insight icon={CreditCard} title={t('⚠️ حسّن التحصيل — خطة أسبوعية', '⚠️ Improve Collection')} desc={t(
                  `معدل التحصيل ${collectionRate.toFixed(0)}%. الإجراء: خصص يوم أسبوعياً للمتابعة مع العملاء المتأخرين. أرسل تذكير واتساب تلقائي قبل موعد السداد بـ3 أيام. قدّم خصم 5% للدفع المبكر كحافز.`,
                  `${collectionRate.toFixed(0)}% collected. Action: Dedicate one day/week for follow-ups. Send auto WhatsApp reminders 3 days before due dates. Offer 5% early payment discount.`
                )} type="warning" />}
                {collectionRate >= 85 && totalRevenue > 0 && <Insight icon={CheckCircle} title={t('✅ تحصيل ممتاز — حافظ على المستوى', '✅ Excellent Collection')} desc={t(
                  `معدل التحصيل ${collectionRate.toFixed(0)}% — ممتاز! الإجراء: حافظ على نفس سياسة المتابعة. فكّر في تقديم برنامج ولاء للعملاء الملتزمين بالدفع مثل خصم 10% على الحجز التالي.`,
                  `${collectionRate.toFixed(0)}% collected — excellent! Action: Maintain follow-up policy. Consider loyalty program for on-time payers like 10% off next booking.`
                )} type="success" />}

                {/* ── Profit Margin ── */}
                {profitMargin < 0 && <Insight icon={AlertTriangle} title={t('🔴 خسارة صافية — إعادة هيكلة فورية', '🔴 Net Loss — Restructure Now')} desc={t(
                  `المصروفات (${totalExpenses.toLocaleString()}) تتجاوز الإيرادات (${totalRevenue.toLocaleString()})! الإجراء: 1) راجع كل بند مشتريات واحذف غير الضروري. 2) ارفع أسعار الباقات بنسبة 15-20%. 3) تفاوض مع الموردين على أسعار أفضل. 4) قلل المصاريف الثابتة (إيجار، رواتب إضافية).`,
                  `Expenses (${totalExpenses.toLocaleString()}) exceed revenue (${totalRevenue.toLocaleString()})! Action: 1) Review all purchases, cut unnecessary ones. 2) Raise package prices 15-20%. 3) Negotiate better supplier rates. 4) Reduce fixed costs.`
                )} type="error" />}
                {profitMargin > 0 && profitMargin <= 20 && <Insight icon={Target} title={t('⚠️ هامش ربح ضعيف — ارفع الأسعار', '⚠️ Low Margin — Raise Prices')} desc={t(
                  `هامش الربح ${profitMargin.toFixed(1)}% فقط (المثالي +30%). الإجراء: 1) ارفع سعر الباقات الأقل ربحية بنسبة 10%. 2) أضف خدمات إضافية (طباعة فورية، فيديو قصير) برسوم إضافية. 3) قلل تكاليف المواد بالشراء بالجملة.`,
                  `Only ${profitMargin.toFixed(1)}% margin (ideal is 30%+). Action: 1) Raise prices on low-margin packages by 10%. 2) Add upsell services (instant prints, short videos). 3) Reduce material costs by bulk buying.`
                )} type="warning" />}
                {profitMargin > 20 && profitMargin <= 40 && <Insight icon={Award} title={t('👍 هامش ربح جيد — فرصة للتطوير', '👍 Good Margin — Room to Grow')} desc={t(
                  `هامش الربح ${profitMargin.toFixed(1)}% — جيد! الإجراء: استثمر جزء من الأرباح في التسويق الرقمي (إعلانات انستجرام وفيسبوك) لجذب عملاء جدد. خصص 10% من الأرباح للتسويق شهرياً.`,
                  `${profitMargin.toFixed(1)}% margin — good! Action: Invest part of profits in digital marketing (Instagram/Facebook ads) to attract new clients. Allocate 10% of profits for monthly marketing.`
                )} type="success" />}
                {profitMargin > 40 && <Insight icon={Star} title={t('🌟 هامش ربح ممتاز — وسّع نشاطك', '🌟 Excellent Margin — Scale Up')} desc={t(
                  `هامش الربح ${profitMargin.toFixed(1)}% — ممتاز جداً! الإجراء: فكّر في فتح فرع ثاني أو توظيف مصور إضافي. استثمر في معدات أفضل لتقديم خدمة بريميوم بسعر أعلى.`,
                  `${profitMargin.toFixed(1)}% margin — outstanding! Action: Consider opening a second branch or hiring another photographer. Invest in better equipment for premium service at higher prices.`
                )} type="success" />}

                {/* ── Revenue Growth ── */}
                {Number(revChange) < -20 && <Insight icon={TrendingDown} title={t('📉 انخفاض حاد — خطة إنقاذ عاجلة', '📉 Sharp Decline — Rescue Plan')} desc={t(
                  `انخفاض ${Math.abs(Number(revChange)).toFixed(0)}% عن الشهر السابق! الإجراء: 1) أطلق عرض خاص "خصم 20% لمدة أسبوع" لتنشيط المبيعات. 2) تواصل مع العملاء السابقين واعرض خدمات جديدة. 3) انشر محتوى يومي على السوشيال ميديا (قبل/بعد الصور). 4) تعاون مع صالونات وقاعات أفراح للإحالات المتبادلة.`,
                  `${Math.abs(Number(revChange)).toFixed(0)}% drop vs last month! Action: 1) Launch "20% off this week" flash sale. 2) Reach out to past clients with new services. 3) Post daily before/after content on social media. 4) Partner with salons and venues for referrals.`
                )} type="error" />}
                {Number(revChange) >= -20 && Number(revChange) < 0 && <Insight icon={TrendingDown} title={t('📊 انخفاض طفيف — تنشيط مطلوب', '📊 Slight Decline')} desc={t(
                  `انخفاض ${Math.abs(Number(revChange)).toFixed(0)}% عن الشهر السابق. الإجراء: أرسل عروض شخصية للعملاء الذين لم يحجزوا منذ 3 أشهر. أضف باقة اقتصادية جديدة لجذب شريحة أكبر.`,
                  `${Math.abs(Number(revChange)).toFixed(0)}% drop. Action: Send personalized offers to clients inactive for 3+ months. Add a budget-friendly package to attract more clients.`
                )} type="warning" />}
                {Number(revChange) > 10 && <Insight icon={TrendingUp} title={t('🚀 نمو قوي — استغل الزخم!', '🚀 Strong Growth!')} desc={t(
                  `نمو ${revChange}% عن الشهر السابق — ممتاز! الإجراء: استغل هذا الزخم بزيادة الأسعار تدريجياً 5-10%. اطلب من العملاء الراضين تقييمات على جوجل وانستجرام. وثّق أفضل أعمالك كبورتفوليو جذاب.`,
                  `${revChange}% growth — excellent! Action: Leverage momentum by gradually raising prices 5-10%. Ask satisfied clients for Google/Instagram reviews. Document best work as an attractive portfolio.`
                )} type="success" />}

                {/* ── Customer Base ── */}
                {totalCustomers < 20 && <Insight icon={UserPlus} title={t('👥 قاعدة عملاء صغيرة — وسّعها!', '👥 Small Client Base')} desc={t(
                  `لديك ${totalCustomers} عميل فقط. الإجراء: 1) أنشئ برنامج إحالة "ادعو صديق واحصل على خصم 15%". 2) سجّل في منصات حجز الأستوديوهات المحلية. 3) قدّم جلسة تصوير مجانية مصغرة كتجربة أولى. 4) تواجد في المعارض والفعاليات المحلية.`,
                  `Only ${totalCustomers} clients. Action: 1) Create "Refer a friend, get 15% off" program. 2) List on local studio booking platforms. 3) Offer a free mini photo session as first experience. 4) Attend local exhibitions and events.`
                )} type="warning" />}
                {totalCustomers >= 20 && totalCustomers < 50 && <Insight icon={Users} title={t('👥 قاعدة عملاء متوسطة — طوّر العلاقات', '👥 Medium Client Base')} desc={t(
                  `لديك ${totalCustomers} عميل. الإجراء: ركّز على الاحتفاظ بالعملاء الحاليين. أرسل تهنئة في المناسبات (أعياد ميلاد، ذكرى زواج) مع عرض خاص. أنشئ مجموعة واتساب VIP للعملاء المميزين.`,
                  `${totalCustomers} clients. Action: Focus on retention. Send greetings on occasions (birthdays, anniversaries) with special offers. Create VIP WhatsApp group for top clients.`
                )} type="info" />}
                {totalCustomers >= 50 && <Insight icon={Star} title={t('🌟 قاعدة عملاء قوية — حوّلهم لسفراء', '🌟 Strong Client Base')} desc={t(
                  `لديك ${totalCustomers} عميل — قاعدة ممتازة! الإجراء: أنشئ برنامج ولاء بنقاط: كل 100 ${currency} = نقطة، 10 نقاط = جلسة مجانية. اطلب تقييمات ومشاركات على السوشيال ميديا.`,
                  `${totalCustomers} clients — excellent! Action: Create points loyalty program: every 100 ${currency} = 1 point, 10 points = free session. Request social media reviews and shares.`
                )} type="success" />}

                {/* ── Wedding vs Studio Balance ── */}
                {wedRevenue === 0 && totalRevenue > 0 && <Insight icon={Sparkles} title={t('💡 فرصة ضائعة — خدمات الزفاف', '💡 Missing Opportunity — Weddings')} desc={t(
                  `لا توجد إيرادات من الزفاف! الزفاف مصدر دخل ممتاز. الإجراء: 1) أنشئ 3 باقات زفاف (اقتصادية، متوسطة، فاخرة). 2) تواصل مع قاعات الأفراح والمنظمين. 3) أنشئ حساب انستجرام مخصص لتصوير الزفاف. 4) اعرض أعمال سابقة (حتى لو مجانية أولاً).`,
                  `No wedding revenue! Weddings are a great income source. Action: 1) Create 3 wedding packages (budget, standard, premium). 2) Partner with venues and planners. 3) Create dedicated Instagram for wedding photography. 4) Showcase past work.`
                )} type="warning" />}
                {wedRevenue > 0 && regRevenue > 0 && wedRevenue / totalRevenue < 0.3 && <Insight icon={Sparkles} title={t('💡 زِد حصة الزفاف', '💡 Grow Wedding Share')} desc={t(
                  `الزفاف يمثل ${(wedRevenue / totalRevenue * 100).toFixed(0)}% فقط من إيراداتك. الإجراء: ارفع أسعار باقات الزفاف 10% (الطلب مرن). أضف خدمات إضافية: ألبوم ديجيتال، فيديو هايلايت، طباعة كانفاس. تواجد في معارض الأعراس.`,
                  `Weddings = only ${(wedRevenue / totalRevenue * 100).toFixed(0)}% of revenue. Action: Raise wedding prices 10% (demand is elastic). Add extras: digital album, highlight video, canvas prints. Attend wedding expos.`
                )} type="info" />}
                {wedRevenue > 0 && regRevenue > 0 && wedRevenue / totalRevenue >= 0.3 && wedRevenue / totalRevenue <= 0.7 && <Insight icon={CheckCircle} title={t('✅ توزيع متوازن للخدمات', '✅ Balanced Service Mix')} desc={t(
                  `الاستوديو ${(regRevenue / totalRevenue * 100).toFixed(0)}% والزفاف ${(wedRevenue / totalRevenue * 100).toFixed(0)}% — توزيع ممتاز يقلل المخاطر. الإجراء: حافظ على هذا التوازن وطوّر كلا الخدمتين بالتوازي.`,
                  `Studio ${(regRevenue / totalRevenue * 100).toFixed(0)}% and Wedding ${(wedRevenue / totalRevenue * 100).toFixed(0)}% — great balance reducing risk. Action: Maintain this balance and develop both services equally.`
                )} type="success" />}

                {/* ── Average Transaction ── */}
                {avgInvoice > 0 && avgInvoice < 500 && <Insight icon={DollarSign} title={t('💰 ارفع متوسط الفاتورة', '💰 Increase Avg Invoice')} desc={t(
                  `متوسط الفاتورة ${avgInvoice.toFixed(0)} ${currency} فقط. الإجراء: 1) أنشئ باقات "كومبو" تجمع عدة خدمات بسعر أعلى. 2) اعرض ترقية الباقة عند كل حجز "أضف 3 صور إضافية بـ50 ${currency} فقط". 3) أضف منتجات تكميلية (إطارات، طباعة كبيرة، USB).`,
                  `Avg invoice only ${avgInvoice.toFixed(0)} ${currency}. Action: 1) Create "combo" packages bundling services. 2) Offer upgrades at booking: "Add 3 extra photos for just 50 ${currency}". 3) Add complementary products (frames, large prints, USB).`
                )} type="warning" />}
                {avgInvoice >= 500 && <Insight icon={DollarSign} title={t('👍 متوسط فاتورة جيد', '👍 Good Avg Invoice')} desc={t(
                  `متوسط الفاتورة ${avgInvoice.toFixed(0)} ${currency}. الإجراء: حافظ على هذا المستوى بتقديم قيمة مضافة مستمرة. جرّب باقة "بريميوم" بسعر أعلى 50% مع خدمات حصرية (تصوير في الهواء الطلق، مكياج، ستايلست).`,
                  `Avg invoice ${avgInvoice.toFixed(0)} ${currency}. Action: Maintain by continuously adding value. Try a "Premium" package 50% higher with exclusive services (outdoor shoot, makeup, stylist).`
                )} type="success" />}

                {/* ── Seasonality ── */}
                <Insight icon={Calendar} title={t('📅 تحليل الموسمية', '📅 Seasonality Analysis')} desc={t(
                  `أفضل شهر: ${MO_AR[bestMonth.idx]} (${bestMonth.revenue?.toLocaleString()} ${currency}). الإجراء: جهّز عروض وحملات تسويقية قبل الأشهر القوية بشهر. في الأشهر الضعيفة، قدّم خصومات 15-25% لتحفيز الحجوزات وملء الفراغات.`,
                  `Best month: ${MO_EN[bestMonth.idx]} (${bestMonth.revenue?.toLocaleString()} ${currency}). Action: Prepare promotions 1 month before peak months. In slow months, offer 15-25% discounts to fill gaps.`
                )} type="info" />

                {/* ── Daily Target ── */}
                <Insight icon={Target} title={t('🎯 هدفك اليومي', '🎯 Your Daily Target')} desc={t(
                  `لزيادة إيراداتك 20% تحتاج تحقيق ${Math.ceil((avgMonthlyRevenue * 1.2) / 25).toLocaleString()} ${currency} يومياً (25 يوم عمل). الإجراء: قسّم الهدف: ${Math.ceil((avgMonthlyRevenue * 1.2) / 25 / avgInvoice || 1)} فاتورة يومياً بمتوسط ${avgInvoice.toFixed(0)} ${currency}. تابع تحقيق الهدف اليومي.`,
                  `To grow 20%, target ${Math.ceil((avgMonthlyRevenue * 1.2) / 25).toLocaleString()} ${currency}/day (25 work days). Action: Break it down: ${Math.ceil((avgMonthlyRevenue * 1.2) / 25 / avgInvoice || 1)} invoices/day at avg ${avgInvoice.toFixed(0)} ${currency}. Track daily goal.`
                )} type="info" />

                {/* ── Expenses ── */}
                {totalExpenses > totalRevenue * 0.7 && totalRevenue > 0 && <Insight icon={Package} title={t('🔴 مصروفات مرتفعة جداً', '🔴 Very High Expenses')} desc={t(
                  `المصروفات تمثل ${(totalExpenses / totalRevenue * 100).toFixed(0)}% من الإيرادات! الإجراء: 1) راجع أكبر 5 بنود مصروفات واحذف أو قلل غير الضروري. 2) تفاوض مع الموردين على خصم 10-15% للشراء بالجملة. 3) قارن أسعار الموردين المختلفين كل 3 أشهر.`,
                  `Expenses = ${(totalExpenses / totalRevenue * 100).toFixed(0)}% of revenue! Action: 1) Review top 5 expense items, cut unnecessary ones. 2) Negotiate 10-15% bulk discounts with suppliers. 3) Compare supplier prices quarterly.`
                )} type="error" />}
                {totalExpenses > 0 && totalExpenses <= totalRevenue * 0.7 && <Insight icon={Package} title={t('📦 إدارة مصروفات معقولة', '📦 Reasonable Expenses')} desc={t(
                  `المصروفات ${(totalExpenses / totalRevenue * 100).toFixed(0)}% من الإيرادات. الإجراء: حافظ على هذه النسبة. سجّل كل مصروف صغير لتتبع دقيق. خصص ميزانية شهرية ثابتة ولا تتجاوزها.`,
                  `Expenses = ${(totalExpenses / totalRevenue * 100).toFixed(0)}% of revenue. Action: Maintain this ratio. Log every expense for accurate tracking. Set a fixed monthly budget and stick to it.`
                )} type="info" />}

                {/* ── Salaries & Regular Expenses ── */}
                {totalSalaries > 0 && <Insight icon={Users} title={t('👔 تحليل المرتبات', '👔 Salary Analysis')} desc={t(
                  `إجمالي المرتبات ${totalSalaries.toLocaleString()} ${currency} (${salaryRatio.toFixed(0)}% من إجمالي المصروفات). الإجراء: إذا تجاوزت المرتبات 40% من الإيرادات، راجع عدد الموظفين أو زِد الإنتاجية. فكّر في نظام حوافز مرتبط بالأداء بدلاً من زيادات ثابتة.`,
                  `Total salaries: ${totalSalaries.toLocaleString()} ${currency} (${salaryRatio.toFixed(0)}% of expenses). Action: If salaries exceed 40% of revenue, review headcount or boost productivity. Consider performance-based bonuses instead of fixed raises.`
                )} type={totalSalaries > totalRevenue * 0.4 ? 'warning' : 'info'} />}

                {totalRegularExp > 0 && <Insight icon={Receipt} title={t('📋 تحليل المصاريف العادية', '📋 Regular Expenses Analysis')} desc={t(
                  `إجمالي المصاريف العادية ${totalRegularExp.toLocaleString()} ${currency}. الإجراء: راجع كل بند شهرياً وحدد أي مصروف يمكن تقليله أو إلغاؤه. قارن فواتير الكهرباء والمياه بالأشهر السابقة. استخدم إضاءة LED وأجهزة موفرة للطاقة.`,
                  `Total regular expenses: ${totalRegularExp.toLocaleString()} ${currency}. Action: Review each item monthly and identify what can be reduced or eliminated. Compare utility bills with previous months. Use LED lighting and energy-efficient equipment.`
                )} type="info" />}

                {(totalSalaries + totalRegularExp) > totalRevenue * 0.5 && totalRevenue > 0 && <Insight icon={AlertTriangle} title={t('⚠️ المصاريف الثابتة مرتفعة', '⚠️ High Fixed Costs')} desc={t(
                  `المصاريف الثابتة (مرتبات + مصاريف عادية) = ${(totalSalaries + totalRegularExp).toLocaleString()} ${currency} وهي ${((totalSalaries + totalRegularExp) / totalRevenue * 100).toFixed(0)}% من الإيرادات! الإجراء: حاول أن لا تتجاوز المصاريف الثابتة 35% من الإيرادات. فكّر في تقليل ساعات العمل غير المنتجة أو مشاركة المساحة.`,
                  `Fixed costs (salaries + regular expenses) = ${(totalSalaries + totalRegularExp).toLocaleString()} ${currency} which is ${((totalSalaries + totalRegularExp) / totalRevenue * 100).toFixed(0)}% of revenue! Action: Keep fixed costs under 35% of revenue. Consider reducing unproductive hours or sharing workspace.`
                )} type="error" />}

                {/* ── Marketing Tips ── */}
                <Insight icon={Lightbulb} title={t('📱 نصائح تسويقية فورية', '📱 Quick Marketing Tips')} desc={t(
                  `الإجراء الفوري: 1) انشر 3 بوستات أسبوعياً على انستجرام (قبل/بعد، كواليس، شهادات عملاء). 2) أنشئ ستوري يومي يظهر عملك الحالي. 3) استخدم هاشتاجات محلية (#تصوير_[مدينتك]). 4) رد على كل تعليق ورسالة خلال ساعة. 5) تعاون مع مؤثرين محليين بتصوير مجاني مقابل ترويج.`,
                  `Immediate action: 1) Post 3x/week on Instagram (before/after, behind scenes, testimonials). 2) Daily stories showing current work. 3) Use local hashtags. 4) Reply to every comment/DM within 1 hour. 5) Collab with local influencers: free shoot for promotion.`
                )} type="info" />

                {/* ── Pricing Strategy ── */}
                <Insight icon={Wallet} title={t('💲 استراتيجية التسعير الذكي', '💲 Smart Pricing Strategy')} desc={t(
                  `الإجراء: 1) اعتمد 3 مستويات تسعير (اقتصادي، متوسط، فاخر) — معظم العملاء سيختارون المتوسط. 2) أضف باقة "الأكثر شعبية" واجعلها مرئية بوضوح. 3) لا تعرض السعر الأرخص أولاً — ابدأ بالأغلى. 4) أضف قيمة بدل تخفيض السعر (صورة إضافية مجاناً > خصم 10%).`,
                  `Action: 1) Offer 3 pricing tiers (budget, standard, premium) — most clients pick the middle. 2) Label one "Most Popular" and highlight it. 3) Show highest price first, not cheapest. 4) Add value instead of discounting (free extra photo > 10% off).`
                )} type="info" />

                {totalInvoices === 0 && totalCustomers === 0 && <Insight icon={Sparkles} title={t('🚀 ابدأ الآن!', '🚀 Get Started!')} desc={t(
                  `أضف عملاء وفواتير لتظهر التحليلات والتوصيات المخصصة لك. كل فاتورة تضيفها تساعد النظام على تقديم نصائح أدق لتحسين أعمالك.`,
                  `Add customers & invoices to unlock personalized analytics. Every invoice helps the system provide more accurate recommendations.`
                )} type="info" />}
              </div>

              {/* Right column */}
              <div className="space-y-3">
                <Card title={t('ملخص الأرقام', 'Summary')} icon={Hash}>
                  <div className="space-y-3">
                    {[
                      { l: t('الإيرادات', 'Revenue'), v: totalRevenue, mx: totalRevenue + totalExpenses, c: 'hsl(var(--primary))' },
                      { l: t('المصروفات الكلية', 'Total Expenses'), v: totalExpenses, mx: totalRevenue + totalExpenses, c: '#ef4444' },
                      { l: t('صافي الربح', 'Net Profit'), v: netProfit, mx: totalRevenue, c: netProfit >= 0 ? '#10b981' : '#ef4444' },
                      { l: t('المرتبات', 'Salaries'), v: totalSalaries, mx: totalExpenses || 1, c: '#8b5cf6' },
                      { l: t('مصاريف عادية', 'Regular Exp'), v: totalRegularExp, mx: totalExpenses || 1, c: '#f59e0b' },
                      { l: t('العملاء', 'Clients'), v: totalCustomers, mx: Math.max(totalCustomers, 10), c: '#10b981' },
                      { l: t('الفواتير', 'Invoices'), v: totalInvoices, mx: Math.max(totalInvoices, 10), c: '#06b6d4' },
                    ].map((x, i) => (
                      <div key={i}><div className="flex justify-between mb-1"><span className="text-[10px] font-bold text-foreground">{x.l}</span><span className="text-[10px] font-black" style={{ color: x.c }}>{x.v.toLocaleString()}</span></div><MiniBar value={Math.abs(x.v)} max={x.mx || 1} color={x.c} /></div>
                    ))}
                  </div>
                </Card>

                <Card title={t('أفضل 5 عملاء', 'Top 5 Clients')} icon={Star}>
                  <div className="space-y-1.5">
                    {customerRevenue.map(([name, rev], i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: COLORS[i] }}>{i + 1}</div>
                        <div className="flex-1 min-w-0"><p className="text-[11px] font-semibold text-foreground truncate">{name}</p></div>
                        <span className="text-[10px] font-black text-primary">{rev.toLocaleString()}</span>
                      </div>
                    ))}
                    {customerRevenue.length === 0 && <p className="text-center text-muted-foreground text-[10px] py-3">{t('لا يوجد', 'None')}</p>}
                  </div>
                </Card>

                <Card title={t('خطة العمل الأسبوعية', 'Weekly Action Plan')} icon={ClipboardList}>
                  <div className="space-y-2">
                    {[
                      { d: t('السبت', 'Sat'), a: t('متابعة الفواتير المعلقة', 'Follow up pending invoices'), c: '#ef4444' },
                      { d: t('الأحد', 'Sun'), a: t('نشر محتوى سوشيال ميديا', 'Post social media content'), c: '#8b5cf6' },
                      { d: t('الاثنين', 'Mon'), a: t('تواصل مع 3 عملاء محتملين', 'Contact 3 potential clients'), c: '#10b981' },
                      { d: t('الثلاثاء', 'Tue'), a: t('مراجعة الأسعار والعروض', 'Review prices & offers'), c: '#f59e0b' },
                      { d: t('الأربعاء', 'Wed'), a: t('تصوير محتوى ترويجي', 'Shoot promotional content'), c: '#06b6d4' },
                      { d: t('الخميس', 'Thu'), a: t('تقييم أداء الأسبوع', 'Evaluate weekly performance'), c: '#ec4899' },
                    ].map((x, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: x.c }} />
                        <span className="text-[10px] font-bold text-foreground w-12">{x.d}</span>
                        <span className="text-[10px] text-muted-foreground">{x.a}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Missing icon imports used in analytics
const FileText = ({ size = 16, ...props }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const Heart = ({ size = 16, ...props }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;

export default AdvancedDashboard;