export const Footer = () => {
  return (
    <footer className="py-12 bg-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold">B</span>
            </div>
            <span className="font-display font-bold text-background">
              Blatant<span className="text-primary">Engagement</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="#services" className="text-muted hover:text-background transition-colors">
              Services
            </a>
            <a href="#pricing" className="text-muted hover:text-background transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-muted hover:text-background transition-colors">
              About
            </a>
            <a href="#contact" className="text-muted hover:text-background transition-colors">
              Contact
            </a>
          </div>

          {/* Copyright */}
          <p className="text-muted text-sm">
            © {new Date().getFullYear()} Blatant Engagement. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
