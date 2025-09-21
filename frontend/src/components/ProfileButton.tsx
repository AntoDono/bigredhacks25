import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, Trash2, Trophy, Calendar, LogOut } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

const ProfileButton = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={showProfile} onOpenChange={setShowProfile}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-primary/20 transition-all"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-bold">{user.name}</div>
              <div className="text-sm text-muted-foreground font-normal">{user.email}</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Member since {formatDate(user.createdAt)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Battle Statistics */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-500" />
                Battle Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{user.gamesWon || 0}</div>
                  <div className="text-sm text-gray-600">Victories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{user.gamesPlayed || 0}</div>
                  <div className="text-sm text-gray-600">Total Games</div>
                </div>
              </div>
              {user.gamesPlayed > 0 && (
                <div className="text-center mt-3 pt-3 border-t border-gray-200">
                  <div className="text-lg font-semibold text-primary">
                    {Math.round(((user.gamesWon || 0) / user.gamesPlayed) * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">Win Rate</div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Separator />
          
          {/* Actions */}
          <div className="space-y-2">
            <Button 
              onClick={logout}
              variant="outline" 
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
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
                    All your data, including game history and statistics, will be permanently removed.
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileButton; 