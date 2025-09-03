// src/services/exchangeService.ts

interface ExchangeCredentials {
  apiKey: string;
  secret: string;
  passphrase?: string; // For some exchanges like Coinbase Pro
  sandbox?: boolean;
}

interface Balance {
  currency: string;
  available: number;
  locked: number;
  total: number;
}

interface OrderRequest {
  symbol: string;
  type: 'market' | 'limit' | 'stop';
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

interface Order {
  id: string;
  symbol: string;
  type: string;
  side: string;
  amount: number;
  price: number;
  status: 'pending' | 'open' | 'closed' | 'canceled' | 'expired';
  filled: number;
  remaining: number;
  timestamp: number;
  fee?: {
    currency: string;
    cost: number;
  };
}

interface Ticker {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  high: number;
  low: number;
  change: number;
  percentage: number;
  timestamp: number;
}

interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class ExchangeService {
  private exchanges: Map<string, any> = new Map();
  private credentials: Map<string, ExchangeCredentials> = new Map();

  async initializeExchange(name: string, credentials: ExchangeCredentials): Promise<boolean> {
    try {
      // In a real implementation, you would use ccxt here
      // For now, we'll create a mock exchange interface
      const exchange = this.createMockExchange(name, credentials);
      this.exchanges.set(name, exchange);
      this.credentials.set(name, credentials);
      
      console.log(`${name} exchange initialized`);
      return true;
    } catch (error) {
      console.error(`Failed to initialize ${name}:`, error);
      return false;
    }
  }

  private createMockExchange(name: string, credentials: ExchangeCredentials) {
    return {
      name,
      credentials,
      id: name,
      
      // Mock methods that would be implemented with ccxt
      fetchBalance: async () => this.mockFetchBalance(),
      fetchTicker: async (symbol: string) => this.mockFetchTicker(symbol),
      fetchOHLCV: async (symbol: string, timeframe: string, limit: number) => 
        this.mockFetchOHLCV(symbol, timeframe, limit),
      createOrder: async (symbol: string, type: string, side: string, amount: number, price?: number) =>
        this.mockCreateOrder(symbol, type, side, amount, price),
      fetchOrder: async (id: string) => this.mockFetchOrder(id),
      fetchOrders: async (symbol?: string) => this.mockFetchOrders(symbol),
      fetchOpenOrders: async (symbol?: string) => this.mockFetchOpenOrders(symbol),
      cancelOrder: async (id: string) => this.mockCancelOrder(id),
      fetchMyTrades: async (symbol?: string) => this.mockFetchTrades(symbol)
    };
  }

  async getBalance(exchange: string): Promise<Balance[]> {
    const ex = this.exchanges.get(exchange);
    if (!ex) {
      throw new Error(`Exchange ${exchange} not initialized`);
    }

    try {
      const balance = await ex.fetchBalance();
      return this.formatBalance(balance);
    } catch (error) {
      console.error(`Error fetching balance from ${exchange}:`, error);
      throw error;
    }
  }

  async getTicker(exchange: string, symbol: string): Promise<Ticker> {
    const ex = this.exchanges.get(exchange);
    if (!ex) {
      throw new Error(`Exchange ${exchange} not initialized`);
    }

    try {
      return await ex.fetchTicker(symbol);
    } catch (error) {
      console.error(`Error fetching ticker for ${symbol} from ${exchange}:`, error);
      throw error;
    }
  }

  async getOHLCV(exchange: string, symbol: string, timeframe: string = '1h', limit: number = 100): Promise<OHLCV[]> {
    const ex = this.exchanges.get(exchange);
    if (!ex) {
      throw new Error(`Exchange ${exchange} not initialized`);
    }

    try {
      return await ex.fetchOHLCV(symbol, timeframe, limit);
    } catch (error) {
      console.error(`Error fetching OHLCV for ${symbol} from ${exchange}:`, error);
      throw error;
    }
  }

  async placeOrder(exchange: string, orderRequest: OrderRequest): Promise<Order> {
    const ex = this.exchanges.get(exchange);
    if (!ex) {
      throw new Error(`Exchange ${exchange} not initialized`);
    }

    try {
      // Validate order before placing
      this.validateOrder(orderRequest);

      const order = await ex.createOrder(
        orderRequest.symbol,
        orderRequest.type,
        orderRequest.side,
        orderRequest.amount,
        orderRequest.price
      );

      console.log(`Order placed on ${exchange}:`, order);
      return order;
    } catch (error) {
      console.error(`Error placing order on ${exchange}:`, error);
      throw error;
    }
  }

  async cancelOrder(exchange: string, orderId: string): Promise<boolean> {
    const ex = this.exchanges.get(exchange);
    if (!ex) {
      throw new Error(`Exchange ${exchange} not initialized`);
    }

    try {
      await ex.cancelOrder(orderId);
      console.log(`Order ${orderId} canceled on ${exchange}`);
      return true;
    } catch (error) {
      console.error(`Error canceling order ${orderId} on ${exchange}:`, error);
      throw error;
    }
  }

  async getOrder(exchange: string, orderId: string): Promise<Order> {
    const ex = this.exchanges.get(exchange);
    if (!ex) {
      throw new Error(`Exchange ${exchange} not initialized`);
    }

    try {
      return await ex.fetchOrder(orderId);
    } catch (error) {
      console.error(`Error fetching order ${orderId} from ${exchange}:`, error);
      throw error;
    }
  }

  async getOrders(exchange: string, symbol?: string): Promise<Order[]> {
    const ex = this.exchanges.get(exchange);
    if (!ex) {
      throw new Error(`Exchange ${exchange} not initialized`);
    }

    try {
      return await ex.fetchOrders(symbol);
    } catch (error) {
      console.error(`Error fetching orders from ${exchange}:`, error);
      throw error;
    }
  }

  async getOpenOrders(exchange: string, symbol?: string): Promise<Order[]> {
    const ex = this.exchanges.get(exchange);
    if (!ex) {
      throw new Error(`Exchange ${exchange} not initialized`);
    }

    try {
      return await ex.fetchOpenOrders(symbol);
    } catch (error) {
      console.error(`Error fetching open orders from ${exchange}:`, error);
      throw error;
    }
  }

  private validateOrder(orderRequest: OrderRequest) {
    if (!orderRequest.symbol) {
      throw new Error('Symbol is required');
    }
    if (!orderRequest.amount || orderRequest.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    if (orderRequest.type === 'limit' && (!orderRequest.price || orderRequest.price <= 0)) {
      throw new Error('Price is required for limit orders');
    }
    if (orderRequest.type === 'stop' && (!orderRequest.stopPrice || orderRequest.stopPrice <= 0)) {
      throw new Error('Stop price is required for stop orders');
    }
  }

  private formatBalance(balance: any): Balance[] {
    // Convert exchange-specific balance format to standardized format
    const balances: Balance[] = [];
    
    if (balance && balance.total) {
      Object.keys(balance.total).forEach(currency => {
        if (balance.total[currency] > 0) {
          balances.push({
            currency,
            available: balance.free[currency] || 0,
            locked: balance.used[currency] || 0,
            total: balance.total[currency]
          });
        }
      });
    }
    
    return balances;
  }

  getAvailableExchanges(): string[] {
    return Array.from(this.exchanges.keys());
  }

  isExchangeConnected(exchange: string): boolean {
    return this.exchanges.has(exchange);
  }

  // Mock methods for development/testing
  private async mockFetchBalance(): Promise<any> {
    return {
      free: { BTC: 0.5, ETH: 2.3, USD: 1000 },
      used: { BTC: 0.1, ETH: 0.2, USD: 200 },
      total: { BTC: 0.6, ETH: 2.5, USD: 1200 }
    };
  }

  private async mockFetchTicker(symbol: string): Promise<Ticker> {
    const basePrice = symbol === 'BTC/USD' ? 45000 : symbol === 'ETH/USD' ? 3000 : 1;
    const change = (Math.random() - 0.5) * 0.1;
    
    return {
      symbol,
      bid: basePrice * (1 + change - 0.001),
      ask: basePrice * (1 + change + 0.001),
      last: basePrice * (1 + change),
      volume: Math.random() * 10000,
      high: basePrice * (1 + Math.abs(change) + 0.02),
      low: basePrice * (1 + change - 0.02),
      change: change * basePrice,
      percentage: change * 100,
      timestamp: Date.now()
    };
  }

  private async mockFetchOHLCV(symbol: string, timeframe: string, limit: number): Promise<OHLCV[]> {
    const data: OHLCV[] = [];
    const now = Date.now();
    const interval = this.getTimeframeMs(timeframe);
    const basePrice = symbol === 'BTC/USD' ? 45000 : symbol === 'ETH/USD' ? 3000 : 1;
    
    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const open = basePrice * (1 + (Math.random() - 0.5) * 0.05);
      const close = open * (1 + (Math.random() - 0.5) * 0.03);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.random() * 1000;
      
      data.push({ timestamp, open, high, low, close, volume });
    }
    
    return data;
  }

  private async mockCreateOrder(symbol: string, type: string, side: string, amount: number, price?: number): Promise<Order> {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: orderId,
      symbol,
      type,
      side,
      amount,
      price: price || 0,
      status: 'open',
      filled: 0,
      remaining: amount,
      timestamp: Date.now()
    };
  }

