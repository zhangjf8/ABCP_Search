import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FileUploadProps {
  onFileAnalyzed: (analysis: any) => void;
}

interface FileAnalysis {
  fileName: string;
  content: string;
  abcpInfo: {
    issuer?: string;
    liquidityProviders: string[];
    administrator?: string;
    sponsor?: string;
    confidence: number;
  } | null;
}

export const FileUpload = ({ onFileAnalyzed }: FileUploadProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      setError('File size must be less than 20MB');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const analysis: FileAnalysis = await response.json();
      
      onFileAnalyzed(analysis);
      
      toast({
        title: "File analyzed successfully",
        description: `Found ${analysis.abcpInfo?.liquidityProviders.length || 0} potential liquidity providers`,
      });

    } catch (error) {
      console.error('Error analyzing file:', error);
      setError('Failed to analyze file. Please try again.');
      toast({
        title: "Analysis failed",
        description: "Unable to analyze the PDF file",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Document Analysis
        </CardTitle>
        <CardDescription>
          Upload ABCP-related PDF documents (SEC filings, prospectuses, rating reports) to extract liquidity provider information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="w-full"
            variant="outline"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing PDF...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF Document
              </>
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Supported formats: PDF files only</p>
            <p>• Maximum file size: 20MB</p>
            <p>• Best results with: SEC filings, prospectuses, rating agency reports</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};