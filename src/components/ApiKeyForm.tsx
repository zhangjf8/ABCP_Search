import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FirecrawlService } from '@/utils/FirecrawlService';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiKeyFormProps {
  onApiKeySet: () => void;
}

export const ApiKeyForm = ({ onApiKeySet }: ApiKeyFormProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsLoading(true);
    
    try {
      const isValid = await FirecrawlService.testApiKey(apiKey);
      
      if (isValid) {
        FirecrawlService.saveApiKey(apiKey);
        toast({
          title: "Success",
          description: "API key validated and saved successfully",
          duration: 3000,
        });
        onApiKeySet();
      } else {
        toast({
          title: "Invalid API Key",
          description: "Please check your Firecrawl API key and try again",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate API key",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-financial">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary">
          <Key className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-primary">API Configuration</CardTitle>
        <CardDescription>
          Enter your Firecrawl API key to start scraping Canadian bank websites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              Firecrawl API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="fc-xxxxxxxxxxxxxxxx"
              required
              className="transition-all duration-200 focus:shadow-md"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !apiKey.trim()}
            className="w-full bg-gradient-primary hover:bg-primary-dark transition-all duration-200"
          >
            {isLoading ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Validate & Save
              </>
            )}
          </Button>
        </form>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Don't have a Firecrawl API key?</p>
          <a 
            href="https://firecrawl.dev" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-accent hover:text-accent-light underline"
          >
            Get one at firecrawl.dev
          </a>
        </div>
      </CardContent>
    </Card>
  );
};