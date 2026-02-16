import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle, Loader, ExternalLink, Share } from 'lucide-react';
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
  const autoTriggered = useRef(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
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

  // Auto-trigger install prompt when available
  useEffect(() => {
    if (deferredPrompt && !autoTriggered.current && !isInstalled) {
      autoTriggered.current = true;
      handleInstall();
    }
  }, [deferredPrompt]);

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
          /* Direct install available */
          <button onClick={handleInstall} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-[0.98]">
            <Download size={22} />{lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
          </button>
        ) : (
          /* Fallback instructions */
          <div className="space-y-4 text-start">
            {isIOS ? (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <p className="text-sm font-bold text-foreground text-center mb-3">{lang === 'ar' ? 'خطوات التثبيت على iPhone' : 'Install on iPhone'}</p>
                {[
                  { step: '1', text: lang === 'ar' ? 'اضغط على زر المشاركة' : 'Tap the Share button', icon: <Share size={14} /> },
                  { step: '2', text: lang === 'ar' ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Select "Add to Home Screen"' },
                  { step: '3', text: lang === 'ar' ? 'اضغط "إضافة"' : 'Tap "Add"' },
                ].map(s => (
                  <div key={s.step} className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-2.5">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{s.step}</span>
                    <span className="text-sm text-foreground flex items-center gap-1.5">{s.text} {s.icon}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    // Open app URL in new tab so beforeinstallprompt can fire
                    window.open(window.location.origin, '_blank');
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-[0.98]"
                >
                  <ExternalLink size={22} />{lang === 'ar' ? 'فتح التطبيق للتثبيت' : 'Open App to Install'}
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  {lang === 'ar'
                    ? 'سيُفتح التطبيق في نافذة جديدة، ثم اضغط على أيقونة التثبيت ⬇️ في شريط العنوان'
                    : 'App will open in a new window, then click the install icon ⬇️ in the address bar'}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InstallPage;
