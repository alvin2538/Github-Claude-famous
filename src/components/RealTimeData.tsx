// src/components/RealTimeData.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Wifi, WifiOff, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { websocketService, MarketData } from '../services/websocketService';

interface MarketDataItem extends MarketData {
  changePercent?: number;
  prevPrice?: number;
}

const RealTimeData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MarketDataItem[]>([
    { symbol: 'BTCUSD', price: 43250.50, volume: 890000, change: 1250.30, timestamp: Date.now() },
    { symbol: 'ETHUSD', price: 2650.75, volume: 1200000, change: -45.25, timestamp: Date.now() },
    { symbol: 'EURUSD', price: 1.0845, volume: 2450000, change: 0.0012, timestamp: Date.now() },
    { symbol: 'GBPUSD', price: 1.2634, volume: 1890000, change: -0.0023, timestamp: Date.now() },
    { symbol: 'USDJPY', price: 149.85, volume: 1650000, change: 0.45, timestamp: Date.now() },
    { symbol: 'XAUUSD', price: 2045.60, volume: 750000, change: 15.40, timestamp: Date.now() }
  ]);

  const [selectedExchanges] = useState(['binance', 'coinbase']); // Default exchanges
  const [symbols] = useState(['BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD', 'USDJPY']);

  // Handle real-time market data updates
  const handleMarketDataUpdate = useCallback((data: MarketData) => {
    setMarketData(prev => {
      const existingIndex = prev.findIndex(item => item.symbol === data.symbol);
      
      if (existingIndex >= 0) {
        // Update existing symbol
        const updated = [...prev];
        const prevPrice = updated[existingIndex].price;
        const changePercent = prevPrice > 0 ? ((data.price - prevPrice) / prevPrice) * 100 : 0;
        
        updated[existingIndex] = {
          ...data,
          prevPrice,
          changePercent
        };
        return updated;
      } else {
        // Add new symbol
        return [...prev, { ...data, changePercent: 0 }];
      }
    });
    
    setLastUpdate(new Date());
    setError(null); // Clear any previous errors
  }, []);

  // Connect to WebSocket feeds
  const connectToFeeds = useCallback(async () => {
    try {
      setError(null);
      
      // Subscribe to market data updates
      const unsubscribe = websocketService.subscribe('binance', 'all', handleMarketDataUpdate);
      
      // Connect to selected exchanges
      const connectionPromises = selectedExchanges.map(async (exchange) => {
        try {
          const success = await websocketService.connect(exchange, symbols);
          return { exchange, success };
        } catch (error) {
          console.error(`Failed to connect to ${exchange}:`, error);
          return { exchange, success: false };
        }
      });

      const results = await Promise.all(connectionPromises);
      
      // Update connection status
      const newStatus: Record<string, boolean> = {};
      let anyConnected = false;
      
      results.forEach(({ exchange, success }) => {
        newStatus[exchange] = success;
        if (success) anyConnected = true;
      });
      
      setConnectionStatus(newStatus);
      setIsConnected(anyConnected);
      
      if (!anyConnected) {
        setError('Failed to connect to any exchange');
      }

      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Connection error:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
    }
  }, [selectedExchanges, symbols, handleMarketDataUpdate]);

  // Disconnect from WebSocket feeds
  const disconnectFromFeeds = useCallback(() => {
    websocketService.disconnectAll();
    setIsConnected(false);
    setConnectionStatus({});
    setError(null);
  }, []);

  // Toggle connection
  const toggleConnection = useCallback(async () => {
    if (isConnected) {
      disconnectFromFeeds();
    } else {
      await connectToFeeds();
    }
  }, [isConnected, connectToFeeds, disconnectFromFeeds]);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = websocketService.getConnectionStatus();
      setConnectionStatus(status);
      
      const anyConnected = Object.values(status).some(connected => connected);
      setIsConnected(anyConnected);
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-connect on component mount
  useEffect(() => {
    connectToFeeds();
    
    return () => {
      disconnectFromFeeds();
    };
  }, [connectToFeeds, disconnectFromFeeds]);

  // Simulate price updates when not connected (for demo purposes)
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(() => {
        setMarketData(prev => prev.map(item => {
          const priceChange = (Math.random() - 0.5) * (item.price * 0.001);
          const newPrice = Math.max(0.0001, item.price + priceChange);
          const changePercent = item.prevPrice ? ((newPrice - item.prevPrice) / item.prevPrice) * 100 : 0;
          
          return {
            ...item,
            price: newPrice,
            change: priceChange,
            changePercent,
            volume: Math.max(0, item.volume + (Math.random() - 0.5) * 100000),
            timestamp: Date.now()
          };
        }));
        setLastUpdate(new Date());
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const formatPrice = (price: number, symbol: string): string => {
    if (symbol.includes('JPY')) {
      return price.toFixed(2);
    } else if (symbol.includes('USD') && !symbol.startsWith('USD')) {
      return price.toFixed(2);
    } else if (symbol.includes('BTC') || symbol.includes('ETH')) {
      return price.toFixed(2);
    } else {
      return price.toFixed(4);
    }
  };

  const formatChange = (change: number, symbol: string): string => {
    if (symbol.includes('JPY')) {
      return change.toFixed(2);
    } else if (symbol.includes('BTC') || symbol.includes('ETH')) {
      return change.toFixed(2);
    } else {
      return change.toFixed(4);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className={`h-5 w-5 ${isConnected ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
              Real-Time Market Data
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={isConnected ? "destructive" : "default"}
                size="sm"
                onClick={toggleConnection}
              >
                {isConnected ? <WifiOff className="h-4 w-4 mr-2" /> : <Wifi className="h-4 w-4 mr-2" />}
                {isConnected ? 'Disconnect' : 'Connect'}
              </Button>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Exchanges:</span>
            {selectedExchanges.map(exchange => (
              <Badge 
                key={exchange} 
                variant={connectionStatus[exchange] ? "default" : "outline"}
                className="text-xs"
              >
                {exchange}
              </Badge>
            ))}
            <span className="ml-4">Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            {marketData.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="font-medium">{item.symbol}</div>
                  <div className="text-2xl font-bold">
                    {formatPrice(item.price, item.symbol)}
                  </div>
                  {item.changePercent !== undefined && (
                    <div className="flex items-center">
                      {item.changePercent >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className={`font-medium ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.change >= 0 ? '+' : ''}{formatChange(item.change, item.symbol)}
                  </div>
                  {item.changePercent !== undefined && (
                    <div className={`text-sm ${item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </div>
                  )}
                </div>
                
                <div className="text-right text-sm text-muted-foreground">
                  <div>Vol: {(item.volume / 1000).toFixed(0)}K</div>
                  <div className="text-xs">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isConnected && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Using simulated data. Connect to exchanges for real-time market data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeData;
