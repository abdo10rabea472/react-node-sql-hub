import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle, Loader } from 'lucide-react';
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

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Auto-trigger install prompt when page opens
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

        {/* Status / Button */}
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
        ) : (
          <button onClick={handleInstall} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-[0.98]">
            <Download size={22} />{lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default InstallPage;
