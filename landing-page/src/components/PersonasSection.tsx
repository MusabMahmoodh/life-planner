import { motion } from "framer-motion";
import { GraduationCap, Briefcase, BookOpen, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const personas = [
  {
    icon: GraduationCap,
    title: "For Students",
    badge: "50% OFF",
    headline: "Beat procrastination. Ace your exams.",
    struggle: "Procrastination and exam anxiety",
    fix: "Breaks readings into bite-sized tasks. Hypes you up before finals.",
    color: "bg-secondary",
  },
  {
    icon: Briefcase,
    title: "For CEOs & Entrepreneurs",
    badge: null,
    headline: "Decision fatigue? Get a 24/7 thinking partner.",
    struggle: "Decision fatigue and loneliness at the top",
    fix: "24/7 strategic partner to challenge ideas and keep you accountable.",
    color: "bg-muted",
  },
  {
    icon: BookOpen,
    title: "For Teachers",
    badge: null,
    headline: "Leave work at work. Protect your peace.",
    struggle: "Burnout and balancing admin with teaching",
    fix: "Empathetic ear after hard classes. Leave work stress at work.",
    color: "bg-success",
  },
  {
    icon: Sparkles,
    title: "For Everyone Else",
    badge: null,
    headline: "Bridge the gap between dreaming and doing.",
    struggle: "Trying to be a better version of yourself?",
    fix: "We help you bridge the gap between dreaming it and doing it.",
    color: "bg-secondary/50",
  },
];

// Desktop Card Component - Fixed equal heights
function PersonaCard({ persona, index }: { persona: typeof personas[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 * index }}
      className="relative card-elevated p-6 group hover:-translate-y-2 transition-transform duration-300 h-full flex flex-col"
    >
      {/* Icon + Badge row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-14 h-14 ${persona.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}
        >
          <persona.icon className="w-6 h-6 text-foreground" />
        </div>

        {persona.badge && (
          <span className="text-[10px] bg-success text-success-foreground px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
            {persona.badge}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-foreground mb-4">
        {persona.title}
      </h3>

      {/* Content - flex-grow ensures equal heights */}
      <div className="flex-grow space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-medium">
            The Struggle
          </p>
          <p className="text-sm text-foreground leading-relaxed">{persona.struggle}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-medium">
            The Fix
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">{persona.fix}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function PersonasSection() {
  return (
    <section id="personas" className="section-padding">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12 md:mb-16"
        >
          <h2 className="heading-section text-foreground mb-4">
            Built for Humans.
            <br />
            Tailored for <em>You</em>.
          </h2>
          <p className="body-large text-muted-foreground hidden md:block">
            Whether you are leading a company or just trying to lead a better
            life, your AI coach changes its personality to match your needs.
          </p>
          <p className="text-base text-muted-foreground md:hidden">
            Your AI coach adapts to your unique needs.
          </p>
        </motion.div>

        {/* Desktop: Grid Layout with equal heights */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {personas.map((persona, index) => (
            <PersonaCard key={persona.title} persona={persona} index={index} />
          ))}
        </div>

        {/* Mobile: Accordion Layout */}
        <div className="md:hidden">
          <Accordion type="single" collapsible className="space-y-3">
            {personas.map((persona, index) => (
              <AccordionItem
                key={persona.title}
                value={`persona-${index}`}
                className="border-2 border-border rounded-2xl overflow-hidden bg-card data-[state=open]:shadow-lg transition-shadow"
              >
                <AccordionTrigger className="px-4 py-4 hover:no-underline">
                  <div className="flex items-center gap-4 w-full">
                    <div
                      className={`w-12 h-12 ${persona.color} rounded-xl flex items-center justify-center shrink-0`}
                    >
                      <persona.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground">
                          {persona.title}
                        </span>
                        {persona.badge && (
                          <span className="text-[10px] bg-success text-success-foreground px-2 py-0.5 rounded-full font-bold">
                            {persona.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {persona.headline}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="pt-2 border-t border-border space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-medium">
                        The Struggle
                      </p>
                      <p className="text-sm text-foreground">{persona.struggle}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-medium">
                        The Fix
                      </p>
                      <p className="text-sm text-foreground/80">{persona.fix}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
