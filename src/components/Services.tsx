import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  FileCheck, 
  Building, 
  TrendingUp, 
  ClipboardList, 
  Users,
  ArrowRight
} from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Calculator,
      title: "Taxation Services",
      description: "Complete tax planning and compliance for direct and indirect taxes, GST returns, and tax optimization strategies.",
      features: ["Income Tax Returns", "GST Compliance", "Tax Planning", "Appeals & Assessments"]
    },
    {
      icon: FileCheck,
      title: "Audit & Assurance",
      description: "Comprehensive audit services ensuring compliance with regulatory requirements and financial transparency.",
      features: ["Statutory Audits", "Internal Audits", "Tax Audits", "Compliance Audits"]
    },
    {
      icon: Building,
      title: "Business Registration",
      description: "Complete support for business registrations, licenses, and startup compliance requirements.",
      features: ["Company Incorporation", "LLP Registration", "GST Registration", "Import-Export Licenses"]
    },
    {
      icon: TrendingUp,
      title: "Financial Consulting",
      description: "Strategic financial advisory services to help businesses grow and optimize their financial performance.",
      features: ["Financial Planning", "Investment Advisory", "Cash Flow Management", "Business Valuation"]
    },
    {
      icon: ClipboardList,
      title: "Bookkeeping & Accounting",
      description: "Professional bookkeeping services with accurate financial records and monthly reporting.",
      features: ["Monthly Bookkeeping", "Financial Statements", "Payroll Management", "Expense Tracking"]
    },
    {
      icon: Users,
      title: "Business Advisory",
      description: "Strategic business guidance to help entrepreneurs make informed decisions and achieve growth.",
      features: ["Business Planning", "Risk Assessment", "Growth Strategies", "Compliance Advisory"]
    }
  ];

  return (
    <section id="services" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Comprehensive Financial Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From tax compliance to strategic business advisory, we provide complete 
            financial solutions tailored to your business needs.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card key={index} className="group hover:shadow-medium transition-all duration-300 border-border hover:border-primary/20">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    {service.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="group/btn">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button size="lg">
            Schedule a Consultation
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;