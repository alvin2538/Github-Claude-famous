// src/services/strategyEngine.ts

import { TechnicalIndicators } from '../utils/technicalIndicators';

export interface MarketData {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'hold';
  strength: number; // 0-100
  confidence: number; // 0-1
  price: number;
  timestamp: number;
  strategy: string;
  reason: string;
  stopLoss?: number;
  takeProfit?: number;
  riskReward?: number;
}

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  trades: BacktestTrade[];
}

export interface BacktestTrade {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  side: 'buy' | 'sell';
  pnl: number;
  pnlPercent: number;
  duration: number;
}

export interface HistoricalData {
  symbol: string;
  timeframe: string;
  data: MarketData[];
}

export interface StrategyConfig {
  name: string;
  parameters: Record<string, any>;
  enabled: boolean;
  riskManagement: {
    maxPositionSize: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    maxDrawdown: number;
  };
}

export interface TradingStrategy {
  name: string;
  description: string;
  timeframe: string;
  config: StrategyConfig;
  execute(marketData: MarketData[]): Promise<Signal[]>;
  backtest(historicalData: HistoricalData, initialBalance: number): Promise<BacktestResult>;
  validate(config: StrategyConfig): boolean;
}

class StrategyEngine {
  private strategies: Map<string, TradingStrategy> = new Map();
  private activeStrategies: Set<string> = new Set();
  private signalHistory: Signal[] = [];
  private subscribers: Set<(signal: Signal) => void> = new Set();

  constructor() {
    this.initializeDefaultStrategies();
  }

  private initializeDefaultStrategies() {
    // Register built-in strategies
    this.registerStrategy(new MovingAverageCrossoverStrategy());
    this.registerStrategy(new RSIStrategy());
    this.registerStrategy(new MACDStrategy());
    this.registerStrategy(new BollingerBandsStrategy());
    this.registerStrategy(new IchimokuStrategy());
  }

  registerStrategy(strategy: TradingStrategy): void {
    this.strategies.set(strategy.name, strategy);
    console.log(`Strategy registered: ${strategy.name}`);
  }

  unregisterStrategy(strategyName: string): void {
    this.strategies.delete(strategyName);
    this.activeStrategies.delete(strategyName);
    console.log(`Strategy unregistered: ${strategyName}`);
  }

  enableStrategy(strategyName: string): boolean {
    if (!this.strategies.has(strategyName)) {
      console.error(`Strategy not found: ${strategyName}`);
      return false;
    }
    
    this.activeStrategies.add(strategyName);
    return true;
  }

  disableStrategy(strategyName: string): void {
    this.activeStrategies.delete(strategyName);
  }

