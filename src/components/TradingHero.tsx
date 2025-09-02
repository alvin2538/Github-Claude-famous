import React from 'react';
import { TrendingUp, Activity, DollarSign, BarChart3 } from 'lucide-react';

const TradingHero: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'url(https://d64gsuwffb70l.cloudfront.net/68afc29486e4c9365f0c06da_1756349119842_9fa60887.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-flex items-center px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-sm font-medium mb-6">
              <Activity className="w-4 h-4 mr-2" />
              Advanced AI Trading System
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Automated Trading
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Bot Platform
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Deploy institutional-grade trading algorithms with 90%+ accuracy. 
            Advanced signal processing, risk management, and 24/7 execution across Forex & Crypto markets.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
              Start Trading Bot
            </button>
            <button className="px-8 py-4 border border-gray-400 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300">
              View Live Demo
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 border border-green-400/30 rounded-lg mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">92%</div>
              <div className="text-gray-400 text-sm">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 border border-blue-400/30 rounded-lg mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">1:3</div>
              <div className="text-gray-400 text-sm">Risk Reward</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 border border-purple-400/30 rounded-lg mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-gray-400 text-sm">Active Trading</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 border border-orange-400/30 rounded-lg mx-auto mb-3">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">15+</div>
              <div className="text-gray-400 text-sm">Strategies</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingHero;