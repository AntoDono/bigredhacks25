import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Crown, Clock, Copy, Play, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Player {
  userId: string;
  userName: string;
  isCreator?: boolean;
}

interface RoomLobbyProps {
  show: boolean;
  roomCode: string;
  roomData: any;
  isRoomCreator: boolean;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const RoomLobby = ({ 
  show, 
  roomCode, 
  roomData, 
  isRoomCreator, 
  onStartGame, 
  onLeaveRoom 
}: RoomLobbyProps) => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);

  // Update players list when room data changes
  useEffect(() => {
    if (roomData && roomData.players) {
      const playerList: Player[] = Object.entries(roomData.players).map(([userId, playerData]: [string, any]) => ({
        userId,
        userName: playerData.name || 'Unknown Player',
        isCreator: roomData.createdBy?.userId === userId
      }));
      setPlayers(playerList);
    }
  }, [roomData]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied to clipboard!");
  };

  const handleStartGame = () => {
    if (players.length < 1) {
      toast.error("Need at least 1 player to start the game");
      return;
    }
    onStartGame();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Users className="w-5 h-5" />
            Room Lobby
          </CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="outline" className="text-lg font-mono">
              {roomCode}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyRoomCode}
              className="h-8 w-8 p-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Players List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4" />
              <span className="font-medium">Players ({players.length})</span>
            </div>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.userId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    player.userId === user?.id ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.userName}</span>
                    {player.isCreator && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                    {player.userId === user?.id && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Target Element */}
          {roomData?.target_element && (
            <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-sm text-muted-foreground mb-1">Target Element</div>
              <div className="font-bold text-primary">{roomData.target_element}</div>
            </div>
          )}

          {/* Status and Actions */}
          <div className="space-y-3">
            {isRoomCreator ? (
              <div className="space-y-3">
                <div className="text-center text-sm text-muted-foreground">
                  You are the room creator. Start the game when ready!
                </div>
                <Button 
                  onClick={handleStartGame} 
                  className="w-full"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Game
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Waiting for room creator to start the game...</span>
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={onLeaveRoom}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomLobby;