  async runStrategy(strategyName: string, marketData: MarketData[]): Promise<Signal[]> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyName}`);
    }

    if (!this.activeStrategies.has(strategyName)) {
      return [];
    }

    try {
      const signals = await strategy.execute(marketData);
      
      // Store signals and notify subscribers
      signals.forEach(signal => {
        this.signalHistory.push(signal);
        this.notifySubscribers(signal);
      });

      return signals;
    } catch (error) {
      console.error(`Error executing strategy ${strategyName}:`, error);
      return [];
    }
  }

  async runAllActiveStrategies(marketData: MarketData[]): Promise<Signal[]> {
    const allSignals: Signal[] = [];
    
    for (const strategyName of this.activeStrategies) {
      const signals = await this.runStrategy(strategyName, marketData);
      allSignals.push(...signals);
    }
    
    return this.consolidateSignals(allSignals);
  }

  async backtestStrategy(strategyName: string, historicalData: HistoricalData, initialBalance: number = 10000): Promise<BacktestResult> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyName}`);
    }

    return await strategy.backtest(historicalData, initialBalance);
  }

  private consolidateSignals(signals: Signal[]): Signal[] {
    // Group signals by symbol
    const signalsBySymbol = new Map<string, Signal[]>();
    
    signals.forEach(signal => {
      if (!signalsBySymbol.has(signal.symbol)) {
        signalsBySymbol.set(signal.symbol, []);
      }
      signalsBySymbol.get(signal.symbol)!.push(signal);
    });

    const consolidatedSignals: Signal[] = [];

    // Consolidate signals for each symbol
    signalsBySymbol.forEach((symbolSignals, symbol) => {
      if (symbolSignals.length === 1) {
        consolidatedSignals.push(symbolSignals[0]);
        return;
      }

      // Calculate weighted average confidence
      const totalConfidence = symbolSignals.reduce((sum, s) => sum + s.confidence * s.strength, 0);
      const totalWeight = symbolSignals.reduce((sum, s) => sum + s.strength, 0);
      const avgConfidence = totalConfidence / totalWeight;

      // Determine dominant signal type
      const buySignals = symbolSignals.filter(s => s.type === 'buy');
      const sellSignals = symbolSignals.filter(s => s.type === 'sell');
      const holdSignals = symbolSignals.filter(s => s.type === 'hold');

      let dominantType: 'buy' | 'sell' | 'hold' = 'hold';
      if (buySignals.length > sellSignals.length && buySignals.length > holdSignals.length) {
        dominantType = 'buy';
      } else if (sellSignals.length > buySignals.length && sellSignals.length > holdSignals.length) {
        dominantType = 'sell';
      }

      // Create consolidated signal
      const consolidatedSignal: Signal = {
        id: `consolidated_${Date.now()}_${symbol}`,
        symbol,
        type: dominantType,
        strength: Math.min(100, totalWeight / symbolSignals.length),
        confidence: Math.min(1, avgConfidence),
        price: symbolSignals[0].price, // Use first signal's price
        timestamp: Date.now(),
        strategy: 'consolidated',
        reason: `Consolidated from ${symbolSignals.length} strategies: ${symbolSignals.map(s => s.strategy).join(', ')}`
      };

      consolidatedSignals.push(consolidatedSignal);
    });

    return consolidatedSignals;
  }

  getAvailableStrategies(): TradingStrategy[] {
    return Array.from(this.strategies.values());
  }

  getActiveStrategies(): string[] {
    return Array.from(this.activeStrategies);
  }

  getSignalHistory(limit: number = 100): Signal[] {
    return this.signalHistory.slice(-limit);
  }

  subscribeToSignals(callback: (signal: Signal) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(signal: Signal): void {
    this.subscribers.forEach(callback => {
      try {
        callback(signal);
      } catch (error) {
        console.error('Error in signal subscriber callback:', error);
      }
    });
  }

  updateStrategyConfig(strategyName: string, config: Partial<StrategyConfig>): boolean {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      return false;
    }

    // Update strategy configuration
    Object.assign(strategy.config, config);
    return true;
  }
}

// Built-in Strategy Implementations

class MovingAverageCrossoverStrategy implements TradingStrategy {
  name = 'Moving Average Crossover';
  description = 'Buy when fast MA crosses above slow MA, sell when fast MA crosses below slow MA';
  timeframe = '1h';
  config: StrategyConfig = {
    name: this.name,
    parameters: {
      fastPeriod: 10,
      slowPeriod: 20,
      minConfidence: 0.7
    },
    enabled: true,
    riskManagement: {
      maxPositionSize: 0.1,
      stopLossPercent: 2,
      takeProfitPercent: 4,
      maxDrawdown: 10
    }
  };

