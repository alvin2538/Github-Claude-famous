import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, DollarSign, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';

interface LiveTrade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entry: number;
  current: number;
  pnl: number;
  size: number;
  timestamp: string;
  status: 'open' | 'closed';
}

const LiveDashboard: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [accountBalance, setAccountBalance] = useState(50000);
  const [dailyPnL, setDailyPnL] = useState(1250.75);

  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([
    {
      id: '1',
      symbol: 'EUR/USD',
      type: 'BUY',
      entry: 1.0850,
      current: 1.0875,
      pnl: 125.50,
      size: 0.5,
      timestamp: '14:23:45',
      status: 'open'
    },
    {
      id: '2',
      symbol: 'BTC/USDT',
      type: 'SELL',
      entry: 43250,
      current: 43180,
      pnl: 210.00,
      size: 0.3,
      timestamp: '14:18:22',
      status: 'open'
    },
    {
      id: '3',
      symbol: 'GBP/JPY',
      type: 'BUY',
      entry: 185.45,
      current: 185.12,
      pnl: -165.00,
      size: 0.7,
      timestamp: '14:15:10',
      status: 'open'
    }
  ]);

  const systemStats = {
    uptime: '23h 45m',
    tradesExecuted: 47,
    winRate: 68.5,
    avgExecutionTime: '0.23s',
    apiLatency: '12ms',
    systemLoad: 23
  };

  const marketConditions = {
    volatility: 'Medium',
    trend: 'Bullish',
    volume: 'High',
    spread: 'Normal'
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate live price updates
      setLiveTrades(prev => prev.map(trade => ({
        ...trade,
        current: trade.current + (Math.random() - 0.5) * 0.001,
        pnl: trade.pnl + (Math.random() - 0.5) * 10
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const totalPnL = liveTrades.reduce((sum, trade) => sum + trade.pnl, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Live Trading Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
          <span className="text-sm font-medium">{isLive ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Account Balance</p>
                <p className="text-2xl font-bold">${accountBalance.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${dailyPnL >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Daily P&L</p>
                <p className="text-2xl font-bold">
                  ${dailyPnL >= 0 ? '+' : ''}{dailyPnL.toFixed(2)}
                </p>
              </div>
              {dailyPnL >= 0 ? 
                <TrendingUp className="w-8 h-8 text-green-200" /> : 
                <TrendingDown className="w-8 h-8 text-red-200" />
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Trades</p>
                <p className="text-2xl font-bold">{liveTrades.filter(t => t.status === 'open').length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold">{systemStats.winRate}%</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trades" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trades">Live Trades</TabsTrigger>
          <TabsTrigger value="system">System Status</TabsTrigger>
          <TabsTrigger value="market">Market Conditions</TabsTrigger>
        </TabsList>

        <TabsContent value="trades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Active Positions
                <Badge variant="outline" className="text-green-600">
                  Total P&L: ${totalPnL.toFixed(2)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {liveTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge className={trade.type === 'BUY' ? 'bg-green-500' : 'bg-red-500'}>
                        {trade.type}
                      </Badge>
                      <div>
                        <p className="font-medium">{trade.symbol}</p>
                        <p className="text-sm text-gray-600">
                          Entry: {trade.entry} | Size: {trade.size}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{trade.current.toFixed(4)}</p>
                      <p className={`text-sm ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {trade.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{systemStats.uptime}</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{systemStats.tradesExecuted}</div>
                  <div className="text-sm text-gray-600">Trades Today</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{systemStats.avgExecutionTime}</div>
                  <div className="text-sm text-gray-600">Avg Execution</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">API Latency</span>
                    <span className="text-sm text-gray-600">{systemStats.apiLatency}</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">System Load</span>
                    <span className="text-sm text-gray-600">{systemStats.systemLoad}%</span>
                  </div>
                  <Progress value={systemStats.systemLoad} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market">
          <Card>
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold">{marketConditions.volatility}</div>
                  <div className="text-sm text-gray-600">Volatility</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{marketConditions.trend}</div>
                  <div className="text-sm text-gray-600">Trend</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold">{marketConditions.volume}</div>
                  <div className="text-sm text-gray-600">Volume</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold">{marketConditions.spread}</div>
                  <div className="text-sm text-gray-600">Spread</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveDashboard;