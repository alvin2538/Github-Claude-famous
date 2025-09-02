import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, Target, Zap, Activity, BarChart3 } from 'lucide-react';

const MLPatternRecognition = () => {
  const [patterns, setPatterns] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    // Simulate ML pattern detection
    const mockPatterns = [
      { id: 1, name: 'Head & Shoulders', confidence: 87, signal: 'Bearish', timeframe: '4H' },
      { id: 2, name: 'Double Bottom', confidence: 92, signal: 'Bullish', timeframe: '1D' },
      { id: 3, name: 'Bull Flag', confidence: 78, signal: 'Bullish', timeframe: '1H' },
      { id: 4, name: 'Descending Triangle', confidence: 84, signal: 'Bearish', timeframe: '4H' },
      { id: 5, name: 'Cup & Handle', confidence: 89, signal: 'Bullish', timeframe: '1D' }
    ];
    setPatterns(mockPatterns);
  }, []);

  const runMLAnalysis = () => {
    setIsAnalyzing(true);
    setConfidence(0);
    
    const interval = setInterval(() => {
      setConfidence(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const algorithms = [
    { name: 'Neural Networks', accuracy: '94.2%', status: 'Active' },
    { name: 'Random Forest', accuracy: '91.8%', status: 'Active' },
    { name: 'SVM', accuracy: '89.5%', status: 'Training' },
    { name: 'LSTM', accuracy: '96.1%', status: 'Active' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-bold">ML Pattern Recognition</h2>
        </div>
        <Button onClick={runMLAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? <Activity className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patterns">Detected Patterns</TabsTrigger>
          <TabsTrigger value="algorithms">ML Algorithms</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          {isAnalyzing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Analysis Progress</span>
                    <span>{confidence}%</span>
                  </div>
                  <Progress value={confidence} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patterns.map((pattern) => (
              <Card key={pattern.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{pattern.name}</CardTitle>
                    <Badge variant={pattern.signal === 'Bullish' ? 'default' : 'destructive'}>
                      {pattern.signal}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className="font-medium">{pattern.confidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Timeframe</span>
                      <span className="font-medium">{pattern.timeframe}</span>
                    </div>
                    <Progress value={pattern.confidence} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="algorithms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {algorithms.map((algo, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{algo.name}</CardTitle>
                    <Badge variant={algo.status === 'Active' ? 'default' : 'secondary'}>
                      {algo.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Accuracy</span>
                      <span className="font-medium text-green-600">{algo.accuracy}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  EUR/USD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">↗ Bullish</div>
                  <div className="text-sm text-muted-foreground">Next 4H: 89% confidence</div>
                  <div className="text-sm">Target: 1.0850</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-500" />
                  BTC/USD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-red-600">↘ Bearish</div>
                  <div className="text-sm text-muted-foreground">Next 1D: 76% confidence</div>
                  <div className="text-sm">Target: $42,500</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  GBP/JPY
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">↗ Bullish</div>
                  <div className="text-sm text-muted-foreground">Next 2H: 94% confidence</div>
                  <div className="text-sm">Target: 189.50</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MLPatternRecognition;