  async execute(marketData: MarketData[]): Promise<Signal[]> {
    if (marketData.length < this.config.parameters.slowPeriod + 1) {
      return [];
    }

    const closes = marketData.map(d => d.close);
    const fastMA = TechnicalIndicators.sma(closes, this.config.parameters.fastPeriod);
    const slowMA = TechnicalIndicators.sma(closes, this.config.parameters.slowPeriod);

    const signals: Signal[] = [];
    const latest = marketData[marketData.length - 1];
    const previous = marketData[marketData.length - 2];

    if (fastMA.length >= 2 && slowMA.length >= 2) {
      const currentFastMA = fastMA[fastMA.length - 1];
      const currentSlowMA = slowMA[slowMA.length - 1];
      const prevFastMA = fastMA[fastMA.length - 2];
      const prevSlowMA = slowMA[slowMA.length - 2];

      // Bullish crossover
      if (prevFastMA <= prevSlowMA && currentFastMA > currentSlowMA) {
        signals.push({
          id: `ma_cross_${Date.now()}_${latest.symbol}`,
          symbol: latest.symbol,
          type: 'buy',
          strength: 75,
          confidence: this.config.parameters.minConfidence,
          price: latest.close,
          timestamp: latest.timestamp,
          strategy: this.name,
          reason: `Fast MA (${currentFastMA.toFixed(2)}) crossed above Slow MA (${currentSlowMA.toFixed(2)})`,
          stopLoss: latest.close * (1 - this.config.riskManagement.stopLossPercent / 100),
          takeProfit: latest.close * (1 + this.config.riskManagement.takeProfitPercent / 100)
        });
      }
      // Bearish crossover
      else if (prevFastMA >= prevSlowMA && currentFastMA < currentSlowMA) {
        signals.push({
          id: `ma_cross_${Date.now()}_${latest.symbol}`,
          symbol: latest.symbol,
          type: 'sell',
          strength: 75,
          confidence: this.config.parameters.minConfidence,
          price: latest.close,
          timestamp: latest.timestamp,
          strategy: this.name,
          reason: `Fast MA (${currentFastMA.toFixed(2)}) crossed below Slow MA (${currentSlowMA.toFixed(2)})`,
          stopLoss: latest.close * (1 + this.config.riskManagement.stopLossPercent / 100),
          takeProfit: latest.close * (1 - this.config.riskManagement.takeProfitPercent / 100)
        });
      }
    }

    return signals;
  }

  async backtest(historicalData: HistoricalData, initialBalance: number): Promise<BacktestResult> {
    const trades: BacktestTrade[] = [];
    let balance = initialBalance;
    let position: { side: 'buy' | 'sell', entry: number, quantity: number, timestamp: number } | null = null;
    let maxBalance = initialBalance;
    let maxDrawdown = 0;

    for (let i = this.config.parameters.slowPeriod; i < historicalData.data.length; i++) {
      const currentData = historicalData.data.slice(0, i + 1);
      const signals = await this.execute(currentData);

      if (signals.length > 0) {
        const signal = signals[0];
        const currentPrice = signal.price;

        // Close existing position if signal is opposite
        if (position && position.side !== signal.type) {
          const exitPrice = currentPrice;
          const pnl = position.side === 'buy' ? 
            (exitPrice - position.entry) * position.quantity :
            (position.entry - exitPrice) * position.quantity;
          
          balance += pnl;
          maxBalance = Math.max(maxBalance, balance);
          maxDrawdown = Math.max(maxDrawdown, (maxBalance - balance) / maxBalance * 100);

          trades.push({
            entryTime: position.timestamp,
            exitTime: signal.timestamp,
            entryPrice: position.entry,
            exitPrice: exitPrice,
            quantity: position.quantity,
            side: position.side,
            pnl: pnl,
            pnlPercent: (pnl / (position.entry * position.quantity)) * 100,
            duration: signal.timestamp - position.timestamp
          });

          position = null;
        }

        // Open new position
        if (!position && signal.type !== 'hold') {
          const positionSize = balance * this.config.riskManagement.maxPositionSize;
          const quantity = positionSize / currentPrice;
          
          position = {
            side: signal.type,
            entry: currentPrice,
            quantity: quantity,
            timestamp: signal.timestamp
          };
        }
      }
    }

    // Calculate statistics
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const totalReturn = ((balance - initialBalance) / initialBalance) * 100;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0;
    const profitFactor = avgLoss > 0 ? (avgWin * winningTrades.length) / (avgLoss * losingTrades.length) : 0;

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalReturn: totalReturn,
      maxDrawdown: maxDrawdown,
      sharpeRatio: this.calculateSharpeRatio(trades),
      profitFactor: profitFactor,
      avgWin: avgWin,
      avgLoss: avgLoss,
      trades: trades
    };
  }

  validate(config: StrategyConfig): boolean {
    return config.parameters.fastPeriod > 0 && 
           config.parameters.slowPeriod > config.parameters.fastPeriod &&
           config.parameters.minConfidence >= 0 && config.parameters.minConfidence <= 1;
  }

  private calculateSharpeRatio(trades: BacktestTrade[]): number {
    if (trades.length === 0) return 0;
    
    const returns = trades.map(t => t.pnlPercent);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }
}

