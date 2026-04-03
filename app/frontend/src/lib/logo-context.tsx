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
      const settingsRes = await client.entities.balloon_settings.query({
        query: {},
        limit: 1,
      });
      if (settingsRes?.data?.items?.length > 0) {
        const objectKey = settingsRes.data.items[0].logo_object_key;
        if (objectKey) {
          const downloadRes = await client.storage.getDownloadUrl({
            bucket_name: 'logos',
            object_key: objectKey,
          });
          if (downloadRes?.data?.download_url) {
            setLogoUrl(downloadRes.data.download_url);
          }
        } else {
          setLogoUrl(null);
        }
      }
    } catch (err) {
      console.error('Failed to load logo:', err);
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