import { motion } from "framer-motion";
import { Users, Star, TrendingUp } from "lucide-react";

const stats = [
  { value: "10K+", label: "Active Users", icon: Users },
  { value: "4.9", label: "App Rating", icon: Star },
  { value: "92%", label: "Goals Achieved", icon: TrendingUp },
];

export function TrustStats() {
  return (
    <section className="section-padding bg-muted/20">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="heading-section text-foreground mb-4">
            Trusted by Goal-Getters
          </h2>
          <p className="body-large text-muted-foreground max-w-2xl mx-auto">
            Real people. Real goals. Real results.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-6 md:gap-12 max-w-3xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className="text-center"
            >
              <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-foreground" />
              </div>
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm md:text-base text-muted-foreground">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
