import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-surface" />
      <div 
        className="absolute top-0 right-0 w-1/2 h-full opacity-30"
        style={{ background: "var(--gradient-glow)" }}
      />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-up">
            <MapPin className="w-4 h-4" />
            <span>Proudly serving Newfoundland & Labrador</span>
          </div>
          
          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-foreground leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Your Business Deserves a{" "}
            <span className="text-gradient">Hyperlocal</span>{" "}
            Web Presence
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            We build stunning, conversion-focused websites for small to medium businesses. 
            Whether you're starting fresh, upgrading from an old site, or moving beyond 
            a Google Business listing—we've got you covered.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="lg">
              View Our Packages
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg">
              Book a Free Consultation
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-border animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex flex-wrap gap-8 md:gap-16">
              <div>
                <p className="text-3xl md:text-4xl font-display font-bold text-foreground">50+</p>
                <p className="text-muted-foreground">Local Businesses</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-display font-bold text-foreground">100%</p>
                <p className="text-muted-foreground">Satisfaction Rate</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-display font-bold text-foreground">5★</p>
                <p className="text-muted-foreground">Google Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
