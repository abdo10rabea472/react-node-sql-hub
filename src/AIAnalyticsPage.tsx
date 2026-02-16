import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, Shield, Activity, TrendingUp,
  Users, AlertTriangle, Clock, Target,
  Zap, Eye, Lock, Unlock, Trash2, RotateCcw,
  Award, RefreshCw, Loader,
  Lightbulb, Package, BarChart3, DollarSign, Gauge,
  UserCheck, FileText, Bell, Info, LineChart,
  Wallet, Star, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useSettings } from './SettingsContext';
import {
  getInvoices, getCustomers, getUsers, getInventoryItems,
  getExpenses, getAdvances, getAttendance, getSalaries, getPurchases
} from './api';
import { supabase } from './integrations/supabase/client';

interface Props { user: { id: number; name: string; role: string } }

// ─── Gauge Chart ───
const GaugeChart = ({ value, size = 120, label }: { value: number; size?: number; label: string }) => {
  const r = (size - 20) / 2;
  const circumference = Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? 'hsl(var(--success))' : value >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path d={`M 10 ${size / 2} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
        <motion.path d={`M 10 ${size / 2} A ${r} ${r} 0 0 1 ${size - 10} ${size / 2}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: "easeOut" }} />
        <text x={size / 2} y={size / 2 - 5} textAnchor="middle" className="fill-foreground" fontSize="18" fontWeight="800">{value}</text>
      </svg>
      <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
    </div>
  );
};

// ─── Mini Bar Chart ───
const MiniBarChart = ({ data, height = 60 }: { data: number[]; height?: number }) => {
  const max = Math.max(...data, 1);
  const w = 100 / data.length;
  return (
    <svg width="100%" viewBox={`0 0 100 ${height}`} className="overflow-visible">
      {data.map((v, i) => (
        <motion.rect key={i} x={i * w + w * 0.15} width={w * 0.7} y={height} height={0}
          rx="2" fill={`hsl(var(--primary) / ${0.4 + (v / max) * 0.6})`}
          animate={{ y: height - (v / max) * height, height: (v / max) * height }}
          transition={{ duration: 0.5, delay: i * 0.05 }} />
      ))}
    </svg>
  );
};

