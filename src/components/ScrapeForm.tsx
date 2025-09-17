import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from '@/utils/FirecrawlService';
import { Search, Globe, Settings } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface ScrapeResult {
  url: string;
  title?: string;
  content?: string;
  metadata?: any;
}

interface ScrapeFormProps {
  onReset: () => void;
}

export const ScrapeForm = ({ onReset }: ScrapeFormProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrapeResults, setScrapeResults] = useState<ScrapeResult[]>([]);
  const [isCrawlMode, setIsCrawlMode] = useState(false);

  const canadianBankUrls = [
    'https://www.rbc.com',
    'https://www.td.com',
    'https://www.bmo.com',
    'https://www.scotiabank.com',
    'https://www.cibc.com',
    'https://www.nbc.ca'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setProgress(0);
    setScrapeResults([]);
    
    try {
      let result;
      if (isCrawlMode) {
        toast({
          title: "Starting Crawl",
          description: "This may take a few minutes...",
        });
        result = await FirecrawlService.crawlWebsite(url);
      } else {
        result = await FirecrawlService.scrapeWebsite(url);
      }

      setProgress(50);
      
      if (result.success && result.data) {
        const processedResults: ScrapeResult[] = [];
        
        if (isCrawlMode && Array.isArray(result.data.data)) {
          // Handle crawl results
          result.data.data.forEach((page: any) => {
            if (page.content || page.markdown) {
              processedResults.push({
                url: page.url || url,
                title: page.title || 'Untitled',
                content: page.markdown || page.content,
                metadata: page.metadata
              });
            }
          });
        } else {
          // Handle single page scrape
          processedResults.push({
            url: url,
            title: result.data.title || 'Scraped Page',
            content: result.data.markdown || result.data.content,
            metadata: result.data.metadata
          });
        }

        setScrapeResults(processedResults);
        setProgress(100);
        
        toast({
          title: "Success",
          description: `Successfully ${isCrawlMode ? 'crawled' : 'scraped'} ${processedResults.length} page(s)`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${isCrawlMode ? 'crawl' : 'scrape'} website`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error ${isCrawlMode ? 'crawling' : 'scraping'} website:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isCrawlMode ? 'crawl' : 'scrape'} website`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const extractCoveredBondInfo = (content: string) => {
    const keywords = ['covered bond', 'mortgage bond', 'asset backed', 'bond program', 'issuance', 'rating'];
    const lines = content.split('\n');
    const relevantLines = lines.filter(line => 
      keywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    return relevantLines.slice(0, 10); // Show first 10 relevant lines
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="shadow-financial">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary">
              <Globe className="h-5 w-5 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl text-primary">Canadian Bank Bond Scraper</CardTitle>
          </div>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary" className="text-xs">Professional Tool</Badge>
            <Badge variant="outline" className="text-xs">Powered by Firecrawl</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label htmlFor="url" className="text-sm font-medium">
                  Bank Website URL
                </label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.rbc.com/investor-relations/"
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

            {/* Quick Bank Links */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick Links - Major Canadian Banks:</p>
              <div className="flex flex-wrap gap-2">
                {canadianBankUrls.map((bankUrl) => (
                  <Button
                    key={bankUrl}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUrl(bankUrl)}
                    className="text-xs hover:bg-secondary"
                  >
                    {bankUrl.replace('https://www.', '').replace('.com', '').replace('.ca', '').toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCrawlMode}
                  onChange={(e) => setIsCrawlMode(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Deep Crawl Mode (slower, more comprehensive)</span>
              </label>
            </div>

            {isLoading && (
              <Progress value={progress} className="w-full" />
            )}

            <Button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full bg-gradient-primary hover:bg-primary-dark transition-all duration-200 shadow-md"
            >
              {isLoading ? (
                <>
                  <Search className="mr-2 h-4 w-4 animate-spin" />
                  {isCrawlMode ? 'Crawling...' : 'Scraping...'}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {isCrawlMode ? 'Start Deep Crawl' : 'Scrape Page'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {scrapeResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Scraping Results</h2>
          {scrapeResults.map((result, index) => (
            <Card key={index} className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {result.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{result.url}</p>
              </CardHeader>
              <CardContent>
                {result.content && (
                  <div className="space-y-4">
                    {/* Covered Bond Highlights */}
                    {(() => {
                      const bondInfo = extractCoveredBondInfo(result.content);
                      return bondInfo.length > 0 && (
                        <div className="p-4 bg-gradient-secondary rounded-lg border-l-4 border-accent">
                          <h4 className="font-semibold text-primary mb-2">🏦 Covered Bond Information Detected:</h4>
                          <div className="space-y-1">
                            {bondInfo.map((line, i) => (
                              <p key={i} className="text-sm text-muted-foreground">{line.trim()}</p>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Full Content */}
                    <div className="max-h-96 overflow-auto bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Full Content:</h4>
                      <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {result.content.slice(0, 3000)}
                        {result.content.length > 3000 && '...'}
                      </pre>
                    </div>
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