import { motion } from "framer-motion";
import { Star } from "lucide-react";

export function TestimonialSection() {
  return (
    <section className="section-padding bg-muted/50">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 text-yellow-500 fill-yellow-500"
              />
            ))}
          </div>

          <blockquote className="text-2xl md:text-3xl lg:text-4xl font-medium text-foreground mb-8 leading-relaxed italic">
            "I used to quit my goals the moment I missed a day. AchievaAI taught
            me that missing a day isn't failure—it's just data. It got me back
            on track."
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            {/* Real avatar image */}
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
              alt="Maria, early user testimonial"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-secondary"
            />
            <div className="text-left">
              <p className="font-semibold text-foreground">Maria Rodriguez</p>
              <p className="text-sm text-muted-foreground">Marketing Director • Early User</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
