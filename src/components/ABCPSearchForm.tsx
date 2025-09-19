import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Building2, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { FirecrawlService } from '@/utils/FirecrawlService';

interface SearchResult {
  issuerName: string;
  liquidityProvider: string;
  administrator?: string;
  sponsor?: string;
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

  // Enhanced search queries specifically for ABCP liquidity provider information
  const searchQueries = [
    `"${issuerName}" ABCP liquidity provider facility`,
    `"${issuerName}" asset backed commercial paper liquidity support`,
    `"${issuerName}" ABCP program liquidity enhancement bank`,
    `"${issuerName}" commercial paper conduit liquidity facility`,
    `"${issuerName}" backup liquidity agreement`,
    `"${issuerName}" standby facility ABCP`
  ];

  const searchABCPLiquidityProvider = async (issuer: string): Promise<SearchResult[]> => {
    setProgress(10);
    
    const queries = [
      `"${issuer}" ABCP liquidity provider facility`,
      `"${issuer}" asset backed commercial paper liquidity support`,
      `"${issuer}" ABCP program liquidity enhancement bank`,
      `"${issuer}" commercial paper conduit liquidity facility`,
      `"${issuer}" backup liquidity agreement`,
      `"${issuer}" standby facility ABCP`
    ];

    const results: SearchResult[] = [];
    let processedQueries = 0;
    
    for (const query of queries) {
      setProgress(10 + (processedQueries / queries.length) * 70);
      
      try {
        console.log(`Searching for: ${query}`);
        
        // Use Firecrawl to perform intelligent web search
        const searchResult = await FirecrawlService.performWebSearch(query);
        
        if (searchResult.success && searchResult.data?.markdown) {
          const content = searchResult.data.markdown;
          
          // Parse content for liquidity provider information
          const liquidityProviders = extractLiquidityProviders(content, issuer);
          results.push(...liquidityProviders);
        }
        
        processedQueries++;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Error searching for query: ${query}`, error);
        processedQueries++;
      }
    }

    setProgress(85);

    // Remove duplicates and sort by confidence
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => 
        r.liquidityProvider.toLowerCase().trim() === result.liquidityProvider.toLowerCase().trim() &&
        r.issuerName.toLowerCase() === result.issuerName.toLowerCase()
      )
    );

    // Sort by confidence level
    const sortedResults = uniqueResults.sort((a, b) => {
      const confidenceOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    });

    setProgress(100);
    return sortedResults.slice(0, 10); // Limit to top 10 results
  };

  const extractLiquidityProviders = (content: string, issuer: string): SearchResult[] => {
    const results: SearchResult[] = [];
    const lines = content.toLowerCase().split('\n');
    
    // Enhanced liquidity provider keywords
    const liquidityKeywords = [
      'liquidity provider', 'liquidity facility', 'liquidity support',
      'liquidity enhancement', 'backup liquidity', 'liquidity agreement',
      'credit facility', 'standby facility', 'revolving facility',
      'committed facility', 'liquidity backstop', 'liquidity arrangement'
    ];

    // Administrator/Sponsor keywords
    const administratorKeywords = [
      'administrator', 'program administrator', 'servicing agent', 'administrative agent',
      'sponsor', 'program sponsor', 'conduit sponsor', 'abcp sponsor'
    ];
    
    // Enhanced bank/financial institution patterns
    const bankPatterns = [
      // Major global banks
      /\b(JPMorgan Chase|Goldman Sachs|Bank of America|Wells Fargo|Citibank|Citigroup|Deutsche Bank|Barclays|HSBC|UBS|Credit Suisse)\b/gi,
      // Canadian banks
      /\b(Royal Bank of Canada|RBC|Toronto-Dominion|TD Bank|Bank of Montreal|BMO|Bank of Nova Scotia|Scotiabank|Canadian Imperial Bank|CIBC|National Bank of Canada)\b/gi,
      // Other major banks
      /\b(BNP Paribas|Société Générale|Crédit Agricole|Santander|ING|ABN AMRO|Nordea|Mizuho|Sumitomo|MUFG|Mitsubishi UFJ)\b/gi,
      // General bank pattern
      /\b([A-Z][a-z]+ (?:Bank|Capital|Financial|Securities|Trust|Corp|Inc)(?:\s+[A-Z][a-z]+)*)\b/g,
      // Investment banks and financial services
      /\b(Morgan Stanley|Merrill Lynch|Credit Suisse|Nomura|Jefferies|Cowen|Piper Sandler|Raymond James)\b/gi
    ];

    // Enhanced confidence scoring
    const getConfidenceLevel = (line: string, context: string): 'High' | 'Medium' | 'Low' => {
      const highConfidenceIndicators = [
        'liquidity provider', 'provides liquidity', 'backup liquidity',
        'committed facility', 'standby facility', 'liquidity agreement'
      ];
      
      const mediumConfidenceIndicators = [
        'credit facility', 'revolving facility', 'financial support',
        'banking facility', 'liquidity enhancement'
      ];

      if (highConfidenceIndicators.some(indicator => line.includes(indicator))) {
        return 'High';
      } else if (mediumConfidenceIndicators.some(indicator => line.includes(indicator))) {
        return 'Medium';
      } else {
        return 'Low';
      }
    };

    lines.forEach((line, index) => {
      const originalLine = content.split('\n')[index];
      
      // Check if line mentions issuer and liquidity concepts
      if (line.includes(issuer.toLowerCase()) || line.includes('abcp') || line.includes('asset backed')) {
        liquidityKeywords.forEach(keyword => {
          if (line.includes(keyword)) {
            // Extract potential bank names from this line and surrounding context
            const contextLines = [
              content.split('\n')[Math.max(0, index - 2)] || '',
              content.split('\n')[Math.max(0, index - 1)] || '',
              originalLine,
              content.split('\n')[Math.min(content.split('\n').length - 1, index + 1)] || '',
              content.split('\n')[Math.min(content.split('\n').length - 1, index + 2)] || ''
            ].join(' ');
            
            bankPatterns.forEach(pattern => {
              const matches = contextLines.match(pattern);
              if (matches) {
                matches.forEach(bankName => {
                  if (bankName && bankName.length > 3) {
                    const cleanBankName = bankName.trim().replace(/\s+/g, ' ');
                    const confidence = getConfidenceLevel(line, contextLines.toLowerCase());
                    
                    // Extract administrator/sponsor if mentioned in context
                    let administrator = '';
                    let sponsor = '';
                    
                    administratorKeywords.forEach(keyword => {
                      if (contextLines.toLowerCase().includes(keyword)) {
                        const adminMatches = contextLines.match(pattern);
                        if (adminMatches && adminMatches.some(match => 
                          contextLines.toLowerCase().indexOf(match.toLowerCase()) > 
                          contextLines.toLowerCase().indexOf(keyword) - 50 &&
                          contextLines.toLowerCase().indexOf(match.toLowerCase()) < 
                          contextLines.toLowerCase().indexOf(keyword) + 50
                        )) {
                          if (keyword.includes('administrator')) {
                            administrator = cleanBankName;
                          } else if (keyword.includes('sponsor')) {
                            sponsor = cleanBankName;
                          }
                        }
                      }
                    });
                    
                    results.push({
                      issuerName: issuer,
                      liquidityProvider: cleanBankName,
                      administrator: administrator || undefined,
                      sponsor: sponsor || undefined,
                      source: 'Financial Web Search',
                      relevantInfo: originalLine.trim(),
                      confidence: confidence
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    return results;
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
          title: "No Results Found",
          description: `Could not find relevant ABCP information after ${searchQueries.length} targeted searches`,
          variant: "destructive",
          duration: 4000,
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
                <Search className="w-4 h-4 mr-2" />
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
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{result.issuerName}</CardTitle>
                        <CardDescription>ABCP Issuer</CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={result.confidence === 'High' ? 'default' : 
                              result.confidence === 'Medium' ? 'secondary' : 'outline'}
                    >
                      {result.confidence === 'High' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : result.confidence === 'Medium' ? (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {result.confidence} Confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-primary mb-1">Liquidity Provider</h4>
                    <p className="text-lg font-medium">{result.liquidityProvider}</p>
                  </div>

                  {(result.administrator || result.sponsor) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.administrator && (
                        <div>
                          <h4 className="font-semibold text-muted-foreground mb-1">Administrator</h4>
                          <p className="text-sm">{result.administrator}</p>
                        </div>
                      )}
                      {result.sponsor && (
                        <div>
                          <h4 className="font-semibold text-muted-foreground mb-1">Sponsor</h4>
                          <p className="text-sm">{result.sponsor}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <h4 className="font-semibold text-muted-foreground">Source</h4>
                  </div>
                  <p className="text-sm">{result.source}</p>
                  
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