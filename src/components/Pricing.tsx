import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const packages = [
  {
    name: "Essential",
    price: "1,000",
    description: "Perfect for businesses just getting started online",
    features: [
      "Up to 5 pages",
      "Mobile-responsive design",
      "Contact form",
      "Google Maps integration",
      "Basic SEO setup",
      "SSL certificate",
      "1 month of support",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "2,500",
    description: "For businesses needing dynamic functionality",
    features: [
      "Up to 10 pages",
      "Everything in Essential",
      "Database integration",
      "Custom forms & submissions",
      "Admin dashboard",
      "Advanced SEO optimization",
      "3 months of support",
      "Analytics setup",
    ],
    popular: true,
  },
];

export const Pricing = () => {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-foam">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            No hidden fees, no surprises. Choose the package that fits your business needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative p-8 md:p-10 rounded-3xl transition-all duration-300 ${
                pkg.popular
                  ? "bg-ocean text-primary-foreground shadow-elevated scale-[1.02]"
                  : "bg-card border border-border hover:shadow-card"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className={`font-display text-2xl font-bold mb-2 ${pkg.popular ? "text-primary-foreground" : "text-foreground"}`}>
                  {pkg.name}
                </h3>
                <p className={`text-sm ${pkg.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {pkg.description}
                </p>
              </div>

              <div className="mb-8">
                <span className={`font-display text-5xl font-bold ${pkg.popular ? "text-primary-foreground" : "text-foreground"}`}>
                  ${pkg.price}
                </span>
                <span className={`text-sm ${pkg.popular ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {" "}CAD
                </span>
              </div>

              <ul className="space-y-4 mb-10">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${pkg.popular ? "text-accent" : "text-primary"}`} />
                    <span className={pkg.popular ? "text-primary-foreground/90" : "text-foreground"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={pkg.popular ? "accent" : "hero"}
                size="lg"
                className="w-full"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Custom Project Note */}
        <p className="text-center text-muted-foreground mt-12 max-w-2xl mx-auto">
          Need something more customized? We offer tailored solutions for larger projects. 
          <a href="#contact" className="text-primary hover:underline ml-1">
            Let's talk about your requirements.
          </a>
        </p>
      </div>
    </section>
  );
};
