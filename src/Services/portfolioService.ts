// src/services/portfolioService.ts

import { supabase } from '../lib/supabase';

export interface Trade {
  id: string;
  portfolioId: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
  commission: number;
  exchange: string;
  orderId?: string;
}

export interface Position {
  id: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  side: 'long' | 'short';
  entryDate: number;
  lastUpdated: number;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  totalValue: number;
  totalEquity: number;
  cashBalance: number;
  marginUsed: number;
  freeMargin: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  positions: Position[];
  createdAt: number;
  updatedAt: number;
}

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
  bid?: number;
  ask?: number;
}

export interface AllocationTarget {
  symbol: string;
  targetPercent: number;
  currentPercent: number;
  difference: number;
}

export interface RebalanceOrder {
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  currentQuantity: number;
  targetQuantity: number;
  estimatedValue: number;
  reason: string;
}

export interface PortfolioPerformance {
  period: string; // '1d', '1w', '1m', '3m', '1y', 'all'
  startValue: number;
  endValue: number;
  absoluteReturn: number;
  percentReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  avgTrade: number;
  totalTrades: number;
  benchmark?: {
    symbol: string;
    return: number;
    alpha: number;
    beta: number;
  };
}

export interface PortfolioAnalytics {
  diversification: {
    score: number; // 0-100
    breakdown: Record<string, number>; // sector/asset class breakdown
    concentrationRisk: number;
  };
  riskMetrics: {
    var95: number; // Value at Risk 95%
    expectedShortfall: number;
    beta: number;
    volatility: number;
    correlation: Record<string, number>;
  };
  allocation: {
    byAsset: Record<string, number>;
    byExchange: Record<string, number>;
    byCurrency: Record<string, number>;
    byMarketCap: Record<string, number>;
  };
}

class PortfolioService {
  private portfolios: Map<string, Portfolio> = new Map();
  private subscribers: Set<(portfolio: Portfolio) => void> = new Set();

