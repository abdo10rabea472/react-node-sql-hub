import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle, Loader, Smartphone, Monitor } from 'lucide-react';
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
  const [isInstalling, setIsInstalling] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isInStandalone = window.matchMedia('(display-mode: standalone)').matches;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (isInStandalone) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
    } finally {
      setDeferredPrompt(null);
      setIsInstalling(false);
    }
  };

  const iconSrc = localStorage.getItem('pwa-custom-icon') || '/pwa-icon-192.png';
  const appName = settings.studioName || 'STODIO';

  return (
    <div className="animate-fade-in max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <button onClick={onBack} className="self-start text-sm text-primary mb-6 hover:underline">
        ← {lang === 'ar' ? 'رجوع' : 'Back'}
      </button>

      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full text-center">
        {/* App Icon */}
        <div className="w-24 h-24 rounded-3xl mx-auto mb-5 shadow-xl overflow-hidden border-2 border-border">
          <img src={iconSrc} alt={appName} className="w-full h-full object-cover" />
        </div>

        {/* App Name */}
        <h1 className="text-xl font-extrabold text-foreground mb-1">{appName}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {lang === 'ar' ? 'ثبّت التطبيق على جهازك' : 'Install the app on your device'}
        </p>

        {/* Installed */}
        {isInstalled ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-foreground">{lang === 'ar' ? 'التطبيق مثبت ✓' : 'App Installed ✓'}</p>
            <p className="text-xs text-muted-foreground mt-1">{lang === 'ar' ? 'افتحه من الشاشة الرئيسية' : 'Open from home screen'}</p>
          </div>
        ) : isInstalling ? (
          <button disabled className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary/70 text-primary-foreground rounded-2xl font-bold text-base">
            <Loader size={22} className="animate-spin" />{lang === 'ar' ? 'جاري التثبيت...' : 'Installing...'}
          </button>
        ) : deferredPrompt ? (
          /* Native install prompt available */
          <button onClick={handleInstall} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-[0.98]">
            <Download size={22} />{lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
          </button>
        ) : (
          /* Manual instructions */
          <div className="space-y-4">
            <div className="bg-muted/50 border border-border rounded-2xl p-5 text-start space-y-4">
              <p className="text-sm font-bold text-foreground text-center">
                {lang === 'ar' ? 'طريقة التثبيت:' : 'How to install:'}
              </p>

              {isIOS ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' ? 'اضغط على زر المشاركة' : 'Tap the Share button'} 
                      <span className="inline-block mx-1">⬆️</span>
                      {lang === 'ar' ? 'في أسفل الشاشة' : 'at the bottom'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Choose "Add to Home Screen"'}
                      <span className="inline-block mx-1">➕</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' ? 'اضغط "إضافة" للتأكيد' : 'Tap "Add" to confirm'}
                    </p>
                  </div>
                </div>
              ) : isAndroid ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' ? 'اضغط على القائمة' : 'Tap the menu'} 
                      <span className="inline-block mx-1 font-bold">⋮</span>
                      {lang === 'ar' ? 'أعلى يمين المتصفح' : 'top-right of browser'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' ? 'اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"' : 'Choose "Install app" or "Add to Home Screen"'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' ? 'اضغط "تثبيت" للتأكيد' : 'Tap "Install" to confirm'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Monitor size={18} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' 
                        ? 'في Chrome: اضغط على أيقونة التثبيت ⊕ في شريط العنوان أعلى الصفحة' 
                        : 'In Chrome: Click the install icon ⊕ in the address bar'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Smartphone size={18} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' 
                        ? 'أو من القائمة ⋮ ← "تثبيت التطبيق"' 
                        : 'Or from menu ⋮ → "Install app"'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              {lang === 'ar' 
                ? '💡 افتح التطبيق من المتصفح مباشرة (ليس من داخل تطبيق آخر) لتتمكن من التثبيت' 
                : '💡 Open the app directly in the browser (not inside another app) to install'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InstallPage;
