// src/utils/technicalIndicators.ts

export interface IndicatorResult {
  value: number;
  timestamp?: number;
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
  timestamp?: number;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  timestamp?: number;
}

export interface StochasticResult {
  k: number;
  d: number;
  timestamp?: number;
}

export class TechnicalIndicators {
  /**
   * Simple Moving Average
   */
  static sma(prices: number[], period: number): number[] {
    if (prices.length < period) return [];
    
    const smaValues: number[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      smaValues.push(sum / period);
    }
    
    return smaValues;
  }

  /**
   * Exponential Moving Average
   */
  static ema(prices: number[], period: number): number[] {
    if (prices.length === 0) return [];
    
    const emaValues: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA value is the first price
    emaValues[0] = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      const emaValue = (prices[i] * multiplier) + (emaValues[i - 1] * (1 - multiplier));
      emaValues.push(emaValue);
    }
    
    return emaValues;
  }

  /**
   * Relative Strength Index
   */
  static rsi(prices: number[], period: number = 14): number[] {
    if (prices.length < period + 1) return [];
    
    const gains: number[] = [];
    const losses: number[] = [];
    const rsiValues: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(Math.max(change, 0));
      losses.push(Math.max(-change, 0));
    }
    
    // Calculate initial average gain and loss
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    // Calculate RSI for each period
    for (let i = period; i < gains.length; i++) {
      if (i === period) {
        // First RSI calculation
        const rs = avgGain / avgLoss;
        rsiValues.push(100 - (100 / (1 + rs)));
      } else {
        // Subsequent RSI calculations using smoothed averages
        avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
        avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
        const rs = avgGain / avgLoss;
        rsiValues.push(100 - (100 / (1 + rs)));
      }
    }
    
    return rsiValues;
  }

  /**
   * Moving Average Convergence Divergence
   */
  static macd(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACDResult[] {
    if (prices.length < slowPeriod) return [];
    
    const fastEMA = this.ema(prices, fastPeriod);
    const slowEMA = this.ema(prices, slowPeriod);
    
    // Calculate MACD line (difference between fast and slow EMA)
    const macdLine: number[] = [];
    const startIndex = slowPeriod - fastPeriod;
    
    for (let i = startIndex; i < fastEMA.length; i++) {
      macdLine.push(fastEMA[i] - slowEMA[i - startIndex]);
    }
    
    // Calculate signal line (EMA of MACD line)
    const signalLine = this.ema(macdLine, signalPeriod);
    
    // Calculate histogram (MACD - Signal)
    const results: MACDResult[] = [];
    const signalStartIndex = macdLine.length - signalLine.length;
    
    for (let i = 0; i < signalLine.length; i++) {
      results.push({
        macd: macdLine[signalStartIndex + i],
        signal: signalLine[i],
        histogram: macdLine[signalStartIndex + i] - signalLine[i]
      });
    }
    
    return results;
  }

  /**
   * Bollinger Bands
   */
  static bollingerBands(prices: number[], period: number = 20, stdDev: number = 2): BollingerBandsResult[] {
    if (prices.length < period) return [];
    
    const smaValues = this.sma(prices, period);
    const results: BollingerBandsResult[] = [];
    
    for (let i = 0; i < smaValues.length; i++) {
      const priceSlice = prices.slice(i, i + period);
      const sma = smaValues[i];
      
      // Calculate standard deviation
      const variance = priceSlice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      results.push({
        upper: sma + (standardDeviation * stdDev),
        middle: sma,
        lower: sma - (standardDeviation * stdDev)
      });
    }
    
    return results;
  }

  /**
   * Stochastic Oscillator
   */
  static stochastic(highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3): StochasticResult[] {
    if (highs.length < kPeriod || lows.length < kPeriod || closes.length < kPeriod) return [];
    
    const kValues: number[] = [];
    
    // Calculate %K
    for (let i = kPeriod - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
      const currentClose = closes[i];
      
      const kValue = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(kValue);
    }
    
    // Calculate %D (SMA of %K)
    const dValues = this.sma(kValues, dPeriod);
    
    const results: StochasticResult[] = [];
    const startIndex = kValues.length - dValues.length;
    
    for (let i = 0; i < dValues.length; i++) {
      results.push({
        k: kValues[startIndex + i],
        d: dValues[i]
      });
    }
    
    return results;
  }

  /**
   * Average True Range
   */
  static atr(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
    if (highs.length < 2 || lows.length < 2 || closes.length < 2) return [];
    
    const trueRanges: number[] = [];
    
    // Calculate True Range for each period
    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    // Calculate ATR using EMA
    return this.ema(trueRanges, period);
  }

  /**
   * Commodity Channel Index
   */
  static cci(highs: number[], lows: number[], closes: number[], period: number = 20): number[] {
    if (highs.length < period) return [];
    
    const cciValues: number[] = [];
    
    for (let i = period - 1; i < highs.length; i++) {
      // Calculate Typical Price for the period
      const typicalPrices: number[] = [];
      for (let j = i - period + 1; j <= i; j++) {
        typicalPrices.push((highs[j] + lows[j] + closes[j]) / 3);
      }
      
      // Calculate SMA of Typical Prices
      const smaTP = typicalPrices.reduce((sum, tp) => sum + tp, 0) / period;
      
      // Calculate Mean Deviation
      const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - smaTP), 0) / period;
      
      // Calculate CCI
      const currentTP = (highs[i] + lows[i] + closes[i]) / 3;
      const cci = (currentTP - smaTP) / (0.015 * meanDeviation);
      
      cciValues.push(cci);
    }
    
    return cciValues;
  }

  /**
   * Williams %R
   */
  static williamsR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
    if (highs.length < period) return [];
    
    const williamsRValues: number[] = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
      const currentClose = closes[i];
      
      const williamsR = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
      williamsRValues.push(williamsR);
    }
    
    return williamsRValues;
  }

  /**
   * Parabolic SAR
   */
  static parabolicSAR(highs: number[], lows: number[], step: number = 0.02, max: number = 0.2): number[] {
    if (highs.length < 2 || lows.length < 2) return [];
    
    const sarValues: number[] = [];
    let isUpTrend = highs[1] > highs[0];
    let sar = isUpTrend ? lows[0] : highs[0];
    let ep = isUpTrend ? highs[1] : lows[1];
    let af = step;
    
    sarValues.push(sar);
    
    for (let i = 2; i < highs.length; i++) {
      const prevSar = sar;
      
      // Calculate new SAR
      sar = prevSar + af * (ep - prevSar);
      
      if (isUpTrend) {
        // Uptrend
        if (lows[i] <= sar) {
          // Trend reversal
          isUpTrend = false;
          sar = ep;
          ep = lows[i];
          af = step;
        } else {
          // Continue uptrend
          if (highs[i] > ep) {
            ep = highs[i];
            af = Math.min(af + step, max);
          }
          sar = Math.min(sar, lows[i - 1], lows[i - 2] || lows[i - 1]);
        }
      } else {
        // Downtrend
        if (highs[i] >= sar) {
          // Trend reversal
          isUpTrend = true;
          sar = ep;
          ep = highs[i];
          af = step;
        } else {
          // Continue downtrend
          if (lows[i] < ep) {
            ep = lows[i];
            af = Math.min(af + step, max);
          }
          sar = Math.max(sar, highs[i - 1], highs[i - 2] || highs[i - 1]);
        }
      }
      
      sarValues.push(sar);
    }
    
    return sarValues;
  }

  /**
   * Volume Weighted Average Price
   */
  static vwap(highs: number[], lows: number[], closes: number[], volumes: number[]): number[] {
    if (highs.length !== lows.length || lows.length !== closes.length || closes.length !== volumes.length) {
      throw new Error('All arrays must have the same length');
    }
    
    const vwapValues: number[] = [];
    let cumulativeTPV = 0; // Typical Price * Volume
    let cumulativeVolume = 0;
    
    for (let i = 0; i < highs.length; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      cumulativeTPV += typicalPrice * volumes[i];
      cumulativeVolume += volumes[i];
      
      vwapValues.push(cumulativeTPV / cumulativeVolume);
    }
    
    return vwapValues;
  }

  /**
   * Money Flow Index
   */
  static mfi(highs: number[], lows: number[], closes: number[], volumes: number[], period: number = 14): number[] {
    if (highs.length < period + 1) return [];
    
    const mfiValues: number[] = [];
    
    for (let i = period; i < highs.length; i++) {
      let positiveMoneyFlow = 0;
      let negativeMoneyFlow = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        const typicalPrice = (highs[j] + lows[j] + closes[j]) / 3;
        const prevTypicalPrice = (highs[j - 1] + lows[j - 1] + closes[j - 1]) / 3;
        const rawMoneyFlow = typicalPrice * volumes[j];
        
        if (typicalPrice > prevTypicalPrice) {
          positiveMoneyFlow += rawMoneyFlow;
        } else if (typicalPrice < prevTypicalPrice) {
          negativeMoneyFlow += rawMoneyFlow;
        }
      }
      
      const moneyFlowRatio = positiveMoneyFlow / negativeMoneyFlow;
      const mfi = 100 - (100 / (1 + moneyFlowRatio));
      
      mfiValues.push(mfi);
    }
    
    return mfiValues;
  }

  /**
   * Ichimoku Cloud components
   */
  static ichimoku(highs: number[], lows: number[], closes: number[]) {
    const conversionPeriod = 9;
    const basePeriod = 26;
    const leadingSpan2Period = 52;
    const displacement = 26;
    
    // Conversion Line (Tenkan-sen)
    const conversionLine: number[] = [];
    for (let i = conversionPeriod - 1; i < highs.length; i++) {
      const periodHigh = Math.max(...highs.slice(i - conversionPeriod + 1, i + 1));
      const periodLow = Math.min(...lows.slice(i - conversionPeriod + 1, i + 1));
      conversionLine.push((periodHigh + periodLow) / 2);
    }
    
    // Base Line (Kijun-sen)
    const baseLine: number[] = [];
    for (let i = basePeriod - 1; i < highs.length; i++) {
      const periodHigh = Math.max(...highs.slice(i - basePeriod + 1, i + 1));
      const periodLow = Math.min(...lows.slice(i - basePeriod + 1, i + 1));
      baseLine.push((periodHigh + periodLow) / 2);
    }
    
    // Leading Span A (Senkou Span A)
    const leadingSpanA: number[] = [];
    const startIndex = Math.max(conversionLine.length, baseLine.length) - Math.min(conversionLine.length, baseLine.length);
    
    for (let i = 0; i < Math.min(conversionLine.length, baseLine.length); i++) {
      const conversionValue = conversionLine[i + (conversionLine.length > baseLine.length ? 0 : startIndex)];
      const baseValue = baseLine[i + (baseLine.length > conversionLine.length ? 0 : startIndex)];
      leadingSpanA.push((conversionValue + baseValue) / 2);
    }
    
    // Leading Span B (Senkou Span B)
    const leadingSpanB: number[] = [];
    for (let i = leadingSpan2Period - 1; i < highs.length; i++) {
      const periodHigh = Math.max(...highs.slice(i - leadingSpan2Period + 1, i + 1));
      const periodLow = Math.min(...lows.slice(i - leadingSpan2Period + 1, i + 1));
      leadingSpanB.push((periodHigh + periodLow) / 2);
    }
    
    // Lagging Span (Chikou Span) - just the closing price shifted back
    const laggingSpan = [...closes];
    
    return {
      conversionLine,
      baseLine,
      leadingSpanA,
      leadingSpanB,
      laggingSpan
    };
  }

  /**
   * Support and Resistance levels
   */
  static findSupportResistance(highs: number[], lows: number[], lookbackPeriod: number = 20, minTouches: number = 2): { support: number[], resistance: number[] } {
    const support: number[] = [];
    const resistance: number[] = [];
    
    for (let i = lookbackPeriod; i < highs.length - lookbackPeriod; i++) {
      const currentHigh = highs[i];
      const currentLow = lows[i];
      
      // Check for resistance (local high)
      let isResistance = true;
      for (let j = i - lookbackPeriod; j < i + lookbackPeriod; j++) {
        if (j !== i && highs[j] >= currentHigh) {
          isResistance = false;
          break;
        }
      }
      
      // Check for support (local low)
      let isSupport = true;
      for (let j = i - lookbackPeriod; j < i + lookbackPeriod; j++) {
        if (j !== i && lows[j] <= currentLow) {
          isSupport = false;
          break;
        }
      }
      
      if (isResistance) {
        resistance.push(currentHigh);
      }
      
      if (isSupport) {
        support.push(currentLow);
      }
    }
    
    return { support, resistance };
  }
}
