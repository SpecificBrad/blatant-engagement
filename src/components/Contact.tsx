import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

export const Contact = () => {
  return (
    <section id="contact" className="py-20 md:py-32 bg-ocean relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Elevate Your Web Presence?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto">
            Let's discuss how we can help your business stand out online. 
            Book a free consultation—no pressure, just honest advice.
          </p>

          {/* Contact Options */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            <a
              href="mailto:hello@blatantengagement.ca"
              className="group p-6 bg-primary-foreground/10 rounded-2xl hover:bg-primary-foreground/15 transition-colors"
            >
              <Mail className="w-8 h-8 text-accent mx-auto mb-3" />
              <p className="text-primary-foreground font-semibold">Email Us</p>
              <p className="text-primary-foreground/70 text-sm">hello@blatantengagement.ca</p>
            </a>
            <a
              href="tel:+17095551234"
              className="group p-6 bg-primary-foreground/10 rounded-2xl hover:bg-primary-foreground/15 transition-colors"
            >
              <Phone className="w-8 h-8 text-accent mx-auto mb-3" />
              <p className="text-primary-foreground font-semibold">Call Us</p>
              <p className="text-primary-foreground/70 text-sm">(709) 555-1234</p>
            </a>
            <div className="p-6 bg-primary-foreground/10 rounded-2xl">
              <MapPin className="w-8 h-8 text-accent mx-auto mb-3" />
              <p className="text-primary-foreground font-semibold">Location</p>
              <p className="text-primary-foreground/70 text-sm">St. John's, NL</p>
            </div>
          </div>

          {/* CTA Button */}
          <Button variant="accent" size="lg" className="text-lg">
            Book Your Free Consultation
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
