import { IncomingForm } from 'formidable';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';

// Disable default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

interface ABCPInfo {
  issuer?: string;
  liquidityProviders: string[];
  administrator?: string;
  sponsor?: string;
  confidence: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the uploaded file
    const form = new IncomingForm();
    const [fields, files] = await form.parse(req);
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the file content (for now, we'll simulate PDF parsing)
    const fileContent = fs.readFileSync(file.filepath);
    
    // Mock PDF text extraction and ABCP analysis
    // In a real implementation, you would use a PDF parsing library like pdf-parse
    const mockAnalysis = await simulatePDFAnalysis(file.originalFilename || 'document.pdf');
    
    // Clean up uploaded file
    fs.unlinkSync(file.filepath);
    
    res.status(200).json(mockAnalysis);
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    res.status(500).json({ error: 'Failed to analyze PDF' });
  }
}

async function simulatePDFAnalysis(fileName: string): Promise<{
  fileName: string;
  content: string;
  abcpInfo: ABCPInfo | null;
}> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock extracted content based on common ABCP document patterns
  const mockContent = `
    ASSET BACKED COMMERCIAL PAPER PROGRAM
    
    Program Administrator: The Bank of New York Mellon
    Program Sponsor: Example Capital Management LLC
    
    LIQUIDITY FACILITIES
    The Program has entered into the following liquidity facilities:
    - JPMorgan Chase Bank, N.A. - $500,000,000 364-day revolving credit facility
    - Bank of America, N.A. - $300,000,000 liquidity support facility
    - Wells Fargo Bank, N.A. - $200,000,000 backup liquidity facility
    
    CREDIT ENHANCEMENT
    Citibank, N.A. provides credit enhancement through a standby letter of credit.
    
    RATING INFORMATION
    The commercial paper notes are rated A-1+ by Standard & Poor's and P-1 by Moody's.
  `;

  // Extract ABCP information using similar logic to web search
  const abcpInfo = extractABCPFromPDF(mockContent, fileName);
  
  return {
    fileName,
    content: mockContent,
    abcpInfo
  };
}

function extractABCPFromPDF(content: string, fileName: string): ABCPInfo | null {
  const text = content.toLowerCase();
  const liquidityProviders: string[] = [];
  let administrator: string | undefined;
  let sponsor: string | undefined;
  let confidence = 0;

  // Enhanced patterns for PDF documents
  const liquidityPatterns = [
    /liquidity\s+facilit[y|ies][:\s]+([^.]+)/gi,
    /revolving\s+credit\s+facilit[y|ies][:\s]+([^.]+)/gi,
    /backup\s+liquidity[:\s]+([^.]+)/gi,
    /liquidity\s+support[:\s]+([^.]+)/gi,
    /standby\s+liquidity[:\s]+([^.]+)/gi,
    /credit\s+facilit[y|ies][:\s]+([^.]+)/gi,
    /\$[\d,]+\s+[^\n]*facility[^\n]*?([A-Z][^.\n]*(?:Bank|N\.A\.|LLC|Corp|Inc))/gi
  ];

  const adminPatterns = [
    /program\s+administrator[:\s]+([^.]+)/gi,
    /administrator[:\s]+([^.]+)/gi,
    /administrative\s+agent[:\s]+([^.]+)/gi,
    /trustee[:\s]+([^.]+)/gi
  ];

  const sponsorPatterns = [
    /program\s+sponsor[:\s]+([^.]+)/gi,
    /sponsor[:\s]+([^.]+)/gi,
    /sponsored\s+by[:\s]+([^.]+)/gi,
    /originator[:\s]+([^.]+)/gi
  ];

  // Extract liquidity providers
  liquidityPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const provider = cleanExtractedText(match[1]);
        if (provider && !liquidityProviders.includes(provider)) {
          liquidityProviders.push(provider);
          confidence += 0.3;
        }
      }
    });

  // Extract administrator
  adminPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !administrator) {
        administrator = cleanExtractedText(match[1]);
        confidence += 0.2;
        break;
      }
    }
  });

  // Extract sponsor
  sponsorPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !sponsor) {
        sponsor = cleanExtractedText(match[1]);
        confidence += 0.2;
        break;
      }
    }
  });

  // PDF documents typically have higher confidence
  if (text.includes('commercial paper') || text.includes('abcp')) {
    confidence += 0.4;
  }

  if (liquidityProviders.length === 0 && !administrator && !sponsor) {
    return null;
  }

  return {
    issuer: fileName.replace('.pdf', ''),
    liquidityProviders,
    administrator,
    sponsor,
    confidence: Math.min(confidence, 1.0)
  };
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/[,.;:!?()[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 8)
    .join(' ');
}