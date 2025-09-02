import { Button } from "@/components/ui/button";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  ArrowUp
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    services: [
      { name: "Taxation Services", href: "#services" },
      { name: "Audit & Assurance", href: "#services" },
      { name: "GST Compliance", href: "#services" },
      { name: "Business Registration", href: "#services" },
      { name: "Financial Consulting", href: "#services" },
      { name: "Bookkeeping & Accounting", href: "#services" }
    ],
    quickLinks: [
      { name: "About Us", href: "#about" },
      { name: "Our Services", href: "#services" },
      { name: "Client Testimonials", href: "#testimonials" },
      { name: "Contact Us", href: "#contact" },
      { name: "Blog & Insights", href: "#blog" },
      { name: "Career Opportunities", href: "#careers" }
    ],
    resources: [
      { name: "Tax Calculator", href: "#" },
      { name: "GST Rate Finder", href: "#" },
      { name: "Compliance Calendar", href: "#" },
      { name: "Download Forms", href: "#" },
      { name: "FAQ", href: "#" },
      { name: "Financial Guides", href: "#" }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" }
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-4">
            <h3 className="text-2xl font-bold mb-4">CA Associates</h3>
            <p className="text-primary-foreground/80 mb-6 leading-relaxed">
              Your trusted partner in financial growth and compliance. 
              We provide comprehensive chartered accounting services 
              to help businesses thrive in today's competitive landscape.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="text-sm">+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="text-sm">contact@caassociates.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-sm">123 Business District, MG Road, Bangalore - 560001</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Services Links */}
          <div className="lg:col-span-3">
            <h4 className="text-lg font-semibold mb-4">Our Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-accent transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-accent transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="lg:col-span-3">
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-3 mb-6">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-accent transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
            
            <div className="bg-primary-foreground/10 rounded-lg p-4">
              <h5 className="font-medium mb-2">Stay Updated</h5>
              <p className="text-sm text-primary-foreground/80 mb-3">
                Get the latest tax updates and financial tips.
              </p>
              <Button variant="secondary" size="sm" className="w-full">
                Subscribe to Newsletter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-primary-foreground/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-primary-foreground/80 mb-4 md:mb-0">
              © {currentYear} CA Associates. All rights reserved. | 
              <a href="#" className="hover:text-accent ml-1">Privacy Policy</a> | 
              <a href="#" className="hover:text-accent ml-1">Terms of Service</a>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollToTop}
              className="text-primary-foreground/80 hover:text-accent"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Back to Top
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;