import { useState, useEffect } from 'react';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { ApiKeyForm } from '@/components/ApiKeyForm';
import { ABCPSearchForm } from '@/components/ABCPSearchForm';

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
        <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-primary-light/30 to-primary-dark/30" />
        <div className="relative container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            ABCP Liquidity Provider Intelligence
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            Professional search tool for identifying liquidity providers of Asset Backed Commercial Paper (ABCP) issuers
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
                Configure your search API key to begin finding ABCP liquidity provider information across the internet.
              </p>
            </div>
            <ApiKeyForm onApiKeySet={handleApiKeySet} />
          </div>
        ) : (
          <ABCPSearchForm onReset={handleReset} />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-90">
            Professional ABCP intelligence tool • Built for financial market research
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
