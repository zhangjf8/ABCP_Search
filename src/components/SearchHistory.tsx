import { useState } from 'react';
import { WebSearchService } from '@/utils/FirecrawlService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { History, Trash2, Clock, Building, Users, User, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SearchHistoryProps {
  onSelectSearch?: (issuer: string) => void;
}

export const SearchHistory = ({ onSelectSearch }: SearchHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState(() => WebSearchService.getSearchHistory());

  const handleClearHistory = () => {
    WebSearchService.clearSearchHistory();
    setHistory([]);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelectSearch = (issuer: string) => {
    onSelectSearch?.(issuer);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          History ({history.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search History</DialogTitle>
          <DialogDescription>
            View your previous ABCP liquidity provider searches
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {history.length > 0 && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearHistory}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No search history yet</p>
              <p className="text-sm">Your ABCP searches will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((search) => (
                <Card key={search.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        {search.issuer}
                      </CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(search.timestamp)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectSearch(search.issuer)}
                        >
                          Search Again
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {search.results.length > 0 ? (
                      <div className="space-y-4">
                        {search.results.map((result, index) => (
                          <div key={index} className="p-4 border rounded-lg bg-card">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="secondary" className="text-xs">
                                Confidence: {Math.round(result.confidence * 100)}%
                              </Badge>
                              <a 
                                href={result.source} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline truncate max-w-xs"
                              >
                                {result.source}
                              </a>
                            </div>
                            
                            <div className="grid gap-3">
                              {result.liquidityProviders.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-sm">Liquidity Providers:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {result.liquidityProviders.map((provider, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
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
                                    <span className="font-medium text-sm">Administrator:</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {result.administrator}
                                  </Badge>
                                </div>
                              )}
                              
                              {result.sponsor && (
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-sm">Sponsor:</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {result.sponsor}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No results found for this search</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};