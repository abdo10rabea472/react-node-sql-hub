import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle, Loader, Smartphone, Monitor } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { getInstallPrompt, onInstallPromptChange, triggerInstall } from './pwaInstall';

const InstallPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { settings } = useSettings();
  const lang = settings.lang;
  const [hasPrompt, setHasPrompt] = useState(!!getInstallPrompt());
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isInStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone === true;

  useEffect(() => {
    // Only mark as installed if truly running as standalone PWA (not in iframe/preview)
    const isTopLevel = window.self === window.top;
    if (isInStandalone && isTopLevel) {
      setIsInstalled(true);
      return;
    }

    const unsub = onInstallPromptChange((prompt) => {
      setHasPrompt(!!prompt);
      if (!prompt && !isInstalling) {
        setIsInstalled(true);
      }
    });

    return unsub;
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const accepted = await triggerInstall();
    if (accepted) setIsInstalled(true);
    setHasPrompt(false);
    setIsInstalling(false);
  };

  const iconSrc = localStorage.getItem('pwa-custom-icon') || '/pwa-icon-192.png';
  const appName = settings.studioName || 'STODIO';

  return (
    <div className="animate-fade-in max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <button onClick={onBack} className="self-start text-sm text-primary mb-6 hover:underline">
        ← {lang === 'ar' ? 'رجوع' : 'Back'}
      </button>

      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full text-center">
        <div className="w-24 h-24 rounded-3xl mx-auto mb-5 shadow-xl overflow-hidden border-2 border-border">
          <img src={iconSrc} alt={appName} className="w-full h-full object-cover" />
        </div>

        <h1 className="text-xl font-extrabold text-foreground mb-1">{appName}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {lang === 'ar' ? 'ثبّت التطبيق على جهازك' : 'Install the app on your device'}
        </p>

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
        ) : hasPrompt ? (
          <button onClick={handleInstall} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-[0.98]">
            <Download size={22} />{lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 border border-border rounded-2xl p-5 text-start space-y-4">
              <p className="text-sm font-bold text-foreground text-center">
                {lang === 'ar' ? 'طريقة التثبيت:' : 'How to install:'}
              </p>

              {isIOS ? (
                <div className="space-y-3">
                  <Step n={1} text={lang === 'ar' ? 'اضغط على زر المشاركة ⬆️ في أسفل الشاشة' : 'Tap the Share button ⬆️ at the bottom'} />
                  <Step n={2} text={lang === 'ar' ? 'اختر "إضافة إلى الشاشة الرئيسية" ➕' : 'Choose "Add to Home Screen" ➕'} />
                  <Step n={3} text={lang === 'ar' ? 'اضغط "إضافة" للتأكيد' : 'Tap "Add" to confirm'} />
                </div>
              ) : isAndroid ? (
                <div className="space-y-3">
                  <Step n={1} text={lang === 'ar' ? 'اضغط على القائمة ⋮ أعلى يمين المتصفح' : 'Tap the menu ⋮ top-right of browser'} />
                  <Step n={2} text={lang === 'ar' ? 'اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"' : 'Choose "Install app" or "Add to Home Screen"'} />
                  <Step n={3} text={lang === 'ar' ? 'اضغط "تثبيت" للتأكيد' : 'Tap "Install" to confirm'} />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Monitor size={18} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' ? 'في Chrome: اضغط على أيقونة التثبيت ⊕ في شريط العنوان' : 'In Chrome: Click the install icon ⊕ in the address bar'}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Smartphone size={18} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {lang === 'ar' ? 'أو من القائمة ⋮ ← "تثبيت التطبيق"' : 'Or from menu ⋮ → "Install app"'}
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

const Step = ({ n, text }: { n: number; text: string }) => (
  <div className="flex items-start gap-3">
    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">{n}</span>
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

export default InstallPage;
