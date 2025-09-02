import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Rohan Mehta",
      company: "TechStart Solutions",
      position: "CEO & Founder",
      content: "CA Associates transformed our financial management. Their expertise in startup compliance and GST helped us save significant costs and avoid penalties. Highly recommended for any growing business.",
      rating: 5,
      businessType: "Technology Startup"
    },
    {
      name: "Sanjana Gupta", 
      company: "Gupta Textiles Pvt Ltd",
      position: "Managing Director",
      content: "We've been working with CA Associates for over 5 years. Their audit services and tax planning strategies have been instrumental in our business growth. Professional, reliable, and always available when needed.",
      rating: 5,
      businessType: "Manufacturing"
    },
    {
      name: "Dr. Vikash Singh",
      company: "City Medical Centre",
      position: "Director",
      content: "As a healthcare provider, compliance is critical for us. CA Associates ensures we meet all regulatory requirements while optimizing our tax structure. Their attention to detail is remarkable.",
      rating: 5,
      businessType: "Healthcare"
    },
    {
      name: "Anjali Sharma",
      company: "Sharma Retail Chain",
      position: "Business Owner",
      content: "From business registration to ongoing bookkeeping, CA Associates has been our financial backbone. They explain complex tax matters in simple terms and always provide practical solutions.",
      rating: 5,
      businessType: "Retail"
    },
    {
      name: "Karan Joshi",
      company: "BuildCorp Engineering",
      position: "Finance Head",
      content: "Their financial advisory services helped us secure funding for our expansion. The team's deep understanding of construction industry finances made a significant difference to our growth plans.",
      rating: 5,
      businessType: "Construction"
    },
    {
      name: "Meera Patel",
      company: "FreshFarm Organics",
      position: "Co-founder",
      content: "Starting an organic food business seemed overwhelming until we met CA Associates. They guided us through every compliance requirement and helped set up efficient accounting systems from day one.",
      rating: 5,
      businessType: "Agriculture/Food"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-accent fill-current" : "text-muted-foreground"
        }`}
      />
    ));
  };

  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What Our Clients Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Trusted by businesses across industries for our expertise, 
            reliability, and commitment to their financial success.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative hover:shadow-medium transition-all duration-300 border-border hover:border-primary/20">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="absolute top-4 right-4">
                  <Quote className="h-6 w-6 text-primary/20" />
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(testimonial.rating)}
                </div>

                {/* Content */}
                <blockquote className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </blockquote>

                {/* Client Info */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-primary font-medium">{testimonial.position}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {testimonial.businessType}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-subtle rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Ready to Join Our Success Stories?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Let us help your business achieve financial excellence and compliance. 
              Schedule a free consultation to discuss your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-hero text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                Schedule Free Consultation
              </button>
              <button className="border border-primary text-primary px-8 py-3 rounded-lg font-medium hover:bg-primary hover:text-white transition-colors">
                View All Services
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;