import React, { useState } from 'react';
import { login } from './api';
import './Login.css';

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
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>تسجيل الدخول</h1>
                    <p>أهلاً بك مجدداً! يرجى إدخال بياناتك</p>
                </div>

                {error && (
                    <div className="login-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">البريد الإلكتروني</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="admin@studio.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">كلمة المرور</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-options">
                        <label className="remember-me">
                            <input type="checkbox" />
                            <span>تذكرني</span>
                        </label>
                        <a href="#" className="forgot-password">
                            نسيت كلمة المرور؟
                        </a>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'جاري الدخول...' : 'دخول'}
                    </button>

                    <div className="login-hint">
                        <span>بيانات الدخول الافتراضية:</span>
                        <code>admin@studio.com / admin123</code>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
