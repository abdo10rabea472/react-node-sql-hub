import React, { useState } from 'react';
import { login } from './api';
import { Loader, Mail, Lock, Zap } from 'lucide-react';

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
        <div style={{
            minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(145deg, #0a0e1a 0%, #131738 50%, #0d1025 100%)',
            fontFamily: "'Cairo', sans-serif", direction: 'rtl', margin: 0, padding: 20,
            boxSizing: 'border-box', position: 'fixed', top: 0, left: 0, overflow: 'hidden',
        }}>
            {/* Ambient glows */}
            <div style={{
                position: 'absolute', top: -200, right: -200, width: 600, height: 600, pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)'
            }} />
            <div style={{
                position: 'absolute', bottom: -200, left: -200, width: 500, height: 500, pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)'
            }} />

            {/* Login Card */}
            <div style={{
                background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: 48, width: '100%', maxWidth: 440,
                boxShadow: '0 25px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 1px 0 rgba(255,255,255,0.05) inset',
                animation: 'slideUp 0.7s cubic-bezier(0.16,1,0.3,1)', position: 'relative', zIndex: 1,
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{
                        width: 56, height: 56, margin: '0 auto 16px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #6366f1, #7c3aed)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    }}>
                        <Zap size={28} color="white" />
                    </div>
                    <h1 style={{ color: '#f1f5f9', fontSize: 30, fontWeight: 800, letterSpacing: -0.3, marginBottom: 8 }}>تسجيل الدخول</h1>
                    <p style={{ color: '#64748b', fontSize: 15, fontWeight: 400 }}>أهلاً بك مجدداً! يرجى إدخال بياناتك</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5',
                        padding: '12px 16px', borderRadius: 12, fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 22 }}>
                        <label style={{ display: 'block', color: 'rgba(241,245,249,0.8)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>البريد الإلكتروني</label>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(0,0,0,0.25)',
                            border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 14, transition: 'all 0.25s',
                        }}>
                            <Mail size={18} style={{ color: '#64748b', flexShrink: 0 }} />
                            <input type="email" placeholder="admin@studio.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading}
                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 15, fontFamily: 'inherit' }} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 22 }}>
                        <label style={{ display: 'block', color: 'rgba(241,245,249,0.8)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>كلمة المرور</label>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(0,0,0,0.25)',
                            border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 14, transition: 'all 0.25s',
                        }}>
                            <Lock size={18} style={{ color: '#64748b', flexShrink: 0 }} />
                            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading}
                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 15, fontFamily: 'inherit' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, fontSize: 13 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6366f1' }} />
                            <span>تذكرني</span>
                        </label>
                        <a href="#" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>نسيت كلمة المرور؟</a>
                    </div>

                    <button type="submit" disabled={loading} style={{
                        width: '100%', padding: 15, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white',
                        border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', marginBottom: 20, opacity: loading ? 0.6 : 1, transition: 'all 0.3s',
                    }}>
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <Loader size={20} className="spin" /> جاري الدخول...
                            </span>
                        ) : 'دخول'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span>بيانات الدخول الافتراضية:</span>
                        <code style={{
                            direction: 'ltr', background: 'rgba(99,102,241,0.08)', padding: '8px 14px', borderRadius: 10,
                            color: '#a5b4fc', fontSize: 13, fontFamily: "'SF Mono','Fira Code',monospace", border: '1px solid rgba(99,102,241,0.12)',
                        }}>admin@studio.com / admin123</code>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
