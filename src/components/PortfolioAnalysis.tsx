import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PieChart, BarChart3, TrendingUp, AlertTriangle, Shield, Target } from 'lucide-react';

const PortfolioAnalysis = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');

  const correlationMatrix = [
    { pair: 'EUR/USD vs GBP/USD', correlation: 0.78, risk: 'High' },
    { pair: 'USD/JPY vs EUR/JPY', correlation: 0.65, risk: 'Medium' },
    { pair: 'BTC/USD vs ETH/USD', correlation: 0.89, risk: 'Very High' },
    { pair: 'Gold vs Silver', correlation: 0.72, risk: 'High' },
    { pair: 'Oil vs CAD/USD', correlation: -0.43, risk: 'Low' }
  ];

  const portfolioMetrics = {
    totalValue: 125840.50,
    dailyPnL: 2340.75,
    weeklyPnL: 8920.30,
    monthlyPnL: 15670.80,
    sharpeRatio: 2.14,
    maxDrawdown: -8.5,
    winRate: 68.4,
    riskScore: 7.2
  };

  const allocations = [
    { asset: 'Forex', percentage: 45, value: 56628, color: 'bg-blue-500' },
    { asset: 'Crypto', percentage: 30, value: 37752, color: 'bg-purple-500' },
    { asset: 'Commodities', percentage: 15, value: 18876, color: 'bg-yellow-500' },
    { asset: 'Indices', percentage: 10, value: 12584, color: 'bg-green-500' }
  ];

  const riskMetrics = [
    { name: 'Value at Risk (95%)', value: '$3,245', status: 'Normal' },
    { name: 'Expected Shortfall', value: '$4,890', status: 'Elevated' },
    { name: 'Beta', value: '1.23', status: 'High' },
    { name: 'Volatility', value: '18.5%', status: 'Normal' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Portfolio Analysis</h2>
        </div>
        <div className="flex gap-2">
          {['1D', '1W', '1M', '3M'].map((tf) => (
            <Button
              key={tf}
              variant={selectedTimeframe === tf ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioMetrics.totalValue.toLocaleString()}</div>
            <div className="text-sm text-green-600 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              +{portfolioMetrics.dailyPnL.toLocaleString()} (24h)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioMetrics.sharpeRatio}</div>
            <div className="text-sm text-muted-foreground">Risk-adjusted return</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{portfolioMetrics.maxDrawdown}%</div>
            <div className="text-sm text-muted-foreground">Worst decline</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{portfolioMetrics.winRate}%</div>
            <div className="text-sm text-muted-foreground">Successful trades</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allocation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="allocation">Asset Allocation</TabsTrigger>
          <TabsTrigger value="correlation">Correlation Matrix</TabsTrigger>
          <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="allocation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allocations.map((asset, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{asset.asset}</span>
                      <span>{asset.percentage}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${asset.color}`} />
                      <Progress value={asset.percentage} className="flex-1" />
                      <span className="text-sm text-muted-foreground">
                        ${asset.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Daily P&L</span>
                  <span className="text-green-600 font-medium">
                    +${portfolioMetrics.dailyPnL.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly P&L</span>
                  <span className="text-green-600 font-medium">
                    +${portfolioMetrics.weeklyPnL.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly P&L</span>
                  <span className="text-green-600 font-medium">
                    +${portfolioMetrics.monthlyPnL.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Correlation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {correlationMatrix.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.pair}</div>
                      <div className="text-sm text-muted-foreground">
                        Correlation: {item.correlation > 0 ? '+' : ''}{item.correlation}
                      </div>
                    </div>
                    <Badge variant={
                      item.risk === 'Very High' ? 'destructive' :
                      item.risk === 'High' ? 'destructive' :
                      item.risk === 'Medium' ? 'secondary' : 'default'
                    }>
                      {item.risk} Risk
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {riskMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5" />
                    {metric.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <Badge variant={
                      metric.status === 'High' ? 'destructive' :
                      metric.status === 'Elevated' ? 'secondary' : 'default'
                    }>
                      {metric.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Optimization Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />
                  <div>
                    <div className="font-medium">Reduce Crypto Exposure</div>
                    <div className="text-sm text-muted-foreground">
                      High correlation between BTC and ETH positions
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mt-1" />
                  <div>
                    <div className="font-medium">Increase Commodities</div>
                    <div className="text-sm text-muted-foreground">
                      Low correlation provides better diversification
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">{portfolioMetrics.riskScore}/10</div>
                  <Progress value={portfolioMetrics.riskScore * 10} className="h-3" />
                  <div className="text-sm text-muted-foreground">
                    Moderate risk profile with room for optimization
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioAnalysis;