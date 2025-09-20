interface ABCPResult {
  issuer: string;
  liquidityProviders: string[];
  administrator?: string;
  sponsor?: string;
  confidence: number;
  source: string;
}

interface SearchHistory {
  id: string;
  issuer: string;
  timestamp: number;
  results: ABCPResult[];
}

export class WebSearchService {
  private static instance: WebSearchService;

  private constructor() {}

  static getInstance(): WebSearchService {
    if (!WebSearchService.instance) {
      WebSearchService.instance = new WebSearchService();
    }
    return WebSearchService.instance;
  }

  static setApiKey(apiKey: string): void {
    localStorage.setItem('web_search_api_key', apiKey);
  }

  static getApiKey(): string | null {
    return localStorage.getItem('web_search_api_key');
  }

  static setSelectedApi(api: string): void {
    localStorage.setItem('selected_search_api', api);
  }

  static getSelectedApi(): string {
    return localStorage.getItem('selected_search_api') || 'google';
  }

  static hasApiKey(): boolean {
    return !!WebSearchService.getApiKey();
  }

  async searchABCPLiquidityProviders(issuerName: string): Promise<ABCPResult[]> {
    // Specialized search queries for financial websites and rating agencies
    const searchQueries = [
      `site:sec.gov "${issuerName}" ABCP liquidity provider commercial paper filing`,
      `site:moodys.com OR site:standardandpoors.com OR site:fitchratings.com "${issuerName}" ABCP liquidity facilities`,
      `"${issuerName}" ABCP asset backed commercial paper liquidity provider bank facility`,
      `"${issuerName}" commercial paper conduit administrator sponsor liquidity support`,
      `site:edgar.sec.gov "${issuerName}" asset backed commercial paper program administrator`,
      `"${issuerName}" ABCP prospectus liquidity facility credit enhancement banking`,
      `site:bloomberg.com OR site:reuters.com "${issuerName}" ABCP liquidity provider rating`,
      `"${issuerName}" asset backed commercial paper backup liquidity committed facility`
    ];

    const results: ABCPResult[] = [];
    let searchAttempts = 0;

    for (const query of searchQueries) {
      searchAttempts++;
      try {
        // Using mock web search API for demonstration
        const searchResponse = await this.performWebSearch(query);
        
        if (searchResponse?.results && Array.isArray(searchResponse.results)) {
          for (const item of searchResponse.results.slice(0, 3)) {
            const extractedData = this.extractABCPInfoFromText(item.content || item.snippet || '', issuerName);
            if (extractedData) {
              results.push({
                ...extractedData,
                source: item.url || item.link || 'Web Search'
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Search attempt ${searchAttempts} failed:`, error);
      }
    }

    // Save search to history
    this.saveSearchToHistory(issuerName, results);

    if (results.length === 0) {
      throw new Error(`Could not find relevant information after ${searchAttempts} search attempts. Please try a different issuer name or check if the ABCP program exists.`);
    }

    const uniqueResults = this.removeDuplicates(results);
    return uniqueResults.sort((a, b) => b.confidence - a.confidence);
  }

  private async performWebSearch(query: string): Promise<any> {
    const apiKey = WebSearchService.getApiKey();
    const selectedApi = WebSearchService.getSelectedApi();
    
    if (!apiKey) {
      throw new Error('API key not configured');
    }

    try {
      const response = await fetch('/api/websearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          apiKey,
          apiType: selectedApi,
          numResults: 5
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`${selectedApi} search failed:`, error);
      throw error;
    }
  }

  private extractABCPInfoFromText(content: string, issuerName: string): ABCPResult | null {
    const text = content.toLowerCase();
    const issuerLower = issuerName.toLowerCase();
    
    if (!text.includes(issuerLower) && !text.includes('abcp') && !text.includes('commercial paper')) {
      return null;
    }

    const liquidityProviders: string[] = [];
    let administrator: string | undefined;
    let sponsor: string | undefined;
    let confidence = 0;

    const liquidityPatterns = [
      /liquidity\s+provider[s]?[:\s]+([^.]+)/gi,
      /liquidity\s+facilit[y|ies][:\s]+([^.]+)/gi,
      /backup\s+liquidity[:\s]+([^.]+)/gi,
      /committed\s+liquidity[:\s]+([^.]+)/gi,
      /standby\s+liquidity[:\s]+([^.]+)/gi
    ];

    const adminPatterns = [
      /administrator[:\s]+([^.]+)/gi,
      /program\s+administrator[:\s]+([^.]+)/gi,
      /administrative\s+agent[:\s]+([^.]+)/gi
    ];

    const sponsorPatterns = [
      /sponsor[:\s]+([^.]+)/gi,
      /program\s+sponsor[:\s]+([^.]+)/gi,
      /sponsored\s+by[:\s]+([^.]+)/gi
    ];

    liquidityPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const provider = this.cleanExtractedText(match[1]);
          if (provider && !liquidityProviders.includes(provider)) {
            liquidityProviders.push(provider);
            confidence += 0.3;
          }
        }
      }
    });

    adminPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !administrator) {
          administrator = this.cleanExtractedText(match[1]);
          confidence += 0.2;
          break;
        }
      }
    });

    sponsorPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !sponsor) {
          sponsor = this.cleanExtractedText(match[1]);
          confidence += 0.2;
          break;
        }
      }
    });

    if (text.includes(issuerLower)) {
      confidence += 0.3;
    }

    if (liquidityProviders.length === 0 && !administrator && !sponsor) {
      return null;
    }

    return {
      issuer: issuerName,
      liquidityProviders,
      administrator,
      sponsor,
      confidence: Math.min(confidence, 1.0),
      source: ''
    };
  }

  private cleanExtractedText(text: string): string {
    return text
      .replace(/[,.;:!?()[\]{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 8)
      .join(' ');
  }

  private removeDuplicates(results: ABCPResult[]): ABCPResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.issuer}-${result.liquidityProviders.join(',')}-${result.administrator || ''}-${result.sponsor || ''}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private saveSearchToHistory(issuer: string, results: ABCPResult[]): void {
    const history = WebSearchService.getSearchHistory();
    const newSearch: SearchHistory = {
      id: Date.now().toString(),
      issuer,
      timestamp: Date.now(),
      results
    };
    
    history.unshift(newSearch);
    // Keep only last 20 searches
    const limitedHistory = history.slice(0, 20);
    localStorage.setItem('abcp_search_history', JSON.stringify(limitedHistory));
  }

  static getSearchHistory(): SearchHistory[] {
    try {
      const history = localStorage.getItem('abcp_search_history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  static clearSearchHistory(): void {
    localStorage.removeItem('abcp_search_history');
  }
}
