import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const AdvancedChart: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
  const [chartType, setChartType] = useState('candlestick');

  const symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD', 'ETH/USD', 'AUD/USD'];
  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D'];

  // Mock chart data
  const chartData: ChartData[] = [
    { time: '09:00', open: 1.0850, high: 1.0875, low: 1.0845, close: 1.0860, volume: 1250 },
    { time: '10:00', open: 1.0860, high: 1.0890, low: 1.0855, close: 1.0885, volume: 1580 },
    { time: '11:00', open: 1.0885, high: 1.0895, low: 1.0870, close: 1.0875, volume: 1320 },
    { time: '12:00', open: 1.0875, high: 1.0880, low: 1.0850, close: 1.0855, volume: 1750 },
    { time: '13:00', open: 1.0855, high: 1.0870, low: 1.0840, close: 1.0865, volume: 1420 }
  ];

  const currentPrice = 1.0865;
  const priceChange = 0.0015;
  const percentChange = 0.14;

  return (
    <section className="py-16 bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Advanced Trading Charts
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Professional-grade charting with technical indicators and real-time data
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <CardTitle className="text-white text-xl">{selectedSymbol}</CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-white">{currentPrice}</span>
                  <Badge className={priceChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    {priceChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {priceChange >= 0 ? '+' : ''}{priceChange} ({percentChange >= 0 ? '+' : ''}{percentChange}%)
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {symbols.map((symbol) => (
                      <SelectItem key={symbol} value={symbol} className="text-white">
                        {symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                  <SelectTrigger className="w-20 bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {timeframes.map((tf) => (
                      <SelectItem key={tf} value={tf} className="text-white">
                        {tf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={chartType === 'candlestick' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('candlestick')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="h-96 bg-gray-800 rounded-lg p-4 mb-6">
              <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-600">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-500">Interactive Chart Area</p>
                  <p className="text-sm text-gray-600">Real-time {selectedSymbol} {selectedTimeframe} chart</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Open</p>
                <p className="text-lg font-semibold text-white">1.0850</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-400">High</p>
                <p className="text-lg font-semibold text-green-400">1.0895</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Low</p>
                <p className="text-lg font-semibold text-red-400">1.0840</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Volume</p>
                <p className="text-lg font-semibold text-blue-400">7.3K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AdvancedChart;