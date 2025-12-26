import { motion } from "framer-motion";
import { Brain, HeartCrack, Zap } from "lucide-react";

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

export function ProblemSection() {
  return (
    <section id="science" className="section-padding bg-problem/50 rounded-3xl mx-4 md:mx-8 lg:mx-16">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-16">
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
            Why do 92% of plans end up in the dustbin halfway through?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="body-large text-muted-foreground"
          >
            We've all heard the quote:{" "}
            <em>"If you fail to plan, you plan to fail."</em> But what if you{" "}
            <strong>did</strong> plan?
            <br />
            <br />
            Willpower isn't enough. Science shows that static plans cannot
            survive a dynamic life.
          </motion.p>
        </div>

        {/* Science Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {scienceCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className="card-elevated p-6 lg:p-8"
            >
              <div
                className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6`}
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
          ))}
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <p className="text-lg md:text-xl font-semibold text-foreground">
            The Verdict: You don't need a better calendar. You need an
            intelligent companion who adapts when things go wrong.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
