import { createContext, useContext, useLayoutEffect } from 'react';
import { useSettings } from '../api/client.js';
import { resolveTheme } from '../lib/theme.js';

const ThemeContext = createContext({ theme: 'spooky', isSpooky: true, isThanksgiving: false });

export function ThemeProvider({ children }) {
  const { data: settings } = useSettings();
  const theme = resolveTheme(settings?.theme);

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isSpooky: theme === 'spooky', isThanksgiving: theme === 'thanksgiving' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
