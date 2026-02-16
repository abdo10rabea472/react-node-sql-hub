import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Edit3, Trash2, X, Shield, ShieldCheck, User as UserIcon, CheckCircle, XCircle, Ban, ChevronLeft, ChevronRight, AlertTriangle, Loader, Clock } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from './api';
import { useSettings } from './SettingsContext';

interface UserData { id: number; name: string; email: string; role: string; status: string; base_salary: number; shift_start: string; shift_end: string; created_at: string; updated_at: string; }

const t = {
  ar: { title: 'إدارة الموظفين', subtitle: 'عرض وإدارة جميع الموظفين في النظام', addUser: 'إضافة موظف', search: 'ابحث بالاسم أو البريد...', name: 'الاسم', email: 'البريد الإلكتروني', password: 'كلمة المرور', role: 'الدور', status: 'الحالة', actions: 'إجراءات', joinDate: 'تاريخ الانضمام', admin: 'مدير', editor: 'محرر', user: 'موظف', active: 'نشط', inactive: 'غير نشط', banned: 'محظور', edit: 'تعديل', delete: 'حذف', save: 'حفظ', cancel: 'إلغاء', confirmDelete: 'هل أنت متأكد من حذف هذا الموظف؟', yes: 'نعم، احذف', no: 'لا، إلغاء', noUsers: 'لا يوجد موظفين', total: 'المجموع', addUserTitle: 'إضافة موظف جديد', editUserTitle: 'تعديل الموظف', allRoles: 'جميع الأدوار', allStatuses: 'جميع الحالات', loading: 'جاري التحميل...', errorLoad: 'خطأ في تحميل البيانات', retry: 'إعادة المحاولة', success: 'تمت العملية بنجاح', errorOp: 'حدث خطأ', baseSalary: 'المرتب الأساسي', shiftStart: 'موعد الحضور', shiftEnd: 'موعد الانصراف', shiftSchedule: 'مواعيد الشيفت' },
  en: { title: 'Employee Management', subtitle: 'View and manage all system employees', addUser: 'Add Employee', search: 'Search by name or email...', name: 'Name', email: 'Email', password: 'Password', role: 'Role', status: 'Status', actions: 'Actions', joinDate: 'Join Date', admin: 'Admin', editor: 'Editor', user: 'Employee', active: 'Active', inactive: 'Inactive', banned: 'Banned', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel', confirmDelete: 'Are you sure you want to delete this employee?', yes: 'Yes, Delete', no: 'No, Cancel', noUsers: 'No employees found', total: 'Total', addUserTitle: 'Add New Employee', editUserTitle: 'Edit Employee', allRoles: 'All Roles', allStatuses: 'All Statuses', loading: 'Loading...', errorLoad: 'Error loading data', retry: 'Retry', success: 'Operation successful', errorOp: 'An error occurred', baseSalary: 'Base Salary', shiftStart: 'Shift Start', shiftEnd: 'Shift End', shiftSchedule: 'Shift Schedule' },
};

const ITEMS_PER_PAGE = 8;

const UsersPage: React.FC = () => {
  const { settings } = useSettings();
  const lang = settings.lang;
  const l = t[lang];
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [formStatus, setFormStatus] = useState('active');
  const [formBaseSalary, setFormBaseSalary] = useState('0');
  const [formShiftStart, setFormShiftStart] = useState('09:00');
  const [formShiftEnd, setFormShiftEnd] = useState('17:00');

  const fetchUsers = async () => { setLoading(true); setError(''); try { const res = await getUsers(); setUsers(res.data); } catch { setError(l.errorLoad); } finally { setLoading(false); } };
  useEffect(() => { fetchUsers(); }, []);
  const showToast = (message: string, type: 'success' | 'error') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (!filterRole || u.role === filterRole) && (!filterStatus || u.status === filterStatus);
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  useEffect(() => { setPage(1); }, [searchQuery, filterRole, filterStatus]);

  const openAddModal = () => { setFormName(''); setFormEmail(''); setFormPassword(''); setFormRole('user'); setFormStatus('active'); setFormBaseSalary('0'); setFormShiftStart('09:00'); setFormShiftEnd('17:00'); setShowAddModal(true); };
  const openEditModal = (user: UserData) => { setFormName(user.name); setFormEmail(user.email); setFormPassword(''); setFormRole(user.role); setFormStatus(user.status); setFormBaseSalary(String(user.base_salary || 0)); setFormShiftStart(user.shift_start?.slice(0, 5) || '09:00'); setFormShiftEnd(user.shift_end?.slice(0, 5) || '17:00'); setEditingUser(user); };

  const handleAdd = async () => { if (!formName || !formEmail || !formPassword) return; setSaving(true); try { await createUser({ name: formName, email: formEmail, password: formPassword, role: formRole, base_salary: formBaseSalary, shift_start: formShiftStart, shift_end: formShiftEnd }); showToast(l.success, 'success'); setShowAddModal(false); fetchUsers(); } catch (err: any) { showToast(err.response?.data?.message || l.errorOp, 'error'); } finally { setSaving(false); } };
  const handleEdit = async () => { if (!editingUser) return; setSaving(true); try { const data: Record<string, string> = { name: formName, email: formEmail, role: formRole, status: formStatus, base_salary: formBaseSalary, shift_start: formShiftStart, shift_end: formShiftEnd }; if (formPassword) data.password = formPassword; await updateUser(editingUser.id, data); showToast(l.success, 'success'); setEditingUser(null); fetchUsers(); } catch (err: any) { showToast(err.response?.data?.message || l.errorOp, 'error'); } finally { setSaving(false); } };
  const handleDelete = async () => { if (!deletingUser) return; setSaving(true); try { await deleteUser(deletingUser.id); showToast(l.success, 'success'); setDeletingUser(null); fetchUsers(); } catch (err: any) { showToast(err.response?.data?.message || l.errorOp, 'error'); } finally { setSaving(false); } };

  const getRoleIcon = (role: string) => { switch (role) { case 'admin': return <ShieldCheck size={13} />; case 'editor': return <Shield size={13} />; default: return <UserIcon size={13} />; } };
  const getRoleLabel = (role: string) => { switch (role) { case 'admin': return l.admin; case 'editor': return l.editor; default: return l.user; } };
  const getStatusIcon = (status: string) => { switch (status) { case 'active': return <CheckCircle size={13} />; case 'inactive': return <XCircle size={13} />; default: return <Ban size={13} />; } };
  const getStatusLabel = (status: string) => { switch (status) { case 'active': return l.active; case 'inactive': return l.inactive; default: return l.banned; } };
  const formatDate = (date: string) => { try { return new Date(date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return date; } }; void formatDate;

  const roleBadgeClass = (role: string) => role === 'admin' ? 'bg-red-500/10 text-red-500' : role === 'editor' ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary';
  const statusBadgeClass = (status: string) => status === 'active' ? 'bg-success/10 text-success' : status === 'inactive' ? 'bg-muted text-muted-foreground' : 'bg-red-500/10 text-red-500';

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-muted-foreground"><Loader size={28} className="animate-spin text-primary" /><p>{l.loading}</p></div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-destructive"><AlertTriangle size={36} /><p>{error}</p><button onClick={fetchUsers} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm">{l.retry}</button></div>;

  return (
    <div className="animate-fade-in relative">
      <AnimatePresence>{toast && <motion.div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-2 shadow-xl ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'}`} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>{toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}{toast.message}</motion.div>}</AnimatePresence>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div><h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5"><Users size={22} />{l.title}</h2><p className="text-sm text-muted-foreground mt-1">{l.subtitle}</p></div>
        <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-primary/20"><UserPlus size={18} />{l.addUser}</button>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-5 items-center">
        <div className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-3.5 h-10 flex-1 min-w-[200px] max-w-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
          <Search size={18} className="text-muted-foreground" /><input type="text" placeholder={l.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-foreground font-cairo placeholder:text-muted-foreground" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-10 px-3.5 rounded-lg border border-border bg-card text-foreground text-sm font-cairo cursor-pointer focus:outline-none focus:border-primary/50">
          <option value="">{l.allRoles}</option><option value="admin">{l.admin}</option><option value="editor">{l.editor}</option><option value="user">{l.user}</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-10 px-3.5 rounded-lg border border-border bg-card text-foreground text-sm font-cairo cursor-pointer focus:outline-none focus:border-primary/50">
          <option value="">{l.allStatuses}</option><option value="active">{l.active}</option><option value="inactive">{l.inactive}</option><option value="banned">{l.banned}</option>
        </select>
        <span className="text-xs text-muted-foreground font-semibold bg-muted px-3 py-2 rounded-lg ms-auto">{l.total}: {filteredUsers.length}</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-muted/50">
              <th className="px-3 sm:px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">#</th>
              <th className="px-3 sm:px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{l.name}</th>
              <th className="px-3 sm:px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden md:table-cell">{l.email}</th>
              <th className="px-3 sm:px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{l.role}</th>
              <th className="px-3 sm:px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">{l.shiftSchedule}</th>
              <th className="px-3 sm:px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">{l.status}</th>
              <th className="px-3 sm:px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{l.actions}</th>
            </tr></thead>
            <tbody>
              {paginatedUsers.length === 0 ? <tr><td colSpan={7} className="text-center py-16 text-muted-foreground">{l.noUsers}</td></tr> :
                paginatedUsers.map((u, idx) => (
                  <motion.tr key={u.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}>
                    <td className="px-3 sm:px-4 py-3 text-sm text-muted-foreground font-semibold tabular-nums hidden sm:table-cell">{u.id}</td>
                    <td className="px-3 sm:px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-sky-400 text-white flex items-center justify-center text-xs font-bold shrink-0">{u.name.charAt(0).toUpperCase()}</div><span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">{u.name}</span></div></td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-muted-foreground hidden md:table-cell" dir="ltr">{u.email}</td>
                    <td className="px-3 sm:px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${roleBadgeClass(u.role)}`}>{getRoleIcon(u.role)} <span className="hidden xs:inline">{getRoleLabel(u.role)}</span></span></td>
                    <td className="px-3 sm:px-4 py-3 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600">
                        <Clock size={12} />
                        {u.shift_start?.slice(0, 5) || '09:00'} - {u.shift_end?.slice(0, 5) || '17:00'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(u.status)}`}>{getStatusIcon(u.status)} {getStatusLabel(u.status)}</span></td>
                    <td className="px-3 sm:px-4 py-3"><div className="flex gap-1.5">
                      <button onClick={() => openEditModal(u)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border flex items-center justify-center text-primary hover:bg-primary/10 transition-all"><Edit3 size={14} /></button>
                      <button onClick={() => setDeletingUser(u)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={14} /></button>
                    </div></td>
                  </motion.tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 py-3.5 border-t border-border">
            <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-40" disabled={page === 1} onClick={() => setPage(p => p - 1)}>{lang === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
            {Array.from({ length: totalPages }, (_, i) => <button key={i + 1} className={`w-8 h-8 rounded-lg text-xs font-semibold ${page === i + 1 ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:border-primary/50'}`} onClick={() => setPage(i + 1)}>{i + 1}</button>)}
            <button className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground disabled:opacity-40" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>{lang === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingUser) && (
          <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9990] flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowAddModal(false); setEditingUser(null); }}>
            <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-border"><h3 className="font-bold text-foreground">{editingUser ? l.editUserTitle : l.addUserTitle}</h3><button onClick={() => { setShowAddModal(false); setEditingUser(null); }} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button></div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{l.name}</label><input value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo" /></div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{l.email}</label><input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo" /></div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{l.password} {editingUser && `(${lang === 'ar' ? 'اتركه فارغاً لعدم التغيير' : 'leave blank to keep'})`}</label><input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="••••••••" className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{l.role}</label><select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 font-cairo"><option value="user">{l.user}</option><option value="editor">{l.editor}</option><option value="admin">{l.admin}</option></select></div>
                  {editingUser && <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{l.status}</label><select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 font-cairo"><option value="active">{l.active}</option><option value="inactive">{l.inactive}</option><option value="banned">{l.banned}</option></select></div>}
                </div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{l.baseSalary}</label><input type="number" value={formBaseSalary} onChange={e => setFormBaseSalary(e.target.value)} className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo" placeholder="0" /></div>
                
                {/* Shift Schedule */}
                <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Clock size={16} className="text-sky-500" />{l.shiftSchedule}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{l.shiftStart}</label><input type="time" value={formShiftStart} onChange={e => setFormShiftStart(e.target.value)} className="w-full px-3.5 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all" /></div>
                    <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{l.shiftEnd}</label><input type="time" value={formShiftEnd} onChange={e => setFormShiftEnd(e.target.value)} className="w-full px-3.5 py-2.5 bg-card border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all" /></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
                <button onClick={() => { setShowAddModal(false); setEditingUser(null); }} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-all">{l.cancel}</button>
                <button onClick={editingUser ? handleEdit : handleAdd} disabled={saving} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">{saving ? <Loader size={16} className="animate-spin" /> : null}{l.save}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deletingUser && (
          <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9990] flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeletingUser(null)}>
            <motion.div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
              <div className="p-7 text-center">
                <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} /></div>
                <p className="font-semibold text-foreground mb-1">{l.confirmDelete}</p>
                <p className="text-sm text-muted-foreground mb-6">{deletingUser.name} ({deletingUser.email})</p>
                <div className="flex justify-center gap-2.5">
                  <button onClick={() => setDeletingUser(null)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-all">{l.no}</button>
                  <button onClick={handleDelete} disabled={saving} className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">{saving ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}{l.yes}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;