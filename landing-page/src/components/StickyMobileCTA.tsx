import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function StickyMobileCTA() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show after scrolling 600px, but hide when near bottom (footer area)
      const isScrolledEnough = scrollY > 600;
      const isNearBottom = scrollY + windowHeight > documentHeight - 200;

      setIsVisible(isScrolledEnough && !isNearBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          {/* Gradient fade effect */}
          <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />

          {/* CTA Bar */}
          <div className="bg-background/95 backdrop-blur-lg border-t border-border px-4 py-3 shadow-2xl">
            <Button
              variant="cta"
              size="lg"
              className="w-full h-12 text-base font-semibold"
            >
              Start for Free
            </Button>
            <p className="text-[11px] text-center text-muted-foreground mt-2">
              No credit card required
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
