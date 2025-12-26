import { motion } from "framer-motion";
import { GraduationCap, Briefcase, BookOpen, Sparkles } from "lucide-react";

const personas = [
  {
    icon: GraduationCap,
    title: "For Students",
    badge: "50% OFF FOR VERIFIED STUDENTS",
    struggle: "Procrastination and exam anxiety",
    fix: "A coach that breaks 100-page readings into bite-sized tasks and hypes you up before finals",
    color: "bg-secondary",
  },
  {
    icon: Briefcase,
    title: "For CEOs & Entrepreneurs",
    badge: null,
    struggle: "Decision fatigue and loneliness at the top",
    fix: "A 24/7 strategic partner to challenge your ideas and keep you accountable to the big picture",
    color: "bg-muted",
  },
  {
    icon: BookOpen,
    title: "For Teachers",
    badge: null,
    struggle: "Burnout and balancing admin with teaching",
    fix: "An empathetic ear to vent to after a hard class, helping you leave work at work",
    color: "bg-success",
  },
  {
    icon: Sparkles,
    title: "For Everyone Else",
    badge: null,
    struggle: null,
    fix: 'Just trying to be a better version of yourself? We are here to help you bridge the gap between "dreaming it" and "doing it."',
    color: "bg-secondary/50",
  },
];

export function PersonasSection() {
  return (
    <section id="personas" className="section-padding">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="heading-section text-foreground mb-4">
            Built for Humans.
            <br />
            Tailored for <em>You</em>.
          </h2>
          <p className="body-large text-muted-foreground">
            Whether you are leading a company or just trying to lead a better
            life, your AI coach changes its personality to match your needs.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {personas.map((persona, index) => (
            <motion.div
              key={persona.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className="card-elevated p-6 group hover:-translate-y-2 transition-transform duration-300"
            >
              <div
                className={`w-14 h-14 ${persona.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <persona.icon className="w-6 h-6 text-foreground" />
              </div>

              {persona.badge && (
                <span className="inline-block text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full mb-3 font-medium">
                  {persona.badge}
                </span>
              )}

              <h3 className="text-xl font-bold text-foreground mb-4">
                {persona.title}
              </h3>

              {persona.struggle && (
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    The Struggle
                  </p>
                  <p className="text-sm text-foreground">{persona.struggle}</p>
                </div>
              )}

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  {persona.struggle ? "The Fix" : "The Goal"}
                </p>
                <p className="text-sm text-foreground/80">{persona.fix}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
