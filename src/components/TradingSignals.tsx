// src/components/TradingSignals.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Play, 
  Pause, 
  Settings,
  Brain,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { strategyEngine, Signal, TradingStrategy } from '../services/strategyEngine';
import { websocketService, MarketData } from '../services/websocketService';

interface ExtendedSignal extends Signal {
  isNew?: boolean;
  age?: number;
}

const TradingSignals = () => {
  const [signals, setSignals] = useState<ExtendedSignal[]>([]);
  const [availableStrategies, setAvailableStrategies] = useState<TradingStrategy[]>([]);
  const [activeStrategies, setActiveStrategies] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [autoExecute, setAutoExecute] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Load available strategies on component mount
  useEffect(() => {
    const strategies = strategyEngine.getAvailableStrategies();
    setAvailableStrategies(strategies);
    
    // Enable some default strategies
    const defaultStrategies = ['Moving Average Crossover', 'RSI Strategy'];
    defaultStrategies.forEach(name => {
      strategyEngine.enableStrategy(name);
    });
    setActiveStrategies(strategyEngine.getActiveStrategies());
  }, []);

  // Subscribe to real-time signals
  useEffect(() => {
    const unsubscribeSignals = strategyEngine.subscribeToSignals((signal: Signal) => {
      setSignals(prev => {
        const newSignal: ExtendedSignal = {
          ...signal,
          isNew: true,
          age: 0
        };
        
        // Remove duplicate signals for same symbol
        const filtered = prev.filter(s => 
          !(s.symbol === signal.symbol && s.strategy === signal.strategy)
        );
        
        return [newSignal, ...filtered.slice(0, 49)]; // Keep last 50 signals
      });
      setLastUpdate(new Date());
    });

    return () => {
      unsubscribeSignals();
    };
  }, []);

  // Subscribe to market data for strategy execution
  useEffect(() => {
    const unsubscribeMarketData = websocketService.subscribe('binance', 'all', (data: MarketData) => {
      setMarketData(prev => {
        const filtered = prev.filter(d => d.symbol !== data.symbol);
        const updated = [...filtered, data].slice(-100); // Keep last 100 data points
        return updated;
      });
    });

    return () => {
      if (unsubscribeMarketData) {
        // WebSocket unsubscribe would be implemented here
      }
    };
  }, []);

  // Run strategies periodically when active
  useEffect(() => {
    if (!isRunning || marketData.length === 0) return;

    const interval = setInterval(async () => {
      try {
        setError(null);
        
        // Group market data by symbol for strategy execution
        const symbolData = new Map<string, MarketData[]>();
        
        marketData.forEach(data => {
          if (!symbolData.has(data.symbol)) {
            symbolData.set(data.symbol, []);
          }
          symbolData.get(data.symbol)!.push(data);
        });

        // Run strategies for each symbol with sufficient data
        for (const [symbol, data] of symbolData) {
          if (data.length >= 50) { // Minimum data points for reliable signals
            const sortedData = data.sort((a, b) => a.timestamp - b.timestamp);
            
            // Convert to the format expected by strategy engine
            const strategyData = sortedData.map(d => ({
              symbol: d.symbol,
              timestamp: d.timestamp,
              open: d.price * 0.999, // Mock OHLC data
              high: d.price * 1.001,
              low: d.price * 0.998,
              close: d.price,
              volume: d.volume
            }));

            // Run all active strategies
            await strategyEngine.runAllActiveStrategies(strategyData);
          }
        }
      } catch (error) {
        console.error('Error running strategies:', error);
        setError(error instanceof Error ? error.message : 'Strategy execution failed');
      }
    }, 30000); // Run every 30 seconds

    return () => clearInterval(interval);
  }, [isRunning, marketData]);

  // Age signals over time
  useEffect(() => {
    const interval = setInterval(() => {
      setSignals(prev => prev.map(signal => ({
        ...signal,
        isNew: false,
        age: (signal.age || 0) + 1
      })));
    }, 60000); // Update age every minute

    return () => clearInterval(interval);
  }, []);

  const toggleStrategy = useCallback((strategyName: string) => {
    const isActive = activeStrategies.includes(strategyName);
    
    if (isActive) {
      strategyEngine.disableStrategy(strategyName);
    } else {
      strategyEngine.enableStrategy(strategyName);
    }
    
    setActiveStrategies(strategyEngine.getActiveStrategies());
  }, [activeStrategies]);

  const toggleSignalEngine = useCallback(() => {
    setIsRunning(!isRunning);
  }, [isRunning]);

  const clearSignals = useCallback(() => {
    setSignals([]);
  }, []);

  const getSignalIcon = (type: 'buy' | 'sell' | 'hold') => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'hold':
        return <Minus className="h-4 w-4 text-yellow-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSignalColor = (type: 'buy' | 'sell' | 'hold') => {
    switch (type) {
      case 'buy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sell':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Filter signals by minimum confidence
  const filteredSignals = signals.filter(signal => signal.confidence >= minConfidence);

  // Group signals by type
  const signalStats = {
    buy: filteredSignals.filter(s => s.type === 'buy').length,
    sell: filteredSignals.filter(s => s.type === 'sell').length,
    hold: filteredSignals.filter(s => s.type === 'hold').length,
    total: filteredSignals.length
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Trading Signal Engine
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={isRunning ? "destructive" : "default"}
                size="sm"
                onClick={toggleSignalEngine}
              >
                {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isRunning ? 'Stop' : 'Start'}
              </Button>
              <Badge variant={isRunning ? "default" : "secondary"}>
                {isRunning ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Strategy Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Active Strategies</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableStrategies.map(strategy => (
                  <div key={strategy.name} className="flex items-center space-x-2">
                    <Switch
                      checked={activeStrategies.includes(strategy.name)}
                      onCheckedChange={() => toggleStrategy(strategy.name)}
                    />
                    <span className="text-sm">{strategy.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Configuration</label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">Timeframe</label>
                  <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 Minute</SelectItem>
                      <SelectItem value="5m">5 Minutes</SelectItem>
                      <SelectItem value="15m">15 Minutes</SelectItem>
                      <SelectItem value="1h">1 Hour</SelectItem>
                      <SelectItem value="4h">4 Hours</SelectItem>
                      <SelectItem value="1d">1 Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Min Confidence: {minConfidence.toFixed(1)}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Signal Statistics</label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Buy Signals:</span>
                  <span className="font-medium text-green-600">{signalStats.buy}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sell Signals:</span>
                  <span className="font-medium text-red-600">{signalStats.sell}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hold Signals:</span>
                  <span className="font-medium text-yellow-600">{signalStats.hold}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium">{signalStats.total}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Signals List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Signals</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearSignals}>
                Clear
              </Button>
              <span className="text-sm text-muted-foreground">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredSignals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No signals generated yet.</p>
              <p className="text-sm">Start the signal engine and ensure strategies are active.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredSignals.map((signal, index) => (
                <div
                  key={`${signal.id}-${index}`}
                  className={`p-3 border rounded-lg transition-all duration-200 ${
                    signal.isNew ? 'bg-blue-50 border-blue-200' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSignalIcon(signal.type)}
                      <div>
                        <div className="font-medium">{signal.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {signal.strategy}
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <Badge className={`${getSignalColor(signal.type)} mb-1`}>
                        {signal.type.toUpperCase()}
                      </Badge>
                      <div className="text-sm font-medium">
                        ${signal.price.toFixed(4)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm font-medium ${getConfidenceColor(signal.confidence)}`}>
                        {(signal.confidence * 100).toFixed(0)}% confidence
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Strength: {signal.strength}/100
                      </div>
                    </div>

                    <div className="text-right text-xs text-muted-foreground">
                      <div>{new Date(signal.timestamp).toLocaleTimeString()}</div>
                      {signal.age !== undefined && signal.age > 0 && (
                        <div>{signal.age}m ago</div>
                      )}
                    </div>
                  </div>

                  {signal.reason && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {signal.reason}
                    </div>
                  )}

                  {(signal.stopLoss || signal.takeProfit) && (
                    <div className="mt-2 flex gap-4 text-xs">
                      {signal.stopLoss && (
                        <span>SL: ${signal.stopLoss.toFixed(4)}</span>
                      )}
                      {signal.takeProfit && (
                        <span>TP: ${signal.takeProfit.toFixed(4)}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingSignals;
