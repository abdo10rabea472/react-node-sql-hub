import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, User as UserIcon, Package, CheckCircle, Printer, Loader, DollarSign, X, Calendar, Plus, Trash2, Edit2, MessageCircle, Search, Hash, Camera, Minus, ShoppingCart, AlertTriangle } from 'lucide-react';
import { getInvoices, createInvoice, getCustomers, getInventoryItems, getInvoiceDetails, addCustomer, deleteInvoice, updateInvoice, getWhatsAppStatus, sendWhatsAppMessage, getPackages } from './api';
import { useSettings } from './SettingsContext';

interface Customer { id: number; name: string; phone: string; }
interface InventoryProduct { id: number; item_name: string; sell_price: number; unit_cost: number; quantity: number; category_name_ar: string; category_color: string; is_sellable: number; }
interface PricingPackage { id: number; type: string; price: number; photo_count: number; color: string; sizes: string[]; }
interface Invoice { id: number; invoice_no: string; customer_id: number; customer_name: string; customer_phone: string; total_amount: number; paid_amount: number; remaining_amount: number; created_by: string; participants: string; status: string; created_at: string; }
interface SelectedPkg { tempId: number; id: number; inventory_item_id: number; type: string; price: number; quantity: number; is_package?: boolean; package_id?: number; size?: string; availableSizes?: string[]; }
interface InvoiceItem { package_name: string; item_price: number; quantity: number; total: number; }

const translations = {
    ar: {
        title: 'نظام الفواتير',
        createTab: 'إنشاء فاتورة',
        listTab: 'سجل الفواتير',
        selectCustomer: 'بيانات العميل',
        selectPackages: 'اختر المنتجات',
        multiplePackagesHint: 'يمكنك اختيار أكثر من منتج',
        participants: 'المشاركين (اختياري)',
        participantsHint: 'ادخل أسماء المشاركين هنا...',
        invoiceSummary: 'ملخص الفاتورة',
        noItems: 'لم يتم اختيار منتجات بعد',
        total: 'الإجمالي',
        paid: 'المدفوع',
        remaining: 'المتبقي',
        createBtn: 'إصدار الفاتورة',
        customerName: 'اسم العميل',
        customerPhone: 'رقم الهاتف',
        invoiceNo: 'رقم الفاتورة',
        amount: 'المبلغ',
        status: 'الحالة',
        date: 'التاريخ',
        time: 'الوقت',
        searchCustomer: 'ابحث عن عميل...',
        paid_label: 'مدفوع',
        pending: 'معلق',
        partial: 'جزئي',
        actions: 'الإجراءات',
        createdBy: 'المسؤول',
        print: 'طباعة',
        deleteConfirm: 'هل أنت متأكد من حذف هذه الفاتورة؟',
        close: 'إغلاق',
        studioName: 'استوديو التصوير',
        editInvoice: 'تعديل الفاتورة',
        saveChanges: 'حفظ التغييرات',
        search: 'بحث...',
        noInvoices: 'لا توجد فواتير حالياً',
        addCustomer: 'إضافة عميل جديد',
        inStock: 'متوفر',
        outOfStock: 'نفذ',
        quantity: 'الكمية',
        unitPrice: 'سعر الوحدة',
        subtotal: 'المجموع الفرعي',
        items: 'عنصر',
        todayReport: 'تقارير اليوم',
        totalSales: 'إجمالي المبيعات',
        totalCollected: 'إجمالي المحصل',
        totalUnpaid: 'إجمالي المتبقي',
        invoicesCount: 'عدد الفواتير'
    },
    en: {
        title: 'Invoicing System',
        createTab: 'Create Invoice',
        listTab: 'Invoice History',
        selectCustomer: 'Customer Info',
        selectPackages: 'Select Products',
        multiplePackagesHint: 'You can add multiple products',
        participants: 'Participants (Optional)',
        participantsHint: 'Enter names of participants...',
        invoiceSummary: 'Invoice Summary',
        noItems: 'No products selected',
        total: 'Total',
        paid: 'Paid',
        remaining: 'Remaining',
        createBtn: 'Issue Invoice',
        customerName: 'Customer Name',
        customerPhone: 'Phone Number',
        invoiceNo: 'Invoice No',
        amount: 'Amount',
        status: 'Status',
        date: 'Date',
        time: 'Time',
        searchCustomer: 'Search customer...',
        paid_label: 'Paid',
        pending: 'Pending',
        partial: 'Partial',
        actions: 'Actions',
        createdBy: 'Manager',
        print: 'Print',
        deleteConfirm: 'Are you sure you want to delete this invoice?',
        close: 'Close',
        studioName: 'Photography Studio',
        editInvoice: 'Edit Invoice',
        saveChanges: 'Save Changes',
        search: 'Search...',
        noInvoices: 'No invoices found',
        addCustomer: 'Add new customer',
        inStock: 'In Stock',
        outOfStock: 'Out',
        quantity: 'Quantity',
        unitPrice: 'Unit Price',
        subtotal: 'Subtotal',
        items: 'items',
        todayReport: `تقرير اليوم (${new Date().toLocaleDateString('ar-EG')})`,
        totalSales: 'Total Sales',
        totalCollected: 'Total Collected',
        totalUnpaid: 'Total Unpaid',
        invoicesCount: 'Invoices Count'
    },
};

