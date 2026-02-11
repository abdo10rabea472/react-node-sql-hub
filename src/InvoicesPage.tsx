import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, User as UserIcon, Package, CheckCircle, Printer, Loader, DollarSign, Wallet, X, Calendar, Plus, Trash2, Edit2, MessageCircle, Search, Hash } from 'lucide-react';
import { getInvoices, createInvoice, getCustomers, getPackages, getInvoiceDetails, addCustomer, deleteInvoice, updateInvoice, getWhatsAppStatus, sendWhatsAppMessage } from './api';
import { useSettings } from './SettingsContext';

interface Customer { id: number; name: string; phone: string; }
interface PricingPackage { id: number; type: string; price: number; }
interface Invoice { id: number; invoice_no: string; customer_id: number; customer_name: string; customer_phone: string; total_amount: number; paid_amount: number; remaining_amount: number; created_by: string; participants: string; status: string; created_at: string; }
interface SelectedPkg { tempId: number; id: number; type: string; price: number; }
interface InvoiceItem { package_name: string; item_price: number; }

const translations = {
    ar: { title: 'نظام الفواتير', createTab: 'إنشاء فاتورة', listTab: 'سجل الفواتير', selectCustomer: 'بيانات العميل', selectPackages: 'اختر الباقات', multiplePackagesHint: 'يمكنك اختيار أكثر من باقة', participants: 'المشاركين (اختياري)', participantsHint: 'ادخل أسماء المشاركين هنا...', invoiceSummary: 'ملخص الفاتورة', noItems: 'لم يتم اختيار باقات بعد', total: 'الإجمالي', paid: 'المدفوع', remaining: 'المتبقي', createBtn: 'إصدار الفاتورة', customerName: 'اسم العميل', customerPhone: 'رقم الهاتف', invoiceNo: 'رقم الفاتورة', amount: 'المبلغ', status: 'الحالة', date: 'التاريخ', time: 'الوقت', searchCustomer: 'ابحث عن عميل...', paid_label: 'مدفوع', pending: 'معلق', partial: 'جزئي', actions: 'الإجراءات', createdBy: 'المسؤول', print: 'طباعة', deleteConfirm: 'هل أنت متأكد من حذف هذه الفاتورة؟', close: 'إغلاق', studioName: 'استوديو التصوير', editInvoice: 'تعديل الفاتورة', saveChanges: 'حفظ التغييرات', search: 'بحث...', noInvoices: 'لا توجد فواتير حالياً', addCustomer: 'إضافة عميل جديد' },
    en: { title: 'Invoicing System', createTab: 'Create Invoice', listTab: 'Invoice History', selectCustomer: 'Customer Info', selectPackages: 'Select Packages', multiplePackagesHint: 'You can add multiple packages', participants: 'Participants (Optional)', participantsHint: 'Enter names of participants...', invoiceSummary: 'Invoice Summary', noItems: 'No packages selected', total: 'Total', paid: 'Paid', remaining: 'Remaining', createBtn: 'Issue Invoice', customerName: 'Customer Name', customerPhone: 'Phone Number', invoiceNo: 'Invoice No', amount: 'Amount', status: 'Status', date: 'Date', time: 'Time', searchCustomer: 'Search customer...', paid_label: 'Paid', pending: 'Pending', partial: 'Partial', actions: 'Actions', createdBy: 'Manager', print: 'Print', deleteConfirm: 'Are you sure you want to delete this invoice?', close: 'Close', studioName: 'Photography Studio', editInvoice: 'Edit Invoice', saveChanges: 'Save Changes', search: 'Search...', noInvoices: 'No invoices found', addCustomer: 'Add new customer' },
};

