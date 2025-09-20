import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, Trophy, Sparkles, Globe, Zap } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Learn by Playing",
      description: "Master vocabulary through interactive battles",
      gradient: "from-primary to-secondary"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Battle Friends",
      description: "Compete in real-time language challenges",
      gradient: "from-secondary to-accent"
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Earn Rewards",
      description: "Win battles and unlock new words",
      gradient: "from-battle to-warning"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Create Stories",
      description: "Watch your words come alive in stories",
      gradient: "from-accent to-primary"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Infinite Craft",
      description: "Combine words to discover new vocabulary",
      gradient: "from-warning to-success"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Quick Battles",
      description: "60-second language duels",
      gradient: "from-success to-battle"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-float" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-secondary/20 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-accent/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 right-1/3 w-24 h-24 bg-battle/20 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-slide-up">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
            Duelingo
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Learn languages through epic battles! Combine words like magic, 
            compete with friends, and master element combinations in the most fun way possible.
          </p>
          <Button 
            onClick={() => navigate('/login')}
            className="btn-hero text-lg px-12 py-6 animate-pulse-glow"
          >
            Start Your Adventure
          </Button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`
                card-float p-8 bg-white/10 backdrop-blur-sm border-white/20 
                hover:bg-white/20 group cursor-pointer transition-all duration-500
                ${hoveredCard === index ? 'scale-105 shadow-glow' : ''}
              `}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`
                w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} 
                flex items-center justify-center mb-4 text-white
                group-hover:scale-110 transition-transform duration-300
              `}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-white/80 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-white/90 text-lg mb-6">
            Ready to revolutionize how you learn languages?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/login')}
              className="btn-learning"
            >
              Join the Battle
            </Button>
            <Button 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;