import React, { useState } from 'react';
import { login } from './api';
import { Loader, Mail, Lock, Aperture } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      onLogin(user, token);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'حدث خطأ في الاتصال بالخادم';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 fixed inset-0 overflow-hidden p-4 sm:p-5 font-cairo" dir="rtl">
      {/* Ambient glows */}
      <div className="absolute -top-40 -right-40 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-amber-500/8 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] animate-slide-up relative z-10">
        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-9">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-sky-500 to-cyan-400 shadow-lg shadow-sky-500/30">
              <Aperture size={26} className="text-white sm:hidden" />
              <Aperture size={30} className="text-white hidden sm:block" />
            </div>
            <h1 className="text-white text-2xl sm:text-[28px] font-extrabold tracking-tight mb-1.5 sm:mb-2">تسجيل الدخول</h1>
            <p className="text-slate-400 text-xs sm:text-sm">أهلاً بك مجدداً! يرجى إدخال بياناتك</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/70 text-xs font-semibold mb-2">البريد الإلكتروني</label>
              <div className="flex items-center gap-3 px-4 py-3.5 bg-black/20 border border-white/[0.08] rounded-xl transition-all focus-within:border-sky-500/50 focus-within:bg-black/30">
                <Mail size={18} className="text-slate-500 shrink-0" />
                <input type="email" placeholder="admin@studio.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading}
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm font-cairo placeholder:text-slate-600" />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-xs font-semibold mb-2">كلمة المرور</label>
              <div className="flex items-center gap-3 px-4 py-3.5 bg-black/20 border border-white/[0.08] rounded-xl transition-all focus-within:border-sky-500/50 focus-within:bg-black/30">
                <Lock size={18} className="text-slate-500 shrink-0" />
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading}
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm font-cairo placeholder:text-slate-600" />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-sky-500 cursor-pointer rounded" />
                <span>تذكرني</span>
              </label>
              <a href="#" className="text-sky-400 font-semibold hover:text-sky-300 transition-colors">نسيت كلمة المرور؟</a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white border-none rounded-xl text-base font-bold cursor-pointer font-cairo transition-all hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size={20} className="animate-spin" /> جاري الدخول...
                </span>
              ) : 'دخول'}
            </button>

            <div className="text-center mt-4 text-xs text-slate-500 space-y-2">
              <span className="block">بيانات الدخول الافتراضية:</span>
              <code className="block dir-ltr bg-sky-500/[0.08] px-3.5 py-2 rounded-lg text-sky-300 text-xs font-mono border border-sky-500/10" dir="ltr">
                admin@studio.com / admin123
              </code>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
