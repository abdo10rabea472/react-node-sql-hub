import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sparkles, Zap, Shield, ChevronRight } from 'lucide-react';

const WELCOME_KEY = 'eltahan_welcome_shown';

const features = [
  { icon: Camera, title: 'إدارة الاستوديو', desc: 'نظام متكامل لإدارة الفواتير والعملاء والمخزون' },
  { icon: Zap, title: 'أتمتة واتساب', desc: 'إرسال الفواتير تلقائياً عبر واتساب بضغطة زر' },
  { icon: Shield, title: 'يعمل بدون إنترنت', desc: 'حفظ محلي تلقائي ومزامنة فورية عند عودة الاتصال' },
  { icon: Sparkles, title: 'تقارير ذكية', desc: 'إحصائيات وتحليلات متقدمة لأداء الاستوديو' },
];

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
    setTimeout(onComplete, 500);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 40%, #1b2838 100%)' }}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 4 + 1,
                height: Math.random() * 4 + 1,
                background: `rgba(56, 189, 248, ${Math.random() * 0.5 + 0.1})`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Glowing orb behind logo */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <div className="relative z-10 w-full max-w-lg mx-4">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="mb-8 inline-flex items-center justify-center w-28 h-28 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(139,92,246,0.2))',
                    border: '2px solid rgba(56,189,248,0.3)',
                    boxShadow: '0 0 60px rgba(56,189,248,0.2)',
                  }}
                >
                  <Camera className="w-14 h-14 text-sky-400" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl font-bold mb-2"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8, #818cf8, #c084fc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  ElTahan Studio
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-gray-400 text-lg mb-2"
                >
                  Photography Studio Management
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-gray-500 text-sm mb-10"
                >
                  نظام إدارة استوديو التصوير المتكامل
                </motion.p>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep(1)}
                  className="group px-8 py-3 rounded-xl text-white font-medium flex items-center gap-2 mx-auto"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                    boxShadow: '0 4px 30px rgba(56,189,248,0.3)',
                  }}
                >
                  ابدأ الآن
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                </motion.button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="features"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                dir="rtl"
              >
                <h2
                  className="text-2xl font-bold text-center mb-8"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8, #c084fc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  مميزات التطبيق
                </h2>

                <div className="grid gap-4 mb-8">
                  {features.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center gap-4 p-4 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(56,189,248,0.1)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(139,92,246,0.15))',
                        }}
                      >
                        <f.icon className="w-6 h-6 text-sky-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">{f.title}</h3>
                        <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFinish}
                  className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                    boxShadow: '0 4px 30px rgba(56,189,248,0.3)',
                  }}
                >
                  <Sparkles className="w-5 h-5" />
                  ابدأ استخدام التطبيق
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
