import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, Users, Clock } from "lucide-react";

// Mock data for spectator view
const MOCK_PLAYERS = [
  {
    id: "player1",
    username: "SpanishMaster",
    elements: [
      { id: "water", text: "Agua", emoji: "💧", x: 50, y: 100 },
      { id: "fire", text: "Fuego", emoji: "🔥", x: 200, y: 150 },
      { id: "steam", text: "Vapor", emoji: "💨", x: 150, y: 200 },
    ],
    discoveries: ["Vapor", "Barro"],
    timeLeft: 45,
  },
  {
    id: "player2", 
    username: "VocabWarrior",
    elements: [
      { id: "earth", text: "Tierra", emoji: "🌍", x: 80, y: 120 },
      { id: "wind", text: "Viento", emoji: "💨", x: 180, y: 80 },
      { id: "tree", text: "Árbol", emoji: "🌳", x: 120, y: 180 },
    ],
    discoveries: ["Hoja", "Tormenta"],
    timeLeft: 45,
  }
];

const Spectate = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState(MOCK_PLAYERS);
  const [targetWord] = useState("Tormenta");
  const [battleTime, setBattleTime] = useState(60);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBattleTime(prev => Math.max(0, prev - 1));
      
      // Simulate players making progress
      setPlayers(prev => prev.map(player => ({
        ...player,
        timeLeft: Math.max(0, player.timeLeft - 1)
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const PlayerCanvas = ({ player, index }: { player: any, index: number }) => (
    <div className="relative">
      {/* Player Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <div className={`
                w-3 h-3 rounded-full 
                ${index === 0 ? 'bg-primary' : 'bg-secondary'}
              `} />
              {player.username}
            </div>
            <div className="text-sm text-muted-foreground">
              Discoveries: {player.discoveries.length}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Player Canvas */}
      <Card className="battle-canvas h-80 relative overflow-hidden">
        <div className="w-full h-full relative p-4">
          {player.elements.map((element: any) => (
            <div
              key={`${player.id}-${element.id}`}
              className="battle-element absolute pointer-events-none"
              style={{
                left: element.x,
                top: element.y,
                width: '120px',
                height: '60px',
              }}
            >
              <div className="flex items-center gap-2 h-full px-3">
                <span className="text-lg">{element.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{element.text}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Player Status Overlay */}
          <div className="absolute top-2 right-2">
            <div className={`
              px-2 py-1 rounded text-xs font-medium
              ${index === 0 ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}
            `}>
              Player {index + 1}
            </div>
          </div>
        </div>
      </Card>

      {/* Player Discoveries */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 text-sm">Recent Discoveries:</h4>
          {player.discoveries.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {player.discoveries.map((discovery: string, idx: number) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-accent/20 text-accent text-xs rounded"
                >
                  {discovery}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">No discoveries yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary" />
                Spectating Room: {roomCode}
              </h1>
              <p className="text-muted-foreground">Watch the battle unfold</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span>{players.length} Players</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Battle Status */}
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">Battle Timer</p>
                  <p className="text-sm text-muted-foreground">Time Remaining</p>
                </div>
              </div>
              <div className="text-3xl font-bold font-mono text-primary">
                {formatTime(battleTime)}
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold">Target Word</p>
              <p className="text-2xl font-bold text-accent">{targetWord}</p>
              <p className="text-sm text-muted-foreground">First to create wins!</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${(battleTime / 60) * 100}%` }}
            />
          </div>
        </Card>

        {/* Split Screen Battle View */}
        <div className="spectator-split">
          {players.map((player, index) => (
            <PlayerCanvas key={player.id} player={player} index={index} />
          ))}
        </div>

        {/* Live Updates */}
        <Card className="mt-6 p-4 bg-muted/5">
          <h3 className="font-semibold mb-3">Live Battle Feed</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                {players[0].username} discovered "Vapor" (Steam)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                {players[1].username} discovered "Hoja" (Leaf)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-muted-foreground">
                Battle is getting intense! Both players are close to the target.
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Spectate;