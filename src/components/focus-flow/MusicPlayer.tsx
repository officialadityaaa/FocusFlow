
'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { MusicIcon, PlayIcon, PauseIcon, Volume1Icon, Volume2Icon, XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MusicPlayerProps {
  // key prop will be used for resetting by changing it
}

export function MusicPlayer(props: MusicPlayerProps): React.JSX.Element {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [trackName, setTrackName] = useState<string | null>('No track loaded');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5); // 0 to 1
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Reset state when key changes
  useEffect(() => {
    if (audioRef.current && audioSrc) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioSrc);
    }
    setAudioSrc(null);
    setTrackName('No track loaded');
    setIsPlaying(false);
    setVolume(0.5);
    setDuration(0);
    setCurrentTime(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]); // Rely on key change from parent to trigger reset

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        if (audioSrc) {
          URL.revokeObjectURL(audioSrc); // Clean up previous object URL
        }
        const newAudioSrc = URL.createObjectURL(file);
        setAudioSrc(newAudioSrc);
        setTrackName(file.name);
        setIsPlaying(false); // Don't auto-play
        toast({
          title: 'Track Loaded',
          description: `${file.name} is ready to play.`,
        });
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select an audio file.',
          variant: 'destructive',
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !audioSrc) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
        toast({ title: "Playback Error", description: "Could not play audio.", variant: "destructive"});
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
     if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  useEffect(() => {
    const currentAudioRef = audioRef.current;
    if (currentAudioRef) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      currentAudioRef.addEventListener('play', handlePlay);
      currentAudioRef.addEventListener('pause', handlePause);
      currentAudioRef.addEventListener('ended', handleEnded);
      currentAudioRef.addEventListener('timeupdate', handleTimeUpdate);
      currentAudioRef.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // Set initial volume
      currentAudioRef.volume = volume;

      return () => {
        currentAudioRef.removeEventListener('play', handlePlay);
        currentAudioRef.removeEventListener('pause', handlePause);
        currentAudioRef.removeEventListener('ended', handleEnded);
        currentAudioRef.removeEventListener('timeupdate', handleTimeUpdate);
        currentAudioRef.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [audioSrc, volume]); // Rerun if audioSrc changes to attach listeners to new audio element

  // Cleanup object URL on component unmount or when audioSrc changes
  useEffect(() => {
    const currentAudioSrc = audioSrc;
    return () => {
      if (currentAudioSrc) {
        URL.revokeObjectURL(currentAudioSrc);
      }
    };
  }, [audioSrc]);


  return (
    <Card className="shadow-md rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-xl font-medium text-primary">
          <MusicIcon className="mr-2 h-5 w-5" />
          Local Music Player
        </CardTitle>
        <CardDescription className="text-xs">
          Play audio files from your device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="text-sm"
          aria-label="Upload audio file"
        />
        
        {audioSrc && audioRef && (
          <audio ref={audioRef} src={audioSrc} />
        )}

        <div className="p-3 bg-muted/50 rounded-md space-y-3">
          <p className="text-sm font-semibold text-foreground truncate" title={trackName || ''}>
            {trackName || 'No track loaded'}
          </p>
          
          {audioSrc && (
            <>
              <div className="flex items-center justify-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  className="w-12 h-12"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  disabled={!audioSrc}
                >
                  {isPlaying ? <PauseIcon className="h-7 w-7" /> : <PlayIcon className="h-7 w-7" />}
                </Button>
              </div>

              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <Slider
                  value={[currentTime]}
                  max={duration || 0}
                  step={1}
                  onValueChange={(value) => {
                    if (audioRef.current) audioRef.current.currentTime = value[0];
                  }}
                  className="w-full"
                  aria-label="Track progress"
                  disabled={!audioSrc || duration === 0}
                />
                <span>{formatTime(duration || 0)}</span>
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            {volume === 0 ? <XIcon className="h-5 w-5 text-muted-foreground" /> : <Volume1Icon className="h-5 w-5 text-muted-foreground" /> }
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-full"
              aria-label="Volume control"
            />
            <Volume2Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        {!audioSrc && (
           <div className="flex flex-col items-center justify-center text-center p-6 bg-muted/30 rounded-md min-h-[100px]">
            <MusicIcon className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Select an audio file to play.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
