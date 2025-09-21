import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import GameOverlay from "@/components/notifications/GameOverlay";
import ElementNotification from "@/components/notifications/ElementNotification";
import SpeechRecognitionModal from "@/components/battle/SpeechRecognitionModal";
import { playBase64Audio } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import { GAME_CONFIG } from "@/lib/gameConfig";

// Default basic elements for the battle (fallback)
const DEFAULT_INITIAL_ELEMENTS = [
  { id: "water", text: "Water", emoji: "💧" },
  { id: "fire", text: "Fire", emoji: "🔥" },
  { id: "earth", text: "Earth", emoji: "🌍" },
  { id: "air", text: "Air", emoji: "💨" },
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
  const location = useLocation();
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const { 
    connected, 
    joinRoom, 
    leaveRoom,
    createElement, 
    startGame, 
    currentRoom,
    roomError,
    onElementCreated,
    onGameEvent,
    offElementCreated,
    offGameEvent
  } = useSocket();
  
  const [timeLeft, setTimeLeft] = useState<number>(GAME_CONFIG.BATTLE_DURATION);
  const [isActive, setIsActive] = useState(false); // Wait for game to start
  const [availableElements, setAvailableElements] = useState(DEFAULT_INITIAL_ELEMENTS);
  const [canvasElements, setCanvasElements] = useState<Array<any>>([]);
  const [discoveries, setDiscoveries] = useState<Array<any>>([]);
  const [targetWord, setTargetWord] = useState("Unknown"); // Will be set from room
  const [gameEnded, setGameEnded] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [playerWon, setPlayerWon] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [showLobby, setShowLobby] = useState(true); // Start with lobby visible for room creators
  const [showGameOverlay, setShowGameOverlay] = useState(false);
  const [gameOverlayData, setGameOverlayData] = useState<any>(null);
  const [elementNotifications, setElementNotifications] = useState<any[]>([]);
  const [elementAudio, setElementAudio] = useState<Map<string, string>>(new Map());
  
  // Speech recognition state
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const [speechModalData, setSpeechModalData] = useState<{
    elementName: string;
    elementEmoji: string;
    groundTruthAudio: string;
    pendingElementData: any;
  } | null>(null);

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Join room when component mounts and socket is connected
  useEffect(() => {
    if (connected && roomCode && !roomJoined) {
      const language = location.state?.language || 'en-US';
      const roomName = `Battle Room ${roomCode}`;
      const roomDescription = `Real-time battle room`;
      joinRoom(roomCode, roomName, roomDescription, language);
      setRoomJoined(true);
      const isCreator = location.state?.isCreator || false;
      console.log(`Attempting to join room ${roomCode} with language ${language}, isCreator: ${isCreator}`);
      
      // If user is not the creator, hide lobby initially
      if (!isCreator) {
        setShowLobby(false);
      }
      
      try {
        // @ts-ignore - joinRoom accepts 4 parameters including language
        joinRoom(roomCode, `Battle Room ${roomCode}`, `Real-time battle room`, language);
        setRoomJoined(true);
        
        // Fetch language-specific initial elements
        fetchInitialElements(language);
      } catch (error) {
        console.error('Error joining room:', error);
        toast.error('Failed to join room');
      }
    }
  }, [connected, roomCode, roomJoined, joinRoom, location.state]);

  // Handle room join errors - show error but don't navigate since validation was done in Home
  useEffect(() => {
    if (roomError) {
      toast.error(`Room error: ${roomError}`);
      // Don't navigate back to home since the user should already be in a valid room
      // The error might be temporary (network issues, etc.)
    }
  }, [roomError]);

  // Update room info when currentRoom changes
  useEffect(() => {
    if (currentRoom) {
      console.log('Current room data:', currentRoom);
      setTargetWord(currentRoom.target_element || "Unknown");
      setIsActive(currentRoom.gameStatus === 'active');
      setGameEnded(currentRoom.gameStatus === 'ended');
      
      // Check if current user is the room creator
      const isCreator = currentRoom.createdBy?.userId === user?.id;
      setIsRoomCreator(isCreator);
      console.log('Is room creator:', isCreator);
      
      // Show lobby if game is waiting, hide when game starts or ends
      const shouldShowLobby = currentRoom.gameStatus === 'waiting';
      console.log('Game status:', currentRoom.gameStatus, 'Should show lobby:', shouldShowLobby);
      setShowLobby(shouldShowLobby);
      
      if (currentRoom.gameStatus === 'active' && currentRoom.startedAt) {
        // Calculate time left based on start time
        const startTime = new Date(currentRoom.startedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, GAME_CONFIG.BATTLE_DURATION - elapsed);
        setTimeLeft(remaining);
      }
    }
  }, [currentRoom, user?.id]);

  // Handle element creation responses from backend
  useEffect(() => {
    if (!connected) return;

    const handleElementCreated = (data: any) => {
      console.log('Element created from backend:', data);
      
      // Check if this is actually an endgame event disguised as element creation
      if (data.type === 'endgame') {
        console.log('Endgame event received in element handler:', data);
        const isWinner = data.data?.winner?.userId === user?.id;
        setPlayerWon(isWinner);
        setGameEnded(true);
        setIsActive(false);
        
        displayGameOverlay(
          isWinner ? 'victory' : 'defeat',
          {
            title: isWinner ? '🎉 Victory!' : '💔 Defeat',
            message: isWinner 
              ? 'Congratulations! You created the target element!' 
              : `${data.data.winner?.userName} won the battle!`,
            targetElement: data.data.targetElement,
            winnerName: data.data.winner?.userName,
            isPlayerWinner: isWinner
          }
        );
        return;
      }
      
      if (data.element) {
        // Store audio data for the element if available
        if (data.audio_b64) {
          setElementAudio(prev => {
            const newMap = new Map(prev);
            newMap.set(data.element.toLowerCase(), data.audio_b64);
            return newMap;
          });
        }
        
        // Create a new element object with proper formatting
        const displayText = data.en_text && data.en_text !== data.element 
          ? `${data.element} (${data.en_text})`
          : data.element;
          
        const newElement = {
          id: `backend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: displayText,
          emoji: data.emoji || '✨', // Use generated emoji or fallback to sparkles
          en_text: data.en_text, // Store English text separately for matching
        };

        // If audio is available, show speech recognition modal first
        if (data.audio_b64) {
          setSpeechModalData({
            elementName: data.element,
            elementEmoji: data.emoji || '✨',
            groundTruthAudio: data.audio_b64,
            pendingElementData: { data, newElement }
          });
          setShowSpeechModal(true);
          return; // Don't add element to game yet - wait for speech recognition success
        }

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

        // Show custom element notification
        showElementNotification(
          data.element,
          data.emoji || '✨',
          `${pendingCombination?.element1.text || ''} + ${pendingCombination?.element2.text || ''}`,
          undefined,
          true
        );
      }
      
    };

    const handleGameEvents = (data: any) => {
      console.log('Game event:', data);
      
      switch (data.type) {
        case 'player-discovered-element':
          // Show notification for other players' discoveries
          showElementNotification(
            data.data.element,
            '🔬', // Default emoji for other players
            data.data.combination,
            data.data.userName,
            false
          );
          break;
          
        case 'endgame':
          setGameEnded(true);
          setIsActive(false);
          
          const isWinner = data.data.winner?.userId === user?.id;
          setPlayerWon(isWinner);
          
          displayGameOverlay(
            isWinner ? 'victory' : 'defeat',
            {
              title: isWinner ? '🎉 Victory!' : '💔 Defeat',
              message: isWinner 
                ? 'Congratulations! You created the target element!' 
                : `${data.data.winner?.userName} won the battle!`,
              targetElement: data.data.targetElement,
              winnerName: data.data.winner?.userName,
              isPlayerWinner: isWinner
            }
          );
          break;
          
        case 'game-timeout':
          setGameEnded(true);
          setIsActive(false);
          
          const timeoutWinner = data.data.winner?.userId === user?.id;
          setPlayerWon(timeoutWinner);
          
          displayGameOverlay(
            'timeup',
            {
              title: '⏰ Time\'s Up!',
              message: data.data.winner 
                ? `${data.data.winner.userName} won with the highest score!`
                : 'The battle ended in a draw!',
              targetElement: data.data.targetElement,
              winnerName: data.data.winner?.userName,
              isPlayerWinner: timeoutWinner
            }
          );
          break;
          
        case 'game-started':
          toast.success(data.data.message);
          break;
          
        default:
          console.log('Unhandled game event:', data);
      }
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
          
          // Show time up overlay
          displayGameOverlay('timeup', {
            title: '⏰ Time\'s Up!',
            message: 'The battle has ended due to time limit.',
            targetElement: targetWord
          });
          
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

  // Helper function to extract English name from element
  const getEnglishElementName = (element: any): string => {
    // If element has en_text, use it
    if (element.en_text) {
      return element.en_text;
    }
    
    // If element text contains parentheses like "水 (Water)", extract the English part
    const match = element.text.match(/\(([^)]+)\)$/);
    if (match) {
      return match[1]; // Return "Water" from "水 (Water)"
    }
    
    // For elements like "Fire" or "Water" (already in English), use as-is
    return element.text;
  };

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

    // Extract English element names for consistent backend processing
    const englishElement1 = getEnglishElementName(element1);
    const englishElement2 = getEnglishElementName(element2);
    
    console.log(`Combining elements: ${element1.text} (${englishElement1}) + ${element2.text} (${englishElement2})`);

    // Use socket to create element with English names
    createElement(englishElement1, englishElement2);
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

  // Function to play audio for an element
  const playElementAudio = async (elementText: string) => {
      const audioData = elementAudio.get(elementText.toLowerCase());
      if (audioData) {
        try {
          await playBase64Audio(audioData, GAME_CONFIG.AUDIO_PLAYBACK_VOLUME);
        } catch (error) {
          console.error('Failed to play element audio:', error);
        }
      }
  };

  // Function to fetch language-specific initial elements
  const fetchInitialElements = async (languageCode: string) => {
    try {
      // Fetch elements
      const elementsResponse = await fetch(`${API_BASE_URL}/api/elements/initial/${languageCode}`);
      if (elementsResponse.ok) {
        const elementsData = await elementsResponse.json();
        setAvailableElements(elementsData.elements);
        console.log(`🌍 Loaded ${elementsData.elements.length} initial elements for ${languageCode}`);
        
        // Fetch audio for initial elements
        const audioResponse = await fetch(`${API_BASE_URL}/api/elements/initial-audio/${languageCode}`);
        if (audioResponse.ok) {
          const audioData = await audioResponse.json();
          
          // Add audio to elementAudio map using both element ID and display text
          setElementAudio(prev => {
            const newMap = new Map(prev);
            
            // Map audio by element key first
            Object.entries(audioData.audio).forEach(([elementKey, audioB64]) => {
              newMap.set(elementKey.toLowerCase(), audioB64 as string);
            });
            
            // Also map audio by display text for each element
            elementsData.elements.forEach((element: any) => {
              const audioB64 = audioData.audio[element.id];
              if (audioB64) {
                // Map by display text (e.g., "水 (Water)" or "Fire")
                newMap.set(element.text.toLowerCase(), audioB64);
                // Also map by English text if available
                if (element.en_text) {
                  newMap.set(element.en_text.toLowerCase(), audioB64);
                }
              }
            });
            
            return newMap;
          });
          
          console.log(`🔊 Loaded audio for ${Object.keys(audioData.audio).length} initial elements`);
        }
      }
      
    } catch (error) {
      console.error('Error fetching initial elements:', error);
      // Keep using default elements if fetch fails
    }
  };

  const restartBattle = () => {
    setTimeLeft(GAME_CONFIG.BATTLE_DURATION);
    setIsActive(true);
    setCanvasElements([]);
    setDiscoveries([]);
    setAvailableElements(DEFAULT_INITIAL_ELEMENTS);
    setGameEnded(false);
    setShowStory(false);
    setPlayerWon(false);
  };


  const handleLeaveRoom = () => {
    if (connected && currentRoom) {
      leaveRoom();
    }
    navigate('/home');
  };

  const showElementNotification = (element: string, emoji: string, combination?: string, playerName?: string, isOwnDiscovery = true) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification = {
      id,
      element,
      emoji,
      combination,
      playerName,
      isOwnDiscovery,
      show: true
    };
    
    setElementNotifications(prev => [...prev, notification]);
    
    // Auto remove after configured duration
    setTimeout(() => {
      setElementNotifications(prev => prev.filter(n => n.id !== id));
    }, GAME_CONFIG.ELEMENT_NOTIFICATION_DURATION);
  };

  const displayGameOverlay = (type: 'victory' | 'defeat' | 'timeup', data: any) => {
    setGameOverlayData({ type, ...data });
    setShowGameOverlay(true);
  };

  // Handle successful speech recognition
  const handleSpeechRecognitionSuccess = () => {
    if (!speechModalData) return;

    const { pendingElementData } = speechModalData;
    const { data, newElement } = pendingElementData;

        // Play audio immediately for the newly created element (now that pronunciation is verified)
        try {
          playBase64Audio(data.audio_b64, GAME_CONFIG.AUDIO_PLAYBACK_VOLUME);
        } catch (error) {
          console.error('Failed to play element creation audio:', error);
        }

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

    // Show custom element notification
    showElementNotification(
      data.element,
      data.emoji || '✨',
      `${pendingCombination?.element1.text || ''} + ${pendingCombination?.element2.text || ''}`,
      undefined,
      true
    );

    // Close the speech modal
    setShowSpeechModal(false);
    setSpeechModalData(null);
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

  // Debug logging
  console.log('Battle render - showLobby:', showLobby, 'currentRoom:', currentRoom, 'isRoomCreator:', isRoomCreator);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Battle Room: {roomCode}</h1>
              <p className="text-muted-foreground">Player vs Player</p>
            </div>
            
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="font-medium">Target: {targetWord}</span>
              </div>
            </Card>
            
            {/* Game Status Indicator */}
            <Card className="px-3 py-2 shadow-soft hover:shadow-medium transition-shadow duration-200">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  currentRoom?.gameStatus === 'active' ? 'bg-green-500 shadow-sm' : 
                  currentRoom?.gameStatus === 'waiting' ? 'bg-warning shadow-sm' : 'bg-destructive shadow-sm'
                }`} />
                <span className="text-sm capitalize font-medium">{currentRoom?.gameStatus || 'connecting'}</span>
              </div>
            </Card>
          </div>

          {/* Game Start Button for Room Creator - positioned on the right */}
          <div className="ml-auto">
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
              totalDuration={GAME_CONFIG.BATTLE_DURATION}
            />
          </div>

          {/* Canvas Area */}
          <div className="battle-canvas-area">
            <BattleCanvas
              elements={canvasElements}
              onElementsChange={setCanvasElements}
              onCombination={handleElementCombination}
              isActive={isActive}
              onElementDrag={playElementAudio}
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
            <Card className="p-4 bg-primary/10 border-primary/30 shadow-medium hover:shadow-large transition-shadow duration-300">
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-2 flex items-center justify-center gap-2">
                  <div className="p-1 rounded-lg bg-primary/20">
                    <Trophy className="w-4 h-4 text-primary" />
                  </div>
                  Battle Objective
                </h3>
                <p className="text-muted-foreground">
                  Create "<span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{targetWord}</span>" by combining elements!
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
                    <Button onClick={restartBattle} variant="outline" className="shadow-soft hover:shadow-medium">
                      Play Again
                    </Button>
                    <Button onClick={() => setShowStory(true)} variant="gradient" className="shadow-medium hover:shadow-large">
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

      {/* Game Overlay */}
      <GameOverlay
        show={showGameOverlay}
        type={gameOverlayData?.type || 'victory'}
        title={gameOverlayData?.title || ''}
        message={gameOverlayData?.message || ''}
        targetElement={gameOverlayData?.targetElement}
        winnerName={gameOverlayData?.winnerName}
        isPlayerWinner={gameOverlayData?.isPlayerWinner}
        onClose={() => setShowGameOverlay(false)}
        onPlayAgain={() => {
          setShowGameOverlay(false);
          restartBattle();
        }}
        onViewStory={() => {
          setShowGameOverlay(false);
          setShowStory(true);
        }}
      />

      {/* Element Notifications */}
      <div className="fixed top-4 right-4 z-40 space-y-2">
        {elementNotifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{ 
              transform: `translateY(${index * 10}px)`,
              zIndex: 40 - index 
            }}
          >
            <ElementNotification
              show={notification.show}
              element={notification.element}
              emoji={notification.emoji}
              combination={notification.combination}
              playerName={notification.playerName}
              isOwnDiscovery={notification.isOwnDiscovery}
              onClose={() => {
                setElementNotifications(prev => prev.filter(n => n.id !== notification.id));
              }}
            />
          </div>
        ))}
      </div>

      {/* Speech Recognition Modal */}
      {speechModalData && (
        <SpeechRecognitionModal
          isOpen={showSpeechModal}
          onClose={() => {
            setShowSpeechModal(false);
            setSpeechModalData(null);
          }}
          onSuccess={handleSpeechRecognitionSuccess}
          elementName={speechModalData.elementName}
          elementEmoji={speechModalData.elementEmoji}
          groundTruthAudio={speechModalData.groundTruthAudio}
          threshold={GAME_CONFIG.SPEECH_RECOGNITION_THRESHOLD}
        />
      )}
    </div>
  );
};

export default Battle;