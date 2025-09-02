import React from 'react';
import { Settings, User, Shield, Palette, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/contexts/AppContext';

export const UserSettings: React.FC = () => {
  const { user, updatePreferences } = useAppContext();

  if (!user) return null;

  const handlePreferenceChange = (key: string, value: any) => {
    updatePreferences({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <p className="text-sm text-gray-600">{user.name}</p>
          </div>
          <div>
            <Label>Email</Label>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Theme</Label>
            <Select
              value={user.preferences.theme}
              onValueChange={(value) => handlePreferenceChange('theme', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trading Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Trading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto Trading</Label>
              <p className="text-sm text-gray-600">Enable automated trading strategies</p>
            </div>
            <Switch
              checked={user.preferences.autoTrading}
              onCheckedChange={(checked) => handlePreferenceChange('autoTrading', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Risk Level</Label>
            <Select
              value={user.preferences.riskLevel}
              onValueChange={(value) => handlePreferenceChange('riskLevel', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Notifications</Label>
              <p className="text-sm text-gray-600">Receive trading alerts</p>
            </div>
            <Switch
              checked={user.preferences.notifications}
              onCheckedChange={(checked) => handlePreferenceChange('notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};