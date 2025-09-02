import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Wifi, WifiOff } from 'lucide-react';

const RealTimeData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  const [marketData, setMarketData] = useState([
    { symbol: 'EURUSD', price: 1.0845, change: 0.0012, changePercent: 0.11, volume: 2450000 },
    { symbol: 'GBPUSD', price: 1.2634, change: -0.0023, changePercent: -0.18, volume: 1890000 },
    { symbol: 'BTCUSD', price: 43250.50, change: 1250.30, changePercent: 2.98, volume: 890000 },
    { symbol: 'ETHUSD', price: 2650.75, change: -45.25, changePercent: -1.68, volume: 1200000 },
    { symbol: 'USDJPY', price: 149.85, change: 0.45, changePercent: 0.30, volume: 1650000 },
    { symbol: 'XAUUSD', price: 2045.60, change: 15.40, changePercent: 0.76, volume: 750000 }
  ]);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(item => ({
        ...item,
        price: item.price + (Math.random() - 0.5) * (item.price * 0.001),
        change: (Math.random() - 0.5) * (item.price * 0.002),
        changePercent: (Math.random() - 0.5) * 2,
        volume: Math.floor(item.volume + (Math.random() - 0.5) * 100000)
      })));
      setLastUpdate(new Date());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleConnection = () => {
    setIsConnected(!isConnected);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
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
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {marketData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="font-medium">{item.symbol}</div>
                <div className="text-2xl font-bold">{item.price.toFixed(item.symbol.includes('USD') && !item.symbol.startsWith('USD') ? 2 : 5)}</div>
              </div>
              <div className="text-right">
                <div className={`font-medium ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(4)}
                </div>
                <div className={`text-sm ${item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div>Vol: {(item.volume / 1000).toFixed(0)}K</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeData;