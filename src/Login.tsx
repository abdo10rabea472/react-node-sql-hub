import React, { useState } from 'react';
import { login, getUsers } from './api';
import { Loader, Mail, Lock, Aperture, Users, X, User, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron');
const STAFF_CACHE_KEY = 'eltahan_staff_cache';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick login state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [staffPassword, setStaffPassword] = useState('');
  const [staffError, setStaffError] = useState('');
  const [staffLoginLoading, setStaffLoginLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      // بعد الدخول بنجاح: نحدّث كاش الموظفين
      if (isElectron) {
        try {
          const usersRes = await getUsers();
          const activeUsers = (usersRes.data || []).filter((u: StaffUser) => u.status === 'active');
          localStorage.setItem(STAFF_CACHE_KEY, JSON.stringify(activeUsers.map((u: StaffUser) => ({
            id: u.id, name: u.name, email: u.email, role: u.role, status: u.status
          }))));
        } catch { /* ignore */ }
      }
      onLogin(user, token);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ في الاتصال بالخادم';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openStaffModal = async () => {
    setShowStaffModal(true);
    setSelectedStaff(null);
    setStaffPassword('');
    setStaffError('');
    setStaffLoading(true);

    // أولاً: نحاول نجيب من السيرفر
    try {
      const res = await getUsers();
      const activeUsers = (res.data || []).filter((u: StaffUser) => u.status === 'active');
      setStaffList(activeUsers);
      // نحدّث الكاش
      localStorage.setItem(STAFF_CACHE_KEY, JSON.stringify(activeUsers.map((u: StaffUser) => ({
        id: u.id, name: u.name, email: u.email, role: u.role, status: u.status
      }))));
    } catch {
      // فشل السيرفر: نستخدم الكاش المحلي
      try {
        const cached = localStorage.getItem(STAFF_CACHE_KEY);
        if (cached) {
          setStaffList(JSON.parse(cached));
        } else {
          setStaffList([]);
        }
      } catch {
        setStaffList([]);
      }
    } finally {
      setStaffLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !staffPassword) return;
    setStaffError('');
    setStaffLoginLoading(true);
    try {
      const res = await login(selectedStaff.email, staffPassword);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      onLogin(user, token);
    } catch (err: any) {
      setStaffError(err.response?.data?.message || 'كلمة المرور غير صحيحة');
    } finally {
      setStaffLoginLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير';
      case 'editor': return 'محرر';
      default: return 'مشاهد';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'editor': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[hsl(262,50%,8%)] via-[hsl(260,30%,12%)] to-[hsl(240,25%,6%)] fixed inset-0 overflow-hidden p-4 sm:p-5 font-cairo" dir="rtl">
      {/* Ambient glows */}
      <div className="absolute -top-40 -right-40 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-accent/8 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] animate-slide-up relative z-10">
        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-9">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <Aperture size={26} className="text-white sm:hidden" />
              <Aperture size={30} className="text-white hidden sm:block" />
            </div>
            <h1 className="text-white text-2xl sm:text-[28px] font-extrabold tracking-tight mb-1.5 sm:mb-2">تسجيل الدخول</h1>
            <p className="text-slate-400 text-xs sm:text-sm">أهلاً بك مجدداً! يرجى إدخال بياناتك</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-red-300 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/70 text-xs font-semibold mb-2">البريد الإلكتروني</label>
              <div className="flex items-center gap-3 px-4 py-3.5 bg-black/20 border border-white/[0.08] rounded-xl transition-all focus-within:border-primary/50 focus-within:bg-black/30">
                <Mail size={18} className="text-slate-500 shrink-0" />
                <input type="email" placeholder="admin@studio.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading}
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm font-cairo placeholder:text-slate-600" />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-xs font-semibold mb-2">كلمة المرور</label>
              <div className="flex items-center gap-3 px-4 py-3.5 bg-black/20 border border-white/[0.08] rounded-xl transition-all focus-within:border-primary/50 focus-within:bg-black/30">
                <Lock size={18} className="text-slate-500 shrink-0" />
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading}
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm font-cairo placeholder:text-slate-600" />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-primary cursor-pointer rounded" />
                <span>تذكرني</span>
              </label>
              <a href="#" className="text-primary font-semibold hover:text-primary/80 transition-colors">نسيت كلمة المرور؟</a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-accent text-white border-none rounded-xl text-base font-bold cursor-pointer font-cairo transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size={20} className="animate-spin" /> جاري الدخول...
                </span>
              ) : 'دخول'}
            </button>

            {/* Quick Staff Login Button - Desktop Only */}
            {isElectron && (
              <button
                type="button"
                onClick={openStaffModal}
                className="w-full py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] hover:border-primary/30 text-slate-300 hover:text-white rounded-xl text-sm font-bold cursor-pointer font-cairo transition-all flex items-center justify-center gap-2"
              >
                <Users size={18} />
                حسابات الموظفين - دخول سريع
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Staff Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowStaffModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[hsl(260,30%,12%)] border border-white/[0.1] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
              dir="rtl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  {selectedStaff && (
                    <button onClick={() => { setSelectedStaff(null); setStaffPassword(''); setStaffError(''); }} className="text-slate-400 hover:text-white transition-colors">
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <Users size={20} className="text-primary" />
                  <h2 className="text-white font-bold text-base">
                    {selectedStaff ? selectedStaff.name : 'اختر حسابك'}
                  </h2>
                </div>
                <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5">
                {staffLoading ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader size={24} className="animate-spin text-primary" />
                    <p className="text-slate-400 text-sm">جاري تحميل الحسابات...</p>
                  </div>
                ) : !selectedStaff ? (
                  /* Staff List */
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {staffList.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-6">لا يوجد حسابات متاحة</p>
                    ) : staffList.map(staff => (
                      <button
                        key={staff.id}
                        onClick={() => { setSelectedStaff(staff); setStaffPassword(''); setStaffError(''); }}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-primary/30 transition-all text-right group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                          <User size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{staff.name}</p>
                          <p className="text-slate-500 text-xs truncate" dir="ltr">{staff.email}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-lg border font-semibold ${getRoleColor(staff.role)}`}>
                          {getRoleLabel(staff.role)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Password Form */
                  <form onSubmit={handleStaffLogin} className="space-y-4">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-primary/[0.08] border border-primary/20">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                        <User size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">{selectedStaff.name}</p>
                        <p className="text-slate-400 text-xs" dir="ltr">{selectedStaff.email}</p>
                      </div>
                    </div>

                    {staffError && (
                      <div className="bg-destructive/10 border border-destructive/20 text-red-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                        <span>⚠️</span> {staffError}
                      </div>
                    )}

                    <div>
                      <label className="block text-white/70 text-xs font-semibold mb-2">كلمة المرور</label>
                      <div className="flex items-center gap-3 px-4 py-3.5 bg-black/20 border border-white/[0.08] rounded-xl transition-all focus-within:border-primary/50 focus-within:bg-black/30">
                        <Lock size={18} className="text-slate-500 shrink-0" />
                        <input
                          type="password"
                          placeholder="أدخل كلمة المرور"
                          value={staffPassword}
                          onChange={e => setStaffPassword(e.target.value)}
                          required
                          autoFocus
                          disabled={staffLoginLoading}
                          className="flex-1 bg-transparent border-none outline-none text-white text-sm font-cairo placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={staffLoginLoading || !staffPassword}
                      className="w-full py-3.5 bg-gradient-to-r from-primary to-accent text-white border-none rounded-xl text-sm font-bold cursor-pointer font-cairo transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {staffLoginLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader size={18} className="animate-spin" /> جاري الدخول...
                        </span>
                      ) : 'دخول'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
