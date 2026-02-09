import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, User as UserIcon, Package, CheckCircle,
    Printer, Loader, DollarSign, Wallet, X, Clock, Calendar, Plus, Trash2, Edit2
} from 'lucide-react';
import {
    getInvoices, createInvoice, getCustomers, getPackages, getInvoiceDetails,
    addCustomer, deleteInvoice, updateInvoice
} from './api';
import { useSettings } from './SettingsContext';
import './InvoicesPage.css';

interface Customer {
    id: number;
    name: string;
    phone: string;
}

interface PricingPackage {
    id: number;
    type: string;
    price: number;
}

interface Invoice {
    id: number;
    invoice_no: string;
    customer_id: number;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    created_by: string;
    participants: string;
    status: string;
    created_at: string;
}

interface InvoiceItem {
    package_name: string;
    item_price: number;
}

const translations = {
    ar: {
        title: 'الفواتير وإدارة المبيعات',
        createTab: 'إنشاء فاتورة جديدة',
        listTab: 'سجل الفواتير',
        selectCustomer: 'بيانات العميل',
        selectPackages: 'اختر الباقة',
        invoiceSummary: 'ملخص الفاتورة',
        noItems: 'لم يتم اختيار باقات بعد',
        total: 'الإجمالي',
        paid: 'المدفوع',
        remaining: 'الباقي',
        createBtn: 'إصدار الفاتورة وحفظها',
        customerName: 'اسم العميل',
        customerPhone: 'رقم الهاتف',
        invoiceNo: 'رقم الفاتورة',
        amount: 'المجموع',
        status: 'الحالة',
        date: 'التاريخ',
        time: 'الوقت',
        success: 'تم إصدار الفاتورة بنجاح',
        searchCustomer: 'ابحث عن عميل...',
        multiplePackagesHint: 'يمكنك إضافة الباقة أكثر من مرة',
        pending: 'معلق',
        paid_label: 'مدفوع بالكامل',
        partial: 'مدفوع جزئياً',
        actions: 'إجراءات',
        createdBy: 'المسؤول',
        print: 'طباعة الفاتورة',
        close: 'إغلاق',
        studioName: 'استوديو التصوير',
        participants: 'المشاركين في الجلسة',
        participantsHint: 'ادخل الأسماء هنا...',
        deleteConfirm: 'هل أنت متأكد من حذف هذه الفاتورة نهائياً؟',
        editInvoice: 'تعديل بيانات الفاتورة',
        saveChanges: 'حفظ التغييرات الآن'
    },
    en: {
        title: 'Invoices & Sales',
        createTab: 'Create New Invoice',
        listTab: 'Invoice History',
        selectCustomer: 'Customer Info',
        selectPackages: 'Select Package',
        invoiceSummary: 'Invoice Summary',
        noItems: 'No packages selected',
        total: 'Total',
        paid: 'Paid',
        remaining: 'Remaining',
        createBtn: 'Issue & Save Invoice',
        customerName: 'Customer Name',
        customerPhone: 'Phone Number',
        invoiceNo: 'Invoice No',
        amount: 'Total',
        status: 'Status',
        date: 'Date',
        time: 'Time',
        success: 'Invoice issued successfully',
        searchCustomer: 'Search customer...',
        multiplePackagesHint: 'You can add packages multiple times',
        pending: 'Pending',
        paid_label: 'Fully Paid',
        partial: 'Partial Payment',
        actions: 'Actions',
        createdBy: 'Manager',
        print: 'Print Invoice',
        close: 'Close',
        studioName: 'Photography Studio',
        participants: 'Session Participants',
        participantsHint: 'Enter names here...',
        deleteConfirm: 'Are you sure you want to delete this invoice permanently?',
        editInvoice: 'Edit Invoice Details',
        saveChanges: 'Save Changes Now'
    }
};

