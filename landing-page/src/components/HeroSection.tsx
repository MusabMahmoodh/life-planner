import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const chatMessages = [
  { role: "user" as const, content: "I missed my workout again 😞" },
  { role: "ai" as const, content: "That's okay! Let's adjust your plan. What got in the way today?" },
  { role: "user" as const, content: "Work ran late and I was exhausted" },
  { role: "ai" as const, content: "I hear you. What if we tried 15-min morning workouts instead? Easier to protect that time." },
];

export function HeroSection() {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (visibleMessages < chatMessages.length) {
      const timer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages((prev) => prev + 1);
        }, 800);
      }, visibleMessages === 0 ? 1000 : 2000);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages]);

  return (
    <section className="relative min-h-screen gradient-hero pt-24 md:pt-32 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

      {/* Decorative script line - Desktop only */}
      <svg
        className="absolute bottom-20 left-0 right-0 w-full h-48 opacity-10 pointer-events-none hidden md:block"
        viewBox="0 0 1440 200"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M0,100 Q200,20 400,100 T800,100 T1200,100 T1440,100"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-foreground"
        />
        <path
          d="M100,150 Q300,70 500,150 T900,150 T1300,150"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="text-foreground"
        />
      </svg>

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="order-2 lg:order-1"
          >
            <p className="eyebrow text-secondary-foreground/60">
              THE OLD SAYING WAS WRONG
            </p>

            {/* Desktop Hero Text */}
            <h1 className="heading-hero text-foreground mb-6 hidden md:block">
              Failing to Plan{" "}
              <span className="italic font-normal">Wasn't</span>
              <br />
              The Problem.
            </h1>

            {/* Mobile Hero Text - Shorter & Punchier */}
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground mb-4 md:hidden">
              Plans Fail.
              <br />
              <span className="italic font-normal">You Don't Have To.</span>
            </h1>

            {/* Desktop Description */}
            <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-lg hidden md:block">
              You planned. You tried. You did your best.
              <br />
              <span className="italic">But life got in the way.</span>
            </p>

            {/* Mobile Description - Condensed */}
            <p className="text-base text-muted-foreground mb-3 md:hidden">
              You did everything right. <span className="italic">Life still got in the way.</span>
            </p>

            {/* Desktop Full Description */}
            <p className="body-large text-foreground/80 mb-8 max-w-lg hidden md:block">
              Meet AchievaAI. The first AI companion that doesn't just track
              your goals—it understands <em>you</em>. When your plans fall
              apart, we don't judge. We help you pick up the pieces and
              re-route, just like a real human coach.
            </p>

            {/* Mobile Condensed Description */}
            <p className="text-base text-foreground/80 mb-6 md:hidden">
              AchievaAI adapts when your plans fall apart—like a real coach who actually cares.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button variant="hero" size="xl" className="btn-pulse w-full sm:w-auto">
                Start for Free
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground italic">
              Premium features include Human-Voice Mode • 50% Off for Students
            </p>

            {/* Social proof counter - Mobile */}
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground md:hidden">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium border-2 border-background">JK</div>
                <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center text-xs font-medium border-2 border-background">MR</div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">+10K</div>
              </div>
              <span>people started their coaching today</span>
            </div>
          </motion.div>

          {/* Right Content - Phone Mockup with Animated Chat */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="order-1 lg:order-2 flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Floating elements */}
              <div className="absolute -top-8 -left-8 w-16 h-16 bg-secondary rounded-2xl rotate-12 animate-float opacity-60" />
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-success rounded-xl -rotate-6 animate-float-delayed opacity-60" />

              {/* Phone mockup - ENLARGED */}
              <div className="phone-mockup w-80 md:w-96 lg:w-[420px]">
                <div className="phone-screen">
                  {/* Phone header */}
                  <div className="bg-secondary/30 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-bold">
                          AI
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Your AI Coach
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <p className="text-xs text-muted-foreground">Online</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat messages - Animated */}
                  <div className="p-4 space-y-3 min-h-72">
                    <AnimatePresence mode="popLayout">
                      {chatMessages.slice(0, visibleMessages).map((msg, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className={`flex ${
                            msg.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={
                              msg.role === "user"
                                ? "chat-bubble-user max-w-[85%]"
                                : "chat-bubble-ai max-w-[85%]"
                            }
                          >
                            <p className="text-sm md:text-base">{msg.content}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Typing indicator */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex ${
                          chatMessages[visibleMessages]?.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={
                            chatMessages[visibleMessages]?.role === "user"
                              ? "chat-bubble-user"
                              : "chat-bubble-ai"
                          }
                        >
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Input area */}
                  <div className="p-3 border-t border-border">
                    <div className="bg-muted rounded-full px-4 py-2.5 text-sm text-muted-foreground">
                      Type your message...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
