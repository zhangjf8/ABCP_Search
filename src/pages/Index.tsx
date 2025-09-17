import { useState, useEffect } from 'react';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { ApiKeyForm } from '@/components/ApiKeyForm';
import { ScrapeForm } from '@/components/ScrapeForm';
import heroImage from '@/assets/financial-hero.jpg';

const Index = () => {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const existingKey = FirecrawlService.getApiKey();
    setHasApiKey(!!existingKey);
  }, []);

  const handleApiKeySet = () => {
    setHasApiKey(true);
  };

  const handleReset = () => {
    localStorage.removeItem('firecrawl_api_key');
    setHasApiKey(false);
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Hero Section */}
      <div className="relative bg-gradient-primary text-primary-foreground">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Canadian Bank Bond Intelligence
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            Professional web scraping tool for analyzing covered bond information from Canadian banking institutions
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="px-4 py-2 bg-white/10 rounded-full">✓ Real-time Data</span>
            <span className="px-4 py-2 bg-white/10 rounded-full">✓ Comprehensive Analysis</span>
            <span className="px-4 py-2 bg-white/10 rounded-full">✓ Professional Grade</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {!hasApiKey ? (
          <div className="text-center space-y-8">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-primary mb-4">Get Started</h2>
              <p className="text-muted-foreground mb-8">
                Configure your Firecrawl API key to begin scraping Canadian bank websites for covered bond information.
              </p>
            </div>
            <ApiKeyForm onApiKeySet={handleApiKeySet} />
          </div>
        ) : (
          <ScrapeForm onReset={handleReset} />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-90">
            Professional financial data scraping tool • Built for Canadian banking research
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
