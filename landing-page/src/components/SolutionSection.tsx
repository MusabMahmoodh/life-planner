import { motion } from "framer-motion";
import { Heart, RefreshCw, Mic } from "lucide-react";
import { InteractiveChat } from "./InteractiveChat";

const features = [
  {
    icon: Heart,
    title: "Radical Empathy",
    description:
      "Most apps nag you. AchievaAI senses when you are overwhelmed and encourages you. It feels like talking to a mentor who actually cares.",
  },
  {
    icon: RefreshCw,
    title: "Dynamic Re-Routing",
    description:
      "Plan in the dustbin? No problem. Your coach instantly recalculates your path to success based on your current reality.",
  },
  {
    icon: Mic,
    title: "Voice-First Experience",
    description:
      "Don't just type—talk. Vent your frustrations, brainstorm ideas, and hear a human-like voice guide you back to clarity.",
    badge: "Premium",
  },
];

export function SolutionSection() {
  return (
    <section id="features" className="section-padding gradient-lavender">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="eyebrow">YOUR INTELLIGENT COMPANION</p>

            <h2 className="heading-section text-foreground mb-4">
              Always On.
              <br />
              Always On Your Side.
            </h2>

            <p className="body-large text-muted-foreground mb-8">
              AchievaAI isn't a tool. It's a relationship.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      {feature.badge && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          {feature.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - INTERACTIVE Demo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:pl-8"
          >
            <InteractiveChat />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
