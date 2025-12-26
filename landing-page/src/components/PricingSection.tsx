import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Mic,
  RefreshCw,
  MessageCircle,
  GraduationCap,
  Sparkles,
  Zap,
  BookOpen,
  LucideIcon,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface PlanFeature {
  icon: LucideIcon;
  text: string;
  highlight: boolean;
}

interface Plan {
  name: string;
  badge: string;
  price: string;
  period: string;
  tagline: string;
  highlight?: string;
  features: PlanFeature[];
  buttonText: string;
  buttonVariant: "outline" | "cta" | "secondary";
  highlighted: boolean;
  icon?: LucideIcon;
}

const plans: Plan[] = [
  {
    name: "Starter",
    badge: "Getting Started",
    price: "$0",
    period: "/mo",
    tagline: "Perfect for trying it out",
    features: [
      { icon: MessageCircle, text: "Text-based AI coaching", highlight: false },
      { icon: Zap, text: "10 messages per day", highlight: false },
      { icon: RefreshCw, text: "Basic goal tracking", highlight: false },
    ],
    buttonText: "Start Free",
    buttonVariant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Premium",
    badge: "BEST VALUE",
    price: "$19.99",
    period: "/mo",
    tagline: "Talk to your coach naturally",
    highlight: "Human-Voice Mode",
    features: [
      {
        icon: Mic,
        text: "Voice Mode — feels like a real call",
        highlight: true,
      },
      {
        icon: RefreshCw,
        text: "Crisis re-routing when life happens",
        highlight: false,
      },
      { icon: Sparkles, text: "Unlimited messages", highlight: false },
    ],
    buttonText: "Go Premium",
    buttonVariant: "cta" as const,
    highlighted: true,
  },
  {
    name: "Student",
    badge: "50% OFF",
    price: "$9.99",
    period: "/mo",
    tagline: "With .edu email verification",
    highlight: "Half price, full power",
    features: [
      { icon: Mic, text: "Voice Mode included", highlight: false },
      { icon: BookOpen, text: "Academic Mentor Coach", highlight: false },
      { icon: Sparkles, text: "Unlimited messages", highlight: false },
    ],
    buttonText: "Unlock Discount",
    buttonVariant: "secondary" as const,
    highlighted: false,
    icon: GraduationCap,
  },
];

// Pricing Card Component
function PricingCard({
  plan,
  index,
  isMobile = false,
}: {
  plan: Plan;
  index: number;
  isMobile?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: isMobile ? 0 : 0.1 * index }}
      className={`relative rounded-3xl p-6 lg:p-8 h-full ${
        plan.highlighted
          ? "bg-card shadow-hover ring-2 ring-primary/20 md:scale-105"
          : "card-elevated"
      }`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        {!plan.highlighted && (
          <span className="inline-block text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full mb-3 font-medium">
            {plan.badge}
          </span>
        )}

        <div className="flex items-center gap-2 mb-2">
          {plan.icon && <plan.icon className="w-5 h-5 text-foreground" />}
          <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
        </div>

        <div className="flex items-baseline gap-1 mb-2">
          <span
            className={`font-bold text-foreground ${
              plan.highlighted ? "text-5xl" : "text-4xl"
            }`}
          >
            {plan.price}
          </span>
          <span className="text-muted-foreground">{plan.period}</span>
        </div>

        <p className="text-sm text-muted-foreground">{plan.tagline}</p>

        {plan.highlight && (
          <p className="text-sm font-semibold text-primary mt-2 flex items-center gap-1">
            {plan.name === "Premium" ? "🗣️" : "🎓"} {plan.highlight}
          </p>
        )}
      </div>

      <ul className="space-y-3 md:space-y-4 mb-6 md:mb-8">
        {plan.features.map((feature) => (
          <li key={feature.text} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                feature.highlight ? "bg-primary/10" : "bg-secondary"
              }`}
            >
              <feature.icon
                className={`w-4 h-4 ${
                  feature.highlight ? "text-primary" : "text-foreground/70"
                }`}
              />
            </div>
            <span
              className={`text-sm ${
                feature.highlight
                  ? "font-medium text-foreground"
                  : "text-foreground/80"
              }`}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Button variant={plan.buttonVariant} size="lg" className="w-full">
        {plan.buttonText}
      </Button>
    </motion.div>
  );
}

export function PricingSection() {
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

  // Reorder plans for mobile: Premium first (best value)
  const mobilePlans = [plans[1], plans[0], plans[2]];

  return (
    <section id="pricing" className="section-padding bg-muted/30">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12 md:mb-16"
        >
          <h2 className="heading-section text-foreground mb-4">
            Invest in Your Future Self.
          </h2>
          <p className="body-large text-muted-foreground hidden md:block">
            Simple pricing. No hidden fees.
          </p>
          <p className="text-base text-muted-foreground md:hidden">
            Simple pricing. No hidden fees.
          </p>
        </motion.div>

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </div>

        {/* Mobile: Carousel starting with Premium */}
        <div className="md:hidden pt-4">
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              startIndex: 0, // Start with Premium (first in mobilePlans)
              loop: false,
            }}
            className="w-full overflow-visible "
          >
            <CarouselContent className="-ml-2 overflow-visible py-5 pl-2">
              {mobilePlans.map((plan, index) => (
                <CarouselItem
                  key={plan.name}
                  className="pl-2 basis-[85%] overflow-visible"
                >
                  <PricingCard plan={plan} index={index} isMobile />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mt-6">
            {mobilePlans.map((plan, index) => (
              <button
                key={plan.name}
                onClick={() => api?.scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  current === index
                    ? "bg-foreground w-6"
                    : "bg-foreground/30 w-2"
                }`}
                aria-label={`Go to ${plan.name} plan`}
              />
            ))}
          </div>

          {/* Swipe hint */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            Swipe to compare plans
          </p>
        </div>
      </div>
    </section>
  );
}
