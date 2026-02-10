import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Edit3, Trash2, CheckCircle, DollarSign, X, Save, AlertCircle, Loader, Sparkles } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { getWeddingPackages, createWeddingPackage, updateWeddingPackage, deleteWeddingPackage } from './api';

interface WeddingPackage { id: number; type: string; price: number; description: string; includes: string[]; color: string; }

const COLORS = ['#f43f5e', '#ec4899', '#a855f7', '#0ea5e9', '#10b981'];

const translations = {
  ar: { title: 'باقات الزفاف والأسعار', subtitle: 'إدارة باقات حفلات الزفاف والمناسبات الخاصة', addPackage: 'إضافة باقة زفاف', editPackage: 'تعديل الباقة', packageType: 'نوع الباقة', price: 'السعر', description: 'وصف الباقة', includes: 'تشمل الباقة', save: 'حفظ الباقة', cancel: 'إلغاء', delete: 'حذف', placeholderType: 'مثال: باقة فضية، ذهبية، ماسية...', placeholderDesc: 'وصف مختصر للباقة...', empty: 'لا توجد باقات زفاف حالياً. ابدأ بإضافة واحدة!', loading: 'جاري تحميل الباقات...' },
  en: { title: 'Wedding Packages & Pricing', subtitle: 'Manage wedding and special event packages', addPackage: 'Add Wedding Package', editPackage: 'Edit Package', packageType: 'Package Type', price: 'Price', description: 'Package Description', includes: 'Package Includes', save: 'Save Package', cancel: 'Cancel', delete: 'Delete', placeholderType: 'e.g. Silver, Gold, Diamond...', placeholderDesc: 'Short description...', empty: 'No wedding packages yet. Start by adding one!', loading: 'Loading packages...' },
};

const WeddingPricingPage: React.FC = () => {
  const { settings } = useSettings();
  const lang = settings.lang;
  const currentCurrency = settings.currency;
  const t = translations[lang];
  const [packages, setPackages] = useState<WeddingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<WeddingPackage | null>(null);
  const [formType, setFormType] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formDesc, setFormDesc] = useState('');
  const [formIncludesText, setFormIncludesText] = useState('');

  const fetchPackages = async () => { setLoading(true); try { const res = await getWeddingPackages(); setPackages(res.data); } catch (err) { console.error(err); } finally { setLoading(false); } };
  useEffect(() => { fetchPackages(); }, []);

  const openModal = (pkg?: WeddingPackage) => {
    if (pkg) { setEditingPackage(pkg); setFormType(pkg.type); setFormPrice(pkg.price); setFormDesc(pkg.description || ''); setFormIncludesText(pkg.includes.join('\n')); }
    else { setEditingPackage(null); setFormType(''); setFormPrice(0); setFormDesc(''); setFormIncludesText(''); }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const includesArray = formIncludesText.split('\n').filter(s => s.trim() !== '');
    const data = { type: formType, price: formPrice, description: formDesc, includes: includesArray, color: editingPackage?.color || COLORS[packages.length % COLORS.length] };
    try { if (editingPackage) await updateWeddingPackage(editingPackage.id, data); else await createWeddingPackage(data); fetchPackages(); setIsModalOpen(false); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => { if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return; try { await deleteWeddingPackage(id); fetchPackages(); } catch (err) { console.error(err); } };

  return (
    <div className="animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 text-pink-500 text-xs font-extrabold uppercase tracking-widest mb-1"><Heart size={16} /><span>{lang === 'ar' ? 'قسم الزفاف' : 'Wedding Section'}</span></div>
          <h1 className="text-xl font-extrabold text-foreground">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-pink-500/20"><Plus size={18} />{t.addPackage}</button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[300px] gap-3"><Loader className="animate-spin text-pink-500" size={28} /><p className="text-muted-foreground text-sm">{t.loading}</p></div>
        ) : packages.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[300px] gap-3 text-muted-foreground"><AlertCircle size={40} /><p>{t.empty}</p></div>
        ) : (
          packages.map((pkg, idx) => (
            <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
              className="bg-card border border-border rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all relative overflow-hidden group"
              style={{ borderTopColor: pkg.color, borderTopWidth: 3 }}>
              <div className="absolute top-3 end-3 flex gap-1.5">
                <button onClick={() => openModal(pkg)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(pkg.id)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={14} /></button>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `${pkg.color}15`, color: pkg.color }}><Sparkles size={20} /></div>
              <h3 className="font-bold text-foreground text-lg mb-1">{pkg.type}</h3>
              {pkg.description && <p className="text-xs text-muted-foreground mb-4">{pkg.description}</p>}
              <div className="flex items-baseline gap-1.5 mb-5"><span className="text-3xl font-extrabold text-foreground tracking-tight">{pkg.price}</span><span className="text-base font-semibold text-muted-foreground">{currentCurrency}</span></div>
              <div className="space-y-2">
                {pkg.includes.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle size={14} style={{ color: pkg.color }} /><span>{item}</span></div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-5" onClick={() => setIsModalOpen(false)}>
            <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-border"><h2 className="font-bold text-foreground flex items-center gap-2"><Heart size={18} className="text-pink-500" />{editingPackage ? t.editPackage : t.addPackage}</h2><button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button></div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.packageType}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-pink-500/50 focus-within:ring-2 focus-within:ring-pink-500/10"><Sparkles size={16} className="text-muted-foreground" /><input value={formType} onChange={e => setFormType(e.target.value)} placeholder={t.placeholderType} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-cairo" /></div></div>
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.description}</label><input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder={t.placeholderDesc} className="w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/10 font-cairo" /></div>
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.price} ({currentCurrency})</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-pink-500/50 focus-within:ring-2 focus-within:ring-pink-500/10"><DollarSign size={16} className="text-muted-foreground" /><input type="number" value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm" /></div></div>
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.includes}</label><textarea placeholder={"تصوير فوتوغرافي\nفيديو كامل\nزينة القاعة\nكوشة العروس..."} value={formIncludesText} onChange={e => setFormIncludesText(e.target.value)} className="w-full min-h-[100px] px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/10 transition-all font-cairo resize-y" /></div>
              </div>
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all"><Save size={16} />{t.save}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeddingPricingPage;
