import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader, DollarSign, Wallet, Clock, CreditCard, FileText } from 'lucide-react';
import { getExpenses, getSalaries, getAdvances, getAttendance, getSalaryReport, getUsers } from './api';
import { offlineCreateExpense, offlineDeleteExpense, offlineCreateSalary, offlineDeleteSalary, offlineCreateAdvance, offlineDeleteAdvance, offlineCreateAttendance, offlineDeleteAttendance } from './offlineApi';
import { useSettings } from './SettingsContext';

const ExpensesPage: React.FC<{ user?: { name: string } }> = ({ user }) => {
  const { settings } = useSettings();
  const lang = settings.lang;
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'expenses' | 'advances' | 'salaries' | 'attendance'>('expenses');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Data
  const [expenses, setExpenses] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Expense form
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState(isAr ? 'عامة' : 'General');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [expNotes, setExpNotes] = useState('');

  // Advance form
  const [advUserId, setAdvUserId] = useState<number | ''>('');
  const [advUserName, setAdvUserName] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advReason, setAdvReason] = useState('');
  const [advDate, setAdvDate] = useState(new Date().toISOString().slice(0, 10));

  // Attendance form
  const [attUserId, setAttUserId] = useState<number | ''>('');
  const [attUserName, setAttUserName] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attCheckIn, setAttCheckIn] = useState('');
  const [attCheckOut, setAttCheckOut] = useState('');
  const [attScheduledIn, setAttScheduledIn] = useState('09:00');
  const [attScheduledOut, setAttScheduledOut] = useState('17:00');
  const [attStatus, setAttStatus] = useState('present');
  const [attNotes, setAttNotes] = useState('');
  const [attFilterUser, setAttFilterUser] = useState<number | ''>('');
  const [attFilterMonth, setAttFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  // Salary form
  const [salUserId, setSalUserId] = useState<number | ''>('');
  const [salUserName, setSalUserName] = useState('');
  const [salMonth, setSalMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salReport, setSalReport] = useState<any>(null);
  const [salBonus, setSalBonus] = useState('0');
  const [salExtraDeductions, setSalExtraDeductions] = useState('0');
  const [salNotes, setSalNotes] = useState('');
  const [showSalaryReport, setShowSalaryReport] = useState(false);

  const toast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg); setToastType(type); setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchData = async () => {
    try {
      const [eRes, sRes, aRes, atRes, uRes] = await Promise.all([
        getExpenses().catch(() => ({ data: [] })),
        getSalaries().catch(() => ({ data: [] })),
        getAdvances().catch(() => ({ data: [] })),
        getAttendance().catch(() => ({ data: [] })),
        getUsers().catch(() => ({ data: [] })),
      ]);
      setExpenses(Array.isArray(eRes.data) ? eRes.data : []);
      setSalaries(Array.isArray(sRes.data) ? sRes.data : []);
      setAdvances(Array.isArray(aRes.data) ? aRes.data : []);
      setAttendance(Array.isArray(atRes.data) ? atRes.data : []);
      setEmployees(Array.isArray(uRes.data) ? uRes.data : []);
    } catch { toast(isAr ? 'فشل تحميل البيانات' : 'Failed to load', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all";

  const loadSalaryReport = async () => {
    if (!salUserId || !salMonth) return;
    try {
      const res = await getSalaryReport(salUserId as number, salMonth);
      setSalReport(res.data);
      setShowSalaryReport(true);
    } catch { toast(isAr ? 'فشل تحميل التقرير' : 'Failed to load report', 'error'); }
  };

  const handlePaySalary = async () => {
    if (!salReport || !salUserId) return;
    setSaving(true);
    try {
      const bonus = parseFloat(salBonus) || 0;
      const extraDed = parseFloat(salExtraDeductions) || 0;
      await offlineCreateSalary({
        user_id: salUserId,
        user_name: salUserName,
        base_salary: salReport.base_salary,
        amount: salReport.base_salary,
        bonus,
        overtime_hours: (salReport.total_overtime_minutes / 60).toFixed(2),
        overtime_amount: salReport.overtime_amount,
        late_hours: (salReport.total_late_minutes / 60).toFixed(2),
        late_deduction: salReport.late_deduction,
        advances_deduction: salReport.total_advances,
        deductions: extraDed,
        month: salMonth,
        notes: salNotes,
        attendance_summary: JSON.stringify({
          days_present: salReport.days_present,
          days_absent: salReport.days_absent,
          days_late: salReport.days_late,
        }),
        created_by: user?.name || 'Admin',
      });
      toast(isAr ? 'تم صرف المرتب بنجاح' : 'Salary paid');
      setSalUserId(''); setSalUserName(''); setSalReport(null); setShowSalaryReport(false);
      setSalBonus('0'); setSalExtraDeductions('0'); setSalNotes('');
      await fetchData();
    } catch { toast(isAr ? 'فشل' : 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[200px]"><Loader className="animate-spin text-primary" size={24} /></div>;

  const tabs = [
    { key: 'expenses' as const, label: isAr ? 'المصاريف العادية' : 'Expenses', icon: Wallet, color: 'text-orange-500' },
    { key: 'advances' as const, label: isAr ? 'السلف' : 'Advances', icon: CreditCard, color: 'text-blue-500' },
    { key: 'salaries' as const, label: isAr ? 'المرتبات' : 'Salaries', icon: DollarSign, color: 'text-emerald-500' },
    { key: 'attendance' as const, label: isAr ? 'الحضور والانصراف' : 'Attendance', icon: Clock, color: 'text-purple-500' },
  ];

  const expCategories = isAr
    ? ['عامة', 'إيجار', 'كهرباء ومياه', 'صيانة', 'نقل', 'تسويق', 'أخرى']
    : ['General', 'Rent', 'Utilities', 'Maintenance', 'Transport', 'Marketing', 'Other'];

  const filteredAttendance = attendance.filter((a: any) => {
    if (attFilterUser && a.user_id !== attFilterUser) return false;
    if (attFilterMonth && !(a.attendance_date || '').startsWith(attFilterMonth)) return false;
    return true;
  });

  return (
    <div className="animate-fade-in text-start">
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl shadow-lg text-sm font-bold text-white ${toastType === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <Wallet size={20} className="text-white" />
            </div>
            {isAr ? 'المصاريف والمرتبات' : 'Expenses & Payroll'}
          </h2>
          <div className="flex gap-1 bg-muted p-1 rounded-xl flex-wrap">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === tab.key ? `bg-card ${tab.color} shadow-sm` : 'text-muted-foreground hover:text-foreground'}`}>
                <tab.icon size={14} />{tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ═══ EXPENSES TAB ═══ */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Wallet size={16} className="text-orange-500" />{isAr ? 'سجل المصاريف' : 'Expense Records'}</h3>
            {expenses.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl"><Wallet size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground text-sm">{isAr ? 'لا يوجد مصاريف' : 'No expenses'}</p></div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full"><thead><tr className="bg-muted/50">
                  <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الوصف' : 'Description'}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الفئة' : 'Category'}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'المبلغ' : 'Amount'}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr></thead><tbody>
                  {expenses.map((exp: any) => (
                    <tr key={exp.id} className="border-t border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">{exp.description}</td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 font-semibold">{exp.category}</span></td>
                      <td className="px-4 py-3 text-sm font-bold text-orange-600">{Number(exp.amount).toLocaleString()} {settings.currency}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{(exp.expense_date || exp.created_at || '').slice(0, 10)}</td>
                      <td className="px-4 py-3"><button onClick={async () => { if (window.confirm(isAr ? 'حذف؟' : 'Delete?')) { await offlineDeleteExpense(exp.id); await fetchData(); toast(isAr ? 'تم الحذف' : 'Deleted'); } }} className="w-7 h-7 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody></table>
                <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-sm font-black text-orange-600">{expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0).toLocaleString()} {settings.currency}</span>
                </div>
              </div>
            )}
          </div>
          <aside>
            <div className="bg-card border-2 border-orange-500/20 rounded-2xl p-5 sticky top-24 space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2"><Plus size={16} className="text-orange-500" />{isAr ? 'إضافة مصروف' : 'Add Expense'}</h3>
              <input value={expDesc} onChange={e => setExpDesc(e.target.value)} className={inputClass} placeholder={isAr ? 'الوصف' : 'Description'} />
              <select value={expCategory} onChange={e => setExpCategory(e.target.value)} className={inputClass}>
                {expCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} className={inputClass} placeholder={isAr ? 'المبلغ' : 'Amount'} />
              <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className={inputClass} />
              <input value={expNotes} onChange={e => setExpNotes(e.target.value)} className={inputClass} placeholder={isAr ? 'ملاحظات' : 'Notes'} />
              <button disabled={!expDesc || !expAmount || saving} onClick={async () => {
                setSaving(true);
                try {
                  await offlineCreateExpense({ description: expDesc, category: expCategory, amount: parseFloat(expAmount), expense_date: expDate, notes: expNotes, created_by: user?.name || 'Admin' });
                  setExpDesc(''); setExpAmount(''); setExpNotes('');
                  await fetchData(); toast(isAr ? 'تم إضافة المصروف' : 'Added');
                } catch { toast(isAr ? 'فشل' : 'Failed', 'error'); }
                finally { setSaving(false); }
              }} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                {saving ? <Loader className="animate-spin" size={16} /> : <><Plus size={16} />{isAr ? 'حفظ' : 'Save'}</>}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ═══ ADVANCES TAB ═══ */}
      {activeTab === 'advances' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><CreditCard size={16} className="text-blue-500" />{isAr ? 'سجل السلف' : 'Advance Records'}</h3>
            {advances.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl"><CreditCard size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground text-sm">{isAr ? 'لا يوجد سلف' : 'No advances'}</p></div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full"><thead><tr className="bg-muted/50">
                  <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الموظف' : 'Employee'}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'المبلغ' : 'Amount'}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'السبب' : 'Reason'}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr></thead><tbody>
                  {advances.map((adv: any) => (
                    <tr key={adv.id} className="border-t border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-[10px] font-bold">{(adv.user_name || '?')[0]}</div><span className="text-sm font-medium">{adv.user_name}</span></div></td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">{Number(adv.amount).toLocaleString()} {settings.currency}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{adv.reason || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${adv.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : adv.status === 'deducted' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                          {adv.status === 'pending' ? (isAr ? 'معلقة' : 'Pending') : adv.status === 'deducted' ? (isAr ? 'تم الخصم' : 'Deducted') : (isAr ? 'ملغاة' : 'Cancelled')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{(adv.advance_date || adv.created_at || '').slice(0, 10)}</td>
                      <td className="px-4 py-3"><button onClick={async () => { if (window.confirm(isAr ? 'حذف؟' : 'Delete?')) { await offlineDeleteAdvance(adv.id); await fetchData(); toast(isAr ? 'تم الحذف' : 'Deleted'); } }} className="w-7 h-7 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody></table>
                <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{isAr ? 'إجمالي السلف المعلقة' : 'Total Pending'}</span>
                  <span className="text-sm font-black text-blue-600">{advances.filter((a: any) => a.status === 'pending').reduce((s: number, a: any) => s + Number(a.amount || 0), 0).toLocaleString()} {settings.currency}</span>
                </div>
              </div>
            )}
          </div>
          <aside>
            <div className="bg-card border-2 border-blue-500/20 rounded-2xl p-5 sticky top-24 space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2"><Plus size={16} className="text-blue-500" />{isAr ? 'تسجيل سلفة' : 'Record Advance'}</h3>
              <select value={advUserId} onChange={e => { const id = Number(e.target.value); setAdvUserId(id); const emp = employees.find((u: any) => u.id === id); setAdvUserName(emp?.name || ''); }} className={inputClass}>
                <option value="">{isAr ? 'اختر الموظف...' : 'Select employee...'}</option>
                {employees.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input type="number" value={advAmount} onChange={e => setAdvAmount(e.target.value)} className={inputClass} placeholder={isAr ? 'المبلغ' : 'Amount'} />
              <input value={advReason} onChange={e => setAdvReason(e.target.value)} className={inputClass} placeholder={isAr ? 'السبب' : 'Reason'} />
              <input type="date" value={advDate} onChange={e => setAdvDate(e.target.value)} className={inputClass} />
              <button disabled={!advUserId || !advAmount || saving} onClick={async () => {
                setSaving(true);
                try {
                  await offlineCreateAdvance({ user_id: advUserId, user_name: advUserName, amount: parseFloat(advAmount), reason: advReason, advance_date: advDate, created_by: user?.name || 'Admin' });
                  setAdvUserId(''); setAdvUserName(''); setAdvAmount(''); setAdvReason('');
                  await fetchData(); toast(isAr ? 'تم تسجيل السلفة' : 'Advance recorded');
                } catch { toast(isAr ? 'فشل' : 'Failed', 'error'); }
                finally { setSaving(false); }
              }} className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                {saving ? <Loader className="animate-spin" size={16} /> : <><Plus size={16} />{isAr ? 'حفظ' : 'Save'}</>}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ═══ ATTENDANCE TAB ═══ */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Clock size={16} className="text-purple-500" />{isAr ? 'سجل الحضور والانصراف' : 'Attendance Log'}</h3>
              <select value={attFilterUser} onChange={e => setAttFilterUser(e.target.value ? Number(e.target.value) : '')} className="px-3 py-1.5 bg-muted border border-border rounded-lg text-xs">
                <option value="">{isAr ? 'كل الموظفين' : 'All Employees'}</option>
                {employees.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input type="month" value={attFilterMonth} onChange={e => setAttFilterMonth(e.target.value)} className="px-3 py-1.5 bg-muted border border-border rounded-lg text-xs" />
            </div>
            {filteredAttendance.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl"><Clock size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground text-sm">{isAr ? 'لا يوجد سجلات' : 'No records'}</p></div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full"><thead><tr className="bg-muted/50">
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الموظف' : 'Employee'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الحضور' : 'In'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الانصراف' : 'Out'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'تأخير (د)' : 'Late (m)'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'إضافي (د)' : 'OT (m)'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr></thead><tbody>
                  {filteredAttendance.map((att: any) => (
                    <tr key={att.id} className="border-t border-border/50 hover:bg-muted/30">
                      <td className="px-3 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center text-[10px] font-bold">{(att.user_name || '?')[0]}</div><span className="text-xs font-medium">{att.user_name}</span></div></td>
                      <td className="px-3 py-3 text-xs">{att.attendance_date}</td>
                      <td className="px-3 py-3 text-xs font-mono">{att.check_in || '-'}</td>
                      <td className="px-3 py-3 text-xs font-mono">{att.check_out || '-'}</td>
                      <td className="px-3 py-3 text-xs font-bold text-red-500">{att.late_minutes > 0 ? att.late_minutes : '-'}</td>
                      <td className="px-3 py-3 text-xs font-bold text-emerald-500">{att.overtime_minutes > 0 ? att.overtime_minutes : '-'}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${att.status === 'present' ? 'bg-emerald-500/10 text-emerald-600' : att.status === 'late' ? 'bg-amber-500/10 text-amber-600' : att.status === 'absent' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {att.status === 'present' ? (isAr ? 'حاضر' : 'Present') : att.status === 'late' ? (isAr ? 'متأخر' : 'Late') : att.status === 'absent' ? (isAr ? 'غائب' : 'Absent') : att.status === 'vacation' ? (isAr ? 'إجازة' : 'Vacation') : att.status}
                        </span>
                      </td>
                      <td className="px-3 py-3"><button onClick={async () => { if (window.confirm(isAr ? 'حذف؟' : 'Delete?')) { await offlineDeleteAttendance(att.id); await fetchData(); toast(isAr ? 'تم الحذف' : 'Deleted'); } }} className="w-6 h-6 rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                </tbody></table>
                </div>
              </div>
            )}
          </div>
          <aside>
            <div className="bg-card border-2 border-purple-500/20 rounded-2xl p-5 sticky top-24 space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2"><Plus size={16} className="text-purple-500" />{isAr ? 'تسجيل حضور' : 'Record Attendance'}</h3>
              <select value={attUserId} onChange={e => { const id = Number(e.target.value); setAttUserId(id); const emp = employees.find((u: any) => u.id === id); setAttUserName(emp?.name || ''); }} className={inputClass}>
                <option value="">{isAr ? 'اختر الموظف...' : 'Select employee...'}</option>
                {employees.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block">{isAr ? 'موعد الدخول المحدد' : 'Scheduled In'}</label>
                  <input type="time" value={attScheduledIn} onChange={e => setAttScheduledIn(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block">{isAr ? 'موعد الخروج المحدد' : 'Scheduled Out'}</label>
                  <input type="time" value={attScheduledOut} onChange={e => setAttScheduledOut(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block">{isAr ? 'وقت الحضور الفعلي' : 'Actual Check-In'}</label>
                  <input type="time" value={attCheckIn} onChange={e => setAttCheckIn(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block">{isAr ? 'وقت الانصراف الفعلي' : 'Actual Check-Out'}</label>
                  <input type="time" value={attCheckOut} onChange={e => setAttCheckOut(e.target.value)} className={inputClass} />
                </div>
              </div>
              <select value={attStatus} onChange={e => setAttStatus(e.target.value)} className={inputClass}>
                <option value="present">{isAr ? 'حاضر' : 'Present'}</option>
                <option value="absent">{isAr ? 'غائب' : 'Absent'}</option>
                <option value="half_day">{isAr ? 'نصف يوم' : 'Half Day'}</option>
                <option value="vacation">{isAr ? 'إجازة' : 'Vacation'}</option>
              </select>
              <input value={attNotes} onChange={e => setAttNotes(e.target.value)} className={inputClass} placeholder={isAr ? 'ملاحظات' : 'Notes'} />
              <button disabled={!attUserId || saving} onClick={async () => {
                setSaving(true);
                try {
                  await offlineCreateAttendance({ user_id: attUserId, user_name: attUserName, attendance_date: attDate, check_in: attCheckIn || null, check_out: attCheckOut || null, scheduled_in: attScheduledIn, scheduled_out: attScheduledOut, status: attStatus, notes: attNotes, created_by: user?.name || 'Admin' });
                  setAttCheckIn(''); setAttCheckOut(''); setAttNotes('');
                  await fetchData(); toast(isAr ? 'تم التسجيل' : 'Recorded');
                } catch { toast(isAr ? 'فشل' : 'Failed', 'error'); }
                finally { setSaving(false); }
              }} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                {saving ? <Loader className="animate-spin" size={16} /> : <><Clock size={16} />{isAr ? 'تسجيل' : 'Record'}</>}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ═══ SALARIES TAB ═══ */}
      {activeTab === 'salaries' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><DollarSign size={16} className="text-emerald-500" />{isAr ? 'سجل المرتبات' : 'Salary Records'}</h3>
            {salaries.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl"><DollarSign size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground text-sm">{isAr ? 'لا يوجد مرتبات' : 'No salaries'}</p></div>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full"><thead><tr className="bg-muted/50">
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الموظف' : 'Employee'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الأساسي' : 'Base'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'بونص' : 'Bonus'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'إضافي' : 'OT'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'خصم تأخير' : 'Late Ded.'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'سلف' : 'Advances'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'خصومات' : 'Ded.'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الصافي' : 'Net'}</th>
                  <th className="px-3 py-3 text-start text-[11px] font-bold text-muted-foreground">{isAr ? 'الشهر' : 'Month'}</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr></thead><tbody>
                  {salaries.map((sal: any) => (
                    <tr key={sal.id} className="border-t border-border/50 hover:bg-muted/30">
                      <td className="px-3 py-3"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-bold">{(sal.user_name || '?')[0]}</div><span className="text-xs font-medium">{sal.user_name}</span></div></td>
                      <td className="px-3 py-3 text-xs">{Number(sal.amount || 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs text-emerald-600">+{Number(sal.bonus || 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs text-emerald-600">+{Number(sal.overtime_amount || 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs text-red-500">-{Number(sal.late_deduction || 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs text-red-500">-{Number(sal.advances_deduction || 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs text-red-500">-{Number(sal.deductions || 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-xs font-black text-emerald-600">{Number(sal.net_salary).toLocaleString()} {settings.currency}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{sal.month}</td>
                      <td className="px-3 py-3"><button onClick={async () => { if (window.confirm(isAr ? 'حذف؟' : 'Delete?')) { await offlineDeleteSalary(sal.id); await fetchData(); toast(isAr ? 'تم الحذف' : 'Deleted'); } }} className="w-6 h-6 rounded text-destructive/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                </tbody></table>
                </div>
                <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span className="text-sm font-black text-emerald-600">{salaries.reduce((s: number, e: any) => s + Number(e.net_salary || 0), 0).toLocaleString()} {settings.currency}</span>
                </div>
              </div>
            )}
          </div>
          <aside>
            <div className="bg-card border-2 border-emerald-500/20 rounded-2xl p-5 sticky top-24 space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2"><DollarSign size={16} className="text-emerald-500" />{isAr ? 'صرف مرتب' : 'Pay Salary'}</h3>
              <select value={salUserId} onChange={e => { const id = Number(e.target.value); setSalUserId(id); const emp = employees.find((u: any) => u.id === id); setSalUserName(emp?.name || ''); setSalReport(null); setShowSalaryReport(false); }} className={inputClass}>
                <option value="">{isAr ? 'اختر الموظف...' : 'Select employee...'}</option>
                {employees.map((u: any) => <option key={u.id} value={u.id}>{u.name} - {isAr ? 'المرتب' : 'Salary'}: {Number(u.base_salary || 0).toLocaleString()} {settings.currency}</option>)}
              </select>
              <input type="month" value={salMonth} onChange={e => { setSalMonth(e.target.value); setSalReport(null); setShowSalaryReport(false); }} className={inputClass} />
              
              {salUserId && (
                <button onClick={loadSalaryReport} className="w-full py-2.5 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 font-bold text-sm hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2">
                  <FileText size={16} />{isAr ? 'تحميل تقرير المرتب' : 'Load Salary Report'}
                </button>
              )}

              {showSalaryReport && salReport && (
                <div className="space-y-3">
                  {/* Attendance Summary */}
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-purple-600 flex items-center gap-1"><Clock size={12} />{isAr ? 'ملخص الحضور' : 'Attendance Summary'}</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-card rounded-lg p-2"><div className="text-lg font-black text-emerald-600">{salReport.days_present}</div><div className="text-[10px] text-muted-foreground">{isAr ? 'حاضر' : 'Present'}</div></div>
                      <div className="bg-card rounded-lg p-2"><div className="text-lg font-black text-red-500">{salReport.days_absent}</div><div className="text-[10px] text-muted-foreground">{isAr ? 'غائب' : 'Absent'}</div></div>
                      <div className="bg-card rounded-lg p-2"><div className="text-lg font-black text-amber-600">{salReport.days_late}</div><div className="text-[10px] text-muted-foreground">{isAr ? 'متأخر' : 'Late'}</div></div>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-emerald-600">{isAr ? 'التفاصيل المالية' : 'Financial Details'}</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'المرتب الأساسي' : 'Base Salary'}:</span><span className="font-bold">{Number(salReport.base_salary).toLocaleString()} {settings.currency}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'الوقت الإضافي' : 'Overtime'} ({(salReport.total_overtime_minutes / 60).toFixed(1)}h):</span><span className="font-bold text-emerald-600">+{Number(salReport.overtime_amount).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'خصم التأخير' : 'Late Deduction'} ({(salReport.total_late_minutes / 60).toFixed(1)}h):</span><span className="font-bold text-red-500">-{Number(salReport.late_deduction).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'سلف معلقة' : 'Pending Advances'}:</span><span className="font-bold text-red-500">-{Number(salReport.total_advances).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{isAr ? 'سعر الساعة' : 'Hourly Rate'}:</span><span className="font-bold">{Number(salReport.hourly_rate).toFixed(2)} {settings.currency}</span></div>
                    </div>
                  </div>

                  {/* Bonus & Extra Deductions */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">{isAr ? 'بونص' : 'Bonus'}</label>
                      <input type="number" value={salBonus} onChange={e => setSalBonus(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">{isAr ? 'خصومات أخرى' : 'Other Ded.'}</label>
                      <input type="number" value={salExtraDeductions} onChange={e => setSalExtraDeductions(e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  {/* Net Salary */}
                  <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-2 border-emerald-500/30 rounded-xl">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">{isAr ? 'صافي المرتب' : 'Net Salary'}</div>
                      <div className="text-2xl font-black text-emerald-600">
                        {(salReport.base_salary + salReport.overtime_amount + (parseFloat(salBonus) || 0) - salReport.late_deduction - salReport.total_advances - (parseFloat(salExtraDeductions) || 0)).toLocaleString()} {settings.currency}
                      </div>
                    </div>
                  </div>

                  <input value={salNotes} onChange={e => setSalNotes(e.target.value)} className={inputClass} placeholder={isAr ? 'ملاحظات' : 'Notes'} />

                  <button disabled={saving} onClick={handlePaySalary}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                    {saving ? <Loader className="animate-spin" size={16} /> : <><DollarSign size={16} />{isAr ? 'صرف المرتب' : 'Pay Salary'}</>}
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
