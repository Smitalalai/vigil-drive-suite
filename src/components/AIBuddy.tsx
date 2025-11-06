import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, MapPin, Music, Coffee, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIBuddyProps {
  fatigueLevel: number;
  heartRate: number;
  stressLevel: number;
  alertLevel: 0 | 1 | 2 | 3;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIBuddy = ({ fatigueLevel, heartRate, stressLevel, alertLevel }: AIBuddyProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [drivingTime, setDrivingTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Track driving time
  useEffect(() => {
    const timer = setInterval(() => {
      setDrivingTime(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Auto-suggestions based on metrics
  useEffect(() => {
    const checkAndSuggest = async () => {
      let shouldSuggest = false;
      let suggestion = '';

      if (alertLevel === 3 || fatigueLevel > 80) {
        shouldSuggest = true;
        suggestion = "I'm really concerned about your condition. Please find a safe place to pull over immediately!";
      } else if (drivingTime > 0 && drivingTime % 90 === 0) {
        shouldSuggest = true;
        suggestion = "You've been driving for quite a while. How about a quick coffee break?";
      } else if (fatigueLevel > 60 && messages.length === 0) {
        shouldSuggest = true;
        suggestion = "Hey there! I notice you seem a bit tired. Want to try a quick breathing exercise?";
      }

      if (shouldSuggest && messages[messages.length - 1]?.role !== 'assistant') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: suggestion,
          timestamp: new Date()
        }]);
      }
    };

    if (drivingTime > 0) {
      checkAndSuggest();
    }
  }, [alertLevel, fatigueLevel, drivingTime]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('wellness-buddy', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          drivingTime,
          fatigueLevel,
          heartRate,
          stressLevel,
          alertLevel
        }
      });

      if (error) throw error;

      if (data.response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }]);
      }
    } catch (error: any) {
      console.error('AI Buddy error:', error);
      toast({
        title: 'Connection Error',
        description: error.message || 'Unable to reach AI buddy',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const findNearby = (type: 'hospital' | 'cafe' | 'restaurant') => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const query = type === 'hospital' ? 'hospital' : type === 'cafe' ? 'cafe' : 'restaurant';
        window.open(`https://www.google.com/maps/search/${query}/@${latitude},${longitude},15z`, '_blank');
      }, (error) => {
        toast({
          title: 'Location Error',
          description: 'Unable to get your location',
          variant: 'destructive'
        });
      });
    }
  };

  const openSpotify = () => {
    window.open('https://open.spotify.com/search/energetic%20playlist', '_blank');
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-background to-accent/10">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary animate-pulse" />
            <div>
              <h3 className="font-semibold">AI Wellness Buddy</h3>
              <p className="text-xs text-muted-foreground">
                Driving time: {Math.floor(drivingTime / 60)}h {drivingTime % 60}m
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Minimize' : 'Expand'}
          </Button>
        </div>

        {isExpanded && (
          <>
            <ScrollArea className="h-64 mb-4 pr-4" ref={scrollRef}>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Hi! I'm here to help you stay safe and healthy while driving.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={isLoading}
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => findNearby('hospital')}
          >
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-xs">Hospital</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => findNearby('cafe')}
          >
            <Coffee className="w-4 h-4 text-amber-600" />
            <span className="text-xs">Café</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => findNearby('restaurant')}
          >
            <MapPin className="w-4 h-4 text-green-500" />
            <span className="text-xs">Food</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={openSpotify}
          >
            <Music className="w-4 h-4 text-green-600" />
            <span className="text-xs">Music</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AIBuddy;