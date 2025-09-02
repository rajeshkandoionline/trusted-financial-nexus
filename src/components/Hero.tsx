import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Users, Award, TrendingUp } from "lucide-react";
import heroImage from "@/assets/ca-hero-image.jpg";

const Hero = () => {
  const stats = [
    { icon: Users, label: "Happy Clients", value: "500+" },
    { icon: Award, label: "Years Experience", value: "15+" },
    { icon: TrendingUp, label: "Success Rate", value: "98%" },
  ];

  return (
    <section id="home" className="relative pt-16 lg:pt-20 pb-16 bg-gradient-subtle overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="lg:col-span-6 mb-12 lg:mb-0">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Your Trusted Partner in{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  Financial Growth
                </span>{" "}
                and Compliance
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Expert chartered accounting services for businesses of all sizes. 
                From taxation to business advisory, we ensure your financial success 
                with integrity and professionalism.
              </p>

              {/* Key Benefits */}
              <div className="mb-8 space-y-3">
                {[
                  "GST & Income Tax Compliance",
                  "Business Registration & Startup Support",
                  "Financial Consulting & Planning"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-foreground font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="group">
                  Request Free Consultation
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg">
                  Learn More About Us
                </Button>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="lg:col-span-6">
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-strong">
                <img
                  src={heroImage}
                  alt="Professional chartered accountants consulting with clients"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating Stats Card */}
              <div className="absolute -bottom-6 left-6 right-6 bg-white rounded-xl shadow-medium p-6 border border-border">
                <div className="grid grid-cols-3 gap-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="text-center">
                        <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;