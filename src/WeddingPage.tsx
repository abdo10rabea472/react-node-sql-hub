import { useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import WeddingInvoicesPage from './WeddingInvoicesPage';
import WeddingPricingPage from './WeddingPricingPage';
import type { User } from './App';

const tabs = [
  { key: 'invoices', labelAr: 'فواتير الزفاف', labelEn: 'Invoices', icon: Heart },
  { key: 'pricing', labelAr: 'أسعار الزفاف', labelEn: 'Pricing', icon: Sparkles },
];

const WeddingPage: React.FC<{ user: User }> = ({ user }) => {
  const [active, setActive] = useState(0);
  const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-muted p-1 rounded-xl w-fit">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${active === i ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon size={16} />
              {lang === 'ar' ? tab.labelAr : tab.labelEn}
            </button>
          );
        })}
      </div>
      {active === 0 ? <WeddingInvoicesPage user={user} /> : <WeddingPricingPage />}
    </div>
  );
};

export default WeddingPage;