  private async mockFetchOrder(id: string): Promise<Order> {
    return {
      id,
      symbol: 'BTC/USD',
      type: 'limit',
      side: 'buy',
      amount: 0.1,
      price: 45000,
      status: 'open',
      filled: 0,
      remaining: 0.1,
      timestamp: Date.now()
    };
  }

  private async mockFetchOrders(symbol?: string): Promise<Order[]> {
    return [
      {
        id: 'order_1',
        symbol: 'BTC/USD',
        type: 'limit',
        side: 'buy',
        amount: 0.1,
        price: 45000,
        status: 'closed',
        filled: 0.1,
        remaining: 0,
        timestamp: Date.now() - 3600000
      }
    ];
  }

  private async mockFetchOpenOrders(symbol?: string): Promise<Order[]> {
    return [
      {
        id: 'order_2',
        symbol: 'ETH/USD',
        type: 'limit',
        side: 'sell',
        amount: 1,
        price: 3100,
        status: 'open',
        filled: 0,
        remaining: 1,
        timestamp: Date.now() - 1800000
      }
    ];
  }

  private async mockCancelOrder(id: string): Promise<any> {
    return { id, status: 'canceled' };
  }

  private async mockFetchTrades(symbol?: string): Promise<any[]> {
    return [];
  }

  private getTimeframeMs(timeframe: string): number {
    const timeframes: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    
    return timeframes[timeframe] || timeframes['1h'];
  }
}

// Singleton instance
export const exchangeService = new ExchangeService();
export type { 
  ExchangeCredentials, 
  Balance, 
  OrderRequest, 
  Order, 
  Ticker, 
  OHLCV 
};
