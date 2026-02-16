import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Save, Loader, AlertCircle, CheckCircle, Shield, Key } from 'lucide-react';
import { updateUser } from './api';
import { useSettings } from './SettingsContext';

interface AccountDetailsProps {
    user: { id: number; name: string; email: string; role: string };
    onUpdate: (updatedUser: any) => void;
}

const AccountDetailsPage: React.FC<AccountDetailsProps> = ({ user, onUpdate }) => {
    const { settings } = useSettings();
    const lang = settings.lang;

    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const t = {
        ar: {
            title: 'إعدادات الحساب',
            subtitle: 'تعديل بياناتك الشخصية وتأمين حسابك',
            personalInfo: 'المعلومات الشخصية',
            security: 'الأمان',
            name: 'الاسم الكامل',
            email: 'البريد الإلكتروني',
            newPassword: 'كلمة المرور الجديدة (اختياري)',
            passwordHint: 'اتركه فارغاً إذا كنت لا ترغب في التغيير',
            saveBtn: 'حفظ التغييرات',
            saving: 'جاري الحفظ...',
            successMsg: 'تم تحديث بيانات الحساب بنجاح',
            errorMsg: 'فشل تحديث البيانات، حاول مرة أخرى',
            role: 'نوع الحساب (الدور)'
        },
        en: {
            title: 'Account Settings',
            subtitle: 'Manage your personal information and security',
            personalInfo: 'Personal Information',
            security: 'Security',
            name: 'Full Name',
            email: 'Email Address',
            newPassword: 'New Password (Optional)',
            passwordHint: 'Leave blank to keep current password',
            saveBtn: 'Save Changes',
            saving: 'Saving...',
            successMsg: 'Account updated successfully',
            errorMsg: 'Failed to update account, try again',
            role: 'Account Role'
        }
    };

    const l = t[lang === 'ar' ? 'ar' : 'en'];

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const updateData: any = { name, email };
            if (password) updateData.password = password;

            await updateUser(user.id, updateData);
            onUpdate({ ...user, name, email });
            setMessage({ text: l.successMsg, type: 'success' });
            setPassword('');
        } catch (err) {
            console.error(err);
            setMessage({ text: l.errorMsg, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = "w-full px-4 py-3 bg-muted/50 border border-border rounded-2xl text-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-cairo";

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <header className="mb-8">
                <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <User size={20} className="text-primary" />
                    </div>
                    {l.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{l.subtitle}</p>
            </header>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Info */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Shield size={16} /> {l.personalInfo}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-2 ms-1">{l.name}</label>
                                <div className="relative group">
                                    <User className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} required
                                        className={inputClass + " ps-12"} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-2 ms-1">{l.email}</label>
                                <div className="relative group">
                                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                        className={inputClass + " ps-12"} dir="ltr" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-2 ms-1">{l.role}</label>
                                <div className="px-4 py-3 bg-muted/30 border border-border/50 rounded-2xl text-muted-foreground text-sm font-bold uppercase tracking-widest">
                                    {user.role}
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Security */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Key size={16} /> {l.security}
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-muted-foreground mb-2 ms-1">{l.newPassword}</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={inputClass} />
                            <p className="text-[10px] text-muted-foreground mt-2 ms-1">{l.passwordHint}</p>
                        </div>
                    </motion.section>
                </div>

                {message && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-2xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span className="text-sm font-bold">{message.text}</span>
                    </motion.div>
                )}

                <div className="flex justify-end">
                    <button type="submit" disabled={isSaving}
                        className="px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2">
                        {isSaving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                        {isSaving ? l.saving : l.saveBtn}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AccountDetailsPage;
