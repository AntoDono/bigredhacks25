import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Trophy, Target, ArrowLeft, Play } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import BattleCanvas from "@/components/battle/BattleCanvas";
import ElementSidebar from "@/components/battle/ElementSidebar";
import Timer from "@/components/battle/Timer";
import StoryModal from "@/components/battle/StoryModal";
import RoomLobby from "@/components/battle/RoomLobby";

// Basic elements for the battle
const INITIAL_ELEMENTS = [
  { id: "water", text: "Water", emoji: "💧" },
  { id: "fire", text: "Fire", emoji: "🔥" },
  { id: "earth", text: "Earth", emoji: "🌍" },
  { id: "axe", text: "Axe", emoji: "🪓" },
  { id: "pickaxe", text: "Pickaxe", emoji: "⛏️" },
  { id: "stemcell", text: "Stemcell", emoji: "🔬" },
  { id: "tree", text: "Tree", emoji: "🌳" },
  { id: "stone", text: "Stone", emoji: "🪨" },
];

// All combinations are now handled by the backend LLM - no hardcoded rules!

const Battle = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { 
    connected, 
    joinRoom, 
    createElement, 
    startGame, 
    currentRoom,
    onElementCreated,
    onGameEvent,
    offElementCreated,
    offGameEvent
  } = useSocket();
  
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isActive, setIsActive] = useState(false); // Wait for game to start
  const [availableElements, setAvailableElements] = useState(INITIAL_ELEMENTS);
  const [canvasElements, setCanvasElements] = useState<Array<any>>([]);
  const [discoveries, setDiscoveries] = useState<Array<any>>([]);
  const [targetWord, setTargetWord] = useState("Unknown"); // Will be set from room
  const [gameEnded, setGameEnded] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [playerWon, setPlayerWon] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [showLobby, setShowLobby] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Join room when component mounts and socket is connected
  useEffect(() => {
    if (connected && roomCode && !roomJoined) {
      joinRoom(roomCode, `Battle Room ${roomCode}`, `Real-time battle room`);
      setRoomJoined(true);
    }
  }, [connected, roomCode, roomJoined, joinRoom]);

  // Update room info when currentRoom changes
  useEffect(() => {
    if (currentRoom) {
      setTargetWord(currentRoom.target_element || "Unknown");
      setIsActive(currentRoom.gameStatus === 'active');
      setGameEnded(currentRoom.gameStatus === 'ended');
      
      // Check if current user is the room creator
      setIsRoomCreator(currentRoom.createdBy?.userId === user?.id);
      
      // Show lobby if game is waiting, hide when game starts or ends
      setShowLobby(currentRoom.gameStatus === 'waiting');
      
      if (currentRoom.gameStatus === 'active' && currentRoom.startedAt) {
        // Calculate time left based on start time (2 minute game)
        const startTime = new Date(currentRoom.startedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, 120 - elapsed);
        setTimeLeft(remaining);
      }
    }
  }, [currentRoom, user?.id]);

  // Handle element creation responses from backend
  useEffect(() => {
    if (!connected) return;

    const handleElementCreated = (data: any) => {
      console.log('Element created from backend:', data);
      
      if (data.element) {
        // Create a new element object with proper formatting
        const newElement = {
          id: `backend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: data.element,
          emoji: data.emoji || '✨', // Use generated emoji or fallback to sparkles
        };

        // Check if this was from a canvas combination (placeholder replacement)
        const pendingCombination = (window as any).pendingCombination;
        if (pendingCombination) {
          // Find the placeholder and replace it with the new element at the same position
          setCanvasElements(prev => {
            const placeholder = prev.find(el => el.id === pendingCombination.id);
            if (placeholder) {
              const replacementElement = {
                ...newElement,
                x: placeholder.x,
                y: placeholder.y,
                id: `canvas-${newElement.id}` // Ensure unique canvas ID
              };
              return prev.map(el => 
                el.id === pendingCombination.id ? replacementElement : el
              );
            }
            return prev;
          });
          
          // Clear the pending combination
          delete (window as any).pendingCombination;
        }

        // Add to discoveries if not already there
        setDiscoveries(prev => {
          if (!prev.find(el => el.text === newElement.text)) {
            return [...prev, newElement];
          }
          return prev;
        });

        // Add to available elements for further combinations
        setAvailableElements(prev => {
          if (!prev.find(el => el.text === newElement.text)) {
            return [...prev, newElement];
          }
          return prev;
        });

        // Show success message
        toast.success(`Created: ${data.element}!`);
      }
    };

    const handleGameEvents = (data: any) => {
      console.log('Game event:', data);
      // Handle other game events like player discoveries, game end, etc.
    };

    onElementCreated(handleElementCreated);
    onGameEvent(handleGameEvents);

    return () => {
      offElementCreated(handleElementCreated);
      offGameEvent(handleGameEvents);
    };
  }, [connected, onElementCreated, onGameEvent, offElementCreated, offGameEvent]);

  // Timer effect
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    console.log(`Timer starting: isActive=${isActive}, timeLeft=${timeLeft}`);
    
    const interval = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          setIsActive(false);
          setGameEnded(true);
          console.log('Timer ended - game over');
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => {
      console.log('Timer cleanup');
      clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const handleElementCombination = (element1: any, element2: any, placeholderId?: string) => {
    if (!connected || !isActive) {
      toast.error("Game is not active or not connected to server");
      return;
    }

    // Store placeholder info for replacement when response comes back
    if (placeholderId) {
      // We'll handle the replacement in the element creation response handler
      const placeholderInfo = {
        id: placeholderId,
        element1,
        element2
      };
      // Store this info temporarily - we'll use it when the response comes back
      (window as any).pendingCombination = placeholderInfo;
    }

    // Use socket to create element instead of local rules
    createElement(element1.text, element2.text);
  };

  const handleStartGame = () => {
    if (!connected) {
      toast.error("Not connected to server");
      return;
    }
    
    if (!isRoomCreator) {
      toast.error("Only the room creator can start the game");
      return;
    }

    startGame();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const restartBattle = () => {
    setTimeLeft(120); // 2 minutes
    setIsActive(true);
    setCanvasElements([]);
    setDiscoveries([]);
    setAvailableElements(INITIAL_ELEMENTS);
    setGameEnded(false);
    setShowStory(false);
    setPlayerWon(false);
  };


  const handleLeaveRoom = () => {
    navigate('/home');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/home')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Battle Room: {roomCode}</h1>
              <p className="text-muted-foreground">Player vs Player</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-medium">Target: {targetWord}</span>
              </div>
            </Card>
            
            {/* Game Start Button for Room Creator */}
            {isRoomCreator && currentRoom?.gameStatus === 'waiting' && (
              <Button 
                onClick={handleStartGame}
                className="btn-hero"
                disabled={!connected}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            )}
            
            {/* Game Status Indicator */}
            <Card className="px-3 py-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  currentRoom?.gameStatus === 'active' ? 'bg-green-500' : 
                  currentRoom?.gameStatus === 'waiting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm capitalize">{currentRoom?.gameStatus || 'connecting'}</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Battle Layout */}
        <div className="battle-layout h-[calc(100vh-200px)]">
          {/* Timer */}
          <div className="battle-timer">
            <Timer 
              timeLeft={timeLeft} 
              isActive={isActive} 
              gameEnded={gameEnded}
              playerWon={playerWon}
              totalDuration={120}
            />
          </div>

          {/* Canvas Area */}
          <div className="battle-canvas-area">
            <BattleCanvas
              elements={canvasElements}
              onElementsChange={setCanvasElements}
              onCombination={handleElementCombination}
              isActive={isActive}
            />
          </div>

          {/* Sidebar */}
          <div className="battle-sidebar">
            <ElementSidebar
              availableElements={availableElements}
              discoveries={discoveries}
              onElementDragStart={(element) => {
                // Handle drag start from sidebar
              }}
            />
          </div>

          {/* Target Prompt */}
          <div className="battle-prompt">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2 flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Battle Objective
                </h3>
                <p className="text-muted-foreground">
                  Create "<span className="font-bold text-primary">{targetWord}</span>" by combining elements!
                </p>
                
                {/* Game Status Messages */}
                {!connected && (
                  <div className="mt-4 text-center">
                    <p className="text-yellow-600">Connecting to server...</p>
                  </div>
                )}
                
                {connected && currentRoom?.gameStatus === 'waiting' && (
                  <div className="mt-4 text-center">
                    <p className="text-blue-600">
                      {isRoomCreator 
                        ? "Click 'Start Game' when ready!" 
                        : "Waiting for room creator to start the game..."
                      }
                    </p>
                  </div>
                )}
                
                {gameEnded && (
                  <div className="mt-4 flex justify-center gap-2">
                    <Button onClick={restartBattle} variant="outline">
                      Play Again
                    </Button>
                    <Button onClick={() => setShowStory(true)}>
                      View Story
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Story Modal */}
      <StoryModal
        open={showStory}
        onOpenChange={setShowStory}
        elements={[...canvasElements, ...discoveries]}
        playerWon={playerWon}
        targetWord={targetWord}
      />

      {/* Room Lobby Overlay */}
      <RoomLobby
        show={showLobby}
        roomCode={roomCode || ''}
        roomData={currentRoom}
        isRoomCreator={isRoomCreator}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    </div>
  );
};

export default Battle;