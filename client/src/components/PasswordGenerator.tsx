import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Copy, RefreshCw } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { GeneratePasswordInput, GeneratedPassword } from '../../../server/src/schema';

interface PasswordGeneratorProps {
  onPasswordGenerated?: (password: string) => void;
  inline?: boolean;
}

export function PasswordGenerator({ onPasswordGenerated, inline = false }: PasswordGeneratorProps) {
  const [settings, setSettings] = useState<GeneratePasswordInput>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true
  });
  
  const [generatedPassword, setGeneratedPassword] = useState<GeneratedPassword | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await trpc.generatePassword.mutate(settings);
      setGeneratedPassword(result);
      if (onPasswordGenerated) {
        onPasswordGenerated(result.password);
      }
    } catch (error) {
      console.error('Failed to generate password:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'password-strength-weak';
      case 'fair': return 'password-strength-fair';
      case 'good': return 'password-strength-good';
      case 'strong': return 'password-strength-strong';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Length Slider */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Password Length: {settings.length}</Label>
        <Slider
          value={[settings.length]}
          onValueChange={([value]) => setSettings(prev => ({ ...prev, length: value }))}
          min={4}
          max={64}
          step={1}
          className="w-full"
        />
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="uppercase"
            checked={settings.includeUppercase}
            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeUppercase: checked }))}
          />
          <Label htmlFor="uppercase" className="text-sm">Uppercase</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="lowercase"
            checked={settings.includeLowercase}
            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeLowercase: checked }))}
          />
          <Label htmlFor="lowercase" className="text-sm">Lowercase</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="numbers"
            checked={settings.includeNumbers}
            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeNumbers: checked }))}
          />
          <Label htmlFor="numbers" className="text-sm">Numbers</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="symbols"
            checked={settings.includeSymbols}
            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeSymbols: checked }))}
          />
          <Label htmlFor="symbols" className="text-sm">Symbols</Label>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="exclude-similar"
          checked={settings.excludeSimilar}
          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, excludeSimilar: checked }))}
        />
        <Label htmlFor="exclude-similar" className="text-sm">Exclude similar characters (0, O, l, I)</Label>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        Generate Password
      </Button>

      {/* Generated Password Display */}
      {generatedPassword && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Generated Password</Label>
            <Badge className={getStrengthColor(generatedPassword.strength)} variant="outline">
              {generatedPassword.strength.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Input
              value={generatedPassword.password}
              readOnly
              className="font-mono text-sm bg-gray-50"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(generatedPassword.password)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          🔐 Password Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}