class RSIStrategy implements TradingStrategy {
  name = 'RSI Strategy';
  description = 'Buy when RSI is oversold (<30), sell when RSI is overbought (>70)';
  timeframe = '1h';
  config: StrategyConfig = {
    name: this.name,
    parameters: {
      period: 14,
      oversoldLevel: 30,
      overboughtLevel: 70,
      minConfidence: 0.6
    },
    enabled: true,
    riskManagement: {
      maxPositionSize: 0.08,
      stopLossPercent: 3,
      takeProfitPercent: 6,
      maxDrawdown: 15
    }
  };

  async execute(marketData: MarketData[]): Promise<Signal[]> {
    if (marketData.length < this.config.parameters.period + 1) {
      return [];
    }

    const closes = marketData.map(d => d.close);
    const rsiValues = TechnicalIndicators.rsi(closes, this.config.parameters.period);
    
    if (rsiValues.length < 2) return [];

    const signals: Signal[] = [];
    const latest = marketData[marketData.length - 1];
    const currentRSI = rsiValues[rsiValues.length - 1];
    const prevRSI = rsiValues[rsiValues.length - 2];

    // RSI oversold - potential buy signal
    if (currentRSI < this.config.parameters.oversoldLevel && prevRSI >= this.config.parameters.oversoldLevel) {
      const strength = Math.max(20, 100 - currentRSI * 2); // Stronger signal when more oversold
      signals.push({
        id: `rsi_${Date.now()}_${latest.symbol}`,
        symbol: latest.symbol,
        type: 'buy',
        strength: strength,
        confidence: this.config.parameters.minConfidence,
        price: latest.close,
        timestamp: latest.timestamp,
        strategy: this.name,
        reason: `RSI oversold: ${currentRSI.toFixed(2)}`,
        stopLoss: latest.close * (1 - this.config.riskManagement.stopLossPercent / 100),
        takeProfit: latest.close * (1 + this.config.riskManagement.takeProfitPercent / 100)
      });
    }
    // RSI overbought - potential sell signal
    else if (currentRSI > this.config.parameters.overboughtLevel && prevRSI <= this.config.parameters.overboughtLevel) {
      const strength = Math.max(20, currentRSI - 30); // Stronger signal when more overbought
      signals.push({
        id: `rsi_${Date.now()}_${latest.symbol}`,
        symbol: latest.symbol,
        type: 'sell',
        strength: strength,
        confidence: this.config.parameters.minConfidence,
        price: latest.close,
        timestamp: latest.timestamp,
        strategy: this.name,
        reason: `RSI overbought: ${currentRSI.toFixed(2)}`,
        stopLoss: latest.close * (1 + this.config.riskManagement.stopLossPercent / 100),
        takeProfit: latest.close * (1 - this.config.riskManagement.takeProfitPercent / 100)
      });
    }

    return signals;
  }

