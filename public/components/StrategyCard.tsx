import React from 'react';
import { TrendingUp, TrendingDown, Activity, Settings } from 'lucide-react';

interface StrategyCardProps {
  title: string;
  description: string;
  performance: string;
  winRate: string;
  status: 'active' | 'inactive' | 'backtesting';
  imageUrl: string;
  profitLoss: number;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
  title,
  description,
  performance,
  winRate,
  status,
  imageUrl,
  profitLoss
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'inactive': return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
      case 'backtesting': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300 hover:border-blue-400/30 group">
      {/* Strategy Image */}
      <div className="relative mb-4 rounded-lg overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>
      
      {/* Strategy Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500 mb-1">Performance</div>
          <div className="text-white font-semibold">{performance}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Win Rate</div>
          <div className="text-white font-semibold">{winRate}</div>
        </div>
      </div>
      
      {/* P&L */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-gray-500">P&L (30d)</div>
        <div className={`flex items-center font-semibold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {profitLoss >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {profitLoss >= 0 ? '+' : ''}{profitLoss.toFixed(2)}%
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium">
          <Activity className="w-4 h-4 inline mr-1" />
          Deploy
        </button>
        <button className="px-3 py-2 bg-gray-700/50 border border-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default StrategyCard;