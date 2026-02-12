import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Search, Package, Loader, BarChart3, AlertTriangle, ArrowUp, ArrowDown, History, X, Tag } from 'lucide-react';
import { getInventoryItems, getInventoryStats, createInventoryItem, updateInventoryItem, deleteInventoryItem, addStock, adjustStock, getInventoryCategories, createInventoryCategory, updateInventoryCategory, getInventoryTransactions } from './api';
import { useSettings } from './SettingsContext';

interface Category { id: number; name: string; name_ar: string; color: string; icon: string; is_sellable: number; }
interface InventoryItem {
    id: number; item_name: string; category_id: number; quantity: number;
    unit_cost: number; sell_price: number; min_stock: number; supplier: string; notes: string;
    created_by: string; created_at: string; updated_at: string;
    category_name: string; category_name_ar: string; category_color: string; category_icon: string;
}
interface Stats {
    total_items: number; total_value: number; low_stock_count: number; total_quantity: number;
    categories: { name: string; name_ar: string; color: string; is_sellable: number; item_count: number; category_value: number }[];
}
interface Transaction { id: number; type: string; quantity: number; notes: string; created_by: string; created_at: string; item_name: string; }

const t_ar = {
    title: 'المخزون', addNew: 'إضافة صنف', list: 'سجل المخزون', itemName: 'اسم الصنف',
    category: 'الفئة', quantity: 'الكمية', unitCost: 'سعر الشراء', sellPrice: 'سعر البيع', totalValue: 'القيمة الإجمالية',
    supplier: 'المورد', notes: 'ملاحظات', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف',
    deleteConfirm: 'هل أنت متأكد من حذف هذا الصنف؟', search: 'بحث...',
    totalItems: 'إجمالي الأصناف', totalVal: 'قيمة المخزون', lowStock: 'مخزون منخفض',
    totalQty: 'إجمالي الكميات', edit: 'تعديل', noItems: 'لا يوجد مخزون حالياً',
    date: 'التاريخ', minStock: 'الحد الأدنى', addStock: 'إضافة مخزون', adjust: 'تعديل يدوي',
    newCategory: 'فئة جديدة', categoryName: 'اسم الفئة', categoryNameAr: 'الاسم بالعربي',
    addCategory: 'إضافة فئة', history: 'السجل', inStock: 'متوفر', lowStockLabel: 'منخفض',
    outOfStock: 'نفذ', stockQty: 'كمية الإضافة', profit: 'الربح',
};
const t_en = {
    title: 'Inventory', addNew: 'Add Item', list: 'Inventory List', itemName: 'Item Name',
    category: 'Category', quantity: 'Quantity', unitCost: 'Purchase Price', sellPrice: 'Sell Price', totalValue: 'Total Value',
    supplier: 'Supplier', notes: 'Notes', save: 'Save', cancel: 'Cancel', delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this item?', search: 'Search...',
    totalItems: 'Total Items', totalVal: 'Inventory Value', lowStock: 'Low Stock',
    totalQty: 'Total Quantity', edit: 'Edit', noItems: 'No inventory items',
    date: 'Date', minStock: 'Min Stock', addStock: 'Add Stock', adjust: 'Manual Adjust',
    newCategory: 'New Category', categoryName: 'Category Name', categoryNameAr: 'Arabic Name',
    addCategory: 'Add Category', history: 'History', inStock: 'In Stock', lowStockLabel: 'Low',
    outOfStock: 'Out', stockQty: 'Quantity to Add', profit: 'Profit',
};

