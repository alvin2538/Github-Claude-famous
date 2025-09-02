import { supabase } from '@/lib/supabase';

export interface KrakenBalance {
  [currency: string]: string;
}

export interface KrakenMarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
}

export interface KrakenTradeOrder {
  orderId: string;
  status: string;
  symbol: string;
  message: string;
}

export class KrakenApiClient {
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey?: string, apiSecret?: string) {
    this.apiKey = apiKey || '';
    this.apiSecret = apiSecret || '';
  }

  async getBalance(): Promise<{ balance: KrakenBalance } | { error: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('kraken-api-integration', {
        body: { 
          action: 'getBalance',
          apiKey: this.apiKey,
          apiSecret: this.apiSecret
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Kraken API Error:', error);
      return { error: 'Failed to fetch balance' };
    }
  }

  async getMarketData(symbol: string): Promise<KrakenMarketData | { error: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('kraken-api-integration', {
        body: { 
          action: 'getMarketData',
          symbol,
          apiKey: this.apiKey,
          apiSecret: this.apiSecret
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Kraken API Error:', error);
      return { error: 'Failed to fetch market data' };
    }
  }

  async placeTrade(symbol: string, side: 'buy' | 'sell', amount: number): Promise<KrakenTradeOrder | { error: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('kraken-api-integration', {
        body: { 
          action: 'placeTrade',
          symbol,
          side,
          amount,
          apiKey: this.apiKey,
          apiSecret: this.apiSecret
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Kraken API Error:', error);
      return { error: 'Failed to place trade' };
    }
  }
}

export const krakenApi = new KrakenApiClient();