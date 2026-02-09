import { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, Search, Edit3, Trash2, X, Shield,
    ShieldCheck, User as UserIcon, CheckCircle, XCircle, Ban,
    ChevronLeft, ChevronRight, AlertTriangle, Loader
} from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from './api';
import { useSettings } from './SettingsContext';
import './UsersPage.css';


interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    updated_at: string;
}




const t = {
    ar: {
        title: 'إدارة المستخدمين',
        subtitle: 'عرض وإدارة جميع المستخدمين في النظام',
        addUser: 'إضافة مستخدم',
        search: 'ابحث بالاسم أو البريد...',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        role: 'الدور',
        status: 'الحالة',
        actions: 'إجراءات',
        joinDate: 'تاريخ الانضمام',
        admin: 'مدير',
        editor: 'محرر',
        user: 'مستخدم',
        active: 'نشط',
        inactive: 'غير نشط',
        banned: 'محظور',
        edit: 'تعديل',
        delete: 'حذف',
        save: 'حفظ',
        cancel: 'إلغاء',
        confirmDelete: 'هل أنت متأكد من حذف هذا المستخدم؟',
        yes: 'نعم، احذف',
        no: 'لا، إلغاء',
        noUsers: 'لا يوجد مستخدمين',
        total: 'المجموع',
        addUserTitle: 'إضافة مستخدم جديد',
        editUserTitle: 'تعديل المستخدم',
        allRoles: 'جميع الأدوار',
        allStatuses: 'جميع الحالات',
        loading: 'جاري التحميل...',
        errorLoad: 'خطأ في تحميل البيانات',
        retry: 'إعادة المحاولة',
        success: 'تمت العملية بنجاح',
        errorOp: 'حدث خطأ',
    },
    en: {
        title: 'User Management',
        subtitle: 'View and manage all system users',
        addUser: 'Add User',
        search: 'Search by name or email...',
        name: 'Name',
        email: 'Email',
        password: 'Password',
        role: 'Role',
        status: 'Status',
        actions: 'Actions',
        joinDate: 'Join Date',
        admin: 'Admin',
        editor: 'Editor',
        user: 'User',
        active: 'Active',
        inactive: 'Inactive',
        banned: 'Banned',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        confirmDelete: 'Are you sure you want to delete this user?',
        yes: 'Yes, Delete',
        no: 'No, Cancel',
        noUsers: 'No users found',
        total: 'Total',
        addUserTitle: 'Add New User',
        editUserTitle: 'Edit User',
        allRoles: 'All Roles',
        allStatuses: 'All Statuses',
        loading: 'Loading...',
        errorLoad: 'Error loading data',
        retry: 'Retry',
        success: 'Operation successful',
        errorOp: 'An error occurred',
    }
};

const ITEMS_PER_PAGE = 8;

