import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStudioSettings, updateStudioSettings } from './api';

interface Settings {
    currency: string;
    lang: 'ar' | 'en';
    studioName: string;
    theme: 'light' | 'dark';
    address: string;
    phone: string;
}


interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
    refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
    currency: 'SAR',
    lang: 'ar',
    studioName: 'STODIO Photography',
    theme: 'light',
    address: '',
    phone: '',
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
                };
                setSettings(mapped);
                setIsLoaded(true);
            }

        } catch (err) {
            console.error("Failed to load settings from DB:", err);
            // Fallback to localStorage if server fails
            const saved = localStorage.getItem('app-settings');
            if (saved) setSettings(JSON.parse(saved));
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
                theme: updated.theme
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
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