const InvoicesPage: React.FC<{ user?: { name: string } }> = ({ user }) => {
    const { settings } = useSettings();
    const lang = settings.lang;
    const t = translations[lang] || translations.en;

    const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<InventoryProduct[]>([]);
    const [packages, setPackages] = useState<PricingPackage[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
    const [selectedPkgs, setSelectedPkgs] = useState<SelectedPkg[]>([]);
    const [participants, setParticipants] = useState('');
    const [paidAmount, setPaidAmount] = useState<string>('0');
    const [isSaving, setIsSaving] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [newCustName, setNewCustName] = useState('');
    const [newCustPhone, setNewCustPhone] = useState('');
    const [isAddingCust, setIsAddingCust] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
    const [printingItems, setPrintingItems] = useState<InvoiceItem[]>([]);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [editPaidAmount, setEditPaidAmount] = useState<string>('0');
    const [editParticipants, setEditParticipants] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [searchQuery, setSearchQuery] = useState('');

    const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message); setToastType(type); setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
    };

    const fetchData = async () => {
        try {
            const [custRes, prodRes, invRes, pkgRes] = await Promise.all([getCustomers(), getInventoryItems(), getInvoices(), getPackages()]);
            setCustomers(custRes.data);
            setProducts(prodRes.data.filter((p: any) => p.sell_price > 0 && Number(p.is_sellable) === 1 && p.usage_type === 'studio'));
            setPackages(pkgRes.data);
            setInvoices(invRes.data);
        } catch (err) { console.error('Fetch error:', err); }
    };

    useEffect(() => { fetchData(); }, []);

    const addPkg = (prod: InventoryProduct) => {
        if (prod.quantity <= 0) return;
        setSelectedPkgs(prev => [...prev, { tempId: Date.now() + Math.random(), id: prod.id, inventory_item_id: prod.id, type: prod.item_name, price: parseFloat(String(prod.sell_price)) || 0, quantity: 2, is_package: false }]);
    };

    const addPackage = (pkg: PricingPackage) => {
        const defaultSize = pkg.sizes && pkg.sizes.length > 0 ? pkg.sizes[0] : '';
        setSelectedPkgs(prev => [...prev, { tempId: Date.now() + Math.random(), id: pkg.id, inventory_item_id: 0, type: pkg.type, price: pkg.price, quantity: 2, is_package: true, package_id: pkg.id, size: defaultSize, availableSizes: pkg.sizes }]);
    };

    const removePkg = (tempId: number) => setSelectedPkgs(prev => prev.filter(p => p.tempId !== tempId));

    const updateQuantity = (tempId: number, newQuantity: number) => {
        if (newQuantity < 2) return;
        // Ensure even number
        const evenQty = newQuantity % 2 === 0 ? newQuantity : newQuantity + 1;
        setSelectedPkgs(prev => prev.map(item =>
            item.tempId === tempId ? { ...item, quantity: evenQty } : item
        ));
    };

    const findAndAdjustQuantity = (id: number, isPackage: boolean, delta: number) => {
        setSelectedPkgs(prev => {
            let index = -1;
            for (let i = prev.length - 1; i >= 0; i--) {
                const p = prev[i];
                if (isPackage ? p.package_id === id : p.inventory_item_id === id) {
                    index = i;
                    break;
                }
            }
            if (index === -1) return prev;
            const newArr = [...prev];
            const newQty = (newArr[index].quantity || 2) + delta;
            if (newQty < 2) {
                newArr.splice(index, 1);
            } else {
                newArr[index] = { ...newArr[index], quantity: newQty };
            }
            return newArr;
        });
    };

    const totalAmount = selectedPkgs.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const remainingAmount = Math.max(0, totalAmount - (parseFloat(paidAmount) || 0));
    const currentUserName = user?.name || 'Admin';

    const getTodayStats = () => {
        // Use local date string for comparison to avoid timezone issues
        const todayCommon = new Date().toDateString();

        const todayInvs = invoices.filter(inv => {
            if (!inv.created_at) return false;
            const invDate = new Date(inv.created_at).toDateString();
            return invDate === todayCommon;
        });

        return {
            count: todayInvs.length,
            total: todayInvs.reduce((sum, inv) => sum + Number(inv.total_amount), 0),
            paid: todayInvs.reduce((sum, inv) => sum + Number(inv.paid_amount), 0),
            remaining: todayInvs.reduce((sum, inv) => sum + Number(inv.remaining_amount), 0)
        };
    };

    const todayStats = getTodayStats();

    const handleSendWhatsAppAuto = async (inv: Invoice) => {
        try {
            const statusRes = await getWhatsAppStatus();
            if (!statusRes.data.connected) {
                showToastMessage(lang === 'ar' ? 'الواتساب غير متصل حالياً' : 'WhatsApp is not connected', 'error');
                return;
            }
            const detailsRes = await getInvoiceDetails(inv.id);
            const invoiceData = detailsRes?.data || {};
            const items = Array.isArray(invoiceData.items) ? invoiceData.items : (Array.isArray(invoiceData) ? invoiceData : []);

            // Group items logic (Same as print)
            const groupedMap = new Map();
            items.forEach((it: any) => {
                const price = parseFloat(it.item_price || it.price || 0);
                const name = it.package_name || 'Service';
                const key = `${name}-${price}`;

                if (groupedMap.has(key)) {
                    const existing = groupedMap.get(key);
                    existing.quantity += 1;
                    existing.total += price;
                } else {
                    groupedMap.set(key, {
                        name: name,
                        quantity: 1,
                        total: price
                    });
                }
            });

            const itemsText = Array.from(groupedMap.values()).map((it: any) =>
                `- ${it.name} (x${it.quantity}): ${it.total.toFixed(2)} ${settings.currency}`
            ).join('\n');

            // Build message text safely
            let text = `*${settings.studioName || 'Studio'}*\n`;
            if (settings.address) text += `${settings.address}\n`;
            if (settings.phone) text += `${settings.phone}\n`;

            text += `\n📄 *${t.invoiceNo || 'Invoice'}: ${inv.invoice_no}*`;
            text += `\n👤 *${t.customerName || 'Customer'}:* ${inv.customer_name}`;
            // Optional fields
            if (inv.participants) text += `\n👥 *${t.participants || 'Participants'}:* ${inv.participants}`;

            text += `\n\n${itemsText}\n`;
            text += `\n💰 *${t.total || 'Total'}:* ${inv.total_amount} ${settings.currency}`;
            text += `\n✅ *${t.paid || 'Paid'}:* ${inv.paid_amount} ${settings.currency}`;
            text += `\n⭕ *${t.remaining || 'Remaining'}:* ${inv.remaining_amount} ${settings.currency}`;

            // Send
            await sendWhatsAppMessage({ phone: inv.customer_phone, message: text });
            showToastMessage(lang === 'ar' ? '✓ تم إرسال الفاتورة عبر الواتساب' : '✓ Invoice sent via WhatsApp');
        } catch (err: any) {
            console.error('WhatsApp Error:', err);
            showToastMessage(lang === 'ar' ? 'فشل إرسال الفاتورة' : 'Failed to send invoice', 'error');
        }
    };

    const handleCreateInvoice = async () => {
        if (!selectedCustomerId || selectedPkgs.length === 0) return;

        if ((parseFloat(paidAmount) || 0) <= 0) {
            showToastMessage(lang === 'ar' ? 'يجب إدخال المبلغ المدفوع لإتمام العملية' : 'Paid amount is required to complete the transaction', 'error');
            return;
        }

        setIsSaving(true);
        try {
            // تحويل البيانات للشكل الذي يتوقعه Backend
            // Backend يتوقع: [invoice_id, item.inventory_item_id || item.id, item.type, item.price]
            const formattedItems = selectedPkgs.flatMap(item => {
                const items = [];
                for (let i = 0; i < item.quantity; i++) {
                    items.push({
                        id: item.id,
                        inventory_item_id: item.inventory_item_id,
                        type: item.size ? `${item.type} (${item.size})` : item.type,
                        price: item.price,
                        is_package: item.is_package,
                        package_id: item.package_id,
                        quantity: 1
                    });
                }
                return items;
            });

            const invoiceData = {
                customer_id: Number(selectedCustomerId),
                items: formattedItems,
                total_amount: totalAmount,
                paid_amount: parseFloat(paidAmount) || 0,
                participants: participants || '',
                created_by: user?.name || 'Admin'
            };

            console.log('Sending invoice data:', invoiceData);
            const res = await createInvoice(invoiceData);

            await fetchData();
            await fetchData();
            // Directly fetch the new invoice details to ensure we have the latest data for WA
            const newInvRes = await getInvoiceDetails(res.data.id);
            const newInvoiceData = newInvRes.data;

            // Map the API response to Invoice type if needed, or just pass it if compatible
            // The getInvoiceDetails returns full object now, which is perfect for handleSendWhatsAppAuto
            // We just need to ensure it matches the Invoice interface which handleSendWhatsAppAuto expects

            // Construct a temporary object that satisfies the Invoice interface for the function
            const tempInv: any = {
                id: res.data.id,
                invoice_no: res.data.invoice_no || `INV-${res.data.id}`,
                customer_name: newInvoiceData.customer_name || 'Customer',
                customer_phone: newInvoiceData.customer?.phone || '',
                total_amount: newInvoiceData.total_amount,
                paid_amount: newInvoiceData.paid_amount,
                remaining_amount: newInvoiceData.remaining_amount,
                participants: newInvoiceData.participants
            };

            showToastMessage(lang === 'ar' ? 'جاري إرسال الفاتورة عبر واتساب...' : 'Sending WhatsApp...');
            // Run this in background so UI doesn't freeze? No, user wants automatic sending.
            // We await it to ensure it's sent.
            await handleSendWhatsAppAuto(tempInv);

            setSelectedCustomerId('');
            setSelectedPkgs([]);
            setParticipants('');
            setPaidAmount('0');
            setActiveTab('create');
            handlePrint(res.data.id);

            showToastMessage(lang === 'ar' ? '✓ تم إنشاء الفاتورة بنجاح' : '✓ Invoice created successfully');
        } catch (err: any) {
            console.error('Create error:', err);
            console.error('Error response:', err.response?.data);
            const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
            showToastMessage(lang === 'ar' ? `فشل إنشاء الفاتورة: ${errorMsg}` : `Failed to create invoice: ${errorMsg}`, 'error');
        } finally { setIsSaving(false); }
    };

    const handlePrint = async (id: number) => {
        try {
            const inv = invoices.find(i => i.id === id);
            if (!inv) return;
            const res = await getInvoiceDetails(id);

            // New API Structure Fix
            const invoiceData = res.data;
            const rawItems = Array.isArray(invoiceData.items) ? invoiceData.items : (Array.isArray(invoiceData) ? invoiceData : []);

            // Group items by name and price
            const groupedMap = new Map();

            rawItems.forEach((it: any) => {
                // Ensure price is a number
                const price = parseFloat(it.item_price || it.price || 0);
                const name = it.package_name || 'Service';
                const key = `${name}-${price}`;

                if (groupedMap.has(key)) {
                    const existing = groupedMap.get(key);
                    existing.quantity += 1; // Assuming each item row is quantity 1 unless specified
                    existing.total += price;
                } else {
                    groupedMap.set(key, {
                        package_name: name,
                        item_price: price,
                        quantity: 1,
                        total: price
                    });
                }
            });

            setPrintingInvoice(inv);
            setPrintingItems(Array.from(groupedMap.values()));
            setShowPrintModal(true);
        } catch (err) {
            console.error(err);
        }
    };
    const handleQuickAdd = async () => { if (!newCustName || !newCustPhone) return; setIsAddingCust(true); try { const cleanPhone = newCustPhone.replace(/[^0-9]/g, ''); const phoneWithCode = cleanPhone.startsWith(settings.countryCode) ? cleanPhone : settings.countryCode + cleanPhone; const res = await addCustomer({ name: newCustName, phone: phoneWithCode }); await fetchData(); setSelectedCustomerId(res.data.id); setShowQuickAdd(false); setNewCustName(''); setNewCustPhone(''); } catch (err) { console.error(err); } finally { setIsAddingCust(false); } };
    const handleDeleteInvoice = async (id: number) => { if (!window.confirm(t.deleteConfirm)) return; try { await deleteInvoice(id); await fetchData(); } catch (err: any) { console.error(err); } };
    const handleEditInvoice = (inv: Invoice) => { setEditingInvoice(inv); setEditPaidAmount(inv.paid_amount.toString()); setEditParticipants(inv.participants || ''); };
    const handleUpdateInvoice = async () => {
        if (!editingInvoice) return;
        try {
            await updateInvoice(editingInvoice.id, { paid_amount: parseFloat(editPaidAmount) || 0, total_amount: editingInvoice.total_amount, participants: editParticipants });
            setEditingInvoice(null); await fetchData();
            showToastMessage(lang === 'ar' ? 'تم تحديث الفاتورة بنجاح' : 'Invoice updated successfully');
        } catch (err: any) { showToastMessage(lang === 'ar' ? 'فشل التحديث' : 'Update failed', 'error'); }
    };

    const getStatusLabel = (s: string) => s === 'paid' ? t.paid_label : s === 'partial' ? t.partial : t.pending;
    const statusConfig = (s: string) => s === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : s === 'partial' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20';
    const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo";

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer_phone.includes(searchQuery)
    );

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <header className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <FileText size={20} className="text-primary" />
                            </div>
                            {t.title}
                        </h2>
                    </div>
                    <div className="flex gap-1 bg-muted p-1 rounded-xl w-full sm:w-auto">
                        <button onClick={() => setActiveTab('create')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'create' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Plus size={16} className="inline-block me-1.5 -mt-0.5" />{t.createTab}
                        </button>
                        <button onClick={() => setActiveTab('list')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                            <FileText size={16} className="inline-block me-1.5 -mt-0.5" />{t.listTab}
                        </button>
                    </div>
                </div>
            </header>

            {activeTab === 'create' ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5">
                    <div className="space-y-4">
                        {/* Today's Summary */}
                        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20">
                                <div className="flex items-center gap-2 opacity-80 mb-2">
                                    <FileText size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{t.invoicesCount}</span>
                                </div>
                                <div className="text-2xl font-black">{todayStats.count}</div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-500/20">
                                <div className="flex items-center gap-2 opacity-80 mb-2">
                                    <DollarSign size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{t.totalSales}</span>
                                </div>
                                <div className="text-xl font-black">{todayStats.total.toFixed(0)} <span className="text-[10px] opacity-70">{settings.currency}</span></div>
                            </div>
                            <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-4 text-white shadow-lg shadow-violet-500/20">
                                <div className="flex items-center gap-2 opacity-80 mb-2">
                                    <CheckCircle size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{t.totalCollected}</span>
                                </div>
                                <div className="text-xl font-black">{todayStats.paid.toFixed(0)} <span className="text-[10px] opacity-70">{settings.currency}</span></div>
                            </div>
                            <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white shadow-lg shadow-rose-500/20">
                                <div className="flex items-center gap-2 opacity-80 mb-2">
                                    <AlertTriangle size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{t.totalUnpaid}</span>
                                </div>
                                <div className="text-xl font-black">{todayStats.remaining.toFixed(0)} <span className="text-[10px] opacity-70">{settings.currency}</span></div>
                            </div>
                        </section>

                        {/* Customer Selection */}
                        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
                                <UserIcon size={16} className="text-primary" />{t.selectCustomer}
                            </h3>
                            <div className="flex gap-2 items-center">
                                <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(Number(e.target.value))} className={`${inputClass} flex-1`}>
                                    <option value="">{t.searchCustomer}</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                                </select>
                                <button onClick={() => setShowQuickAdd(true)} className="shrink-0 w-11 h-11 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 hover:border-primary/50 transition-all" title={t.addCustomer}>
                                    <Plus size={20} />
                                </button>
                            </div>
                        </section>

                        {/* Packages */}
                        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
                                <Camera size={16} className="text-primary" />{lang === 'ar' ? 'باقات التصوير' : 'Photography Packages'}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
                                {packages.length === 0 ? (
                                    <p className="text-sm text-muted-foreground col-span-full text-center py-3">{lang === 'ar' ? 'لا توجد باقات' : 'No packages'}</p>
                                ) : packages.map(pkg => {
                                    const itemsInCart = selectedPkgs.filter(p => p.package_id === pkg.id);
                                    const totalQty = itemsInCart.reduce((sum, p) => sum + p.quantity, 0);

                                    return (
                                        <motion.div key={`pkg-${pkg.id}`} whileTap={{ scale: 0.97 }}
                                            onClick={() => totalQty === 0 && addPackage(pkg)}
                                            className={`bg-gradient-to-br from-primary/10 to-primary/5 border-2 ${totalQty > 0 ? 'border-primary shadow-lg shadow-primary/10' : 'border-primary/30'} rounded-xl p-3.5 cursor-pointer hover:border-primary/60 transition-all group relative overflow-hidden`}>
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500" />
                                            <span className="text-sm font-bold text-foreground block relative z-10">{pkg.type}</span>

                                            <div className="flex justify-between items-center mt-2 relative z-10">
                                                <span className="text-xs text-primary font-black">{pkg.price} {settings.currency}</span>

                                                {totalQty > 0 ? (
                                                    <div className="flex items-center gap-2 bg-white/80 dark:bg-black/20 rounded-lg p-1 shadow-sm border border-primary/20">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); findAndAdjustQuantity(pkg.id, true, -2); }}
                                                            className="w-6 h-6 rounded-md bg-card border border-border text-foreground hover:bg-destructive/10 hover:text-destructive transition-all flex items-center justify-center">
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="text-xs font-black min-w-[20px] text-center">{totalQty}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); findAndAdjustQuantity(pkg.id, true, 2); }}
                                                            className="w-6 h-6 rounded-md bg-card border border-border text-foreground hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center">
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{pkg.photo_count} {lang === 'ar' ? 'صورة' : 'photos'}</span>
                                                )}
                                            </div>

                                            {pkg.sizes && pkg.sizes.length > 0 && totalQty === 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1 relative z-10">
                                                    {pkg.sizes.slice(0, 2).map(s => (
                                                        <span key={s} className="text-[8px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20">{s}</span>
                                                    ))}
                                                    {pkg.sizes.length > 2 && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded-md">+ {pkg.sizes.length - 2}</span>}
                                                </div>
                                            )}

                                            {totalQty === 0 && <Plus size={16} className="absolute top-3 end-3 text-primary/40 opacity-0 group-hover:opacity-100 transition-all z-10" />}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4 mt-5">
                                <Package size={16} className="text-primary" />{t.selectPackages}
                                <span className="ms-auto text-xs text-muted-foreground font-normal">{t.multiplePackagesHint}</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {products.length === 0 ? (
                                    <p className="text-sm text-muted-foreground col-span-full text-center py-4">{lang === 'ar' ? 'لا توجد منتجات قابلة للبيع' : 'No sellable products'}</p>
                                ) : products.map(prod => {
                                    const itemsInCart = selectedPkgs.filter(p => p.inventory_item_id === prod.id && !p.is_package);
                                    const totalQty = itemsInCart.reduce((sum, p) => sum + p.quantity, 0);

                                    return (
                                        <motion.div key={`prod-${prod.id}`} whileTap={{ scale: 0.97 }}
                                            onClick={() => prod.quantity > 0 && totalQty === 0 && addPkg(prod)}
                                            className={`bg-muted/50 border-2 ${totalQty > 0 ? 'border-primary bg-primary/5 shadow-md' : 'border-border'} rounded-xl p-3.5 cursor-pointer hover:border-primary/40 transition-all group relative ${prod.quantity <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                            <span className="text-sm font-bold text-foreground block">{prod.item_name}</span>

                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-muted-foreground font-semibold">{prod.sell_price} {settings.currency}</span>

                                                {totalQty > 0 ? (
                                                    <div className="flex items-center gap-2 bg-white/80 dark:bg-black/20 rounded-lg p-1 shadow-sm border border-primary/20">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); findAndAdjustQuantity(prod.id, false, -2); }}
                                                            className="w-6 h-6 rounded-md bg-card border border-border text-foreground hover:bg-destructive/10 hover:text-destructive transition-all flex items-center justify-center">
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="text-xs font-black min-w-[20px] text-center">{totalQty}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); findAndAdjustQuantity(prod.id, false, 2); }}
                                                            className="w-6 h-6 rounded-md bg-card border border-border text-foreground hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center">
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${prod.quantity > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {prod.quantity > 0 ? `${prod.quantity} ${t.inStock}` : t.outOfStock}
                                                    </span>
                                                )}
                                            </div>

                                            {prod.category_name_ar && !totalQty && <span className="text-[10px] mt-1 block" style={{ color: prod.category_color || '#6B7280' }}>{prod.category_name_ar}</span>}
                                            {totalQty === 0 && prod.quantity > 0 && <Plus size={14} className="absolute top-3 end-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all" />}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Participants */}
                        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
                                <CheckCircle size={16} className="text-primary" />{t.participants}
                            </h3>
                            <textarea value={participants} onChange={e => setParticipants(e.target.value)} className={`${inputClass} min-h-[80px] resize-y`} placeholder={t.participantsHint} />
                        </section>
                    </div>

                    {/* Summary Sidebar */}
                    <aside>
                        <div className="bg-gradient-to-br from-card to-muted/30 border-2 border-border rounded-2xl p-6 shadow-xl sticky top-24">
                            <h3 className="font-bold text-base text-foreground flex items-center gap-2 mb-5">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <ShoppingCart size={16} className="text-primary" />
                                </div>
                                {t.invoiceSummary}
                                {selectedPkgs.length > 0 && (
                                    <span className="ms-auto text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-black">
                                        {selectedPkgs.length} {t.items}
                                    </span>
                                )}
                            </h3>

                            <div className="space-y-2.5 mb-6 max-h-[320px] overflow-y-auto custom-scrollbar pe-1">
                                {selectedPkgs.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                                            <Package size={28} className="text-muted-foreground/30" />
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium">{t.noItems}</p>
                                    </div>
                                ) : selectedPkgs.map(item => (
                                    <motion.div key={item.tempId}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-card border border-border rounded-xl p-3.5 group hover:border-primary/30 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <span className="text-sm font-bold text-foreground block mb-1">{item.type}</span>
                                                {item.availableSizes && item.availableSizes.length > 0 && (
                                                    <select
                                                        value={item.size}
                                                        onChange={(e) => {
                                                            const newSize = e.target.value;
                                                            setSelectedPkgs(prev => prev.map(p => p.tempId === item.tempId ? { ...p, size: newSize } : p));
                                                        }}
                                                        className="text-[10px] font-bold bg-muted border border-border rounded-md px-1.5 py-0.5 outline-none text-primary"
                                                    >
                                                        {item.availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                )}
                                                <span className="text-[10px] text-muted-foreground font-medium block mt-1">
                                                    {t.unitPrice}: {item.price} {settings.currency}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removePkg(item.tempId)}
                                                className="w-7 h-7 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                                <X size={14} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.tempId, item.quantity - 2)}
                                                    disabled={item.quantity <= 2}
                                                    className="w-7 h-7 rounded-md bg-card border border-border text-foreground font-bold hover:bg-primary/10 hover:text-primary hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center">
                                                    <Minus size={14} />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.tempId, parseInt(e.target.value) || 2)}
                                                    className="w-12 text-center bg-transparent border-0 outline-none font-black text-sm text-foreground"
                                                    min="2"
                                                    step="2"
                                                />
                                                <button
                                                    onClick={() => updateQuantity(item.tempId, item.quantity + 2)}
                                                    className="w-7 h-7 rounded-md bg-card border border-border text-foreground font-bold hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center">
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            <div className="text-end">
                                                <div className="text-[10px] text-muted-foreground font-medium mb-0.5">{t.subtotal}</div>
                                                <div className="text-base font-black text-primary font-mono">
                                                    {(item.price * item.quantity).toFixed(2)} {settings.currency}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="bg-gradient-to-br from-muted/80 to-muted/40 rounded-xl p-4 space-y-4 border-2 border-border/50 shadow-inner">
                                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                                    <span className="text-sm font-bold text-muted-foreground">{t.total}</span>
                                    <span className="text-2xl font-black text-primary font-mono">{totalAmount.toFixed(2)} {settings.currency}</span>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t.paid}</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full bg-card border-2 border-border rounded-xl ps-9 pe-4 py-2.5 text-lg font-black font-mono focus:border-primary/50 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-border/50">
                                    <span className="text-xs font-bold text-muted-foreground">{t.remaining}</span>
                                    <span className={`text-xl font-black font-mono ${remainingAmount > 0 ? 'text-destructive' : 'text-emerald-500'}`}>{remainingAmount.toFixed(2)} {settings.currency}</span>
                                </div>
                            </div>

                            <button onClick={handleCreateInvoice} disabled={!selectedCustomerId || selectedPkgs.length === 0 || isSaving}
                                className="w-full mt-5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-black py-4 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm">
                                {isSaving ? <Loader className="animate-spin" size={18} /> : <><CheckCircle size={18} />{t.createBtn}</>}
                            </button>
                        </div>
                    </aside>
                </div>
            ) : (
                <div>
                    {/* Search Bar */}
                    <div className="mb-4">
                        <div className="relative max-w-md">
                            <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t.search} className={`${inputClass} ps-10`} />
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border">
                                    <th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-wider">{t.invoiceNo}</th>
                                    <th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-wider">{t.customerName}</th>
                                    <th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-wider">{t.amount}</th>
                                    <th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-wider">{t.remaining}</th>
                                    <th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-wider">{t.status}</th>
                                    <th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-wider">{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredInvoices.length === 0 ? (
                                    <tr><td colSpan={6} className="px-5 py-16 text-center text-muted-foreground"><FileText size={32} className="mx-auto mb-3 opacity-30" /><p>{t.noInvoices}</p></td></tr>
                                ) : filteredInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-black text-foreground">{inv.invoice_no}</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1"><Calendar size={10} />{new Date(inv.created_at).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-bold text-foreground">{inv.customer_name}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">{inv.customer_phone}</span>
                                        </td>
                                        <td className="px-5 py-4 font-black text-sm font-mono">{inv.total_amount} {settings.currency}</td>
                                        <td className={`px-5 py-4 font-black text-sm font-mono ${inv.remaining_amount > 0 ? 'text-destructive' : 'text-emerald-500'}`}>{inv.remaining_amount} {settings.currency}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConfig(inv.status)}`}>{getStatusLabel(inv.status)}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => handleSendWhatsAppAuto(inv)} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-all" title="WhatsApp"><MessageCircle size={16} /></button>
                                                <button onClick={() => handlePrint(inv.id)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title={t.print}><Printer size={16} /></button>
                                                <button onClick={() => handleEditInvoice(inv)} className="p-2 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeleteInvoice(inv.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {filteredInvoices.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <FileText size={32} className="mx-auto mb-3 opacity-30" /><p>{t.noInvoices}</p>
                            </div>
                        ) : filteredInvoices.map(inv => (
                            <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Hash size={14} className="text-primary" />
                                            <span className="text-sm font-black text-foreground">{inv.invoice_no}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 ms-5">
                                            <Calendar size={10} />{new Date(inv.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusConfig(inv.status)}`}>{getStatusLabel(inv.status)}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-3 text-sm">
                                    <UserIcon size={14} className="text-muted-foreground" />
                                    <span className="font-bold">{inv.customer_name}</span>
                                    <span className="text-muted-foreground font-mono text-xs">{inv.customer_phone}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 bg-muted/50 rounded-xl p-3 mb-3">
                                    <div className="text-center">
                                        <span className="text-[10px] text-muted-foreground font-bold block">{t.total}</span>
                                        <span className="text-sm font-black font-mono">{inv.total_amount}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] text-muted-foreground font-bold block">{t.paid}</span>
                                        <span className="text-sm font-black font-mono text-emerald-600">{inv.paid_amount}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] text-muted-foreground font-bold block">{t.remaining}</span>
                                        <span className={`text-sm font-black font-mono ${inv.remaining_amount > 0 ? 'text-destructive' : 'text-emerald-500'}`}>{inv.remaining_amount}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 border-t border-border pt-3">
                                    <button onClick={() => handleSendWhatsAppAuto(inv)} className="flex-1 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-500/20 transition-all"><MessageCircle size={14} />{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</button>
                                    <button onClick={() => handlePrint(inv.id)} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><Printer size={16} /></button>
                                    <button onClick={() => handleEditInvoice(inv)} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDeleteInvoice(inv.id)} className="p-2 rounded-lg border border-border text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={16} /></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Print Modal */}
            <AnimatePresence>
                {showPrintModal && printingInvoice && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
                        <motion.div className="bg-white text-black rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
                            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center no-print">
                                <h3 className="font-bold text-gray-800">{t.print}</h3>
                                <button onClick={() => setShowPrintModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                            </div>
                            <div className="p-8" id="printable-area">
                                <div className="text-center mb-6">
                                    <div className="inline-flex w-12 h-12 bg-black text-white rounded-2xl items-center justify-center text-xl font-black mb-2">📷</div>
                                    <h2 className="text-lg font-black uppercase tracking-tight">{settings.studioName || t.studioName}</h2>
                                    {settings.phone && <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">{settings.phone}</p>}
                                </div>
                                <div className="border-t border-dashed border-gray-300 my-4" />
                                <div className="space-y-2 text-[11px]">
                                    <div className="flex justify-between"><span className="text-gray-400 uppercase tracking-wider font-bold">{t.invoiceNo}</span><span className="font-mono font-bold">{printingInvoice.invoice_no}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400 uppercase tracking-wider font-bold">{t.date}</span><span className="font-bold">{new Date(printingInvoice.created_at).toLocaleDateString()}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400 uppercase tracking-wider font-bold">{t.customerName}</span><span className="font-bold">{printingInvoice.customer_name}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400 uppercase tracking-wider font-bold">{t.customerPhone}</span><span className="font-bold" dir="ltr">{printingInvoice.customer_phone}</span></div>
                                </div>
                                {printingInvoice.participants && <div className="mt-3 p-2.5 bg-gray-50 rounded-xl border-s-4 border-black text-[10px]"><span className="font-black text-gray-400 uppercase block mb-1">{t.participants}</span><p className="font-bold">{printingInvoice.participants}</p></div>}
                                <table className="w-full mt-5 mb-4">
                                    <thead className="border-b-2 border-black"><tr><th className="text-[10px] font-black text-start py-2 uppercase">{t.selectPackages}</th><th className="text-[10px] font-black text-center py-2 uppercase">{t.quantity}</th><th className="text-[10px] font-black text-end py-2 uppercase">{t.amount}</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100">{printingItems.map((item, i) => <tr key={i}><td className="py-2.5 text-[11px] font-bold">{item.package_name}</td><td className="py-2.5 text-center text-[11px] font-bold">{item.quantity}</td><td className="py-2.5 text-end text-[11px] font-black">{item.total.toFixed(2)} {settings.currency}</td></tr>)}</tbody>
                                </table>
                                <div className="bg-black text-white p-4 rounded-2xl space-y-2">
                                    <div className="flex justify-between text-xs font-bold"><span className="opacity-60">{t.total}</span><span>{printingInvoice.total_amount} {settings.currency}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-green-400"><span className="opacity-60">{t.paid}</span><span>{printingInvoice.paid_amount} {settings.currency}</span></div>
                                    <div className="flex justify-between text-sm font-black pt-2 border-t border-white/20"><span>{t.remaining}</span><span>{printingInvoice.remaining_amount} {settings.currency}</span></div>
                                </div>
                                <div className="mt-5 flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest"><span>{t.createdBy}</span><span>{printingInvoice.created_by || currentUserName}</span></div>
                                <div className="text-center mt-6 pb-2 italic font-black text-gray-800">{lang === 'ar' ? 'شكراً لزيارتكم!' : 'Thanks for visiting!'}</div>
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2.5 no-print">
                                <button onClick={() => setShowPrintModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">{t.close}</button>

                                <button onClick={() => window.print()} className="flex-[2] py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"><Printer size={16} />{t.print}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Add Customer Modal */}
            <AnimatePresence>{showQuickAdd && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100] flex items-center justify-center p-5" onClick={() => setShowQuickAdd(false)}>
                    <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
                            <h3 className="font-bold text-foreground">{t.addCustomer}</h3>
                            <button onClick={() => setShowQuickAdd(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.customerName}</label><input value={newCustName} onChange={e => setNewCustName(e.target.value)} className={inputClass} /></div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.customerPhone}</label>
                                <input value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} className={inputClass} dir="ltr" />
                                {newCustPhone.length >= 3 && (() => {
                                    const cleanInput = newCustPhone.replace(/[^0-9]/g, '');
                                    const matches = customers.filter(c => c.phone.includes(cleanInput) || c.name.toLowerCase().includes(newCustPhone.toLowerCase()));
                                    if (matches.length === 0) return null;
                                    return (
                                        <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                                            <p className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1.5">
                                                <Search size={12} />
                                                {lang === 'ar' ? 'عملاء مشابهين موجودين بالفعل:' : 'Similar existing customers:'}
                                            </p>
                                            <div className="space-y-1.5">
                                                {matches.slice(0, 3).map(c => (
                                                    <button key={c.id} type="button" onClick={() => { setSelectedCustomerId(c.id); setShowQuickAdd(false); setNewCustName(''); setNewCustPhone(''); }}
                                                        className="w-full text-start flex justify-between items-center px-3 py-2 bg-card rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                                                        <span className="text-sm font-bold text-foreground">{c.name}</span>
                                                        <span className="text-xs text-muted-foreground font-mono" dir="ltr">{c.phone}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
                            <button onClick={() => setShowQuickAdd(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">{t.close}</button>
                            <button onClick={handleQuickAdd} disabled={!newCustName || !newCustPhone || isAddingCust} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all">
                                {isAddingCust ? <Loader className="animate-spin" size={16} /> : <CheckCircle size={16} />}{lang === 'ar' ? 'إضافة' : 'Add'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}</AnimatePresence>

            {/* Edit Invoice Modal */}
            <AnimatePresence>{editingInvoice && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100] flex items-center justify-center p-5" onClick={() => setEditingInvoice(null)}>
                    <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
                            <h3 className="font-bold text-foreground">{t.editInvoice}: {editingInvoice.invoice_no}</h3>
                            <button onClick={() => setEditingInvoice(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.paid}</label>
                                <div className="relative"><DollarSign size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="number" value={editPaidAmount} onChange={e => setEditPaidAmount(e.target.value)} className={`${inputClass} ps-9`} /></div>
                                <div className="flex justify-between mt-2 px-1">
                                    <small className="text-[10px] text-muted-foreground">{t.total}: {editingInvoice.total_amount}</small>
                                    <small className={`text-[10px] font-bold ${editingInvoice.total_amount - parseFloat(editPaidAmount) > 0 ? 'text-destructive' : 'text-emerald-600'}`}>{t.remaining}: {Math.max(0, editingInvoice.total_amount - (parseFloat(editPaidAmount) || 0))}</small>
                                </div>
                            </div>
                            <div><label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.participants}</label><textarea value={editParticipants} onChange={e => setEditParticipants(e.target.value)} className={`${inputClass} min-h-[70px] resize-y`} placeholder={t.participantsHint} /></div>
                        </div>
                        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
                            <button onClick={() => setEditingInvoice(null)} className="px-4 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">{t.close}</button>
                            <button onClick={handleUpdateInvoice} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 flex items-center gap-2 transition-all"><CheckCircle size={16} />{t.saveChanges}</button>
                        </div>
                    </motion.div>
                </div>
            )}</AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                        className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-2xl z-[5000] flex items-center gap-2.5 ${toastType === 'success' ? 'bg-emerald-600' : 'bg-destructive'}`}>
                        {toastType === 'success' ? <CheckCircle size={18} /> : <X size={18} />}{toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--muted-foreground) / 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--muted-foreground) / 0.3);
                }
            `}</style>
        </div>
    );
};

export default InvoicesPage;
