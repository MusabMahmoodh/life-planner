import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, HeartCrack, Zap } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const scienceCards = [
  {
    icon: Brain,
    title: "The Planning Fallacy",
    subtitle: "Kahneman & Tversky",
    body: "Human beings are biologically wired to underestimate how long tasks take. A rigid calendar breaks the moment reality hits.",
    color: "bg-secondary/50",
  },
  {
    icon: HeartCrack,
    title: 'The "What-The-Hell" Effect',
    subtitle: "Polivy & Herman",
    body: "When we miss one small goal, we feel shame. That shame makes us abandon the entire plan.",
    color: "bg-problem/30",
  },
  {
    icon: Zap,
    title: "The Implementation Gap",
    subtitle: "Harvard Business Review",
    body: "We fail not because we lack vision, but because we lack an adaptive system to handle the daily whirlwind.",
    color: "bg-success/50",
  },
];

function ScienceCard({ card, index }: { card: typeof scienceCards[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 * index }}
      className="card-elevated p-6 lg:p-8 h-full group hover:-translate-y-2 transition-transform duration-300"
    >
      <div
        className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
      >
        <card.icon className="w-6 h-6 text-foreground" />
      </div>

      <h3 className="text-xl font-bold text-foreground mb-1">
        {card.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {card.subtitle}
      </p>
      <p className="text-foreground/80">{card.body}</p>
    </motion.div>
  );
}

export function ProblemSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <section id="science" className="section-padding bg-problem/50 rounded-3xl mx-4 md:mx-8 lg:mx-16">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="eyebrow"
          >
            WHY MOST PLANS FAIL
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="heading-section text-foreground mb-6"
          >
            <span className="hidden md:inline">Why do 92% of plans end up in the dustbin halfway through?</span>
            <span className="md:hidden">Why 92% of Plans Fail</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="body-large text-muted-foreground hidden md:block"
          >
            We've all heard the quote:{" "}
            <em>"If you fail to plan, you plan to fail."</em> But what if you{" "}
            <strong>did</strong> plan?
            <br />
            <br />
            Willpower isn't enough. Science shows that static plans cannot
            survive a dynamic life.
          </motion.p>

          {/* Mobile condensed text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base text-muted-foreground md:hidden"
          >
            Static plans can't survive dynamic lives. Here's what science says:
          </motion.p>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {scienceCards.map((card, index) => (
            <ScienceCard key={card.title} card={card} index={index} />
          ))}
        </div>

        {/* Mobile: Carousel */}
        <div className="md:hidden mb-8">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {scienceCards.map((card, index) => (
                <CarouselItem key={card.title} className="pl-2 basis-[85%]">
                  <ScienceCard card={card} index={index} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mt-6">
            {scienceCards.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  current === index
                    ? "bg-foreground w-6"
                    : "bg-foreground/30"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="text-base md:text-xl font-semibold text-foreground">
            The Verdict: You don't need a better calendar. You need an
            intelligent companion who adapts when things go wrong.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
