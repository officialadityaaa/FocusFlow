
'use client';

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileTextIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PdfViewerProps {
  // key prop will be used for resetting by changing it
}

export function PdfViewer(props: PdfViewerProps): React.JSX.Element {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Effect to clear PDF URL and file input when the component's key changes (external reset)
  useEffect(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null); 
    }
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]); 


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
        toast({
          title: 'PDF Loaded',
          description: `${file.name} is ready to view.`,
        });
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
        if (event.target) {
           event.target.value = "";
        }
      }
    } else { 
        if (pdfUrl) { 
          URL.revokeObjectURL(pdfUrl);
          setPdfUrl(null); 
        }
    }
  };
  
  useEffect(() => {
    const currentPdfUrlForCleanup = pdfUrl; 
    return () => {
      if (currentPdfUrlForCleanup) {
        URL.revokeObjectURL(currentPdfUrlForCleanup);
      }
    };
  }, [pdfUrl]);


  return (
    <Card className="shadow-md rounded-lg">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
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
        <div className="mt-4 border rounded-md bg-muted h-[500px] relative"> {/* Added position: relative */}
          {pdfUrl ? (
            <iframe
              key={pdfUrl} 
              src={pdfUrl}
              title="PDF Viewer"
              // width="100%" // Handled by Tailwind
              // height="100%" // Handled by Tailwind
              className="absolute top-0 left-0 w-full h-full block border-0" // Added position absolute and border-0
              // type="application/pdf" // Generally not needed for src, but can try if issues persist
            ></iframe>
          ) : (
            <div className="flex items-center justify-center bg-muted/50 h-full">
              <p className="text-muted-foreground">Upload a PDF to view</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
