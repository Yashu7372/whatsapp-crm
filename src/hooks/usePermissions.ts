import { useMemo } from 'react';
import { useNav } from '../contexts/NavContext';

/**
 * Thin convenience layer over `useNav()` — `/me/nav` already omits any feature the caller can't
 * view and carries `canManage` per item, so this just turns that list into fast lookups instead
 * of every consumer re-scanning `items` by hand.
 */
export function usePermissions() {
  const { items, loading } = useNav();

  const canManageMap = useMemo(
    () => new Map(items.map(item => [item.featureCode, item.canManage])),
    [items],
  );
  const viewableCodes = useMemo(() => new Set(items.map(item => item.featureCode)), [items]);

  return {
    loading,
    canView: (featureCode: string) => viewableCodes.has(featureCode),
    canManage: (featureCode: string) => canManageMap.get(featureCode) ?? false,
  };
}
