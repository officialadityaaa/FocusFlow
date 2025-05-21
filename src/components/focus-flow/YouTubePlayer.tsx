
'use client';

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { YoutubeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Function to extract video ID from various YouTube URL formats
const getYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2] && match[2].length === 11) ? match[2] : null;
};

export function YouTubePlayer(): React.JSX.Element {
  const [videoUrl, setVideoUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = getYouTubeId(videoUrl);
    if (videoId) {
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}`);
    } else {
      setEmbedUrl(null);
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube video URL.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="shadow-md rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-xl font-medium text-primary">
          <YoutubeIcon className="mr-2 h-5 w-5" />
          Watch YouTube
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="url"
            placeholder="Enter YouTube video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="text-sm"
            aria-label="YouTube video URL"
          />
          <Button type="submit" size="sm" className="w-full sm:w-auto">Load Video</Button>
        </form>
        {embedUrl && (
          <div className="mt-4 aspect-video bg-muted rounded-md overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="block" // Ensure iframe takes up space
            ></iframe>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
