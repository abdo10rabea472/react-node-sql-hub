import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Edit3, Trash2, CheckCircle, Image as ImageIcon, DollarSign, FileText, X, Save, AlertCircle, Loader, Link2, Package } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { getPackages, createPackage, updatePackage, deletePackage, getInventoryItems, getPackageMaterials, setPackageMaterials } from './api';

interface PricingPackage { id: number; type: string; price: number; photo_count: number; sizes: string[]; color: string; }
interface InventoryItem { id: number; item_name: string; category_name_ar: string; is_sellable: number; quantity: number; unit_cost: number; }
interface MaterialLink { inventory_item_id: number; quantity_needed: number; item_name?: string; }

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

const translations = {
  ar: { title: 'باقات التصوير والأسعار', subtitle: 'إدارة أنواع التصوير، الأحجام، والأسعار - مع ربط المواد المستهلكة (ورق، أحبار)', addPackage: 'إضافة باقة جديدة', editPackage: 'تعديل الباقة', packageType: 'نوع التصوير', price: 'السعر', photosIncluded: 'عدد الصور المشمولة', sizes: 'الأحجام والأنواع المتاحة', save: 'حفظ الباقة', cancel: 'إلغاء', delete: 'حذف', invoicePreview: 'معاينة الفاتورة', generateInvoice: 'اضغط على باقة لعرض المعاينة', placeholderType: 'مثال: تصوير بورتريه، زفاف...', empty: 'لا توجد باقات حالياً. ابدأ بإضافة واحدة!', total: 'الإجمالي', date: 'التاريخ', invoiceNo: 'رقم الفاتورة', loading: 'جاري تحميل الباقات...', materials: 'المواد المستهلكة', linkMaterials: 'ربط المواد', addMaterial: 'إضافة مادة', qty: 'الكمية', selectItem: 'اختر مادة...', materialCost: 'تكلفة المواد', noConsumables: 'لا توجد مواد استهلاكية - أضف أصناف (ورق/أحبار) في المخزون أولاً', saveMaterials: 'حفظ الربط' },
  en: { title: 'Photography Pricing & Packages', subtitle: 'Manage photography types, sizes, and pricing - with consumable material linking (paper, ink)', addPackage: 'Add New Package', editPackage: 'Edit Package', packageType: 'Photography Type', price: 'Price', photosIncluded: 'Photos Included', sizes: 'Available Sizes & Formats', save: 'Save Package', cancel: 'Cancel', delete: 'Delete', invoicePreview: 'Invoice Preview', generateInvoice: 'Click a package to preview', placeholderType: 'e.g. Portrait, Wedding...', empty: 'No packages yet. Start by adding one!', total: 'Total', date: 'Date', invoiceNo: 'Invoice No', loading: 'Loading packages...', materials: 'Consumable Materials', linkMaterials: 'Link Materials', addMaterial: 'Add Material', qty: 'Qty', selectItem: 'Select item...', materialCost: 'Material Cost', noConsumables: 'No consumables found - add items (paper/ink) to inventory first', saveMaterials: 'Save Links' },
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
  const [formPhotos, setFormPhotos] = useState<number>(0);
  const [formSizesText, setFormSizesText] = useState('');

  // Materials linking
  const [consumables, setConsumables] = useState<InventoryItem[]>([]);
  const [materialsModal, setMaterialsModal] = useState<PricingPackage | null>(null);
  const [linkedMaterials, setLinkedMaterials] = useState<MaterialLink[]>([]);
  const [packageMaterialsMap, setPackageMaterialsMap] = useState<Record<number, MaterialLink[]>>({});
  const [savingMaterials, setSavingMaterials] = useState(false);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const [pkgRes, invRes] = await Promise.all([getPackages(), getInventoryItems()]);
      setPackages(pkgRes.data);
      // Filter consumables (is_sellable = 0)
      setConsumables(invRes.data.filter((i: any) => i.is_sellable === 0 || i.is_sellable === '0'));
      // Fetch materials for all packages
      const matMap: Record<number, MaterialLink[]> = {};
      await Promise.all(pkgRes.data.map(async (pkg: PricingPackage) => {
        try {
          const matRes = await getPackageMaterials(pkg.id, 'studio');
          matMap[pkg.id] = matRes.data;
        } catch { matMap[pkg.id] = []; }
      }));
      setPackageMaterialsMap(matMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPackages(); }, []);

  const activePreview = isModalOpen ? { id: editingPackage?.id || 999, type: formType || (lang === 'ar' ? 'نوع الباقة...' : 'Package Type...'), price: formPrice || 0, photo_count: formPhotos || 0, sizes: formSizesText.split('\n').filter(s => s.trim() !== ''), color: editingPackage?.color || '#0ea5e9' } : selectedPreview;

  const openModal = (pkg?: PricingPackage) => {
    if (pkg) { setEditingPackage(pkg); setFormType(pkg.type); setFormPrice(pkg.price); setFormPhotos(pkg.photo_count); setFormSizesText(pkg.sizes.join('\n')); }
    else { setEditingPackage(null); setFormType(''); setFormPrice(0); setFormPhotos(0); setFormSizesText(''); }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const sizesArray = formSizesText.split('\n').filter(s => s.trim() !== '');
    const data = { type: formType, price: formPrice, photo_count: formPhotos, sizes: sizesArray, color: editingPackage?.color || COLORS[packages.length % COLORS.length] };
    try { if (editingPackage) await updatePackage(editingPackage.id, data); else await createPackage(data); fetchPackages(); setIsModalOpen(false); setSelectedPreview(null); } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => { if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return; try { await deletePackage(id); fetchPackages(); if (selectedPreview?.id === id) setSelectedPreview(null); } catch (err) { console.error(err); } };

  const openMaterialsModal = (pkg: PricingPackage) => {
    setMaterialsModal(pkg);
    setLinkedMaterials(packageMaterialsMap[pkg.id] || []);
  };

  const addMaterialRow = () => {
    setLinkedMaterials(prev => [...prev, { inventory_item_id: 0, quantity_needed: 1 }]);
  };

  const updateMaterialRow = (idx: number, field: string, value: any) => {
    setLinkedMaterials(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const removeMaterialRow = (idx: number) => {
    setLinkedMaterials(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveMaterials = async () => {
    if (!materialsModal) return;
    setSavingMaterials(true);
    try {
      const validMaterials = linkedMaterials.filter(m => m.inventory_item_id > 0);
      await setPackageMaterials(materialsModal.id, 'studio', validMaterials);
      await fetchPackages();
      setMaterialsModal(null);
    } catch (err) { console.error(err); }
    finally { setSavingMaterials(false); }
  };

  const getMaterialCost = (pkg: PricingPackage) => {
    const mats = packageMaterialsMap[pkg.id] || [];
    return mats.reduce((sum, m) => {
      const item = consumables.find(c => c.id === m.inventory_item_id);
      return sum + (item ? item.unit_cost * m.quantity_needed : 0);
    }, 0);
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[300px] gap-3"><Loader className="animate-spin text-primary" size={28} /><p className="text-muted-foreground text-sm">{t.loading}</p></div>
          ) : packages.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[300px] gap-3 text-muted-foreground"><AlertCircle size={40} /><p>{t.empty}</p></div>
          ) : (
            packages.map((pkg, idx) => {
              const mats = packageMaterialsMap[pkg.id] || [];
              const matCost = getMaterialCost(pkg);
              return (
                <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                  className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all relative overflow-hidden group"
                  style={{ borderTopColor: pkg.color, borderTopWidth: 3 }} onClick={() => setSelectedPreview(pkg)}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-foreground">{pkg.type}</h3>
                    <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openMaterialsModal(pkg)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all" title={t.linkMaterials}><Link2 size={14} /></button>
                      <button onClick={() => openModal(pkg)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(pkg.id)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3"><span className="text-3xl font-extrabold text-foreground tracking-tight">{pkg.price}</span><span className="text-base font-semibold text-muted-foreground">{currentCurrency}</span></div>
                  
                  {matCost > 0 && (
                    <div className="flex justify-between text-xs mb-3 bg-muted/50 rounded-lg px-3 py-2">
                      <span className="text-muted-foreground">{t.materialCost}</span>
                      <span className="font-bold text-amber-600">{matCost.toFixed(2)} {currentCurrency}</span>
                      <span className="font-bold text-emerald-600">{lang === 'ar' ? 'ربح' : 'Profit'}: {(pkg.price - matCost).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="space-y-3 mb-3">
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground"><CheckCircle size={16} style={{ color: pkg.color }} /><span>{pkg.photo_count} {t.photosIncluded}</span></div>
                    <div className="flex flex-wrap gap-1.5">{pkg.sizes.slice(0, 2).map(s => <span key={s} className="bg-muted text-muted-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">{s}</span>)}{pkg.sizes.length > 2 && <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">+{pkg.sizes.length - 2}</span>}</div>
                  </div>

                  {mats.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {mats.map((m, i) => (
                        <span key={i} className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Package size={10} />{m.item_name} ×{m.quantity_needed}
                        </span>
                      ))}
                    </div>
                  )}

                  <button className="w-full py-2.5 border-2 border-dashed border-border rounded-lg text-muted-foreground text-xs font-semibold flex items-center justify-center gap-2 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"><FileText size={14} />{t.invoicePreview}</button>
                </motion.div>
              );
            })
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
                <div className="flex justify-between items-start mb-3"><div><strong className="block text-sm mb-1">{activePreview.type}</strong><p className="text-xs text-slate-400">{activePreview.photo_count} {t.photosIncluded}</p></div><div className="font-bold text-sm">{activePreview.price} {currentCurrency}</div></div>
                <div className="ps-3 space-y-1">{activePreview.sizes.map((s, i) => <div key={i} className="flex justify-between text-xs text-slate-400"><span>Format: {s}</span><span>Incl.</span></div>)}{activePreview.sizes.length === 0 && <p className="text-xs text-slate-300 italic">Ready for your sizes...</p>}</div>
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
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.price} ({currentCurrency})</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"><DollarSign size={16} className="text-muted-foreground" /><input type="number" value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm" /></div></div>
                  <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.photosIncluded}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"><ImageIcon size={16} className="text-muted-foreground" /><input type="number" value={formPhotos} onChange={e => setFormPhotos(Number(e.target.value))} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm" /></div></div>
                </div>
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">{t.sizes}</label><textarea placeholder="4x6 Prints&#10;12x18 Canvas&#10;Digital USB..." value={formSizesText} onChange={e => setFormSizesText(e.target.value)} className="w-full min-h-[100px] px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo resize-y" /></div>
              </div>
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all"><Save size={16} />{t.save}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Materials Linking Modal */}
      <AnimatePresence>
        {materialsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-5" onClick={() => setMaterialsModal(null)}>
            <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-border">
                <div>
                  <h2 className="font-bold text-foreground flex items-center gap-2"><Link2 size={18} className="text-amber-500" />{t.linkMaterials}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{materialsModal.type}</p>
                </div>
                <button onClick={() => setMaterialsModal(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'اختر المواد المستهلكة التي تُستخدم في هذه الباقة (ورق، أحبار، إلخ). عند بيع الباقة سيتم خصمها تلقائياً من المخزون.' : 'Select consumable materials used in this package. They will be auto-deducted from inventory when the package is sold.'}</p>
                
                {consumables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t.noConsumables}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {linkedMaterials.map((mat, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <select value={mat.inventory_item_id} onChange={e => updateMaterialRow(idx, 'inventory_item_id', Number(e.target.value))}
                            className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm outline-none">
                            <option value={0}>{t.selectItem}</option>
                            {consumables.map(c => <option key={c.id} value={c.id}>{c.item_name} ({c.category_name_ar}) - {lang === 'ar' ? 'متوفر' : 'Avail'}: {c.quantity}</option>)}
                          </select>
                          <input type="number" min="1" value={mat.quantity_needed} onChange={e => updateMaterialRow(idx, 'quantity_needed', parseInt(e.target.value) || 1)}
                            className="w-20 px-3 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm outline-none text-center" placeholder={t.qty} />
                          <button onClick={() => removeMaterialRow(idx)} className="w-9 h-9 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={addMaterialRow} className="w-full py-2.5 border-2 border-dashed border-amber-500/30 rounded-xl text-amber-600 text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-500/5 transition-all">
                      <Plus size={14} />{t.addMaterial}
                    </button>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
                <button onClick={() => setMaterialsModal(null)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                <button onClick={handleSaveMaterials} disabled={savingMaterials}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all">
                  {savingMaterials ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}{t.saveMaterials}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PricingPage;
