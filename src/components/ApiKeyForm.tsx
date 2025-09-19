import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, AlertCircle } from 'lucide-react';
import { WebSearchService } from '@/utils/FirecrawlService';

interface ApiKeyFormProps {
  onApiKeySet: () => void;
}

export const ApiKeyForm = ({ onApiKeySet }: ApiKeyFormProps) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }

    try {
      // Set the API key
      WebSearchService.setApiKey(apiKey.trim());
      onApiKeySet();
    } catch (error) {
      setError('Failed to set API key. Please try again.');
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
          <Key className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle>Setup Web Search</CardTitle>
        <CardDescription>
          Enter your Web Search API key to start searching for ABCP liquidity provider information across the web.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              Web Search API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Web Search API key"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={!apiKey.trim()}>
            <Key className="mr-2 h-4 w-4" />
            Set API Key
          </Button>
        </form>
        
        <div className="mt-4 text-xs text-muted-foreground text-center">
          <p>For demonstration purposes, any key will work</p>
        </div>
      </CardContent>
    </Card>
  );
};