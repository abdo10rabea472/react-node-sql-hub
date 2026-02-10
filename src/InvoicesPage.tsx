import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, User as UserIcon, Package, CheckCircle, Printer, Loader, DollarSign, Wallet, X, Clock, Calendar, Plus, Trash2, Edit2, MessageCircle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getInvoices, createInvoice, getCustomers, getPackages, getInvoiceDetails, addCustomer, deleteInvoice, updateInvoice, sendWhatsAppPDF, getWhatsAppStatus } from './api';
import { useSettings } from './SettingsContext';

interface Customer { id: number; name: string; phone: string; }
interface PricingPackage { id: number; type: string; price: number; }
interface Invoice { id: number; invoice_no: string; customer_id: number; customer_name: string; customer_phone: string; total_amount: number; paid_amount: number; remaining_amount: number; created_by: string; participants: string; status: string; created_at: string; }
interface InvoiceItem { package_name: string; item_price: number; }

const translations = {
  ar: { title: 'الفواتير وإدارة المبيعات', createTab: 'إنشاء فاتورة جديدة', listTab: 'سجل الفواتير', selectCustomer: 'بيانات العميل', selectPackages: 'اختر الباقة', invoiceSummary: 'ملخص الفاتورة', noItems: 'لم يتم اختيار باقات بعد', total: 'الإجمالي', paid: 'المدفوع', remaining: 'الباقي', createBtn: 'إصدار الفاتورة وحفظها', customerName: 'اسم العميل', customerPhone: 'رقم الهاتف', invoiceNo: 'رقم الفاتورة', amount: 'المجموع', status: 'الحالة', date: 'التاريخ', time: 'الوقت', searchCustomer: 'ابحث عن عميل...', multiplePackagesHint: 'يمكنك إضافة الباقة أكثر من مرة', pending: 'معلق', paid_label: 'مدفوع بالكامل', partial: 'مدفوع جزئياً', actions: 'إجراءات', createdBy: 'المسؤول', print: 'طباعة الفاتورة', close: 'إغلاق', studioName: 'استوديو التصوير', participants: 'المشاركين في الجلسة', participantsHint: 'ادخل الأسماء هنا...', deleteConfirm: 'هل أنت متأكد من حذف هذه الفاتورة نهائياً؟', editInvoice: 'تعديل بيانات الفاتورة', saveChanges: 'حفظ التغييرات الآن' },
  en: { title: 'Invoices & Sales', createTab: 'Create New Invoice', listTab: 'Invoice History', selectCustomer: 'Customer Info', selectPackages: 'Select Package', invoiceSummary: 'Invoice Summary', noItems: 'No packages selected', total: 'Total', paid: 'Paid', remaining: 'Remaining', createBtn: 'Issue & Save Invoice', customerName: 'Customer Name', customerPhone: 'Phone Number', invoiceNo: 'Invoice No', amount: 'Total', status: 'Status', date: 'Date', time: 'Time', searchCustomer: 'Search customer...', multiplePackagesHint: 'You can add packages multiple times', pending: 'Pending', paid_label: 'Fully Paid', partial: 'Partial Payment', actions: 'Actions', createdBy: 'Manager', print: 'Print Invoice', close: 'Close', studioName: 'Photography Studio', participants: 'Session Participants', participantsHint: 'Enter names here...', deleteConfirm: 'Are you sure you want to delete this invoice permanently?', editInvoice: 'Edit Invoice Details', saveChanges: 'Save Changes Now' },
};

