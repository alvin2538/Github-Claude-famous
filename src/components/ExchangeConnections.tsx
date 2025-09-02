import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';

interface ExchangeStatus {
  name: string;
  connected: boolean;
  latency: number;
  lastUpdate: string;
  pairs: number;
}

export default function ExchangeConnections() {
  const [exchanges, setExchanges] = useState<ExchangeStatus[]>([
    { name: 'Binance', connected: false, latency: 0, lastUpdate: '', pairs: 0 },
    { name: 'Kraken', connected: false, latency: 0, lastUpdate: '', pairs: 0 },
    { name: 'OANDA', connected: false, latency: 0, lastUpdate: '', pairs: 0 }
  ]);
  const [apiKeys, setApiKeys] = useState({ binance: '', kraken: '', oanda: '' });

  const connectExchange = async (exchange: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('connect-exchange', {
        body: { exchange, apiKey: apiKeys[exchange.toLowerCase() as keyof typeof apiKeys] }
      });
      
      if (!error && data.success) {
        setExchanges(prev => prev.map(ex => 
          ex.name.toLowerCase() === exchange.toLowerCase() 
            ? { ...ex, connected: true, latency: data.latency, pairs: data.pairs }
            : ex
        ));
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exchange Connections</CardTitle>
          <CardDescription>Manage your trading exchange connections</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="status">Connection Status</TabsTrigger>
              <TabsTrigger value="config">API Configuration</TabsTrigger>
            </TabsList>
            
            <TabsContent value="status" className="space-y-4">
              {exchanges.map((exchange) => (
                <div key={exchange.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${exchange.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <h3 className="font-semibold">{exchange.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {exchange.connected ? `${exchange.pairs} pairs • ${exchange.latency}ms` : 'Disconnected'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={exchange.connected ? 'default' : 'secondary'}>
                    {exchange.connected ? 'Connected' : 'Offline'}
                  </Badge>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="config" className="space-y-4">
              {Object.entries(apiKeys).map(([exchange, key]) => (
                <div key={exchange} className="space-y-2">
                  <Label htmlFor={exchange}>{exchange.toUpperCase()} API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id={exchange}
                      type="password"
                      value={key}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [exchange]: e.target.value }))}
                      placeholder="Enter API key"
                    />
                    <Button onClick={() => connectExchange(exchange)}>Connect</Button>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}