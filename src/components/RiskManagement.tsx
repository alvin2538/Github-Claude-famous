import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Shield, TrendingDown, Activity, Target, BarChart3 } from 'lucide-react';

const RiskManagement = () => {
  const [riskSettings, setRiskSettings] = useState({
    maxDrawdown: 10,
    positionSize: 2,
    stopLoss: 1.5,
    takeProfit: 3.0,
    dailyLossLimit: 5000,
    correlationLimit: 0.7,
    volatilityFilter: true,
    newsFilter: true
  });

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'warning', message: 'EUR/USD position approaching stop loss', time: '2 min ago' },
    { id: 2, type: 'danger', message: 'Daily loss limit at 80%', time: '5 min ago' },
    { id: 3, type: 'info', message: 'High correlation detected: GBP/USD vs EUR/USD', time: '10 min ago' }
  ]);

  const riskMetrics = {
    currentDrawdown: 3.2,
    dailyLoss: 4200,
    openPositions: 8,
    totalExposure: 45000,
    riskRewardRatio: 2.1,
    portfolioHeat: 0.65,
    correlationRisk: 'Medium',
    volatilityIndex: 18.5
  };

  const positionRisks = [
    { pair: 'EUR/USD', size: 0.5, risk: 'Low', pnl: 245, exposure: 50000 },
    { pair: 'GBP/JPY', size: 0.3, risk: 'Medium', pnl: -120, exposure: 30000 },
    { pair: 'BTC/USD', size: 0.8, risk: 'High', pnl: 890, exposure: 80000 },
    { pair: 'XAU/USD', size: 0.4, risk: 'Low', pnl: 156, exposure: 40000 }
  ];

  const correlationData = [
    { asset1: 'EUR/USD', asset2: 'GBP/USD', correlation: 0.78, risk: 'High' },
    { asset1: 'BTC/USD', asset2: 'ETH/USD', correlation: 0.89, risk: 'Very High' },
    { asset1: 'USD/JPY', asset2: 'USD/CHF', correlation: 0.45, risk: 'Low' },
    { asset1: 'Gold', asset2: 'Silver', correlation: 0.72, risk: 'High' }
  ];

  const handleSettingChange = (key, value) => {
    setRiskSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold">Advanced Risk Management</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={riskMetrics.correlationRisk === 'High' ? 'destructive' : 'secondary'}>
            {riskMetrics.correlationRisk} Correlation Risk
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Current Drawdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{riskMetrics.currentDrawdown}%</div>
            <Progress value={(riskMetrics.currentDrawdown / riskSettings.maxDrawdown) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Heat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskMetrics.portfolioHeat}</div>
            <div className="text-sm text-muted-foreground">Risk concentration</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk/Reward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{riskMetrics.riskRewardRatio}:1</div>
            <div className="text-sm text-muted-foreground">Average ratio</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${riskMetrics.dailyLoss.toLocaleString()}</div>
            <Progress value={(riskMetrics.dailyLoss / riskSettings.dailyLossLimit) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Risk Settings</TabsTrigger>
          <TabsTrigger value="positions">Position Risk</TabsTrigger>
          <TabsTrigger value="correlation">Correlation Analysis</TabsTrigger>
          <TabsTrigger value="alerts">Risk Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Position Sizing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Position Size (%)</Label>
                  <Input
                    type="number"
                    value={riskSettings.positionSize}
                    onChange={(e) => handleSettingChange('positionSize', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Drawdown (%)</Label>
                  <Input
                    type="number"
                    value={riskSettings.maxDrawdown}
                    onChange={(e) => handleSettingChange('maxDrawdown', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Daily Loss Limit ($)</Label>
                  <Input
                    type="number"
                    value={riskSettings.dailyLossLimit}
                    onChange={(e) => handleSettingChange('dailyLossLimit', parseFloat(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Stop Loss (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={riskSettings.stopLoss}
                    onChange={(e) => handleSettingChange('stopLoss', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Take Profit (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={riskSettings.takeProfit}
                    onChange={(e) => handleSettingChange('takeProfit', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correlation Limit</Label>
                  <Input
                    type="number"
                    step="0.1"
                    max="1"
                    value={riskSettings.correlationLimit}
                    onChange={(e) => handleSettingChange('correlationLimit', parseFloat(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Advanced Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Volatility Filter</Label>
                  <Switch
                    checked={riskSettings.volatilityFilter}
                    onCheckedChange={(checked) => handleSettingChange('volatilityFilter', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>News Event Filter</Label>
                  <Switch
                    checked={riskSettings.newsFilter}
                    onCheckedChange={(checked) => handleSettingChange('newsFilter', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <div className="space-y-4">
            {positionRisks.map((position, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">{position.pair}</div>
                        <div className="text-sm text-muted-foreground">
                          Size: {position.size}% | Exposure: ${position.exposure.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl}
                      </div>
                      <Badge variant={
                        position.risk === 'High' ? 'destructive' :
                        position.risk === 'Medium' ? 'secondary' : 'default'
                      }>
                        {position.risk} Risk
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Asset Correlation Matrix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {correlationData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{item.asset1} vs {item.asset2}</div>
                      <div className="text-sm text-muted-foreground">
                        Correlation: {item.correlation}
                      </div>
                    </div>
                    <Badge variant={
                      item.risk === 'Very High' ? 'destructive' :
                      item.risk === 'High' ? 'destructive' :
                      item.risk === 'Medium' ? 'secondary' : 'default'
                    }>
                      {item.risk}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${
                alert.type === 'danger' ? 'border-l-red-500' :
                alert.type === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alert.type === 'danger' ? 'text-red-500' :
                      alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-muted-foreground">{alert.time}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskManagement;
