import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, Package, Loader, ShoppingBag, DollarSign, Receipt, X, Tag, Minus, Wallet, Users } from 'lucide-react';
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, getInventoryCategories, createInventoryCategory, getExpenses, createExpense, deleteExpense, getSalaries, createSalary, deleteSalary, getUsers } from './api';
import { useSettings } from './SettingsContext';

interface Category { id: number; name: string; name_ar: string; color: string; is_sellable: number; usage_type?: string; }
interface InventoryItem { id: number; item_name: string; category_id: number; usage_type: 'studio' | 'wedding'; quantity: number; unit_cost: number; sell_price: number; supplier: string; category_name: string; category_name_ar: string; category_color: string; min_stock?: number; notes?: string; }
interface PurchaseItem { tempId: number; item_id: number; item_name: string; quantity: number; unit_cost: number; total: number; }

const t_ar = { title: 'المشتريات والمصاريف', addPurchase: 'إضافة مشتريات', list: 'سجل المخزون', itemName: 'اسم الصنف', category: 'الفئة', quantity: 'الكمية', unitCost: 'سعر الوحدة', total: 'الإجمالي', paid: 'المدفوع', remaining: 'الباقي', supplier: 'المورد', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', search: 'بحث...', noItems: 'لا يوجد مخزون', addItem: 'إضافة صنف', selectItem: 'اختر صنف...', purchaseSummary: 'ملخص المشتريات', newCategory: 'فئة جديدة', categoryName: 'اسم الفئة', categoryNameAr: 'الاسم بالعربي', addCategory: 'إضافة فئة', notes: 'ملاحظات', items: 'عنصر', subtotal: 'المجموع الفرعي', type: 'النوع', studio: 'صالة', wedding: 'زفاف', expenses: 'المصاريف العادية', salaries: 'المرتبات', addExpense: 'إضافة مصروف', addSalary: 'صرف مرتب', description: 'الوصف', amount: 'المبلغ', date: 'التاريخ', employee: 'الموظف', selectEmployee: 'اختر الموظف...', bonus: 'بونص', deductions: 'خصومات', netSalary: 'صافي المرتب', month: 'الشهر', noExpenses: 'لا يوجد مصاريف', noSalaries: 'لا يوجد مرتبات' };
const t_en = { title: 'Purchases & Expenses', addPurchase: 'Add Purchase', list: 'Inventory List', itemName: 'Item Name', category: 'Category', quantity: 'Quantity', unitCost: 'Unit Cost', total: 'Total', paid: 'Paid', remaining: 'Remaining', supplier: 'Supplier', save: 'Save', cancel: 'Cancel', delete: 'Delete', search: 'Search...', noItems: 'No inventory', addItem: 'Add Item', selectItem: 'Select item...', purchaseSummary: 'Purchase Summary', newCategory: 'New Category', categoryName: 'Category Name', categoryNameAr: 'Arabic Name', addCategory: 'Add Category', notes: 'Notes', items: 'items', subtotal: 'Subtotal', type: 'Type', studio: 'Studio', wedding: 'Wedding', expenses: 'Regular Expenses', salaries: 'Salaries', addExpense: 'Add Expense', addSalary: 'Pay Salary', description: 'Description', amount: 'Amount', date: 'Date', employee: 'Employee', selectEmployee: 'Select employee...', bonus: 'Bonus', deductions: 'Deductions', netSalary: 'Net Salary', month: 'Month', noExpenses: 'No expenses', noSalaries: 'No salaries' };

const PurchasesPage: React.FC<{ user?: { name: string } }> = ({ user }) => {
    const { settings } = useSettings();
    const lang = settings.lang;
    const t = lang === 'ar' ? t_ar : t_en;

    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'purchase' | 'list' | 'expenses' | 'salaries'>('purchase');
    const [usageFilter, setUsageFilter] = useState<'studio' | 'wedding'>('studio');
    const [searchQuery, setSearchQuery] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    // Expenses state
    const [expenses, setExpenses] = useState<any[]>([]);
    const [expDesc, setExpDesc] = useState('');
    const [expCategory, setExpCategory] = useState('عامة');
    const [expAmount, setExpAmount] = useState('');
    const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
    const [expNotes, setExpNotes] = useState('');

    // Salaries state
    const [salaries, setSalaries] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [salUserId, setSalUserId] = useState<number | ''>('');
    const [salUserName, setSalUserName] = useState('');
    const [salAmount, setSalAmount] = useState('');
    const [salBonus, setSalBonus] = useState('0');
    const [salDeductions, setSalDeductions] = useState('0');
    const [salMonth, setSalMonth] = useState(new Date().toISOString().slice(0, 7));
    const [salNotes, setSalNotes] = useState('');

    // Purchase state
    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
    const [itemQty, setItemQty] = useState('1');
    const [itemCost, setItemCost] = useState('');
    const [paidAmount, setPaidAmount] = useState('0');
    const [supplier, setSupplier] = useState('');
    const [saving, setSaving] = useState(false);

    // New item form
    const [showNewItem, setShowNewItem] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newCategoryId, setNewCategoryId] = useState<number | ''>('');
    const [showNewCat, setShowNewCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatNameAr, setNewCatNameAr] = useState('');
    const [newCatColor, setNewCatColor] = useState('#6B7280');

    const toast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(msg); setToastType(type); setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const fetchData = async () => {
        try {
            const [iRes, cRes, eRes, sRes, uRes] = await Promise.all([
                getInventoryItems(), getInventoryCategories(),
                getExpenses().catch(() => ({ data: [] })),
                getSalaries().catch(() => ({ data: [] })),
                getUsers().catch(() => ({ data: [] })),
            ]);
            setItems(iRes.data);
            setCategories(cRes.data);
            setExpenses(Array.isArray(eRes.data) ? eRes.data : []);
            setSalaries(Array.isArray(sRes.data) ? sRes.data : []);
            setEmployees(Array.isArray(uRes.data) ? uRes.data : []);
        } catch { toast(lang === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // Filter categories and items based on usageFilter
    const availableCategories = categories.filter(c => !c.usage_type || c.usage_type === usageFilter);
    const availableItems = items.filter(i => i.usage_type === usageFilter);

    const addPurchaseItem = () => {
        if (!selectedItemId || !itemQty || !itemCost) return;
        const item = items.find(i => i.id === selectedItemId);
        if (!item) return;
        const qty = parseInt(itemQty);
        const cost = parseFloat(itemCost);
        setPurchaseItems(prev => [...prev, {
            tempId: Date.now() + Math.random(),
            item_id: item.id,
            item_name: item.item_name,
            quantity: qty,
            unit_cost: cost,
            total: qty * cost
        }]);
        setSelectedItemId(''); setItemQty('1'); setItemCost('');
    };

    const removePurchaseItem = (tempId: number) => setPurchaseItems(prev => prev.filter(p => p.tempId !== tempId));

    const updatePurchaseQty = (tempId: number, newQty: number) => {
        if (newQty < 1) return;
        setPurchaseItems(prev => prev.map(item =>
            item.tempId === tempId ? { ...item, quantity: newQty, total: newQty * item.unit_cost } : item
        ));
    };

    const totalAmount = purchaseItems.reduce((sum, item) => sum + item.total, 0);
    const remainingAmount = Math.max(0, totalAmount - (parseFloat(paidAmount) || 0));

    const handleSavePurchase = async () => {
        if (purchaseItems.length === 0) return;

        if ((parseFloat(paidAmount) || 0) <= 0) {
            toast(lang === 'ar' ? 'يجب إدخال المبلغ المدفوع لإتمام العملية' : 'Paid amount is required to complete the transaction', 'error');
            return;
        }

        setSaving(true);
        try {
            for (const pItem of purchaseItems) {
                const existingItem = items.find(i => i.id === pItem.item_id);
                if (existingItem) {
                    await updateInventoryItem(pItem.item_id, {
                        item_name: existingItem.item_name,
                        category_id: existingItem.category_id,
                        usage_type: existingItem.usage_type,
                        quantity: existingItem.quantity + pItem.quantity,
                        unit_cost: pItem.unit_cost,
                        sell_price: existingItem.sell_price,
                        min_stock: existingItem.min_stock || 5,
                        supplier: supplier || existingItem.supplier,
                        notes: existingItem.notes || '',
                        created_by: user?.name || 'Admin'
                    });
                }
            }
            toast(lang === 'ar' ? 'تم حفظ المشتريات بنجاح' : 'Purchase saved successfully');
            setPurchaseItems([]); setPaidAmount('0'); setSupplier('');
            await fetchData();
        } catch (err) {
            console.error('Save purchase error:', err);
            toast(lang === 'ar' ? 'فشل الحفظ' : 'Save failed', 'error');
        }
        finally { setSaving(false); }
    };

    const handleAddNewItem = async () => {
        if (!newItemName) return;
        try {
            const res = await createInventoryItem({
                item_name: newItemName,
                category_id: newCategoryId || null,
                usage_type: usageFilter,
                quantity: 0,
                unit_cost: 0,
                sell_price: 0,
                min_stock: 5,
                supplier: '',
                notes: '',
                created_by: user?.name || 'Admin'
            });

            await fetchData();
            setTimeout(() => { setSelectedItemId(res.data.id); }, 100);

            setShowNewItem(false);
            setNewItemName('');
            setNewCategoryId('');
            toast(lang === 'ar' ? 'تم إضافة الصنف' : 'Item added');
        } catch (err) {
            console.error('Add item error:', err);
            toast(lang === 'ar' ? 'فشل' : 'Failed', 'error');
        }
    };

    const handleAddCategory = async () => {
        if (!newCatName) return;
        try {
            await createInventoryCategory({
                name: newCatName,
                name_ar: newCatNameAr || newCatName,
                color: newCatColor,
                usage_type: usageFilter,
                is_sellable: 1
            });
            setShowNewCat(false); setNewCatName(''); setNewCatNameAr(''); setNewCatColor('#6B7280');
            await fetchData();
            toast(lang === 'ar' ? 'تم إضافة الفئة' : 'Category added');
        } catch { toast(lang === 'ar' ? 'فشل' : 'Failed', 'error'); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
        try { await deleteInventoryItem(id); await fetchData(); toast(lang === 'ar' ? 'تم الحذف' : 'Deleted'); }
        catch { toast(lang === 'ar' ? 'فشل' : 'Failed', 'error'); }
    };

    const filteredItems = availableItems.filter(p => p.item_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all";

    if (loading) return <div className="flex items-center justify-center min-h-[200px]"><Loader className="animate-spin text-primary" size={24} /></div>;

    const accentColor = usageFilter === 'studio' ? 'amber' : 'rose';
    const accentClass = usageFilter === 'studio' ? 'from-amber-500 to-orange-500' : 'from-rose-500 to-pink-500';
    const accentText = usageFilter === 'studio' ? 'text-amber-600' : 'text-rose-500';

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
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accentClass} flex items-center justify-center shadow-lg`}>
                            <ShoppingBag size={20} className="text-white" />
                        </div>
                        {t.title}
                        <span className={`text-[10px] px-2 py-1 rounded-md bg-${accentColor}-500/10 ${accentText} uppercase tracking-widest font-black`}>{usageFilter === 'studio' ? t.studio : t.wedding}</span>
                    </h2>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex bg-muted p-1 rounded-xl flex-wrap">
                            <button onClick={() => { setUsageFilter('studio'); setSelectedItemId(''); }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${usageFilter === 'studio' ? 'bg-card text-amber-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t.studio}</button>
                            <button onClick={() => { setUsageFilter('wedding'); setSelectedItemId(''); }} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${usageFilter === 'wedding' ? 'bg-card text-rose-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t.wedding}</button>
                        </div>

                        <div className="flex gap-1 bg-muted p-1 rounded-xl flex-wrap">
                            <button onClick={() => setActiveTab('purchase')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'purchase' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                <Plus size={14} className="inline-block me-1 -mt-0.5" />{t.addPurchase}
                            </button>
                            <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                <Package size={14} className="inline-block me-1 -mt-0.5" />{t.list}
                            </button>
                            <button onClick={() => setActiveTab('expenses')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'expenses' ? 'bg-card text-orange-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                <Wallet size={14} className="inline-block me-1 -mt-0.5" />{t.expenses}
                            </button>
                            <button onClick={() => setActiveTab('salaries')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'salaries' ? 'bg-card text-emerald-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                <Users size={14} className="inline-block me-1 -mt-0.5" />{t.salaries}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {activeTab === 'purchase' ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
                    <div className="space-y-4">
                        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
                                <Package size={16} className={accentText} />{t.addItem}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_140px_auto] gap-3">
                                <div className="flex gap-2">
                                    <select value={selectedItemId} onChange={e => setSelectedItemId(Number(e.target.value))} className={`${inputClass} flex-1`}>
                                        <option value="">{t.selectItem}</option>
                                        {availableItems.map(i => <option key={i.id} value={i.id}>{i.item_name}</option>)}
                                    </select>
                                    <button onClick={() => setShowNewItem(true)} className={`shrink-0 w-11 h-11 rounded-xl border border-dashed flex items-center justify-center transition-all ${usageFilter === 'studio' ? 'border-amber-500/30 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10' : 'border-rose-500/30 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10'}`}>
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <input type="number" min="1" value={itemQty} onChange={e => setItemQty(e.target.value)} className={inputClass} placeholder={t.quantity} />
                                <input type="number" min="0" step="0.01" value={itemCost} onChange={e => setItemCost(e.target.value)} className={inputClass} placeholder={t.unitCost} />
                                <button onClick={addPurchaseItem} disabled={!selectedItemId || !itemQty || !itemCost}
                                    className={`px-6 py-2.5 rounded-xl text-white font-bold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 ${accentClass}`}>
                                    <Plus size={16} />{t.addItem}
                                </button>
                            </div>
                        </section>

                        <AnimatePresence>
                            {showNewItem && (
                                <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    className={`border rounded-2xl p-5 ${usageFilter === 'studio' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2"><Tag size={14} className={accentText} />{lang === 'ar' ? 'صنف جديد ' : 'New Item '} ({usageFilter === 'studio' ? t.studio : t.wedding})</h4>
                                        <button onClick={() => setShowNewItem(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                        <input value={newItemName} onChange={e => setNewItemName(e.target.value)} className={inputClass} placeholder={t.itemName} />
                                        <div className="flex gap-2">
                                            <select value={newCategoryId} onChange={e => setNewCategoryId(e.target.value ? Number(e.target.value) : '')} className={`${inputClass} flex-1`}>
                                                <option value="">{t.category}</option>
                                                {availableCategories.map(c => <option key={c.id} value={c.id}>{lang === 'ar' ? c.name_ar : c.name}</option>)}
                                            </select>
                                            <button onClick={() => setShowNewCat(true)} className="shrink-0 w-11 h-11 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-all">
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    {showNewCat && (
                                        <div className="bg-card border border-border rounded-xl p-3 mb-3 space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} className={inputClass} placeholder={t.categoryName} />
                                                <input value={newCatNameAr} onChange={e => setNewCatNameAr(e.target.value)} className={inputClass} placeholder={t.categoryNameAr} />
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                                                <button onClick={handleAddCategory} disabled={!newCatName} className={`flex-1 py-2 rounded-lg text-white font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-all ${accentClass}`}>{t.addCategory}</button>
                                            </div>
                                        </div>
                                    )}
                                    <button onClick={handleAddNewItem} disabled={!newItemName} className={`w-full py-2.5 rounded-xl text-white font-bold hover:opacity-90 disabled:opacity-40 transition-all ${accentClass} shadow-lg shadow-${accentColor}-500/20`}>{t.save}</button>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
                                <Receipt size={16} className={accentText} />{t.supplier}
                            </h3>
                            <input value={supplier} onChange={e => setSupplier(e.target.value)} className={inputClass} placeholder={lang === 'ar' ? 'اسم المورد (اختياري)' : 'Supplier name (optional)'} />
                        </section>
                    </div>

                    <aside>
                        <div className="bg-gradient-to-br from-card to-muted/30 border-2 border-border rounded-2xl p-6 shadow-xl sticky top-24">
                            <h3 className="font-bold text-base text-foreground flex items-center gap-2 mb-5">
                                <div className={`w-8 h-8 rounded-lg bg-${accentColor}-500/10 flex items-center justify-center`}>
                                    <Receipt size={16} className={accentText} />
                                </div>
                                {t.purchaseSummary}
                                {purchaseItems.length > 0 && (
                                    <span className={`ms-auto text-xs bg-${accentColor}-500/10 ${accentText} px-2.5 py-1 rounded-full font-black`}>
                                        {purchaseItems.length} {t.items}
                                    </span>
                                )}
                            </h3>

                            <div className="space-y-2.5 mb-6 max-h-[320px] overflow-y-auto pe-1">
                                {purchaseItems.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                                            <Package size={28} className="text-muted-foreground/30" />
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium">{t.noItems}</p>
                                    </div>
                                ) : purchaseItems.map(item => (
                                    <motion.div key={item.tempId} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                                        className={`bg-card border border-border rounded-xl p-3.5 group hover:border-${accentColor}-500/30 hover:shadow-md transition-all`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <span className="text-sm font-bold text-foreground block mb-1">{item.item_name}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {t.unitCost}: {item.unit_cost} {settings.currency}
                                                </span>
                                            </div>
                                            <button onClick={() => removePurchaseItem(item.tempId)}
                                                className="w-7 h-7 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                                                <button onClick={() => updatePurchaseQty(item.tempId, item.quantity - 1)} disabled={item.quantity <= 1}
                                                    className={`w-7 h-7 rounded-md bg-card border border-border text-foreground font-bold hover:bg-${accentColor}-500/10 hover:${accentText} hover:border-${accentColor}-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center`}>
                                                    <Minus size={14} />
                                                </button>
                                                <input type="number" value={item.quantity} onChange={(e) => updatePurchaseQty(item.tempId, parseInt(e.target.value) || 1)}
                                                    className="w-12 text-center bg-transparent border-0 outline-none font-black text-sm text-foreground" min="1" />
                                                <button onClick={() => updatePurchaseQty(item.tempId, item.quantity + 1)}
                                                    className={`w-7 h-7 rounded-md bg-card border border-border text-foreground font-bold hover:bg-${accentColor}-500/10 hover:${accentText} hover:border-${accentColor}-500/30 transition-all flex items-center justify-center`}>
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <div className="text-end">
                                                <div className="text-[10px] text-muted-foreground font-medium mb-0.5">{t.subtotal}</div>
                                                <div className={`text-base font-black ${accentText} font-mono`}>
                                                    {item.total.toFixed(2)} {settings.currency}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-4 space-y-4 border-2 border-border/50 shadow-inner">
                                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                                    <span className="text-sm font-bold text-muted-foreground">{t.total}</span>
                                    <span className={`text-2xl font-black ${accentText} font-mono`}>{totalAmount.toFixed(2)} {settings.currency}</span>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t.paid}</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className={`w-full bg-card border-2 border-border rounded-xl ps-9 pe-4 py-2.5 text-lg font-black font-mono focus:border-${accentColor}-500/50 outline-none transition-all`} />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-border/50">
                                    <span className="text-xs font-bold text-muted-foreground">{t.remaining}</span>
                                    <span className={`text-xl font-black font-mono ${remainingAmount > 0 ? 'text-destructive' : 'text-emerald-500'}`}>{remainingAmount.toFixed(2)} {settings.currency}</span>
                                </div>
                            </div>

                            <button onClick={handleSavePurchase} disabled={purchaseItems.length === 0 || saving}
                                className={`w-full mt-5 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm ${accentClass}`}>
                                {saving ? <Loader className="animate-spin" size={18} /> : <><ShoppingBag size={18} />{t.save}</>}
                            </button>
                        </div>
                    </aside>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredItems.map((item, idx) => (
                                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                                    className={`bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-${accentColor}-500/30 transition-all group`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-foreground mb-1">{item.item_name}</h4>
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${item.category_color || '#6B7280'}15`, color: item.category_color || '#6B7280' }}>
                                                {lang === 'ar' ? (item.category_name_ar || item.category_name || '-') : (item.category_name || '-')}
                                            </span>
                                        </div>
                                        <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t.quantity}:</span>
                                            <span className="font-bold text-foreground">{item.quantity}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t.unitCost}:</span>
                                            <span className="font-bold text-foreground">{item.unit_cost} {settings.currency}</span>
                                        </div>
                                        {item.supplier && (
                                            <div className="flex justify-between pt-2 border-t border-border">
                                                <span className="text-muted-foreground">{t.supplier}:</span>
                                                <span className="font-semibold text-foreground">{item.supplier}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ EXPENSES TAB ═══ */}
            {activeTab === 'expenses' && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Wallet size={16} className="text-orange-500" />{t.expenses}</h3>
                        {expenses.length === 0 ? (
                            <div className="text-center py-16 bg-card border border-border rounded-2xl"><Wallet size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground text-sm">{t.noExpenses}</p></div>
                        ) : (
                            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                <table className="w-full"><thead><tr className="bg-muted/50">
                                    <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{t.description}</th>
                                    <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{t.category}</th>
                                    <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{t.amount}</th>
                                    <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{t.date}</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr></thead><tbody>
                                    {expenses.map((exp: any) => (
                                        <tr key={exp.id} className="border-t border-border/50 hover:bg-muted/30">
                                            <td className="px-4 py-3 text-sm font-medium">{exp.description}</td>
                                            <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 font-semibold">{exp.category}</span></td>
                                            <td className="px-4 py-3 text-sm font-bold text-orange-600">{Number(exp.amount).toLocaleString()} {settings.currency}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">{(exp.expense_date || exp.created_at || '').slice(0, 10)}</td>
                                            <td className="px-4 py-3"><button onClick={async () => { if (window.confirm(lang === 'ar' ? 'حذف؟' : 'Delete?')) { await deleteExpense(exp.id); await fetchData(); toast(lang === 'ar' ? 'تم الحذف' : 'Deleted'); } }} className="w-7 h-7 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"><Trash2 size={14} /></button></td>
                                        </tr>
                                    ))}
                                </tbody></table>
                                <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-between">
                                    <span className="text-xs font-bold text-muted-foreground">{t.total}</span>
                                    <span className="text-sm font-black text-orange-600">{expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0).toLocaleString()} {settings.currency}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <aside>
                        <div className="bg-card border-2 border-orange-500/20 rounded-2xl p-5 sticky top-24 space-y-4">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2"><Plus size={16} className="text-orange-500" />{t.addExpense}</h3>
                            <input value={expDesc} onChange={e => setExpDesc(e.target.value)} className={inputClass} placeholder={t.description} />
                            <select value={expCategory} onChange={e => setExpCategory(e.target.value)} className={inputClass}>
                                {[lang === 'ar' ? 'عامة' : 'General', lang === 'ar' ? 'إيجار' : 'Rent', lang === 'ar' ? 'كهرباء ومياه' : 'Utilities', lang === 'ar' ? 'صيانة' : 'Maintenance', lang === 'ar' ? 'نقل' : 'Transport', lang === 'ar' ? 'تسويق' : 'Marketing', lang === 'ar' ? 'أخرى' : 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} className={inputClass} placeholder={t.amount} />
                            <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className={inputClass} />
                            <input value={expNotes} onChange={e => setExpNotes(e.target.value)} className={inputClass} placeholder={t.notes} />
                            <button disabled={!expDesc || !expAmount || saving} onClick={async () => {
                                setSaving(true);
                                try {
                                    await createExpense({ description: expDesc, category: expCategory, amount: parseFloat(expAmount), expense_date: expDate, notes: expNotes, created_by: user?.name || 'Admin' });
                                    setExpDesc(''); setExpAmount(''); setExpNotes('');
                                    await fetchData();
                                    toast(lang === 'ar' ? 'تم إضافة المصروف' : 'Expense added');
                                } catch { toast(lang === 'ar' ? 'فشل' : 'Failed', 'error'); }
                                finally { setSaving(false); }
                            }} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                                {saving ? <Loader className="animate-spin" size={16} /> : <><Plus size={16} />{t.save}</>}
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* ═══ SALARIES TAB ═══ */}
            {activeTab === 'salaries' && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Users size={16} className="text-emerald-500" />{t.salaries}</h3>
                        {salaries.length === 0 ? (
                            <div className="text-center py-16 bg-card border border-border rounded-2xl"><Users size={40} className="mx-auto text-muted-foreground/30 mb-3" /><p className="text-muted-foreground text-sm">{t.noSalaries}</p></div>
                        ) : (
                            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                <table className="w-full"><thead><tr className="bg-muted/50">
                                    <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{t.employee}</th>
                                    <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{t.amount}</th>
                                    <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{t.bonus}</th>
                                    <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{t.deductions}</th>
                                    <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{t.netSalary}</th>
                                    <th className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground">{t.month}</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr></thead><tbody>
                                    {salaries.map((sal: any) => (
                                        <tr key={sal.id} className="border-t border-border/50 hover:bg-muted/30">
                                            <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-bold">{(sal.user_name || '?')[0]}</div><span className="text-sm font-medium">{sal.user_name}</span></div></td>
                                            <td className="px-4 py-3 text-sm">{Number(sal.amount).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-emerald-600">+{Number(sal.bonus || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-destructive">-{Number(sal.deductions || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm font-black text-emerald-600">{Number(sal.net_salary).toLocaleString()} {settings.currency}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">{sal.month}</td>
                                            <td className="px-4 py-3"><button onClick={async () => { if (window.confirm(lang === 'ar' ? 'حذف؟' : 'Delete?')) { await deleteSalary(sal.id); await fetchData(); toast(lang === 'ar' ? 'تم الحذف' : 'Deleted'); } }} className="w-7 h-7 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"><Trash2 size={14} /></button></td>
                                        </tr>
                                    ))}
                                </tbody></table>
                                <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-between">
                                    <span className="text-xs font-bold text-muted-foreground">{t.total}</span>
                                    <span className="text-sm font-black text-emerald-600">{salaries.reduce((s: number, e: any) => s + Number(e.net_salary || 0), 0).toLocaleString()} {settings.currency}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <aside>
                        <div className="bg-card border-2 border-emerald-500/20 rounded-2xl p-5 sticky top-24 space-y-4">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2"><Plus size={16} className="text-emerald-500" />{t.addSalary}</h3>
                            <select value={salUserId} onChange={e => { const id = Number(e.target.value); setSalUserId(id); const emp = employees.find((u: any) => u.id === id); setSalUserName(emp?.name || ''); }} className={inputClass}>
                                <option value="">{t.selectEmployee}</option>
                                {employees.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                            </select>
                            <input type="number" value={salAmount} onChange={e => setSalAmount(e.target.value)} className={inputClass} placeholder={lang === 'ar' ? 'المرتب الأساسي' : 'Base Salary'} />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" value={salBonus} onChange={e => setSalBonus(e.target.value)} className={inputClass} placeholder={t.bonus} />
                                <input type="number" value={salDeductions} onChange={e => setSalDeductions(e.target.value)} className={inputClass} placeholder={t.deductions} />
                            </div>
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                <div className="flex justify-between"><span className="text-xs text-muted-foreground">{t.netSalary}:</span><span className="text-sm font-black text-emerald-600">{((parseFloat(salAmount) || 0) + (parseFloat(salBonus) || 0) - (parseFloat(salDeductions) || 0)).toLocaleString()} {settings.currency}</span></div>
                            </div>
                            <input type="month" value={salMonth} onChange={e => setSalMonth(e.target.value)} className={inputClass} />
                            <input value={salNotes} onChange={e => setSalNotes(e.target.value)} className={inputClass} placeholder={t.notes} />
                            <button disabled={!salUserId || !salAmount || saving} onClick={async () => {
                                setSaving(true);
                                try {
                                    await createSalary({ user_id: salUserId, user_name: salUserName, amount: parseFloat(salAmount), bonus: parseFloat(salBonus) || 0, deductions: parseFloat(salDeductions) || 0, month: salMonth, notes: salNotes, created_by: user?.name || 'Admin' });
                                    setSalUserId(''); setSalUserName(''); setSalAmount(''); setSalBonus('0'); setSalDeductions('0'); setSalNotes('');
                                    await fetchData();
                                    toast(lang === 'ar' ? 'تم صرف المرتب' : 'Salary paid');
                                } catch { toast(lang === 'ar' ? 'فشل' : 'Failed', 'error'); }
                                finally { setSaving(false); }
                            }} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                                {saving ? <Loader className="animate-spin" size={16} /> : <><DollarSign size={16} />{t.save}</>}
                            </button>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
};

export default PurchasesPage;
