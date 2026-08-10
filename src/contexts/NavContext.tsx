import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { navApi, type NavItem } from '../api/navApi';
import { isAuthenticated } from '../api/httpClient';

const CACHE_PREFIX = 'nav_cache_v1:';

interface NavContextValue {
  items: NavItem[];
  loading: boolean;
  refresh: () => void;
}

const NavContext = createContext<NavContextValue>({ items: [], loading: true, refresh: () => {} });

function cacheKey(): string {
  return CACHE_PREFIX + (localStorage.getItem('tenantId') ?? 'unknown');
}

function readCache(): NavItem[] | null {
  try {
    const raw = localStorage.getItem(cacheKey());
    return raw ? (JSON.parse(raw) as NavItem[]) : null;
  } catch {
    return null;
  }
}

function writeCache(items: NavItem[]) {
  try {
    localStorage.setItem(cacheKey(), JSON.stringify(items));
  } catch {
    // storage full/unavailable — nav still renders, just no instant-load next time
  }
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NavItem[]>(() => (isAuthenticated() ? (readCache() ?? []) : []));
  const [loading, setLoading] = useState(items.length === 0);

  const load = () => {
    if (!isAuthenticated()) {
      setItems([]);
      setLoading(false);
      return;
    }
    navApi
      .getMyNav()
      .then((data) => {
        setItems(data);
        writeCache(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Instant render from cache above, then always revalidate in the background
  // so a role/entitlement change elsewhere is picked up on next load.
  useEffect(() => {
    load();
  }, []);

  return <NavContext.Provider value={{ items, loading, refresh: load }}>{children}</NavContext.Provider>;
}

export function useNav() {
  return useContext(NavContext);
}