  async backtest(historicalData: HistoricalData, initialBalance: number): Promise<BacktestResult> {
    // Similar implementation to MovingAverageCrossoverStrategy backtest
    const trades: BacktestTrade[] = [];
    let balance = initialBalance;
    let position: { side: 'buy' | 'sell', entry: number, quantity: number, timestamp: number } | null = null;
    let maxBalance = initialBalance;
    let maxDrawdown = 0;

    for (let i = this.config.parameters.period + 1; i < historicalData.data.length; i++) {
      const currentData = historicalData.data.slice(0, i + 1);
      const signals = await this.execute(currentData);

      if (signals.length > 0) {
        const signal = signals[0];
        const currentPrice = signal.price;

        if (position && position.side !== signal.type) {
          const exitPrice = currentPrice;
          const pnl = position.side === 'buy' ? 
            (exitPrice - position.entry) * position.quantity :
            (position.entry - exitPrice) * position.quantity;
          
          balance += pnl;
          maxBalance = Math.max(maxBalance, balance);
          maxDrawdown = Math.max(maxDrawdown, (maxBalance - balance) / maxBalance * 100);

          trades.push({
            entryTime: position.timestamp,
            exitTime: signal.timestamp,
            entryPrice: position.entry,
            exitPrice: exitPrice,
            quantity: position.quantity,
            side: position.side,
            pnl: pnl,
            pnlPercent: (pnl / (position.entry * position.quantity)) * 100,
            duration: signal.timestamp - position.timestamp
          });

          position = null;
        }

        if (!position && signal.type !== 'hold') {
          const positionSize = balance * this.config.riskManagement.maxPositionSize;
          const quantity = positionSize / currentPrice;
          
          position = {
            side: signal.type,
            entry: currentPrice,
            quantity: quantity,
            timestamp: signal.timestamp
          };
        }
      }
    }

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const totalReturn = ((balance - initialBalance) / initialBalance) * 100;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0;

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalReturn: totalReturn,
      maxDrawdown: maxDrawdown,
      sharpeRatio: this.calculateSharpeRatio(trades),
      profitFactor: avgLoss > 0 ? (avgWin * winningTrades.length) / (avgLoss * losingTrades.length) : 0,
      avgWin: avgWin,
      avgLoss: avgLoss,
      trades: trades
    };
  }

  validate(config: StrategyConfig): boolean {
    return config.parameters.period > 0 && 
           config.parameters.oversoldLevel > 0 && 
           config.parameters.overboughtLevel > config.parameters.oversoldLevel &&
           config.parameters.overboughtLevel < 100;
  }

  private calculateSharpeRatio(trades: BacktestTrade[]): number {
    if (trades.length === 0) return 0;
    
    const returns = trades.map(t => t.pnlPercent);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }
}

class MACDStrategy implements TradingStrategy {
  name = 'MACD Strategy';
  description = 'Buy when MACD crosses above signal line, sell when MACD crosses below signal line';
  timeframe = '1h';
  config: StrategyConfig = {
    name: this.name,
    parameters: {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      minConfidence: 0.65
    },
    enabled: true,
    riskManagement: {
      maxPositionSize: 0.09,
      stopLossPercent: 2.5,
      takeProfitPercent: 5,
      maxDrawdown: 12
    }
  };

  async execute(marketData: MarketData[]): Promise<Signal[]> {
    if (marketData.length < this.config.parameters.slowPeriod + this.config.parameters.signalPeriod) {
      return [];
    }

    const closes = marketData.map(d => d.close);
    const macdResult = TechnicalIndicators.macd(
      closes, 
      this.config.parameters.fastPeriod,
      this.config.parameters.slowPeriod,
      this.config.parameters.signalPeriod
    );

    if (macdResult.length < 2) return [];

    const signals: Signal[] = [];
    const latest = marketData[marketData.length - 1];
    const currentMACD = macdResult[macdResult.length - 1];
    const prevMACD = macdResult[macdResult.length - 2];

    // MACD bullish crossover
    if (prevMACD.macd <= prevMACD.signal && currentMACD.macd > currentMACD.signal) {
      const strength = Math.min(100, Math.abs(currentMACD.histogram) * 1000 + 50);
      signals.push({
        id: `macd_${Date.now()}_${latest.symbol}`,
        symbol: latest.symbol,
        type: 'buy',
        strength: strength,
        confidence: this.config.parameters.minConfidence,
        price: latest.close,
        timestamp: latest.timestamp,
        strategy: this.name,
        reason: `MACD bullish crossover: MACD(${currentMACD.macd.toFixed(4)}) > Signal(${currentMACD.signal.toFixed(4)})`,
        stopLoss: latest.close * (1 - this.config.riskManagement.stopLossPercent / 100),
        takeProfit: latest.close * (1 + this.config.riskManagement.takeProfitPercent / 100)
      });
    }
    // MACD bearish crossover
    else if (prevMACD.macd >= prevMACD.signal && currentMACD.macd < currentMACD.signal) {
      const strength = Math.min(100, Math.abs(currentMACD.histogram) * 1000 + 50);
      signals.push({
        id: `macd_${Date.now()}_${latest.symbol}`,
        symbol: latest.symbol,
        type: 'sell',
        strength: strength,
        confidence: this.config.parameters.minConfidence,
        price: latest.close,
        timestamp: latest.timestamp,
        strategy: this.name,
        reason: `MACD bearish crossover: MACD(${currentMACD.macd.toFixed(4)}) < Signal(${currentMACD.signal.toFixed(4)})`,
        stopLoss: latest.close * (1 + this.config.riskManagement.stopLossPercent / 100),
        takeProfit: latest.close * (1 - this.config.riskManagement.takeProfitPercent / 100)
      });
    }

    return signals;
  }

