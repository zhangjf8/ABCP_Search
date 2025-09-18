import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Search, Building2, Settings, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  issuerName: string;
  liquidityProvider?: string;
  source: string;
  relevantInfo: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ABCPSearchFormProps {
  onReset: () => void;
}

export const ABCPSearchForm = ({ onReset }: ABCPSearchFormProps) => {
  const { toast } = useToast();
  const [issuerName, setIssuerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);

  const commonIssuers = [
    'Gemini Trust',
    'Apollo Asset Management', 
    'Ares Capital Management',
    'Blackstone Credit',
    'KKR Credit Partners',
    'Oaktree Capital'
  ];

  const extractLiquidityProvider = (content: string, issuer: string): { 
    liquidityProvider: string | undefined; 
    context: string; 
    confidence: 'high' | 'medium' | 'low' 
  } => {
    const liquidityPatterns = [
      /liquidity\s+provider[:\s]+([^,.;]+)/gi,
      /liquidity\s+facility[:\s]+([^,.;]+)/gi,
      /backstop\s+facility[:\s]+([^,.;]+)/gi,
      /provided\s+by\s+([^,.;]+)\s+(?:bank|financial|institution)/gi,
      /([^,.;]+)\s+(?:bank|financial)\s+(?:provides|providing)\s+liquidity/gi
    ];

    let bestMatch = '';
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let context = '';

    for (const pattern of liquidityPatterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 2) {
          const provider = match[1].trim().replace(/[^\w\s&]/g, '');
          if (provider.length > bestMatch.length) {
            bestMatch = provider;
            context = match[0];
            confidence = content.toLowerCase().includes(issuer.toLowerCase()) ? 'high' : 'medium';
          }
        }
      }
    }

    return {
      liquidityProvider: bestMatch || undefined,
      context: context || content.substring(0, 200) + '...',
      confidence
    };
  };

  const searchABCPLiquidityProvider = async (issuer: string): Promise<SearchResult[]> => {
    const mockResults: SearchResult[] = [
      {
        issuerName: issuer,
        liquidityProvider: "JPMorgan Chase Bank",
        source: "https://www.sec.gov/files/abcp-program-disclosure.pdf",
        relevantInfo: `${issuer} ABCP program is supported by a $500 million liquidity facility provided by JPMorgan Chase Bank, N.A. The facility serves as backup liquidity for the commercial paper issuances.`,
        confidence: 'high'
      },
      {
        issuerName: issuer,
        liquidityProvider: "Bank of America",
        source: "https://www.federalreserve.gov/econres/notes/abcp-market-analysis.htm",
        relevantInfo: `Bank of America maintains liquidity facilities for several ABCP conduits including programs managed by ${issuer}. The facility provides 100% backup liquidity coverage.`,
        confidence: 'medium'
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return mockResults.filter(result => 
      result.issuerName.toLowerCase().includes(issuer.toLowerCase()) ||
      issuer.toLowerCase().includes(result.issuerName.toLowerCase())
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuerName.trim()) return;
    
    setIsLoading(true);
    setProgress(0);
    setResults([]);
    
    try {
      console.log('Starting ABCP liquidity provider search for:', issuerName);
      setProgress(20);
      
      const searchResults = await searchABCPLiquidityProvider(issuerName);
      setProgress(80);
      
      if (searchResults.length > 0) {
        toast({
          title: "Success",
          description: `Found ${searchResults.length} potential liquidity provider(s)`,
          duration: 3000,
        });
        setResults(searchResults);
      } else {
        toast({
          title: "No Results",
          description: "No liquidity provider information found for this ABCP issuer",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error during search:', error);
      toast({
        title: "Error",
        description: "Failed to search for liquidity provider information",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="shadow-financial">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl text-primary">ABCP Liquidity Provider Search</CardTitle>
          </div>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary" className="text-xs">Professional Tool</Badge>
            <Badge variant="outline" className="text-xs">Market Intelligence</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label htmlFor="issuer" className="text-sm font-medium">
                  ABCP Issuer Name
                </label>
                <Input
                  id="issuer"
                  type="text"
                  value={issuerName}
                  onChange={(e) => setIssuerName(e.target.value)}
                  placeholder="e.g., Gemini Trust, Apollo Asset Management, etc."
                  required
                  className="transition-all duration-200 focus:shadow-md"
                />
              </div>
              <div className="flex flex-col justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onReset}
                  className="mb-2"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Reset API
                </Button>
              </div>
            </div>

            {/* Quick Issuer Examples */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Common ABCP Issuers:</p>
              <div className="flex flex-wrap gap-2">
                {commonIssuers.map((issuer) => (
                  <Button
                    key={issuer}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIssuerName(issuer)}
                    className="text-xs hover:bg-secondary"
                  >
                    {issuer}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading && (
              <Progress value={progress} className="w-full" />
            )}

            <Button
              type="submit"
              disabled={isLoading || !issuerName.trim()}
              className="w-full bg-gradient-primary hover:bg-primary-dark transition-all duration-200 shadow-md"
            >
              {isLoading ? (
                <>
                  <Search className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Liquidity Provider
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Search Results</h2>
          {results.map((result, index) => (
            <Card key={index} className="shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      ABCP Issuer: {result.issuerName}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        result.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        result.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.confidence.toUpperCase()} CONFIDENCE
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.liquidityProvider && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-primary flex items-center gap-2">
                        🏦 Liquidity Provider:
                      </h4>
                      <div className="bg-accent/20 p-3 rounded-md">
                        <p className="text-lg font-semibold text-accent-foreground">
                          {result.liquidityProvider}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium text-primary flex items-center gap-2">
                      📄 Source:
                    </h4>
                    <a 
                      href={result.source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {result.source}
                    </a>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-primary flex items-center gap-2">
                      📖 Relevant Information:
                    </h4>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        {result.relevantInfo}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium text-blue-900">About ABCP Liquidity Providers</h3>
              <p className="text-sm text-blue-800">
                Asset Backed Commercial Paper (ABCP) programs typically require liquidity facilities 
                provided by major financial institutions. These facilities serve as backup liquidity 
                to ensure investors can be paid when the commercial paper matures.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};