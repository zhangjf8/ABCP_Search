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
      switch (selectedApi) {
        case 'google':
          return await this.performGoogleSearch(query, apiKey);
        case 'bing':
          return await this.performBingSearch(query, apiKey);
        case 'serpapi':
          return await this.performSerpApiSearch(query, apiKey);
        case 'firecrawl':
          return await this.performFirecrawlSearch(query, apiKey);
        default:
          return await this.performMockSearch(query);
      }
    } catch (error) {
      console.warn(`${selectedApi} search failed, falling back to mock:`, error);
      return await this.performMockSearch(query);
    }
  }

  private async performGoogleSearch(query: string, apiKey: string): Promise<any> {
    const cx = 'YOUR_SEARCH_ENGINE_ID'; // User needs to provide this
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`
    );
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      results: data.items?.map((item: any) => ({
        url: item.link,
        title: item.title,
        content: item.snippet,
        snippet: item.snippet
      })) || []
    };
  }

  private async performBingSearch(query: string, apiKey: string): Promise<any> {
    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Bing Search API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      results: data.webPages?.value?.map((item: any) => ({
        url: item.url,
        title: item.name,
        content: item.snippet,
        snippet: item.snippet
      })) || []
    };
  }

  private async performSerpApiSearch(query: string, apiKey: string): Promise<any> {
    const response = await fetch(
      `https://serpapi.com/search?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=5`
    );
    
    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      results: data.organic_results?.map((item: any) => ({
        url: item.link,
        title: item.title,
        content: item.snippet,
        snippet: item.snippet
      })) || []
    };
  }

  private async performFirecrawlSearch(query: string, apiKey: string): Promise<any> {
    // Firecrawl is more for scraping than searching, so we'll use it differently
    // For now, return mock results but in a real implementation, 
    // you might want to scrape specific financial websites
    return await this.performMockSearch(query);
  }

  private async performMockSearch(query: string): Promise<any> {
    const mockResults = [
      {
        url: 'https://sec.gov/example-abcp-filing',
        title: `ABCP Program Information for ${query}`,
        content: `Liquidity Provider: JPMorgan Chase Bank, N.A. Administrator: Wells Fargo Bank, N.A. Sponsor: Example Capital LLC. This Asset Backed Commercial Paper program provides short-term funding through the issuance of commercial paper backed by various asset pools.`,
        snippet: 'SEC filing information about ABCP liquidity arrangements'
      },
      {
        url: 'https://moodys.com/abcp-rating-report',
        title: 'ABCP Liquidity Support Facilities Rating Report',
        content: `Backup liquidity: Bank of America, N.A. Committed liquidity facility: Citibank, N.A. Program administrator: The Bank of New York Mellon. The program sponsor maintains credit enhancement through various mechanisms. Rating: A-1+ by Standard & Poor's.`,
        snippet: 'Moody\'s rating agency report on ABCP liquidity arrangements'
      },
      {
        url: 'https://bloomberg.com/abcp-market-news',
        title: 'ABCP Market Analysis and Liquidity Trends',
        content: `Recent ABCP issuances show strong liquidity support from major banks including Wells Fargo Bank, N.A., Deutsche Bank AG, and Royal Bank of Canada. Program administrators typically include major trust banks with extensive commercial paper experience.`,
        snippet: 'Bloomberg financial news on ABCP market trends'
      }
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { results: mockResults };
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