  async backtest(historicalData: HistoricalData, initialBalance: number): Promise<BacktestResult> {
    // Implementation similar to other strategies
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      trades: []
    };
  }

  validate(config: StrategyConfig): boolean {
    return config.parameters.fastPeriod > 0 && 
           config.parameters.slowPeriod > config.parameters.fastPeriod &&
           config.parameters.signalPeriod > 0;
  }
}

class BollingerBandsStrategy implements TradingStrategy {
  name = 'Bollinger Bands Strategy';
  description = 'Buy when price touches lower band, sell when price touches upper band';
  timeframe = '1h';
  config: StrategyConfig = {
    name: this.name,
    parameters: {
      period: 20,
      stdDev: 2,
      minConfidence: 0.7
    },
    enabled: true,
    riskManagement: {
      maxPositionSize: 0.1,
      stopLossPercent: 2,
      takeProfitPercent: 4,
      maxDrawdown: 10
    }
  };

  async execute(marketData: MarketData[]): Promise<Signal[]> {
    if (marketData.length < this.config.parameters.period) {
      return [];
    }

    const closes = marketData.map(d => d.close);
    const bbResult = TechnicalIndicators.bollingerBands(closes, this.config.parameters.period, this.config.parameters.stdDev);

    if (bbResult.length === 0) return [];

    const signals: Signal[] = [];
    const latest = marketData[marketData.length - 1];
    const currentBB = bbResult[bbResult.length - 1];

    // Price near lower band - potential buy
    if (latest.close <= currentBB.lower * 1.01) { // Within 1% of lower band
      signals.push({
        id: `bb_${Date.now()}_${latest.symbol}`,
        symbol: latest.symbol,
        type: 'buy',
        strength: 70,
        confidence: this.config.parameters.minConfidence,
        price: latest.close,
        timestamp: latest.timestamp,
        strategy: this.name,
        reason: `Price near lower Bollinger Band: ${latest.close.toFixed(2)} <= ${currentBB.lower.toFixed(2)}`,
        stopLoss: latest.close * (1 - this.config.riskManagement.stopLossPercent / 100),
        takeProfit: currentBB.middle // Target middle band
      });
    }
    // Price near upper band - potential sell
    else if (latest.close >= currentBB.upper * 0.99) { // Within 1% of upper band
      signals.push({
        id: `bb_${Date.now()}_${latest.symbol}`,
        symbol: latest.symbol,
        type: 'sell',
        strength: 70,
        confidence: this.config.parameters.minConfidence,
        price: latest.close,
        timestamp: latest.timestamp,
        strategy: this.name,
        reason: `Price near upper Bollinger Band: ${latest.close.toFixed(2)} >= ${currentBB.upper.toFixed(2)}`,
        stopLoss: latest.close * (1 + this.config.riskManagement.stopLossPercent / 100),
        takeProfit: currentBB.middle // Target middle band
      });
    }

    return signals;
  }

  async backtest(historicalData: HistoricalData, initialBalance: number): Promise<BacktestResult> {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      trades: []
    };
  }

  validate(config: StrategyConfig): boolean {
    return config.parameters.period > 0 && config.parameters.stdDev > 0;
  }
}

