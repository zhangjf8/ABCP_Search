export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, apiKey, apiType = 'google', numResults = 5 } = req.body;

  if (!query || !apiKey) {
    return res.status(400).json({ error: 'Query and API key are required' });
  }

  try {
    let results = [];

    switch (apiType) {
      case 'google':
        results = await performGoogleSearch(query, apiKey, numResults);
        break;
      case 'bing':
        results = await performBingSearch(query, apiKey, numResults);
        break;
      case 'serpapi':
        results = await performSerpApiSearch(query, apiKey, numResults);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported API type' });
    }

    res.status(200).json({
      results,
      query,
      total: results.length
    });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Search failed' 
    });
  }
}

async function performGoogleSearch(query: string, apiKey: string, numResults: number) {
  // For Google Custom Search, users need both API key and Custom Search Engine ID
  // For demo purposes, we'll use a general search endpoint
  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=017576662512468239146:omuauf_lfve&q=${encodeURIComponent(query)}&num=${numResults}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Google Search API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Google Search API error: ${data.error.message}`);
  }

  return data.items?.map((item: any) => ({
    url: item.link,
    title: item.title,
    content: item.snippet,
    snippet: item.snippet
  })) || [];
}

async function performBingSearch(query: string, apiKey: string, numResults: number) {
  const response = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${numResults}`,
    {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Accept': 'application/json',
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Bing Search API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Bing Search API error: ${data.error.message}`);
  }

  return data.webPages?.value?.map((item: any) => ({
    url: item.url,
    title: item.name,
    content: item.snippet,
    snippet: item.snippet
  })) || [];
}

async function performSerpApiSearch(query: string, apiKey: string, numResults: number) {
  const response = await fetch(
    `https://serpapi.com/search?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=${numResults}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    }
  );

  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  return data.organic_results?.map((item: any) => ({
    url: item.link,
    title: item.title,
    content: item.snippet,
    snippet: item.snippet
  })) || [];
}