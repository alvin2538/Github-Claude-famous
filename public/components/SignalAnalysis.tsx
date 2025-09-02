import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

interface SignalData {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  probability: number;
  strength: number;
  timeframe: string;
  indicators: {
    qqeMod: number;
    vvi: number;
    deltaVolume: number;
    pullback: number;
  };
}

const SignalAnalysis: React.FC = () => {
  const [signals, setSignals] = useState<SignalData[]>([
    {
      symbol: 'EUR/USD',
      signal: 'BUY',
      probability: 92,
      strength: 85,
      timeframe: 'H1',
      indicators: { qqeMod: 0.75, vvi: 65, deltaVolume: 68, pullback: 12 }
    },
    {
      symbol: 'BTC/USDT',
      signal: 'SELL',
      probability: 88,
      strength: 78,
      timeframe: 'M15',
      indicators: { qqeMod: -0.62, vvi: 45, deltaVolume: 72, pullback: 8 }
    },
    {
      symbol: 'GBP/JPY',
      signal: 'HOLD',
      probability: 45,
      strength: 32,
      timeframe: 'H4',
      indicators: { qqeMod: 0.12, vvi: 52, deltaVolume: 35, pullback: 18 }
    }
  ]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'bg-green-500';
      case 'SELL': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY': return <TrendingUp className="w-4 h-4" />;
      case 'SELL': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Signal Analysis</h2>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live">Live Signals</TabsTrigger>
          <TabsTrigger value="analysis">Technical Analysis</TabsTrigger>
          <TabsTrigger value="confluence">Confluence</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          {signals.map((signal, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{signal.symbol}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getSignalColor(signal.signal)} text-white`}>
                      {getSignalIcon(signal.signal)}
                      {signal.signal}
                    </Badge>
                    <Badge variant="outline">{signal.timeframe}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Probability</p>
                    <div className="flex items-center gap-2">
                      <Progress value={signal.probability} className="flex-1" />
                      <span className="text-sm font-medium">{signal.probability}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Signal Strength</p>
                    <div className="flex items-center gap-2">
                      <Progress value={signal.strength} className="flex-1" />
                      <span className="text-sm font-medium">{signal.strength}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3 pt-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">QQE MOD</p>
                    <p className="font-medium">{signal.indicators.qqeMod}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">VVI</p>
                    <p className="font-medium">{signal.indicators.vvi}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Delta Vol</p>
                    <p className="font-medium">{signal.indicators.deltaVolume}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Pullback</p>
                    <p className="font-medium">{signal.indicators.pullback}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Timeframe Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-4 text-center">
                  <div className="font-medium">Symbol</div>
                  <div className="font-medium">M15</div>
                  <div className="font-medium">H1</div>
                  <div className="font-medium">H4</div>
                  <div className="font-medium">D1</div>
                </div>
                {signals.map((signal, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 text-center py-2 border-t">
                    <div className="font-medium">{signal.symbol}</div>
                    <Badge className="bg-green-500 text-white">BUY</Badge>
                    <Badge className="bg-green-500 text-white">BUY</Badge>
                    <Badge className="bg-yellow-500 text-white">HOLD</Badge>
                    <Badge className="bg-red-500 text-white">SELL</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confluence">
          <Card>
            <CardHeader>
              <CardTitle>Indicator Confluence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Multi-indicator confluence analysis for high-probability trades
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">7/10</div>
                    <div className="text-sm text-gray-600">Bullish Signals</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">2/10</div>
                    <div className="text-sm text-gray-600">Bearish Signals</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">1/10</div>
                    <div className="text-sm text-gray-600">Neutral Signals</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SignalAnalysis;