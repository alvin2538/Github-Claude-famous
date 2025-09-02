import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const TradingIndicators = () => {
  const indicators = [
    {
      name: 'RSI (14)',
      value: 68.5,
      signal: 'SELL',
      strength: 'Strong',
      color: 'bg-red-500',
      description: 'Overbought condition detected'
    },
    {
      name: 'MACD',
      value: 0.0045,
      signal: 'BUY',
      strength: 'Medium',
      color: 'bg-green-500',
      description: 'Bullish crossover confirmed'
    },
    {
      name: 'Bollinger Bands',
      value: 0.85,
      signal: 'NEUTRAL',
      strength: 'Weak',
      color: 'bg-yellow-500',
      description: 'Price within normal range'
    },
    {
      name: 'Stochastic %K',
      value: 75.2,
      signal: 'SELL',
      strength: 'Medium',
      color: 'bg-red-500',
      description: 'Overbought momentum'
    },
    {
      name: 'Williams %R',
      value: -25.8,
      signal: 'BUY',
      strength: 'Strong',
      color: 'bg-green-500',
      description: 'Oversold reversal signal'
    },
    {
      name: 'Ichimoku Cloud',
      value: 1.2045,
      signal: 'BUY',
      strength: 'Strong',
      color: 'bg-green-500',
      description: 'Price above cloud support'
    }
  ];

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'SELL':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indicators.map((indicator, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{indicator.name}</h3>
                {getSignalIcon(indicator.signal)}
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{indicator.value}</div>
                <div className="flex items-center gap-2">
                  <Badge variant={indicator.signal === 'BUY' ? 'default' : indicator.signal === 'SELL' ? 'destructive' : 'secondary'}>
                    {indicator.signal}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{indicator.strength}</span>
                </div>
                <p className="text-xs text-muted-foreground">{indicator.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingIndicators;