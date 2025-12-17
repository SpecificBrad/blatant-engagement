import { MapPin, Heart, Users } from "lucide-react";

export const About = () => {
  return (
    <section id="about" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
              Built by Newfoundlanders,{" "}
              <span className="text-gradient">for Newfoundlanders</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Blatant Engagement isn't just another web agency. We're your neighbours, 
              deeply rooted in the Newfoundland and Labrador community. We understand 
              the unique challenges and opportunities of doing business in our province.
            </p>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Our hyperlocal approach means your website isn't just technically sound—it 
              speaks directly to your local customers in a way that resonates. From Corner 
              Brook to St. John's, we help businesses establish genuine connections online.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground mb-1">Local Expertise</h3>
                  <p className="text-muted-foreground">We know the NL market inside and out</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground mb-1">Passionate Support</h3>
                  <p className="text-muted-foreground">We're invested in your success</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground mb-1">Community First</h3>
                  <p className="text-muted-foreground">Supporting local businesses is our mission</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-ocean overflow-hidden relative shadow-elevated">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-8">
                  <p className="font-display text-6xl md:text-8xl font-bold text-primary-foreground/20 mb-4">
                    NL
                  </p>
                  <p className="text-primary-foreground text-xl md:text-2xl font-display font-semibold">
                    Hyperlocal Focus
                  </p>
                  <p className="text-primary-foreground/70 mt-2">
                    Serving Newfoundland & Labrador
                  </p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-8 right-8 w-20 h-20 border-2 border-primary-foreground/20 rounded-full" />
              <div className="absolute bottom-12 left-8 w-12 h-12 bg-accent/30 rounded-lg rotate-12" />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-2xl shadow-card border border-border">
              <p className="font-display text-2xl font-bold text-foreground">Since 2020</p>
              <p className="text-muted-foreground text-sm">Helping local businesses thrive</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
