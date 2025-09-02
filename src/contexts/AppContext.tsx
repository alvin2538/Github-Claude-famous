import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    autoTrading: boolean;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (prefs: any) => void;
  notifications: any[];
  addNotification: (notification: any) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  tradingState: any;
  updateTradingState: (state: any) => void;
  dashboardLayout: string[];
  updateDashboardLayout: (layout: string[]) => void;
}

const defaultContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  updatePreferences: () => {},
  notifications: [],
  addNotification: () => {},
  markAsRead: () => {},
  clearNotifications: () => {},
  isLoading: false,
  error: null,
  isOnline: true,
  setLoading: () => {},
  setError: () => {},
  tradingState: { isConnected: false, portfolioValue: 0 },
  updateTradingState: () => {},
  dashboardLayout: [],
  updateDashboardLayout: () => {}
};

export const AppContext = createContext<AppContextType>(defaultContext);
export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Set to true for demo
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [tradingState, setTradingState] = useState({ isConnected: false, portfolioValue: 0 });
  const [dashboardLayout, setDashboardLayout] = useState(['overview', 'portfolio']);

  const value = {
    sidebarOpen,
    toggleSidebar: () => setSidebarOpen(!sidebarOpen),
    user,
    isAuthenticated,
    login: async () => setIsAuthenticated(true),
    logout: () => setIsAuthenticated(false),
    updatePreferences: () => {},
    notifications,
    addNotification: () => {},
    markAsRead: () => {},
    clearNotifications: () => {},
    isLoading,
    error,
    isOnline,
    setLoading: setIsLoading,
    setError,
    tradingState,
    updateTradingState: () => {},
    dashboardLayout,
    updateDashboardLayout: () => {}
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};