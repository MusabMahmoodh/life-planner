import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const benefits = [
  "No credit card required",
  "Start chatting in 60 seconds",
  "50% off for students",
];

export function CtaSection() {
  return (
    <section className="section-padding gradient-lavender relative overflow-hidden">
      {/* Background decorative */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-success/20 rounded-full blur-3xl" />

      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Social proof number */}
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-primary mb-4"
          >
            Join 10,000+ people who stopped failing at their goals
          </motion.p>

          <h2 className="heading-section text-foreground mb-6">
            Start Your First Coaching
            <br />
            <span className="italic font-normal">Session Free</span>
          </h2>

          <p className="body-large text-muted-foreground mb-8 max-w-xl mx-auto">
            Your AI coach is waiting. Experience empathetic, adaptive planning that actually works.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button variant="cta" size="xl" className="btn-pulse">
              Get Your Free Coach
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg">
              See How It Works
            </Button>
          </div>

          {/* Benefits list */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-success-foreground" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
