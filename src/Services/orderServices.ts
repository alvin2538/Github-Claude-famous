// src/services/orderService.ts

import { supabase } from '../lib/supabase';
import { exchangeService } from './exchangeService';
import { riskService } from './riskService';
import { portfolioService } from './portfolioService';

export interface OrderRequest {
  portfolioId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'DAY';
  exchange: string;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
}

export interface Order {
  id: string;
  portfolioId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price: number;
  stopPrice?: number;
  status: 'pending' | 'submitted' | 'partially_filled' | 'filled' | 'canceled' | 'rejected' | 'expired';
  filledQuantity: number;
  remainingQuantity: number;
  avgFillPrice: number;
  totalFillValue: number;
  commission: number;
  exchange: string;
  exchangeOrderId?: string;
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'DAY';
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  filledAt?: number;
  fills: Fill[];
  rejectionReason?: string;
}

export interface Fill {
  id: string;
  orderId: string;
  quantity: number;
  price: number;
  commission: number;
  timestamp: number;
  tradeId?: string;
}

export interface OrderValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  estimatedCost: number;
  estimatedCommission: number;
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    positionSizePercent: number;
    leverageImpact: number;
  };
}

export interface ExecutionReport {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  executedQuantity: number;
  avgPrice: number;
  totalValue: number;
  commission: number;
  status: 'success' | 'partial' | 'failed';
  message: string;
  timestamp: number;
  fills: Fill[];
}

class OrderService {
  private orders: Map<string, Order> = new Map();
  private pendingOrders: Map<string, Order> = new Map();
  private subscribers: Set<(order: Order) => void> = new Set();
  private executionSubscribers: Set<(report: ExecutionReport) => void> = new Set();

