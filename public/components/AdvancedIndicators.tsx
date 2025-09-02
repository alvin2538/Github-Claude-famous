import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VolumeProfile {
  price: number;
  volume: number;
  percentage: number;
}

interface OrderFlow {
  timestamp: string;
  bidVolume: number;
  askVolume: number;
  delta: number;
  cumDelta: number;
}

export default function AdvancedIndicators() {
  const [volumeProfile, setVolumeProfile] = useState<VolumeProfile[]>([]);
  const [orderFlow, setOrderFlow] = useState<OrderFlow[]>([]);
  const [marketProfile, setMarketProfile] = useState({
    poc: 1.2345, // Point of Control
    vah: 1.2380, // Value Area High
    val: 1.2310, // Value Area Low
    valueArea: 68.2
  });

  useEffect(() => {
    // Simulate volume profile data
    const mockVolumeProfile = Array.from({ length: 20 }, (_, i) => ({
      price: 1.2300 + (i * 0.001),
      volume: Math.random() * 10000,
      percentage: Math.random() * 100
    })).sort((a, b) => b.volume - a.volume);
    
    setVolumeProfile(mockVolumeProfile);

    // Simulate order flow data
    const mockOrderFlow = Array.from({ length: 10 }, (_, i) => {
      const bidVol = Math.random() * 1000;
      const askVol = Math.random() * 1000;
      return {
        timestamp: new Date(Date.now() - i * 60000).toLocaleTimeString(),
        bidVolume: bidVol,
        askVolume: askVol,
        delta: bidVol - askVol,
        cumDelta: (Math.random() - 0.5) * 5000
      };
    });
    
    setOrderFlow(mockOrderFlow);
  }, []);

  const getDeltaColor = (delta: number) => {
    if (delta > 100) return 'text-green-600';
    if (delta < -100) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Market Analysis</CardTitle>
          <CardDescription>Volume Profile & Order Flow Analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="volume-profile">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="volume-profile">Volume Profile</TabsTrigger>
              <TabsTrigger value="order-flow">Order Flow</TabsTrigger>
              <TabsTrigger value="market-profile">Market Profile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="volume-profile" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Volume by Price</h3>
                {volumeProfile.slice(0, 10).map((level, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{level.price.toFixed(4)}</span>
                    <div className="flex items-center space-x-2 flex-1 mx-4">
                      <Progress value={level.percentage} className="flex-1" />
                      <span className="text-sm">{level.volume.toFixed(0)}</span>
                    </div>
                    {index === 0 && <Badge variant="secondary">POC</Badge>}
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="order-flow" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Real-Time Order Flow</h3>
                <div className="grid grid-cols-5 gap-2 text-sm font-semibold border-b pb-2">
                  <span>Time</span>
                  <span>Bid Vol</span>
                  <span>Ask Vol</span>
                  <span>Delta</span>
                  <span>Cum Delta</span>
                </div>
                {orderFlow.map((flow, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 text-sm p-2 hover:bg-gray-50 rounded">
                    <span className="font-mono">{flow.timestamp}</span>
                    <span className="text-green-600">{flow.bidVolume.toFixed(0)}</span>
                    <span className="text-red-600">{flow.askVolume.toFixed(0)}</span>
                    <span className={getDeltaColor(flow.delta)}>{flow.delta.toFixed(0)}</span>
                    <span className={getDeltaColor(flow.cumDelta)}>{flow.cumDelta.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="market-profile" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Point of Control (POC)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{marketProfile.poc.toFixed(4)}</div>
                    <p className="text-sm text-muted-foreground">Highest volume price level</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Value Area</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">High:</span>
                        <span className="font-mono">{marketProfile.vah.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Low:</span>
                        <span className="font-mono">{marketProfile.val.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Coverage:</span>
                        <span>{marketProfile.valueArea}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}