import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Building, Users, User, Shield, ExternalLink, RotateCcw } from 'lucide-react';
import { WebSearchService } from '@/utils/FirecrawlService';
import { SearchHistory } from '@/components/SearchHistory';
import { toast } from '@/hooks/use-toast';

interface ABCPResult {
  issuer: string;
  liquidityProviders: string[];
  administrator?: string;
  sponsor?: string;
  confidence: number;
  source: string;
}

interface ABCPSearchFormProps {
  onReset: () => void;
}

export const ABCPSearchForm = ({ onReset }: ABCPSearchFormProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ABCPResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const webSearchService = WebSearchService.getInstance();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      setResults([]);

      const searchResults = await webSearchService.searchABCPLiquidityProviders(searchQuery.trim());
      
      setResults(searchResults);
      toast({
        title: "Search completed",
        description: `Found ${searchResults.length} result(s) for "${searchQuery}"`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-100 text-green-800';
    if (confidence >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            ABCP Liquidity Provider Search
          </CardTitle>
          <CardDescription>
            Search for Asset Backed Commercial Paper liquidity provider information using AI-powered web search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter ABCP issuer name (e.g., Conduit 1 Capital Corp)"
                className="flex-1"
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search ABCP
                  </>
                )}
              </Button>
              <SearchHistory onSelectSearch={setSearchQuery} />
              <Button variant="outline" onClick={onReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building className="h-5 w-5" />
            Search Results ({results.length})
          </h3>
          
          {results.map((result, index) => (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{result.issuer}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge className={getConfidenceColor(result.confidence)}>
                        {Math.round(result.confidence * 100)}% confidence
                      </Badge>
                    </CardDescription>
                  </div>
                  <a 
                    href={result.source} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    Source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.liquidityProviders.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Liquidity Providers</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.liquidityProviders.map((provider, idx) => (
                        <Badge key={idx} variant="secondary">
                          {provider}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.administrator && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Administrator</h4>
                    </div>
                    <Badge variant="outline">{result.administrator}</Badge>
                  </div>
                )}
                
                {result.sponsor && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold">Sponsor</h4>
                    </div>
                    <Badge variant="outline">{result.sponsor}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};