import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock, Target } from 'lucide-react';

interface TradingSignal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  strategy: string;
  timestamp: string;
}

const TradingSignals: React.FC = () => {
  const signals: TradingSignal[] = [
    {
      id: '1',
      symbol: 'EUR/USD',
      type: 'BUY',
      price: 1.0865,
      targetPrice: 1.0920,
      stopLoss: 1.0820,
      confidence: 85,
      strategy: 'RSI Momentum',
      timestamp: '2 min ago'
    },
    {
      id: '2',
      symbol: 'BTC/USD',
      type: 'SELL',
      price: 45250,
      targetPrice: 44500,
      stopLoss: 45800,
      confidence: 78,
      strategy: 'MA Crossover',
      timestamp: '5 min ago'
    },
    {
      id: '3',
      symbol: 'GBP/USD',
      type: 'BUY',
      price: 1.2745,
      targetPrice: 1.2800,
      stopLoss: 1.2700,
      confidence: 92,
      strategy: 'Bollinger Bands',
      timestamp: '8 min ago'
    },
    {
      id: '4',
      symbol: 'ETH/USD',
      type: 'HOLD',
      price: 2850,
      targetPrice: 2950,
      stopLoss: 2750,
      confidence: 65,
      strategy: 'Support/Resistance',
      timestamp: '12 min ago'
    }
  ];

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'BUY':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'SELL':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Target className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'BUY':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'SELL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Live Trading Signals
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            AI-powered trading signals with real-time market analysis and automated recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {signals.map((signal) => (
            <Card key={signal.id} className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    {getSignalIcon(signal.type)}
                    <CardTitle className="text-white text-lg">
                      {signal.symbol}
                    </CardTitle>
                    <Badge className={getSignalColor(signal.type)}>
                      {signal.type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {signal.timestamp}
                    </p>
                    <p className="text-xs text-gray-500">{signal.strategy}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-400">Entry Price</p>
                    <p className="text-white font-semibold">
                      {signal.price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Target</p>
                    <p className="text-green-400 font-semibold">
                      {signal.targetPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Stop Loss</p>
                    <p className="text-red-400 font-semibold">
                      {signal.stopLoss.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <div>
                    <span className="text-xs text-gray-400">Confidence: </span>
                    <span className={`font-semibold ${getConfidenceColor(signal.confidence)}`}>
                      {signal.confidence}%
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      Details
                    </Button>
                    <Button 
                      size="sm" 
                      className={`${
                        signal.type === 'BUY' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : signal.type === 'SELL'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-yellow-600 hover:bg-yellow-700'
                      }`}
                    >
                      Execute
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TradingSignals;