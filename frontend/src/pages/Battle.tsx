import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Trophy, Target, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import BattleCanvas from "@/components/battle/BattleCanvas";
import ElementSidebar from "@/components/battle/ElementSidebar";
import Timer from "@/components/battle/Timer";
import StoryModal from "@/components/battle/StoryModal";

// Spanish vocabulary for the battle
const INITIAL_ELEMENTS = [
  { id: "water", text: "Agua", emoji: "💧", spanish: "Agua", english: "Water" },
  { id: "fire", text: "Fuego", emoji: "🔥", spanish: "Fuego", english: "Fire" },
  { id: "earth", text: "Tierra", emoji: "🌍", spanish: "Tierra", english: "Earth" },
  { id: "wind", text: "Viento", emoji: "💨", spanish: "Viento", english: "Wind" },
  { id: "tree", text: "Árbol", emoji: "🌳", spanish: "Árbol", english: "Tree" },
  { id: "stone", text: "Piedra", emoji: "🪨", spanish: "Piedra", english: "Stone" },
];

const COMBINATION_RULES = {
  "water+fire": { id: "steam", text: "Vapor", emoji: "💨", spanish: "Vapor", english: "Steam" },
  "water+earth": { id: "mud", text: "Barro", emoji: "🟤", spanish: "Barro", english: "Mud" },
  "fire+earth": { id: "lava", text: "Lava", emoji: "🌋", spanish: "Lava", english: "Lava" },
  "wind+water": { id: "storm", text: "Tormenta", emoji: "⛈️", spanish: "Tormenta", english: "Storm" },
  "tree+fire": { id: "ash", text: "Ceniza", emoji: "🌫️", spanish: "Ceniza", english: "Ash" },
  "stone+fire": { id: "metal", text: "Metal", emoji: "⚡", spanish: "Metal", english: "Metal" },
  "water+tree": { id: "fruit", text: "Fruta", emoji: "🍎", spanish: "Fruta", english: "Fruit" },
  "wind+tree": { id: "leaf", text: "Hoja", emoji: "🍃", spanish: "Hoja", english: "Leaf" },
};

const Battle = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [availableElements, setAvailableElements] = useState(INITIAL_ELEMENTS);
  const [canvasElements, setCanvasElements] = useState<Array<any>>([]);
  const [discoveries, setDiscoveries] = useState<Array<any>>([]);
  const [targetWord] = useState("Tormenta"); // Storm - the goal
  const [gameEnded, setGameEnded] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [playerWon, setPlayerWon] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          setIsActive(false);
          setGameEnded(true);
          checkWinCondition();
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const checkWinCondition = () => {
    const hasTarget = canvasElements.some(el => el.spanish === targetWord) || 
                     discoveries.some(el => el.spanish === targetWord);
    setPlayerWon(hasTarget);
    setTimeout(() => setShowStory(true), 1500);
  };

  const handleElementCombination = (element1: any, element2: any) => {
    const key1 = `${element1.id}+${element2.id}`;
    const key2 = `${element2.id}+${element1.id}`;
    const combination = COMBINATION_RULES[key1] || COMBINATION_RULES[key2];

    if (combination && !discoveries.find(d => d.id === combination.id)) {
      setDiscoveries(prev => [...prev, combination]);
      setAvailableElements(prev => [...prev, combination]);
      toast.success(`¡Descubriste ${combination.spanish}! (${combination.english})`);
      
      // Check if they discovered the target
      if (combination.spanish === targetWord && isActive) {
        setPlayerWon(true);
        setIsActive(false);
        setGameEnded(true);
        toast.success("¡Ganaste! You found the target word!");
        setTimeout(() => setShowStory(true), 1500);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const restartBattle = () => {
    setTimeLeft(60);
    setIsActive(true);
    setCanvasElements([]);
    setDiscoveries([]);
    setAvailableElements(INITIAL_ELEMENTS);
    setGameEnded(false);
    setShowStory(false);
    setPlayerWon(false);
  };

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
    </div>
  );
};

export default Battle;