// ─── Risk Badge ───
const RiskBadge = ({ level }: { level: string }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    low: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'منخفض' },
    medium: { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'متوسط' },
    high: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'مرتفع' },
    critical: { bg: 'bg-red-600/20', text: 'text-red-700', label: 'حرج' },
  };
  const c = config[level] || config.low;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.bg} ${c.text}`}>{c.label}</span>;
};

// ─── DB helpers ───
async function loadCachedResults(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase
      .from('ai_analysis_results')
      .select('analysis_type, result_data, updated_at');
    if (error) throw error;
    const map: Record<string, any> = {};
    data?.forEach((row: any) => {
      map[row.analysis_type] = { data: row.result_data, updatedAt: row.updated_at };
    });
    return map;
  } catch (e) {
    console.error('Failed to load cached AI results:', e);
    return {};
  }
}

async function saveCachedResult(analysisType: string, resultData: any) {
  try {
    await supabase.from('ai_analysis_results').upsert(
      { analysis_type: analysisType, result_data: resultData },
      { onConflict: 'analysis_type' }
    );
  } catch (e) {
    console.error('Failed to save AI result:', e);
  }
}

async function saveDecisionLog(decisions: any[]) {
  try {
    const rows = decisions.map((d: any) => ({
      title: d.title || '',
      description: d.description || '',
      action: d.action || '',
      severity: d.severity || 'info',
      target_name: d.targetName || '',
      target_type: d.targetType || '',
      reasoning: d.reasoning || '',
      executed_by: 'AI',
    }));
    if (rows.length > 0) {
      await supabase.from('ai_decision_log').insert(rows);
    }
  } catch (e) {
    console.error('Failed to save decision log:', e);
  }
}

async function loadDecisionLog(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('ai_decision_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map((d: any) => ({
      ...d,
      timestamp: d.created_at,
      targetName: d.target_name,
      targetType: d.target_type,
      executedBy: d.executed_by,
    }));
  } catch (e) {
    console.error('Failed to load decision log:', e);
    return [];
  }
}

const AIAnalyticsPage: React.FC<Props> = ({ user }) => {
  const { settings } = useSettings();
  const isAr = settings.lang === 'ar';
  const [activeTab, setActiveTab] = useState<'analytics' | 'decisions' | 'permissions' | 'monitoring' | 'forecasting' | 'financial' | 'customers' | 'employees' | 'inventory' | 'decision-log' | 'trash' | 'kpis' | 'strategic'>('analytics');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // AI Results
  const [analyticsResult, setAnalyticsResult] = useState<any>(null);
  const [decisionsResult, setDecisionsResult] = useState<any>(null);
  const [monitoringResult, setMonitoringResult] = useState<any>(null);

  // Raw data
  const [rawData, setRawData] = useState<any>(null);

  // Permissions state
  const [permissions, setPermissions] = useState<Record<number, {
    view: boolean; edit: boolean; delete: boolean; add: boolean;
    pages: string[];
  }>>({});
  const [employees, setEmployees] = useState<any[]>([]);

  // Trash
  const [trashItems, setTrashItems] = useState<any[]>([]);

  // Decision log
  const [decisionLog, setDecisionLog] = useState<any[]>([]);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Track running analyses to prevent duplicates
  const runningRef = useRef<Set<string>>(new Set());

  const allPages = [
    { key: 'dashboard', label: isAr ? 'لوحة التحكم' : 'Dashboard' },
    { key: 'customers', label: isAr ? 'العملاء' : 'Customers' },
    { key: 'invoices', label: isAr ? 'الفواتير' : 'Invoices' },
    { key: 'pricing', label: isAr ? 'الأسعار' : 'Pricing' },
    { key: 'purchases', label: isAr ? 'المخزون' : 'Inventory' },
    { key: 'expenses', label: isAr ? 'المصاريف' : 'Expenses' },
    { key: 'reports', label: isAr ? 'التقارير' : 'Reports' },
    { key: 'users', label: isAr ? 'المستخدمين' : 'Users' },
    { key: 'settings', label: isAr ? 'الإعدادات' : 'Settings' },
  ];

  // Fetch all business data
  const fetchBusinessData = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, cust, usr, items, exp, adv, att, sal, purch] = await Promise.all([
        getInvoices().catch(() => ({ data: [] })),
        getCustomers().catch(() => ({ data: [] })),
        getUsers().catch(() => ({ data: [] })),
        getInventoryItems().catch(() => ({ data: [] })),
        getExpenses().catch(() => ({ data: [] })),
        getAdvances().catch(() => ({ data: [] })),
        getAttendance().catch(() => ({ data: [] })),
        getSalaries().catch(() => ({ data: [] })),
        getPurchases().catch(() => ({ data: [] })),
      ]);

      const data = {
        invoices: Array.isArray(inv.data) ? inv.data : [],
        customers: Array.isArray(cust.data) ? cust.data : [],
        employees: Array.isArray(usr.data) ? usr.data : [],
        inventory: Array.isArray(items.data) ? items.data : [],
        expenses: Array.isArray(exp.data) ? exp.data : [],
        advances: Array.isArray(adv.data) ? adv.data : [],
        attendance: Array.isArray(att.data) ? att.data : [],
        salaries: Array.isArray(sal.data) ? sal.data : [],
        purchases: Array.isArray(purch.data) ? purch.data : [],
      };

      setRawData(data);
      setEmployees(data.employees);

      // Init permissions
      const perms: typeof permissions = {};
      data.employees.forEach((e: any) => {
        perms[e.id] = permissions[e.id] || {
          view: true, edit: e.role === 'admin', delete: e.role === 'admin',
          add: e.role !== 'user',
          pages: e.role === 'admin' ? allPages.map(p => p.key) : ['dashboard', 'customers', 'invoices'],
        };
      });
      setPermissions(perms);
      setLastUpdate(new Date().toLocaleTimeString('ar-EG'));
    } catch {
      showToast(isAr ? 'فشل تحميل البيانات' : 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load cached results from DB on mount
  useEffect(() => {
    const loadCached = async () => {
      const [cached, log] = await Promise.all([loadCachedResults(), loadDecisionLog()]);
      if (cached['full-analysis']?.data) {
        setAnalyticsResult(cached['full-analysis'].data);
        setLastUpdate(new Date(cached['full-analysis'].updatedAt).toLocaleTimeString('ar-EG'));
      }
      if (cached['decisions']?.data) setDecisionsResult(cached['decisions'].data);
      if (cached['monitoring']?.data) setMonitoringResult(cached['monitoring'].data);
      if (log.length > 0) setDecisionLog(log);
    };
    loadCached();
    fetchBusinessData();
  }, []);

  // Auto-run AI when data is loaded AND no cached results exist
  const [aiAutoRan, setAiAutoRan] = useState(false);
  useEffect(() => {
    if (rawData && !aiAutoRan && !aiLoading && !analyticsResult && !decisionsResult && !monitoringResult) {
      setAiAutoRan(true);
      runAI('full-analysis');
      runAI('decisions');
      runAI('monitoring');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData, aiAutoRan, analyticsResult]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (rawData && !aiLoading) {
        console.log('[AI] Auto-refresh triggered');
        fetchBusinessData().then(() => {
          runAI('full-analysis');
          runAI('decisions');
          runAI('monitoring');
        });
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData, aiLoading]);

  // Build external models from settings
  const getExternalModels = () => {
    const models = (settings as any).aiModels;
    if (!models || !Array.isArray(models)) return [];
    return models.filter((m: any) => m.active && m.apiKey).map((m: any) => ({
      provider: m.provider, apiKey: m.apiKey, model: m.model, endpoint: m.endpoint
    }));
  };

  // Call AI
  const runAI = async (type: string) => {
    if (!rawData) { showToast(isAr ? 'يرجى تحميل البيانات أولاً' : 'Load data first', 'error'); return; }
    if (runningRef.current.has(type)) return; // prevent duplicate runs
    runningRef.current.add(type);
    setAiLoading(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const externalModels = getExternalModels();
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ businessData: rawData, analysisType: type, externalModels }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const errorMsg = errData.error || `HTTP ${resp.status}`;
        if (resp.status === 402) {
          showToast(isAr ? `⚠️ ${errorMsg}` : '⚠️ AI credits exhausted. Add external AI model in app Settings → AI Models tab', 'error');
          return;
        }
        if (resp.status === 429) {
          showToast(isAr ? '⏳ تم تجاوز حد الطلبات، يرجى المحاولة بعد دقيقة' : '⏳ Rate limited, please try again in a minute', 'error');
          return;
        }
        throw new Error(errorMsg);
      }
      const data = await resp.json();

      if (type === 'full-analysis') {
        setAnalyticsResult(data);
        saveCachedResult('full-analysis', data);
      } else if (type === 'decisions') {
        setDecisionsResult(data);
        saveCachedResult('decisions', data);
        if (data?.decisions) {
          saveDecisionLog(data.decisions);
          setDecisionLog(prev => [...data.decisions.map((d: any) => ({
            ...d, timestamp: new Date().toISOString(), executedBy: 'AI'
          })), ...prev].slice(0, 50));
        }
      } else if (type === 'monitoring') {
        setMonitoringResult(data);
        saveCachedResult('monitoring', data);
      }

      setLastUpdate(new Date().toLocaleTimeString('ar-EG'));
      showToast(isAr ? 'تم التحليل بنجاح ✨' : 'Analysis complete ✨', 'success');
    } catch (e: any) {
      showToast(e?.message || (isAr ? 'فشل التحليل' : 'Analysis failed'), 'error');
    } finally {
      runningRef.current.delete(type);
      setAiLoading(false);
    }
  };

  // Soft delete to trash (used by child components)
  const _moveToTrash = useCallback((item: any, type: string) => {
    setTrashItems(prev => [{ ...item, _trashType: type, _deletedAt: new Date().toISOString(), _deletedBy: user.name }, ...prev]);
    showToast(isAr ? 'تم النقل لسلة المهملات' : 'Moved to trash', 'info');
  }, [user.name, isAr]);
  void _moveToTrash;

  const restoreFromTrash = (index: number) => {
    setTrashItems(prev => prev.filter((_, i) => i !== index));
    showToast(isAr ? 'تم الاستعادة' : 'Restored', 'success');
  };

  const tabs = [
    { key: 'analytics' as const, label: isAr ? 'التحليلات الذكية' : 'Smart Analytics', icon: Brain, color: 'from-purple-500 to-indigo-600' },
    { key: 'decisions' as const, label: isAr ? 'مركز القرارات' : 'Decision Center', icon: Target, color: 'from-emerald-500 to-teal-600' },
    { key: 'permissions' as const, label: isAr ? 'الصلاحيات' : 'Permissions', icon: Shield, color: 'from-amber-500 to-orange-600' },
    { key: 'monitoring' as const, label: isAr ? 'المراقبة الذكية' : 'Monitoring', icon: Eye, color: 'from-red-500 to-pink-600' },
    { key: 'forecasting' as const, label: isAr ? 'التنبؤات المستقبلية' : 'Forecasting', icon: Lightbulb, color: 'from-cyan-500 to-blue-600' },
    { key: 'financial' as const, label: isAr ? 'الأداء المالي' : 'Financial', icon: DollarSign, color: 'from-green-500 to-emerald-600' },
    { key: 'customers' as const, label: isAr ? 'تحليل العملاء' : 'Customers', icon: Users, color: 'from-blue-500 to-indigo-600' },
    { key: 'employees' as const, label: isAr ? 'تحليل الموظفين' : 'Employees', icon: UserCheck, color: 'from-violet-500 to-purple-600' },
    { key: 'inventory' as const, label: isAr ? 'تحليل المخزون' : 'Inventory', icon: Package, color: 'from-amber-500 to-yellow-600' },
    { key: 'decision-log' as const, label: isAr ? 'سجل القرارات' : 'Decision Log', icon: FileText, color: 'from-slate-500 to-gray-600' },
    { key: 'trash' as const, label: isAr ? 'سلة المهملات' : 'Trash', icon: Trash2, color: 'from-rose-500 to-red-600' },
    { key: 'kpis' as const, label: isAr ? 'مؤشرات الأداء' : 'KPIs', icon: Gauge, color: 'from-teal-500 to-cyan-600' },
    { key: 'strategic' as const, label: isAr ? 'الإجراءات الاستراتيجية' : 'Strategic', icon: Zap, color: 'from-orange-500 to-red-600' },
  ];

  const cardClass = "bg-card border border-border rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-primary/5";

  return (
    <div className="space-y-5 animate-fade-in text-start">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl shadow-xl text-sm font-bold text-white ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">{isAr ? 'مركز الذكاء الاصطناعي' : 'AI Command Center'}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isAr ? `آخر تحديث: ${lastUpdate || 'لم يبدأ'} • تحديث تلقائي كل 5 دقائق` : `Last: ${lastUpdate || 'Not started'} • Auto-refresh every 5m`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchBusinessData} disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-xs font-bold hover:bg-secondary transition-all flex items-center gap-2 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {isAr ? 'تحديث البيانات' : 'Refresh'}
          </button>
          <button onClick={() => {
            runAI('full-analysis');
            runAI('decisions');
            runAI('monitoring');
          }}
            disabled={aiLoading || !rawData}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/25">
            {aiLoading ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {aiLoading ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : (isAr ? 'تحديث التحليل' : 'Refresh Analysis')}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-muted/50 p-1.5 rounded-2xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-card shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${tab.color} flex items-center justify-center`}>
              <tab.icon size={12} className="text-white" />
            </div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ ANALYTICS TAB ═══════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* Quick Stats */}
          {rawData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: isAr ? 'الفواتير' : 'Invoices', value: rawData.invoices.length, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: isAr ? 'العملاء' : 'Customers', value: rawData.customers.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: isAr ? 'الموظفين' : 'Employees', value: rawData.employees.length, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: isAr ? 'المنتجات' : 'Products', value: rawData.inventory.length, icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={cardClass}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                      <s.icon size={16} className={s.color} />
                    </div>
                    <span className="text-xl font-black text-foreground">{s.value}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-muted-foreground">{s.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Loading state */}
          {aiLoading && !analyticsResult && (
            <div className="text-center py-20">
              <Loader size={48} className="mx-auto text-primary animate-spin mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'جاري التحليل الذكي...' : 'Running AI analysis...'}</p>
            </div>
          )}

          {/* AI Analysis Results */}
          {analyticsResult ? (
            <div className="space-y-4">
              {/* Overall Score + Summary */}
              <div className={`${cardClass} bg-gradient-to-br from-card to-primary/5`}>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <GaugeChart value={analyticsResult.overallScore || 75} label={isAr ? 'الأداء العام' : 'Overall'} />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" />
                      {isAr ? 'ملخص التحليل الذكي' : 'AI Analysis Summary'}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{analyticsResult.overallSummary}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Sales */}
                {analyticsResult.salesAnalysis && (
                  <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      {isAr ? 'تحليل المبيعات' : 'Sales Analysis'}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${analyticsResult.salesAnalysis.trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {analyticsResult.salesAnalysis.trend === 'up' ? '↑' : '↓'} {analyticsResult.salesAnalysis.growthRate}%
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">{analyticsResult.salesAnalysis.summary}</p>
                    {rawData && <MiniBarChart data={rawData.invoices.slice(0, 12).map((i: any) => Number(i.total_amount || 0))} />}
                  </div>
                )}

                {/* Customers */}
                {analyticsResult.customerAnalysis && (
                  <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Users size={16} className="text-blue-500" />
                      {isAr ? 'تحليل العملاء' : 'Customer Analysis'}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">{analyticsResult.customerAnalysis.summary}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted rounded-xl p-3 text-center">
                        <p className="text-lg font-black text-foreground">{analyticsResult.customerAnalysis.totalActive}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'نشطين' : 'Active'}</p>
                      </div>
                      <div className="bg-muted rounded-xl p-3 text-center">
                        <p className="text-lg font-black text-foreground">{analyticsResult.customerAnalysis.retentionRate}%</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'معدل الاحتفاظ' : 'Retention'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inventory */}
                {analyticsResult.inventoryAnalysis && (
                  <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Package size={16} className="text-amber-500" />
                      {isAr ? 'تحليل المخزون' : 'Inventory Analysis'}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">{analyticsResult.inventoryAnalysis.summary}</p>
                    {analyticsResult.inventoryAnalysis.alerts?.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {analyticsResult.inventoryAnalysis.alerts.map((a: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-amber-600 bg-amber-500/5 rounded-lg px-3 py-1.5">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />{a}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Employees */}
                {analyticsResult.employeeAnalysis?.length > 0 && (
                  <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Award size={16} className="text-purple-500" />
                      {isAr ? 'تقييم الموظفين' : 'Employee Rating'}
                    </h3>
                    <div className="space-y-2">
                      {analyticsResult.employeeAnalysis.map((e: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-muted/50 rounded-xl">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {(e.name || '?')[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{e.name}</p>
                            <p className="text-[10px] text-muted-foreground">{e.notes}</p>
                          </div>
                          <div className="text-center">
                            <p className={`text-sm font-black ${e.score >= 80 ? 'text-emerald-600' : e.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{e.score}</p>
                            <p className="text-[9px] text-muted-foreground">/100</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fraud Alerts */}
              {analyticsResult.fraudAlerts?.length > 0 && (
                <div className={`${cardClass} border-red-500/20`}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-500" />
                    {isAr ? 'تنبيهات الأنشطة المشبوهة' : 'Fraud Alerts'}
                  </h3>
                  <div className="space-y-2">
                    {analyticsResult.fraudAlerts.map((a: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                        <RiskBadge level={a.severity} />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-foreground">{a.type}</p>
                          <p className="text-[11px] text-muted-foreground">{a.description}</p>
                          <p className="text-[10px] text-emerald-600 mt-1 font-semibold">💡 {a.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forecasting + Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {analyticsResult.forecasting && (
                  <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Lightbulb size={16} className="text-amber-500" />
                      {isAr ? 'التنبؤات المستقبلية' : 'Forecasting'}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">{analyticsResult.forecasting.summary}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted rounded-xl p-3 text-center">
                        <p className="text-sm font-black text-foreground">{analyticsResult.forecasting.nextMonthRevenue?.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'إيرادات متوقعة' : 'Expected Revenue'}</p>
                      </div>
                      <div className="bg-muted rounded-xl p-3 text-center">
                        <p className="text-sm font-black text-foreground">{analyticsResult.forecasting.confidence}%</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'نسبة الثقة' : 'Confidence'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {analyticsResult.recommendations?.length > 0 && (
                  <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Zap size={16} className="text-primary" />
                      {isAr ? 'توصيات AI' : 'AI Recommendations'}
                    </h3>
                    <div className="space-y-2">
                      {analyticsResult.recommendations.slice(0, 4).map((r: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded-xl">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${r.impact === 'high' ? 'bg-red-500/10 text-red-600' : r.impact === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                            {r.impact === 'high' ? '🔴' : r.impact === 'medium' ? '🟡' : '🔵'}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-foreground">{r.title}</p>
                            <p className="text-[10px] text-muted-foreground">{r.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : !aiLoading && (
            <div className="text-center py-20">
              <Brain size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'جاري تحميل التحليلات...' : 'Loading analytics...'}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ DECISIONS TAB ═══════════════ */}
      {activeTab === 'decisions' && (
        <div className="space-y-5">
          {aiLoading && !decisionsResult && (
            <div className="text-center py-20">
              <Loader size={48} className="mx-auto text-primary animate-spin mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'جاري تحليل القرارات...' : 'Analyzing decisions...'}</p>
            </div>
          )}
          {decisionsResult ? (
            <>
              {/* Decisions List */}
              {decisionsResult.decisions?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Target size={16} className="text-emerald-500" />
                    {isAr ? 'القرارات التلقائية' : 'Auto Decisions'}
                  </h3>
                  <div className="space-y-3">
                    {decisionsResult.decisions.map((d: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className={`flex items-start gap-3 p-4 rounded-xl border ${d.severity === 'critical' ? 'border-red-500/20 bg-red-500/5' : d.severity === 'warning' ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-muted/30'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${d.severity === 'critical' ? 'bg-red-500/10 text-red-600' : d.severity === 'warning' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {d.severity === 'critical' ? <AlertTriangle size={16} /> : d.severity === 'warning' ? <Bell size={16} /> : <Info size={16} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-bold text-foreground">{d.title}</p>
                            <RiskBadge level={d.severity} />
                          </div>
                          <p className="text-[11px] text-muted-foreground mb-1">{d.description}</p>
                          <p className="text-[10px] text-primary font-semibold">🎯 {d.reasoning}</p>
                          {d.targetName && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {isAr ? 'الهدف:' : 'Target:'} <span className="font-bold">{d.targetName}</span>
                            </p>
                          )}
                        </div>
                        <span className={`text-[9px] px-2 py-1 rounded-lg font-bold ${d.action === 'suspend' ? 'bg-red-500/10 text-red-600' : d.action === 'reduce_permissions' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {d.action === 'alert' ? (isAr ? 'تنبيه' : 'Alert') :
                            d.action === 'reduce_permissions' ? (isAr ? 'تقليل صلاحيات' : 'Reduce Perms') :
                              d.action === 'suspend' ? (isAr ? 'إيقاف مؤقت' : 'Suspend') :
                                d.action}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Employee Scores */}
              {decisionsResult.employeeScores?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Award size={16} className="text-purple-500" />
                    {isAr ? 'تقييم أداء الموظفين بالنقاط' : 'Employee Performance Scores'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {decisionsResult.employeeScores.map((e: any, i: number) => (
                      <div key={i} className="bg-muted/50 rounded-xl p-4 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center text-white font-bold text-sm">
                          {(e.name || '?')[0]}
                        </div>
                        <p className="text-xs font-bold truncate">{e.name}</p>
                        <div className="flex justify-center gap-3">
                          <GaugeChart value={e.overallScore || 0} size={80} label={isAr ? 'الكلي' : 'Overall'} />
                        </div>
                        <div className="flex gap-2 text-[10px]">
                          <span className="flex-1 bg-card rounded-lg py-1.5 font-bold">📊 {e.performanceScore}</span>
                          <span className="flex-1 bg-card rounded-lg py-1.5 font-bold">⏰ {e.attendanceScore}</span>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold inline-block ${e.recommendation === 'promote' ? 'bg-emerald-500/10 text-emerald-600' : e.recommendation === 'warn' ? 'bg-amber-500/10 text-amber-600' : e.recommendation === 'review' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {e.recommendation === 'promote' ? (isAr ? '⬆️ ترقية' : '⬆️ Promote') :
                            e.recommendation === 'warn' ? (isAr ? '⚠️ تحذير' : '⚠️ Warn') :
                              e.recommendation === 'review' ? (isAr ? '🔍 مراجعة' : '🔍 Review') :
                                (isAr ? '✅ استمرار' : '✅ Maintain')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Actions */}
              {decisionsResult.strategicActions?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    {isAr ? 'إجراءات استراتيجية' : 'Strategic Actions'}
                  </h3>
                  <div className="space-y-2">
                    {decisionsResult.strategicActions.map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${a.priority === 'high' ? 'bg-red-500/10 text-red-600' : a.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {a.priority}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-bold">{a.title}</p>
                          <p className="text-[10px] text-muted-foreground">{a.expectedImpact}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted font-semibold text-muted-foreground">{a.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Log */}
              {decisionLog.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-muted-foreground" />
                    {isAr ? 'سجل القرارات' : 'Decision Log'}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">{isAr ? 'محفوظ في قاعدة البيانات' : 'Saved in DB'}</span>
                  </h3>
                  <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                    {decisionLog.map((d: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] p-2 bg-muted/30 rounded-lg">
                        <Clock size={10} className="text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">{new Date(d.timestamp || d.created_at).toLocaleString('ar-EG')}</span>
                        <span className="font-bold text-foreground flex-1 truncate">{d.title}</span>
                        <RiskBadge level={d.severity || 'info'} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : !aiLoading && (
            <div className="text-center py-20">
              <Target size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'جاري تحميل القرارات...' : 'Loading decisions...'}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ PERMISSIONS TAB ═══════════════ */}
      {activeTab === 'permissions' && (
        <div className="space-y-5">
          {/* Employee Permissions */}
          <div className={cardClass}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield size={16} className="text-amber-500" />
              {isAr ? 'صلاحيات الموظفين' : 'Employee Permissions'}
            </h3>
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{isAr ? 'لا يوجد موظفين' : 'No employees'}</p>
            ) : (
              <div className="space-y-4">
                {employees.map((emp: any) => {
                  const p = permissions[emp.id] || { view: true, edit: false, delete: false, add: false, pages: [] };
                  return (
                    <div key={emp.id} className="bg-muted/30 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                          {(emp.name || '?')[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.email} • {emp.role}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {emp.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'موقوف' : 'Inactive')}
                        </span>
                      </div>

                      {/* Permission toggles */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          { key: 'view' as const, label: isAr ? 'عرض' : 'View', icon: Eye },
                          { key: 'edit' as const, label: isAr ? 'تعديل' : 'Edit', icon: FileText },
                          { key: 'delete' as const, label: isAr ? 'حذف' : 'Delete', icon: Trash2 },
                          { key: 'add' as const, label: isAr ? 'إضافة' : 'Add', icon: Zap },
                        ].map(perm => (
                          <button key={perm.key} onClick={() => {
                            setPermissions(prev => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], [perm.key]: !prev[emp.id]?.[perm.key] }
                            }));
                            showToast(isAr ? 'تم تحديث الصلاحيات' : 'Permissions updated', 'info');
                          }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${p[perm.key] ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
                            {p[perm.key] ? <Unlock size={11} /> : <Lock size={11} />}
                            {perm.label}
                          </button>
                        ))}
                      </div>

                      {/* Page access */}
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground mb-1.5">{isAr ? 'الصفحات المتاحة:' : 'Accessible Pages:'}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {allPages.map(page => {
                            const isAllowed = p.pages?.includes(page.key);
                            return (
                              <button key={page.key} onClick={() => {
                                setPermissions(prev => {
                                  const current = prev[emp.id]?.pages || [];
                                  const next = isAllowed ? current.filter(k => k !== page.key) : [...current, page.key];
                                  return { ...prev, [emp.id]: { ...prev[emp.id], pages: next } };
                                });
                              }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${isAllowed ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground/50'}`}>
                                {page.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trash / Soft Delete */}
          <div className={cardClass}>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Trash2 size={16} className="text-red-500" />
              {isAr ? 'سلة المهملات' : 'Trash Bin'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">{trashItems.length}</span>
            </h3>
            {trashItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{isAr ? 'سلة المهملات فارغة' : 'Trash is empty'}</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {trashItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                    <Trash2 size={14} className="text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{item.name || item.description || item.invoice_no || `#${item.id}`}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item._trashType} • {isAr ? 'حذف بواسطة' : 'By'} {item._deletedBy} • {new Date(item._deletedAt).toLocaleString('ar-EG')}
                      </p>
                    </div>
                    <button onClick={() => restoreFromTrash(i)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1">
                      <RotateCcw size={10} />{isAr ? 'استعادة' : 'Restore'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ MONITORING TAB ═══════════════ */}
      {activeTab === 'monitoring' && (
        <div className="space-y-5">
          {aiLoading && !monitoringResult && (
            <div className="text-center py-20">
              <Loader size={48} className="mx-auto text-primary animate-spin mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'جاري المراقبة...' : 'Monitoring...'}</p>
            </div>
          )}
          {monitoringResult ? (
            <>
              {/* System Health */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`${cardClass} text-center`}>
                  <GaugeChart value={monitoringResult.systemHealth?.score || 0} label={isAr ? 'صحة النظام' : 'System Health'} />
                </div>
                <div className={`${cardClass} flex flex-col items-center justify-center`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ${monitoringResult.riskLevel === 'low' ? 'bg-emerald-500/10' : monitoringResult.riskLevel === 'medium' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                    <Shield size={28} className={monitoringResult.riskLevel === 'low' ? 'text-emerald-600' : monitoringResult.riskLevel === 'medium' ? 'text-amber-600' : 'text-red-600'} />
                  </div>
                  <p className="text-sm font-bold">{isAr ? 'مستوى الخطورة' : 'Risk Level'}</p>
                  <RiskBadge level={monitoringResult.riskLevel || 'low'} />
                </div>
                <div className={`${cardClass} text-center`}>
                  <p className="text-3xl font-black text-foreground mb-1">{monitoringResult.systemHealth?.activeUsers || 0}</p>
                  <p className="text-xs text-muted-foreground font-semibold">{isAr ? 'مستخدمين نشطين' : 'Active Users'}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">{monitoringResult.systemHealth?.summary}</p>
                </div>
              </div>

              {/* Anomalies */}
              {monitoringResult.anomalies?.length > 0 && (
                <div className={`${cardClass} border-amber-500/20`}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    {isAr ? 'الأنشطة غير الطبيعية' : 'Anomalies Detected'}
                  </h3>
                  <div className="space-y-2">
                    {monitoringResult.anomalies.map((a: any, i: number) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${a.severity === 'high' ? 'border-red-500/20 bg-red-500/5' : a.severity === 'medium' ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-muted/30'}`}>
                        <RiskBadge level={a.severity} />
                        <div className="flex-1">
                          <p className="text-xs font-bold">{a.type}</p>
                          <p className="text-[11px] text-muted-foreground">{a.description}</p>
                          <p className="text-[10px] text-primary mt-1 font-semibold">💡 {a.suggestedAction}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Feed */}
              {monitoringResult.activities?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    {isAr ? 'سجل الأنشطة المراقبة' : 'Monitored Activities'}
                  </h3>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    {monitoringResult.activities.map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-all">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${a.riskScore >= 70 ? 'bg-red-500' : a.riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">
                            <span className="font-bold text-primary">{a.user}</span> — {a.action}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{a.details}</p>
                        </div>
                        <div className="text-end shrink-0">
                          <p className={`text-xs font-bold ${a.riskScore >= 70 ? 'text-red-600' : a.riskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>{a.riskScore}%</p>
                          <p className="text-[9px] text-muted-foreground">{isAr ? 'خطورة' : 'Risk'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : !aiLoading && (
            <div className="text-center py-20">
              <Eye size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'جاري تحميل المراقبة...' : 'Loading monitoring...'}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ FORECASTING TAB ═══════════════ */}
      {activeTab === 'forecasting' && (
        <div className="space-y-5">
          {analyticsResult?.forecasting ? (
            <>
              <div className={`${cardClass} bg-gradient-to-br from-card to-cyan-500/5`}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb size={16} className="text-cyan-500" />
                  {isAr ? 'التنبؤات المستقبلية' : 'Forecasting & Predictions'}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{analyticsResult.forecasting.summary}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <p className="text-lg font-black text-foreground">{analyticsResult.forecasting.nextMonthRevenue?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'إيرادات الشهر القادم' : 'Next Month Revenue'}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <p className="text-lg font-black text-foreground">{analyticsResult.forecasting.confidence}%</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'نسبة الثقة' : 'Confidence'}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <p className="text-lg font-black text-foreground">{analyticsResult.forecasting.expectedGrowth || '—'}%</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'النمو المتوقع' : 'Expected Growth'}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <p className="text-lg font-black text-foreground">{analyticsResult.forecasting.seasonalTrend || '—'}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'الاتجاه الموسمي' : 'Seasonal Trend'}</p>
                  </div>
                </div>
              </div>
              {analyticsResult.forecasting.predictions?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3">{isAr ? 'تنبؤات تفصيلية' : 'Detailed Predictions'}</h3>
                  <div className="space-y-2">
                    {analyticsResult.forecasting.predictions.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <span className="text-[10px] px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 font-bold">{p.type || p.category}</span>
                        <div className="flex-1">
                          <p className="text-xs font-bold">{p.title || p.description}</p>
                          <p className="text-[10px] text-muted-foreground">{p.details || p.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Lightbulb size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'شغّل التحليل أولاً للحصول على التنبؤات' : 'Run analysis first for predictions'}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ FINANCIAL TAB ═══════════════ */}
      {activeTab === 'financial' && (
        <div className="space-y-5">
          {analyticsResult?.salesAnalysis ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: isAr ? 'إجمالي الإيرادات' : 'Total Revenue', value: rawData?.invoices?.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)?.toLocaleString() || '0', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: isAr ? 'إجمالي المصروفات' : 'Total Expenses', value: rawData?.expenses?.reduce((s: number, e: any) => s + Number(e.amount || 0), 0)?.toLocaleString() || '0', icon: Wallet, color: 'text-red-500', bg: 'bg-red-500/10' },
                  { label: isAr ? 'صافي الربح' : 'Net Profit', value: ((rawData?.invoices?.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0) || 0) - (rawData?.expenses?.reduce((s: number, e: any) => s + Number(e.amount || 0), 0) || 0)).toLocaleString(), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: isAr ? 'عدد المعاملات' : 'Transactions', value: (rawData?.invoices?.length || 0) + (rawData?.expenses?.length || 0), icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cardClass}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                        <s.icon size={16} className={s.color} />
                      </div>
                    </div>
                    <p className="text-lg font-black text-foreground">{s.value}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className={cardClass}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <LineChart size={16} className="text-emerald-500" />
                  {isAr ? 'تحليل المبيعات المالي' : 'Financial Sales Analysis'}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">{analyticsResult.salesAnalysis.summary}</p>
                {rawData && <MiniBarChart data={rawData.invoices.slice(0, 20).map((i: any) => Number(i.total_amount || 0))} height={80} />}
              </div>
              {analyticsResult.financialInsights && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3">{isAr ? 'رؤى مالية متقدمة' : 'Advanced Financial Insights'}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{analyticsResult.financialInsights.summary || analyticsResult.financialInsights}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <DollarSign size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'شغّل التحليل للحصول على البيانات المالية' : 'Run analysis for financial data'}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ CUSTOMER INSIGHTS TAB ═══════════════ */}
      {activeTab === 'customers' && (
        <div className="space-y-5">
          {analyticsResult?.customerAnalysis ? (
            <>
              <div className={`${cardClass} bg-gradient-to-br from-card to-blue-500/5`}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Users size={16} className="text-blue-500" />
                  {isAr ? 'تحليل العملاء الشامل' : 'Customer Insights'}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{analyticsResult.customerAnalysis.summary}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-foreground">{analyticsResult.customerAnalysis.totalActive}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'عملاء نشطين' : 'Active'}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-foreground">{analyticsResult.customerAnalysis.retentionRate}%</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'معدل الاحتفاظ' : 'Retention'}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-foreground">{analyticsResult.customerAnalysis.atRisk || 0}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'معرضين للفقد' : 'At Risk'}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-foreground">{rawData?.customers?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'إجمالي العملاء' : 'Total'}</p>
                  </div>
                </div>
              </div>
              {analyticsResult.customerAnalysis.topCustomers?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3">{isAr ? 'أفضل العملاء' : 'Top Customers'}</h3>
                  <div className="space-y-2">
                    {analyticsResult.customerAnalysis.topCustomers.map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">{(c.name || '?')[0]}</div>
                        <div className="flex-1">
                          <p className="text-xs font-bold">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.details || c.totalSpent}</p>
                        </div>
                        <Star size={14} className="text-amber-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analyticsResult.customerAnalysis.riskCustomers?.length > 0 && (
                <div className={`${cardClass} border-amber-500/20`}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    {isAr ? 'العملاء الأكثر خطورة' : 'At-Risk Customers'}
                  </h3>
                  <div className="space-y-2">
                    {analyticsResult.customerAnalysis.riskCustomers.map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                        <RiskBadge level={c.riskLevel || 'medium'} />
                        <div className="flex-1">
                          <p className="text-xs font-bold">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Users size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'شغّل التحليل للحصول على رؤى العملاء' : 'Run analysis for customer insights'}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ EMPLOYEE ANALYTICS TAB ═══════════════ */}
      {activeTab === 'employees' && (
        <div className="space-y-5">
          {analyticsResult?.employeeAnalysis?.length > 0 || decisionsResult?.employeeScores?.length > 0 ? (
            <>
              {decisionsResult?.employeeScores?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Award size={16} className="text-purple-500" />
                    {isAr ? 'تقييم أداء الموظفين بالنقاط' : 'Employee Performance Scores'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {decisionsResult.employeeScores.map((e: any, i: number) => (
                      <div key={i} className="bg-muted/50 rounded-xl p-4 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center text-white font-bold text-sm">
                          {(e.name || '?')[0]}
                        </div>
                        <p className="text-xs font-bold truncate">{e.name}</p>
                        <GaugeChart value={e.overallScore || 0} size={80} label={isAr ? 'الكلي' : 'Overall'} />
                        <div className="flex gap-2 text-[10px]">
                          <span className="flex-1 bg-card rounded-lg py-1.5 font-bold">📊 {e.performanceScore}</span>
                          <span className="flex-1 bg-card rounded-lg py-1.5 font-bold">⏰ {e.attendanceScore}</span>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold inline-block ${e.recommendation === 'promote' ? 'bg-emerald-500/10 text-emerald-600' : e.recommendation === 'warn' ? 'bg-amber-500/10 text-amber-600' : e.recommendation === 'review' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {e.recommendation === 'promote' ? (isAr ? '⬆️ ترقية' : '⬆️ Promote') :
                            e.recommendation === 'warn' ? (isAr ? '⚠️ تحذير' : '⚠️ Warn') :
                              e.recommendation === 'review' ? (isAr ? '🔍 مراجعة' : '🔍 Review') :
                                (isAr ? '✅ استمرار' : '✅ Maintain')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analyticsResult?.employeeAnalysis?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <UserCheck size={16} className="text-violet-500" />
                    {isAr ? 'تقييم الموظفين' : 'Employee Ratings'}
                  </h3>
                  <div className="space-y-2">
                    {analyticsResult.employeeAnalysis.map((e: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {(e.name || '?')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{e.name}</p>
                          <p className="text-[10px] text-muted-foreground">{e.notes}</p>
                        </div>
                        <p className={`text-sm font-black ${e.score >= 80 ? 'text-emerald-600' : e.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{e.score}/100</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <UserCheck size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'شغّل التحليل للحصول على تحليلات الموظفين' : 'Run analysis for employee analytics'}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ INVENTORY ANALYTICS TAB ═══════════════ */}
      {activeTab === 'inventory' && (
        <div className="space-y-5">
          {analyticsResult?.inventoryAnalysis ? (
            <>
              <div className={`${cardClass} bg-gradient-to-br from-card to-amber-500/5`}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Package size={16} className="text-amber-500" />
                  {isAr ? 'تحليل المخزون الشامل' : 'Inventory Analytics'}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{analyticsResult.inventoryAnalysis.summary}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-foreground">{rawData?.inventory?.length || 0}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'إجمالي المنتجات' : 'Total Products'}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-foreground">{analyticsResult.inventoryAnalysis.lowStock || 0}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'مخزون منخفض' : 'Low Stock'}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-lg font-black text-foreground">{analyticsResult.inventoryAnalysis.outOfStock || 0}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'نفد المخزون' : 'Out of Stock'}</p>
                  </div>
                </div>
              </div>
              {analyticsResult.inventoryAnalysis.alerts?.length > 0 && (
                <div className={`${cardClass} border-amber-500/20`}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    {isAr ? 'تنبيهات المخزون' : 'Inventory Alerts'}
                  </h3>
                  <div className="space-y-2">
                    {analyticsResult.inventoryAnalysis.alerts.map((a: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-amber-600 bg-amber-500/5 rounded-lg px-3 py-2">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" />{a}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analyticsResult.inventoryAnalysis.fastMoving?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3">{isAr ? 'المنتجات السريعة الحركة' : 'Fast Moving Products'}</h3>
                  <div className="space-y-1.5">
                    {analyticsResult.inventoryAnalysis.fastMoving.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-emerald-500/5 rounded-lg">
                        <ArrowUpRight size={14} className="text-emerald-500" />
                        <span className="text-xs font-bold flex-1">{p.name || p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analyticsResult.inventoryAnalysis.slowMoving?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3">{isAr ? 'المنتجات الراكدة' : 'Slow Moving Products'}</h3>
                  <div className="space-y-1.5">
                    {analyticsResult.inventoryAnalysis.slowMoving.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-red-500/5 rounded-lg">
                        <ArrowDownRight size={14} className="text-red-500" />
                        <span className="text-xs font-bold flex-1">{p.name || p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Package size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'شغّل التحليل للحصول على تحليلات المخزون' : 'Run analysis for inventory analytics'}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ DECISION LOG TAB ═══════════════ */}
      {activeTab === 'decision-log' && (
        <div className="space-y-5">
          <div className={cardClass}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />
              {isAr ? 'سجل جميع قرارات الذكاء الاصطناعي' : 'All AI Decision Log'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">{decisionLog.length} {isAr ? 'قرار' : 'decisions'}</span>
            </h3>
            {decisionLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{isAr ? 'لا يوجد قرارات مسجلة بعد' : 'No decisions logged yet'}</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {decisionLog.map((d: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                    className={`p-4 rounded-xl border ${d.severity === 'critical' ? 'border-red-500/20 bg-red-500/5' : d.severity === 'warning' ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-muted/30'}`}>
                    <div className="flex items-start gap-3">
                      <Clock size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-bold text-foreground">{d.title}</p>
                          <RiskBadge level={d.severity || 'info'} />
                        </div>
                        {d.description && <p className="text-[11px] text-muted-foreground mb-1">{d.description}</p>}
                        {d.reasoning && <p className="text-[10px] text-primary font-semibold">🎯 {d.reasoning}</p>}
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {new Date(d.timestamp || d.created_at).toLocaleString('ar-EG')}
                          {d.targetName && ` • ${isAr ? 'الهدف:' : 'Target:'} ${d.targetName}`}
                          {d.executedBy && ` • ${isAr ? 'بواسطة:' : 'By:'} ${d.executedBy}`}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ TRASH TAB ═══════════════ */}
      {activeTab === 'trash' && (
        <div className="space-y-5">
          <div className={cardClass}>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Trash2 size={16} className="text-red-500" />
              {isAr ? 'سلة المهملات الذكية' : 'Smart Trash Bin'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">{trashItems.length} {isAr ? 'عنصر' : 'items'}</span>
            </h3>
            {trashItems.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 size={48} className="mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-sm text-muted-foreground font-semibold">{isAr ? 'سلة المهملات فارغة - جميع العمليات الحساسة محمية' : 'Trash is empty - all sensitive operations are protected'}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {trashItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                    <Trash2 size={14} className="text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{item.name || item.description || item.invoice_no || `#${item.id}`}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item._trashType} • {isAr ? 'حذف بواسطة' : 'By'} {item._deletedBy} • {new Date(item._deletedAt).toLocaleString('ar-EG')}
                      </p>
                    </div>
                    <button onClick={() => restoreFromTrash(i)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1">
                      <RotateCcw size={10} />{isAr ? 'استعادة' : 'Restore'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ KPIs TAB ═══════════════ */}
      {activeTab === 'kpis' && (
        <div className="space-y-5">
          {rawData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const totalRevenue = rawData.invoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
                  const totalExpenses = rawData.expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
                  const todayInvoices = rawData.invoices.filter((i: any) => new Date(i.created_at).toDateString() === new Date().toDateString());
                  const todayRevenue = todayInvoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
                  return [
                    { label: isAr ? 'مبيعات اليوم' : 'Today Sales', value: todayRevenue.toLocaleString(), sub: `${todayInvoices.length} ${isAr ? 'فاتورة' : 'invoices'}`, color: 'text-emerald-500' },
                    { label: isAr ? 'إجمالي الإيرادات' : 'Total Revenue', value: totalRevenue.toLocaleString(), sub: settings.currency, color: 'text-blue-500' },
                    { label: isAr ? 'صافي الربح' : 'Net Profit', value: (totalRevenue - totalExpenses).toLocaleString(), sub: `${((totalRevenue - totalExpenses) / (totalRevenue || 1) * 100).toFixed(1)}%`, color: 'text-purple-500' },
                    { label: isAr ? 'العملاء النشطين' : 'Active Clients', value: rawData.customers.length, sub: isAr ? 'عميل' : 'clients', color: 'text-amber-500' },
                  ].map((kpi, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className={cardClass}>
                      <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
                      <p className="text-[11px] font-bold text-foreground mt-1">{kpi.label}</p>
                      <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
                    </motion.div>
                  ));
                })()}
              </div>
              {analyticsResult && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`${cardClass} text-center`}>
                    <GaugeChart value={analyticsResult.overallScore || 0} label={isAr ? 'الأداء العام' : 'Overall'} />
                  </div>
                  <div className={`${cardClass} text-center`}>
                    <GaugeChart value={analyticsResult.customerAnalysis?.retentionRate || 0} label={isAr ? 'الاحتفاظ بالعملاء' : 'Retention'} />
                  </div>
                  <div className={`${cardClass} text-center`}>
                    <GaugeChart value={analyticsResult.forecasting?.confidence || 0} label={isAr ? 'ثقة التنبؤ' : 'Forecast Confidence'} />
                  </div>
                </div>
              )}
              <div className={cardClass}>
                <h3 className="text-sm font-bold text-foreground mb-3">{isAr ? 'مخطط الإيرادات' : 'Revenue Chart'}</h3>
                <MiniBarChart data={rawData.invoices.slice(0, 20).map((i: any) => Number(i.total_amount || 0))} height={100} />
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Gauge size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'جاري تحميل المؤشرات...' : 'Loading KPIs...'}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ STRATEGIC ACTIONS TAB ═══════════════ */}
      {activeTab === 'strategic' && (
        <div className="space-y-5">
          {decisionsResult?.strategicActions?.length > 0 || analyticsResult?.recommendations?.length > 0 ? (
            <>
              {decisionsResult?.strategicActions?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-orange-500" />
                    {isAr ? 'الإجراءات الاستراتيجية المقترحة' : 'Proposed Strategic Actions'}
                  </h3>
                  <div className="space-y-3">
                    {decisionsResult.strategicActions.map((a: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${a.priority === 'high' ? 'bg-red-500/10 text-red-600' : a.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {a.priority === 'high' ? (isAr ? '🔴 حرج' : '🔴 High') : a.priority === 'medium' ? (isAr ? '🟡 متوسط' : '🟡 Medium') : (isAr ? '🔵 منخفض' : '🔵 Low')}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs font-bold">{a.title}</p>
                          <p className="text-[10px] text-muted-foreground">{a.expectedImpact}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted font-semibold text-muted-foreground">{a.category}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {analyticsResult?.recommendations?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    {isAr ? 'توصيات AI لزيادة الأرباح' : 'AI Profit Recommendations'}
                  </h3>
                  <div className="space-y-2">
                    {analyticsResult.recommendations.map((r: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${r.impact === 'high' ? 'bg-red-500/10 text-red-600' : r.impact === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {r.impact === 'high' ? '🔴' : r.impact === 'medium' ? '🟡' : '🔵'}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-foreground">{r.title}</p>
                          <p className="text-[10px] text-muted-foreground">{r.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Zap size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground text-sm font-semibold">{isAr ? 'شغّل التحليل للحصول على الإجراءات الاستراتيجية' : 'Run analysis for strategic actions'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAnalyticsPage;
