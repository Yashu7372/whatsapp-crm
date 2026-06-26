import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { featuresApi, TenantFeatures } from '../api/featuresApi';
import { isAuthenticated } from '../api/httpClient';

interface FeaturesContextValue {
  features: Record<string, boolean>;
  plan: string;
  subscriptionStatus: string;
  loading: boolean;
  isEnabled: (featureCode: string) => boolean;
  refresh: () => void;
}

const FeaturesContext = createContext<FeaturesContextValue>({
  features: {},
  plan: 'STARTER',
  subscriptionStatus: 'TRIAL',
  loading: true,
  isEnabled: () => false,
  refresh: () => {},
});

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TenantFeatures | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    featuresApi.getMyFeatures()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const isEnabled = (featureCode: string): boolean => {
    if (!data) return false;
    return data.features[featureCode] === true;
  };

  return (
    <FeaturesContext.Provider value={{
      features: data?.features ?? {},
      plan: data?.plan ?? 'STARTER',
      subscriptionStatus: data?.subscriptionStatus ?? 'TRIAL',
      loading,
      isEnabled,
      refresh: load,
    }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  return useContext(FeaturesContext);
}