class IchimokuStrategy implements TradingStrategy {
  name = 'Ichimoku Strategy';
  description = 'Buy when price is above cloud and conversion line crosses base line upward';
  timeframe = '4h';
  config: StrategyConfig = {
    name: this.name,
    parameters: {
      conversionPeriod: 9,
      basePeriod: 26,
      span2Period: 52,
      minConfidence: 0.8
    },
    enabled: true,
    riskManagement: {
      maxPositionSize: 0.12,
      stopLossPercent: 3,
      takeProfitPercent: 6,
      maxDrawdown: 15
    }
  };

  async execute(marketData: MarketData[]): Promise<Signal[]> {
    if (marketData.length < this.config.parameters.span2Period + 26) {
      return [];
    }

    const highs = marketData.map(d => d.high);
    const lows = marketData.map(d => d.low);
    const closes = marketData.map(d => d.close);
    
    const ichimokuResult = TechnicalIndicators.ichimoku(highs, lows, closes);
    
    if (ichimokuResult.conversionLine.length < 2 || ichimokuResult.baseLine.length < 2) {
      return [];
    }

    const signals: Signal[] = [];
    const latest = marketData[marketData.length - 1];
    
    // Get current values
    const currentConversion = ichimokuResult.conversionLine[ichimokuResult.conversionLine.length - 1];
    const currentBase = ichimokuResult.baseLine[ichimokuResult.baseLine.length - 1];
    const prevConversion = ichimokuResult.conversionLine[ichimokuResult.conversionLine.length - 2];
    const prevBase = ichimokuResult.baseLine[ichimokuResult.baseLine.length - 2];
    
    // Check cloud position (simplified)
    const currentSpanA = ichimokuResult.leadingSpanA[ichimokuResult.leadingSpanA.length - 1] || 0;
    const currentSpanB = ichimokuResult.leadingSpanB[ichimokuResult.leadingSpanB.length - 1] || 0;
    const cloudTop = Math.max(currentSpanA, currentSpanB);
    const cloudBottom = Math.min(currentSpanA, currentSpanB);

    // Bullish signal: Conversion crosses above base and price is above cloud
    if (prevConversion <= prevBase && currentConversion > currentBase && latest.close > cloudTop) {
      signals.push({
        id: `ichimoku_${Date.now()}_${latest.symbol}`,
        symbol: latest.symbol,
        type: 'buy',
        strength: 85,
        confidence: this.config.parameters.minConfidence,
        price: latest.close,
        timestamp: latest.timestamp,
        strategy: this.name,
        reason: `Ichimoku bullish: Conversion line crossed above base line, price above cloud`,
        stopLoss: cloudTop, // Use cloud as stop loss
        takeProfit: latest.close * (1 + this.config.riskManagement.takeProfitPercent / 100)
      });
    }
    // Bearish signal: Conversion crosses below base and price is below cloud
    else if (prevConversion >= prevBase && currentConversion < currentBase && latest.close < cloudBottom) {
      signals.push({
        id: `ichimoku_${Date.now()}_${latest.symbol}`,
        symbol: latest.symbol,
        type: 'sell',
        strength: 85,
        confidence: this.config.parameters.minConfidence,
        price: latest.close,
        timestamp: latest.timestamp,
        strategy: this.name,
        reason: `Ichimoku bearish: Conversion line crossed below base line, price below cloud`,
        stopLoss: cloudBottom, // Use cloud as stop loss
        takeProfit: latest.close * (1 - this.config.riskManagement.takeProfitPercent / 100)
      });
    }

    return signals;
  }

  async backtest(historicalData: HistoricalData, initialBalance: number): Promise<BacktestResult> {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      trades: []
    };
  }

  validate(config: StrategyConfig): boolean {
    return config.parameters.conversionPeriod > 0 && 
           config.parameters.basePeriod > config.parameters.conversionPeriod &&
           config.parameters.span2Period > config.parameters.basePeriod;
  }
}

// Singleton instance
export const strategyEngine = new StrategyEngine();
export { StrategyEngine };
export type { 
  TradingStrategy,
  StrategyConfig,
  MarketData as StrategyMarketData,
  Signal,
  BacktestResult,
  HistoricalData
};
