import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const MarketAnalysis: React.FC = () => {
  const marketData = [
    { symbol: 'EUR/USD', trend: 'Bullish', strength: 85, volatility: 'Medium', signal: 'BUY' },
    { symbol: 'GBP/USD', trend: 'Bearish', strength: 72, volatility: 'High', signal: 'SELL' },
    { symbol: 'BTC/USDT', trend: 'Bullish', strength: 91, volatility: 'Low', signal: 'BUY' },
    { symbol: 'ETH/USDT', trend: 'Neutral', strength: 45, volatility: 'Medium', signal: 'HOLD' }
  ];

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'bg-green-500';
      case 'SELL': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Market Analysis</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {marketData.map((market, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{market.symbol}</CardTitle>
                <Badge className={`${getSignalColor(market.signal)} text-white`}>
                  {market.signal}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trend</span>
                <div className="flex items-center gap-1">
                  {market.trend === 'Bullish' ? 
                    <TrendingUp className="w-4 h-4 text-green-600" /> :
                    market.trend === 'Bearish' ?
                    <TrendingDown className="w-4 h-4 text-red-600" /> :
                    <Activity className="w-4 h-4 text-yellow-600" />
                  }
                  <span className="text-sm font-medium">{market.trend}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Strength</span>
                  <span className="text-sm font-medium">{market.strength}%</span>
                </div>
                <Progress value={market.strength} className="h-2" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Volatility</span>
                <Badge variant="outline">{market.volatility}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-gray-600">Bullish Markets</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">1</div>
              <div className="text-sm text-gray-600">Bearish Markets</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-sm text-gray-600">Neutral Markets</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketAnalysis;
export { MarketAnalysis };