import { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import { verifyToken } from "./api";
import { SettingsProvider } from "./SettingsContext";
import SyncStatusBar from "./components/SyncStatusBar";
import WelcomeScreen from "./components/WelcomeScreen";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [welcomeDone, setWelcomeDone] = useState(() => {
    const isElectron = navigator.userAgent.includes('Electron');
    const storage = isElectron ? sessionStorage : localStorage;
    return !!storage.getItem('eltahan_welcome_v1.0.0');
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      verifyToken()
        .then((res) => setUser(res.data.user))
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData: User, token: string) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-content-center bg-background">
        <div className="flex flex-col items-center gap-3 mx-auto">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-cairo text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      {!welcomeDone && <WelcomeScreen onComplete={() => setWelcomeDone(true)} />}
      {welcomeDone && (
        !user ? <Login onLogin={handleLogin} /> : <Dashboard user={user} onLogout={handleLogout} />
      )}
      <SyncStatusBar />
    </SettingsProvider>
  );
}

export default App;
