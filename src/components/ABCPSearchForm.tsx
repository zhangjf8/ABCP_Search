import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Building, Users, User, Shield, ExternalLink, History, Settings, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { WebSearchService } from '@/utils/FirecrawlService';
import { SearchHistory } from '@/components/SearchHistory';
import { FileUpload } from '@/components/FileUpload';
import { useToast } from '@/components/ui/use-toast';

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
  const [issuerName, setIssuerName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [results, setResults] = useState<ABCPResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState<any>(null);
  const { toast } = useToast();
  const webSearchService = WebSearchService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuerName.trim()) return;

    try {
      setIsSearching(true);
      setError(null);
      setResults([]);
      setSearchProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSearchProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const searchResults = await webSearchService.searchABCPLiquidityProviders(issuerName.trim());
      
      clearInterval(progressInterval);
      setSearchProgress(100);
      
      setResults(searchResults);
      toast({
        title: "Search completed",
        description: `Found ${searchResults.length} result(s) for "${issuerName}"`,
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
      setIsSearching(false);
      setSearchProgress(0);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('web_search_api_key');
    localStorage.removeItem('selected_search_api');
    onReset();
  };

  const handleFileAnalyzed = (analysis: any) => {
    setFileAnalysis(analysis);
    if (analysis.abcpInfo) {
      setResults([{
        ...analysis.abcpInfo,
        source: `PDF: ${analysis.fileName}`
      }]);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-100 text-green-800';
    if (confidence >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">ABCP Intelligence Platform</h2>
          <p className="text-muted-foreground mt-2">
            Search financial websites and analyze documents for Asset Backed Commercial Paper liquidity provider information
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="mr-2 h-4 w-4" />
            {showHistory ? 'Hide' : 'Show'} History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            <Settings className="mr-2 h-4 w-4" />
            Reset API ({WebSearchService.getSelectedApi().toUpperCase()})
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <SearchHistory onSelectSearch={setIssuerName} />
      )}

      {/* Main Content */}
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Web Search</TabsTrigger>
          <TabsTrigger value="document">Document Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search ABCP Issuer
              </CardTitle>
              <CardDescription>
                Search financial websites and rating agencies for ABCP liquidity provider information
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
                
                <div className="flex gap-4">
                  <Input
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                    placeholder="e.g., JPMorgan Chase, Bank of America ABCP Program"
                    className="flex-1"
                    disabled={isSearching}
                  />
                  <Button type="submit" disabled={isSearching || !issuerName.trim()}>
                    {isSearching ? (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4 animate-pulse" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
                
                {isSearching && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Searching financial websites and rating agencies...</span>
                      <span>{searchProgress}%</span>
                    </div>
                    <Progress value={searchProgress} className="w-full" />
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="document" className="space-y-4">
          <FileUpload onFileAnalyzed={handleFileAnalyzed} />
          
          {fileAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Analysis Results: {fileAnalysis.fileName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Extracted Content Preview:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {fileAnalysis.content.substring(0, 500)}...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Results Section */}

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