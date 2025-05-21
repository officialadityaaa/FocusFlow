
'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon, RadioIcon, Volume2Icon, XCircleIcon } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SpotifyPlayerProps {
  // key prop will be used for resetting by changing it
}

export function SpotifyPlayer(props: SpotifyPlayerProps): React.JSX.Element {
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState({
    title: 'Ambient Chill',
    artist: 'Focus Beats',
    albumArtUrl: 'https://placehold.co/100x100.png',
  });
  const [volume, setVolume] = useState(50);

  // Effect to reset state if key changes (e.g., main session reset)
  useEffect(() => {
    setIsConnected(false);
    setIsPlaying(false);
    setCurrentTrack({
      title: 'Ambient Chill',
      artist: 'Focus Beats',
      albumArtUrl: 'https://placehold.co/100x100.png',
    });
    setVolume(50);
  }, []); // Re-runs when the component is remounted due to key change

  const handleConnectToggle = () => {
    setIsConnected(!isConnected);
    if (isConnected) setIsPlaying(false); // Stop playing if disconnecting
  };

  const handlePlayPause = () => {
    if (!isConnected) return;
    setIsPlaying(!isPlaying);
  };

  const handleSkipNext = () => {
    if (!isConnected) return;
    // Simulate skipping to next track
    setCurrentTrack({
      title: 'Lofi Focus Stream',
      artist: 'Chillhop Cow',
      albumArtUrl: 'https://placehold.co/101x101.png', // Change slightly to show update
    });
    setIsPlaying(true);
  };

  const handleSkipPrev = () => {
    if (!isConnected) return;
    // Simulate skipping to previous track
    setCurrentTrack({
      title: 'Deep Work Alpha Waves',
      artist: 'Brain Sync',
      albumArtUrl: 'https://placehold.co/102x102.png', // Change slightly to show update
    });
    setIsPlaying(true);
  };

  return (
    <Card className="shadow-md rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xl font-medium text-primary">
            <RadioIcon className="mr-2 h-5 w-5" />
            Spotify Player
          </CardTitle>
          <Button
            variant={isConnected ? 'destructive' : 'default'}
            size="sm"
            onClick={handleConnectToggle}
          >
            {isConnected ? <XCircleIcon className="mr-2 h-4 w-4" /> : <RadioIcon className="mr-2 h-4 w-4" />}
            {isConnected ? 'Disconnect' : 'Connect Spotify'}
          </Button>
        </div>
        <CardDescription className="text-xs">
          Control your Spotify playback. (This is a UI simulation)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default" className="bg-accent/30 border-accent/50">
          <RadioIcon className="h-4 w-4 text-accent-foreground" />
          <AlertTitle className="text-sm font-semibold text-accent-foreground">Simulation Notice</AlertTitle>
          <AlertDescription className="text-xs text-accent-foreground">
            This Spotify player is for demonstration purposes only and does not connect to or control actual Spotify services.
          </AlertDescription>
        </Alert>

        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md">
              <Image
                src={currentTrack.albumArtUrl}
                alt="Album art"
                width={60}
                height={60}
                className="rounded-md"
                data-ai-hint="music album"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground">{currentTrack.artist}</p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3">
              <Button variant="ghost" size="icon" onClick={handleSkipPrev} aria-label="Previous track">
                <SkipBackIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handlePlayPause} className="w-12 h-12" aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? <PauseIcon className="h-7 w-7" /> : <PlayIcon className="h-7 w-7" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSkipNext} aria-label="Next track">
                <SkipForwardIcon className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Volume2Icon className="h-5 w-5 text-muted-foreground" />
              <Slider
                defaultValue={[volume]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0])}
                className="w-full"
                aria-label="Volume control"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-muted/30 rounded-md min-h-[150px]">
            <RadioIcon className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Connect to Spotify to control your music.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
