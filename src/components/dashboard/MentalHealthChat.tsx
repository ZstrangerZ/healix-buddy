
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const MentalHealthChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm here to listen and support you. How are you feeling today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load previous conversations
  useEffect(() => {
    const loadConversations = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        const { data, error } = await supabase
          .from("chat_conversations")
          .select("*")
          .eq("user_id", user.user.id)
          .order("created_at", { ascending: true })
          .limit(10);

        if (data && !error) {
          const previousMessages = data.flatMap((conv) => [
            {
              id: `user-${conv.id}`,
              text: conv.user_message,
              isUser: true,
              timestamp: new Date(conv.created_at!),
            },
            {
              id: `ai-${conv.id}`,
              text: conv.ai_response || "I understand how you're feeling.",
              isUser: false,
              timestamp: new Date(conv.created_at!),
            },
          ]);
          
          if (previousMessages.length > 0) {
            setMessages([messages[0], ...previousMessages]);
          }
        }
      }
    };

    loadConversations();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      // Call Gemini API through edge function
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { message: userInput }
      });

      if (error) throw error;

      const aiResponseText = data.response || "I'm here to listen and support you. Could you please try sharing your thoughts again?";
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save to database
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        const { error: dbError } = await supabase
          .from("chat_conversations")
          .insert({
            user_id: user.user.id,
            user_message: userInput,
            ai_response: aiResponseText,
          });

        if (dbError) console.error('Database error:', dbError);
      }

      // Text-to-speech for AI response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiResponseText);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "I'm having trouble connecting right now. Please try again.",
        variant: "destructive",
      });

      // Add fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm here to listen and support you. I may be having some connection issues, but please know that your feelings are valid and important.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      recognition.onerror = () => {
        toast({
          title: "Voice recognition error",
          description: "Please try again or type your message.",
          variant: "destructive",
        });
        setListening(false);
      };

      recognition.start();
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          🧠 Mental Health Support
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          A safe space to share your thoughts and feelings - powered by AI
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.isUser
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              {!message.isUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakMessage(message.text)}
                  className="mt-2 p-1 h-6 text-gray-600 hover:text-gray-800"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Share what's on your mind..."
              className="pr-12"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={startListening}
              disabled={listening}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                listening ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {listening && (
          <p className="text-sm text-red-600 mt-2 animate-pulse">
            Listening... Speak now
          </p>
        )}
      </div>
    </div>
  );
};

export default MentalHealthChat;
