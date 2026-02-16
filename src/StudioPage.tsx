import { useState } from 'react';
import { FileText, Camera } from 'lucide-react';
import InvoicesPage from './InvoicesPage';
import PricingPage from './PricingPage';
import type { User } from './App';

const tabs = [
  { key: 'invoices', labelAr: 'الفواتير', labelEn: 'Invoices', icon: FileText },
  { key: 'pricing', labelAr: 'باقات التصوير', labelEn: 'Pricing', icon: Camera },
];

const StudioPage: React.FC<{ user: User }> = ({ user }) => {
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
      {active === 0 ? <InvoicesPage user={user} /> : <PricingPage />}
    </div>
  );
};

export default StudioPage;
