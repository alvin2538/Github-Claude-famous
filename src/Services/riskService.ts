// src/services/riskService.ts

export interface Account {
  id: string;
  balance: number;
  equity: number;
  marginUsed: number;
  freeMargin: number;
  marginLevel: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  timestamp: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Portfolio {
  id: string;
  accountId: string;
  totalValue: number;
  totalEquity: number;
  positions: Position[];
  cash: number;
  marginUsed: number;
  openPnL: number;
  closedPnL: number;
}

export interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  size: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface RiskMetrics {
  totalExposure: number;
  leverageRatio: number;
  marginUtilization: number;
  valueAtRisk: number;
  maxDrawdown: number;
  sharpeRatio: number;
  correlation: Record<string, number>;
  diversificationRatio: number;
  riskScore: number; // 0-100
  alerts: RiskAlert[];
}

export interface RiskAlert {
  id: string;
  type: 'warning' | 'critical';
  level: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
  symbol?: string;
  value?: number;
  threshold?: number;
}

export interface RiskLimits {
  maxPositionSize: number; // Max position size as % of portfolio
  maxLeverage: number;
  maxDrawdown: number; // Max allowed drawdown %
  maxDailyLoss: number; // Max daily loss %
  maxCorrelation: number; // Max correlation between positions
  stopLossPercent: number;
  takeProfitPercent: number;
  maxOpenPositions: number;
  maxRiskPerTrade: number; // Max risk per trade as % of account
  minimumMarginLevel: number; // Minimum margin level %
}

export interface VaRCalculation {
  confidence: number; // e.g., 0.95 for 95%
  timeHorizon: number; // in days
  method: 'historical' | 'parametric' | 'montecarlo';
  value: number;
  currency: string;
}

class RiskService {
  private riskLimits: RiskLimits = {
    maxPositionSize: 10, // 10% of portfolio
    maxLeverage: 3,
    maxDrawdown: 20, // 20%
    maxDailyLoss: 5, // 5%
    maxCorrelation: 0.7,
    stopLossPercent: 2,
    takeProfitPercent: 4,
    maxOpenPositions: 10,
    maxRiskPerTrade: 2, // 2% of account
    minimumMarginLevel: 100 // 100%
  };

  private priceHistory: Map<string, number[]> = new Map();
  private alerts: RiskAlert[] = [];

  /**
   * Calculate optimal position size based on risk percentage and stop loss
   */
  calculatePositionSize(
    account: Account, 
    riskPercentage: number, 
    entryPrice: number,
    stopLossPrice: number
  ): number {
    const accountBalance = account.balance;
    const riskAmount = accountBalance * (riskPercentage / 100);
    const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
    
    if (stopLossDistance === 0) {
      throw new Error('Stop loss distance cannot be zero');
    }
    
    const positionSize = riskAmount / stopLossDistance;
    const maxPositionValue = accountBalance * (this.riskLimits.maxPositionSize / 100);
    const maxPositionSize = maxPositionValue / entryPrice;
    
    return Math.min(positionSize, maxPositionSize);
  }

  /**
   * Validate order against risk limits
   */
  validateOrder(order: OrderRequest, portfolio: Portfolio, account: Account): { valid: boolean; reason?: string } {
    // Check if maximum number of positions would be exceeded
    if (portfolio.positions.length >= this.riskLimits.maxOpenPositions) {
      return { valid: false, reason: `Maximum number of positions (${this.riskLimits.maxOpenPositions}) would be exceeded` };
    }

    // Check position size limit
    const orderValue = order.size * (order.price || 0);
    const positionSizePercent = (orderValue / portfolio.totalValue) * 100;
    
    if (positionSizePercent > this.riskLimits.maxPositionSize) {
      return { valid: false, reason: `Position size ${positionSizePercent.toFixed(2)}% exceeds maximum ${this.riskLimits.maxPositionSize}%` };
    }

    // Check leverage limit
    const totalExposure = this.calculateTotalExposure(portfolio) + orderValue;
    const leverage = totalExposure / portfolio.totalValue;
    
    if (leverage > this.riskLimits.maxLeverage) {
      return { valid: false, reason: `Leverage ${leverage.toFixed(2)}x exceeds maximum ${this.riskLimits.maxLeverage}x` };
    }

    // Check margin requirements
    const requiredMargin = this.calculateRequiredMargin(order, account);
    if (account.freeMargin < requiredMargin) {
      return { valid: false, reason: `Insufficient margin: ${requiredMargin} required, ${account.freeMargin} available` };
    }

    // Check correlation limit
    const correlation = this.calculateCorrelation(order.symbol, portfolio);
    if (correlation > this.riskLimits.maxCorrelation) {
      return { valid: false, reason: `Correlation ${correlation.toFixed(2)} exceeds maximum ${this.riskLimits.maxCorrelation}` };
    }

    return { valid: true };
  }

