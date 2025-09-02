import React from 'react';
import StrategyCard from './StrategyCard';

const StrategiesGrid: React.FC = () => {
  const strategies = [
    {
      title: "QQE MOD Momentum",
      description: "Early momentum shift detection using Quantitative Qualitative Estimation with modified parameters for enhanced accuracy.",
      performance: "+24.7%",
      winRate: "87%",
      status: "active" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349123979_b4dd4262.webp",
      profitLoss: 24.7
    },
    {
      title: "VVI Volume Analysis",
      description: "Volumetric Variable Index integration with delta volume thresholds for high-probability entry signals.",
      performance: "+18.3%",
      winRate: "82%",
      status: "active" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349132921_7fcccfa5.webp",
      profitLoss: 18.3
    },
    {
      title: "Trend Reversal Pro",
      description: "Multi-timeframe analysis achieving 90%+ accuracy in trend reversal detection with zero-lag entry points.",
      performance: "+31.2%",
      winRate: "91%",
      status: "active" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349125744_63f27301.webp",
      profitLoss: 31.2
    },
    {
      title: "Crypto Scalper",
      description: "10-period pullback analysis optimized for cryptocurrency markets with dynamic position sizing.",
      performance: "+42.1%",
      winRate: "78%",
      status: "active" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349142416_4ff7a032.webp",
      profitLoss: 42.1
    },
    {
      title: "Forex Pullback",
      description: "15-period pullback configuration with ATR-based stop losses for major currency pairs.",
      performance: "+16.8%",
      winRate: "85%",
      status: "backtesting" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349127465_486b8c87.webp",
      profitLoss: 16.8
    },
    {
      title: "Delta Volume Pro",
      description: "Real-time buying/selling pressure analysis with >50% delta thresholds for market entry validation.",
      performance: "+22.4%",
      winRate: "89%",
      status: "active" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349134680_d756da39.webp",
      profitLoss: 22.4
    },
    {
      title: "ML Pattern Recognition",
      description: "Machine learning component for pattern recognition and strategy optimization across multiple assets.",
      performance: "+28.9%",
      winRate: "84%",
      status: "backtesting" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349129425_d8b25582.webp",
      profitLoss: 28.9
    },
    {
      title: "Multi-Asset Arbitrage",
      description: "Cross-market arbitrage opportunities detection with correlation analysis and risk management.",
      performance: "+19.6%",
      winRate: "76%",
      status: "inactive" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349144279_f66566c5.webp",
      profitLoss: 19.6
    },
    {
      title: "Volatility Breakout",
      description: "ATR-based volatility breakout system with dynamic position sizing and correlation filters.",
      performance: "+35.7%",
      winRate: "80%",
      status: "active" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349136524_c2c89e30.webp",
      profitLoss: 35.7
    },
    {
      title: "Session-Based Trading",
      description: "London, New York, Asian session optimization with time-based filters and liquidity analysis.",
      performance: "+14.2%",
      winRate: "88%",
      status: "backtesting" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349146032_7b03f0a8.webp",
      profitLoss: 14.2
    },
    {
      title: "Risk Parity System",
      description: "Kelly Criterion position sizing with maximum drawdown limits and circuit breaker protection.",
      performance: "+26.3%",
      winRate: "83%",
      status: "active" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349138406_26debbd3.webp",
      profitLoss: 26.3
    },
    {
      title: "High-Frequency Scalper",
      description: "Sub-second execution with tick-level data analysis and ultra-low latency order management.",
      performance: "+21.8%",
      winRate: "79%",
      status: "inactive" as const,
      imageUrl: "https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349147793_901b7341.webp",
      profitLoss: 21.8
    }
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Trading Strategies
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Deploy institutional-grade algorithms with proven performance across multiple market conditions
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {strategies.map((strategy, index) => (
            <StrategyCard key={index} {...strategy} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StrategiesGrid;