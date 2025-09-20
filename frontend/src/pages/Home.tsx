import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Eye, Copy, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import Profile from "@/components/Profile";
import VocabularyDisplay from "@/components/VocabularyDisplay";
import logo from "../assets/logo.png";

const Home = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { connected, createRoom, currentRoom, checkRoomValidity } = useSocket();
  const [roomCode, setRoomCode] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isCheckingRoom, setIsCheckingRoom] = useState(false);

  // Available languages for TTS
  const languages = [
    { code: "en-US", name: "English (US)" },
    { code: "es-ES", name: "Spanish (Spain)" },
    { code: "fr-FR", name: "French" },
    { code: "de-DE", name: "German" },
    { code: "it-IT", name: "Italian" },
    { code: "pt-BR", name: "Portuguese (Brazil)" },
    { code: "ja-JP", name: "Japanese" },
    { code: "ko-KR", name: "Korean" },
    { code: "zh-CN", name: "Chinese (Mandarin)" }
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Handle room creation success
  useEffect(() => {
    if (currentRoom && isCreatingRoom) {
      setIsCreatingRoom(false);
      // Navigate to battle page with the created room using the generated code
      navigate(`/battle/${generatedCode}`, { 
        state: { 
          language: selectedLanguage, 
          isCreator: currentRoom.isLeader 
        } 
      });
    }
  }, [currentRoom, isCreatingRoom, navigate, selectedLanguage, generatedCode]);

  const generateRoomCode = () => {
    if (!connected) {
      toast.error("Not connected to game server. Please wait and try again.");
      return;
    }
    
    const code = Math.random().toString(36).substring(2, 5).toUpperCase() + 
                 "-" + 
                 Math.random().toString(36).substring(2, 5).toUpperCase();
    setGeneratedCode(code);
    setIsCreatingRoom(true);
    
    // Create room on server
    createRoom(
      code, 
      `Room ${code}`, 
      `Room ${code} description`, 
      selectedLanguage
    );
  };

  const joinRoom = async () => {
    if (roomCode.length < 7) {
      toast.error("Please enter a valid room code (XXX-XXX)");
      return;
    }

    setIsCheckingRoom(true);
    try {
      const result = await checkRoomValidity(roomCode);
      
      if (result.valid) {
        // Room is valid, navigate to battle page
        navigate(`/battle/${roomCode}`, { 
          state: { 
            language: result.room?.language || 'en-US',
            isCreator: false 
          } 
        });
      } else {
        // Room is not valid, show error
        toast.error(result.message || "Cannot join room");
      }
    } catch (error) {
      console.error('Error checking room:', error);
      toast.error("Failed to check room validity");
    } finally {
      setIsCheckingRoom(false);
    }
  };

  const spectateRoom = async () => {
    if (roomCode.length < 7) {
      toast.error("Please enter a valid room code (XXX-XXX)");
      return;
    }

    setIsCheckingRoom(true);
    try {
      const result = await checkRoomValidity(roomCode);
      
      if (result.valid) {
        // Room is valid, navigate to spectate page
        navigate(`/spectate/${roomCode}`);
      } else {
        // Room is not valid, show error
        toast.error(result.message || "Cannot spectate room");
      }
    } catch (error) {
      console.error('Error checking room:', error);
      toast.error("Failed to check room validity");
    } finally {
      setIsCheckingRoom(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Room code copied to clipboard!");
  };

  const startBattle = () => {
    navigate(`/battle/${generatedCode}`, { state: { language: selectedLanguage } });
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Clean Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="mb-4 lg:mb-0">
            <div className="flex items-center mb-3">
              <img 
                src={logo} 
                alt="Duelingo Logo" 
                className="h-12 w-12 mr-3"
              />
              <span className="text-xl font-bold text-gray-900">Duelingo</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 text-lg">Ready for your next language battle?</p>
          </div>
          
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Actions Grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Info */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">How to Play Duelingo</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">🎯</span>
                      </div>
                      <h4 className="font-semibold mb-2 text-gray-900">Battle Objective</h4>
                      <p className="text-gray-600 text-sm">Race to create the target word using drag-and-drop combinations</p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">⏱️</span>
                      </div>
                      <h4 className="font-semibold mb-2 text-gray-900">60 Second Timer</h4>
                      <p className="text-gray-600 text-sm">Quick battles test your vocabulary skills under pressure</p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl">📖</span>
                      </div>
                      <h4 className="font-semibold mb-2 text-gray-900">Learning Stories</h4>
                      <p className="text-gray-600 text-sm">Your creations become part of an adventure story</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Create Room */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-gray-900">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  Create Battle Room
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Start a new battle room and invite friends to join
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showCreateRoom ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Room Language</Label>
                      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                      onClick={generateRoomCode}
                      disabled={!connected}
                    >
                      {connected ? "Create Room" : "Connecting..."}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Your Room Code</Label>
                      <div className="flex items-center gap-2">
                        <div className="room-code-input bg-gray-50 border border-gray-300 rounded-lg p-4 flex-1 text-gray-900 font-mono text-xl">
                          {generatedCode}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyRoomCode}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Label className="text-sm text-gray-600">
                        Language: {languages.find(l => l.code === selectedLanguage)?.name}
                      </Label>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={generateRoomCode}
                        disabled={isCreatingRoom}
                      >
                        {isCreatingRoom ? "Creating..." : "Create & Join"}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setShowCreateRoom(false)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        New Code
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Join/Spectate Room */}
            <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-gray-900">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  Join Battle
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Enter a room code to join or spectate a battle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="roomCode" className="text-sm font-medium text-gray-700 mb-2 block">
                    Room Code
                  </Label>
                  <Input
                    id="roomCode"
                    placeholder="XXX-XXX"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="room-code-input border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                    maxLength={7}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={joinRoom}
                    disabled={roomCode.length < 7 || isCheckingRoom}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {isCheckingRoom ? "Checking..." : "Join"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={spectateRoom}
                    disabled={roomCode.length < 7 || isCheckingRoom}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {isCheckingRoom ? "Checking..." : "Spectate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <Profile />
              <VocabularyDisplay />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