  /**
   * Calculate Value at Risk for portfolio
   */
  calculateVaR(
    portfolio: Portfolio, 
    confidence: number = 0.95, 
    timeHorizon: number = 1,
    method: 'historical' | 'parametric' = 'historical'
  ): VaRCalculation {
    if (method === 'historical') {
      return this.calculateHistoricalVaR(portfolio, confidence, timeHorizon);
    } else {
      return this.calculateParametricVaR(portfolio, confidence, timeHorizon);
    }
  }

  private calculateHistoricalVaR(
    portfolio: Portfolio, 
    confidence: number, 
    timeHorizon: number
  ): VaRCalculation {
    const portfolioReturns = this.calculatePortfolioReturns(portfolio);
    
    if (portfolioReturns.length === 0) {
      return { confidence, timeHorizon, method: 'historical', value: 0, currency: 'USD' };
    }

    // Sort returns in ascending order
    portfolioReturns.sort((a, b) => a - b);
    
    // Calculate VaR at the specified confidence level
    const index = Math.floor((1 - confidence) * portfolioReturns.length);
    const varReturn = portfolioReturns[index] || 0;
    
    // Scale for time horizon (assuming normal distribution for scaling)
    const scaledVaR = varReturn * Math.sqrt(timeHorizon) * portfolio.totalValue;
    
    return {
      confidence,
      timeHorizon,
      method: 'historical',
      value: Math.abs(scaledVaR),
      currency: 'USD'
    };
  }

  private calculateParametricVaR(
    portfolio: Portfolio, 
    confidence: number, 
    timeHorizon: number
  ): VaRCalculation {
    const portfolioReturns = this.calculatePortfolioReturns(portfolio);
    
    if (portfolioReturns.length === 0) {
      return { confidence, timeHorizon, method: 'parametric', value: 0, currency: 'USD' };
    }

    // Calculate mean and standard deviation of returns
    const mean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
    const variance = portfolioReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / portfolioReturns.length;
    const stdDev = Math.sqrt(variance);
    
    // Z-score for the confidence level (assuming normal distribution)
    const zScore = this.getZScore(confidence);
    
    // Calculate VaR
    const varReturn = mean - zScore * stdDev;
    const scaledVaR = varReturn * Math.sqrt(timeHorizon) * portfolio.totalValue;
    
    return {
      confidence,
      timeHorizon,
      method: 'parametric',
      value: Math.abs(scaledVaR),
      currency: 'USD'
    };
  }

  /**
   * Monitor real-time risk metrics
   */
  monitorRisk(portfolio: Portfolio, account: Account): RiskMetrics {
    const metrics = this.calculateRiskMetrics(portfolio, account);
    
    // Generate alerts based on risk thresholds
    this.generateRiskAlerts(metrics, portfolio, account);
    
    return metrics;
  }

  private calculateRiskMetrics(portfolio: Portfolio, account: Account): RiskMetrics {
    const totalExposure = this.calculateTotalExposure(portfolio);
    const leverageRatio = totalExposure / portfolio.totalValue;
    const marginUtilization = (account.marginUsed / account.equity) * 100;
    const valueAtRisk = this.calculateVaR(portfolio).value;
    const maxDrawdown = this.calculateMaxDrawdown(portfolio);
    const sharpeRatio = this.calculateSharpeRatio(portfolio);
    const correlation = this.calculatePortfolioCorrelation(portfolio);
    const diversificationRatio = this.calculateDiversificationRatio(portfolio);
    const riskScore = this.calculateRiskScore(leverageRatio, marginUtilization, maxDrawdown, correlation);

    return {
      totalExposure,
      leverageRatio,
      marginUtilization,
      valueAtRisk,
      maxDrawdown,
      sharpeRatio,
      correlation,
      diversificationRatio,
      riskScore,
      alerts: [...this.alerts]
    };
  }

