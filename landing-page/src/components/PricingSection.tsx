import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mic, RefreshCw, MessageCircle, GraduationCap, Sparkles, Zap, BookOpen } from "lucide-react";

const plans = [
  {
    name: "Starter",
    badge: "Getting Started",
    price: "$0",
    period: "/mo",
    tagline: "Perfect for trying it out",
    features: [
      { icon: MessageCircle, text: "Text-based AI coaching" },
      { icon: Zap, text: "10 messages per day" },
      { icon: RefreshCw, text: "Basic goal tracking" },
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
    highlight: "🗣️ Human-Voice Mode",
    features: [
      { icon: Mic, text: "Voice Mode — feels like a real call", highlight: true },
      { icon: RefreshCw, text: "Crisis re-routing when life happens" },
      { icon: Sparkles, text: "Unlimited messages" },
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
    highlight: "🎓 Half price, full power",
    features: [
      { icon: Mic, text: "Voice Mode included" },
      { icon: BookOpen, text: "Academic Mentor Coach" },
      { icon: Sparkles, text: "Unlimited messages" },
    ],
    buttonText: "Unlock Discount",
    buttonVariant: "secondary" as const,
    highlighted: false,
    icon: GraduationCap,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="section-padding bg-muted/30">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="heading-section text-foreground mb-4">
            Invest in Your Future Self.
          </h2>
          <p className="body-large text-muted-foreground">
            Simple pricing. No hidden fees.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className={`relative rounded-3xl p-6 lg:p-8 ${
                plan.highlighted
                  ? "bg-card shadow-hover ring-2 ring-primary/20 scale-105"
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
                  <h3 className="text-xl font-bold text-foreground">
                    {plan.name}
                  </h3>
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <p className="text-sm text-muted-foreground">
                  {plan.tagline}
                </p>

                {plan.highlight && (
                  <p className="text-sm font-semibold text-primary mt-2">
                    {plan.highlight}
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      feature.highlight ? "bg-primary/10" : "bg-secondary"
                    }`}>
                      <feature.icon className={`w-4 h-4 ${
                        feature.highlight ? "text-primary" : "text-foreground/70"
                      }`} />
                    </div>
                    <span className={`text-sm ${
                      feature.highlight ? "font-medium text-foreground" : "text-foreground/80"
                    }`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.buttonVariant}
                size="lg"
                className="w-full"
              >
                {plan.buttonText}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
