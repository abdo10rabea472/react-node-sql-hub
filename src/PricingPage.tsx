import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Plus, Edit3, Trash2, CheckCircle, Image as ImageIcon,
    DollarSign, FileText, X, Save, AlertCircle, Loader
} from 'lucide-react';
import { useSettings } from './SettingsContext';
import { getPackages, createPackage, updatePackage, deletePackage } from './api';
import './PricingPage.css';

interface PricingPackage {
    id: number;
    type: string;
    price: number;
    photo_count: number;
    sizes: string[];
    color: string;
}

const COLORS = ['#4F46E5', '#F97316', '#10B981', '#FBBF24', '#EC4899'];

const translations = {
    ar: {
        title: 'باقات التصوير والأسعار',
        subtitle: 'إدارة أنواع التصوير، الأحجام، والأسعار الخاصة بالاستوديو',
        addPackage: 'إضافة باقة جديدة',
        editPackage: 'تعديل الباقة',
        packageType: 'نوع التصوير',
        price: 'السعر',
        photosIncluded: 'عدد الصور المشمولة',
        sizes: 'الأحجام والأنواع المتاحة',
        save: 'حفظ الباقة',
        cancel: 'إلغاء',
        delete: 'حذف',
        invoicePreview: 'معاينة الفاتورة',
        generateInvoice: 'توليد فاتورة تجريبية',
        placeholderType: 'مثال: تصوير بورتريه، زفاف...',
        empty: 'لا توجد باقات حالياً. ابدأ بإضافة واحدة!',
        total: 'الإجمالي',
        date: 'التاريخ',
        invoiceNo: 'رقم الفاتورة',
        portrait: 'بورتريه',
        family: 'عائلي',
        loading: 'جاري تحميل الباقات...',
    },
    en: {
        title: 'Photography Pricing & Packages',
        subtitle: 'Manage photography types, sizes, and studio pricing',
        addPackage: 'Add New Package',
        editPackage: 'Edit Package',
        packageType: 'Photography Type',
        price: 'Price',
        photosIncluded: 'Photos Included',
        sizes: 'Available Sizes & Formats',
        save: 'Save Package',
        cancel: 'Cancel',
        delete: 'Delete',
        invoicePreview: 'Invoice Preview',
        generateInvoice: 'Generate Mock Invoice',
        placeholderType: 'e.g. Portrait, Wedding...',
        empty: 'No packages yet. Start by adding one!',
        total: 'Total',
        date: 'Date',
        invoiceNo: 'Invoice No',
        portrait: 'Portrait',
        family: 'Family',
        loading: 'Loading packages...',
    }
};