  private generateRiskAlerts(metrics: RiskMetrics, portfolio: Portfolio, account: Account): void {
    this.alerts = []; // Clear previous alerts

    // Leverage alert
    if (metrics.leverageRatio > this.riskLimits.maxLeverage * 0.8) {
      this.alerts.push({
        id: `leverage_${Date.now()}`,
        type: metrics.leverageRatio > this.riskLimits.maxLeverage ? 'critical' : 'warning',
        level: metrics.leverageRatio > this.riskLimits.maxLeverage ? 'high' : 'medium',
        message: `High leverage detected: ${metrics.leverageRatio.toFixed(2)}x`,
        timestamp: Date.now(),
        value: metrics.leverageRatio,
        threshold: this.riskLimits.maxLeverage
      });
    }

    // Margin alert
    if (metrics.marginUtilization > 80) {
      this.alerts.push({
        id: `margin_${Date.now()}`,
        type: metrics.marginUtilization > 90 ? 'critical' : 'warning',
        level: metrics.marginUtilization > 90 ? 'high' : 'medium',
        message: `High margin utilization: ${metrics.marginUtilization.toFixed(2)}%`,
        timestamp: Date.now(),
        value: metrics.marginUtilization,
        threshold: 90
      });
    }

    // Drawdown alert
    if (metrics.maxDrawdown > this.riskLimits.maxDrawdown * 0.7) {
      this.alerts.push({
        id: `drawdown_${Date.now()}`,
        type: metrics.maxDrawdown > this.riskLimits.maxDrawdown ? 'critical' : 'warning',
        level: metrics.maxDrawdown > this.riskLimits.maxDrawdown ? 'high' : 'medium',
        message: `High drawdown detected: ${metrics.maxDrawdown.toFixed(2)}%`,
        timestamp: Date.now(),
        value: metrics.maxDrawdown,
        threshold: this.riskLimits.maxDrawdown
      });
    }

    // Individual position alerts
    portfolio.positions.forEach(position => {
      const positionValue = Math.abs(position.size * position.currentPrice);
      const positionPercent = (positionValue / portfolio.totalValue) * 100;
      
      if (positionPercent > this.riskLimits.maxPositionSize * 0.8) {
        this.alerts.push({
          id: `position_${Date.now()}_${position.symbol}`,
          type: positionPercent > this.riskLimits.maxPositionSize ? 'critical' : 'warning',
          level: positionPercent > this.riskLimits.maxPositionSize ? 'high' : 'medium',
          message: `Large position in ${position.symbol}: ${positionPercent.toFixed(2)}%`,
          timestamp: Date.now(),
          symbol: position.symbol,
          value: positionPercent,
          threshold: this.riskLimits.maxPositionSize
        });
      }
    });
  }

  private calculateTotalExposure(portfolio: Portfolio): number {
    return portfolio.positions.reduce((total, position) => {
      return total + Math.abs(position.size * position.currentPrice);
    }, 0);
  }

  private calculateRequiredMargin(order: OrderRequest, account: Account): number {
    // Simplified margin calculation - typically would be more complex based on instrument
    const orderValue = order.size * (order.price || 0);
    const marginRate = 0.1; // 10% margin requirement (varies by instrument)
    return orderValue * marginRate;
  }

  private calculateCorrelation(symbol: string, portfolio: Portfolio): number {
    // Simplified correlation calculation
    // In practice, this would use historical price data to calculate correlation
    const similarPositions = portfolio.positions.filter(pos => {
      return pos.symbol.includes(symbol.split('/')[0]) || pos.symbol.includes(symbol.split('/')[1]);
    });
    
    return similarPositions.length > 0 ? 0.5 : 0; // Mock correlation
  }

  private calculatePortfolioReturns(portfolio: Portfolio): number[] {
    // This would typically calculate historical portfolio returns
    // For now, return mock data
    const mockReturns: number[] = [];
    for (let i = 0; i < 100; i++) {
      mockReturns.push((Math.random() - 0.5) * 0.1); // Random returns between -5% and 5%
    }
    return mockReturns;
  }

  private calculateMaxDrawdown(portfolio: Portfolio): number {
    // Calculate maximum drawdown from historical performance
    // Mock implementation
    return Math.random() * 15; // Random drawdown between 0-15%
  }

  private calculateSharpeRatio(portfolio: Portfolio): number {
    const returns = this.calculatePortfolioReturns(portfolio);
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    const riskFreeRate = 0.02 / 252; // 2% annual risk-free rate, daily
    return stdDev > 0 ? (avgReturn - riskFreeRate) / stdDev : 0;
  }

  private calculatePortfolioCorrelation(portfolio: Portfolio): Record<string, number> {
    const correlations: Record<string, number> = {};
    
    // Mock correlation matrix
    portfolio.positions.forEach(position => {
      correlations[position.symbol] = Math.random() * 0.8; // Random correlation
    });
    
    return correlations;
  }

  private calculateDiversificationRatio(portfolio: Portfolio): number {
    // Calculate diversification ratio
    // Mock implementation - typically weighted average of volatilities / portfolio volatility
    const numPositions = portfolio.positions.length;
    return Math.max(0.1, Math.min(1, numPositions / 10)); // Simple diversification measure
  }

  private calculateRiskScore(
    leverage: number, 
    marginUtilization: number, 
    drawdown: number, 
    avgCorrelation: number
  ): number {
    // Risk score from 0-100 (higher = riskier)
    let score = 0;
    
    // Leverage component (0-30 points)
    score += Math.min(30, (leverage / this.riskLimits.maxLeverage) * 30);
    
    // Margin utilization component (0-25 points)
    score += Math.min(25, (marginUtilization / 100) * 25);
    
    // Drawdown component (0-25 points)
    score += Math.min(25, (drawdown / this.riskLimits.maxDrawdown) * 25);
    
    // Correlation component (0-20 points)
    score += Math.min(20, avgCorrelation * 20);
    
    return Math.min(100, score);
  }

