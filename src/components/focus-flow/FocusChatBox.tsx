
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SendIcon, BotIcon, UserIcon, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

interface FocusChatBoxProps {
  onSendMessage: (message: string) => Promise<void>;
  messages: ChatMessage[];
  isResponding: boolean;
  disabled?: boolean; // To disable chat when session is not active or for other reasons
}

export function FocusChatBox({
  messages,
  onSendMessage,
  isResponding,
  disabled = false,
}: FocusChatBoxProps): React.JSX.Element {
  const [currentMessage, setCurrentMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentMessage.trim() || isResponding || disabled) return;
    await onSendMessage(currentMessage.trim());
    setCurrentMessage('');
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div'); // target the viewport
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <Card className="shadow-md rounded-lg w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-xl font-medium text-primary">
          <BotIcon className="mr-2 h-5 w-5" />
          Focus Assistant (Gemini)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea ref={scrollAreaRef} className="h-48 w-full rounded-md border p-3 bg-muted/30">
          {messages.length === 0 && !isResponding && (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Ask Gemini anything...</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 mb-3 ${
                msg.sender === 'user' ? 'justify-end' : ''
              }`}
            >
              {msg.sender === 'bot' && (
                <BotIcon className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
              )}
              <div
                className={`flex flex-col max-w-[80%] leading-1.5 p-3 border-gray-200 rounded-xl ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-ee-none'
                    : 'bg-secondary text-secondary-foreground rounded-es-none'
                }`}
              >
                <p className="text-sm font-normal whitespace-pre-wrap">{msg.text}</p>
              </div>
               {msg.sender === 'user' && (
                <UserIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
              )}
            </div>
          ))}
          {isResponding && messages.length > 0 && messages[messages.length-1].sender === 'user' && (
             <div className="flex items-start gap-2.5 mb-3">
                <BotIcon className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                 <div className="flex flex-col max-w-[80%] leading-1.5 p-3 border-gray-200 rounded-xl bg-secondary text-secondary-foreground rounded-es-none">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            </div>
          )}
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder={disabled ? "Chat disabled" : "Ask something..."}
            value={currentMessage}
            onChange={handleInputChange}
            className="flex-grow"
            disabled={isResponding || disabled}
            aria-label="Chat message input"
          />
          <Button type="submit" size="icon" disabled={isResponding || disabled || !currentMessage.trim()}>
            {isResponding ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendIcon className="h-5 w-5" />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
