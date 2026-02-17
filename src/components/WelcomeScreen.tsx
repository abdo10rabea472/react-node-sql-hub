import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, Zap, Shield, BarChart3, Send, ChevronRight, ChevronLeft, Globe, Smartphone, Check } from 'lucide-react';

const WELCOME_KEY = 'eltahan_welcome_v1.0.0';

const pageTransition = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: 0.35 },
};

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 justify-center mt-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: i === current ? 24 : 8,
            background: i === current
              ? 'linear-gradient(135deg, #38bdf8, #818cf8)'
              : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...pageTransition} className="text-center px-2">
      {children}
    </motion.div>
  );
}

// الصفحة 1: الترحيب
function WelcomePage() {
  return (
    <PageWrapper>
      <div
        className="mx-auto mb-6 w-24 h-24 rounded-2xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(139,92,246,0.2))',
          border: '1px solid rgba(56,189,248,0.3)',
        }}
      >
        <Camera className="w-12 h-12 text-sky-400" />
      </div>
      <h1
        className="text-3xl font-bold mb-2"
        style={{
          background: 'linear-gradient(135deg, #38bdf8, #818cf8, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        ElTahan Studio
      </h1>
      <p className="text-gray-400 text-base mb-1">Photography Studio Management</p>
      <p className="text-gray-500 text-sm mb-6">نظام إدارة استوديو التصوير المتكامل</p>
      <p className="text-gray-600 text-xs">الإصدار 1.0.0</p>
    </PageWrapper>
  );
}

// الصفحة 2: المميزات الأساسية
function FeaturesPage() {
  const features = [
    { icon: Camera, title: 'إدارة الفواتير والعملاء', desc: 'نظام شامل لتتبع كل العمليات' },
    { icon: BarChart3, title: 'تقارير وإحصائيات', desc: 'تحليلات متقدمة لأداء الاستوديو' },
    { icon: Zap, title: 'المخزون والمشتريات', desc: 'تتبع دقيق لكل المنتجات' },
    { icon: Sparkles, title: 'تسعير مرن', desc: 'أسعار مخصصة لكل خدمة' },
  ];

  return (
    <PageWrapper>
      <h2
        className="text-2xl font-bold mb-6"
        style={{
          background: 'linear-gradient(135deg, #38bdf8, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        مميزات النظام
      </h2>
      <div className="grid gap-3" dir="rtl">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl text-right"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(56,189,248,0.1)',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(139,92,246,0.15))' }}
            >
              <f.icon className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{f.title}</h3>
              <p className="text-gray-400 text-xs">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

// الصفحة 3: الأتمتة
function AutomationPage() {
  const items = [
    { icon: Send, title: 'إرسال واتساب تلقائي', desc: 'أرسل الفواتير لعملائك بضغطة واحدة' },
    { icon: Shield, title: 'يعمل بدون إنترنت', desc: 'حفظ محلي تلقائي ومزامنة فورية' },
    { icon: Globe, title: 'وصول من أي مكان', desc: 'استخدم التطبيق من الويب أو الديسكتوب' },
  ];

  return (
    <PageWrapper>
      <h2
        className="text-2xl font-bold mb-6"
        style={{
          background: 'linear-gradient(135deg, #38bdf8, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        أتمتة ذكية
      </h2>
      <div className="grid gap-3" dir="rtl">
        {items.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 rounded-xl text-right"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(139,92,246,0.15)',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(56,189,248,0.1))' }}
            >
              <f.icon className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{f.title}</h3>
              <p className="text-gray-400 text-xs">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

// الصفحة 4: التوافق
function CompatibilityPage() {
  const platforms = [
    { icon: Smartphone, label: 'تطبيق موبايل (PWA)' },
    { icon: Globe, label: 'متصفح الويب' },
    { icon: Camera, label: 'تطبيق ديسكتوب (Windows)' },
  ];

  return (
    <PageWrapper>
      <h2
        className="text-2xl font-bold mb-6"
        style={{
          background: 'linear-gradient(135deg, #38bdf8, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        يعمل في كل مكان
      </h2>
      <div className="grid gap-3 mb-6" dir="rtl">
        {platforms.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(56,189,248,0.1)',
            }}
          >
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <p.icon className="w-5 h-5 text-sky-400 shrink-0" />
            <span className="text-white text-sm">{p.label}</span>
          </div>
        ))}
      </div>
      <p className="text-gray-500 text-xs" dir="rtl">
        يدعم أنظمة Windows 32-bit و 64-bit • يعمل على الأجهزة الضعيفة
      </p>
    </PageWrapper>
  );
}

// الصفحة 5: جاهز
function ReadyPage() {
  return (
    <PageWrapper>
      <div
        className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(56,189,248,0.2))',
          border: '1px solid rgba(52,211,153,0.3)',
        }}
      >
        <Check className="w-10 h-10 text-emerald-400" />
      </div>
      <h2
        className="text-2xl font-bold mb-3"
        style={{
          background: 'linear-gradient(135deg, #34d399, #38bdf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        التطبيق جاهز!
      </h2>
      <p className="text-gray-400 text-sm mb-6" dir="rtl">
        كل شيء جاهز للاستخدام. سجّل دخولك وابدأ إدارة الاستوديو بكفاءة.
      </p>
      <div
        className="rounded-xl p-4 mb-4"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <p className="text-gray-500 text-xs mb-1">تم التطوير بواسطة</p>
        <p
          className="text-lg font-bold"
          style={{
            background: 'linear-gradient(135deg, #38bdf8, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AbdElrhman Rabea
        </p>
        <p className="text-gray-600 text-xs mt-1">© 2026 ElTahan Photography Studio</p>
      </div>
    </PageWrapper>
  );
}

const pages = [WelcomePage, FeaturesPage, AutomationPage, CompatibilityPage, ReadyPage];

export default function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem(WELCOME_KEY);
    if (!shown) {
      setShow(true);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleFinish = () => {
    localStorage.setItem(WELCOME_KEY, 'true');
    setShow(false);
    setTimeout(onComplete, 400);
  };

  const isLast = step === pages.length - 1;
  const CurrentPage = pages[step];

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 40%, #1b2838 100%)' }}
      >
        <div className="relative z-10 w-full max-w-md mx-4">
          <AnimatePresence mode="wait">
            <CurrentPage key={step} />
          </AnimatePresence>

          <ProgressDots current={step} total={pages.length} />

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-6 px-2">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-gray-400 text-sm hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <ChevronLeft className="w-4 h-4" />
                السابق
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={isLast ? handleFinish : () => setStep(s => s + 1)}
              className="flex items-center gap-1 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-transform hover:scale-105 active:scale-95"
              style={{
                background: isLast
                  ? 'linear-gradient(135deg, #34d399, #38bdf8)'
                  : 'linear-gradient(135deg, #38bdf8, #818cf8)',
                boxShadow: '0 4px 20px rgba(56,189,248,0.25)',
              }}
            >
              {isLast ? 'ابدأ الآن' : 'التالي'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
              {isLast && <Sparkles className="w-4 h-4" />}
            </button>
          </div>

          {/* Skip button */}
          {!isLast && (
            <button
              onClick={handleFinish}
              className="block mx-auto mt-4 text-gray-600 text-xs hover:text-gray-400 transition-colors"
            >
              تخطي
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
