import React, { useState, useEffect } from 'react';
import { AppContext } from './AppContext';
import { toast } from '@/components/ui/use-toast';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // User Authentication State
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Notifications State
  const [notifications, setNotifications] = useState([]);
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Trading State
  const [tradingState, setTradingState] = useState({
    isConnected: false,
    activeStrategies: [],
    portfolioValue: 0,
    dailyPnL: 0,
    positions: []
  });
  
  // Dashboard Layout
  const [dashboardLayout, setDashboardLayout] = useState([
    'overview', 'portfolio', 'signals', 'analysis'
  ]);

  // Online/Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Functions
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUser = {
        id: '1',
        email,
        name: 'Trading User',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: true,
          autoTrading: false,
          riskLevel: 'medium',
          dashboardLayout: ['overview', 'portfolio', 'signals', 'analysis']
        }
      };
      setUser(mockUser);
      setIsAuthenticated(true);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
    } catch (err) {
      setError('Login failed');
      toast({ title: 'Login Failed', description: 'Invalid credentials', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    toast({ title: 'Logged Out', description: 'See you next time!' });
  };
  
  const updatePreferences = (prefs) => {
    if (user) {
      setUser({ ...user, preferences: { ...user.preferences, ...prefs } });
    }
  };
  
  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  const clearNotifications = () => setNotifications([]);
  
  const updateTradingState = (newState) => {
    setTradingState(prev => ({ ...prev, ...newState }));
  };
  
  const updateDashboardLayout = (layout) => {
    setDashboardLayout(layout);
    if (user) {
      updatePreferences({ dashboardLayout: layout });
    }
  };

  const value = {
    sidebarOpen,
    toggleSidebar,
    user,
    isAuthenticated,
    login,
    logout,
    updatePreferences,
    notifications,
    addNotification,
    markAsRead,
    clearNotifications,
    isLoading,
    error,
    isOnline,
    setLoading: setIsLoading,
    setError,
    tradingState,
    updateTradingState,
    dashboardLayout,
    updateDashboardLayout
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};