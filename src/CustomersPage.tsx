import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, Search, Trash2, X, Loader
} from 'lucide-react';
import { getCustomers, addCustomer, deleteCustomer } from './api';
import { useSettings } from './SettingsContext';
import './CustomersPage.css';

interface Customer {
    id: number;
    name: string;
    phone: string;
    email: string;
    address: string;
    created_at: string;
}

const translations = {
    ar: {
        title: 'إدارة العملاء',
        subtitle: 'قاعدة بيانات جميع عملاء الاستوديو',
        addBtn: 'إضافة عميل جديد',
        search: 'ابحث بالاسم أو الهاتف...',
        name: 'اسم العميل',
        phone: 'رقم الهاتف',
        email: 'البريد الإلكتروني',
        address: 'العنوان',
        actions: 'إجراءات',
        date: 'تاريخ الإضافة',
        save: 'حفظ العميل',
        cancel: 'إلغاء',
        empty: 'لا يوجد عملاء حالياً',
        loading: 'جاري تحميل العملاء...',
        success: 'تمت إضافة العميل بنجاح',
        error: 'حدث خطأ ما',
        confirmDelete: 'هل أنت متأكد من حذف العميل؟'
    },
    en: {
        title: 'Customer Management',
        subtitle: 'Studio customer database',
        addBtn: 'Add New Customer',
        search: 'Search by name or phone...',
        name: 'Customer Name',
        phone: 'Phone Number',
        email: 'Email',
        address: 'Address',
        actions: 'Actions',
        date: 'Join Date',
        save: 'Save Customer',
        cancel: 'Cancel',
        empty: 'No customers found',
        loading: 'Loading customers...',
        success: 'Customer added successfully',
        error: 'An error occurred',
        confirmDelete: 'Are you sure you want to delete this customer?'
    }
};

const CustomersPage: React.FC = () => {
    const { settings } = useSettings();
    const lang = settings.lang;
    const t = translations[lang];

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [formName, setFormName] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formAddress, setFormAddress] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await getCustomers();
            setCustomers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    const handleAdd = async () => {
        if (!formName || !formPhone) return;
        setSaving(true);
        try {
            await addCustomer({
                name: formName,
                phone: formPhone,
                email: formEmail,
                address: formAddress
            });
            setShowModal(false);
            fetchCustomers();
            setFormName(''); setFormPhone(''); setFormEmail(''); setFormAddress('');
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(t.confirmDelete)) return;
        try {
            await deleteCustomer(id);
            fetchCustomers();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="customers-page">
            <header className="customers-page-header">
                <div>
                    <h2 className="customers-page-title"><Users size={24} /> {t.title}</h2>
                    <p className="customers-page-subtitle">{t.subtitle}</p>
                </div>
                <button className="customers-add-btn" onClick={() => setShowModal(true)}>
                    <UserPlus size={18} /> {t.addBtn}
                </button>
            </header>

            <div className="customers-filters">
                <div className="customers-search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={t.search}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="customers-table-card">
                <div className="customers-table-wrapper">
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th>{t.name}</th>
                                <th>{t.phone}</th>
                                <th>{t.email}</th>
                                <th>{t.date}</th>
                                <th>{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="customers-loading"><Loader className="spin" /> {t.loading}</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>{t.empty}</td></tr>
                            ) : (
                                filtered.map(c => (
                                    <tr key={c.id}>
                                        <td>
                                            <div className="customer-name-cell">
                                                <div className="customer-avatar-sm">{c.name.charAt(0).toUpperCase()}</div>
                                                <span>{c.name}</span>
                                            </div>
                                        </td>
                                        <td>{c.phone}</td>
                                        <td>{c.email || '-'}</td>
                                        <td>{new Date(c.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="action-btn delete" onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal-content" initial={{ y: 20 }} animate={{ y: 0 }}>
                            <div className="modal-header">
                                <h3>{t.addBtn}</h3>
                                <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                            </div>
                            <div className="modal-body">
                                <div className="modal-field">
                                    <label>{t.name} *</label>
                                    <input value={formName} onChange={e => setFormName(e.target.value)} />
                                </div>
                                <div className="modal-field">
                                    <label>{t.phone} *</label>
                                    <input value={formPhone} onChange={e => setFormPhone(e.target.value)} />
                                </div>
                                <div className="modal-field">
                                    <label>{t.email}</label>
                                    <input value={formEmail} onChange={e => setFormEmail(e.target.value)} />
                                </div>
                                <div className="modal-field">
                                    <label>{t.address}</label>
                                    <textarea value={formAddress} onChange={e => setFormAddress(e.target.value)} rows={3} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>{t.cancel}</button>
                                <button className="modal-save-btn" onClick={handleAdd} disabled={saving}>
                                    {saving ? <Loader className="spin" size={16} /> : t.save}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomersPage;
