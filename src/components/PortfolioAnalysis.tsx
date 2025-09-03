// src/components/PortfolioAnalysis.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  DollarSign,
  Target,
  AlertTriangle,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { 
  portfolioService, 
  Portfolio, 
  Position, 
  PortfolioPerformance, 
  PortfolioAnalytics 
} from '../services/portfolioService';

const PortfolioAnalysis = () => {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | null>(null);
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null);
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1m');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock user ID - in a real app this would come from authentication
  const userId = 'user_123';

  // Load user portfolios on component mount
  useEffect(() => {
    loadUserPortfolios();
  }, []);

  const loadUserPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userPortfolios = await portfolioService.getUserPortfolios(userId);
      setPortfolios(userPortfolios);
      
      // Select first portfolio if none selected
      if (userPortfolios.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(userPortfolios[0].id);
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
      setError('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedPortfolio]);

  // Load portfolio data when selection changes
  useEffect(() => {
    if (selectedPortfolio) {
      loadPortfolioData(selectedPortfolio);
    }
  }, [selectedPortfolio, selectedPeriod]);

  const loadPortfolioData = useCallback(async (portfolioId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load portfolio details
      const portfolio = await portfolioService.getPortfolio(portfolioId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }
      setCurrentPortfolio(portfolio);

      // Load performance data
      const performanceData = await portfolioService.getPerformance(portfolioId, selectedPeriod);
      setPerformance(performanceData);

      // Load analytics
      const analyticsData = await portfolioService.getAnalytics(portfolioId);
      setAnalytics(analyticsData);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading portfolio data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  // Subscribe to portfolio updates
  useEffect(() => {
    if (!selectedPortfolio) return;

    const unsubscribe = portfolioService.subscribeToPortfolio((updatedPortfolio) => {
      if (updatedPortfolio.id === selectedPortfolio) {
        setCurrentPortfolio(updatedPortfolio);
        setLastUpdate(new Date());
      }
    });

    return unsubscribe;
  }, [selectedPortfolio]);

  const refreshData = useCallback(() => {
    if (selectedPortfolio) {
      loadPortfolioData(selectedPortfolio);
    }
  }, [selectedPortfolio, loadPortfolioData]);

  const createNewPortfolio = useCallback(async () => {
    try {
      const newPortfolio = await portfolioService.createPortfolio(
        userId,
        `Portfolio ${portfolios.length + 1}`,
        'New trading portfolio'
      );
      
      setPortfolios(prev => [newPortfolio, ...prev]);
      setSelectedPortfolio(newPortfolio.id);
    } catch (error) {
      console.error('Error creating portfolio:', error);
      setError('Failed to create portfolio');
    }
  }, [userId, portfolios.length]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getPositionColor = (pnl: number): string => {
    return pnl >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getRiskColor = (score: number): string => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && !currentPortfolio) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mr-2" />
          <span>Loading portfolio data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Portfolio Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Portfolio Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="default" size="sm" onClick={createNewPortfolio}>
                New Portfolio
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Portfolio</label>
              <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map(portfolio => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name} - {formatCurrency(portfolio.totalValue)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="1w">1 Week</SelectItem>
                  <SelectItem value="1m">1 Month</SelectItem>
                  <SelectItem value="3m">3 Months</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {currentPortfolio && (
        <>
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(currentPortfolio.totalValue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Day Change</p>
                    <p className={`text-2xl font-bold ${getPositionColor(currentPortfolio.dayChange)}`}>
                      {formatPercent(currentPortfolio.dayChangePercent)}
                    </p>
                  </div>
                  {currentPortfolio.dayChange >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unrealized P&L</p>
                    <p className={`text-2xl font-bold ${getPositionColor(currentPortfolio.unrealizedPnL)}`}>
                      {formatCurrency(currentPortfolio.unrealizedPnL)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Positions</p>
                    <p className="text-2xl font-bold">{currentPortfolio.positions.length}</p>
                  </div>
                  <PieChart className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis Tabs */}
          <Tabs defaultValue="positions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="positions">Positions</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
            </TabsList>

            <TabsContent value="positions">
              <Card>
                <CardHeader>
                  <CardTitle>Current Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentPortfolio.positions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No positions in this portfolio</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentPortfolio.positions.map((position, index) => (
                        <div
                          key={position.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium">{position.symbol}</div>
                              <div className="text-sm text-muted-foreground">
                                {position.quantity.toFixed(8)} @ {formatCurrency(position.avgPrice)}
                              </div>
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="font-medium">{formatCurrency(position.currentPrice)}</div>
                            <div className="text-sm text-muted-foreground">
                              Current Price
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="font-medium">{formatCurrency(position.marketValue)}</div>
                            <div className="text-sm text-muted-foreground">
                              Market Value
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`font-medium ${getPositionColor(position.unrealizedPnL)}`}>
                              {formatCurrency(position.unrealizedPnL)}
                            </div>
                            <div className={`text-sm ${getPositionColor(position.unrealizedPnLPercent)}`}>
                              {formatPercent(position.unrealizedPnLPercent)}
                            </div>
                          </div>

                          <div className="text-right text-sm text-muted-foreground">
                            <div>{new Date(position.lastUpdated).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {performance ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Total Return:</span>
                          <span className={`font-medium ${getPositionColor(performance.absoluteReturn)}`}>
                            {formatCurrency(performance.absoluteReturn)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Return %:</span>
                          <span className={`font-medium ${getPositionColor(performance.percentReturn)}`}>
                            {formatPercent(performance.percentReturn)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Volatility:</span>
                          <span className="font-medium">{formatPercent(performance.volatility * 100)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sharpe Ratio:</span>
                          <span className="font-medium">{performance.sharpeRatio.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Max Drawdown:</span>
                          <span className="font-medium text-red-600">
                            {formatPercent(performance.maxDrawdown * 100)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Win Rate:</span>
                          <span className="font-medium">{formatPercent(performance.winRate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Trades:</span>
                          <span className="font-medium">{performance.totalTrades}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profit Factor:</span>
                          <span className="font-medium">{performance.profitFactor.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Performance data not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics ? (
                    <div className="space-y-6">
                      {/* Diversification */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">Diversification</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>Diversification Score:</span>
                            <span className="font-medium">{analytics.diversification.score.toFixed(0)}/100</span>
                          </div>
                          <Progress value={analytics.diversification.score} className="h-2" />
                          
                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Asset Breakdown:</h4>
                            {Object.entries(analytics.diversification.breakdown).map(([asset, weight]) => (
                              <div key={asset} className="flex justify-between text-sm">
                                <span>{asset}:</span>
                                <span>{formatPercent(weight * 100)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Risk Metrics */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">Risk Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex justify-between">
                            <span>Value at Risk (95%):</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(analytics.riskMetrics.var95)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expected Shortfall:</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(analytics.riskMetrics.expectedShortfall)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Portfolio Beta:</span>
                            <span className="font-medium">{analytics.riskMetrics.beta.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Volatility:</span>
                            <span className="font-medium">{formatPercent(analytics.riskMetrics.volatility * 100)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Analytics data not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allocation">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics ? (
                    <div className="space-y-6">
                      {/* By Asset Class */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">By Asset Class</h3>
                        <div className="space-y-2">
                          {Object.entries(analytics.allocation.byAsset).map(([asset, percentage]) => (
                            <div key={asset} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{asset}</span>
                                <span>{formatPercent(percentage)}</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* By Exchange */}
                      <div>
                        <h3 className="text-lg font-medium mb-3">By Exchange</h3>
                        <div className="space-y-2">
                          {Object.entries(analytics.allocation.byExchange).map(([exchange, percentage]) => (
                            <div key={exchange} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{exchange}</span>
                                <span>{formatPercent(percentage)}</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Allocation data not available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default PortfolioAnalysis;