const InvoicesPage: React.FC<{ user?: { name: string } }> = ({ user }) => {
  const { settings } = useSettings();
  const lang = settings.lang; const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedPackages, setSelectedPackages] = useState<PricingPackage[]>([]);
  const [participants, setParticipants] = useState('');
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchData = async () => { setIsLoading(true); try { const [c, p, i] = await Promise.all([getCustomers(), getPackages(), getInvoices()]); setCustomers(c.data); setPackages(p.data); setInvoices(i.data); } catch (err) { console.error(err); } finally { setIsLoading(false); } };
  useEffect(() => { fetchData(); }, []);

  const addPkg = (pkg: PricingPackage) => setSelectedPackages(prev => [...prev, { ...pkg, tempId: Date.now() + Math.random() } as any]);
  const removePkg = (tempId: number) => setSelectedPackages(prev => (prev as any).filter((p: any) => p.tempId !== tempId));
  const totalAmount = selectedPackages.reduce((sum, pkg) => sum + Number(pkg.price), 0);
  const remainingAmount = Math.max(0, totalAmount - (parseFloat(paidAmount) || 0));

  const generateAndSendPDF = async (inv: Invoice, items: InvoiceItem[]) => {
    try {
      const statusRes = await getWhatsAppStatus();
      if (!statusRes.data.connected) { alert(lang === 'ar' ? 'الواتساب غير متصل! اذهب للإعدادات لتفعيل الجلسة.' : 'WhatsApp not connected! Go to Settings to start session.'); return; }
      // Open print modal to render invoice
      setPrintingInvoice(inv); setPrintingItems(items); setShowPrintModal(true);
      // Wait for DOM render
      await new Promise(r => setTimeout(r, 500));
      const el = document.getElementById('invoice-print');
      if (!el) { console.error('Invoice print element not found'); return; }
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, canvas.height * 80 / canvas.width] });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 80 / canvas.width);
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      await sendWhatsAppPDF({ phone: inv.customer_phone, pdfBase64, fileName: `${inv.invoice_no}.pdf`, caption: `${settings.studioName || t.studioName} - ${t.invoiceNo}: ${inv.invoice_no}` });
      alert(lang === 'ar' ? 'تم إرسال الفاتورة PDF عبر الواتساب ✓' : 'Invoice PDF sent via WhatsApp ✓');
    } catch (err: any) { console.error('WhatsApp PDF send error:', err); alert(err.response?.data?.message || (lang === 'ar' ? 'فشل إرسال الفاتورة' : 'Failed to send invoice')); }
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomerId || selectedPackages.length === 0) return;
    setIsSaving(true);
    try {
      const res = await createInvoice({ customer_id: Number(selectedCustomerId), items: selectedPackages, total_amount: totalAmount, paid_amount: parseFloat(paidAmount) || 0, created_by: user?.name || 'Admin', participants });
      const invRes = await getInvoices(); setInvoices(invRes.data);
      const newInv = invRes.data.find((i: Invoice) => i.id === res.data?.id);
      if (newInv) {
        const detailsRes = await getInvoiceDetails(newInv.id);
        await generateAndSendPDF(newInv, detailsRes.data);
      }
      setSelectedCustomerId(''); setSelectedPackages([]); setPaidAmount('0'); setParticipants(''); setActiveTab('list');
    } catch (err) { console.error(err); } finally { setIsSaving(false); }
  };

  const handlePrint = async (id: number, current?: Invoice[]) => { try { const inv = (current || invoices).find(i => i.id === id); if (!inv) return; const res = await getInvoiceDetails(id); setPrintingInvoice(inv); setPrintingItems(res.data); setShowPrintModal(true); } catch (err) { console.error(err); } };
  const handleQuickAdd = async () => { if (!newCustName || !newCustPhone) return; setIsAddingCust(true); try { const res = await addCustomer({ name: newCustName, phone: newCustPhone }); await fetchData(); setSelectedCustomerId(res.data.id); setShowQuickAdd(false); setNewCustName(''); setNewCustPhone(''); } catch (err) { console.error(err); } finally { setIsAddingCust(false); } };
  const handleDeleteInvoice = async (id: number) => { if (!window.confirm(t.deleteConfirm)) return; try { await deleteInvoice(id); await fetchData(); } catch (err: any) { console.error(err); alert("Delete failed: " + (err.response?.data?.message || err.message)); } };
  const handleEditInvoice = (inv: Invoice) => { setEditingInvoice(inv); setEditPaidAmount(inv.paid_amount.toString()); setEditParticipants(inv.participants || ''); };
  const handleUpdateInvoice = async () => { if (!editingInvoice) return; try { await updateInvoice(editingInvoice.id, { paid_amount: parseFloat(editPaidAmount) || 0, total_amount: editingInvoice.total_amount, participants: editParticipants }); setEditingInvoice(null); await fetchData(); } catch (err: any) { console.error(err); alert("Update failed: " + (err.response?.data?.message || err.message)); } };
  const executePrint = () => window.print();
  const handleDownloadPDF = async () => {
    const el = document.getElementById('invoice-print');
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, canvas.height * 80 / canvas.width] });
      pdf.addImage(imgData, 'PNG', 0, 0, 80, canvas.height * 80 / canvas.width);
      pdf.save(`${printingInvoice?.invoice_no || 'invoice'}.pdf`);
    } catch (err) { console.error('PDF generation failed:', err); }
  };
  const handleSendWhatsApp = async (inv: Invoice) => {
    try {
      const res = await getInvoiceDetails(inv.id);
      await generateAndSendPDF(inv, res.data);
    } catch (err: any) { console.error(err); alert(lang === 'ar' ? 'فشل إرسال الفاتورة' : 'Failed to send invoice'); }
  };
  const getStatusLabel = (s: string) => lang === 'ar' ? (s === 'paid' ? t.paid_label : s === 'partial' ? t.partial : t.pending) : s.charAt(0).toUpperCase() + s.slice(1);
  const statusClass = (s: string) => s === 'paid' ? 'bg-success/10 text-success' : s === 'partial' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500';
  const currentUserName = user?.name || 'Admin';
  const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-lg text-foreground text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-cairo";

  return (
    <div className="animate-fade-in">
      <header className="mb-6">
        <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5"><FileText size={22} />{t.title}</h2>
        <div className="flex gap-0.5 bg-muted p-0.5 rounded-lg mt-3 w-fit">
          <button onClick={() => setActiveTab('create')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'create' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>{t.createTab}</button>
          <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>{t.listTab}</button>
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
              {selectedCustomerId && <div className="flex gap-2 mt-3 flex-wrap">{[{ icon: UserIcon, text: customers.find(c => c.id === selectedCustomerId)?.name }, { icon: Wallet, text: customers.find(c => c.id === selectedCustomerId)?.phone }].map((b, i) => <span key={i} className="inline-flex items-center gap-1.5 bg-primary/5 text-primary px-3 py-1.5 rounded-full text-xs font-semibold"><b.icon size={12} />{b.text}</span>)}</div>}
            </section>

            <section className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4"><Package size={18} />{t.selectPackages}<span className="ms-auto text-xs text-muted-foreground font-normal">{t.multiplePackagesHint}</span></h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
                {packages.map(pkg => <div key={pkg.id} onClick={() => addPkg(pkg)} className="bg-muted border-2 border-transparent rounded-lg p-3.5 cursor-pointer hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-sm transition-all relative"><span className="text-sm font-semibold text-foreground">{pkg.type}</span><Plus size={16} className="absolute top-2.5 end-2.5 text-muted-foreground opacity-50" /></div>)}
              </div>
            </section>

            <section className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4"><UserIcon size={18} />{t.participants}</h3>
              <textarea placeholder={t.participantsHint} value={participants} onChange={e => setParticipants(e.target.value)} className={`${inputClass} min-h-[70px] resize-y`} />
            </section>
          </div>

          <aside className="bg-card border border-border rounded-xl p-5 sticky top-24 h-fit">
            <h3 className="font-bold text-sm text-foreground mb-4">{t.invoiceSummary}</h3>
            <div className="max-h-[200px] overflow-y-auto mb-3">
              {selectedPackages.length === 0 ? <p className="text-center text-muted-foreground text-sm py-5">{t.noItems}</p> :
                selectedPackages.map((p: any) => <div key={p.tempId} className="flex justify-between items-center py-2 border-b border-dashed border-border text-sm"><span>{p.type}</span><div className="flex items-center gap-2"><strong>{p.price} {settings.currency}</strong><button onClick={() => removePkg(p.tempId)} className="w-5 h-5 rounded bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-all"><X size={12} /></button></div></div>)}
            </div>
            <div className="bg-muted rounded-lg p-3.5 mb-4 space-y-2.5">
              <div className="flex justify-between font-extrabold text-lg text-primary border-b border-border pb-2.5">{t.total}<span>{totalAmount} {settings.currency}</span></div>
              <div><label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1.5"><DollarSign size={12} />{t.paid}</label><input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full bg-card border-2 border-border rounded-lg px-3 py-2.5 text-foreground font-extrabold text-lg outline-none focus:border-primary/50 transition-all" /></div>
              <div className={`flex justify-between items-center text-sm ${remainingAmount > 0 ? 'bg-destructive/5 p-2.5 rounded-lg' : ''}`}><span className="flex items-center gap-1.5"><Wallet size={13} />{t.remaining}</span><span className={remainingAmount > 0 ? 'text-destructive font-extrabold' : ''}>{remainingAmount} {settings.currency}</span></div>
            </div>
            <div className="space-y-1.5 mb-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Clock size={12} />{new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US')}</div>
              <div className="flex items-center gap-1.5"><Calendar size={12} />{new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</div>
              <div className="flex items-center gap-1.5"><UserIcon size={12} />{t.createdBy}: {currentUserName}</div>
            </div>
            <button onClick={handleCreateInvoice} disabled={!selectedCustomerId || selectedPackages.length === 0 || isSaving} className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20">
              {isSaving ? <Loader className="animate-spin" size={18} /> : <CheckCircle size={18} />}{t.createBtn}
            </button>
          </aside>
        </div>
      ) : (
        <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-muted/50">{[t.invoiceNo, t.customerName, t.amount, t.paid, t.remaining, t.status, t.createdBy, t.actions].map(h => <th key={h} className="px-4 py-3 text-start text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {invoices.length === 0 ? <tr><td colSpan={8} className="text-center py-16">{isLoading ? <Loader className="animate-spin mx-auto text-primary" /> : <span className="text-muted-foreground">{t.noItems}</span>}</td></tr> :
                  invoices.map(inv => (
                    <tr key={inv.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3"><div className="flex flex-col"><strong className="text-sm">{inv.invoice_no}</strong><small className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</small></div></td>
                      <td className="px-4 py-3"><div className="flex flex-col"><span className="text-sm">{inv.customer_name}</span><small className="text-xs text-muted-foreground" dir="ltr">{inv.customer_phone}</small></div></td>
                      <td className="px-4 py-3 text-sm font-medium">{inv.total_amount} {settings.currency}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-success">{inv.paid_amount}</td>
                      <td className={`px-4 py-3 text-sm font-semibold ${inv.remaining_amount > 0 ? 'text-destructive' : ''}`}>{inv.remaining_amount}</td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${statusClass(inv.status)}`}>{getStatusLabel(inv.status)}</span></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{inv.created_by || currentUserName}</td>
                      <td className="px-4 py-3"><div className="flex gap-1.5">
                        <button onClick={() => handleSendWhatsApp(inv)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-green-600 hover:bg-green-500/10 transition-all" title={lang === 'ar' ? 'إرسال واتساب' : 'Send WhatsApp'}><MessageCircle size={15} /></button>
                        <button onClick={() => handlePrint(inv.id)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title={lang === 'ar' ? 'طباعة / PDF' : 'Print / PDF'}><Printer size={15} /></button>
                        <button onClick={() => handleEditInvoice(inv)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"><Edit2 size={15} /></button>
                        <button onClick={() => handleDeleteInvoice(inv.id)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-destructive hover:bg-destructive/10 transition-all"><Trash2 size={15} /></button>
                      </div></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Modal */}
      <AnimatePresence>
        {showPrintModal && printingInvoice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2100] flex items-center justify-center p-5">
            <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="flex justify-between items-center px-5 py-4 border-b border-border no-print"><h3 className="font-bold text-foreground text-sm">{t.print}</h3><button onClick={() => setShowPrintModal(false)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all"><X size={18} /></button></div>
              <div id="invoice-print" className="p-5 bg-white text-gray-900 font-cairo text-xs leading-relaxed" style={{ width: '80mm', margin: '0 auto' }}>
                <div className="h-1 bg-repeating-[linear-gradient(90deg,#000_0px,#000_8px,transparent_8px,transparent_12px)] mb-3.5 rounded" style={{ background: 'repeating-linear-gradient(90deg, #000 0px, #000 8px, transparent 8px, transparent 12px)' }} />
                <div className="text-center mb-3"><div className="w-12 h-12 bg-black text-white text-xl font-black rounded-full inline-flex items-center justify-center mb-1.5">{(settings.studioName || t.studioName).charAt(0)}</div><h1 className="text-lg font-black m-0">{settings.studioName || t.studioName}</h1>{settings.address && <p className="text-[9px] text-gray-500 m-0">{settings.address}</p>}{settings.phone && <p className="text-[9px] text-gray-500 m-0">{settings.phone}</p>}</div>
                <div className="border-t border-dashed border-gray-300 my-2.5" />
                <div className="text-center my-2"><span className="block text-[9px] text-gray-400 font-bold uppercase tracking-widest">{t.invoiceNo}</span><span className="block text-lg font-black tracking-wide font-mono mt-0.5">{printingInvoice.invoice_no}</span></div>
                <div className="flex justify-between my-1.5 text-[11px]"><div><span className="block text-[8px] text-gray-400 font-bold uppercase">{t.date}</span><span className="font-bold">{new Date(printingInvoice.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span></div><div><span className="block text-[8px] text-gray-400 font-bold uppercase">{t.time}</span><span className="font-bold">{new Date(printingInvoice.created_at).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span></div></div>
                <div className="border-t border-gray-300 my-2.5" />
                <div className="space-y-1.5 my-1.5"><div className="flex justify-between"><span className="text-[9px] text-gray-500 font-bold">{t.customerName}</span><span className="text-xs font-extrabold">{printingInvoice.customer_name}</span></div><div className="flex justify-between"><span className="text-[9px] text-gray-500 font-bold">{t.customerPhone}</span><span className="text-xs font-extrabold" dir="ltr">{printingInvoice.customer_phone}</span></div></div>
                {printingInvoice.participants && <><div className="border-t border-dashed border-gray-300 my-2.5" /><div><span className="text-[9px] text-gray-500 font-bold">{t.participants}</span><p className="text-[11px] font-semibold bg-gray-100 p-1.5 rounded mt-1 border-r-2 border-gray-800">{printingInvoice.participants}</p></div></>}
                <div className="border-t-[3px] border-double border-gray-800 my-2.5" />
                <table className="w-full border-collapse my-1.5"><thead><tr className="border-b-2 border-gray-800"><th className="text-[9px] font-extrabold uppercase text-gray-500 py-1.5 text-center w-6">#</th><th className="text-[9px] font-extrabold uppercase text-gray-500 py-1.5 text-start">{t.selectPackages}</th><th className="text-[9px] font-extrabold uppercase text-gray-500 py-1.5 text-end">{t.amount}</th></tr></thead><tbody>{printingItems.map((item, i) => <tr key={i} className="border-b border-dotted border-gray-200"><td className="py-1.5 text-center text-[10px] text-gray-400 font-bold">{i + 1}</td><td className="py-1.5 text-[11px] font-semibold">{item.package_name}</td><td className="py-1.5 text-end font-extrabold font-mono whitespace-nowrap">{item.item_price} {settings.currency}</td></tr>)}</tbody></table>
                <div className="border-t-[3px] border-double border-gray-800 my-2.5" />
                <div className="space-y-1 my-1.5"><div className="flex justify-between text-xs"><span className="text-gray-500 font-semibold">{t.total}</span><strong className="font-mono">{printingInvoice.total_amount} {settings.currency}</strong></div><div className="flex justify-between text-xs text-green-600"><span className="font-semibold">{t.paid}</span><strong className="font-mono">{printingInvoice.paid_amount} {settings.currency}</strong></div><div className="flex justify-between text-sm bg-gray-900 text-white p-2 rounded-md mt-1"><span className="font-bold">{t.remaining}</span><strong className="font-mono text-base">{printingInvoice.remaining_amount} {settings.currency}</strong></div></div>
                <div className="text-center my-2.5"><span className={`inline-block px-4 py-1 rounded-full text-[11px] font-extrabold ${printingInvoice.status === 'paid' ? 'bg-green-100 text-green-800 border border-green-300' : printingInvoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>{printingInvoice.status === 'paid' ? '✓ ' : printingInvoice.status === 'partial' ? '◐ ' : '○ '}{getStatusLabel(printingInvoice.status)}</span></div>
                <div className="border-t border-dashed border-gray-300 my-2.5" />
                <div className="text-center"><div className="text-[10px] text-gray-500 mb-2"><span>{t.createdBy}:</span> <strong className="text-black">{printingInvoice.created_by || currentUserName}</strong></div><div className="text-sm font-black">{lang === 'ar' ? 'شكراً لاختياركم لنا ✦' : 'Thank you for choosing us ✦'}</div><div className="text-[8px] text-gray-300 uppercase tracking-widest font-bold mt-1">{settings.studioName || t.studioName}</div></div>
                <div className="h-1 mt-3.5 rounded" style={{ background: 'repeating-linear-gradient(90deg, #000 0px, #000 8px, transparent 8px, transparent 12px)' }} />
              </div>
              <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-border no-print">
                <button onClick={() => setShowPrintModal(false)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-all">{t.close}</button>
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all"><Download size={18} />PDF</button>
                <button onClick={executePrint} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all"><Printer size={18} />{t.print}</button>
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
              <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t.paid}</label><div className="flex items-center gap-2.5 bg-muted border border-border rounded-lg px-3.5 h-11 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"><DollarSign size={16} className="text-muted-foreground" /><input type="number" value={editPaidAmount} onChange={e => setEditPaidAmount(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-foreground text-sm" /></div><small className="text-xs text-muted-foreground mt-1 block">{t.total}: {editingInvoice.total_amount} {settings.currency}</small></div>
              <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5">{t.participants}</label><textarea value={editParticipants} onChange={e => setEditParticipants(e.target.value)} className={`${inputClass} min-h-[70px] resize-y`} /></div>
            </div>
            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30"><button onClick={() => setEditingInvoice(null)} className="px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">{t.close}</button><button onClick={handleUpdateInvoice} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2"><CheckCircle size={16} />{t.saveChanges}</button></div>
          </motion.div>
        </div>
      )}</AnimatePresence>
    </div>
  );
};

export default InvoicesPage;
