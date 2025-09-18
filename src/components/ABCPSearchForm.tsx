import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FirecrawlService } from '@/utils/FirecrawlService';

interface SearchResult {
  issuerName: string;
  liquidityProvider: string;
  source: string;
  relevantInfo: string;
  confidence: 'High' | 'Medium' | 'Low';
}

interface ABCPSearchFormProps {
  onReset: () => void;
}

export const ABCPSearchForm = ({ onReset }: ABCPSearchFormProps) => {
  const { toast } = useToast();
  const [issuerName, setIssuerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const searchABCPLiquidityProvider = async (issuer: string): Promise<SearchResult[]> => {
    setProgress(10);
    
    // Search for ABCP liquidity provider information
    const searchQueries = [
      `"${issuer}" ABCP liquidity provider facility`,
      `"${issuer}" asset backed commercial paper liquidity support`,
      `"${issuer}" ABCP program liquidity enhancement`,
      `"${issuer}" commercial paper conduit liquidity facility`,
    ];

    const results: SearchResult[] = [];
    
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      setProgress(10 + (i / searchQueries.length) * 60);
      
      try {
        // Use Firecrawl to scrape search results
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const scrapeResult = await FirecrawlService.scrapeWebsite(searchUrl);
        
        if (scrapeResult.success && scrapeResult.data?.markdown) {
          const content = scrapeResult.data.markdown;
          
          // Parse content for liquidity provider information
          const liquidityProviders = extractLiquidityProviders(content, issuer);
          results.push(...liquidityProviders);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error searching for query: ${query}`, error);
      }
    }

    setProgress(80);

    // If no results from direct search, try financial database searches
    if (results.length === 0) {
      const financialSites = [
        `site:sec.gov "${issuer}" ABCP liquidity`,
        `site:bloomberg.com "${issuer}" asset backed commercial paper`,
        `site:reuters.com "${issuer}" ABCP facility`,
        `site:moody.com "${issuer}" liquidity provider`,
      ];

      for (const siteQuery of financialSites) {
        try {
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(siteQuery)}`;
          const scrapeResult = await FirecrawlService.scrapeWebsite(searchUrl);
          
          if (scrapeResult.success && scrapeResult.data?.markdown) {
            const content = scrapeResult.data.markdown;
            const liquidityProviders = extractLiquidityProviders(content, issuer);
            results.push(...liquidityProviders);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error searching financial site: ${siteQuery}`, error);
        }
      }
    }

    setProgress(100);
    return results.slice(0, 10); // Limit to top 10 results
  };

  const extractLiquidityProviders = (content: string, issuer: string): SearchResult[] => {
    const results: SearchResult[] = [];
    const lines = content.toLowerCase().split('\n');
    
    // Common liquidity provider keywords
    const liquidityKeywords = [
      'liquidity provider', 'liquidity facility', 'liquidity support',
      'liquidity enhancement', 'backup liquidity', 'liquidity agreement',
      'credit facility', 'standby facility', 'revolving facility'
    ];
    
    // Common bank/financial institution patterns
    const bankPatterns = [
      /\b([A-Z][a-z]+ (?:Bank|Capital|Financial|Securities|Trust|Corp|Inc)(?:\s+[A-Z][a-z]+)*)\b/g,
      /\b(JPMorgan|Goldman Sachs|Bank of America|Wells Fargo|Citibank|Deutsche Bank|Barclays|HSBC|Royal Bank|TD Bank|BMO|Scotiabank)\b/gi
    ];

    lines.forEach((line, index) => {
      const originalLine = content.split('\n')[index];
      
      // Check if line mentions issuer and liquidity concepts
      if (line.includes(issuer.toLowerCase()) || line.includes('abcp') || line.includes('asset backed')) {
        liquidityKeywords.forEach(keyword => {
          if (line.includes(keyword)) {
            // Extract potential bank names from this line and surrounding context
            const contextLines = [
              content.split('\n')[Math.max(0, index - 1)],
              originalLine,
              content.split('\n')[Math.min(content.split('\n').length - 1, index + 1)]
            ].join(' ');
            
            bankPatterns.forEach(pattern => {
              const matches = contextLines.match(pattern);
              if (matches) {
                matches.forEach(bankName => {
                  if (bankName && bankName.length > 3) {
                    results.push({
                      issuerName: issuer,
                      liquidityProvider: bankName.trim(),
                      source: 'Web Search Result',
                      relevantInfo: originalLine.trim(),
                      confidence: line.includes('liquidity provider') ? 'High' : 
                                line.includes('facility') ? 'Medium' : 'Low'
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    // Remove duplicates and return unique results
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => 
        r.liquidityProvider.toLowerCase() === result.liquidityProvider.toLowerCase() &&
        r.issuerName === result.issuerName
      )
    );

    return uniqueResults;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuerName.trim()) return;

    setIsLoading(true);
    setProgress(0);
    setSearchResults([]);

    try {
      const apiKey = FirecrawlService.getApiKey();
      if (!apiKey) {
        toast({
          title: "Error",
          description: "Please set your API key first",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      console.log('Searching for ABCP liquidity provider for:', issuerName);
      const results = await searchABCPLiquidityProvider(issuerName);
      
      if (results.length > 0) {
        setSearchResults(results);
        toast({
          title: "Search Complete",
          description: `Found ${results.length} potential liquidity provider(s)`,
          duration: 3000,
        });
      } else {
        toast({
          title: "No Results",
          description: "No liquidity provider information found for this issuer",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error searching for liquidity provider:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for liquidity provider information",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const exampleIssuers = [
    "Conduit 1 Capital Corp",
    "Liberty Street Funding LLC", 
    "Thunder Bay Funding LLC",
    "Victory Receivables Corporation",
    "Fairway Finance Company LLC"
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-primary">ABCP Liquidity Provider Search</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Enter the name of an Asset Backed Commercial Paper issuer to find their liquidity provider information.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Search for Liquidity Provider</CardTitle>
          <CardDescription>
            Enter the ABCP issuer name to search for liquidity provider information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="issuer" className="text-sm font-medium">
                ABCP Issuer Name
              </label>
              <Input
                id="issuer"
                type="text"
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
                placeholder="e.g., Conduit 1 Capital Corp"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Example issuers:</p>
              <div className="flex flex-wrap gap-2">
                {exampleIssuers.map((example, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIssuerName(example)}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Searching...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Searching..." : "Search Liquidity Provider"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
              >
                Reset API Key
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-primary mb-2">Search Results</h3>
            <p className="text-muted-foreground">
              Found {searchResults.length} potential liquidity provider(s)
            </p>
          </div>

          <div className="grid gap-4">
            {searchResults.map((result, index) => (
              <Card key={index} className="shadow-financial">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{result.issuerName}</CardTitle>
                      <CardDescription>ABCP Issuer</CardDescription>
                    </div>
                    <Badge 
                      variant={result.confidence === 'High' ? 'default' : 
                              result.confidence === 'Medium' ? 'secondary' : 'outline'}
                    >
                      {result.confidence} Confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-primary mb-1">Liquidity Provider</h4>
                    <p className="text-lg font-medium">{result.liquidityProvider}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Source</h4>
                    <p className="text-sm">{result.source}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Relevant Information</h4>
                    <p className="text-sm bg-muted p-3 rounded-md">{result.relevantInfo}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="max-w-2xl mx-auto bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">About ABCP Liquidity Providers</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Asset Backed Commercial Paper (ABCP) programs typically require liquidity facilities 
            provided by banks or financial institutions to support the program during market stress.
          </p>
          <p>
            This tool searches the internet for publicly available information about liquidity 
            providers for specific ABCP issuers, including SEC filings, financial news, and 
            regulatory documents.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};