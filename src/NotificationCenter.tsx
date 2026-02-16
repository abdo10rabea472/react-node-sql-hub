import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Info, AlertTriangle, Clock, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useSettings } from './SettingsContext';

const API_URL = "/api";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    time: string;
    read: boolean;
}

const NotificationCenter = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { settings } = useSettings();
    const lang = settings.lang;
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchRealActivities = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/activity`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Map activities to notifications
            const mapped = res.data.slice(0, 15).map((a: any) => ({
                id: a.id,
                title: a.entity_type === 'invoice' ? (lang === 'ar' ? 'عملية فاتورة' : 'Invoice Action') :
                    a.entity_type === 'user' ? (lang === 'ar' ? 'إدارة مستخدمين' : 'User Management') :
                        (lang === 'ar' ? 'نشاط نظام' : 'System Activity'),
                message: a.action,
                type: a.action.includes('حذف') || a.action.includes('Delete') ? 'error' :
                    a.action.includes('إنشاء') || a.action.includes('Create') ? 'success' : 'info',
                time: formatDate(a.created_at),
                read: false
            }));
            setNotifications(mapped);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return lang === 'ar' ? 'الآن' : 'Now';
        if (diffInSeconds < 3600) return lang === 'ar' ? `منذ ${Math.floor(diffInSeconds / 60)} دقيقة` : `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return lang === 'ar' ? `منذ ${Math.floor(diffInSeconds / 3600)} ساعة` : `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
    };

    useEffect(() => {
        if (isOpen) fetchRealActivities();
    }, [isOpen]);

    const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const clearAll = () => setNotifications([]);
    const deleteId = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check className="text-emerald-500" size={16} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={16} />;
            case 'error': return <X className="text-rose-500" size={16} />;
            default: return <Info className="text-sky-500" size={16} />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9900]" onClick={onClose} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10, x: 0 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="fixed top-16 end-4 sm:end-8 w-[340px] sm:w-[380px] bg-card border border-border rounded-2xl shadow-2xl z-[9901] overflow-hidden flex flex-col max-h-[500px]">

                        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Bell size={18} />
                                </div>
                                <h3 className="font-bold text-sm">التنبيهات</h3>
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                        {notifications.filter(n => !n.read).length}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={markAllRead} className="text-[10px] font-bold text-primary hover:bg-primary/5 px-2 py-1 rounded-md transition-all">تحديد الكل كمقروء</button>
                                <button onClick={onClose} className="p-1 px-2 rounded-lg text-muted-foreground hover:bg-muted transition-all"><X size={16} /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground opacity-50 flex flex-col items-center gap-2">
                                    <Clock size={32} strokeWidth={1.5} />
                                    <p className="text-xs font-medium">لا توجد تنبيهات جديدة</p>
                                </div>
                            ) : notifications.map(n => (
                                <motion.div key={n.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${n.read ? 'bg-card border-transparent opacity-70' : 'bg-muted/50 border-border shadow-sm'}`}>
                                    <div className="flex gap-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-card border border-border shadow-sm`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-xs font-bold truncate pr-6">{n.title}</h4>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{n.time}</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteId(n.id); }}
                                        className="absolute top-2 left-2 p-1.5 rounded-md text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={12} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 bg-muted/20 border-t border-border text-center">
                                <button onClick={clearAll} className="text-[11px] font-bold text-muted-foreground hover:text-rose-500 transition-all flex items-center justify-center gap-1.5 mx-auto">
                                    <Trash2 size={12} /> مسح جميع التنبيهات
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationCenter;
