import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/contexts/AppContext';
import TradingNavigation from './TradingNavigation';
import TradingHero from './TradingHero';
import LiveDashboard from './LiveDashboard';
import TradingSignals from './TradingSignals';
import { MarketAnalysis } from './MarketAnalysis';
import AdvancedChart from './AdvancedChart';
import TradingIndicators from './TradingIndicators';
import RealTimeData from './RealTimeData';
import AutomatedTrading from './AutomatedTrading';
import RiskManagement from './RiskManagement';
import BacktestResults from './BacktestResults';
import ExchangeConnections from './ExchangeConnections';
import BrokerIntegration from './BrokerIntegration';
import AdvancedIndicators from './AdvancedIndicators';
import MLPatternRecognition from './MLPatternRecognition';
import PortfolioAnalysis from './PortfolioAnalysis';
import TradingFooter from './TradingFooter';
import { AuthFlow } from './AuthFlow';
import { OfflineIndicator, ErrorDisplay } from './LoadingStates';
import { NotificationCenter } from './NotificationCenter';
import { UserSettings } from './UserSettings';
const AppLayout = () => {
  const { isAuthenticated, error, isOnline } = useAppContext();
  
  // Show auth flow if not authenticated
  if (!isAuthenticated) {
    return <AuthFlow />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <TradingNavigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Status Indicators */}
        <div className="mb-4 space-y-2">
          <OfflineIndicator />
          {error && <ErrorDisplay error={error} />}
        </div>
        
        <TradingHero />

        
        <div className="mt-12">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 mb-8">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="indicators">Indicators</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8">
              <LiveDashboard />
              <RealTimeData />
            </TabsContent>

            <TabsContent value="signals" className="space-y-8">
              <TradingSignals />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-8">
              <MarketAnalysis />
              <PortfolioAnalysis />
            </TabsContent>

            <TabsContent value="charts" className="space-y-8">
              <AdvancedChart />
            </TabsContent>

            <TabsContent value="indicators" className="space-y-8">
              <TradingIndicators />
              <AdvancedIndicators />
            </TabsContent>

            <TabsContent value="automation" className="space-y-8">
              <AutomatedTrading />
              <ExchangeConnections />
              <BrokerIntegration />
              <BacktestResults />
            </TabsContent>

            <TabsContent value="risk" className="space-y-8">
              <RiskManagement />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-8">
              <MLPatternRecognition />
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-8">
              <UserSettings />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <TradingFooter />
    </div>
  );
};

export default AppLayout;
