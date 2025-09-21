import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Trash2, Trophy, Clock, Target, Users, Calendar, ChevronRight, Medal, Zap } from "lucide-react";
import { toast } from "sonner";
import { api, GameHistoryItem, GameDetails } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";

const Profile = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameDetails | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  if (!user) return null;

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
      const response = await api.getUserGames(user.id, token, page, 10);
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
      month: 'long',
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

  const handleDeleteAccount = async () => {
    if (!token) {
      toast.error('Authentication token not found');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        logout();
        navigate('/');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* User Info Card */}
      <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-gray-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{user.name}</CardTitle>
          <CardDescription className="text-gray-600">{user.email}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p><strong>Member since:</strong> {formatDate(user.createdAt)}</p>
          </div>
          
          {/* Game Statistics */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Battle Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{user.gamesWon || 0}</div>
                <div className="text-gray-600">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{user.gamesPlayed || 0}</div>
                <div className="text-gray-600">Games</div>
              </div>
            </div>
            {user.gamesPlayed > 0 && (
              <div className="text-center text-xs text-gray-500 mt-2">
                Win Rate: {Math.round(((user.gamesWon || 0) / user.gamesPlayed) * 100)}%
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={logout}
              variant="outline" 
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete your account? This action cannot be undone. 
                    All your data will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Game History Card */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Game History
          </CardTitle>
          <CardDescription>
            Click on any game to view detailed statistics
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoadingGames ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : gameHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No games played yet</p>
              <p className="text-sm">Start a battle to see your history here!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {gameHistory.map((game) => (
                <Card 
                  key={game.id}
                  className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 border-l-transparent hover:border-l-primary/50"
                  onClick={() => handleGameClick(game.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{game.targetElement}</span>
                          <Badge variant={game.userWon ? "default" : "secondary"}>
                            {game.userWon ? (
                              <>
                                <Medal className="w-3 h-3 mr-1" />
                                Victory
                              </>
                            ) : (
                              'Defeat'
                            )}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(game.duration)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {game.players.length} players
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {game.userStats?.score || 0} points
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(game.createdAt)}
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadGameHistory(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-2 text-sm">
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
                      .sort((a, b) => b.score - a.score) // Sort by score descending
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

export default Profile;
