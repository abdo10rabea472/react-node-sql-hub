import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Monitor, Apple, CheckCircle, Share } from 'lucide-react';
import { useSettings } from './SettingsContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { settings } = useSettings();
  const lang = settings.lang;
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <header className="mb-7">
        <button onClick={onBack} className="text-sm text-primary mb-3 hover:underline">
          ← {lang === 'ar' ? 'رجوع' : 'Back'}
        </button>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
          {lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === 'ar' ? 'ثبّت التطبيق على جهازك للوصول السريع والعمل بدون إنترنت' : 'Install on your device for quick access and offline use'}
        </p>
      </header>

      {isInstalled ? (
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">{lang === 'ar' ? 'التطبيق مثبت بالفعل! ✓' : 'App Already Installed! ✓'}</h2>
          <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'يمكنك فتح التطبيق من الشاشة الرئيسية' : 'You can open the app from your home screen'}</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Desktop / Android Install */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Monitor size={20} className="text-primary" /></div>
              <div>
                <h3 className="font-bold text-foreground">{lang === 'ar' ? 'Desktop و Android' : 'Desktop & Android'}</h3>
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'تثبيت مباشر من المتصفح' : 'Direct install from browser'}</p>
              </div>
            </div>
            {deferredPrompt ? (
              <button onClick={handleInstall} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                <Download size={18} />{lang === 'ar' ? 'تثبيت التطبيق الآن' : 'Install App Now'}
              </button>
            ) : (
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {lang === 'ar' ? 'استخدم قائمة المتصفح > "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"' : 'Use browser menu > "Install app" or "Add to Home Screen"'}
                </p>
              </div>
            )}
          </motion.div>

          {/* iOS Install */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><Apple size={20} className="text-foreground" /></div>
              <div>
                <h3 className="font-bold text-foreground">iPhone / iPad</h3>
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'عبر Safari' : 'Via Safari'}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { step: '1', text: lang === 'ar' ? 'افتح التطبيق في Safari' : 'Open app in Safari' },
                { step: '2', text: lang === 'ar' ? 'اضغط على زر المشاركة' : 'Tap the Share button', icon: <Share size={14} /> },
                { step: '3', text: lang === 'ar' ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Select "Add to Home Screen"' },
              ].map(s => (
                <div key={s.step} className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-2.5">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{s.step}</span>
                  <span className="text-sm text-foreground flex items-center gap-1.5">{s.text} {s.icon}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Native APK */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Smartphone size={20} className="text-emerald-600" /></div>
              <div>
                <h3 className="font-bold text-foreground">{lang === 'ar' ? 'تطبيق أصلي (APK / IPA)' : 'Native App (APK / IPA)'}</h3>
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'عبر Capacitor - يحتاج إعداد محلي' : 'Via Capacitor - Requires local setup'}</p>
              </div>
            </div>
            <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-xs text-muted-foreground font-mono">
              <p className="text-foreground font-bold font-cairo text-sm mb-3">{lang === 'ar' ? 'الخطوات على جهازك المحلي:' : 'Steps on your local machine:'}</p>
              <p>1. git pull</p>
              <p>2. npm install</p>
              <p>3. npx cap add android  <span className="text-muted-foreground/60"># or: npx cap add ios</span></p>
              <p>4. npm run build</p>
              <p>5. npx cap sync</p>
              <p>6. npx cap run android  <span className="text-muted-foreground/60"># or: npx cap run ios</span></p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InstallPage;