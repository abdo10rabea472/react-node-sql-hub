import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Trash2, X, Loader } from 'lucide-react';
import { getCustomers, addCustomer, deleteCustomer } from './api';
import { useSettings } from './SettingsContext';

interface Customer {
  id: number; name: string; phone: string; email: string; address: string; created_at: string;
}

const translations = {
  ar: { title: 'إدارة العملاء', subtitle: 'قاعدة بيانات جميع عملاء الاستوديو', addBtn: 'إضافة عميل جديد', search: 'ابحث بالاسم أو الهاتف...', name: 'اسم العميل', phone: 'رقم الهاتف', email: 'البريد الإلكتروني', address: 'العنوان', actions: 'إجراءات', date: 'تاريخ الإضافة', save: 'حفظ العميل', cancel: 'إلغاء', empty: 'لا يوجد عملاء حالياً', loading: 'جاري تحميل العملاء...', confirmDelete: 'هل أنت متأكد من حذف العميل؟' },
  en: { title: 'Customer Management', subtitle: 'Studio customer database', addBtn: 'Add New Customer', search: 'Search by name or phone...', name: 'Customer Name', phone: 'Phone Number', email: 'Email', address: 'Address', actions: 'Actions', date: 'Join Date', save: 'Save Customer', cancel: 'Cancel', empty: 'No customers found', loading: 'Loading customers...', confirmDelete: 'Are you sure you want to delete this customer?' },
};

const CustomersPage: React.FC = () => {
  const { settings } = useSettings();
  const t = translations[settings.lang];

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => { setLoading(true); try { const res = await getCustomers(); setCustomers(res.data); } catch (err) { console.error(err); } finally { setLoading(false); } };
  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery));

  const handleAdd = async () => {
    if (!formName || !formPhone) return;
    setSaving(true);
    try { await addCustomer({ name: formName, phone: formPhone, email: formEmail, address: formAddress }); setShowModal(false); fetchCustomers(); setFormName(''); setFormPhone(''); setFormEmail(''); setFormAddress(''); } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => { if (!window.confirm(t.confirmDelete)) return; try { await deleteCustomer(id); fetchCustomers(); } catch (err) { console.error(err); } };

  return (
    <div className="animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5"><Users size={22} /> {t.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-primary/20">
          <UserPlus size={18} /> {t.addBtn}
        </button>
      </header>

      <div className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-3.5 h-11 mb-5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all max-w-md">
        <Search size={18} className="text-muted-foreground shrink-0" />
        <input type="text" placeholder={t.search} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-cairo placeholder:text-muted-foreground" />
      </div>

      {/* Desktop Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t.name}</th>
                <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t.phone}</th>
                <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t.email}</th>
                <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t.date}</th>
                <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-16"><Loader className="animate-spin mx-auto text-primary" size={28} /><p className="text-muted-foreground text-sm mt-3">{t.loading}</p></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-muted-foreground">{t.empty}</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-sky-400 text-white flex items-center justify-center text-xs font-bold shrink-0">{c.name.charAt(0).toUpperCase()}</div>
                        <span className="font-medium text-sm">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{c.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{new Date(c.created_at).toLocaleDateString(settings.lang === 'ar' ? 'ar-EG' : 'en-US')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-3"><Loader className="animate-spin text-primary" size={28} /><p className="text-muted-foreground text-sm">{t.loading}</p></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{t.empty}</div>
        ) : filtered.map(c => (
          <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-sky-400 text-white flex items-center justify-center text-sm font-bold shrink-0">{c.name.charAt(0).toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">{c.phone}</p>
              {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
            </div>
            <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-destructive hover:bg-destructive/10 shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-border">
                <h3 className="font-bold text-foreground">{t.addBtn}</h3>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t.name} *</label><input value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo" /></div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t.phone} *</label>
                  <input value={formPhone} onChange={e => setFormPhone(e.target.value)} className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo" dir="ltr" />
                  {formPhone.length >= 3 && (() => {
                    const cleanInput = formPhone.replace(/[^0-9]/g, '');
                    const matches = customers.filter(c => c.phone.includes(cleanInput) || c.name.toLowerCase().includes(formPhone.toLowerCase()));
                    if (matches.length === 0) return null;
                    return (
                      <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                        <p className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1.5">
                          <Search size={12} />
                          {settings.lang === 'ar' ? 'عملاء مشابهين موجودين بالفعل:' : 'Similar existing customers:'}
                        </p>
                        <div className="space-y-1.5">
                          {matches.slice(0, 3).map(c => (
                            <div key={c.id} className="flex justify-between items-center px-3 py-2 bg-card rounded-lg border border-border">
                              <span className="text-sm font-bold text-foreground">{c.name}</span>
                              <span className="text-xs text-muted-foreground font-mono" dir="ltr">{c.phone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t.email}</label><input value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo" /></div>
                <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t.address}</label><textarea value={formAddress} onChange={e => setFormAddress(e.target.value)} rows={3} className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo resize-y" /></div>
              </div>
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                <button onClick={handleAdd} disabled={saving} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader className="animate-spin" size={16} /> : null} {t.save}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomersPage;