  private getZScore(confidence: number): number {
    // Z-scores for common confidence levels
    const zScores: Record<number, number> = {
      0.90: 1.282,
      0.95: 1.645,
      0.99: 2.326
    };
    
    return zScores[confidence] || 1.645; // Default to 95% confidence
  }

  /**
   * Update risk limits
   */
  updateRiskLimits(newLimits: Partial<RiskLimits>): void {
    this.riskLimits = { ...this.riskLimits, ...newLimits };
  }

  /**
   * Get current risk limits
   */
  getRiskLimits(): RiskLimits {
    return { ...this.riskLimits };
  }

  /**
   * Calculate optimal stop loss and take profit levels
   */
  calculateStopLossLevels(
    entryPrice: number,
    side: 'buy' | 'sell',
    volatility: number,
    riskRewardRatio: number = 2
  ): { stopLoss: number; takeProfit: number } {
    const volatilityFactor = Math.max(0.01, volatility); // Minimum 1% volatility
    
    if (side === 'buy') {
      const stopLoss = entryPrice * (1 - this.riskLimits.stopLossPercent / 100);
      const takeProfit = entryPrice * (1 + (this.riskLimits.stopLossPercent * riskRewardRatio) / 100);
      return { stopLoss, takeProfit };
    } else {
      const stopLoss = entryPrice * (1 + this.riskLimits.stopLossPercent / 100);
      const takeProfit = entryPrice * (1 - (this.riskLimits.stopLossPercent * riskRewardRatio) / 100);
      return { stopLoss, takeProfit };
    }
  }

  /**
   * Calculate position risk metrics
   */
  calculatePositionRisk(position: Position, account: Account): {
    riskAmount: number;
    riskPercent: number;
    marginRequired: number;
    unrealizedPnLPercent: number;
  } {
    const positionValue = Math.abs(position.size * position.entryPrice);
    const riskAmount = position.stopLoss ? 
      Math.abs(position.size * (position.entryPrice - position.stopLoss)) : 0;
    const riskPercent = account.balance > 0 ? (riskAmount / account.balance) * 100 : 0;
    const marginRequired = positionValue * 0.1; // 10% margin requirement
    const unrealizedPnLPercent = position.entryPrice > 0 ? 
      (position.unrealizedPnL / (position.size * position.entryPrice)) * 100 : 0;

    return {
      riskAmount,
      riskPercent,
      marginRequired,
      unrealizedPnLPercent
    };
  }

  /**
   * Emergency position closure recommendation
   */
  shouldClosePosition(position: Position, portfolio: Portfolio, account: Account): {
    shouldClose: boolean;
    reason?: string;
    urgency: 'low' | 'medium' | 'high';
  } {
    const positionRisk = this.calculatePositionRisk(position, account);
    
    // Check if position exceeds maximum risk
    if (positionRisk.riskPercent > this.riskLimits.maxRiskPerTrade * 2) {
      return {
        shouldClose: true,
        reason: `Position risk ${positionRisk.riskPercent.toFixed(2)}% exceeds maximum allowed`,
        urgency: 'high'
      };
    }
    
    // Check if margin level is too low
    if (account.marginLevel < this.riskLimits.minimumMarginLevel) {
      return {
        shouldClose: true,
        reason: `Margin level ${account.marginLevel.toFixed(2)}% below minimum ${this.riskLimits.minimumMarginLevel}%`,
        urgency: 'high'
      };
    }
    
    // Check unrealized loss
    if (positionRisk.unrealizedPnLPercent < -this.riskLimits.maxDailyLoss) {
      return {
        shouldClose: true,
        reason: `Unrealized loss ${positionRisk.unrealizedPnLPercent.toFixed(2)}% exceeds daily limit`,
        urgency: 'medium'
      };
    }
    
    return { shouldClose: false, urgency: 'low' };
  }

  /**
   * Get risk alerts
   */
  getRiskAlerts(): RiskAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear risk alerts
   */
  clearRiskAlerts(): void {
    this.alerts = [];
  }

  /**
   * Add custom risk alert
   */
  addRiskAlert(alert: Omit<RiskAlert, 'id' | 'timestamp'>): void {
    this.alerts.push({
      ...alert,
      id: `custom_${Date.now()}`,
      timestamp: Date.now()
    });
  }
}

// Singleton instance
export const riskService = new RiskService();
export { RiskService };
export type {
  Account,
  Position,
  Portfolio,
  OrderRequest as RiskOrderRequest,
  RiskMetrics,
  RiskAlert,
  RiskLimits,
  VaRCalculation
};
