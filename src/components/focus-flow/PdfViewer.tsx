
'use client';

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileTextIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function PdfViewer(): React.JSX.Element {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        // Revoke previous object URL if it exists
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
        const objectUrl = URL.createObjectURL(file);
        setPdfUrl(objectUrl);
        setFileError(null);
      } else {
        // Revoke previous object URL if it exists
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
        setPdfUrl(null);
        const errorMsg = "Invalid file type. Please select a PDF.";
        setFileError(errorMsg);
        toast({
          title: 'Invalid File',
          description: errorMsg,
          variant: 'destructive',
        });
        event.target.value = ""; // Reset file input
      }
    } else {
       // Revoke previous object URL if it exists and no file is selected
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
      setPdfUrl(null);
    }
  };
  
  // Effect to revoke object URL on unmount
  useEffect(() => {
    const currentPdfUrl = pdfUrl; // Capture pdfUrl at the time effect runs
    return () => {
      if (currentPdfUrl) {
        URL.revokeObjectURL(currentPdfUrl);
      }
    };
  }, [pdfUrl]); // Rerun if pdfUrl changes

  return (
    <Card className="shadow-md rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-xl font-medium text-primary">
          <FileTextIcon className="mr-2 h-5 w-5" />
          View PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="text-sm"
          aria-label="Upload PDF file"
        />
        {fileError && <p className="text-sm text-destructive">{fileError}</p>}
        {pdfUrl ? (
          <div className="mt-4 border rounded-md bg-muted" style={{ height: '500px', overflow: 'hidden' }}>
            <iframe
              src={pdfUrl}
              title="PDF Viewer"
              width="100%"
              height="100%"
              className="block" // Ensure iframe takes up space
            ></iframe>
          </div>
        ) : (
          <div className="mt-4 border border-dashed rounded-md flex items-center justify-center bg-muted/50" style={{ height: '200px' }}>
            <p className="text-muted-foreground">Upload a PDF to view</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