const PurchasesPage: React.FC<{ user?: { name: string } }> = ({ user }) => {
    const { settings } = useSettings();
    const lang = settings.lang;
    const t = lang === 'ar' ? t_ar : t_en;

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'add' | 'list'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<number | 'all'>('all');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    // Form state
    const [editId, setEditId] = useState<number | null>(null);
    const [itemName, setItemName] = useState('');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [quantity, setQuantity] = useState('0');
    const [unitCost, setUnitCost] = useState('');
    const [sellPrice, setSellPrice] = useState('');
    const [minStock, setMinStock] = useState('5');
    const [supplier, setSupplier] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // New category inline
    const [showNewCat, setShowNewCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatNameAr, setNewCatNameAr] = useState('');
    const [newCatColor, setNewCatColor] = useState('#6B7280');
    const [newCatSellable, setNewCatSellable] = useState(true);

    // Add stock modal
    const [stockModal, setStockModal] = useState<InventoryItem | null>(null);
    const [stockQty, setStockQty] = useState('');
    const [stockMode, setStockMode] = useState<'add' | 'adjust'>('add');

    // History modal
    const [historyModal, setHistoryModal] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const toast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(msg); setToastType(type); setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const fetchData = async () => {
        try {
            const [iRes, sRes, cRes] = await Promise.all([getInventoryItems(), getInventoryStats(), getInventoryCategories()]);
            setItems(iRes.data);
            setStats(sRes.data);
            setCategories(cRes.data);
        } catch { toast(lang === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setEditId(null); setItemName(''); setCategoryId('');
        setQuantity('0'); setUnitCost(''); setSellPrice(''); setMinStock('5'); setSupplier(''); setNotes('');
    };

    const handleSave = async () => {
        if (!itemName) return;
        setSaving(true);
        try {
            const data = { item_name: itemName, category_id: categoryId || null, quantity: parseInt(quantity) || 0, unit_cost: parseFloat(unitCost) || 0, sell_price: parseFloat(sellPrice) || 0, min_stock: parseInt(minStock) || 5, supplier, notes, created_by: user?.name || 'Admin' };
            if (editId) {
                await updateInventoryItem(editId, data);
                toast(lang === 'ar' ? 'تم تحديث الصنف' : 'Item updated');
            } else {
                await createInventoryItem(data);
                toast(lang === 'ar' ? 'تم إضافة الصنف' : 'Item added');
            }
            resetForm(); await fetchData();
        } catch { toast(lang === 'ar' ? 'فشل الحفظ' : 'Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const handleEdit = (p: InventoryItem) => {
        setEditId(p.id); setItemName(p.item_name); setCategoryId(p.category_id || '');
        setQuantity(String(p.quantity)); setUnitCost(String(p.unit_cost)); setSellPrice(String(p.sell_price || 0));
        setMinStock(String(p.min_stock)); setSupplier(p.supplier || ''); setNotes(p.notes || '');
        setActiveTab('add');
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(t.deleteConfirm)) return;
        try { await deleteInventoryItem(id); await fetchData(); toast(lang === 'ar' ? 'تم الحذف' : 'Deleted'); }
        catch { toast(lang === 'ar' ? 'فشل الحذف' : 'Delete failed', 'error'); }
    };

    const handleAddStock = async () => {
        if (!stockModal || !stockQty) return;
        try {
            if (stockMode === 'add') {
                await addStock(stockModal.id, { quantity: parseInt(stockQty), created_by: user?.name || 'Admin' });
            } else {
                await adjustStock(stockModal.id, { quantity: parseInt(stockQty), created_by: user?.name || 'Admin' });
            }
            setStockModal(null); setStockQty(''); await fetchData();
            toast(lang === 'ar' ? 'تم تحديث المخزون' : 'Stock updated');
        } catch { toast(lang === 'ar' ? 'فشل' : 'Failed', 'error'); }
    };

    const handleAddCategory = async () => {
        if (!newCatName) return;
        try {
            await createInventoryCategory({ name: newCatName, name_ar: newCatNameAr || newCatName, color: newCatColor, is_sellable: newCatSellable ? 1 : 0 });
            setShowNewCat(false); setNewCatName(''); setNewCatNameAr(''); setNewCatColor('#6B7280'); setNewCatSellable(true);
            await fetchData(); toast(lang === 'ar' ? 'تم إضافة الفئة' : 'Category added');
        } catch { toast(lang === 'ar' ? 'فشل' : 'Failed', 'error'); }
    };

    const handleToggleSellable = async (cat: Category) => {
        try {
            await updateInventoryCategory(cat.id, { is_sellable: cat.is_sellable ? 0 : 1 });
            await fetchData();
        } catch { toast(lang === 'ar' ? 'فشل' : 'Failed', 'error'); }
    };

    const handleShowHistory = async (itemId: number) => {
        setHistoryModal(itemId);
        try {
            const res = await getInventoryTransactions(itemId);
            setTransactions(res.data);
        } catch { setTransactions([]); }
    };

    const getStockStatus = (item: InventoryItem) => {
        if (item.quantity <= 0) return { label: t.outOfStock, color: 'text-red-500 bg-red-500/10' };
        if (item.quantity <= item.min_stock) return { label: t.lowStockLabel, color: 'text-amber-500 bg-amber-500/10' };
        return { label: t.inStock, color: 'text-emerald-500 bg-emerald-500/10' };
    };

    const getCatLabel = (item: InventoryItem) => lang === 'ar' ? (item.category_name_ar || item.category_name || '-') : (item.category_name || '-');

    const filteredItems = items.filter(p => {
        const matchSearch = p.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.supplier?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = filterCategory === 'all' || p.category_id === filterCategory;
        return matchSearch && matchCat;
    });

    const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo";

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
                                <Package size={20} className="text-accent" />
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: t.totalItems, value: stats.total_items, color: '#3B82F6', suffix: '' },
                        { label: t.totalVal, value: Number(stats.total_value).toLocaleString(), color: '#10B981', suffix: settings.currency },
                        { label: t.totalQty, value: stats.total_quantity, color: '#8B5CF6', suffix: '' },
                        { label: t.lowStock, value: stats.low_stock_count, color: stats.low_stock_count > 0 ? '#EF4444' : '#10B981', suffix: '' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-card border border-border rounded-xl p-3 sm:p-4">
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
                            <p className="text-sm sm:text-lg font-extrabold" style={{ color: s.color }}>
                                {s.value} {s.suffix && <span className="text-xs font-normal text-muted-foreground">{s.suffix}</span>}
                            </p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Category filter chips */}
            {stats?.categories && stats.categories.length > 0 && activeTab === 'list' && (
                <div className="flex gap-2 flex-wrap mb-4">
                    <button onClick={() => setFilterCategory('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filterCategory === 'all' ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border bg-muted text-muted-foreground'}`}>
                        {lang === 'ar' ? 'الكل' : 'All'}
                    </button>
                    {stats.categories.map(c => {
                        const cat = categories.find(cc => cc.name === c.name);
                        const isSellable = Number(c.is_sellable) === 1;
                        return (
                            <button key={c.name} onClick={() => {
                                if (cat) setFilterCategory(filterCategory === cat.id ? 'all' : cat.id);
                            }}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${filterCategory !== 'all' && cat?.id === filterCategory ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border bg-muted text-muted-foreground'}`}>
                                <span className="inline-block w-2 h-2 rounded-full me-1.5" style={{ backgroundColor: c.color }}></span>
                                {lang === 'ar' ? c.name_ar : c.name} ({c.item_count})
                                <span className={`ms-1.5 text-[9px] px-1.5 py-0.5 rounded cursor-pointer`}
                                    onClick={(e) => { e.stopPropagation(); if (cat) handleToggleSellable(cat); }}
                                    style={{ background: isSellable ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: isSellable ? '#10B981' : '#F59E0B' }}>
                                    {isSellable ? (lang === 'ar' ? 'قابل للبيع' : 'Sellable') : (lang === 'ar' ? 'مستهلك' : 'Consumable')}
                                </span>
                            </button>
                        );
                    })}
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
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.category}</label>
                                <div className="flex gap-2">
                                    <select value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')} className={`${inputClass} flex-1`}>
                                        <option value="">{lang === 'ar' ? 'اختر فئة...' : 'Select category...'}</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{lang === 'ar' ? c.name_ar : c.name}</option>)}
                                    </select>
                                    <button onClick={() => setShowNewCat(true)} className="shrink-0 w-11 h-11 rounded-xl border border-dashed border-accent/30 bg-accent/5 text-accent flex items-center justify-center hover:bg-accent/10 transition-all" title={t.newCategory}>
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* New category inline */}
                        <AnimatePresence>
                            {showNewCat && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5"><Tag size={14} className="text-accent" />{t.newCategory}</h4>
                                        <button onClick={() => setShowNewCat(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input value={newCatName} onChange={e => setNewCatName(e.target.value)} className={inputClass} placeholder={t.categoryName} />
                                        <input value={newCatNameAr} onChange={e => setNewCatNameAr(e.target.value)} className={inputClass} placeholder={t.categoryNameAr} />
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                                        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer select-none">
                                            <input type="checkbox" checked={newCatSellable} onChange={e => setNewCatSellable(e.target.checked)} className="rounded" />
                                            {lang === 'ar' ? 'قابل للبيع المباشر' : 'Directly Sellable'}
                                        </label>
                                        <button onClick={handleAddCategory} disabled={!newCatName}
                                            className="flex-1 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-all">
                                            {t.addCategory}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        {lang === 'ar' ? '⚡ الفئات غير القابلة للبيع (مثل الورق والأحبار) تُستخدم كمواد استهلاكية مرتبطة بباقات التصوير' : '⚡ Non-sellable categories (like paper & ink) are used as consumables linked to photography packages'}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.quantity}</label>
                                <input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.unitCost}</label>
                                <input type="number" min="0" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} className={inputClass} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.sellPrice}</label>
                                <input type="number" min="0" step="0.01" value={sellPrice} onChange={e => setSellPrice(e.target.value)} className={inputClass} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.minStock}</label>
                                <input type="number" min="0" value={minStock} onChange={e => setMinStock(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.profit}</label>
                                <div className="px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold text-emerald-500">
                                    {((parseFloat(sellPrice) || 0) - (parseFloat(unitCost) || 0)).toFixed(2)} {settings.currency}
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
                            <button onClick={handleSave} disabled={saving || !itemName}
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
                    <div className="mb-4 relative max-w-md">
                        <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`${inputClass} ps-10`} placeholder={t.search} />
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="text-center py-16">
                            <Package size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm">{t.noItems}</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30">
                                            {[t.itemName, t.category, t.quantity, '', t.unitCost, t.sellPrice, t.profit, t.supplier, ''].map((h, i) => (
                                                <th key={i} className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredItems.map((item, idx) => {
                                            const status = getStockStatus(item);
                                            return (
                                                <motion.tr key={item.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}>
                                                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{item.item_name}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                                            style={{ background: `${item.category_color || '#6B7280'}15`, color: item.category_color || '#6B7280' }}>
                                                            {getCatLabel(item)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold text-foreground tabular-nums">{item.quantity}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                                                        {item.quantity <= item.min_stock && item.quantity > 0 && <AlertTriangle size={12} className="inline-block ms-1 text-amber-500" />}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{item.unit_cost} {settings.currency}</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-foreground tabular-nums">{item.sell_price || 0} {settings.currency}</td>
                                                    <td className="px-4 py-3 text-sm font-bold tabular-nums" style={{ color: ((item.sell_price || 0) - item.unit_cost) >= 0 ? '#10B981' : '#EF4444' }}>
                                                        {((item.sell_price || 0) - item.unit_cost).toFixed(2)} {settings.currency}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.supplier || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-1">
                                                            <button onClick={() => { setStockModal(item); setStockMode('add'); }} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center transition-all" title={t.addStock}>
                                                                <ArrowUp size={14} />
                                                            </button>
                                                            <button onClick={() => { setStockModal(item); setStockMode('adjust'); }} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 flex items-center justify-center transition-all" title={t.adjust}>
                                                                <ArrowDown size={14} />
                                                            </button>
                                                            <button onClick={() => handleShowHistory(item.id)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 flex items-center justify-center transition-all" title={t.history}>
                                                                <History size={14} />
                                                            </button>
                                                            <button onClick={() => handleEdit(item)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all">
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all">
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
                                {filteredItems.map((item, idx) => {
                                    const status = getStockStatus(item);
                                    return (
                                        <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                                            className="bg-card border border-border rounded-xl p-4 shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-sm text-foreground">{item.item_name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-semibold" style={{ color: item.category_color || '#6B7280' }}>{getCatLabel(item)}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => { setStockModal(item); setStockMode('add'); }} className="w-8 h-8 rounded-lg text-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center"><ArrowUp size={14} /></button>
                                                    <button onClick={() => handleEdit(item)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center"><Edit2 size={14} /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{t.quantity}: <strong className="text-foreground">{item.quantity}</strong></span>
                                                <span>{t.unitCost}: <strong>{item.unit_cost}</strong></span>
                                                <span>{t.sellPrice}: <strong className="text-foreground">{item.sell_price || 0}</strong> {settings.currency}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Add Stock Modal */}
            <AnimatePresence>
                {stockModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-5" onClick={() => setStockModal(null)}>
                        <motion.div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-foreground flex items-center gap-2">
                                    {stockMode === 'add' ? <ArrowUp size={18} className="text-emerald-500" /> : <ArrowDown size={18} className="text-amber-500" />}
                                    {stockMode === 'add' ? t.addStock : t.adjust}
                                </h3>
                                <button onClick={() => setStockModal(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                            </div>
                            <p className="text-sm text-muted-foreground">{stockModal.item_name} — {lang === 'ar' ? 'الكمية الحالية' : 'Current'}: <strong>{stockModal.quantity}</strong></p>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t.stockQty}</label>
                                <input type="number" value={stockQty} onChange={e => setStockQty(e.target.value)} className={inputClass}
                                    placeholder={stockMode === 'adjust' ? (lang === 'ar' ? 'موجب للزيادة، سالب للنقص' : '+/- quantity') : '0'} />
                            </div>
                            <button onClick={handleAddStock} disabled={!stockQty}
                                className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all">
                                {t.save}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {historyModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-5" onClick={() => setHistoryModal(null)}>
                        <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
                                <h3 className="font-bold text-foreground flex items-center gap-2"><History size={18} className="text-blue-500" />{t.history}</h3>
                                <button onClick={() => setHistoryModal(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
                                {transactions.length === 0 ? (
                                    <p className="text-center text-muted-foreground text-sm py-8">{lang === 'ar' ? 'لا يوجد سجل' : 'No history'}</p>
                                ) : transactions.map(tx => (
                                    <div key={tx.id} className="flex items-center justify-between py-2.5 px-3 bg-muted/50 rounded-lg">
                                        <div>
                                            <span className={`text-xs font-bold ${tx.quantity > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                                            </span>
                                            <span className="text-xs text-muted-foreground ms-2">{tx.notes}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(tx.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PurchasesPage;
