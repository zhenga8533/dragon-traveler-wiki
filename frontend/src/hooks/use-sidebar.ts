import { useCallback, useEffect, useState } from 'react';
import { SIDEBAR, STORAGE_KEY } from '../constants/ui';

export interface UseSidebarReturn {
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Whether the sidebar is being hovered (auto-expand) */
  isHovered: boolean;
  /** Toggle collapsed state */
  toggle: () => void;
  /** Set collapsed state */
  setCollapsed: (collapsed: boolean) => void;
  /** Set hover state */
  setHovered: (hovered: boolean) => void;
  /** Whether to show labels (expanded or hovered) */
  showLabels: boolean;
  /** Current effective width based on state */
  effectiveWidth: number;
}

/**
 * Hook for managing sidebar collapse/expand state
 * State is persisted in localStorage
 */
export function useSidebar(): UseSidebarReturn {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY.SIDEBAR_COLLAPSED);
    return stored === 'true';
  });
  const [isHovered, setIsHovered] = useState(false);

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY.SIDEBAR_COLLAPSED, String(isCollapsed));
  }, [isCollapsed]);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const setHovered = useCallback((hovered: boolean) => {
    setIsHovered(hovered);
  }, []);

  // Show labels when expanded OR when collapsed but hovered
  const showLabels = !isCollapsed || isHovered;

  // Calculate effective width
  const effectiveWidth = showLabels
    ? SIDEBAR.WIDTH_EXPANDED
    : SIDEBAR.WIDTH_COLLAPSED;

  return {
    isCollapsed,
    isHovered,
    toggle,
    setCollapsed,
    setHovered,
    showLabels,
    effectiveWidth,
  };
}
