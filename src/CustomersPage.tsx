import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Trash2, X, Loader, Edit2, CheckCircle, Phone, Mail, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from './api';
import { useSettings } from './SettingsContext';

interface Customer {
  id: number; name: string; phone: string; email: string; address: string; created_at: string;
}

const CustomersPage: React.FC = () => {
  const { settings } = useSettings();
  const lang = settings.lang;

  const t = {
    title: lang === 'ar' ? 'إدارة العملاء' : 'Customer Management',
    subtitle: lang === 'ar' ? 'قاعدة بيانات جميع عملاء الاستوديو' : 'Studio customer database',
    addBtn: lang === 'ar' ? 'إضافة عميل' : 'Add Customer',
    search: lang === 'ar' ? 'ابحث بالاسم أو الهاتف...' : 'Search by name or phone...',
    name: lang === 'ar' ? 'اسم العميل' : 'Customer Name',
    phone: lang === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    email: lang === 'ar' ? 'البريد الإلكتروني' : 'Email',
    address: lang === 'ar' ? 'العنوان' : 'Address',
    actions: lang === 'ar' ? 'إجراءات' : 'Actions',
    date: lang === 'ar' ? 'تاريخ الإضافة' : 'Join Date',
    save: lang === 'ar' ? 'حفظ' : 'Save',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    empty: lang === 'ar' ? 'لا يوجد عملاء حالياً' : 'No customers found',
    loading: lang === 'ar' ? 'جاري التحميل...' : 'Loading...',
    confirmDelete: lang === 'ar' ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Delete this customer?',
    editCustomer: lang === 'ar' ? 'تعديل العميل' : 'Edit Customer',
    addCustomer: lang === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer',
    totalCustomers: lang === 'ar' ? 'إجمالي العملاء' : 'Total Customers',
    thisMonth: lang === 'ar' ? 'هذا الشهر' : 'This Month',
    thisWeek: lang === 'ar' ? 'هذا الأسبوع' : 'This Week',
    duplicateWarning: lang === 'ar' ? 'عملاء مشابهين موجودين بالفعل:' : 'Similar existing customers:',
  };

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToastMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg); setToastType(type); setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try { const res = await getCustomers(); setCustomers(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

  // Stats
  const now = new Date();
  const thisMonthCount = customers.filter(c => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const thisWeekCount = customers.filter(c => {
    const d = new Date(c.created_at);
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const openAddModal = () => {
    setEditingCustomer(null); setFormName(''); setFormPhone(''); setFormEmail(''); setFormAddress('');
    setShowModal(true);
  };
  const openEditModal = (c: Customer) => {
    setEditingCustomer(c); setFormName(c.name); setFormPhone(c.phone); setFormEmail(c.email || ''); setFormAddress(c.address || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName || !formPhone) return;
    setSaving(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, { name: formName, phone: formPhone, email: formEmail, address: formAddress });
        showToastMsg(lang === 'ar' ? 'تم تحديث بيانات العميل' : 'Customer updated');
      } else {
        const cleanPhone = formPhone.replace(/[^0-9]/g, '');
        const phoneWithCode = cleanPhone.startsWith(settings.countryCode) ? cleanPhone : settings.countryCode + cleanPhone;
        await addCustomer({ name: formName, phone: phoneWithCode, email: formEmail, address: formAddress });
        showToastMsg(lang === 'ar' ? 'تمت إضافة العميل بنجاح' : 'Customer added');
      }
      setShowModal(false); fetchCustomers();
    } catch (err) { console.error(err); showToastMsg(lang === 'ar' ? 'حدث خطأ' : 'Error occurred', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t.confirmDelete)) return;
    try { await deleteCustomer(id); fetchCustomers(); showToastMsg(lang === 'ar' ? 'تم حذف العميل' : 'Customer deleted'); }
    catch (err) { console.error(err); }
  };

  // Duplicate detection
  const phoneMatches = !editingCustomer && formPhone.length >= 3
    ? customers.filter(c => {
        const cleanInput = formPhone.replace(/[^0-9]/g, '');
        return c.phone.includes(cleanInput) || c.name.toLowerCase().includes(formPhone.toLowerCase());
      }).slice(0, 3)
    : [];

  const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo";

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users size={20} className="text-primary" />
              </div>
              {t.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 ms-[52px]">{t.subtitle}</p>
          </div>
          <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20">
            <UserPlus size={18} /> {t.addBtn}
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Users size={16} className="text-primary" /></div>
            <span className="text-xs font-bold text-muted-foreground uppercase">{t.totalCustomers}</span>
          </div>
          <span className="text-2xl font-black text-foreground font-mono">{customers.length}</span>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><TrendingUp size={16} className="text-emerald-500" /></div>
            <span className="text-xs font-bold text-muted-foreground uppercase">{t.thisMonth}</span>
          </div>
          <span className="text-2xl font-black text-foreground font-mono">{thisMonthCount}</span>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><Calendar size={16} className="text-amber-500" /></div>
            <span className="text-xs font-bold text-muted-foreground uppercase">{t.thisWeek}</span>
          </div>
          <span className="text-2xl font-black text-foreground font-mono">{thisWeekCount}</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder={t.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputClass} ps-10`} />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-wider">{t.name}</th>
              <th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-wider">{t.phone}</th>
              <th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-wider hidden lg:table-cell">{t.email}</th>
              <th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-wider hidden lg:table-cell">{t.date}</th>
              <th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-wider">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-16"><Loader className="animate-spin mx-auto text-primary" size={28} /><p className="text-muted-foreground text-sm mt-3">{t.loading}</p></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-16 text-muted-foreground"><Users size={32} className="mx-auto mb-3 opacity-30" /><p>{t.empty}</p></td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-sm font-black shrink-0">{c.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <span className="text-sm font-bold text-foreground block">{c.name}</span>
                      {c.address && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin size={9} />{c.address}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-muted-foreground font-mono flex items-center gap-1.5"><Phone size={12} />{c.phone}</span>
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  {c.email ? <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Mail size={12} />{c.email}</span> : <span className="text-muted-foreground/40">-</span>}
                </td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEditModal(c)} className="p-2 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-3"><Loader className="animate-spin text-primary" size={28} /><p className="text-muted-foreground text-sm">{t.loading}</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><Users size={32} className="mx-auto mb-3 opacity-30" /><p>{t.empty}</p></div>
        ) : filtered.map(c => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-sm font-black shrink-0">{c.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5" dir="ltr"><Phone size={10} />{c.phone}</p>
                {c.email && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate"><Mail size={10} />{c.email}</p>}
                {c.address && <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin size={9} />{c.address}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 border-t border-border pt-3 mt-3">
              <span className="flex-1 text-[10px] text-muted-foreground flex items-center gap-1"><Calendar size={10} />{new Date(c.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
              <button onClick={() => openEditModal(c)} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all"><Edit2 size={15} /></button>
              <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg border border-border text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={15} /></button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100] flex items-center justify-center p-5" onClick={() => setShowModal(false)}>
            <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-border">
                <h3 className="font-bold text-foreground">{editingCustomer ? t.editCustomer : t.addCustomer}</h3>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.name} *</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} className={inputClass} placeholder={lang === 'ar' ? 'اسم العميل...' : 'Customer name...'} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.phone} *</label>
                  <input value={formPhone} onChange={e => setFormPhone(e.target.value)} className={inputClass} dir="ltr" placeholder="01xxxxxxxxx" />
                  {phoneMatches.length > 0 && (
                    <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                      <p className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1.5">
                        <Search size={12} />{t.duplicateWarning}
                      </p>
                      <div className="space-y-1.5">
                        {phoneMatches.map(c => (
                          <div key={c.id} className="flex justify-between items-center px-3 py-2 bg-card rounded-lg border border-border">
                            <span className="text-sm font-bold text-foreground">{c.name}</span>
                            <span className="text-xs text-muted-foreground font-mono" dir="ltr">{c.phone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.email}</label>
                  <input value={formEmail} onChange={e => setFormEmail(e.target.value)} className={inputClass} type="email" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.address}</label>
                  <textarea value={formAddress} onChange={e => setFormAddress(e.target.value)} className={`${inputClass} min-h-[60px] resize-y`} placeholder={lang === 'ar' ? 'العنوان...' : 'Address...'} />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                <button onClick={handleSave} disabled={!formName || !formPhone || saving}
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all">
                  {saving ? <Loader className="animate-spin" size={16} /> : <CheckCircle size={16} />}{t.save}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-2xl z-[5000] flex items-center gap-2.5 ${toastType === 'success' ? 'bg-emerald-600' : 'bg-destructive'}`}>
            {toastType === 'success' ? <CheckCircle size={18} /> : <X size={18} />}{toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomersPage;
