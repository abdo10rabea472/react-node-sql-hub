import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Edit3, Trash2, DollarSign, X, Save, AlertCircle, Loader, Image as ImageIcon } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { getPackages, createPackage, updatePackage, deletePackage } from './api';

interface PricingPackage { id: number; type: string; price: number; photo_count: number; sizes: string[]; color: string; }

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

const translations = {
  ar: { title: 'أسعار الصور حسب المقاس', subtitle: 'حدد سعر الصورة الواحدة لكل مقاس', addPackage: 'إضافة مقاس جديد', editPackage: 'تعديل المقاس', packageType: 'مقاس الصورة', price: 'سعر الصورة', photosIncluded: 'صورة', sizes: 'ملاحظات', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', invoicePreview: 'معاينة', generateInvoice: 'اضغط على مقاس لعرض المعاينة', placeholderType: 'مثال: 4x6, 5x7, 8x10...', empty: 'لا توجد مقاسات حالياً', total: 'الإجمالي', date: 'التاريخ', invoiceNo: 'رقم الفاتورة', loading: 'جاري التحميل...', perPhoto: 'للصورة', profit: 'الربح', printCost: 'تكلفة الطباعة' },
  en: { title: 'Photo Pricing by Size', subtitle: 'Set price per photo for each size', addPackage: 'Add New Size', editPackage: 'Edit Size', packageType: 'Photo Size', price: 'Price per Photo', photosIncluded: 'photo', sizes: 'Notes', save: 'Save', cancel: 'Cancel', delete: 'Delete', invoicePreview: 'Preview', generateInvoice: 'Click a size to preview', placeholderType: 'e.g. 4x6, 5x7, 8x10...', empty: 'No sizes yet', total: 'Total', date: 'Date', invoiceNo: 'Invoice No', loading: 'Loading...', perPhoto: '/photo', profit: 'Profit', printCost: 'Print Cost' },
};

const PricingPage: React.FC = () => {
  const { settings } = useSettings();
  const lang = settings.lang;
  const currentCurrency = settings.currency;
  const t = translations[lang];
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<PricingPackage | null>(null);
  const [formType, setFormType] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formSizesText, setFormSizesText] = useState('');
  const [formExtCost, setFormExtCost] = useState<number>(0);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const pkgRes = await getPackages();
      setPackages(pkgRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPackages(); }, []);

  const activePreview = isModalOpen ? { id: editingPackage?.id || 999, type: formType || (lang === 'ar' ? 'نوع الباقة...' : 'Package Type...'), price: formPrice || 0, photo_count: 0, sizes: formSizesText.split('\n').filter(s => s.trim() !== ''), color: editingPackage?.color || '#0ea5e9' } : selectedPreview;

  const getExtCost = (pkg: PricingPackage) => {
    const extEntry = pkg.sizes.find(s => s.startsWith('ext_cost:'));
    return extEntry ? parseFloat(extEntry.split(':')[1]) || 0 : 0;
  };
  const getNotes = (pkg: PricingPackage) => pkg.sizes.filter(s => !s.startsWith('ext_cost:'));

  const openModal = (pkg?: PricingPackage) => {
    if (pkg) { setEditingPackage(pkg); setFormType(pkg.type); setFormPrice(pkg.price); setFormSizesText(getNotes(pkg).join('\n')); setFormExtCost(getExtCost(pkg)); }
    else { setEditingPackage(null); setFormType(''); setFormPrice(0); setFormSizesText(''); setFormExtCost(0); }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const notes = formSizesText.split('\n').filter(s => s.trim() !== '');
    const sizesArray = formExtCost > 0 ? [`ext_cost:${formExtCost}`, ...notes] : notes;
    const data = { type: formType, price: formPrice, photo_count: 0, sizes: sizesArray, color: editingPackage?.color || COLORS[packages.length % COLORS.length] };
    try { if (editingPackage) await updatePackage(editingPackage.id, data); else await createPackage(data); fetchPackages(); setIsModalOpen(false); setSelectedPreview(null); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => { if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return; try { await deletePackage(id); fetchPackages(); if (selectedPreview?.id === id) setSelectedPreview(null); } catch (err) { console.error(err); } };

  return (
    <div className="animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs font-extrabold uppercase tracking-widest mb-1"><Camera size={16} /><span>{settings.studioName}</span></div>
          <h1 className="text-xl font-extrabold text-foreground">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-primary/20"><Plus size={18} />{t.addPackage}</button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px] gap-4 sm:gap-6 items-start">
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3"><Loader className="animate-spin text-primary" size={28} /><p className="text-muted-foreground text-sm">{t.loading}</p></div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-muted-foreground"><AlertCircle size={40} /><p>{t.empty}</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packages.map((pkg, idx) => {
                const ext = getExtCost(pkg);
                const profit = pkg.price - ext;
                return (
                  <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                    className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all relative overflow-hidden group"
                    style={{ borderTopColor: pkg.color, borderTopWidth: 3 }} onClick={() => setSelectedPreview(pkg)}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📷</span>
                        <h3 className="font-bold text-foreground">{pkg.type}</h3>
                      </div>
                      <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openModal(pkg)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><Edit3 size={14} /></button>
                        <button onClick={() => handleDelete(pkg.id)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2"><span className="text-2xl font-extrabold text-foreground">{pkg.price}</span><span className="text-sm text-muted-foreground">{currentCurrency}/{t.perPhoto}</span></div>
                    {ext > 0 ? (
                      <div className="flex justify-between text-xs mb-2 bg-muted/50 rounded-lg px-3 py-2">
                        <span className="text-muted-foreground">{t.printCost}: <strong className="text-destructive">{ext}</strong></span>
                        <span className="font-bold text-emerald-600">{t.profit}: {profit.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1.5 rounded-lg mb-2 text-center">{lang === 'ar' ? 'لم يتم تحديد تكلفة الطباعة' : 'No print cost set'}</div>
                    )}
                    <div className="flex flex-wrap gap-1.5">{getNotes(pkg).slice(0, 3).map(s => <span key={s} className="bg-muted text-muted-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">{s}</span>)}</div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="sticky top-24">
          <AnimatePresence mode="wait">
            {activePreview ? (
              <motion.div key={activePreview.id + activePreview.type} className="bg-white rounded-xl p-6 shadow-xl text-slate-800 font-sans relative overflow-hidden" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                {isModalOpen && <div className="absolute top-3 end-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded">LIVE SYNC</div>}
                <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2 font-extrabold text-sm text-sky-600"><Camera size={18} />{settings.studioName.split(' ')[0]}</div><div className="bg-sky-50 text-sky-600 text-[10px] font-bold px-2.5 py-1 rounded-md">PRO-FORMA</div></div>
                <div className="space-y-2.5 mb-5 text-sm"><div className="flex justify-between"><span className="text-slate-400">{t.invoiceNo}</span><strong>#INV-2026-001</strong></div><div className="flex justify-between"><span className="text-slate-400">{t.date}</span><strong>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</strong></div></div>
                <div className="h-px bg-slate-200 my-4" />
                <div className="flex justify-between items-start mb-3"><div><strong className="block text-sm mb-1">{activePreview.type}</strong></div><div className="font-bold text-sm">{activePreview.price} {currentCurrency}</div></div>
                <div className="ps-3 space-y-1">{getNotes(activePreview).map((s, i) => <div key={i} className="flex justify-between text-xs text-slate-400"><span>{s}</span><span>Incl.</span></div>)}{getNotes(activePreview).length === 0 && <p className="text-xs text-slate-300 italic">Ready for your sizes...</p>}</div>
                <div className="h-px bg-slate-200 my-4" />
                <div className="flex justify-between items-center font-extrabold text-base mb-5"><span>{t.total}</span><span className="text-sky-600">{activePreview.price} {currentCurrency}</span></div>
                <p className="text-center text-[11px] text-slate-300">Premium Photography Experience</p>
              </motion.div>
            ) : (
              <div className="h-[420px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground"><ImageIcon size={40} /><p className="text-sm">{t.generateInvoice}</p></div>
            )}
          </AnimatePresence>
        </aside>
      </div>

      {/* Package Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-5" onClick={() => setIsModalOpen(false)}>
            <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-border"><h2 className="font-bold text-foreground">{editingPackage ? t.editPackage : t.addPackage}</h2><button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button></div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.packageType}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"><Camera size={16} className="text-muted-foreground" /><input value={formType} onChange={e => setFormType(e.target.value)} placeholder={t.placeholderType} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-cairo" /></div></div>
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{lang === 'ar' ? 'سعر البيع للعميل' : 'Sell Price'} ({currentCurrency})</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"><DollarSign size={16} className="text-muted-foreground" /><input type="number" value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm" /></div></div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">{t.printCost} ({currentCurrency})</label>
                  <div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                    <span className="text-muted-foreground text-sm">🖨️</span>
                    <input type="number" step="0.01" value={formExtCost} onChange={e => setFormExtCost(Number(e.target.value))} placeholder="0" className="flex-1 bg-transparent border-none outline-none text-foreground text-sm" />
                  </div>
                  {formPrice > 0 && formExtCost > 0 && (
                    <p className="text-xs mt-1.5 text-emerald-600 font-bold">{lang === 'ar' ? 'الربح للصورة' : 'Profit/photo'}: {(formPrice - formExtCost).toFixed(2)} {currentCurrency}</p>
                  )}
                </div>
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.sizes}</label><textarea placeholder={lang === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'} value={formSizesText} onChange={e => setFormSizesText(e.target.value)} className="w-full min-h-[70px] px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo resize-y" /></div>
              </div>
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all"><Save size={16} />{t.save}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PricingPage;