  /**
   * Validate an order before execution
   */
  async validateOrder(orderRequest: OrderRequest): Promise<OrderValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!orderRequest.symbol) {
      errors.push('Symbol is required');
    }
    if (!orderRequest.quantity || orderRequest.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }
    if ((orderRequest.type === 'limit' || orderRequest.type === 'stop_limit') && (!orderRequest.price || orderRequest.price <= 0)) {
      errors.push('Price is required for limit orders');
    }
    if ((orderRequest.type === 'stop' || orderRequest.type === 'stop_limit') && (!orderRequest.stopPrice || orderRequest.stopPrice <= 0)) {
      errors.push('Stop price is required for stop orders');
    }

    // Get portfolio and account info
    const portfolio = await portfolioService.getPortfolio(orderRequest.portfolioId);
    if (!portfolio) {
      errors.push('Portfolio not found');
      return {
        valid: false,
        errors,
        warnings,
        estimatedCost: 0,
        estimatedCommission: 0,
        riskAssessment: {
          riskLevel: 'high',
          riskFactors: ['Portfolio not found'],
          positionSizePercent: 0,
          leverageImpact: 0
        }
      };
    }

    // Calculate estimated costs
    const estimatedPrice = orderRequest.price || await this.getEstimatedPrice(orderRequest.symbol, orderRequest.side);
    const estimatedCost = orderRequest.quantity * estimatedPrice;
    const estimatedCommission = this.calculateCommission(orderRequest.exchange, estimatedCost);

    // Check cash balance for buy orders
    if (orderRequest.side === 'buy' && portfolio.cashBalance < estimatedCost + estimatedCommission) {
      errors.push(`Insufficient cash balance. Required: ${(estimatedCost + estimatedCommission).toFixed(2)}, Available: ${portfolio.cashBalance.toFixed(2)}`);
    }

    // Check position size for sell orders
    if (orderRequest.side === 'sell') {
      const existingPosition = portfolio.positions.find(p => p.symbol === orderRequest.symbol);
      if (!existingPosition || existingPosition.quantity < orderRequest.quantity) {
        errors.push(`Insufficient position size. Requested: ${orderRequest.quantity}, Available: ${existingPosition?.quantity || 0}`);
      }
    }

    // Risk validation
    const mockAccount = {
      id: portfolio.id,
      balance: portfolio.cashBalance,
      equity: portfolio.totalEquity,
      marginUsed: portfolio.marginUsed,
      freeMargin: portfolio.freeMargin,
      marginLevel: 100
    };

    const riskValidation = riskService.validateOrder({
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      size: orderRequest.quantity,
      price: estimatedPrice,
      stopLoss: orderRequest.stopLoss,
      takeProfit: orderRequest.takeProfit
    }, portfolio, mockAccount);

    if (!riskValidation.valid && riskValidation.reason) {
      errors.push(riskValidation.reason);
    }

    // Risk assessment
    const positionSizePercent = (estimatedCost / portfolio.totalValue) * 100;
    const riskFactors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (positionSizePercent > 10) {
      riskFactors.push('Large position size');
      riskLevel = 'high';
    } else if (positionSizePercent > 5) {
      riskFactors.push('Medium position size');
      riskLevel = 'medium';
    }

    if (orderRequest.type === 'market') {
      riskFactors.push('Market order - price uncertainty');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Market hours warning
    if (!this.isMarketOpen(orderRequest.symbol)) {
      warnings.push('Market is currently closed');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      estimatedCost,
      estimatedCommission,
      riskAssessment: {
        riskLevel,
        riskFactors,
        positionSizePercent,
        leverageImpact: 0 // Would calculate based on leverage
      }
    };
  }

  /**
   * Execute an order
   */
  async executeOrder(orderRequest: OrderRequest): Promise<ExecutionReport> {
    // Validate order first
    const validation = await this.validateOrder(orderRequest);
    if (!validation.valid) {
      return {
        orderId: '',
        symbol: orderRequest.symbol,
        side: orderRequest.side,
        executedQuantity: 0,
        avgPrice: 0,
        totalValue: 0,
        commission: 0,
        status: 'failed',
        message: `Order validation failed: ${validation.errors.join(', ')}`,
        timestamp: Date.now(),
        fills: []
      };
    }

    // Create order
    const order = await this.createOrder(orderRequest, validation);

    try {
      // Submit to exchange
      const exchangeOrder = await exchangeService.placeOrder(orderRequest.exchange, {
        symbol: orderRequest.symbol,
        type: orderRequest.type,
        side: orderRequest.side,
        amount: orderRequest.quantity,
        price: orderRequest.price
      });

      if (exchangeOrder) {
        order.exchangeOrderId = exchangeOrder.id;
        order.status = 'submitted';
        order.updatedAt = Date.now();

        // Simulate immediate execution for market orders
        if (orderRequest.type === 'market') {
          await this.processExecution(order, orderRequest.quantity, validation.estimatedCost / orderRequest.quantity);
        }

        await this.saveOrder(order);
        this.notifySubscribers(order);

        const executionReport: ExecutionReport = {
          orderId: order.id,
          symbol: order.symbol,
          side: order.side,
          executedQuantity: order.filledQuantity,
          avgPrice: order.avgFillPrice,
          totalValue: order.totalFillValue,
          commission: order.commission,
          status: order.status === 'filled' ? 'success' : 'partial',
          message: order.status === 'filled' ? 'Order executed successfully' : 'Order partially executed',
          timestamp: Date.now(),
          fills: order.fills
        };

        this.notifyExecutionSubscribers(executionReport);
        return executionReport;
      } else {
        throw new Error('Failed to submit order to exchange');
      }
    } catch (error) {
      order.status = 'rejected';
      order.rejectionReason = error instanceof Error ? error.message : 'Unknown error';
      order.updatedAt = Date.now();

      await this.saveOrder(order);
      this.notifySubscribers(order);

      return {
        orderId: order.id,
        symbol: orderRequest.symbol,
        side: orderRequest.side,
        executedQuantity: 0,
        avgPrice: 0,
        totalValue: 0,
        commission: 0,
        status: 'failed',
        message: `Order execution failed: ${order.rejectionReason}`,
        timestamp: Date.now(),
        fills: []
      };
    }
  }

  private async createOrder(orderRequest: OrderRequest, validation: OrderValidation): Promise<Order> {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const estimatedPrice = orderRequest.price || await this.getEstimatedPrice(orderRequest.symbol, orderRequest.side);

    const order: Order = {
      id: orderId,
      portfolioId: orderRequest.portfolioId,
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      quantity: orderRequest.quantity,
      price: estimatedPrice,
      stopPrice: orderRequest.stopPrice,
      status: 'pending',
      filledQuantity: 0,
      remainingQuantity: orderRequest.quantity,
      avgFillPrice: 0,
      totalFillValue: 0,
      commission: 0,
      exchange: orderRequest.exchange,
      timeInForce: orderRequest.timeInForce || 'GTC',
      stopLoss: orderRequest.stopLoss,
      takeProfit: orderRequest.takeProfit,
      notes: orderRequest.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fills: []
    };

    this.orders.set(orderId, order);
    this.pendingOrders.set(orderId, order);

    return order;
  }

  private async processExecution(order: Order, quantity: number, price: number): Promise<void> {
    const fill: Fill = {
      id: `fill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      quantity,
      price,
      commission: this.calculateCommission(order.exchange, quantity * price),
      timestamp: Date.now()
    };

    order.fills.push(fill);
    order.filledQuantity += quantity;
    order.remainingQuantity = Math.max(0, order.quantity - order.filledQuantity);
    order.commission += fill.commission;
    order.totalFillValue += quantity * price;
    order.avgFillPrice = order.totalFillValue / order.filledQuantity;

    if (order.remainingQuantity === 0) {
      order.status = 'filled';
      order.filledAt = Date.now();
      this.pendingOrders.delete(order.id);

      // Update portfolio
      const trade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        portfolioId: order.portfolioId,
        symbol: order.symbol,
        side: order.side,
        quantity: order.filledQuantity,
        price: order.avgFillPrice,
        timestamp: Date.now(),
        commission: order.commission,
        exchange: order.exchange,
        orderId: order.id
      };

      await portfolioService.updatePositions(order.portfolioId, [trade]);

      // Place stop loss and take profit orders if specified
      if (order.stopLoss) {
        await this.placeStopLossOrder(order);
      }
      if (order.takeProfit) {
        await this.takeProfitOrder(order);
      }
    } else {
      order.status = 'partially_filled';
    }

    order.updatedAt = Date.now();
  }

  private async placeStopLossOrder(parentOrder: Order): Promise<void> {
    if (!parentOrder.stopLoss) return;

    const stopOrderRequest: OrderRequest = {
      portfolioId: parentOrder.portfolioId,
      symbol: parentOrder.symbol,
      side: parentOrder.side === 'buy' ? 'sell' : 'buy',
      type: 'stop',
      quantity: parentOrder.filledQuantity,
      stopPrice: parentOrder.stopLoss,
      exchange: parentOrder.exchange,
      timeInForce: 'GTC',
      notes: `Stop loss for order ${parentOrder.id}`
    };

    // Don't await to avoid blocking the main execution
    this.executeOrder(stopOrderRequest).catch(error => {
      console.error('Failed to place stop loss order:', error);
    });
  }

  private async takeProfitOrder(parentOrder: Order): Promise<void> {
    if (!parentOrder.takeProfit) return;

    const takeProfitRequest: OrderRequest = {
      portfolioId: parentOrder.portfolioId,
      symbol: parentOrder.symbol,
      side: parentOrder.side === 'buy' ? 'sell' : 'buy',
      type: 'limit',
      quantity: parentOrder.filledQuantity,
      price: parentOrder.takeProfit,
      exchange: parentOrder.exchange,
      timeInForce: 'GTC',
      notes: `Take profit for order ${parentOrder.id}`
    };

    // Don't await to avoid blocking the main execution
    this.executeOrder(takeProfitRequest).catch(error => {
      console.error('Failed to place take profit order:', error);
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) {
      return false;
    }

    if (order.status === 'filled' || order.status === 'canceled' || order.status === 'rejected') {
      return false; // Cannot cancel already completed orders
    }

    try {
      // Cancel on exchange if submitted
      if (order.exchangeOrderId && order.status === 'submitted') {
        await exchangeService.cancelOrder(order.exchange, order.exchangeOrderId);
      }

      order.status = 'canceled';
      order.updatedAt = Date.now();
      this.pendingOrders.delete(orderId);

      await this.saveOrder(order);
      this.notifySubscribers(order);

      return true;
    } catch (error) {
      console.error(`Failed to cancel order ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    // Check in-memory first
    if (this.orders.has(orderId)) {
      return this.orders.get(orderId)!;
    }

    // Load from database
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !data) {
        return null;
      }

      const order = this.mapDatabaseToOrder(data);
      this.orders.set(orderId, order);
      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  /**
   * Get orders for a portfolio
   */
  async getOrders(portfolioId: string, status?: string, limit: number = 100): Promise<Order[]> {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }

      return data.map(orderData => {
        const order = this.mapDatabaseToOrder(orderData);
        this.orders.set(order.id, order);
        return order;
      });
    } catch (error) {
      console.error('Database error fetching orders:', error);
      return [];
    }
  }

  /**
   * Get pending orders
   */
  getPendingOrders(): Order[] {
    return Array.from(this.pendingOrders.values());
  }

  /**
   * Get order history with filters
   */
  async getOrderHistory(
    portfolioId: string, 
    filters: {
      symbol?: string;
      side?: 'buy' | 'sell';
      status?: string;
      startDate?: number;
      endDate?: number;
    } = {},
    limit: number = 100
  ): Promise<Order[]> {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters.symbol) {
        query = query.eq('symbol', filters.symbol);
      }
      if (filters.side) {
        query = query.eq('side', filters.side);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('created_at', new Date(filters.startDate).toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', new Date(filters.endDate).toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching order history:', error);
        return [];
      }

      return data.map(orderData => this.mapDatabaseToOrder(orderData));
    } catch (error) {
      console.error('Database error fetching order history:', error);
      return [];
    }
  }

  /**
   * Modify an existing order (price/quantity)
   */
  async modifyOrder(orderId: string, modifications: {
    price?: number;
    quantity?: number;
    stopPrice?: number;
  }): Promise<boolean> {
    const order = await this.getOrder(orderId);
    if (!order || order.status !== 'submitted') {
      return false;
    }

    try {
      // Cancel existing order on exchange
      if (order.exchangeOrderId) {
        await exchangeService.cancelOrder(order.exchange, order.exchangeOrderId);
      }

      // Update order details
      if (modifications.price !== undefined) {
        order.price = modifications.price;
      }
      if (modifications.quantity !== undefined) {
        order.quantity = modifications.quantity;
        order.remainingQuantity = modifications.quantity - order.filledQuantity;
      }
      if (modifications.stopPrice !== undefined) {
        order.stopPrice = modifications.stopPrice;
      }

      // Resubmit modified order
      const newExchangeOrder = await exchangeService.placeOrder(order.exchange, {
        symbol: order.symbol,
        type: order.type,
        side: order.side,
        amount: order.remainingQuantity,
        price: order.price
      });

      if (newExchangeOrder) {
        order.exchangeOrderId = newExchangeOrder.id;
        order.updatedAt = Date.now();
        
        await this.saveOrder(order);
        this.notifySubscribers(order);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Failed to modify order ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(portfolioId: string, period: string = '1m'): Promise<{
    totalOrders: number;
    filledOrders: number;
    canceledOrders: number;
    rejectedOrders: number;
    fillRate: number;
    avgExecutionTime: number;
    totalVolume: number;
    totalCommissions: number;
    bestExecution: number;
    worstExecution: number;
  }> {
    const orders = await this.getOrderHistory(portfolioId, {
      startDate: this.getPeriodStartDate(period)
    });

    const filledOrders = orders.filter(o => o.status === 'filled' || o.status === 'partially_filled');
    const canceledOrders = orders.filter(o => o.status === 'canceled');
    const rejectedOrders = orders.filter(o => o.status === 'rejected');

    const executionTimes = filledOrders
      .filter(o => o.filledAt)
      .map(o => o.filledAt! - o.createdAt);

    const volumes = filledOrders.map(o => o.totalFillValue);

    return {
      totalOrders: orders.length,
      filledOrders: filledOrders.length,
      canceledOrders: canceledOrders.length,
      rejectedOrders: rejectedOrders.length,
      fillRate: orders.length > 0 ? (filledOrders.length / orders.length) * 100 : 0,
      avgExecutionTime: executionTimes.length > 0 ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length : 0,
      totalVolume: volumes.reduce((sum, vol) => sum + vol, 0),
      totalCommissions: filledOrders.reduce((sum, order) => sum + order.commission, 0),
      bestExecution: volumes.length > 0 ? Math.max(...volumes) : 0,
      worstExecution: volumes.length > 0 ? Math.min(...volumes) : 0
    };
  }

  private async getEstimatedPrice(symbol: string, side: 'buy' | 'sell'): Promise<number> {
    try {
      // Try to get current market price
      // In a real implementation, this would fetch from the exchange
      const mockPrices: Record<string, number> = {
        'BTC/USD': 45000,
        'ETH/USD': 3000,
        'AAPL': 150,
        'GOOGL': 2500,
        'TSLA': 800
      };

      const basePrice = mockPrices[symbol] || 100;
      
      // Add small spread for market orders
      const spread = 0.001; // 0.1% spread
      return side === 'buy' ? basePrice * (1 + spread) : basePrice * (1 - spread);
    } catch (error) {
      console.error('Error getting estimated price:', error);
      return 100; // Fallback price
    }
  }

  private calculateCommission(exchange: string, orderValue: number): number {
    // Commission rates by exchange
    const commissionRates: Record<string, number> = {
      'binance': 0.001, // 0.1%
      'kraken': 0.0026, // 0.26%
      'coinbase': 0.005, // 0.5%
      'forex.com': 0.0002, // 0.02%
      'interactive_brokers': 0.005, // $0.005 per share, simplified as percentage
      'default': 0.001
    };

    const rate = commissionRates[exchange.toLowerCase()] || commissionRates['default'];
    return Math.max(0.01, orderValue * rate); // Minimum $0.01 commission
  }

  private isMarketOpen(symbol: string): boolean {
    // Simplified market hours check
    // In practice, this would check actual market hours by symbol
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();

    // Crypto markets are always open
    if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('crypto')) {
      return true;
    }

    // Forex markets (Monday 00:00 UTC to Friday 22:00 UTC)
    if (symbol.includes('/')) {
      return !(day === 0 || (day === 6 && hour >= 22) || (day === 1 && hour < 0));
    }

    // Stock markets (simplified, Monday-Friday 9:30-16:00 EST)
    return day >= 1 && day <= 5 && hour >= 14 && hour < 21; // Rough approximation for US markets
  }

  private getPeriodStartDate(period: string): number {
    const now = Date.now();
    const periods: Record<string, number> = {
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1m': 30 * 24 * 60 * 60 * 1000,
      '3m': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };

    return now - (periods[period] || periods['1m']);
  }

  private mapDatabaseToOrder(data: any): Order {
    return {
      id: data.id,
      portfolioId: data.portfolio_id,
      symbol: data.symbol,
      side: data.side,
      type: data.type,
      quantity: data.quantity,
      price: data.price,
      stopPrice: data.stop_price,
      status: data.status,
      filledQuantity: data.filled_quantity || 0,
      remainingQuantity: data.remaining_quantity || data.quantity,
      avgFillPrice: data.avg_fill_price || 0,
      totalFillValue: data.total_fill_value || 0,
      commission: data.commission || 0,
      exchange: data.exchange,
      exchangeOrderId: data.exchange_order_id,
      timeInForce: data.time_in_force || 'GTC',
      stopLoss: data.stop_loss,
      takeProfit: data.take_profit,
      notes: data.notes,
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at || data.created_at).getTime(),
      filledAt: data.filled_at ? new Date(data.filled_at).getTime() : undefined,
      fills: [], // Would load fills separately in a real implementation
      rejectionReason: data.rejection_reason
    };
  }

  private async saveOrder(order: Order): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .upsert({
          id: order.id,
          portfolio_id: order.portfolioId,
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          quantity: order.quantity,
          price: order.price,
          stop_price: order.stopPrice,
          status: order.status,
          filled_quantity: order.filledQuantity,
          remaining_quantity: order.remainingQuantity,
          avg_fill_price: order.avgFillPrice,
          total_fill_value: order.totalFillValue,
          commission: order.commission,
          exchange: order.exchange,
          exchange_order_id: order.exchangeOrderId,
          time_in_force: order.timeInForce,
          stop_loss: order.stopLoss,
          take_profit: order.takeProfit,
          notes: order.notes,
          created_at: new Date(order.createdAt).toISOString(),
          updated_at: new Date(order.updatedAt).toISOString(),
          filled_at: order.filledAt ? new Date(order.filledAt).toISOString() : null,
          rejection_reason: order.rejectionReason
        });

      if (error) {
        console.error('Error saving order:', error);
      }
    } catch (error) {
      console.error('Database error saving order:', error);
    }
  }

  /**
   * Subscribe to order updates
   */
  subscribeToOrders(callback: (order: Order) => void): () => void {
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Subscribe to execution reports
   */
  subscribeToExecutions(callback: (report: ExecutionReport) => void): () => void {
    this.executionSubscribers.add(callback);
    
    return () => {
      this.executionSubscribers.delete(callback);
    };
  }

  private notifySubscribers(order: Order): void {
    this.subscribers.forEach(callback => {
      try {
        callback(order);
      } catch (error) {
        console.error('Error in order subscriber callback:', error);
      }
    });
  }

  private notifyExecutionSubscribers(report: ExecutionReport): void {
    this.executionSubscribers.forEach(callback => {
      try {
        callback(report);
      } catch (error) {
        console.error('Error in execution subscriber callback:', error);
      }
    });
  }

  /**
   * Bulk cancel orders
   */
  async cancelOrders(orderIds: string[]): Promise<{ successful: string[], failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    for (const orderId of orderIds) {
      const result = await this.cancelOrder(orderId);
      if (result) {
        successful.push(orderId);
      } else {
        failed.push(orderId);
      }
    }

    return { successful, failed };
  }

  /**
   * Get order book for symbol (mock implementation)
   */
  async getOrderBook(symbol: string, depth: number = 10): Promise<{
    bids: Array<{ price: number; size: number }>;
    asks: Array<{ price: number; size: number }>;
    timestamp: number;
  }> {
    // Mock order book data
    const basePrice = await this.getEstimatedPrice(symbol, 'buy');
    const bids = [];
    const asks = [];

    for (let i = 0; i < depth; i++) {
      bids.push({
        price: basePrice * (1 - (i + 1) * 0.001),
        size: Math.random() * 10 + 1
      });
      asks.push({
        price: basePrice * (1 + (i + 1) * 0.001),
        size: Math.random() * 10 + 1
      });
    }

    return {
      bids: bids.sort((a, b) => b.price - a.price),
      asks: asks.sort((a, b) => a.price - b.price),
      timestamp: Date.now()
    };
  }
}

// Singleton instance
export const orderService = new OrderService();
export { OrderService };
export type {
  OrderRequest,
  Order,
  Fill,
  OrderValidation,
  ExecutionReport
};
