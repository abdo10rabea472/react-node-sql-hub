import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, CheckCircle, Printer, Loader, X, Plus, Trash2, Edit2, MessageCircle, Search, Calendar, MapPin, Hash, User as UserIcon, Camera, Film } from 'lucide-react';
import { getWeddingInvoices, createWeddingInvoice, getCustomers, getWeddingAlbums, getWeddingVideos, getWeddingInvoiceDetails, deleteWeddingInvoice, updateWeddingInvoice, getWhatsAppStatus, sendWhatsAppMessage } from './api';
import { useSettings } from './SettingsContext';

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
  const [searchQuery, setSearchQuery] = useState('');

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message); setToastType(type); setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const t = {
    title: lang === 'ar' ? 'فواتير المناسبات' : 'Wedding Invoices',
    createTab: lang === 'ar' ? 'فاتورة جديدة' : 'New Invoice',
    listTab: lang === 'ar' ? 'سجل الفواتير' : 'Invoice List',
    customer: lang === 'ar' ? 'العميل' : 'Customer',
    items: lang === 'ar' ? 'الباقات المختارة' : 'Selected Packages',
    total: lang === 'ar' ? 'الإجمالي' : 'Total',
    paid: lang === 'ar' ? 'المدفوع' : 'Paid',
    remaining: lang === 'ar' ? 'المتبقي' : 'Remaining',
    weddingDate: lang === 'ar' ? 'تاريخ الحفل' : 'Wedding Date',
    venue: lang === 'ar' ? 'مكان الحفل' : 'Venue',
    notes: lang === 'ar' ? 'ملاحظات' : 'Notes',
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
    customerPhone: lang === 'ar' ? 'الهاتف' : 'Phone',
    albums: lang === 'ar' ? 'الألبومات' : 'Albums',
    videos: lang === 'ar' ? 'الفيديو' : 'Videos',
    studioName: lang === 'ar' ? 'استوديو التصوير' : 'Studio',
    search: lang === 'ar' ? 'بحث...' : 'Search...',
    noInvoices: lang === 'ar' ? 'لا توجد فواتير' : 'No invoices found',
    selectCustomer: lang === 'ar' ? 'اختر عميل...' : 'Select customer...',
    paid_label: lang === 'ar' ? 'مدفوع' : 'Paid',
    pending: lang === 'ar' ? 'معلق' : 'Pending',
    partial: lang === 'ar' ? 'جزئي' : 'Partial',
    status: lang === 'ar' ? 'الحالة' : 'Status',
  };

  const fetchData = async () => {
    try {
      const [c, a, v, i] = await Promise.all([getCustomers(), getWeddingAlbums(), getWeddingVideos(), getWeddingInvoices()]);
      setCustomers(c.data);
      setAlbums(a.data.map((alb: any) => ({ ...alb, description: alb.description || 'Album', price: parseFloat(alb.price) || 0 })));
      setVideos(v.data.map((vid: any) => ({ ...vid, description: vid.camera_type ? `${vid.camera_type} (${vid.quality})` : (vid.description || 'Video'), price: parseFloat(vid.price || vid.price_per_hour) || 0 })));
      setInvoices(i.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const addItem = (item: any, type: 'album' | 'video') => {
    setSelectedItems(prev => [...prev, { tempId: Date.now() + Math.random(), id: item.id, package_name: item.description, price: parseFloat(item.price) || 0, type }]);
  };
  const removeItem = (tempId: number) => setSelectedItems(prev => prev.filter(i => i.tempId !== tempId));
  const totalAmount = selectedItems.reduce((acc, it) => acc + it.price, 0);
  const remainingAmountCalc = Math.max(0, totalAmount - (parseFloat(paidAmount) || 0));

  const getStatusLabel = (s: string) => s === 'paid' ? t.paid_label : s === 'partial' ? t.partial : t.pending;
  const statusConfig = (s: string) => s === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : s === 'partial' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20';

  const handleSendWhatsAppAuto = async (inv: WeddingInvoice) => {
    try {
      const statusRes = await getWhatsAppStatus();
      if (!statusRes.data.connected) {
        showToastMessage(lang === 'ar' ? 'الواتساب غير متصل حالياً' : 'WhatsApp is not connected', 'error');
        return;
      }
      const detailsRes = await getWeddingInvoiceDetails(inv.id);
      const items = detailsRes.data;
      const itemsText = items.map((it: any) => `- ${it.package_name}: ${it.item_price || it.price} ${settings.currency}`).join('\n');
      const text = `*${settings.studioName || t.studioName}*\n${settings.address ? settings.address + '\n' : ''}${settings.phone ? settings.phone + '\n' : ''}\n*${t.invoiceNo}: ${inv.invoice_no}*\n*${t.customerName}:* ${inv.customer_name}\n*${t.customerPhone}:* ${inv.customer_phone}\n${inv.wedding_date ? `*${t.weddingDate}:* ${inv.wedding_date}\n` : ''}${inv.venue ? `*${t.venue}:* ${inv.venue}\n` : ''}\n*${t.items}:*\n${itemsText}\n\n*${t.total}:* ${inv.total_amount} ${settings.currency}\n*${t.paid}:* ${inv.paid_amount} ${settings.currency}\n*${t.remaining}:* ${inv.remaining_amount} ${settings.currency}`;
      await sendWhatsAppMessage({ phone: inv.customer_phone, message: text });
      showToastMessage(lang === 'ar' ? '✓ تم إرسال الفاتورة عبر الواتساب' : '✓ Invoice sent via WhatsApp');
    } catch (err) { console.error(err); showToastMessage(lang === 'ar' ? 'فشل الإرسال' : 'Failed to send', 'error'); }
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomerId || selectedItems.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      const res = await createWeddingInvoice({ customer_id: Number(selectedCustomerId), items: selectedItems, total_amount: totalAmount, paid_amount: parseFloat(paidAmount) || 0, created_by: user?.name || 'Admin', wedding_date: weddingDate, venue, notes });
      const invRes = await getWeddingInvoices(); setInvoices(invRes.data);
      const newInv = invRes.data.find((i: WeddingInvoice) => i.id === res.data?.id);
      if (newInv) await handleSendWhatsAppAuto(newInv);
      setSelectedCustomerId(''); setSelectedItems([]); setPaidAmount('0'); setWeddingDate(''); setVenue(''); setNotes(''); setActiveTab('list');
      showToastMessage(lang === 'ar' ? 'تم إنشاء الفاتورة بنجاح' : 'Invoice created');
    } catch (err) { console.error(err); showToastMessage(lang === 'ar' ? 'فشل إنشاء الفاتورة' : 'Failed to create', 'error'); }
    finally { setIsSaving(false); }
  };


  const handlePrint = async (id: number) => { try { const inv = invoices.find(i => i.id === id); if (!inv) return; const res = await getWeddingInvoiceDetails(id); setPrintingInvoice(inv); setPrintingItems(res.data); setShowPrintModal(true); } catch (err) { console.error(err); } };
  const handleEditInvoice = (inv: WeddingInvoice) => { setEditingInvoice(inv); setEditPaidAmount(inv.paid_amount.toString()); setEditVenue(inv.venue || ''); setEditNotes(inv.notes || ''); setEditWeddingDate(inv.wedding_date ? inv.wedding_date.split('T')[0] : ''); };
  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return;
    try {
      await updateWeddingInvoice(editingInvoice.id, { paid_amount: parseFloat(editPaidAmount) || 0, total_amount: editingInvoice.total_amount, wedding_date: editWeddingDate, venue: editVenue, notes: editNotes });
      setEditingInvoice(null); fetchData();
      showToastMessage(lang === 'ar' ? 'تم التحديث' : 'Updated');
    } catch (err) { console.error(err); }
  };
  const handleDeleteInvoice = async (id: number) => { if (!window.confirm(t.deleteConfirm)) return; await deleteWeddingInvoice(id); fetchData(); };

  const inputClass = "w-full px-3.5 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/10 transition-all font-cairo";

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
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Heart size={20} className="text-rose-500" />
              </div>
              {t.title}
            </h2>
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-xl w-full sm:w-auto">
            <button onClick={() => setActiveTab('create')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'create' ? 'bg-card text-rose-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Plus size={16} className="inline-block me-1.5 -mt-0.5" />{t.createTab}
            </button>
            <button onClick={() => setActiveTab('list')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-card text-rose-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Heart size={16} className="inline-block me-1.5 -mt-0.5" />{t.listTab}
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <div className="space-y-4">
            {/* Customer */}
            <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
                <UserIcon size={16} className="text-rose-500" />{t.customer}
              </h3>
              <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(Number(e.target.value))} className={inputClass}>
                <option value="">{t.selectCustomer}</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
              </select>
            </section>

            {/* Albums */}
            <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
                <Camera size={16} className="text-rose-500" />{t.albums}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {albums.map(a => (
                  <motion.div key={a.id} whileTap={{ scale: 0.97 }} onClick={() => addItem(a, 'album')}
                    className="bg-muted/50 border border-border rounded-xl p-3.5 cursor-pointer hover:border-rose-400/40 hover:bg-rose-500/5 transition-all group relative">
                    <span className="text-sm font-bold text-foreground block">{a.description}</span>
                    <span className="text-xs text-muted-foreground font-semibold mt-1 block">{a.price} {settings.currency}</span>
                    <Plus size={14} className="absolute top-3 end-3 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:text-rose-500 transition-all" />
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Videos */}
            <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
                <Film size={16} className="text-rose-500" />{t.videos}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {videos.map(v => (
                  <motion.div key={v.id} whileTap={{ scale: 0.97 }} onClick={() => addItem(v, 'video')}
                    className="bg-muted/50 border border-border rounded-xl p-3.5 cursor-pointer hover:border-rose-400/40 hover:bg-rose-500/5 transition-all group relative">
                    <span className="text-sm font-bold text-foreground block">{v.description}</span>
                    <span className="text-xs text-muted-foreground font-semibold mt-1 block">{v.price} {settings.currency}</span>
                    <Plus size={14} className="absolute top-3 end-3 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:text-rose-500 transition-all" />
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Wedding Details */}
            <section className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-rose-500" />{lang === 'ar' ? 'تفاصيل الحفل' : 'Event Details'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">{t.weddingDate}</label>
                  <input type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">{t.venue}</label>
                  <input type="text" value={venue} onChange={e => setVenue(e.target.value)} className={inputClass} placeholder={lang === 'ar' ? 'اسم القاعة أو المكان...' : 'Hall name or location...'} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">{t.notes}</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputClass} min-h-[60px] resize-y`} />
                </div>
              </div>
            </section>
          </div>

          {/* Summary Sidebar */}
          <aside>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 mb-5">
                <Heart size={16} className="text-rose-500" />{t.items}
              </h3>
              <div className="space-y-2 mb-6 max-h-[250px] overflow-y-auto">
                {selectedItems.length === 0 ? (
                  <div className="text-center py-10">
                    <Heart size={32} className="mx-auto text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'لم يتم اختيار باقات' : 'No packages selected'}</p>
                  </div>
                ) : selectedItems.map(item => (
                  <motion.div key={item.tempId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center py-2.5 px-3 bg-muted/50 rounded-lg group hover:bg-muted transition-all">
                    <div>
                      <span className="text-sm font-bold text-foreground">{item.package_name}</span>
                      <span className="text-[10px] text-rose-500 font-bold uppercase block">{item.type === 'album' ? (lang === 'ar' ? 'ألبوم' : 'Album') : (lang === 'ar' ? 'فيديو' : 'Video')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-mono">{item.price}</strong>
                      <button onClick={() => removeItem(item.tempId)} className="w-7 h-7 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"><X size={14} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-muted/50 rounded-xl p-4 space-y-4 border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground">{t.total}</span>
                  <span className="text-xl font-black text-rose-500 font-mono">{totalAmount} {settings.currency}</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t.paid}</label>
                  <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-lg font-black font-mono focus:border-rose-400/50 outline-none transition-all" />
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">{t.remaining}</span>
                  <span className={`text-lg font-black font-mono ${remainingAmountCalc > 0 ? 'text-destructive' : 'text-emerald-500'}`}>{remainingAmountCalc} {settings.currency}</span>
                </div>
              </div>

              <button onClick={handleCreateInvoice} disabled={!selectedCustomerId || selectedItems.length === 0 || isSaving}
                className="w-full mt-5 bg-rose-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm">
                {isSaving ? <Loader className="animate-spin" size={18} /> : <><CheckCircle size={18} />{t.createBtn}</>}
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <div>
          {/* Search */}
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
                  <tr><td colSpan={6} className="px-5 py-16 text-center text-muted-foreground"><Heart size={32} className="mx-auto mb-3 opacity-30" /><p>{t.noInvoices}</p></td></tr>
                ) : filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-sm font-black text-foreground">{inv.invoice_no}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1"><Calendar size={10} />{new Date(inv.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold">{inv.customer_name}</span>
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
                        <button onClick={() => handlePrint(inv.id)} className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all" title={t.print}><Printer size={16} /></button>
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
              <div className="text-center py-16 text-muted-foreground"><Heart size={32} className="mx-auto mb-3 opacity-30" /><p>{t.noInvoices}</p></div>
            ) : filteredInvoices.map(inv => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Hash size={14} className="text-rose-500" />
                      <span className="text-sm font-black">{inv.invoice_no}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 ms-5"><Calendar size={10} />{new Date(inv.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusConfig(inv.status)}`}>{getStatusLabel(inv.status)}</span>
                </div>

                <div className="flex items-center gap-2 mb-3 text-sm">
                  <UserIcon size={14} className="text-muted-foreground" />
                  <span className="font-bold">{inv.customer_name}</span>
                </div>

                {(inv.wedding_date || inv.venue) && (
                  <div className="flex flex-wrap gap-3 mb-3 text-[11px] text-muted-foreground">
                    {inv.wedding_date && <span className="flex items-center gap-1"><Calendar size={11} />{new Date(inv.wedding_date).toLocaleDateString()}</span>}
                    {inv.venue && <span className="flex items-center gap-1"><MapPin size={11} />{inv.venue}</span>}
                  </div>
                )}

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
                  <button onClick={() => handlePrint(inv.id)} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"><Printer size={16} /></button>
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
                  <div className="inline-flex w-12 h-12 bg-rose-500 text-white rounded-2xl items-center justify-center text-xl mb-2">💍</div>
                  <h2 className="text-lg font-black uppercase tracking-tight">{settings.studioName || t.studioName}</h2>
                  {settings.phone && <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">{settings.phone}</p>}
                </div>
                <div className="border-t border-dashed border-gray-300 my-4" />
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-400 uppercase tracking-wider font-bold">{t.invoiceNo}</span><span className="font-mono font-bold">{printingInvoice.invoice_no}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 uppercase tracking-wider font-bold">{t.date}</span><span className="font-bold">{new Date(printingInvoice.created_at).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 uppercase tracking-wider font-bold">{t.customerName}</span><span className="font-bold">{printingInvoice.customer_name}</span></div>
                  {printingInvoice.wedding_date && <div className="flex justify-between"><span className="text-gray-400 uppercase tracking-wider font-bold">{t.weddingDate}</span><span className="font-bold">{new Date(printingInvoice.wedding_date).toLocaleDateString()}</span></div>}
                  {printingInvoice.venue && <div className="flex justify-between"><span className="text-gray-400 uppercase tracking-wider font-bold">{t.venue}</span><span className="font-bold">{printingInvoice.venue}</span></div>}
                </div>
                <table className="w-full mt-5 mb-4">
                  <thead className="border-b-2 border-black"><tr><th className="text-[10px] font-black text-start py-2 uppercase">{t.items}</th><th className="text-[10px] font-black text-end py-2 uppercase">{t.amount}</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{printingItems.map((it, i) => <tr key={i}><td className="py-2.5 text-[11px] font-bold">{it.package_name}</td><td className="py-2.5 text-end text-[11px] font-black">{it.item_price || it.price} {settings.currency}</td></tr>)}</tbody>
                </table>
                <div className="bg-rose-500 text-white p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs font-bold"><span className="opacity-60">{t.total}</span><span>{printingInvoice.total_amount} {settings.currency}</span></div>
                  <div className="flex justify-between text-xs font-bold text-green-300"><span className="opacity-60">{t.paid}</span><span>{printingInvoice.paid_amount} {settings.currency}</span></div>
                  <div className="flex justify-between text-sm font-black pt-2 border-t border-white/20"><span>{t.remaining}</span><span>{printingInvoice.remaining_amount} {settings.currency}</span></div>
                </div>
                <div className="mt-5 flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest"><span>{lang === 'ar' ? 'المسؤول' : 'Manager'}</span><span>{printingInvoice.created_by || currentUserName}</span></div>
                <div className="text-center mt-6 pb-2 italic font-black text-gray-800">{lang === 'ar' ? 'شكراً لزيارتكم!' : 'Thanks for visiting!'}</div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2.5 no-print">
                <button onClick={() => setShowPrintModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all">{t.close}</button>
                
                <button onClick={() => window.print()} className="flex-[2] py-3 bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-600 active:scale-95 transition-all"><Printer size={16} />{t.print}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>{editingInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4" onClick={() => setEditingInvoice(null)}>
          <motion.div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">{t.editInvoice}: {editingInvoice.invoice_no}</h3>
              <button onClick={() => setEditingInvoice(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-all"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.paid}</label>
                <input type="number" value={editPaidAmount} onChange={e => setEditPaidAmount(e.target.value)} className={inputClass} />
                <div className="flex justify-between mt-2 px-1">
                  <small className="text-[10px] text-muted-foreground">{t.total}: {editingInvoice.total_amount}</small>
                  <small className={`text-[10px] font-bold ${editingInvoice.total_amount - (parseFloat(editPaidAmount) || 0) > 0 ? 'text-destructive' : 'text-emerald-600'}`}>{t.remaining}: {Math.max(0, editingInvoice.total_amount - (parseFloat(editPaidAmount) || 0))}</small>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-muted-foreground mb-1 block">{t.weddingDate}</label><input type="date" value={editWeddingDate} onChange={e => setEditWeddingDate(e.target.value)} className={inputClass} /></div>
                <div><label className="text-xs font-bold text-muted-foreground mb-1 block">{t.venue}</label><input type="text" value={editVenue} onChange={e => setEditVenue(e.target.value)} className={inputClass} /></div>
              </div>
              <div><label className="text-xs font-bold text-muted-foreground mb-1 block">{t.notes}</label><textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className={`${inputClass} min-h-[60px] resize-y`} /></div>
            </div>
            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30">
              <button onClick={() => setEditingInvoice(null)} className="px-4 py-2.5 border border-border rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">{t.close}</button>
              <button onClick={handleUpdateInvoice} className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 flex items-center gap-2 transition-all"><CheckCircle size={16} />{t.saveChanges}</button>
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

export default WeddingInvoicesPage;
