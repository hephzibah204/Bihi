import { useState, useEffect } from 'react';

export const useTheme = () => {
  // This state stores the user's preference: 'light', 'dark', or 'system'
  const [themePref, setThemePref] = useState(() => localStorage.getItem('theme') || 'system');
  
  // This state stores the actual applied theme: 'light' or 'dark'
  const [appliedTheme, setAppliedTheme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const isDark = themePref === 'dark' || (themePref === 'system' && systemPrefersDark.matches);
      root.classList.toggle('dark', isDark);
      setAppliedTheme(isDark ? 'dark' : 'light');
    };

    updateTheme(); // Apply on initial load and when themePref changes

    systemPrefersDark.addEventListener('change', updateTheme);
    
    // Update local storage when preference changes
    localStorage.setItem('theme', themePref);

    return () => {
      systemPrefersDark.removeEventListener('change', updateTheme);
    };
  }, [themePref]);

  const toggleTheme = () => {
    // When toggling, we explicitly set light or dark, moving away from 'system'
    const newPref = appliedTheme === 'light' ? 'dark' : 'light';
    setThemePref(newPref);
  };

  // Return the applied theme for UI components to use
  return { theme: appliedTheme, toggleTheme };
};
