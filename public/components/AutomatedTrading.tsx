import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, Settings, Bot, AlertTriangle } from 'lucide-react';

const AutomatedTrading = () => {
  const [isActive, setIsActive] = useState(false);
  const [strategies, setStrategies] = useState([
    {
      name: 'Scalping Pro',
      status: 'active',
      profit: 2.45,
      trades: 23,
      winRate: 78.3,
      enabled: true
    },
    {
      name: 'Swing Master',
      status: 'paused',
      profit: -0.85,
      trades: 12,
      winRate: 66.7,
      enabled: false
    },
    {
      name: 'Trend Follower',
      status: 'active',
      profit: 5.67,
      trades: 18,
      winRate: 83.3,
      enabled: true
    }
  ]);

  const toggleStrategy = (index: number) => {
    setStrategies(prev => prev.map((strategy, i) => 
      i === index ? { ...strategy, enabled: !strategy.enabled } : strategy
    ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Automated Trading Bot
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={isActive ? "destructive" : "default"}
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isActive ? 'Stop Bot' : 'Start Bot'}
            </Button>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? 'Running' : 'Stopped'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">+$1,247</div>
              <div className="text-sm text-muted-foreground">Today's P&L</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">53</div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">76.4%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">2.3%</div>
              <div className="text-sm text-muted-foreground">Drawdown</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Active Strategies
            </h3>
            {strategies.map((strategy, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={strategy.enabled}
                    onCheckedChange={() => toggleStrategy(index)}
                  />
                  <div>
                    <div className="font-medium">{strategy.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {strategy.trades} trades • {strategy.winRate}% win rate
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${strategy.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {strategy.profit >= 0 ? '+' : ''}{strategy.profit}%
                  </div>
                  <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                    {strategy.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Risk Warning</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Automated trading involves significant risk. Monitor your positions regularly and ensure proper risk management settings.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomatedTrading;