
'use client';

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileTextIcon, MaximizeIcon, MinimizeIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PdfViewerProps {
  // key prop will be used for resetting by changing it
}

export function PdfViewer(props: PdfViewerProps): React.JSX.Element {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPdfUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
    if (document.fullscreenElement && iframeContainerRef.current?.contains(document.fullscreenElement)) {
      document.exitFullscreen();
    }
  }, []); 

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

  const toggleFullScreen = () => {
    if (!iframeContainerRef.current) return;

    if (!document.fullscreenElement) {
      iframeContainerRef.current.requestFullscreen()
        .then(() => setIsFullScreen(true))
        .catch(err => {
          toast({
            title: 'Fullscreen Error',
            description: `Could not enter fullscreen mode: ${err.message}`,
            variant: 'destructive',
          });
        });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullScreen(false))
          .catch(err => {
             toast({
                title: 'Fullscreen Error',
                description: `Could not exit fullscreen mode: ${err.message}`,
                variant: 'destructive',
              });
          });
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Ensure exiting fullscreen if component unmounts/key changes while fullscreen
      if (document.fullscreenElement && iframeContainerRef.current?.contains(document.fullscreenElement)) {
         document.exitFullscreen().catch(() => {}); // Silently try to exit
      }
    };
  }, []);


  return (
    <Card className="shadow-md rounded-lg">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-xl font-medium text-primary">
          <FileTextIcon className="mr-2 h-5 w-5" />
          View PDF
        </CardTitle>
        {pdfUrl && (
          <Button variant="ghost" size="icon" onClick={toggleFullScreen} aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}>
            {isFullScreen ? <MinimizeIcon className="h-5 w-5" /> : <MaximizeIcon className="h-5 w-5" />}
          </Button>
        )}
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
        <div ref={iframeContainerRef} className={`mt-4 border rounded-md bg-muted ${isFullScreen ? 'fixed inset-0 z-50 bg-background' : ''}`} style={!isFullScreen ? { height: '500px', overflow: 'hidden' } : {}}>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="PDF Viewer"
              width="100%"
              height="100%"
              className="block"
            ></iframe>
          ) : (
            <div className="flex items-center justify-center bg-muted/50" style={{ height: isFullScreen ? '100vh': '200px' }}>
              <p className="text-muted-foreground">Upload a PDF to view</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