const PricingPage: React.FC = () => {
    const { settings } = useSettings();
    const lang = settings.lang;
    const currentCurrency = settings.currency;
    const t = translations[lang];

    const [packages, setPackages] = useState<PricingPackage[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null);
    const [selectedPreview, setSelectedPreview] = useState<PricingPackage | null>(null);

    const [formType, setFormType] = useState('');
    const [formPrice, setFormPrice] = useState<number>(0);
    const [formPhotos, setFormPhotos] = useState<number>(0);
    const [formSizesText, setFormSizesText] = useState('');

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const res = await getPackages();
            setPackages(res.data);
        } catch (err) {
            console.error("Failed to fetch packages:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const activePreview = isModalOpen ? {
        id: editingPackage?.id || 999,
        type: formType || (lang === 'ar' ? 'نوع الباقة...' : 'Package Type...'),
        price: formPrice || 0,
        photo_count: formPhotos || 0,
        sizes: formSizesText.split('\n').filter(s => s.trim() !== ''),
        color: editingPackage?.color || '#4F46E5'
    } : selectedPreview;

    const openModal = (pkg?: PricingPackage) => {
        if (pkg) {
            setEditingPackage(pkg);
            setFormType(pkg.type);
            setFormPrice(pkg.price);
            setFormPhotos(pkg.photo_count);
            setFormSizesText(pkg.sizes.join('\n'));
        } else {
            setEditingPackage(null);
            setFormType('');
            setFormPrice(0);
            setFormPhotos(0);
            setFormSizesText('');
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        const sizesArray = formSizesText.split('\n').filter(s => s.trim() !== '');
        const data = {
            type: formType,
            price: formPrice,
            photo_count: formPhotos,
            sizes: sizesArray,
            color: editingPackage?.color || COLORS[packages.length % COLORS.length]
        };

        try {
            if (editingPackage) {
                await updatePackage(editingPackage.id, data);
            } else {
                await createPackage(data);
            }
            fetchPackages();
            setIsModalOpen(false);
            setSelectedPreview(null);
        } catch (err) {
            console.error("Failed to save package:", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
        try {
            await deletePackage(id);
            fetchPackages();
            if (selectedPreview?.id === id) setSelectedPreview(null);
        } catch (err) {
            console.error("Failed to delete package:", err);
        }
    };

    return (
        <div className="pricing-page">
            <header className="pricing-header">
                <div className="pricing-header-info">
                    <div className="pricing-logo">
                        <Camera size={28} />
                        <span>{settings.studioName}</span>
                    </div>
                    <h1 className="pricing-title">{t.title}</h1>
                    <p className="pricing-subtitle">{t.subtitle}</p>
                </div>
                <button className="add-pkg-btn" onClick={() => openModal()}><Plus size={20} /> <span>{t.addPackage}</span></button>
            </header>

            <div className="pricing-main-layout">
                <div className="packages-grid">
                    {loading ? (
                        <div className="loading-state">
                            <Loader className="spin" size={32} />
                            <p>{t.loading}</p>
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="empty-state"><AlertCircle size={48} /><p>{t.empty}</p></div>
                    ) : (
                        packages.map((pkg, idx) => (
                            <motion.div key={pkg.id} className="pkg-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} style={{ '--pkg-color': pkg.color } as any} onClick={() => setSelectedPreview(pkg)}>
                                <div className="pkg-card-header">
                                    <h3 className="pkg-type">{pkg.type}</h3>
                                    <div className="pkg-actions" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => openModal(pkg)} title={t.editPackage}><Edit3 size={16} /></button>
                                        <button onClick={() => handleDelete(pkg.id)} title={t.delete}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="pkg-card-price"><span className="amount">{pkg.price}</span> <span className="currency">{currentCurrency}</span></div>
                                <div className="pkg-features">
                                    <div className="feature"><CheckCircle size={16} /> <span>{pkg.photo_count} {t.photosIncluded}</span></div>
                                    <div className="pkg-sizes-brief">
                                        {pkg.sizes.slice(0, 2).map(s => <span key={s} className="size-tag">{s}</span>)}
                                        {pkg.sizes.length > 2 && <span className="size-tag">+{pkg.sizes.length - 2}</span>}
                                    </div>
                                </div>
                                <button className="preview-invoice-btn"><FileText size={16} /> <span>{t.invoicePreview}</span></button>
                            </motion.div>
                        ))
                    )}
                </div>

                <aside className="preview-sidebar">
                    <AnimatePresence mode="wait">
                        {activePreview ? (
                            <motion.div key={activePreview.id + activePreview.type} className="invoice-preview-card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                {isModalOpen && <div className="live-badge">LIVE SYNC</div>}
                                <div className="invoice-header">
                                    <div className="invoice-logo"><Camera size={20} /> <span>{settings.studioName.split(' ')[0]}</span></div>
                                    <div className="invoice-badge">PRO-FORMA</div>
                                </div>
                                <div className="invoice-details">
                                    <div className="invoice-row"><span>{t.invoiceNo}</span> <strong>#INV-2026-001</strong></div>
                                    <div className="invoice-row"><span>{t.date}</span> <strong>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</strong></div>
                                </div>
                                <div className="invoice-divider" />
                                <div className="invoice-item">
                                    <div className="item-main"><strong>{activePreview.type}</strong> <p>{activePreview.photo_count} {t.photosIncluded}</p></div>
                                    <div className="item-price">{activePreview.price} {currentCurrency}</div>
                                </div>
                                <div className="invoice-sub-items">
                                    {activePreview.sizes.map((s, i) => <div key={i} className="sub-item"><span>Format: {s}</span> <span>Incl.</span></div>)}
                                    {activePreview.sizes.length === 0 && <p className="no-sizes-hint">Ready for your sizes...</p>}
                                </div>
                                <div className="invoice-divider" />
                                <div className="invoice-total"><span>{t.total}</span> <span className="total-amount">{activePreview.price} {currentCurrency}</span></div>
                                <p className="invoice-footer">Premium Photography Experience</p>
                            </motion.div>
                        ) : (
                            <div className="preview-placeholder"><ImageIcon size={48} /><p>{t.generateInvoice}</p></div>
                        )}
                    </AnimatePresence>
                </aside>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                        <motion.div className="pricing-modal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header"><h2>{editingPackage ? t.editPackage : t.addPackage}</h2> <button onClick={() => setIsModalOpen(false)}><X size={20} /></button></div>
                            <div className="modal-body">
                                <div className="form-group"><label>{t.packageType}</label> <div className="input-with-icon"><Camera size={18} /><input value={formType} onChange={e => setFormType(e.target.value)} placeholder={t.placeholderType} /></div></div>
                                <div className="form-row">
                                    <div className="form-group"><label>{t.price} ({currentCurrency})</label> <div className="input-with-icon"><DollarSign size={18} /><input type="number" value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} /></div></div>
                                    <div className="form-group"><label>{t.photosIncluded}</label> <div className="input-with-icon"><ImageIcon size={18} /><input type="number" value={formPhotos} onChange={e => setFormPhotos(Number(e.target.value))} /></div></div>
                                </div>
                                <div className="form-group"><label>{t.sizes} (اكتب كل حجم في سطر جديد)</label> <textarea className="sizes-textarea-manual" placeholder="مثال:&#10;4x6 Prints&#10;12x18 Canvas&#10;Digital USB..." value={formSizesText} onChange={e => setFormSizesText(e.target.value)} /></div>
                            </div>
                            <div className="modal-footer"><button className="modal-btn-cancel" onClick={() => setIsModalOpen(false)}>{t.cancel}</button> <button className="modal-btn-save" onClick={handleSave}><Save size={18} /> {t.save}</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PricingPage;
