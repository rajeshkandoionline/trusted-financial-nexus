import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  MessageCircle,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    message: ""
  });

  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic would go here
    toast({
      title: "Message Sent Successfully!",
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      service: "",
      message: ""
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      details: ["+91 98765 43210", "+91 87654 32109"],
      action: "Call Us"
    },
    {
      icon: Mail,
      title: "Email", 
      details: ["contact@caassociates.com", "info@caassociates.com"],
      action: "Email Us"
    },
    {
      icon: MapPin,
      title: "Office Address",
      details: [
        "123 Business District,", 
        "MG Road, Bangalore - 560001",
        "Karnataka, India"
      ],
      action: "Get Directions"
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: [
        "Monday - Friday: 9:00 AM - 7:00 PM",
        "Saturday: 10:00 AM - 4:00 PM", 
        "Sunday: Closed"
      ],
      action: null
    }
  ];

  return (
    <section id="contact" className="py-20 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get In Touch With Us
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ready to streamline your finances? Contact us for a free consultation 
            and discover how we can help your business thrive.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-7">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Send Us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name *
                      </label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number *
                      </label>
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Company/Business Name
                      </label>
                      <Input
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Your company name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Service Interest
                    </label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background"
                    >
                      <option value="">Select a service</option>
                      <option value="taxation">Taxation Services</option>
                      <option value="audit">Audit & Assurance</option>
                      <option value="gst">GST Compliance</option>
                      <option value="registration">Business Registration</option>
                      <option value="consulting">Financial Consulting</option>
                      <option value="bookkeeping">Bookkeeping & Accounting</option>
                      <option value="advisory">Business Advisory</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Please describe your requirements or questions..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full group">
                    Send Message
                    <Send className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="lg:col-span-5 space-y-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <Card key={index} className="hover:shadow-soft transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-foreground mb-2">{info.title}</h3>
                        <div className="space-y-1">
                          {info.details.map((detail, detailIndex) => (
                            <p key={detailIndex} className="text-muted-foreground text-sm">
                              {detail}
                            </p>
                          ))}
                        </div>
                        {info.action && (
                          <Button variant="outline" size="sm" className="mt-3">
                            {info.action}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Quick Actions */}
            <Card className="bg-gradient-hero text-white">
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <h3 className="text-xl font-semibold mb-2">
                  Free Consultation Available
                </h3>
                <p className="text-white/90 mb-4 text-sm">
                  Schedule a complimentary 30-minute consultation to discuss your business needs.
                </p>
                <Button variant="secondary" size="sm">
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="mt-16">
          <Card className="overflow-hidden">
            <div className="h-64 bg-muted flex items-center justify-center border border-border rounded-lg">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Interactive Google Map</p>
                <p className="text-sm text-muted-foreground">123 Business District, MG Road, Bangalore</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;