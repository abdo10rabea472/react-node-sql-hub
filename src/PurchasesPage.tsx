import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Trash2, Edit2, Search, Package, Loader, BarChart3, Frame, FileText, Droplets, Image } from 'lucide-react';
import { getPurchases, createPurchase, updatePurchase, deletePurchase, getPurchasesStats } from './api';
import { useSettings } from './SettingsContext';

interface Purchase {
    id: number; item_name: string; category: string; quantity: number;
    unit_cost: number; total_cost: number; supplier: string; notes: string;
    created_by: string; created_at: string;
}
interface Stats {
    total_purchases: number; total_spent: number; frames_cost: number;
    paper_cost: number; ink_cost: number; tableau_cost: number; other_cost: number;
}

const translations = {
    ar: {
        title: 'المشتريات', addNew: 'إضافة مشتريات', list: 'سجل المشتريات',
        itemName: 'اسم الصنف', category: 'الفئة', quantity: 'الكمية',
        unitCost: 'سعر الوحدة', totalCost: 'الإجمالي', supplier: 'المورد',
        notes: 'ملاحظات', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف',
        deleteConfirm: 'هل أنت متأكد من حذف هذا الصنف؟', search: 'بحث...',
        frame: 'براويز', paper: 'ورق', ink: 'أحبار', tableau: 'طابلو', other: 'أخرى',
        totalSpent: 'إجمالي المصروفات', items: 'عدد الأصناف', edit: 'تعديل',
        noItems: 'لا توجد مشتريات حالياً', date: 'التاريخ',
    },
    en: {
        title: 'Purchases', addNew: 'Add Purchase', list: 'Purchase History',
        itemName: 'Item Name', category: 'Category', quantity: 'Quantity',
        unitCost: 'Unit Cost', totalCost: 'Total', supplier: 'Supplier',
        notes: 'Notes', save: 'Save', cancel: 'Cancel', delete: 'Delete',
        deleteConfirm: 'Are you sure you want to delete this item?', search: 'Search...',
        frame: 'Frames', paper: 'Paper', ink: 'Ink', tableau: 'Tableau', other: 'Other',
        totalSpent: 'Total Spent', items: 'Items Count', edit: 'Edit',
        noItems: 'No purchases found', date: 'Date',
    },
};

const categories = [
    { value: 'frame', icon: Frame, color: '#8B5CF6' },
    { value: 'paper', icon: FileText, color: '#0EA5E9' },
    { value: 'ink', icon: Droplets, color: '#F59E0B' },
    { value: 'tableau', icon: Image, color: '#10B981' },
    { value: 'other', icon: Package, color: '#6B7280' },
];

