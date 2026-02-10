import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, User as UserIcon, Package, CheckCircle, Printer, Loader, DollarSign, Wallet, X, Calendar, Plus, Trash2, Edit2, MessageCircle, Download } from 'lucide-react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { getInvoices, createInvoice, getCustomers, getPackages, getInvoiceDetails, addCustomer, deleteInvoice, updateInvoice, sendWhatsAppPDF, getWhatsAppStatus, sendWhatsAppMessage } from './api';
import { useSettings } from './SettingsContext';

// Initialize pdfMake vfs
try {
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs || pdfFonts;
} catch (e) {
  console.error('pdfMake VFS init error:', e);
}

const getPdfMake = () => pdfMake as any;

interface Customer { id: number; name: string; phone: string; }
interface PricingPackage { id: number; type: string; price: number; }
interface Invoice { id: number; invoice_no: string; customer_id: number; customer_name: string; customer_phone: string; total_amount: number; paid_amount: number; remaining_amount: number; created_by: string; participants: string; status: string; created_at: string; }
interface SelectedPkg { tempId: number; id: number; type: string; price: number; }
interface InvoiceItem { package_name: string; item_price: number; }

const translations = {
    ar: { title: 'نظام الفواتير', createTab: 'إنشاء فاتورة', listTab: 'سجل الفواتير', selectCustomer: 'بيانات العميل', selectPackages: 'اختر الباقات', multiplePackagesHint: 'يمكنك اختيار أكثر من باقة', participants: 'المشاركين (اختياري)', participantsHint: 'ادخل أسماء المشاركين هنا...', invoiceSummary: 'ملخص الفاتورة', noItems: 'لم يتم اختيار باقات بعد', total: 'الإجمالي', paid: 'المدفوع', remaining: 'المتبقي', createBtn: 'إصدار الفاتورة', customerName: 'اسم العميل', customerPhone: 'رقم الهاتف', invoiceNo: 'رقم الفاتورة', amount: 'المبلغ', status: 'الحالة', date: 'التاريخ', time: 'الوقت', searchCustomer: 'ابحث عن عميل...', paid_label: 'مدفوع بالكامل', pending: 'معلق', partial: 'مدفوع جزئياً', actions: 'الإجراءات', createdBy: 'اسم المسؤول', print: 'طباعة الفاتورة/PDF', deleteConfirm: 'هل أنت متأكد من حذف هذه الفاتورة؟', close: 'إغلاق', studioName: 'استوديو التصوير', editInvoice: 'تعديل الفاتورة', saveChanges: 'حفظ التغييرات' },
    en: { title: 'Invoicing System', createTab: 'Create Invoice', listTab: 'Invoice History', selectCustomer: 'Customer Info', selectPackages: 'Select Packages', multiplePackagesHint: 'You can add multiple packages', participants: 'Participants (Optional)', participantsHint: 'Enter names of participants...', invoiceSummary: 'Invoice Summary', noItems: 'No packages selected', total: 'Total', paid: 'Paid', remaining: 'Remaining', createBtn: 'Issue Invoice', customerName: 'Customer Name', customerPhone: 'Phone Number', invoiceNo: 'Invoice No', amount: 'Amount', status: 'Status', date: 'Date', time: 'Time', searchCustomer: 'Search customer...', paid_label: 'Fully Paid', pending: 'Pending', partial: 'Partial Payment', actions: 'Actions', createdBy: 'Manager', print: 'Print Invoice/PDF', deleteConfirm: 'Are you sure you want to delete this invoice?', close: 'Close', studioName: 'Photography Studio', editInvoice: 'Edit Invoice', saveChanges: 'Save Changes' },
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
    const [_isLoading, setIsLoading] = useState(true);
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

    const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [custRes, pkgRes, invRes] = await Promise.all([getCustomers(), getPackages(), getInvoices()]);
            setCustomers(custRes.data);
            setPackages(pkgRes.data);
            setInvoices(invRes.data);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addPkg = (pkg: PricingPackage) => {
        setSelectedPkgs(prev => [...prev, { tempId: Date.now() + Math.random(), id: pkg.id, type: pkg.type, price: pkg.price }]);
    };

    const removePkg = (tempId: number) => {
        setSelectedPkgs(prev => prev.filter(p => p.tempId !== tempId));
    };

    const totalAmount = selectedPkgs.reduce((sum, item) => sum + item.price, 0);
    const remainingAmount = Math.max(0, totalAmount - (parseFloat(paidAmount) || 0));

    const generateAndSendPDF = async (inv: Invoice, itemsParam: InvoiceItem[]) => {
        try {
            console.log('🔵 generateAndSendPDF started for invoice:', inv.invoice_no);
            const statusRes = await getWhatsAppStatus();
            if (!statusRes.data.connected) {
                showToastMessage(lang === 'ar' ? 'جاري محاولة الإرسال... الواتساب غير متصل حالياً' : 'Attempting send... WhatsApp is not connected', 'error');
                return;
            }

            let items = itemsParam;
            if (items.length === 0) {
                const detailsRes = await getInvoiceDetails(inv.id);
                items = detailsRes.data;
            }

            const docDefinition: any = {
                pageSize: 'A4',
                margins: [10, 10, 10, 10],
                content: [
                    // Header
                    { text: settings.studioName || t.studioName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
                    settings.address && { text: settings.address, fontSize: 9, alignment: 'center', color: '#888', margin: [0, 0, 0, 2] },
                    settings.phone && { text: settings.phone, fontSize: 9, alignment: 'center', color: '#888', margin: [0, 0, 0, 10] },
                    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#ddd' }], margin: [0, 0, 0, 10] },

                    // Invoice Info
                    { text: t.invoiceNo, fontSize: 9, bold: true, alignment: 'center', color: '#888', margin: [0, 0, 0, 3] },
                    { text: inv.invoice_no, fontSize: 20, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },

                    {
                        columns: [
                            [{ text: t.date, fontSize: 8, bold: true, color: '#888' }, { text: new Date(inv.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'), fontSize: 11, bold: true, margin: [0, 2, 0, 0] }],
                            [{ text: t.time, fontSize: 8, bold: true, color: '#888', alignment: 'right' }, { text: new Date(inv.created_at).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }), fontSize: 11, bold: true, alignment: 'right', margin: [0, 2, 0, 0] }]
                        ], margin: [0, 0, 0, 10]
                    },
                    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#ddd' }], margin: [0, 0, 0, 10] },

                    // Customer Info
                    {
                        columns: [
                            [{ text: t.customerName, fontSize: 8, bold: true, color: '#888' }, { text: inv.customer_name, fontSize: 11, bold: true, margin: [0, 2, 0, 0] }],
                            [{ text: t.customerPhone, fontSize: 8, bold: true, color: '#888', alignment: 'right' }, { text: inv.customer_phone, fontSize: 11, bold: true, alignment: 'right', margin: [0, 2, 0, 0] }]
                        ], margin: [0, 0, 0, 10]
                    },
                    inv.participants && { text: `${t.participants}:\n${inv.participants}`, fontSize: 10, margin: [10, 5, 10, 10], background: '#f5f5f5', color: '#333' },

                    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 2, lineColor: '#000' }], margin: [0, 0, 0, 10] },

                    // Items Table
                    {
                        table: {
                            headerRows: 1,
                            widths: [30, 'auto', 50, 60],
                            body: [
                                [
                                    { text: '#', fontSize: 8, bold: true, color: '#888', alignment: 'center' },
                                    { text: t.selectPackages, fontSize: 8, bold: true, color: '#888' },
                                    { text: 'Qty', fontSize: 8, bold: true, color: '#888', alignment: 'center' },
                                    { text: t.amount, fontSize: 8, bold: true, color: '#888', alignment: 'right' }
                                ],
                                ...items.map((item, i) => [
                                    { text: (i + 1).toString(), fontSize: 9, alignment: 'center', color: '#999' },
                                    { text: item.package_name || '---', fontSize: 10, bold: true },
                                    { text: '1', fontSize: 9, alignment: 'center' },
                                    { text: `${item.item_price || 0} ${settings.currency}`, fontSize: 10, bold: true, alignment: 'right' }
                                ])
                            ]
                        },
                        margin: [0, 0, 0, 10]
                    },

                    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 2, lineColor: '#000' }], margin: [0, 0, 0, 10] },

                    // Totals
                    {
                        columns: [
                            [{ text: t.total, fontSize: 9, bold: true, color: '#666' }, { text: `${t.paid}: ${inv.paid_amount} ${settings.currency}`, fontSize: 9, bold: true, color: '#28a745', margin: [0, 3, 0, 0] }],
                            [{ text: `${t.remaining}: ${inv.remaining_amount} ${settings.currency}`, fontSize: 11, bold: true, alignment: 'right', color: inv.remaining_amount > 0 ? '#dc3545' : '#28a745' }, { text: `${inv.total_amount} ${settings.currency}`, fontSize: 13, bold: true, alignment: 'right', margin: [0, 3, 0, 0] }]
                        ], margin: [0, 0, 0, 10]
                    },

                    // Footer
                    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#ddd' }], margin: [0, 0, 0, 10] },
                    { text: `${lang === 'ar' ? 'اسم المسؤول' : 'Manager'}: ${inv.created_by || currentUserName}`, fontSize: 9, color: '#999', alignment: 'center', margin: [0, 0, 0, 5] },
                    { text: lang === 'ar' ? 'شكراً لتعاملكم معنا ✦' : 'Thank you for choosing us ✦', fontSize: 12, bold: true, alignment: 'center' },
                    { text: (settings.studioName || t.studioName).toUpperCase(), fontSize: 8, bold: true, alignment: 'center', color: '#999' }
                ]
            };

            const pm = getPdfMake();
            console.log('✅ pdfMake ready, vfs status:', !!pm.vfs);

            const pdfDoc = pm.createPdf(docDefinition);
            console.log('✅ pdfDoc created, generating base64...');

            const base64Data = await new Promise<string>((resolve, reject) => {
                try {
                    const timeout = setTimeout(() => reject(new Error('PDF Timeout after 45s')), 45000);
                    (pdfDoc as any).getBase64((data: string) => {
                        clearTimeout(timeout);
                        if (!data) return reject(new Error('Empty PDF data received'));
                        console.log('✅ PDF Base64 generated, length:', data.length);
                        resolve(data);
                    });
                } catch (err) {
                    reject(err);
                }
            });

            console.log('📤 Sending PDF via WhatsApp to:', inv.customer_phone);
            await sendWhatsAppPDF({
                phone: inv.customer_phone,
                pdfBase64: base64Data,
                fileName: `${inv.invoice_no}.pdf`,
                caption: `${settings.studioName || t.studioName} - ${t.invoiceNo}: ${inv.invoice_no}`
            });

            console.log('✅ WhatsApp PDF sent successfully');
            showToastMessage(lang === 'ar' ? '✓ تم إرسال الفاتورة PDF عبر الواتساب' : '✓ Invoice PDF sent via WhatsApp', 'success');
        } catch (err: any) {
            console.error('❌ PDF Error:', err);
            showToastMessage(lang === 'ar' ? 'فشل إرسال الفاتورة PDF' : 'Failed to send invoice PDF', 'error');
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
            if (newInv) {
                await generateAndSendPDF(newInv, []);
            }
            setSelectedCustomerId('');
            setSelectedPkgs([]);
            setParticipants('');
            setPaidAmount('0');
            setActiveTab('list');
        } catch (err) {
            console.error('Create error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrint = async (id: number, current?: Invoice[]) => { try { const inv = (current || invoices).find(i => i.id === id); if (!inv) return; const res = await getInvoiceDetails(id); setPrintingInvoice(inv); setPrintingItems(res.data); setShowPrintModal(true); } catch (err) { console.error(err); } };
    const handleQuickAdd = async () => { if (!newCustName || !newCustPhone) return; setIsAddingCust(true); try { const cleanPhone = newCustPhone.replace(/[^0-9]/g, ''); const phoneWithCode = cleanPhone.startsWith(settings.countryCode) ? cleanPhone : settings.countryCode + cleanPhone; const res = await addCustomer({ name: newCustName, phone: phoneWithCode }); await fetchData(); setSelectedCustomerId(res.data.id); setShowQuickAdd(false); setNewCustName(''); setNewCustPhone(''); } catch (err) { console.error(err); } finally { setIsAddingCust(false); } };
    const handleDeleteInvoice = async (id: number) => { if (!window.confirm(t.deleteConfirm)) return; try { await deleteInvoice(id); await fetchData(); } catch (err: any) { console.error(err); alert("Delete failed: " + (err.response?.data?.message || err.message)); } };
    const handleEditInvoice = (inv: Invoice) => {
        setEditingInvoice(inv);
        setEditPaidAmount(inv.paid_amount.toString());
        setEditParticipants(inv.participants || '');
    };
    const handleUpdateInvoice = async () => {
        if (!editingInvoice) return;
        try {
            await updateInvoice(editingInvoice.id, {
                paid_amount: parseFloat(editPaidAmount) || 0,
                total_amount: editingInvoice.total_amount,
                participants: editParticipants
            });
            setEditingInvoice(null);
            await fetchData();
            showToastMessage(lang === 'ar' ? 'تم تحديث الفاتورة بنجاح' : 'Invoice updated successfully');
        } catch (err: any) {
            console.error('Update error:', err);
            showToastMessage(lang === 'ar' ? 'فشل التحديث' : 'Update failed', 'error');
        }
    };
    const handleSendWhatsAppText = async (inv: Invoice) => {
        try {
            const detailsRes = await getInvoiceDetails(inv.id);
            const items = detailsRes.data;
            const itemsText = items.map((it: any) => `- ${it.package_name}: ${it.item_price}`).join('\n');
            const text = `*${settings.studioName || t.studioName}*\n*${t.invoiceNo}: ${inv.invoice_no}*\n*${t.customerName}:* ${inv.customer_name}\n*${t.total}:* ${inv.total_amount} ${settings.currency}\n*${t.paid}:* ${inv.paid_amount}\n*${t.remaining}:* ${inv.remaining_amount}\n${itemsText}`;
            await sendWhatsAppMessage({ phone: inv.customer_phone, message: text });
            showToastMessage(lang === 'ar' ? '✓ تم إرسال النص عبر الواتساب' : '✓ Message sent via WhatsApp');
        } catch (err) {
            showToastMessage(lang === 'ar' ? 'فشل إرسال الرسالة' : 'Failed to send message', 'error');
        }
    };
    const executePrint = () => window.print();
    const handleDownloadPDF = async () => {
        if (!printingInvoice) return;
        try {
            const detailsRes = await getInvoiceDetails(printingInvoice.id);
            const items = detailsRes.data;

            const docDefinition: any = {
                pageSize: 'A4',
                margins: [10, 10, 10, 10],
                content: [
                    { text: settings.studioName || t.studioName, fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
                    { text: printingInvoice.invoice_no, fontSize: 20, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
                    { columns: [[{ text: t.customerName, fontSize: 8, bold: true }, { text: printingInvoice.customer_name, fontSize: 11, bold: true }]] },
                    { margin: [0, 10, 0, 10], table: { widths: [30, 'auto', 60], body: [['#', t.selectPackages, t.amount], ...items.map((item: any, i: number) => [(i + 1).toString(), item.package_name || '---', `${item.item_price || 0} ${settings.currency}`])] } },
                    { columns: [[{ text: t.total, fontSize: 9, bold: true }, { text: `${printingInvoice.total_amount} ${settings.currency}`, fontSize: 13, bold: true }]] }
                ]
            };

            const pm = getPdfMake();
            const pdfDoc = pm.createPdf(docDefinition);
            pdfDoc.download(`${printingInvoice.invoice_no}.pdf`);
        } catch (err) {
            console.error('PDF download error:', err);
            showToastMessage(lang === 'ar' ? 'فشل تحميل الفاتورة PDF' : 'Failed to download PDF', 'error');
        }
    };
    const getStatusLabel = (s: string) => lang === 'ar' ? (s === 'paid' ? t.paid_label : s === 'partial' ? t.partial : t.pending) : s.charAt(0).toUpperCase() + s.slice(1);
    const statusClass = (s: string) => s === 'paid' ? 'bg-success/10 text-success' : s === 'partial' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500';
    const currentUserName = user?.name || 'Admin';
    const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 transition-all font-cairo";

    return (
        <div className="animate-fade-in">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5"><FileText size={22} className="text-primary" />{t.title}</h2>
                    <div className="flex gap-0.5 bg-muted p-0.5 rounded-lg mt-3 w-fit">
                        <button onClick={() => setActiveTab('create')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'create' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t.createTab}</button>
                        <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t.listTab}</button>
                    </div>
                </div>
            </header>

            {activeTab === 'create' ? (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] gap-4 sm:gap-5 mt-4 sm:mt-6">
                    <div className="space-y-4">
                        <section className="bg-card border border-border rounded-xl p-5">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4"><UserIcon size={18} />{t.selectCustomer}</h3>
                            <div className="flex gap-2 items-center">
                                <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(Number(e.target.value))} className={`${inputClass} flex-1`}>
                                    <option value="">{t.searchCustomer}</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                                </select>
                                <button onClick={() => setShowQuickAdd(true)} className="shrink-0 w-11 h-11 rounded-lg border border-border bg-card text-primary flex items-center justify-center hover:bg-primary/5 hover:border-primary/50 transition-all"><Plus size={20} /></button>
                            </div>
                        </section>

                        <section className="bg-card border border-border rounded-xl p-5">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4"><Package size={18} />{t.selectPackages}<span className="ms-auto text-xs text-muted-foreground font-normal">{t.multiplePackagesHint}</span></h3>
                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {packages.map(pkg => <div key={pkg.id} onClick={() => addPkg(pkg)} className="bg-muted border-2 border-transparent rounded-lg p-3.5 cursor-pointer hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-sm transition-all relative"><span className="text-sm font-semibold text-foreground">{pkg.type}</span><Plus size={16} className="absolute top-2.5 end-2.5 text-muted-foreground opacity-50" /></div>)}
                            </div>
                        </section>

                        <section className="bg-card border border-border rounded-xl p-5">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4"><CheckCircle size={18} />{t.participants}</h3>
                            <textarea value={participants} onChange={e => setParticipants(e.target.value)} className={`${inputClass} min-h-[100px] resize-y`} placeholder={t.participantsHint} />
                        </section>
                    </div>

                    <aside className="space-y-4">
                        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-5"><Wallet size={18} />{t.invoiceSummary}</h3>
                            <div className="space-y-2.5 mb-6 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                {selectedPkgs.length === 0 ? <p className="text-center py-8 text-muted-foreground text-sm italic">{t.noItems}</p> : selectedPkgs.map(item => <div key={item.tempId} className="flex justify-between items-center py-2 border-b border-border border-dashed group"><div className="flex flex-col"><span className="text-sm font-bold text-foreground">{item.type}</span><span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{item.price} {settings.currency}</span></div><button onClick={() => removePkg(item.tempId)} className="w-7 h-7 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"><X size={14} /></button></div>)}
                            </div>
                            <div className="bg-muted/50 rounded-xl p-4 space-y-4 border border-border/50">
                                <div className="flex justify-between items-center"><span className="text-sm font-bold text-muted-foreground">{t.total}</span><span className="text-xl font-black text-primary font-mono">{totalAmount} {settings.currency}</span></div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">{t.paid}</label>
                                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{settings.currency}</span><input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-lg font-black font-mono focus:border-primary/50 outline-none transition-all" /></div>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-border border-dashed"><span className="text-xs font-bold text-muted-foreground">{t.remaining}</span><span className={`text-md font-black font-mono ${remainingAmount > 0 ? 'text-destructive' : 'text-green-500'}`}>{remainingAmount} {settings.currency}</span></div>
                            </div>
                            <button onClick={handleCreateInvoice} disabled={!selectedCustomerId || selectedPkgs.length === 0 || isSaving} className="w-full mt-6 bg-primary text-primary-foreground font-black py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2">{isSaving ? <Loader className="animate-spin" size={20} /> : <><CheckCircle size={20} />{t.createBtn}</>}</button>
                        </section>
                    </aside>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead><tr className="bg-muted/50 border-b border-border"><th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-widest">{t.invoiceNo}</th><th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-widest">{t.customerName}</th><th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-widest">{t.amount}</th><th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-widest">{t.remaining}</th><th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-widest">{t.status}</th><th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-widest">{t.createdBy}</th><th className="px-5 py-4 text-start text-[11px] font-black uppercase text-muted-foreground tracking-widest">{t.actions}</th></tr></thead>
                        <tbody className="divide-y divide-border">
                            {invoices.length === 0 ? <tr><td colSpan={7} className="px-5 py-20 text-center text-muted-foreground italic">{lang === 'ar' ? 'لا توجد فواتير حالياً' : 'No invoices found'}</td></tr> : invoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-5 py-4"><div className="flex flex-col"><span className="text-sm font-black text-foreground">{inv.invoice_no}</span><span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5 mt-1"><Calendar size={10} />{new Date(inv.created_at).toLocaleDateString()}</span></div></td>
                                    <td className="px-5 py-4"><div className="flex flex-col"><span className="text-sm font-bold text-foreground">{inv.customer_name}</span><span className="text-[10px] text-muted-foreground font-mono mt-0.5">{inv.customer_phone}</span></div></td>
                                    <td className="px-5 py-4 font-black text-sm font-mono text-foreground">{inv.total_amount} {settings.currency}</td>
                                    <td className={`px-5 py-4 font-black text-sm font-mono ${inv.remaining_amount > 0 ? 'text-destructive' : 'text-green-500'}`}>{inv.remaining_amount} {settings.currency}</td>
                                    <td className="px-5 py-4"><span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${statusClass(inv.status)}`}>{getStatusLabel(inv.status)}</span></td>
                                    <td className="px-5 py-4 text-sm text-muted-foreground font-semibold">{inv.created_by || currentUserName}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex gap-2.5">
                                            <div className="flex flex-col gap-1.5">
                                                <button onClick={() => generateAndSendPDF(inv, [])} className="px-3 py-1.5 rounded-lg border border-green-500/30 text-green-600 text-[10px] font-black hover:bg-green-500/10 flex items-center gap-1.5 transition-all"><MessageCircle size={12} /> PDF</button>
                                                <button onClick={() => handleSendWhatsAppText(inv)} className="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-600 text-[10px] font-black hover:bg-blue-500/10 flex items-center gap-1.5 transition-all"><MessageCircle size={12} /> {lang === 'ar' ? 'نص' : 'Text'}</button>
                                            </div>
                                            <button onClick={() => handlePrint(inv.id)} className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shadow-sm" title={t.print}><Printer size={18} /></button>
                                            <button onClick={() => handleEditInvoice(inv)} className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all shadow-sm"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDeleteInvoice(inv.id)} className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all shadow-sm"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {showPrintModal && printingInvoice && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4">
                        <motion.div className="bg-white text-black rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden print-modal-scale" initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
                            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center no-print"><h3 className="font-bold text-gray-800">{t.print}</h3><button onClick={() => setShowPrintModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
                            <div className="p-8 print:p-0" id="printable-area">
                                <div className="text-center mb-6">
                                    <div className="inline-flex w-14 h-14 bg-black text-white rounded-2xl items-center justify-center text-2xl font-black mb-3 italic">P</div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">{settings.studioName || t.studioName}</h2>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{settings.phone}</p>
                                </div>
                                <div className="border-t border-dashed border-gray-300 my-4" />
                                <div className="flex justify-between items-center text-[11px] font-bold"><span className="text-gray-400 uppercase tracking-wider">{t.invoiceNo}</span><span className="font-mono text-sm">{printingInvoice.invoice_no}</span></div>
                                <div className="flex justify-between items-center text-[11px] font-bold mt-2"><span className="text-gray-400 uppercase tracking-wider">{t.date}</span><span>{new Date(printingInvoice.created_at).toLocaleDateString()}</span></div>
                                <div className="border-t border-gray-200 my-4" />
                                <div className="space-y-1 text-[11px]"><div className="flex justify-between"><span className="text-gray-500">{t.customerName}</span><span className="font-bold">{printingInvoice.customer_name}</span></div><div className="flex justify-between"><span className="text-gray-500">{t.customerPhone}</span><span className="font-bold" dir="ltr">{printingInvoice.customer_phone}</span></div></div>
                                {printingInvoice.participants && <div className="mt-3 p-2 bg-gray-50 rounded-lg border-r-4 border-black"><span className="text-[9px] font-black uppercase text-gray-400 block mb-1">{t.participants}</span><p className="text-[10px] font-bold">{printingInvoice.participants}</p></div>}
                                <table className="w-full mt-6 mb-4">
                                    <thead className="border-b-2 border-black"><tr><th className="text-[10px] font-black text-start py-2 uppercase">{t.selectPackages}</th><th className="text-[10px] font-black text-end py-2 uppercase">{t.amount}</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100">{printingItems.map((item, i) => <tr key={i}><td className="py-2.5 text-[11px] font-bold">{item.package_name}</td><td className="py-2.5 text-end text-[11px] font-black">{item.item_price} {settings.currency}</td></tr>)}</tbody>
                                </table>
                                <div className="bg-black text-white p-4 rounded-2xl space-y-2">
                                    <div className="flex justify-between text-xs font-bold"><span className="opacity-60">{t.total}</span><span>{printingInvoice.total_amount} {settings.currency}</span></div>
                                    <div className="flex justify-between text-xs font-bold text-green-400"><span className="opacity-60">{t.paid}</span><span>{printingInvoice.paid_amount} {settings.currency}</span></div>
                                    <div className="flex justify-between text-sm font-black pt-2 border-t border-white/20"><span>{t.remaining}</span><span>{printingInvoice.remaining_amount} {settings.currency}</span></div>
                                </div>
                                <div className="mt-6 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>{lang === 'ar' ? 'المسؤول:' : 'Manager:'}</span><span>{printingInvoice.created_by || currentUserName}</span></div>
                                <div className="text-center mt-8 pb-4 italic font-black text-gray-800">{lang === 'ar' ? 'شكراً لزيارتكم!' : 'Thanks for visiting!'}</div>
                            </div>
                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 no-print">
                                <button onClick={() => setShowPrintModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600">Close</button>
                                <button onClick={handleDownloadPDF} className="p-3 bg-green-600 text-white rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 transition-all"><Download size={20} /></button>
                                <button onClick={executePrint} className="flex-[2] py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-gray-200 hover:opacity-90 active:scale-95 transition-all"><Printer size={18} /> {t.print}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Add Customer Modal */}
            <AnimatePresence>{showQuickAdd && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100] flex items-center justify-center p-5" onClick={() => setShowQuickAdd(false)}>
                    <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-6 py-4 border-b border-border"><h3 className="font-bold text-foreground">{t.selectCustomer}</h3><button onClick={() => setShowQuickAdd(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button></div>
                        <div className="p-6 space-y-4"><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t.customerName}</label><input value={newCustName} onChange={e => setNewCustName(e.target.value)} className={inputClass} /></div><div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t.customerPhone}</label><input value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} className={inputClass} /></div></div>
                        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30"><button onClick={() => setShowQuickAdd(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">{t.close}</button><button onClick={handleQuickAdd} disabled={!newCustName || !newCustPhone || isAddingCust} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">{isAddingCust ? <Loader className="animate-spin" size={16} /> : <CheckCircle size={16} />}{lang === 'ar' ? 'إضافة' : 'Add'}</button></div>
                    </motion.div>
                </div>
            )}</AnimatePresence>

            {/* Edit Invoice Modal */}
            <AnimatePresence>{editingInvoice && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100] flex items-center justify-center p-5" onClick={() => setEditingInvoice(null)}>
                    <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-6 py-4 border-b border-border"><h3 className="font-bold text-foreground">{t.editInvoice}: {editingInvoice.invoice_no}</h3><button onClick={() => setEditingInvoice(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button></div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t.paid}</label>
                                <div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50">
                                    <DollarSign size={16} className="text-muted-foreground" />
                                    <input type="number" value={editPaidAmount} onChange={e => setEditPaidAmount(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm" />
                                </div>
                                <div className="flex justify-between mt-2 px-1">
                                    <small className="text-[10px] text-muted-foreground">{t.total}: {editingInvoice.total_amount}</small>
                                    <small className={`text-[10px] font-bold ${editingInvoice.total_amount - parseFloat(editPaidAmount) > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                        {t.remaining}: {Math.max(0, editingInvoice.total_amount - (parseFloat(editPaidAmount) || 0))}
                                    </small>
                                </div>
                            </div>
                            <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t.participants}</label><textarea value={editParticipants} onChange={e => setEditParticipants(e.target.value)} className={`${inputClass} min-h-[70px] resize-y`} placeholder={t.participantsHint} /></div>
                        </div>
                        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30"><button onClick={() => setEditingInvoice(null)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">{t.close}</button><button onClick={handleUpdateInvoice} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2"><CheckCircle size={16} />{t.saveChanges}</button></div>
                    </motion.div>
                </div>
            )}</AnimatePresence>

            {/* Toast Notification */}
            {showToast && (
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl text-white font-black text-sm shadow-2xl z-[5000] flex items-center gap-2.5 ${toastType === 'success' ? 'bg-green-600' : 'bg-destructive shadow-red-500/20'}`}>
                    {toastType === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
                    {toastMessage}
                </motion.div>
            )}
        </div>
    );
};

export default InvoicesPage;