const UsersPage: React.FC = () => {
    const { settings } = useSettings();
    const lang = settings.lang;
    const l = t[lang];

    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formRole, setFormRole] = useState('user');
    const [formStatus, setFormStatus] = useState('active');

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getUsers();
            setUsers(res.data);
        } catch {
            setError(l.errorLoad);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Show toast
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Filter & search
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase())
            || u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = !filterRole || u.role === filterRole;
        const matchesStatus = !filterStatus || u.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [searchQuery, filterRole, filterStatus]);

    // Open add modal
    const openAddModal = () => {
        setFormName(''); setFormEmail(''); setFormPassword(''); setFormRole('user'); setFormStatus('active');
        setShowAddModal(true);
    };

    // Open edit modal
    const openEditModal = (user: UserData) => {
        setFormName(user.name); setFormEmail(user.email); setFormPassword('');
        setFormRole(user.role); setFormStatus(user.status);
        setEditingUser(user);
    };

    // Handle add
    const handleAdd = async () => {
        if (!formName || !formEmail || !formPassword) return;
        setSaving(true);
        try {
            await createUser({ name: formName, email: formEmail, password: formPassword, role: formRole });
            showToast(l.success, 'success');
            setShowAddModal(false);
            fetchUsers();
        } catch (err: any) {
            showToast(err.response?.data?.message || l.errorOp, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Handle edit
    const handleEdit = async () => {
        if (!editingUser) return;
        setSaving(true);
        try {
            const data: Record<string, string> = { name: formName, email: formEmail, role: formRole, status: formStatus };
            if (formPassword) data.password = formPassword;
            await updateUser(editingUser.id, data);
            showToast(l.success, 'success');
            setEditingUser(null);
            fetchUsers();
        } catch (err: any) {
            showToast(err.response?.data?.message || l.errorOp, 'error');
        } finally {
            setSaving(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deletingUser) return;
        setSaving(true);
        try {
            await deleteUser(deletingUser.id);
            showToast(l.success, 'success');
            setDeletingUser(null);
            fetchUsers();
        } catch (err: any) {
            showToast(err.response?.data?.message || l.errorOp, 'error');
        } finally {
            setSaving(false);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <ShieldCheck size={14} />;
            case 'editor': return <Shield size={14} />;
            default: return <UserIcon size={14} />;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return l.admin;
            case 'editor': return l.editor;
            default: return l.user;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle size={14} />;
            case 'inactive': return <XCircle size={14} />;
            default: return <Ban size={14} />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return l.active;
            case 'inactive': return l.inactive;
            default: return l.banned;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    };

    // Loading state
    if (loading) {
        return (
            <div className="users-loading">
                <Loader size={32} className="spin" />
                <p>{l.loading}</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="users-error">
                <AlertTriangle size={40} />
                <p>{error}</p>
                <button onClick={fetchUsers} className="retry-btn">{l.retry}</button>
            </div>
        );
    }

    return (
        <div className="users-page">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        className={`users-toast ${toast.type}`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="users-page-header">
                <div>
                    <h2 className="users-page-title">
                        <Users size={24} />
                        {l.title}
                    </h2>
                    <p className="users-page-subtitle">{l.subtitle}</p>
                </div>
                <button className="users-add-btn" onClick={openAddModal}>
                    <UserPlus size={18} />
                    {l.addUser}
                </button>
            </div>

            {/* Filters */}
            <div className="users-filters">
                <div className="users-search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={l.search}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="users-select">
                    <option value="">{l.allRoles}</option>
                    <option value="admin">{l.admin}</option>
                    <option value="editor">{l.editor}</option>
                    <option value="user">{l.user}</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="users-select">
                    <option value="">{l.allStatuses}</option>
                    <option value="active">{l.active}</option>
                    <option value="inactive">{l.inactive}</option>
                    <option value="banned">{l.banned}</option>
                </select>
                <span className="users-count">{l.total}: {filteredUsers.length}</span>
            </div>

            {/* Table */}
            <div className="users-table-card">
                <div className="users-table-wrapper">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{l.name}</th>
                                <th>{l.email}</th>
                                <th>{l.role}</th>
                                <th>{l.status}</th>
                                <th>{l.joinDate}</th>
                                <th>{l.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="users-empty">{l.noUsers}</td>
                                </tr>
                            ) : (
                                paginatedUsers.map((u, idx) => (
                                    <motion.tr
                                        key={u.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <td className="td-id">{u.id}</td>
                                        <td>
                                            <div className="user-name-cell">
                                                <div className="user-avatar-sm">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span>{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="td-email">{u.email}</td>
                                        <td>
                                            <span className={`role-badge role-${u.role}`}>
                                                {getRoleIcon(u.role)} {getRoleLabel(u.role)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${u.status}`}>
                                                {getStatusIcon(u.status)} {getStatusLabel(u.status)}
                                            </span>
                                        </td>
                                        <td className="td-date">{formatDate(u.created_at)}</td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="action-btn edit" onClick={() => openEditModal(u)} title={l.edit}>
                                                    <Edit3 size={15} />
                                                </button>
                                                <button className="action-btn delete" onClick={() => setDeletingUser(u)} title={l.delete}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="users-pagination">
                        <button
                            className="page-btn"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            {lang === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                                onClick={() => setPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            className="page-btn"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            {lang === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            <AnimatePresence>
                {(showAddModal || editingUser) && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setShowAddModal(false); setEditingUser(null); }}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>{editingUser ? l.editUserTitle : l.addUserTitle}</h3>
                                <button className="modal-close" onClick={() => { setShowAddModal(false); setEditingUser(null); }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="modal-field">
                                    <label>{l.name}</label>
                                    <input value={formName} onChange={e => setFormName(e.target.value)} placeholder={l.name} />
                                </div>
                                <div className="modal-field">
                                    <label>{l.email}</label>
                                    <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder={l.email} />
                                </div>
                                <div className="modal-field">
                                    <label>{l.password} {editingUser && `(${lang === 'ar' ? 'اتركه فارغاً لعدم التغيير' : 'leave blank to keep'})`}</label>
                                    <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="••••••••" />
                                </div>
                                <div className="modal-row">
                                    <div className="modal-field">
                                        <label>{l.role}</label>
                                        <select value={formRole} onChange={e => setFormRole(e.target.value)}>
                                            <option value="user">{l.user}</option>
                                            <option value="editor">{l.editor}</option>
                                            <option value="admin">{l.admin}</option>
                                        </select>
                                    </div>
                                    {editingUser && (
                                        <div className="modal-field">
                                            <label>{l.status}</label>
                                            <select value={formStatus} onChange={e => setFormStatus(e.target.value)}>
                                                <option value="active">{l.active}</option>
                                                <option value="inactive">{l.inactive}</option>
                                                <option value="banned">{l.banned}</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="modal-cancel-btn" onClick={() => { setShowAddModal(false); setEditingUser(null); }}>
                                    {l.cancel}
                                </button>
                                <button className="modal-save-btn" onClick={editingUser ? handleEdit : handleAdd} disabled={saving}>
                                    {saving ? <Loader size={16} className="spin" /> : null}
                                    {l.save}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingUser && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDeletingUser(null)}
                    >
                        <motion.div
                            className="modal-content modal-sm"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="delete-confirm">
                                <div className="delete-icon-wrap">
                                    <AlertTriangle size={32} />
                                </div>
                                <p>{l.confirmDelete}</p>
                                <p className="delete-user-name">{deletingUser.name} ({deletingUser.email})</p>
                                <div className="delete-actions">
                                    <button className="modal-cancel-btn" onClick={() => setDeletingUser(null)}>{l.no}</button>
                                    <button className="modal-delete-btn" onClick={handleDelete} disabled={saving}>
                                        {saving ? <Loader size={16} className="spin" /> : <Trash2 size={16} />}
                                        {l.yes}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UsersPage;
