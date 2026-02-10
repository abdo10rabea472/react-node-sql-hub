import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Heart, CheckCircle, Printer, Loader, X, Plus, Trash2, Edit2, MessageCircle, Download } from 'lucide-react';
import { getWeddingInvoices, createWeddingInvoice, getCustomers, getWeddingAlbums, getWeddingVideos, getWeddingInvoiceDetails, deleteWeddingInvoice, updateWeddingInvoice, sendWhatsAppPDF, sendWhatsAppMessage } from './api';
import { useSettings } from './SettingsContext';
import { generateInvoicePdfBase64 } from './pdfGenerator';

interface Customer { id: number; name: string; phone: string; }
interface Album { id: number; description: string; price: number; photo_count: number; size: string; }
interface Video { id: number; description: string; price: number; type: string; }
interface WeddingInvoice { id: number; invoice_no: string; customer_id: number; customer_name: string; customer_phone: string; total_amount: number; paid_amount: number; remaining_amount: number; created_by: string; wedding_date: string; venue: string; notes: string; status: string; created_at: string; }
interface SelectedItem { tempId: number; id: number; package_name: string; price: number; type: 'album' | 'video'; }

const WeddingInvoicesPage: React.FC<{ user?: { name: string } }> = ({ user }) => {
  const { settings } = useSettings();
  const lang = settings.lang;
  const currentUserName = user?.name || 'Admin';

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [invoices, setInvoices] = useState<WeddingInvoice[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<string>('0');
  const [weddingDate, setWeddingDate] = useState('');
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isLoading, _setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_showQuickAdd, _setShowQuickAdd] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_newCustName, _setNewCustName] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_newCustPhone, _setNewCustPhone] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isAddingCust, _setIsAddingCust] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printingInvoice, setPrintingInvoice] = useState<WeddingInvoice | null>(null);
  const [printingItems, setPrintingItems] = useState<any[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<WeddingInvoice | null>(null);
  const [editPaidAmount, setEditPaidAmount] = useState('0');
  const [editWeddingDate, setEditWeddingDate] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message); setToastType(type); setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const t = {
    title: lang === 'ar' ? 'فواتير المناسبات' : 'Wedding Invoices',
    createTab: lang === 'ar' ? 'فاتورة زفاف جديدة' : 'New Wedding Invoice',
    listTab: lang === 'ar' ? 'سجل فواتير الزفاف' : 'Wedding Invoice List',
    customer: lang === 'ar' ? 'العميل' : 'Customer',
    items: lang === 'ar' ? 'الباقات المختارة' : 'Selected Packages',
    total: lang === 'ar' ? 'الإجمالي' : 'Total',
    paid: lang === 'ar' ? 'المدفوع' : 'Paid',
    remaining: lang === 'ar' ? 'المتبقي' : 'Remaining',
    weddingDate: lang === 'ar' ? 'تاريخ الزفاف' : 'Wedding Date',
    venue: lang === 'ar' ? 'مكان الحفل' : 'Venue',
    notes: lang === 'ar' ? 'ملاحظات إضافية' : 'Extra Notes',
    createBtn: lang === 'ar' ? 'إصدار الفاتورة' : 'Issue Invoice',
    invoiceNo: lang === 'ar' ? 'رقم الفاتورة' : 'Invoice No',
    customerName: lang === 'ar' ? 'العميل' : 'Customer',
    amount: lang === 'ar' ? 'المبلغ' : 'Amount',
    actions: lang === 'ar' ? 'الإجراءات' : 'Actions',
    print: lang === 'ar' ? 'طباعة' : 'Print',
    close: lang === 'ar' ? 'إغلاق' : 'Close',
    deleteConfirm: lang === 'ar' ? 'حذف هذه الفاتورة؟' : 'Delete this invoice?',
    editInvoice: lang === 'ar' ? 'تعديل الفاتورة' : 'Edit Invoice',
    saveChanges: lang === 'ar' ? 'حفظ' : 'Save',
    date: lang === 'ar' ? 'التاريخ' : 'Date',
    time: lang === 'ar' ? 'الوقت' : 'Time',
    customerPhone: lang === 'ar' ? 'الهاتف' : 'Phone',
    album: lang === 'ar' ? 'ألبوم' : 'Album',
    video: lang === 'ar' ? 'فيديو' : 'Video',
    studioName: lang === 'ar' ? 'استوديو التصوير' : 'Studio',
  };

  const fetchData = async () => {
    try {
      const [c, a, v, i] = await Promise.all([getCustomers(), getWeddingAlbums(), getWeddingVideos(), getWeddingInvoices()]);
      setCustomers(c.data);
      // Normalize albums
      setAlbums(a.data.map((alb: any) => ({
        ...alb,
        description: alb.description || 'Album',
        price: parseFloat(alb.price) || 0
      })));
      // Normalize videos
      setVideos(v.data.map((vid: any) => ({
        ...vid,
        description: vid.camera_type ? `${vid.camera_type} (${vid.quality})` : (vid.description || 'Video'),
        price: parseFloat(vid.price || vid.price_per_hour) || 0
      })));
      setInvoices(i.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const addItem = (item: any, type: 'album' | 'video') => {
    setSelectedItems(prev => [...prev, {
      tempId: Date.now() + Math.random(),
      id: item.id,
      package_name: item.description,
      price: parseFloat(item.price) || 0,
      type
    }]);
  };

  const removeItem = (tempId: number) => setSelectedItems(prev => prev.filter(i => i.tempId !== tempId));
  const totalAmount = selectedItems.reduce((acc, it) => acc + it.price, 0);
  const remainingAmountCalc = Math.max(0, totalAmount - (parseFloat(paidAmount) || 0));

  const generateAndSendPDF = async (inv: WeddingInvoice, itemsParam: any[]) => {
    try {
      console.log('🔵 generateAndSendPDF Wedding started:', inv.invoice_no);
      let items = itemsParam;
      if (items.length === 0) {
        const detailsRes = await getWeddingInvoiceDetails(inv.id);
        items = detailsRes.data;
      }

      const base64Data = await generateInvoicePdfBase64({
        studioName: settings.studioName || t.studioName,
        address: settings.address,
        phone: settings.phone,
        invoiceNo: inv.invoice_no,
        customerName: inv.customer_name,
        customerPhone: inv.customer_phone,
        createdBy: inv.created_by || currentUserName,
        currency: settings.currency,
        totalAmount: inv.total_amount,
        paidAmount: inv.paid_amount,
        remainingAmount: inv.remaining_amount,
        weddingDate: inv.wedding_date,
        venue: inv.venue,
        items: items.map((it: any) => ({ name: it.package_name || '---', price: parseFloat(it.item_price || it.price) || 0 })),
        lang,
      });
      console.log('✅ PDF Base64 generated, length:', base64Data.length);

      await sendWhatsAppPDF({ phone: inv.customer_phone, pdfBase64: base64Data, fileName: `${inv.invoice_no}.pdf`, caption: `${settings.studioName || t.studioName} - ${inv.invoice_no}` });
      showToastMessage(lang === 'ar' ? 'تم إرسال الفاتورة' : 'Invoice sent');
    } catch (err) {
      console.error(err);
      showToastMessage(lang === 'ar' ? 'فشل إرسال الفاتورة' : 'Failed to send', 'error');
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomerId || selectedItems.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      const res = await createWeddingInvoice({ customer_id: Number(selectedCustomerId), items: selectedItems, total_amount: totalAmount, paid_amount: parseFloat(paidAmount) || 0, created_by: user?.name || 'Admin', wedding_date: weddingDate, venue, notes });
      const invRes = await getWeddingInvoices(); setInvoices(invRes.data);
      const newInv = invRes.data.find((i: WeddingInvoice) => i.id === res.data?.id);
      if (newInv) await generateAndSendPDF(newInv, []);
      setSelectedCustomerId(''); setSelectedItems([]); setPaidAmount('0'); setWeddingDate(''); setVenue(''); setNotes(''); setActiveTab('list');
      showToastMessage(lang === 'ar' ? 'تم إنشاء الفاتورة بنجاح' : 'Invoice created successfully');
    } catch (err) { console.error(err); showToastMessage(lang === 'ar' ? 'فشل إنشاء الفاتورة' : 'Failed to create invoice', 'error'); } finally { setIsSaving(false); }
  };

  const handleDownloadPDF = async () => {
    if (!printingInvoice) return;
    try {
      const detailsRes = await getWeddingInvoiceDetails(printingInvoice.id);
      const items = detailsRes.data;
      const base64Data = await generateInvoicePdfBase64({
        studioName: settings.studioName || t.studioName,
        address: settings.address,
        phone: settings.phone,
        invoiceNo: printingInvoice.invoice_no,
        customerName: printingInvoice.customer_name,
        customerPhone: printingInvoice.customer_phone,
        createdBy: printingInvoice.created_by || currentUserName,
        currency: settings.currency,
        totalAmount: printingInvoice.total_amount,
        paidAmount: printingInvoice.paid_amount,
        remainingAmount: printingInvoice.remaining_amount,
        weddingDate: printingInvoice.wedding_date,
        venue: printingInvoice.venue,
        items: items.map((it: any) => ({ name: it.package_name || '---', price: parseFloat(it.item_price || it.price) || 0 })),
        lang,
      });
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${base64Data}`;
      link.download = `${printingInvoice.invoice_no}.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      showToastMessage(lang === 'ar' ? 'فشل تحميل الفاتورة PDF' : 'Failed to download PDF', 'error');
    }
  };

  const handlePrint = async (id: number) => {
    try {
      const inv = invoices.find(i => i.id === id);
      if (!inv) return;
      const res = await getWeddingInvoiceDetails(id);
      setPrintingInvoice(inv); setPrintingItems(res.data); setShowPrintModal(true);
    } catch (err) { console.error(err); }
  };

  const handleEditInvoice = (inv: WeddingInvoice) => { setEditingInvoice(inv); setEditPaidAmount(inv.paid_amount.toString()); setEditVenue(inv.venue || ''); setEditNotes(inv.notes || ''); setEditWeddingDate(inv.wedding_date ? inv.wedding_date.split('T')[0] : ''); };
  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return;
    try {
      await updateWeddingInvoice(editingInvoice.id, { paid_amount: parseFloat(editPaidAmount) || 0, total_amount: editingInvoice.total_amount, wedding_date: editWeddingDate, venue: editVenue, notes: editNotes });
      setEditingInvoice(null);
      fetchData();
      showToastMessage(lang === 'ar' ? 'تم التحديث' : 'Updated');
    } catch (err) { console.error(err); }
  };

  const handleDeleteInvoice = async (id: number) => { if (!window.confirm(t.deleteConfirm)) return; await deleteWeddingInvoice(id); fetchData(); };

  const handleSendWhatsAppText = async (inv: WeddingInvoice) => {
    try {
      const detailsRes = await getWeddingInvoiceDetails(inv.id);
      const items = detailsRes.data;
      const itemsText = items.map((it: any) => `- ${it.package_name}: ${it.item_price}`).join('\n');
      const text = `*${settings.studioName || t.studioName}*\n*${t.invoiceNo}: ${inv.invoice_no}*\n*${t.customerName}:* ${inv.customer_name}\n*${t.total}:* ${inv.total_amount} ${settings.currency}\n*${t.paid}:* ${inv.paid_amount}\n*${t.remaining}:* ${inv.remaining_amount}\n*${t.weddingDate}:* ${inv.wedding_date || '---'}\n*${t.venue}:* ${inv.venue || '---'}\n\n*${t.items}:*\n${itemsText}`;
      await sendWhatsAppMessage({ phone: inv.customer_phone, message: text });
      showToastMessage(lang === 'ar' ? '✓ تم إرسال النص' : '✓ Message sent');
    } catch (err) { showToastMessage('Error', 'error'); }
  };

  const inputClass = "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-500/50 transition-all font-cairo";

  return (
    <div className="animate-fade-in p-2 sm:p-4">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5"><Heart size={22} className="text-pink-500" />{t.title}</h2>
          <div className="flex gap-1 bg-muted p-1 rounded-lg mt-3 w-fit">
            <button onClick={() => setActiveTab('create')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'create' ? 'bg-card text-pink-500 shadow-sm' : 'text-muted-foreground'}`}>{t.createTab}</button>
            <button onClick={() => setActiveTab('list')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-card text-pink-500 shadow-sm' : 'text-muted-foreground'}`}>{t.listTab}</button>
          </div>
        </div>
      </header>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
          <div className="space-y-4">
            <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">{t.customer}</label>
              <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(Number(e.target.value))} className={inputClass}>
                <option value="">{lang === 'ar' ? 'اختر عميل...' : 'Select customer...'}</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
              </select>
            </section>

            <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-3 block">{lang === 'ar' ? 'الألبومات' : 'Albums'}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {albums.map(a => (
                  <div key={a.id} onClick={() => addItem(a, 'album')} className="p-3 border border-border rounded-lg cursor-pointer hover:border-pink-500/50 hover:bg-pink-500/5 transition-all text-sm group relative">
                    <span className="font-bold">{a.description}</span>
                    <div className="text-[10px] text-muted-foreground">{a.price} {settings.currency}</div>
                    <Plus size={14} className="absolute top-3 right-3 opacity-20 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-3 block">{lang === 'ar' ? 'الفيديو' : 'Videos'}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {videos.map(v => (
                  <div key={v.id} onClick={() => addItem(v, 'video')} className="p-3 border border-border rounded-lg cursor-pointer hover:border-pink-500/50 hover:bg-pink-500/5 transition-all text-sm group relative">
                    <span className="font-bold">{v.description}</span>
                    <div className="text-[10px] text-muted-foreground">{v.price} {settings.currency}</div>
                    <Plus size={14} className="absolute top-3 right-3 opacity-20 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-card border border-border rounded-xl p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{t.weddingDate}</label><input type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} className={inputClass} /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{t.venue}</label><input type="text" value={venue} onChange={e => setVenue(e.target.value)} className={inputClass} /></div>
              <div className="sm:col-span-2"><label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{t.notes}</label><textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} min-h-[60px]`} /></div>
            </section>
          </div>

          <aside className="bg-card border border-border rounded-xl p-5 shadow-sm sticky top-24 h-fit">
            <h3 className="font-bold border-b border-border pb-3 mb-4">{t.items}</h3>
            <div className="space-y-2 mb-6">
              {selectedItems.map(item => (
                <div key={item.tempId} className="flex justify-between items-center text-sm">
                  <span>{item.package_name}</span>
                  <div className="flex items-center gap-3">
                    <strong>{item.price}</strong>
                    <button onClick={() => removeItem(item.tempId)} className="text-destructive"><X size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-muted p-3 rounded-lg space-y-3 mb-4">
              <div className="flex justify-between font-bold"><span>{t.total}</span><span>{totalAmount}</span></div>
              <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full bg-card border border-border rounded px-3 py-2 text-sm font-bold" placeholder={t.paid} />
              <div className="flex justify-between text-xs text-destructive"><span>{t.remaining}</span><span>{remainingAmountCalc}</span></div>
            </div>
            <button onClick={handleCreateInvoice} disabled={!selectedCustomerId || selectedItems.length === 0 || isSaving} className="w-full bg-pink-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {isSaving ? <Loader className="animate-spin" size={20} /> : <><CheckCircle size={20} /> {t.createBtn}</>}
            </button>
          </aside>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto shadow-sm">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="bg-muted text-muted-foreground"><th className="p-4 text-start font-black text-[10px] uppercase">{t.invoiceNo}</th><th className="p-4 text-start font-black text-[10px] uppercase">{t.customerName}</th><th className="p-4 text-start font-black text-[10px] uppercase">{t.amount}</th><th className="p-4 text-start font-black text-[10px] uppercase">{t.remaining}</th><th className="p-4 text-start font-black text-[10px] uppercase">{t.actions}</th></tr></thead>
            <tbody className="divide-y divide-border">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-all">
                  <td className="p-4 font-bold">{inv.invoice_no}</td>
                  <td className="p-4">{inv.customer_name}</td>
                  <td className="p-4">{inv.total_amount}</td>
                  <td className="p-4 text-destructive font-bold">{inv.remaining_amount}</td>
                  <td className="p-4">
                    <div className="flex gap-2.5">
                      <div className="flex flex-col gap-1.5">
                        <button onClick={() => generateAndSendPDF(inv, [])} className="px-3 py-1.5 rounded-lg border border-green-500/30 text-green-600 text-[10px] font-black hover:bg-green-500/10 flex items-center gap-1.5 transition-all"><MessageCircle size={12} /> PDF</button>
                        <button onClick={() => handleSendWhatsAppText(inv)} className="px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-600 text-[10px] font-black hover:bg-blue-500/10 flex items-center gap-1.5 transition-all"><MessageCircle size={12} /> {lang === 'ar' ? 'نص' : 'Text'}</button>
                      </div>
                      <button onClick={() => handlePrint(inv.id)} className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10 transition-all shadow-sm" title={t.print}><Printer size={18} /></button>
                      <button onClick={() => handleEditInvoice(inv)} className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10 transition-all shadow-sm"><Edit2 size={16} /></button>
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
            <div className="bg-white text-black p-8 rounded-3xl shadow-2xl max-w-sm w-full font-cairo" style={{ width: '80mm' }}>
              <h2 className="text-center font-black text-xl italic mb-1 uppercase tracking-tight">{settings.studioName || t.studioName}</h2>
              <p className="text-center text-[10px] text-gray-400 font-bold tracking-widest uppercase">{settings.phone}</p>
              <div className="border-b-2 border-dashed border-gray-100 my-5" />
              <div className="flex justify-between items-center text-[11px] font-bold"><span className="text-gray-400 uppercase tracking-wider">{t.invoiceNo}</span><span className="font-mono text-sm">{printingInvoice.invoice_no}</span></div>
              <div className="flex justify-between items-center text-[11px] font-bold mt-2"><span className="text-gray-400 uppercase tracking-wider">{t.customerName}</span><span>{printingInvoice.customer_name}</span></div>
              <div className="border-b border-gray-100 my-5" />
              <div className="space-y-2">
                {printingItems.map((it, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-gray-600">{it.package_name}</span>
                    <span className="font-black font-mono">{it.item_price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-black text-white p-4 rounded-2xl space-y-2 shadow-lg shadow-gray-200">
                <div className="flex justify-between text-xs font-bold"><span className="opacity-60">{t.total}</span><span>{printingInvoice.total_amount}</span></div>
                <div className="flex justify-between text-xs font-bold text-green-400"><span className="opacity-60">{t.paid}</span><span>{printingInvoice.paid_amount}</span></div>
                <div className="flex justify-between font-black pt-2 border-t border-white/20"><span>{t.remaining}</span><span>{printingInvoice.remaining_amount}</span></div>
              </div>
              <div className="text-center mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">{lang === 'ar' ? 'المسؤول' : 'Manager'} • {printingInvoice.created_by || currentUserName}</div>
              <div className="flex gap-2.5 mt-8 no-print">
                <button onClick={() => setShowPrintModal(false)} className="flex-1 py-3 border border-gray-100 rounded-xl text-sm font-bold text-gray-500">Close</button>
                <button onClick={handleDownloadPDF} className="p-3 bg-green-600 text-white rounded-xl shadow-lg shadow-green-100 transition-all"><Download size={20} /></button>
                <button onClick={() => window.print()} className="flex-[2] py-3 bg-pink-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-100 active:scale-95 transition-all"><Printer size={18} /> {t.print}</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingInvoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[3000] flex items-center justify-center p-4" onClick={() => setEditingInvoice(null)}>
            <div className="bg-card p-7 rounded-3xl border border-border max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg">{t.editInvoice}: {editingInvoice.invoice_no}</h3>
                <button onClick={() => setEditingInvoice(null)} className="p-2 hover:bg-muted rounded-xl transition-all"><X size={20} /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">{t.paid}</label>
                  <input type="number" value={editPaidAmount} onChange={e => setEditPaidAmount(e.target.value)} className={inputClass} />
                  <div className="flex justify-between mt-2 px-1">
                    <small className="text-[10px] font-bold text-muted-foreground uppercase">{t.total}: {editingInvoice.total_amount}</small>
                    <small className={`text-[10px] font-black uppercase ${editingInvoice.total_amount - (parseFloat(editPaidAmount) || 0) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                      {t.remaining}: {Math.max(0, editingInvoice.total_amount - (parseFloat(editPaidAmount) || 0))}
                    </small>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{t.weddingDate}</label><input type="date" value={editWeddingDate} onChange={e => setEditWeddingDate(e.target.value)} className={inputClass} /></div>
                  <div><label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{t.venue}</label><input type="text" value={editVenue} onChange={e => setEditVenue(e.target.value)} className={inputClass} /></div>
                </div>
                <div><label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">{t.notes}</label><textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className={`${inputClass} min-h-[60px]`} /></div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setEditingInvoice(null)} className="flex-1 py-3.5 border border-border rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">Cancel</button>
                  <button onClick={handleUpdateInvoice} className="flex-[2] py-3.5 bg-pink-500 text-white rounded-2xl font-black shadow-lg shadow-pink-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Plus size={18} /> {t.saveChanges}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-7 py-4 rounded-2xl text-white font-black text-sm shadow-2xl z-[5000] flex items-center gap-3 transition-all ${toastType === 'success' ? 'bg-green-600 shadow-green-500/20' : 'bg-destructive shadow-red-500/20'}`}>
            {toastType === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
            {toastMessage}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeddingInvoicesPage;