  /**
   * Create a new portfolio
   */
  async createPortfolio(userId: string, name: string, description?: string, initialCash: number = 10000): Promise<Portfolio> {
    const portfolioId = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const portfolio: Portfolio = {
      id: portfolioId,
      userId,
      name,
      description,
      totalValue: initialCash,
      totalEquity: initialCash,
      cashBalance: initialCash,
      marginUsed: 0,
      freeMargin: initialCash,
      unrealizedPnL: 0,
      realizedPnL: 0,
      totalReturn: 0,
      totalReturnPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      positions: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Save to database
    try {
      const { error } = await supabase
        .from('portfolios')
        .insert({
          id: portfolioId,
          user_id: userId,
          name,
          description,
          total_value: initialCash,
          created_at: new Date(portfolio.createdAt).toISOString()
        });

      if (error) {
        console.error('Error creating portfolio in database:', error);
      }
    } catch (error) {
      console.error('Database error:', error);
    }

    this.portfolios.set(portfolioId, portfolio);
    return portfolio;
  }

  /**
   * Get portfolio by ID
   */
  async getPortfolio(portfolioId: string): Promise<Portfolio | null> {
    // First check in-memory cache
    if (this.portfolios.has(portfolioId)) {
      return this.portfolios.get(portfolioId)!;
    }

    // Load from database
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('id', portfolioId)
        .single();

      if (error || !data) {
        console.error('Error fetching portfolio:', error);
        return null;
      }

      // Load positions
      const positions = await this.loadPositions(portfolioId);
      
      const portfolio: Portfolio = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description,
        totalValue: data.total_value,
        totalEquity: data.total_value,
        cashBalance: data.total_value,
        marginUsed: 0,
        freeMargin: data.total_value,
        unrealizedPnL: 0,
        realizedPnL: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        positions,
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: Date.now()
      };

      this.portfolios.set(portfolioId, portfolio);
      return portfolio;
    } catch (error) {
      console.error('Database error:', error);
      return null;
    }
  }

  /**
   * Update positions after trades
   */
  async updatePositions(portfolioId: string, trades: Trade[]): Promise<boolean> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) {
      return false;
    }

    for (const trade of trades) {
      await this.processTrade(portfolio, trade);
    }

    // Recalculate portfolio metrics
    await this.recalculatePortfolio(portfolio);
    
    // Save to database
    await this.savePortfolio(portfolio);
    
    // Notify subscribers
    this.notifySubscribers(portfolio);
    
    return true;
  }

  private async processTrade(portfolio: Portfolio, trade: Trade): Promise<void> {
    const existingPosition = portfolio.positions.find(p => p.symbol === trade.symbol);

    if (existingPosition) {
      // Update existing position
      if (trade.side === 'buy') {
        const newQuantity = existingPosition.quantity + trade.quantity;
        const newAvgPrice = ((existingPosition.quantity * existingPosition.avgPrice) + (trade.quantity * trade.price)) / newQuantity;
        
        existingPosition.quantity = newQuantity;
        existingPosition.avgPrice = newAvgPrice;
      } else {
        // Selling
        existingPosition.quantity = Math.max(0, existingPosition.quantity - trade.quantity);
        
        // Calculate realized P&L
        const realizedPnL = trade.quantity * (trade.price - existingPosition.avgPrice);
        portfolio.realizedPnL += realizedPnL;
        portfolio.cashBalance += trade.quantity * trade.price - trade.commission;
      }

      existingPosition.lastUpdated = trade.timestamp;

      // Remove position if quantity is zero
      if (existingPosition.quantity === 0) {
        portfolio.positions = portfolio.positions.filter(p => p.id !== existingPosition.id);
      }
    } else if (trade.side === 'buy') {
      // Create new position
      const newPosition: Position = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        portfolioId: portfolio.id,
        symbol: trade.symbol,
        quantity: trade.quantity,
        avgPrice: trade.price,
        currentPrice: trade.price,
        marketValue: trade.quantity * trade.price,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        side: 'long',
        entryDate: trade.timestamp,
        lastUpdated: trade.timestamp
      };

      portfolio.positions.push(newPosition);
    }

    // Update cash balance
    if (trade.side === 'buy') {
      portfolio.cashBalance -= (trade.quantity * trade.price + trade.commission);
    } else {
      portfolio.cashBalance += (trade.quantity * trade.price - trade.commission);
    }

    // Save trade to database
    await this.saveTrade(trade);
  }

  /**
   * Calculate P&L with current prices
   */
  async calculatePnL(portfolioId: string, currentPrices: PriceData[]): Promise<{ unrealized: number; total: number }> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) {
      return { unrealized: 0, total: 0 };
    }

    const priceMap = new Map(currentPrices.map(p => [p.symbol, p.price]));
    let totalUnrealizedPnL = 0;

    // Update position prices and calculate unrealized P&L
    for (const position of portfolio.positions) {
      const currentPrice = priceMap.get(position.symbol);
      if (currentPrice) {
        position.currentPrice = currentPrice;
        position.marketValue = position.quantity * currentPrice;
        position.unrealizedPnL = position.quantity * (currentPrice - position.avgPrice);
        position.unrealizedPnLPercent = ((currentPrice - position.avgPrice) / position.avgPrice) * 100;
        position.lastUpdated = Date.now();
        
        totalUnrealizedPnL += position.unrealizedPnL;
      }
    }

    portfolio.unrealizedPnL = totalUnrealizedPnL;
    
    // Recalculate total portfolio metrics
    await this.recalculatePortfolio(portfolio);
    
    return {
      unrealized: portfolio.unrealizedPnL,
      total: portfolio.realizedPnL + portfolio.unrealizedPnL
    };
  }

  /**
   * Rebalance portfolio to target allocations
   */
  async rebalance(portfolioId: string, targets: AllocationTarget[]): Promise<RebalanceOrder[]> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) {
      return [];
    }

    const orders: RebalanceOrder[] = [];
    const totalValue = portfolio.totalValue;

    for (const target of targets) {
      const currentPosition = portfolio.positions.find(p => p.symbol === target.symbol);
      const currentValue = currentPosition ? currentPosition.marketValue : 0;
      const targetValue = totalValue * (target.targetPercent / 100);
      const difference = targetValue - currentValue;

      if (Math.abs(difference) > totalValue * 0.01) { // Only rebalance if difference > 1%
        const currentPrice = currentPosition?.currentPrice || 0;
        
        if (currentPrice > 0) {
          const quantityDifference = difference / currentPrice;
          const action = quantityDifference > 0 ? 'buy' : 'sell';
          
          orders.push({
            symbol: target.symbol,
            action,
            quantity: Math.abs(quantityDifference),
            currentQuantity: currentPosition?.quantity || 0,
            targetQuantity: targetValue / currentPrice,
            estimatedValue: Math.abs(difference),
            reason: `Rebalance from ${target.currentPercent.toFixed(2)}% to ${target.targetPercent.toFixed(2)}%`
          });
        }
      }
    }

    return orders;
  }

  /**
   * Get portfolio performance analytics
   */
  async getPerformance(portfolioId: string, period: string): Promise<PortfolioPerformance | null> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) {
      return null;
    }

    // Calculate performance metrics for the specified period
    const endValue = portfolio.totalValue;
    const startValue = this.getHistoricalValue(portfolio, period);
    const absoluteReturn = endValue - startValue;
    const percentReturn = startValue > 0 ? (absoluteReturn / startValue) * 100 : 0;

    // Load historical trades for the period
    const trades = await this.getTradeHistory(portfolioId, period);
    const winningTrades = trades.filter(t => this.getTradePnL(t) > 0);
    const losingTrades = trades.filter(t => this.getTradePnL(t) < 0);

    const performance: PortfolioPerformance = {
      period,
      startValue,
      endValue,
      absoluteReturn,
      percentReturn,
      volatility: this.calculateVolatility(portfolio, period),
      sharpeRatio: this.calculateSharpeRatio(portfolio, percentReturn),
      maxDrawdown: this.calculateMaxDrawdown(portfolio, period),
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      profitFactor: this.calculateProfitFactor(winningTrades, losingTrades),
      bestTrade: trades.length > 0 ? Math.max(...trades.map(t => this.getTradePnL(t))) : 0,
      worstTrade: trades.length > 0 ? Math.min(...trades.map(t => this.getTradePnL(t))) : 0,
      avgTrade: trades.length > 0 ? trades.reduce((sum, t) => sum + this.getTradePnL(t), 0) / trades.length : 0,
      total