const PurchasesPage: React.FC<{ user?: { name: string } }> = ({ user }) => {
    const { settings } = useSettings();
    const lang = settings.lang;
    const t = translations[lang] || translations.en;

    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');
    const [searchQuery, setSearchQuery] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    // Form state
    const [editId, setEditId] = useState<number | null>(null);
    const [itemName, setItemName] = useState('');
    const [category, setCategory] = useState('frame');
    const [quantity, setQuantity] = useState('1');
    const [unitCost, setUnitCost] = useState('');
    const [supplier, setSupplier] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const toast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(msg); setToastType(type); setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const fetchData = async () => {
        try {
            const [pRes, sRes] = await Promise.all([getPurchases(), getPurchasesStats()]);
            setPurchases(pRes.data);
            setStats(sRes.data);
        } catch { toast(lang === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setEditId(null); setItemName(''); setCategory('frame');
        setQuantity('1'); setUnitCost(''); setSupplier(''); setNotes('');
    };

    const handleSave = async () => {
        if (!itemName || !unitCost) return;
        setSaving(true);
        try {
            const data = { item_name: itemName, category, quantity: parseInt(quantity) || 1, unit_cost: parseFloat(unitCost) || 0, supplier, notes, created_by: user?.name || 'Admin' };
            if (editId) {
                await updatePurchase(editId, data);
                toast(lang === 'ar' ? 'تم تحديث الصنف بنجاح' : 'Item updated');
            } else {
                await createPurchase(data);
                toast(lang === 'ar' ? 'تم إضافة الصنف بنجاح' : 'Item added');
            }
            resetForm();
            await fetchData();
        } catch { toast(lang === 'ar' ? 'فشل الحفظ' : 'Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const handleEdit = (p: Purchase) => {
        setEditId(p.id); setItemName(p.item_name); setCategory(p.category);
        setQuantity(String(p.quantity)); setUnitCost(String(p.unit_cost));
        setSupplier(p.supplier || ''); setNotes(p.notes || '');
        setActiveTab('add');
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(t.deleteConfirm)) return;
        try { await deletePurchase(id); await fetchData(); toast(lang === 'ar' ? 'تم الحذف' : 'Deleted'); }
        catch { toast(lang === 'ar' ? 'فشل الحذف' : 'Delete failed', 'error'); }
    };

    const totalCalc = (parseFloat(quantity) || 1) * (parseFloat(unitCost) || 0);
    const filteredPurchases = purchases.filter(p =>
        p.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t as any)[p.category]?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo";
    const getCatLabel = (c: string) => (t as any)[c] || c;
    const getCatConfig = (c: string) => categories.find(cat => cat.value === c) || categories[4];

    if (loading) return <div className="flex items-center justify-center min-h-[200px]"><Loader className="animate-spin text-primary" size={24} /></div>;

    return (
        <div className="animate-fade-in">
            {/* Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl shadow-lg text-sm font-bold text-white ${toastType === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                <ShoppingCart size={20} className="text-accent" />
                            </div>
                            {t.title}
                        </h2>
                    </div>
                    <div className="flex gap-1 bg-muted p-1 rounded-xl w-full sm:w-auto">
                        <button onClick={() => setActiveTab('add')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'add' ? 'bg-card text-accent shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Plus size={16} className="inline-block me-1.5 -mt-0.5" />{t.addNew}
                        </button>
                        <button onClick={() => setActiveTab('list')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-card text-accent shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                            <BarChart3 size={16} className="inline-block me-1.5 -mt-0.5" />{t.list}
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    {[
                        { label: t.totalSpent, value: stats.total_spent, color: '#EF4444' },
                        { label: t.frame, value: stats.frames_cost, color: '#8B5CF6' },
                        { label: t.paper, value: stats.paper_cost, color: '#0EA5E9' },
                        { label: t.ink, value: stats.ink_cost, color: '#F59E0B' },
                        { label: t.tableau, value: stats.tableau_cost, color: '#10B981' },
                        { label: t.other, value: stats.other_cost, color: '#6B7280' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-card border border-border rounded-xl p-3 sm:p-4">
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
                            <p className="text-sm sm:text-lg font-extrabold" style={{ color: s.color }}>{Number(s.value).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{settings.currency}</span></p>
                        </motion.div>
                    ))}
                </div>
            )}

            {activeTab === 'add' ? (
                <div className="max-w-2xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-2">
                            <Package size={16} className="text-accent" />
                            {editId ? t.edit : t.addNew}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.itemName} *</label>
                                <input value={itemName} onChange={e => setItemName(e.target.value)} className={inputClass} placeholder={lang === 'ar' ? 'مثال: برواز 20×30' : 'e.g. Frame 20x30'} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.category} *</label>
                                <div className="flex gap-2 flex-wrap">
                                    {categories.map(c => (
                                        <button key={c.value} onClick={() => setCategory(c.value)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${category === c.value ? 'border-primary/50 bg-primary/5 text-foreground' : 'border-border bg-muted text-muted-foreground hover:border-primary/30'}`}>
                                            <c.icon size={14} style={{ color: c.color }} />
                                            {getCatLabel(c.value)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.quantity}</label>
                                <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.unitCost} *</label>
                                <input type="number" min="0" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} className={inputClass} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.totalCost}</label>
                                <div className="px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold text-foreground">
                                    {totalCalc.toFixed(2)} {settings.currency}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.supplier}</label>
                                <input value={supplier} onChange={e => setSupplier(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.notes}</label>
                                <input value={notes} onChange={e => setNotes(e.target.value)} className={inputClass} />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={handleSave} disabled={saving || !itemName || !unitCost}
                                className="flex-1 py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                                {editId ? t.save : t.addNew}
                            </button>
                            {editId && (
                                <button onClick={resetForm} className="px-6 py-3 rounded-xl border border-border text-muted-foreground font-bold text-sm hover:bg-muted transition-all">
                                    {t.cancel}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    {/* Search */}
                    <div className="mb-4 relative max-w-md">
                        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputClass} ps-10`} placeholder={t.search} />
                    </div>

                    {filteredPurchases.length === 0 ? (
                        <div className="text-center py-16">
                            <ShoppingCart size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm">{t.noItems}</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30">
                                            {[t.itemName, t.category, t.quantity, t.unitCost, t.totalCost, t.supplier, t.date, ''].map((h, i) => (
                                                <th key={i} className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPurchases.map((p, idx) => {
                                            const cat = getCatConfig(p.category);
                                            const CatIcon = cat.icon;
                                            return (
                                                <motion.tr key={p.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}>
                                                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{p.item_name}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${cat.color}15`, color: cat.color }}>
                                                            <CatIcon size={12} />{getCatLabel(p.category)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-foreground tabular-nums">{p.quantity}</td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{p.unit_cost} {settings.currency}</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-foreground tabular-nums">{p.total_cost} {settings.currency}</td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.supplier || '-'}</td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                                                        {new Date(p.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1">
                                                            <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all">
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden space-y-3">
                                {filteredPurchases.map((p, idx) => {
                                    const cat = getCatConfig(p.category);
                                    const CatIcon = cat.icon;
                                    return (
                                        <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                                            className="bg-card border border-border rounded-xl p-4 shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground">{p.item_name}</h4>
                                                    <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold" style={{ color: cat.color }}>
                                                        <CatIcon size={12} />{getCatLabel(p.category)}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center"><Edit2 size={14} /></button>
                                                    <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{t.quantity}: {p.quantity}</span>
                                                <span className="font-bold text-foreground">{p.total_cost} {settings.currency}</span>
                                            </div>
                                            {p.supplier && <p className="text-xs text-muted-foreground mt-1">{t.supplier}: {p.supplier}</p>}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default PurchasesPage;
