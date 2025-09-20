import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BookOpen, Users, Trophy, Sparkles, Globe, Zap } from "lucide-react";
import logo from "../assets/logo.png";

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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-16 lg:py-24">
        {/* Clean Hero Section */}
        <div className="text-center mb-20 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <img 
              src={logo} 
              alt="Duelingo Logo" 
              className="h-24 w-24 md:h-32 md:w-32 lg:h-40 lg:w-40 mr-4"
            />
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight">
              Duelingo
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Learn languages through interactive battles. Combine words, compete with friends, 
            and master vocabulary in an engaging way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => navigate('/login')}
              variant="default"
              className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              className="text-lg px-8 py-4 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Clean Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-8 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 rounded-lg"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Clean Call to Action */}
        <div className="text-center bg-gray-50 rounded-2xl p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Ready to start learning?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of learners improving their language skills through interactive battles.
          </p>
          <Button 
            onClick={() => navigate('/login')}
            className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Get Started Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;