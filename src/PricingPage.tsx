import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Camera, CheckCircle, X, Loader, Hash, DollarSign, Image } from 'lucide-react';
import { getPackages, createPackage, updatePackage, deletePackage } from './api';
import { useSettings } from './SettingsContext';

interface Package {
  id: number;
  type: string;
  price: number;
  photo_count: number;
  sizes: string[];
  color: string;
}

const PricingPage = () => {
  const { settings } = useSettings();
  const lang = settings.lang;
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<Package | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [type, setType] = useState('');
  const [price, setPrice] = useState('');
  const [photoCount, setPhotoCount] = useState('');
  const [sizes, setSizes] = useState('');

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef'];

  const fetchData = async () => {
    try {
      const res = await getPackages();
      setPackages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (pkg: Package | null = null) => {
    if (pkg) {
      setEditPkg(pkg);
      setType(pkg.type);
      setPrice(pkg.price.toString());
      setPhotoCount(pkg.photo_count.toString());
      setSizes(pkg.sizes.join(', '));
    } else {
      setEditPkg(null);
      setType('');
      setPrice('');
      setPhotoCount('');
      setSizes('');
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!type || !price) return;
    setIsSaving(true);
    const data = {
      type,
      price: parseFloat(price),
      photo_count: parseInt(photoCount) || 0,
      sizes: sizes.split(',').map(s => s.trim()).filter(s => s),
      color: editPkg?.color || COLORS[Math.floor(Math.random() * COLORS.length)]
    };

    try {
      if (editPkg) {
        await updatePackage(editPkg.id, data);
      } else {
        await createPackage(data);
      }
      fetchData();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;
    try {
      await deletePackage(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const t = {
    title: lang === 'ar' ? 'باقات تصوير الاستوديو' : 'Studio Photography Packages',
    addNew: lang === 'ar' ? 'إضافة باقة جديدة' : 'Add New Package',
    type: lang === 'ar' ? 'اسم الباقة / النوع' : 'Package Name / Type',
    price: lang === 'ar' ? 'السعر' : 'Price',
    photoCount: lang === 'ar' ? 'عدد الصور' : 'Photo Count',
    sizes: lang === 'ar' ? 'المقاسات (مفصولة بفاصلة)' : 'Sizes (comma separated)',
    save: lang === 'ar' ? 'حفظ' : 'Save',
    cancel: lang === 'ar' ? 'إلغاء' : 'Cancel',
    photos: lang === 'ar' ? 'صورة' : 'photos',
  };

  return (
    <div className="animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Camera size={20} className="text-primary" />
            </div>
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'ar' ? 'إدارة أنواع وأسعار جلسات التصوير في الصالة' : 'Manage studio session types and pricing'}</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center gap-2">
          <Plus size={18} /> {t.addNew}
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center p-20"><Loader className="animate-spin text-primary" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {packages.map(pkg => (
            <motion.div key={pkg.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm group hover:border-primary/40 hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12" />

              <div className="flex flex-col h-full relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pkg.color}15`, color: pkg.color }}>
                    <Image size={20} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(pkg)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(pkg.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>

                <h3 className="font-black text-lg text-foreground mb-1">{pkg.type}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-black text-primary font-mono">{pkg.price} <small className="text-[10px] uppercase">{settings.currency}</small></span>
                </div>

                <div className="mt-auto space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Hash size={14} className="text-primary/60" />
                    <span>{pkg.photo_count} {t.photos}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                    {pkg.sizes.map((s, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-5">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                <h3 className="font-bold text-foreground">{editPkg ? t.type : t.addNew}</h3>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-all"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-muted-foreground mb-2">{t.type}</label><input value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl font-cairo" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-muted-foreground mb-2">{t.price}</label><div className="relative"><DollarSign size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full ps-9 pe-4 py-2.5 bg-muted border border-border rounded-xl font-mono" /></div></div>
                  <div><label className="block text-xs font-bold text-muted-foreground mb-2">{t.photoCount}</label><input type="number" value={photoCount} onChange={e => setPhotoCount(e.target.value)} className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl font-mono" /></div>
                </div>
                <div><label className="block text-xs font-bold text-muted-foreground mb-2">{t.sizes}</label><input value={sizes} onChange={e => setSizes(e.target.value)} placeholder="10x15, 20x30, ..." className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl font-cairo text-sm" /></div>
              </div>
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl font-bold text-sm text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                <button onClick={handleSave} disabled={isSaving || !type || !price} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2">
                  {isSaving ? <Loader className="animate-spin" size={16} /> : <><CheckCircle size={16} />{t.save}</>}
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
