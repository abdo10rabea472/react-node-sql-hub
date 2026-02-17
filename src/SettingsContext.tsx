import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStudioSettings, updateStudioSettings } from './api';

interface DeductionRules {
    mode: 'minute' | 'hour' | 'half_day';
    graceMinutes: number; // Grace period before deductions start
    perMinute: number;
    perHour: number;
    perHalfDay: number;
    overtimeMultiplier: number; // e.g. 1.5x
}

interface AIModelConfig {
    id: string;
    name: string;
    provider: string;
    apiKey: string;
    endpoint: string;
    isActive: boolean;
}

interface Settings {
    currency: string;
    lang: 'ar' | 'en';
    studioName: string;
    theme: 'light' | 'dark';
    address: string;
    phone: string;
    countryCode: string;
    deductionRules: DeductionRules;
    aiModels: AIModelConfig[];
    selectedLovableModel: string;
}


interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
    refreshSettings: () => Promise<void>;
}

const defaultDeductionRules: DeductionRules = {
    mode: 'hour',
    graceMinutes: 15,
    perMinute: 1,
    perHour: 50,
    perHalfDay: 200,
    overtimeMultiplier: 1.5,
};

const defaultSettings: Settings = {
    currency: 'SAR',
    lang: 'ar',
    studioName: 'STODIO Photography',
    theme: 'light',
    address: '',
    phone: '',
    countryCode: '966',
    deductionRules: defaultDeductionRules,
    aiModels: [],
    selectedLovableModel: 'google/gemini-3-flash-preview',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    const refreshSettings = async () => {
        try {
            const res = await getStudioSettings();
            if (res.data) {
                const data = res.data;
                const mapped: Settings = {
                    currency: data.currency || 'SAR',
                    lang: (data.language as 'ar' | 'en') || 'ar',
                    studioName: data.studio_name || 'STODIO Photography',
                    theme: (data.theme as 'light' | 'dark') || 'light',
                    address: data.address || '',
                    phone: data.phone || '',
                    countryCode: data.country_code || '966',
                    deductionRules: data.deduction_rules ? JSON.parse(data.deduction_rules) : defaultDeductionRules,
                    aiModels: data.ai_models ? JSON.parse(data.ai_models) : [],
                    selectedLovableModel: data.selected_lovable_model || 'google/gemini-3-flash-preview',
                };
                setSettings(mapped);
                setIsLoaded(true);
            }

        } catch (err: any) {
            // في حالة عدم الاتصال، نستخدم الإعدادات المحلية بدون إظهار خطأ
            if (err?.code === 'ERR_NETWORK' || !err?.response) {
                console.warn("📡 تحميل الإعدادات من التخزين المحلي (أوفلاين)");
            } else {
                console.error("Failed to load settings:", err);
            }
            const saved = localStorage.getItem('app-settings');
            if (saved) setSettings(JSON.parse(saved));
            setIsLoaded(true);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    useEffect(() => {
        if (!isLoaded) return;

        localStorage.setItem('app-settings', JSON.stringify(settings));
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.documentElement.setAttribute('dir', settings.lang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', settings.lang);
    }, [settings, isLoaded]);

    const updateSettings = async (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);

        // Sync with DB
        try {
            await updateStudioSettings({
                studio_name: updated.studioName,
                currency: updated.currency,
                language: updated.lang,
                theme: updated.theme,
                country_code: updated.countryCode,
                address: updated.address,
                phone: updated.phone,
                deduction_rules: JSON.stringify(updated.deductionRules),
                ai_models: JSON.stringify(updated.aiModels),
            });
        } catch (err) {
            console.error("Failed to sync settings to DB:", err);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        // Fallback for HMR / hot-reload edge cases
        return {
            settings: {
                currency: 'SAR',
                lang: 'ar' as const,
                studioName: 'STODIO Photography',
                theme: 'light' as const,
                address: '',
                phone: '',
                countryCode: '966',
                deductionRules: defaultDeductionRules,
                aiModels: [],
            },
            updateSettings: async () => {},
            refreshSettings: async () => {},
        };
    }
    return context;
};
