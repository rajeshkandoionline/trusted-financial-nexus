import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, BookOpen, Users, Target } from "lucide-react";

const About = () => {
  const teamMembers = [
    {
      name: "CA Rajesh Sharma",
      position: "Founding Partner & Senior Consultant",
      qualifications: ["Chartered Accountant", "Cost Accountant", "15+ Years Experience"],
      expertise: ["Taxation", "Audit & Assurance", "Business Advisory"],
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "CA Priya Patel", 
      position: "Tax & Compliance Specialist",
      qualifications: ["Chartered Accountant", "LLB", "12+ Years Experience"],
      expertise: ["GST Compliance", "Income Tax", "Corporate Law"],
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face"
    },
    {
      name: "CA Amit Kumar",
      position: "Financial Advisory Head", 
      qualifications: ["Chartered Accountant", "MBA Finance", "10+ Years Experience"],
      expertise: ["Financial Planning", "Investment Advisory", "Business Valuation"],
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
    }
  ];

  const values = [
    {
      icon: Award,
      title: "Excellence",
      description: "Committed to delivering the highest quality of professional services with precision and expertise."
    },
    {
      icon: Users,
      title: "Client-Centric",
      description: "Building long-term relationships through personalized service and understanding client needs."
    },
    {
      icon: BookOpen,
      title: "Integrity", 
      description: "Maintaining the highest ethical standards in all our professional dealings and advice."
    },
    {
      icon: Target,
      title: "Innovation",
      description: "Leveraging modern technology and methodologies to provide efficient and effective solutions."
    }
  ];

  return (
    <section id="about" className="py-20 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Company Introduction */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            About CA Associates
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Established in 2008, CA Associates has been a trusted partner for businesses 
              across various industries, providing comprehensive accounting and financial services. 
              Our team of experienced chartered accountants combines traditional expertise 
              with modern technology to deliver exceptional results.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We specialize in helping businesses navigate complex financial regulations, 
              optimize their tax strategies, and achieve sustainable growth through sound 
              financial planning and compliance management.
            </p>
          </div>
        </div>

        {/* Mission & Values */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Our Core Values
            </h3>
            <p className="text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">{value.title}</h4>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Section */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Meet Our Expert Team
            </h3>
            <p className="text-muted-foreground">
              Experienced professionals dedicated to your financial success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-medium transition-all duration-300">
                <CardContent className="p-6">
                  <div className="relative mb-4">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-primary/10"
                    />
                  </div>
                  
                  <h4 className="text-xl font-semibold text-foreground mb-1">{member.name}</h4>
                  <p className="text-primary font-medium mb-4">{member.position}</p>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 justify-center mb-3">
                      {member.qualifications.map((qual, qualIndex) => (
                        <Badge key={qualIndex} variant="secondary" className="text-xs">
                          {qual}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <strong>Expertise:</strong>
                      <div className="mt-1">
                        {member.expertise.join(" • ")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;