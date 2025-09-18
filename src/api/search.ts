// Simple web search API endpoint simulation
// In a real implementation, this would connect to a search API like Google Custom Search, Bing, etc.

interface SearchRequest {
  query: string;
  numResults?: number;
}

interface SearchResult {
  title: string;
  url: string;
  content: string;
  snippet: string;
}

interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
}

// Mock search results for demonstration
const mockSearchResults: SearchResult[] = [
  {
    title: "ABCP Market Overview - Federal Reserve",
    url: "https://www.federalreserve.gov/econres/feds/files/2019017pap.pdf",
    content: "Asset-backed commercial paper (ABCP) is typically backed by trade receivables, credit card receivables, auto loans, or other assets. The liquidity provider for ABCP programs is often a major commercial bank that provides backup liquidity facility. Bank of America provides liquidity facilities for several ABCP conduits including those managed by various asset managers.",
    snippet: "Asset-backed commercial paper programs typically require liquidity providers..."
  },
  {
    title: "Structured Finance Market Data",
    url: "https://example-financial-data.com/abcp-market",
    content: "Major liquidity providers in the ABCP market include JPMorgan Chase, Citibank, Wells Fargo, and Bank of America. These institutions provide backup liquidity facilities that serve as credit enhancement for commercial paper programs. Apollo Asset Management's ABCP program is supported by JPMorgan Chase's liquidity facility.",
    snippet: "Major banks serve as liquidity providers for ABCP programs..."
  }
];

export async function searchAPI(request: SearchRequest): Promise<SearchResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Filter mock results based on query
  const filteredResults = mockSearchResults.filter(result => 
    result.content.toLowerCase().includes(request.query.toLowerCase()) ||
    result.title.toLowerCase().includes(request.query.toLowerCase())
  );

  return {
    results: filteredResults.slice(0, request.numResults || 5),
    totalResults: filteredResults.length
  };
}

// API endpoint handler
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const searchRequest: SearchRequest = req.body;
    const results = await searchAPI(searchRequest);
    res.status(200).json(results);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}