const InvoicesPage: React.FC<{ user?: { name: string } }> = ({ user }) => {
    const { settings } = useSettings();
    const lang = settings.lang;
    const t = translations[lang] || translations.en;

    const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
    const [customers, setCustomers] = useState<Customer[]>([]);
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
            const [custRes, pkgRes, invRes] = await Promise.all([getCustomers(), getPackages(), getInvoices()]);
            setCustomers(custRes.data);
            setPackages(pkgRes.data);
            setInvoices(invRes.data);
        } catch (err) { console.error('Fetch error:', err); }
    };

    useEffect(() => { fetchData(); }, []);

    const addPkg = (pkg: PricingPackage) => {
        setSelectedPkgs(prev => [...prev, { tempId: Date.now() + Math.random(), id: pkg.id, type: pkg.type, price: parseFloat(String(pkg.price)) || 0 }]);
    };
    const removePkg = (tempId: number) => setSelectedPkgs(prev => prev.filter(p => p.tempId !== tempId));
    const totalAmount = selectedPkgs.reduce((sum, item) => sum + item.price, 0);
    const remainingAmount = Math.max(0, totalAmount - (parseFloat(paidAmount) || 0));
    const currentUserName = user?.name || 'Admin';

    const handleSendWhatsAppAuto = async (inv: Invoice) => {
        try {
            const statusRes = await getWhatsAppStatus();
            if (!statusRes.data.connected) {
                showToastMessage(lang === 'ar' ? 'الواتساب غير متصل حالياً' : 'WhatsApp is not connected', 'error');
                return;
            }
            const detailsRes = await getInvoiceDetails(inv.id);
            const items = detailsRes.data;
            const itemsText = items.map((it: any) => `- ${it.package_name}: ${it.item_price} ${settings.currency}`).join('\n');
            const text = `*${settings.studioName || t.studioName}*\n${settings.address ? settings.address + '\n' : ''}${settings.phone ? settings.phone + '\n' : ''}\n*${t.invoiceNo}: ${inv.invoice_no}*\n*${t.customerName}:* ${inv.customer_name}\n*${t.customerPhone}:* ${inv.customer_phone}\n${inv.participants ? `*${t.participants}:* ${inv.participants}\n` : ''}\n${itemsText}\n\n*${t.total}:* ${inv.total_amount} ${settings.currency}\n*${t.paid}:* ${inv.paid_amount} ${settings.currency}\n*${t.remaining}:* ${inv.remaining_amount} ${settings.currency}`;
            await sendWhatsAppMessage({ phone: inv.customer_phone, message: text });
            showToastMessage(lang === 'ar' ? '✓ تم إرسال الفاتورة عبر الواتساب' : '✓ Invoice sent via WhatsApp');
        } catch (err: any) {
            console.error('WhatsApp Error:', err);
            showToastMessage(lang === 'ar' ? 'فشل إرسال الفاتورة' : 'Failed to send invoice', 'error');
        }
    };

    const handleCreateInvoice = async () => {
        if (!selectedCustomerId || selectedPkgs.length === 0) return;
        setIsSaving(true);
        try {
            const res = await createInvoice({ customer_id: Number(selectedCustomerId), items: selectedPkgs, total_amount: totalAmount, paid_amount: parseFloat(paidAmount) || 0, participants, created_by: user?.name || 'Admin' });
            await fetchData();
            const invs = await getInvoices();
            const newInv = invs.data.find((i: Invoice) => i.id === res.data.id);
            if (newInv) await handleSendWhatsAppAuto(newInv);
            setSelectedCustomerId(''); setSelectedPkgs([]); setParticipants(''); setPaidAmount('0'); setActiveTab('list');
        } catch (err) {
            console.error('Create error:', err);
            showToastMessage(lang === 'ar' ? 'فشل إنشاء الفاتورة' : 'Failed to create invoice', 'error');
        } finally { setIsSaving(false); }
    };

    const handlePrint = async (id: number) => { try { const inv = invoices.find(i => i.id === id); if (!inv) return; const res = await getInvoiceDetails(id); setPrintingInvoice(inv); setPrintingItems(res.data); setShowPrintModal(true); } catch (err) { console.error(err); } };
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
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
                    <div className="space-y-4">
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
                                <Package size={16} className="text-primary" />{t.selectPackages}
                                <span className="ms-auto text-xs text-muted-foreground font-normal">{t.multiplePackagesHint}</span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {packages.map(pkg => (
                                    <motion.div key={pkg.id} whileTap={{ scale: 0.97 }} onClick={() => addPkg(pkg)}
                                        className="bg-muted/50 border border-border rounded-xl p-3.5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group relative">
                                        <span className="text-sm font-bold text-foreground block">{pkg.type}</span>
                                        <span className="text-xs text-muted-foreground font-semibold mt-1 block">{pkg.price} {settings.currency}</span>
                                        <Plus size={14} className="absolute top-3 end-3 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:text-primary transition-all" />
                                    </motion.div>
                                ))}
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
                        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-5">
                                <Wallet size={16} className="text-primary" />{t.invoiceSummary}
                            </h3>
                            <div className="space-y-2 mb-6 max-h-[250px] overflow-y-auto">
                                {selectedPkgs.length === 0 ? (
                                    <div className="text-center py-10">
                                        <Package size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                                        <p className="text-sm text-muted-foreground">{t.noItems}</p>
                                    </div>
                                ) : selectedPkgs.map(item => (
                                    <motion.div key={item.tempId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        className="flex justify-between items-center py-2.5 px-3 bg-muted/50 rounded-lg group hover:bg-muted transition-all">
                                        <div>
                                            <span className="text-sm font-bold text-foreground">{item.type}</span>
                                            <span className="text-xs text-muted-foreground block">{item.price} {settings.currency}</span>
                                        </div>
                                        <button onClick={() => removePkg(item.tempId)} className="w-7 h-7 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                            <X size={14} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="bg-muted/50 rounded-xl p-4 space-y-4 border border-border/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-muted-foreground">{t.total}</span>
                                    <span className="text-xl font-black text-primary font-mono">{totalAmount} {settings.currency}</span>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t.paid}</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full bg-card border border-border rounded-xl ps-9 pe-4 py-2.5 text-lg font-black font-mono focus:border-primary/50 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-border/50">
                                    <span className="text-xs font-bold text-muted-foreground">{t.remaining}</span>
                                    <span className={`text-lg font-black font-mono ${remainingAmount > 0 ? 'text-destructive' : 'text-emerald-500'}`}>{remainingAmount} {settings.currency}</span>
                                </div>
                            </div>

                            <button onClick={handleCreateInvoice} disabled={!selectedCustomerId || selectedPkgs.length === 0 || isSaving}
                                className="w-full mt-5 bg-primary text-primary-foreground font-black py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm">
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
                                    <thead className="border-b-2 border-black"><tr><th className="text-[10px] font-black text-start py-2 uppercase">{t.selectPackages}</th><th className="text-[10px] font-black text-end py-2 uppercase">{t.amount}</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100">{printingItems.map((item, i) => <tr key={i}><td className="py-2.5 text-[11px] font-bold">{item.package_name}</td><td className="py-2.5 text-end text-[11px] font-black">{item.item_price} {settings.currency}</td></tr>)}</tbody>
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
                            <div><label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.customerPhone}</label><input value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} className={inputClass} dir="ltr" /></div>
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
        </div>
    );
};

export default InvoicesPage;
