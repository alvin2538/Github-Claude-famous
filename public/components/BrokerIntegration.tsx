import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BrokerStatus {
  name: string;
  type: 'forex' | 'crypto';
  connected: boolean;
  balance: number;
  positions: number;
  spread: number;
}

export default function BrokerIntegration() {
  const [brokers, setBrokers] = useState<BrokerStatus[]>([
    { name: 'OANDA', type: 'forex', connected: true, balance: 50000, positions: 3, spread: 1.2 },
    { name: 'Binance', type: 'crypto', connected: true, balance: 25000, positions: 5, spread: 0.1 },
    { name: 'Kraken', type: 'crypto', connected: false, balance: 0, positions: 0, spread: 0 },
    { name: 'Interactive Brokers', type: 'forex', connected: false, balance: 0, positions: 0, spread: 0 }
  ]);

  const [credentials, setCredentials] = useState({
    apiKey: '',
    apiSecret: '',
    passphrase: ''
  });

  const connectBroker = (brokerName: string) => {
    setBrokers(prev => prev.map(broker => 
      broker.name === brokerName 
        ? { ...broker, connected: true, balance: Math.random() * 100000 }
        : broker
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Broker Integration</CardTitle>
          <CardDescription>Connect and manage your trading accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="accounts">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
              <TabsTrigger value="setup">Add New Broker</TabsTrigger>
            </TabsList>
            
            <TabsContent value="accounts" className="space-y-4">
              {brokers.map((broker) => (
                <div key={broker.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${broker.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <h3 className="font-semibold">{broker.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {broker.connected ? 
                          `$${broker.balance.toLocaleString()} • ${broker.positions} positions` : 
                          'Not connected'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={broker.type === 'forex' ? 'default' : 'secondary'}>
                      {broker.type.toUpperCase()}
                    </Badge>
                    {!broker.connected && (
                      <Button size="sm" onClick={() => connectBroker(broker.name)}>
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="setup" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={credentials.apiKey}
                    onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your API key"
                  />
                </div>
                <div>
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={credentials.apiSecret}
                    onChange={(e) => setCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="Enter your API secret"
                  />
                </div>
                <div>
                  <Label htmlFor="passphrase">Passphrase (if required)</Label>
                  <Input
                    id="passphrase"
                    type="password"
                    value={credentials.passphrase}
                    onChange={(e) => setCredentials(prev => ({ ...prev, passphrase: e.target.value }))}
                    placeholder="Enter passphrase"
                  />
                </div>
                <Button className="w-full">Add Broker Connection</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}