const InvoicesPage: React.FC<{ user?: { name: string } }> = ({ user }) => {
    const { settings } = useSettings();
    const lang = settings.lang;
    const t = translations[lang];

    const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [packages, setPackages] = useState<PricingPackage[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Create Invoice Form State
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
    const [selectedPackages, setSelectedPackages] = useState<PricingPackage[]>([]);
    const [participants, setParticipants] = useState('');
    const [paidAmount, setPaidAmount] = useState<string>('0');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Quick Add Customer State
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [newCustName, setNewCustName] = useState('');
    const [newCustPhone, setNewCustPhone] = useState('');
    const [isAddingCust, setIsAddingCust] = useState(false);

    // Printing State
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
    const [printingItems, setPrintingItems] = useState<InvoiceItem[]>([]);

    // Editing State
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [editPaidAmount, setEditPaidAmount] = useState<string>('0');
    const [editParticipants, setEditParticipants] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [custRes, pkgRes, invRes] = await Promise.all([
                getCustomers(),
                getPackages(),
                getInvoices()
            ]);
            setCustomers(custRes.data);
            setPackages(pkgRes.data);
            setInvoices(invRes.data);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addPackage = (pkg: PricingPackage) => {
        setSelectedPackages(prev => [...prev, { ...pkg, tempId: Date.now() + Math.random() } as any]);
    };

    const removePackageInstance = (tempId: number) => {
        setSelectedPackages(prev => (prev as any).filter((p: any) => p.tempId !== tempId));
    };

    const totalAmount = selectedPackages.reduce((sum, pkg) => sum + Number(pkg.price), 0);
    const remainingAmount = Math.max(0, totalAmount - (parseFloat(paidAmount) || 0));

    const handleCreateInvoice = async () => {
        if (!selectedCustomerId || selectedPackages.length === 0) return;

        setIsSaving(true);
        try {
            const res = await createInvoice({
                customer_id: Number(selectedCustomerId),
                items: selectedPackages,
                total_amount: totalAmount,
                paid_amount: parseFloat(paidAmount) || 0,
                created_by: user?.name || 'Admin',
                participants: participants
            });
            // Reset form
            setSelectedCustomerId('');
            setSelectedPackages([]);
            setPaidAmount('0');
            setParticipants('');
            setActiveTab('list');

            // Wait for history refresh
            const invRes = await getInvoices();
            setInvoices(invRes.data);

            // Auto open print for the new invoice
            if (res.data && res.data.id) {
                handlePrint(res.data.id, invRes.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrint = async (invoiceId: number, currentInvoices?: Invoice[]) => {
        try {
            const source = currentInvoices || invoices;
            const inv = source.find(i => i.id === invoiceId);
            if (!inv) return;

            const res = await getInvoiceDetails(invoiceId);
            setPrintingInvoice(inv);
            setPrintingItems(res.data);
            setShowPrintModal(true);
        } catch (err) {
            console.error("Print fetch failed:", err);
        }
    };

    const handleQuickAddCustomer = async () => {
        if (!newCustName || !newCustPhone) return;
        setIsAddingCust(true);
        try {
            const res = await addCustomer({ name: newCustName, phone: newCustPhone });
            await fetchData();
            // The backend returns the ID even if it exists. 
            // So we select it automatically.
            setSelectedCustomerId(res.data.id);
            setShowQuickAdd(false);
            setNewCustName('');
            setNewCustPhone('');
        } catch (err) {
            console.error("Quick add failed:", err);
        } finally {
            setIsAddingCust(false);
        }
    };

    const handleDeleteInvoice = async (id: number) => {
        if (!window.confirm(t.deleteConfirm)) return;
        try {
            await deleteInvoice(id);
            await fetchData(); // Refresh list
        } catch (err: any) {
            console.error("Delete failed:", err);
            alert("Delete failed: " + (err.response?.data?.message || err.message || "Unknown error"));
        }
    };

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
        } catch (err: any) {
            console.error("Update failed:", err);
            alert("Update failed: " + (err.response?.data?.message || err.message || "Unknown error"));
        }
    };

    const executePrint = () => {
        window.print();
    };

    const getStatusLabel = (status: string) => {
        if (lang === 'ar') {
            switch (status) {
                case 'paid': return t.paid_label;
                case 'partial': return t.partial;
                default: return t.pending;
            }
        }
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const currentUserName = user?.name || 'Admin';

    return (
        <div className="invoices-page">
            <header className="invoices-header">
                <div>
                    <h2 className="title-with-icon"><FileText size={24} /> {t.title}</h2>
                    <div className="tab-switcher">
                        <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>{t.createTab}</button>
                        <button className={activeTab === 'list' ? 'active' : ''} onClick={() => setActiveTab('list')}>{t.listTab}</button>
                    </div>
                </div>
            </header>

            {activeTab === 'create' ? (
                <div className="invoice-create-layout">
                    <div className="invoice-form-main">
                        <section className="invoice-form-card">
                            <h3 className="section-title"><UserIcon size={20} /> {t.selectCustomer}</h3>
                            <div className="customer-quick-info">
                                <div className="customer-select-row">
                                    <select
                                        className="customer-search-select"
                                        value={selectedCustomerId}
                                        onChange={e => setSelectedCustomerId(Number(e.target.value))}
                                    >
                                        <option value="">{t.searchCustomer}</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                                        ))}
                                    </select>
                                    <button className="quick-add-cust-btn" onClick={() => setShowQuickAdd(true)} title="Add New Customer">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                {selectedCustomerId && (
                                    <div className="selected-cust-details">
                                        <span className="badge"><UserIcon size={12} /> {customers.find(c => c.id === selectedCustomerId)?.name}</span>
                                        <span className="badge"><Wallet size={12} /> {customers.find(c => c.id === selectedCustomerId)?.phone}</span>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="invoice-form-card mt-2">
                            <h3 className="section-title">
                                <Package size={20} /> {t.selectPackages}
                                <span className="hint-badge">{t.multiplePackagesHint}</span>
                            </h3>
                            <div className="packages-selection-grid">
                                {packages.map(pkg => (
                                    <div
                                        key={pkg.id}
                                        className="pkg-select-card"
                                        onClick={() => addPackage(pkg)}
                                    >
                                        <span className="pkg-select-name">{pkg.type}</span>
                                        <Plus size={18} className="add-pkg-icon" />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="invoice-form-card mt-2">
                            <h3 className="section-title"><UserIcon size={20} /> {t.participants}</h3>
                            <textarea
                                className="participants-input"
                                placeholder={t.participantsHint}
                                value={participants}
                                onChange={e => setParticipants(e.target.value)}
                            />
                        </section>
                    </div>

                    <aside className="invoice-summary-card">
                        <h3 className="section-title">{t.invoiceSummary}</h3>
                        <div className="summary-items-list">
                            {selectedPackages.length === 0 ? (
                                <p className="empty-summary-text">{t.noItems}</p>
                            ) : (
                                selectedPackages.map((p: any) => (
                                    <div key={p.tempId} className="summary-item">
                                        <span>{p.type}</span>
                                        <div className="summary-item-actions">
                                            <strong>{p.price} {settings.currency}</strong>
                                            <button className="remove-item-btn" onClick={() => removePackageInstance(p.tempId)}><X size={14} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="invoice-payment-fields">
                            <div className="summary-item total">
                                <span>{t.total}</span>
                                <span>{totalAmount} {settings.currency}</span>
                            </div>

                            <div className="payment-input-group">
                                <label><DollarSign size={14} /> {t.paid}</label>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={e => setPaidAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className={`summary-item remaining ${remainingAmount > 0 ? 'highlight' : ''}`}>
                                <span><Wallet size={14} /> {t.remaining}</span>
                                <span>{remainingAmount} {settings.currency}</span>
                            </div>
                        </div>

                        <div className="summary-footer-info">
                            <div className="info-row"><Clock size={12} /> {new Date().toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US')}</div>
                            <div className="info-row"><Calendar size={12} /> {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</div>
                            <div className="info-row"><UserIcon size={12} /> {t.createdBy}: {currentUserName}</div>
                        </div>

                        <button
                            className="create-invoice-btn"
                            disabled={!selectedCustomerId || selectedPackages.length === 0 || isSaving}
                            onClick={handleCreateInvoice}
                        >
                            {isSaving ? <Loader className="spin" size={20} /> : <CheckCircle size={20} />}
                            {t.createBtn}
                        </button>
                    </aside>
                </div>
            ) : (
                <div className="invoices-list-section">
                    <div className="customers-table-card">
                        <div className="customers-table-wrapper">
                            <table className="customers-table">
                                <thead>
                                    <tr>
                                        <th>{t.invoiceNo}</th>
                                        <th>{t.customerName}</th>
                                        <th>{t.amount}</th>
                                        <th>{t.paid}</th>
                                        <th>{t.remaining}</th>
                                        <th>{t.status}</th>
                                        <th>{t.createdBy}</th>
                                        <th>{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.length === 0 ? (
                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>{isLoading ? <Loader className="spin" /> : t.noItems}</td></tr>
                                    ) : (
                                        invoices.map(inv => (
                                            <tr key={inv.id}>
                                                <td>
                                                    <div className="inv-no-cell">
                                                        <strong>{inv.invoice_no}</strong>
                                                        <small>{new Date(inv.created_at).toLocaleDateString()}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="cust-info-cell">
                                                        <span>{inv.customer_name}</span>
                                                        <small>{inv.customer_phone}</small>
                                                    </div>
                                                </td>
                                                <td>{inv.total_amount} {settings.currency}</td>
                                                <td className="text-success">{inv.paid_amount}</td>
                                                <td className={inv.remaining_amount > 0 ? 'text-error' : ''}>{inv.remaining_amount}</td>
                                                <td>
                                                    <span className={`status-badge status-${inv.status}`}>
                                                        {getStatusLabel(inv.status)}
                                                    </span>
                                                </td>
                                                <td>{inv.created_by || currentUserName}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button className="action-btn" title={t.print} onClick={() => handlePrint(inv.id)}><Printer size={16} /></button>
                                                        <button className="action-btn" title={t.editInvoice} onClick={() => handleEditInvoice(inv)}><Edit2 size={16} /></button>
                                                        <button className="action-btn delete" title="Delete" onClick={() => handleDeleteInvoice(inv.id)}><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Modal */}
            <AnimatePresence>
                {showPrintModal && printingInvoice && (
                    <div className="modal-overlay">
                        <motion.div
                            className="print-modal-content wide"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="print-modal-header no-print">
                                <h3>{t.print}</h3>
                                <button className="close-btn" onClick={() => setShowPrintModal(false)}><X size={20} /></button>
                            </div>

                            <div className="invoice-printable receipt-80mm" id="invoice-print">
                                {/* Top decorative border */}
                                <div className="print-top-border"></div>

                                {/* Studio brand header */}
                                <div className="print-brand-center">
                                    <div className="print-logo-circle">
                                        {(settings.studioName || t.studioName).charAt(0)}
                                    </div>
                                    <h1 className="print-studio-name">{settings.studioName || t.studioName}</h1>
                                    {settings.address && <p className="print-studio-info">{settings.address}</p>}
                                    {settings.phone && <p className="print-studio-info">{settings.phone}</p>}
                                </div>

                                <div className="print-divider dashed"></div>

                                {/* Invoice number & date */}
                                <div className="print-invoice-badge">
                                    <span className="print-inv-label">{t.invoiceNo}</span>
                                    <span className="print-inv-no">{printingInvoice.invoice_no}</span>
                                </div>

                                <div className="print-date-row">
                                    <div>
                                        <span className="print-meta-label">{t.date}</span>
                                        <span className="print-meta-value">{new Date(printingInvoice.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                                    </div>
                                    <div>
                                        <span className="print-meta-label">{t.time}</span>
                                        <span className="print-meta-value">{new Date(printingInvoice.created_at).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                <div className="print-divider solid"></div>

                                {/* Customer info */}
                                <div className="print-customer-section">
                                    <div className="print-customer-row">
                                        <span className="print-cust-label">{t.customerName}</span>
                                        <span className="print-cust-value">{printingInvoice.customer_name}</span>
                                    </div>
                                    <div className="print-customer-row">
                                        <span className="print-cust-label">{t.customerPhone}</span>
                                        <span className="print-cust-value" dir="ltr">{printingInvoice.customer_phone}</span>
                                    </div>
                                </div>

                                {printingInvoice.participants && (
                                    <>
                                        <div className="print-divider dashed"></div>
                                        <div className="print-participants-section">
                                            <span className="print-cust-label">{t.participants}</span>
                                            <p className="print-participants-text">{printingInvoice.participants}</p>
                                        </div>
                                    </>
                                )}

                                <div className="print-divider double"></div>

                                {/* Items table */}
                                <table className="print-items-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>{t.selectPackages}</th>
                                            <th>{t.amount}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {printingItems.map((item, index) => (
                                            <tr key={index}>
                                                <td className="print-item-num">{index + 1}</td>
                                                <td>{item.package_name}</td>
                                                <td className="print-item-price">{item.item_price} {settings.currency}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="print-divider double"></div>

                                {/* Payment summary */}
                                <div className="print-payment-summary">
                                    <div className="print-pay-row">
                                        <span>{t.total}</span>
                                        <strong>{printingInvoice.total_amount} {settings.currency}</strong>
                                    </div>
                                    <div className="print-pay-row paid-row">
                                        <span>{t.paid}</span>
                                        <strong>{printingInvoice.paid_amount} {settings.currency}</strong>
                                    </div>
                                    <div className="print-pay-row remaining-box">
                                        <span>{t.remaining}</span>
                                        <strong>{printingInvoice.remaining_amount} {settings.currency}</strong>
                                    </div>
                                </div>

                                {/* Status badge */}
                                <div className="print-status-line">
                                    <span className={`print-status-badge ps-${printingInvoice.status}`}>
                                        {printingInvoice.status === 'paid' ? (lang === 'ar' ? '✓ مدفوع بالكامل' : '✓ Fully Paid')
                                            : printingInvoice.status === 'partial' ? (lang === 'ar' ? '◐ مدفوع جزئياً' : '◐ Partial Payment')
                                            : (lang === 'ar' ? '○ معلق' : '○ Pending')}
                                    </span>
                                </div>

                                <div className="print-divider dashed"></div>

                                {/* Footer */}
                                <div className="print-receipt-footer">
                                    <div className="print-manager-line">
                                        <span>{t.createdBy}:</span>
                                        <strong>{printingInvoice.created_by || currentUserName}</strong>
                                    </div>
                                    <div className="print-thank-you">
                                        {lang === 'ar' ? 'شكراً لاختياركم لنا ✦' : 'Thank you for choosing us ✦'}
                                    </div>
                                    <div className="print-footer-brand">
                                        {settings.studioName || t.studioName}
                                    </div>
                                </div>

                                <div className="print-bottom-border"></div>
                            </div>

                            <div className="print-modal-actions no-print">
                                <button className="print-exec-btn" onClick={executePrint}><Printer size={20} /> {t.print}</button>
                                <button className="print-cancel-btn" onClick={() => setShowPrintModal(false)}>{t.close}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Add Customer Modal */}
            <AnimatePresence>
                {showQuickAdd && (
                    <div className="modal-overlay" onClick={() => setShowQuickAdd(false)}>
                        <motion.div
                            className="modal-content large"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>{t.selectCustomer}</h3>
                                <button className="close-btn" onClick={() => setShowQuickAdd(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="modal-field">
                                    <label>{t.customerName}</label>
                                    <input
                                        value={newCustName}
                                        onChange={e => setNewCustName(e.target.value)}
                                        placeholder="Ex: Ahmed Mohamed"
                                    />
                                </div>
                                <div className="modal-field">
                                    <label>{t.customerPhone}</label>
                                    <input
                                        value={newCustPhone}
                                        onChange={e => setNewCustPhone(e.target.value)}
                                        placeholder="05xxxxxxx"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="modal-cancel-btn" onClick={() => setShowQuickAdd(false)}>{t.close}</button>
                                <button
                                    className="modal-save-btn btn-primary"
                                    disabled={!newCustName || !newCustPhone || isAddingCust}
                                    onClick={handleQuickAddCustomer}
                                >
                                    {isAddingCust ? <Loader className="spin" size={20} /> : <CheckCircle size={20} />}
                                    {lang === 'ar' ? 'إضافة وتلوين' : 'Add & Select'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Invoice Modal */}
            <AnimatePresence>
                {editingInvoice && (
                    <div className="modal-overlay" onClick={() => setEditingInvoice(null)}>
                        <motion.div
                            className="modal-content large"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>{t.editInvoice}: {editingInvoice.invoice_no}</h3>
                                <button className="close-btn" onClick={() => setEditingInvoice(null)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="modal-field">
                                    <label>{t.paid}</label>
                                    <div className="input-with-icon">
                                        <DollarSign size={16} />
                                        <input
                                            type="number"
                                            value={editPaidAmount}
                                            onChange={e => setEditPaidAmount(e.target.value)}
                                        />
                                    </div>
                                    <small className="help-text">{t.total}: {editingInvoice.total_amount} {settings.currency}</small>
                                </div>
                                <div className="modal-field">
                                    <label>{t.participants}</label>
                                    <textarea
                                        value={editParticipants}
                                        onChange={e => setEditParticipants(e.target.value)}
                                        rows={4}
                                        placeholder={t.participantsHint}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="modal-cancel-btn" onClick={() => setEditingInvoice(null)}>{t.close}</button>
                                <button className="modal-save-btn btn-primary" onClick={handleUpdateInvoice}>
                                    <CheckCircle size={20} /> {t.saveChanges}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InvoicesPage;
