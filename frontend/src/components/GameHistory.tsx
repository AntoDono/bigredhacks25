import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Clock, Target, Users, Calendar, ChevronRight, Medal, Zap, User } from "lucide-react";
import { toast } from "sonner";
import { api, GameHistoryItem, GameDetails } from "@/lib/api";

const GameHistory = () => {
  const { user, token } = useAuth();
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameDetails | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load game history on component mount
  useEffect(() => {
    if (user && token) {
      loadGameHistory();
    }
  }, [user, token]);

  const loadGameHistory = async (page = 1) => {
    if (!user || !token) return;
    
    setIsLoadingGames(true);
    try {
      const response = await api.getUserGames(user.id, token, page, 20); // Load more games for grid layout
      setGameHistory(response.games);
      setCurrentPage(response.pagination.currentPage);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error loading game history:', error);
      toast.error('Failed to load game history');
    } finally {
      setIsLoadingGames(false);
    }
  };

  const handleGameClick = async (gameId: string) => {
    if (!token) return;
    
    try {
      const gameDetails = await api.getGameDetails(gameId, token);
      setSelectedGame(gameDetails);
      setShowGameModal(true);
    } catch (error) {
      console.error('Error loading game details:', error);
      toast.error('Failed to load game details');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  return (
    <div className="w-full">
      {/* Game History Section */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="w-6 h-6 text-blue-500" />
            Battle History
          </CardTitle>
          <CardDescription>
            Your recent battles and achievements
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoadingGames ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : gameHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No battles fought yet</p>
              <p className="text-sm">Start your first battle to see your history here!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Game Grid - responsive columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {gameHistory.map((game) => (
                  <Card 
                    key={game.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/30 group"
                    onClick={() => handleGameClick(game.id)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header with target and result */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-sm truncate">{game.targetElement}</span>
                          </div>
                          <Badge variant={game.userWon ? "default" : "secondary"} className="text-xs">
                            {game.userWon ? (
                              <>
                                <Medal className="w-3 h-3 mr-1" />
                                Win
                              </>
                            ) : (
                              'Loss'
                            )}
                          </Badge>
                        </div>
                        
                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDuration(game.duration)}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {game.players.length}p
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Zap className="w-3 h-3" />
                            {game.userStats?.score || 0}
                          </div>
                          <div className="text-muted-foreground text-right">
                            {game.userStats?.elementsDiscovered || 0} elem
                          </div>
                        </div>
                        
                        {/* Date */}
                        <div className="text-xs text-muted-foreground border-t pt-2">
                          {formatDate(game.createdAt)}
                        </div>
                        
                        {/* Hover indicator */}
                        <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadGameHistory(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm flex items-center">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadGameHistory(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game Details Modal */}
      <Dialog open={showGameModal} onOpenChange={setShowGameModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Game Details: {selectedGame?.targetElement}
            </DialogTitle>
            <DialogDescription>
              Battle fought on {selectedGame && formatDate(selectedGame.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGame && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Game Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Trophy className={`w-8 h-8 mx-auto mb-2 ${selectedGame.userWon ? 'text-amber-500' : 'text-gray-400'}`} />
                      <div className="font-semibold">
                        {selectedGame.userWon ? 'Victory!' : 'Defeat'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Winner: {selectedGame.winner ? selectedGame.winner.userName : 'Draw'}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                      <div className="font-semibold">
                        {formatDuration(selectedGame.duration)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Battle Duration
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Your Performance */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Your Performance
                  </h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{selectedGame.userStats?.score || 0}</div>
                          <div className="text-sm text-muted-foreground">Points Scored</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{selectedGame.userStats?.elementsDiscovered || 0}</div>
                          <div className="text-sm text-muted-foreground">Elements Discovered</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* All Players */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    All Players
                  </h3>
                  <div className="space-y-2">
                    {selectedGame.players
                      .sort((a, b) => b.score - a.score)
                      .map((player, index) => (
                        <Card key={player.userId} className={player.userId === user?.id ? "ring-2 ring-primary/50" : ""}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {index === 0 && <Medal className="w-4 h-4 text-amber-500" />}
                                  <span className="font-medium">
                                    {player.userName}
                                    {player.userId === user?.id && (
                                      <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                                    )}
                                  </span>
                                </div>
                                {selectedGame.winner && selectedGame.winner.userId === player.userId && (
                                  <Badge variant="default" className="text-xs">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    Winner
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{player.score} pts</div>
                                <div className="text-xs text-muted-foreground">
                                  {player.elementsDiscovered} elements
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>

                {/* Game Info */}
                <div>
                  <h3 className="font-semibold mb-3">Game Information</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room:</span>
                      <span>{selectedGame.roomName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Language:</span>
                      <span>{selectedGame.language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started:</span>
                      <span>{formatDate(selectedGame.startedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ended:</span>
                      <span>{formatDate(selectedGame.endedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameHistory; 