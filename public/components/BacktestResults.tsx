import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BacktestResult {
  strategy: string;
  period: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
}

export default function BacktestResults() {
  const [results] = useState<BacktestResult[]>([
    {
      strategy: 'QQE MOD + Volume Profile',
      period: '2019-2024 (5 years)',
      totalReturn: 234.5,
      sharpeRatio: 2.14,
      maxDrawdown: -8.3,
      winRate: 67.2,
      totalTrades: 1247,
      profitFactor: 1.85
    },
    {
      strategy: 'Trend Reversal + Order Flow',
      period: '2020-2024 (4 years)',
      totalReturn: 189.3,
      sharpeRatio: 1.87,
      maxDrawdown: -12.1,
      winRate: 62.8,
      totalTrades: 892,
      profitFactor: 1.67
    },
    {
      strategy: 'Multi-Timeframe Confluence',
      period: '2021-2024 (3 years)',
      totalReturn: 156.7,
      sharpeRatio: 2.31,
      maxDrawdown: -6.9,
      winRate: 71.4,
      totalTrades: 634,
      profitFactor: 2.12
    }
  ]);

  const getPerformanceColor = (value: number, type: 'return' | 'sharpe' | 'drawdown' | 'winrate') => {
    switch (type) {
      case 'return':
        return value > 100 ? 'text-green-600' : value > 50 ? 'text-yellow-600' : 'text-red-600';
      case 'sharpe':
        return value > 2 ? 'text-green-600' : value > 1 ? 'text-yellow-600' : 'text-red-600';
      case 'drawdown':
        return value > -10 ? 'text-green-600' : value > -20 ? 'text-yellow-600' : 'text-red-600';
      case 'winrate':
        return value > 60 ? 'text-green-600' : value > 50 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Backtesting Results</CardTitle>
          <CardDescription>Historical performance analysis of trading strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Strategy Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {results.map((result, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{result.strategy}</CardTitle>
                      <Badge variant={result.totalReturn > 150 ? 'default' : 'secondary'}>
                        {result.totalReturn > 150 ? 'Excellent' : 'Good'}
                      </Badge>
                    </div>
                    <CardDescription>{result.period}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getPerformanceColor(result.totalReturn, 'return')}`}>
                          {result.totalReturn}%
                        </div>
                        <div className="text-sm text-muted-foreground">Total Return</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getPerformanceColor(result.sharpeRatio, 'sharpe')}`}>
                          {result.sharpeRatio}
                        </div>
                        <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getPerformanceColor(result.maxDrawdown, 'drawdown')}`}>
                          {result.maxDrawdown}%
                        </div>
                        <div className="text-sm text-muted-foreground">Max Drawdown</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getPerformanceColor(result.winRate, 'winrate')}`}>
                          {result.winRate}%
                        </div>
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="detailed" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance Comparison</h3>
                {results.map((result, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{result.strategy}</span>
                      <span className="text-sm text-muted-foreground">{result.totalTrades} trades</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Win Rate</span>
                        <span>{result.winRate}%</span>
                      </div>
                      <Progress value={result.winRate} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Profit Factor:</span>
                        <span className="font-mono">{result.profitFactor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sharpe Ratio:</span>
                        <span className="font-mono">{result.sharpeRatio}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}