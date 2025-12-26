import { motion } from "framer-motion";

// Featured logos - using text for now, can be replaced with actual logos
const featuredIn = [
  { name: "TechCrunch", style: "font-bold text-lg md:text-xl" },
  { name: "Product Hunt", style: "font-bold text-lg md:text-xl" },
  { name: "Forbes", style: "font-bold italic text-lg md:text-xl" },
  { name: "The Verge", style: "font-bold text-lg md:text-xl" },
];

export function StatsSection() {
  return (
    <section className="py-12 md:py-16 border-b border-border bg-muted/30">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">
            As featured in
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16">
            {featuredIn.map((brand, index) => (
              <motion.div
                key={brand.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                className="opacity-40 hover:opacity-70 transition-opacity"
              >
                <span className={`${brand.style} text-foreground`}>
                  {brand.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
