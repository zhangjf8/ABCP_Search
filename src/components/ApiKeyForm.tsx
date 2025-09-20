import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, AlertCircle, Globe } from 'lucide-react';
import { WebSearchService } from '@/utils/FirecrawlService';

interface ApiKeyFormProps {
  onApiKeySet: () => void;
}

export const ApiKeyForm = ({ onApiKeySet }: ApiKeyFormProps) => {
  const [apiKey, setApiKey] = useState('');
  const [selectedApi, setSelectedApi] = useState('google');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }

    try {
      // Set the API key and selected API
      WebSearchService.setApiKey(apiKey.trim());
      WebSearchService.setSelectedApi(selectedApi);
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
        <CardTitle>Setup ABCP Intelligence Search</CardTitle>
        <CardDescription>
          Choose your preferred search API and enter the API key to search financial websites and rating agencies for ABCP liquidity provider information.
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
            <label htmlFor="apiSelection" className="text-sm font-medium">
              Search API Provider
            </label>
            <Select value={selectedApi} onValueChange={setSelectedApi}>
              <SelectTrigger>
                <SelectValue placeholder="Select API provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google Custom Search API</SelectItem>
                <SelectItem value="bing">Bing Web Search API</SelectItem>
                <SelectItem value="serpapi">SerpAPI</SelectItem>
                <SelectItem value="firecrawl">Firecrawl API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${selectedApi.charAt(0).toUpperCase() + selectedApi.slice(1)} API key`}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={!apiKey.trim()}>
            <Globe className="mr-2 h-4 w-4" />
            Setup {selectedApi.charAt(0).toUpperCase() + selectedApi.slice(1)} Search
          </Button>
        </form>
        
        <div className="mt-4 text-xs text-muted-foreground space-y-2">
          <div className="text-center">
            <p><strong>API Key Requirements:</strong></p>
          </div>
          <div className="space-y-1">
            <p>• <strong>Google:</strong> Get free key at Google Cloud Console (100 searches/day)</p>
            <p>• <strong>Bing:</strong> Get free key at Azure Cognitive Services (3,000 searches/month)</p>
            <p>• <strong>SerpAPI:</strong> Get free key at serpapi.com (100 searches/month)</p>
            <p>• <strong>Firecrawl:</strong> Get key at firecrawl.dev (specialized web scraping)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};