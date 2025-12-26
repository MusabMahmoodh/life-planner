import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "ai";
  content: string;
}

const generateDummyResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();
  
  if (/weight|fitness|gym|exercise|diet|eat/.test(lowerInput)) {
    return "I hear you. Let's build a plan that works with your schedule, not against it. When do you typically have free time during the week?";
  }
  if (/study|exam|school|homework|college|university/.test(lowerInput)) {
    return "Exam stress is real. Can you tell me what's making it hardest to focus right now? Is it time management, motivation, or something else?";
  }
  if (/business|startup|work|job|career|boss/.test(lowerInput)) {
    return "Decision fatigue is tough at the top. What's the biggest bottleneck you're facing this week? Let's break it down together.";
  }
  if (/procrastinat|lazy|motivation|can't start/.test(lowerInput)) {
    return "Procrastination isn't a character flaw—it's often a sign of overwhelm. What's one tiny step we could take today? Just 5 minutes?";
  }
  if (/anxious|anxiety|stress|worried|overwhelm/.test(lowerInput)) {
    return "I'm sorry you're feeling that way. Remember: you don't have to tackle everything at once. What's weighing on you most right now?";
  }
  
  return "That's a meaningful goal. Tell me more—what's been getting in your way? Understanding your obstacles is the first step to overcoming them.";
};

interface InteractiveChatProps {
  onSignupClick?: () => void;
}

export function InteractiveChat({ onSignupClick }: InteractiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hi! I'm your AI coach. What's one goal you're struggling with right now?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    // Simulate AI thinking and responding
    setTimeout(() => {
      const response = generateDummyResponse(userMessage);
      setMessages(prev => [...prev, { role: "ai", content: response }]);
      setIsTyping(false);

      if (!hasInteracted) {
        setHasInteracted(true);
        // Show signup modal after first interaction
        setTimeout(() => {
          setShowSignupModal(true);
        }, 2500);
      }
    }, 1500);
  };

  return (
    <div className="card-elevated overflow-hidden relative">
      {/* Chat Header */}
      <div className="bg-secondary/30 px-6 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">AI</span>
          </div>
          <div>
            <p className="font-semibold text-foreground">Your AI Coach</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs text-muted-foreground">Online • Try me!</p>
            </div>
          </div>
        </div>
        <span className="text-xs bg-success text-success-foreground px-3 py-1 rounded-full font-medium">
          Live Demo
        </span>
      </div>

      {/* Chat Messages */}
      <div className="p-4 md:p-6 space-y-4 min-h-72 max-h-80 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] ${
                  msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                }`}
              >
                <p className="text-sm md:text-base">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="chat-bubble-ai">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-background rounded-full px-4 py-3 flex items-center border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your goal or challenge..."
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-1 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4 text-primary" />
            </button>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-3">
          {hasInteracted 
            ? "Sign up to save this conversation and unlock unlimited coaching"
            : "Type a message to try the AI coach • No signup required"
          }
        </p>
      </form>

      {/* Signup Modal Overlay */}
      <AnimatePresence>
        {showSignupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="text-center max-w-sm"
            >
              <button
                onClick={() => setShowSignupModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-2">
                You're on the right track!
              </h3>
              <p className="text-muted-foreground mb-6">
                Sign up free to continue this conversation and start your personalized coaching journey.
              </p>
              
              <Button 
                variant="cta" 
                size="lg" 
                className="w-full mb-3"
                onClick={onSignupClick}
              >
                Continue for Free
              </Button>
              <button
                onClick={() => setShowSignupModal(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
