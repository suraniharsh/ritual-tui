import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { getTheme, getThemeNames } from '../themes';
import type { Theme } from '../types/theme';
import { useStorage } from './StorageContext';

interface ThemeContextType {
  theme: Theme;
  themeName: string;
  setTheme: (name: string) => void;
  availableThemes: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'dark',
}) => {
  const { data, save } = useStorage();
  const [themeName, setThemeName] = useState(initialTheme);
  const theme = getTheme(themeName);
  const availableThemes = useMemo(() => getThemeNames(), []);
  const availableThemesSetRef = useRef(new Set(availableThemes));
  const storageDataRef = useRef(data);
  const saveRef = useRef(save);

  useEffect(() => {
    storageDataRef.current = data;
  }, [data]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Load theme from storage when data is available
  useEffect(() => {
    if (data?.settings?.theme) {
      setThemeName(data.settings.theme);
    }
  }, [data?.settings?.theme]);

  const handleSetTheme = useCallback(
    (name: string) => {
      if (availableThemesSetRef.current.has(name)) {
        setThemeName(name);

        // Save theme to storage
        const latestData = storageDataRef.current;
        const latestSave = saveRef.current;

        if (latestData && latestSave) {
          latestSave({
            ...latestData,
            settings: {
              ...latestData.settings,
              theme: name,
            },
          });
        }
      }
    },
    [setThemeName],
  );

  const contextValue = useMemo(
    () => ({
      theme,
      themeName,
      setTheme: handleSetTheme,
      availableThemes,
    }),
    [theme, themeName, handleSetTheme, availableThemes],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
