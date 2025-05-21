
'use client';

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileTextIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react'; // Added useRef here
import { useToast } from '@/hooks/use-toast';

interface PdfViewerProps {
  // key prop will be used for resetting by changing it
}

export function PdfViewer(props: PdfViewerProps): React.JSX.Element {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Effect to reset component state if the key changes (used for external reset)
  // This is implicitly handled if the key prop changes on the component instance.
  // We also need to reset the file input value.
  useEffect(() => {
    // This effect will run on initial mount and when the key changes (causing re-mount)
    setPdfUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input
    }
  }, []); // Empty dependency array means it runs on mount (and re-mount due to key change)


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
        const objectUrl = URL.createObjectURL(file);
        setPdfUrl(objectUrl);
        setFileError(null);
      } else {
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
        event.target.value = ""; 
      }
    } else {
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
      setPdfUrl(null);
    }
  };
  
  useEffect(() => {
    const currentPdfUrl = pdfUrl; 
    return () => {
      if (currentPdfUrl) {
        URL.revokeObjectURL(currentPdfUrl);
      }
    };
  }, [pdfUrl]);

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
          ref={fileInputRef}
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
              className="block"
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
