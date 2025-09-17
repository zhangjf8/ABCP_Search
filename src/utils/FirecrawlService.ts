// Browser-compatible Firecrawl API service using direct REST calls
export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static BASE_URL = 'https://api.firecrawl.dev';

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    console.log('API key saved successfully');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing API key with Firecrawl API');
      
      const response = await fetch(`${this.BASE_URL}/v0/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          formats: ['markdown']
        }),
      });

      return response.status === 200;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static async scrapeWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      console.log('Making scrape request to Firecrawl API for:', url);
      
      const response = await fetch(`${this.BASE_URL}/v0/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'table', 'tr', 'td', 'th', 'div', 'span', 'a'],
          excludeTags: ['nav', 'footer', 'header', 'aside', 'script', 'style']
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Scrape failed:', result);
        return { 
          success: false, 
          error: result.error || `HTTP ${response.status}: Failed to scrape website`
        };
      }

      if (!result.success) {
        console.error('Scrape failed:', result);
        return { 
          success: false, 
          error: result.error || 'Failed to scrape website'
        };
      }

      console.log('Scrape successful:', result);
      return { 
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error during scrape:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      console.log('Starting crawl request to Firecrawl API');
      
      // Start the crawl
      const crawlResponse = await fetch(`${this.BASE_URL}/v0/crawl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          limit: 50,
          scrapeOptions: {
            formats: ['markdown', 'html'],
            onlyMainContent: true,
            includeTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'table', 'tr', 'td', 'th', 'div', 'span', 'a'],
            excludeTags: ['nav', 'footer', 'header', 'aside', 'script', 'style']
          }
        }),
      });

      const crawlResult = await crawlResponse.json();

      if (!crawlResponse.ok) {
        console.error('Crawl start failed:', crawlResult);
        return { 
          success: false, 
          error: crawlResult.error || `HTTP ${crawlResponse.status}: Failed to start crawl`
        };
      }

      if (!crawlResult.success) {
        console.error('Crawl start failed:', crawlResult);
        return { 
          success: false, 
          error: crawlResult.error || 'Failed to start crawl'
        };
      }

      const jobId = crawlResult.jobId;
      console.log('Crawl started with job ID:', jobId);

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max wait time
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const statusResponse = await fetch(`${this.BASE_URL}/v0/crawl/status/${jobId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        const statusResult = await statusResponse.json();

        if (!statusResponse.ok) {
          return { 
            success: false, 
            error: statusResult.error || 'Failed to check crawl status'
          };
        }

        if (statusResult.status === 'completed') {
          console.log('Crawl completed:', statusResult);
          return { 
            success: true,
            data: statusResult
          };
        }

        if (statusResult.status === 'failed') {
          return { 
            success: false, 
            error: 'Crawl job failed'
          };
        }

        attempts++;
      }

      return { 
        success: false, 
        error: 'Crawl timed out after 5 minutes'
      };
    } catch (error) {
      console.error('Error during crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }
}