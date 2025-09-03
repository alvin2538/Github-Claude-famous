// src/services/websocketService.ts
interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  change: number;
  timestamp: number;
}

interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

class WebSocketService {
  private connections: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, Set<Function>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private config: Record<string, WebSocketConfig> = {
    binance: {
      url: 'wss://stream.binance.com:9443/ws/',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5
    },
    kraken: {
      url: 'wss://ws.kraken.com/',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5
    },
    coinbase: {
      url: 'wss://ws-feed.pro.coinbase.com',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5
    }
  };

  connect(exchange: string, symbols: string[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const config = this.config[exchange];
        if (!config) {
          throw new Error(`Exchange ${exchange} not supported`);
        }

        // Close existing connection
        this.disconnect(exchange);

        const ws = new WebSocket(config.url);
        
        ws.onopen = () => {
          console.log(`Connected to ${exchange}`);
          this.connections.set(exchange, ws);
          this.reconnectAttempts.set(exchange, 0);
          
          // Subscribe to symbols based on exchange
          this.subscribeToSymbols(exchange, symbols);
          resolve(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(exchange, data);
          } catch (error) {
            console.error(`Error parsing message from ${exchange}:`, error);
          }
        };

        ws.onclose = () => {
          console.log(`Connection to ${exchange} closed`);
          this.connections.delete(exchange);
          this.handleReconnect(exchange, symbols);
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error for ${exchange}:`, error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private subscribeToSymbols(exchange: string, symbols: string[]) {
    const ws = this.connections.get(exchange);
    if (!ws) return;

    switch (exchange) {
      case 'binance':
        const binanceStreams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`);
        ws.send(JSON.stringify({
          method: 'SUBSCRIBE',
          params: binanceStreams,
          id: 1
        }));
        break;
        
      case 'kraken':
        ws.send(JSON.stringify({
          event: 'subscribe',
          pair: symbols,
          subscription: { name: 'ticker' }
        }));
        break;
        
      case 'coinbase':
        ws.send(JSON.stringify({
          type: 'subscribe',
          channels: ['ticker'],
          product_ids: symbols
        }));
        break;
    }
  }

  private handleMessage(exchange: string, data: any) {
    let marketData: MarketData | null = null;

    switch (exchange) {
      case 'binance':
        if (data.e === '24hrTicker') {
          marketData = {
            symbol: data.s,
            price: parseFloat(data.c),
            volume: parseFloat(data.v),
            change: parseFloat(data.P),
            timestamp: data.E
          };
        }
        break;
        
      case 'kraken':
        if (data.channelName === 'ticker') {
          const symbol = Object.keys(data)[1]; // First key after channelName
          const tickerData = data[symbol];
          marketData = {
            symbol: symbol,
            price: parseFloat(tickerData.c[0]),
            volume: parseFloat(tickerData.v[0]),
            change: parseFloat(tickerData.p[0]),
            timestamp: Date.now()
          };
        }
        break;
        
      case 'coinbase':
        if (data.type === 'ticker') {
          marketData = {
            symbol: data.product_id,
            price: parseFloat(data.price),
            volume: parseFloat(data.volume_24h),
            change: parseFloat(data.price_change_24h),
            timestamp: Date.now()
          };
        }
        break;
    }

    if (marketData) {
      this.notifySubscribers(`${exchange}-${marketData.symbol}`, marketData);
      this.notifySubscribers(`${exchange}-all`, marketData);
    }
  }

  private handleReconnect(exchange: string, symbols: string[]) {
    const config = this.config[exchange];
    const attempts = this.reconnectAttempts.get(exchange) || 0;
    
    if (attempts < config.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Attempting to reconnect to ${exchange} (${attempts + 1}/${config.maxReconnectAttempts})`);
        this.reconnectAttempts.set(exchange, attempts + 1);
        this.connect(exchange, symbols);
      }, config.reconnectInterval);
    } else {
      console.error(`Max reconnection attempts reached for ${exchange}`);
    }
  }

  subscribe(exchange: string, symbol: string, callback: (data: MarketData) => void): string {
    const key = symbol === 'all' ? `${exchange}-all` : `${exchange}-${symbol}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);
    
    // Return unsubscribe function
    return key;
  }

  unsubscribe(key: string, callback: Function) {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(key);
      }
    }
  }

  private notifySubscribers(key: string, data: MarketData) {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  disconnect(exchange: string) {
    const ws = this.connections.get(exchange);
    if (ws) {
      ws.close();
      this.connections.delete(exchange);
    }
  }

  disconnectAll() {
    this.connections.forEach((ws, exchange) => {
      this.disconnect(exchange);
    });
    this.subscribers.clear();
  }

  isConnected(exchange: string): boolean {
    const ws = this.connections.get(exchange);
    return ws?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.connections.forEach((ws, exchange) => {
      status[exchange] = ws.readyState === WebSocket.OPEN;
    });
    return status;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();
export type { MarketData };
