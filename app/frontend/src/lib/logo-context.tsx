import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { client } from '@/lib/api';

interface LogoContextType {
  logoUrl: string | null;
  refreshLogo: () => Promise<void>;
}

const LogoContext = createContext<LogoContextType>({
  logoUrl: null,
  refreshLogo: async () => {},
});

export function LogoProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

 const refreshLogo = useCallback(async () => {
  try {
    const response = await client.get('/settings');

    console.log("Settings response:", response.data);

    const logoValue =
      response.data?.backend_vars?.balloon_settings?.value;

    if (logoValue) {
      setLogoUrl(logoValue);
    } else {
      setLogoUrl(null);
    }
  } catch (err) {
    console.error('Failed to load logo:', err);
    setLogoUrl(null);
  }
}, []);
  
  useEffect(() => {
    refreshLogo();
  }, [refreshLogo]);

  return (
    <LogoContext.Provider value={{ logoUrl, refreshLogo }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  return useContext(LogoContext);
}
