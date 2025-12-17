import { Globe, RefreshCw, TrendingUp, Palette, Zap, Shield } from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "New Website Creation",
    description: "Starting from scratch? We'll build you a beautiful, modern website that captures your brand and converts visitors into customers.",
  },
  {
    icon: RefreshCw,
    title: "Website Upgrades",
    description: "Outdated site holding you back? We'll transform your old web presence into a sleek, mobile-responsive powerhouse.",
  },
  {
    icon: TrendingUp,
    title: "Beyond Google Business",
    description: "Ready to graduate from just a Google listing? Get a professional website that establishes real credibility.",
  },
  {
    icon: Palette,
    title: "Custom Design",
    description: "Every business is unique. We create bespoke designs that reflect your brand personality and stand out locally.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Speed matters for SEO and conversions. Our sites are optimized for performance on every device.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "SSL certificates, regular backups, and enterprise-grade security come standard with every package.",
  },
];

export const Services = () => {
  return (
    <section id="services" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            What We Do
          </h2>
          <p className="text-lg text-muted-foreground">
            Specialized web solutions tailored for Newfoundland businesses. 
            We understand the local market and build sites that connect with your community.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group p-6 md:p-8 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                <service.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {service.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
