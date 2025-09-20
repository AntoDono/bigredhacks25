import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Eye, Copy, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Profile from "@/components/Profile";

const Home = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 5).toUpperCase() + 
                 "-" + 
                 Math.random().toString(36).substring(2, 5).toUpperCase();
    setGeneratedCode(code);
    toast.success("Room created! Joining room...");
    // Navigate directly to battle page - room lobby will show there
    navigate(`/battle/${code}`);
  };

  const joinRoom = () => {
    if (roomCode.length < 7) {
      toast.error("Please enter a valid room code (XXX-XXX)");
      return;
    }
    navigate(`/battle/${roomCode}`);
  };

  const spectateRoom = () => {
    if (roomCode.length < 7) {
      toast.error("Please enter a valid room code (XXX-XXX)");
      return;
    }
    navigate(`/spectate/${roomCode}`);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Room code copied to clipboard!");
  };

  const startBattle = () => {
    navigate(`/battle/${generatedCode}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-white/80 text-lg">Ready for a language battle?</p>
          </div>
          
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Actions Grid */}
          <div className="lg:col-span-2 space-y-8">
            {/* Create Room */}
            <Card className="card-battle hover:shadow-glow transition-all duration-300 animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  Create Room
                </CardTitle>
                <CardDescription className="text-base">
                  Start a new battle room and invite friends to join
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showCreateRoom ? (
                  <Button 
                    className="w-full btn-hero h-12"
                    onClick={generateRoomCode}
                  >
                    Generate Room Code
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Label className="text-sm font-medium text-muted-foreground">Your Room Code</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="room-code-input bg-muted rounded-lg p-4 flex-1">
                          {generatedCode}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyRoomCode}
                          className="h-14 w-14"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 btn-battle"
                        onClick={startBattle}
                      >
                        Start Battle
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowCreateRoom(false)}
                      >
                        New Code
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Join/Spectate Room */}
            <Card className="card-battle hover:shadow-glow transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-12 h-12 bg-gradient-battle rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  Join Battle
                </CardTitle>
                <CardDescription className="text-base">
                  Enter a room code to join or spectate a battle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="roomCode" className="text-sm font-medium mb-2 block">
                    Room Code
                  </Label>
                  <Input
                    id="roomCode"
                    placeholder="XXX-XXX"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="room-code-input h-12"
                    maxLength={7}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="btn-learning h-11"
                    onClick={joinRoom}
                    disabled={roomCode.length < 7}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Join
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={spectateRoom}
                    disabled={roomCode.length < 7}
                    className="h-11"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Spectate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Game Info */}
            <Card className="card-battle animate-slide-up bg-white/5 backdrop-blur-sm border-white/20" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-8">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold mb-4">How to Play Duelingo</h3>
                  <div className="grid md:grid-cols-3 gap-6 text-sm">
                    <div>
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">🎯</span>
                      </div>
                      <h4 className="font-semibold mb-2">Battle Objective</h4>
                      <p className="text-white/80">Race to create the target word using drag-and-drop combinations</p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">⏱️</span>
                      </div>
                      <h4 className="font-semibold mb-2">60 Second Timer</h4>
                      <p className="text-white/80">Quick battles test your vocabulary skills under pressure</p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">📖</span>
                      </div>
                      <h4 className="font-semibold mb-2">Learning Stories</h4>
                      <p className="text-white/80">Your creations become part of an epic adventure story</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Profile />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
