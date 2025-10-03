import { useEffect } from 'react';

// This hook is now a no-op to remove dark mode functionality.
// It ensures any components that still import it do not break.
export const useTheme = () => {
  
  useEffect(() => {
    // Ensure the dark class is removed from the root element on load.
    const root = window.document.documentElement;
    if (root.classList.contains('dark')) {
        root.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    // Do nothing.
  };

  // Always return 'light' theme.
  return { theme: 'light', toggleTheme };
};