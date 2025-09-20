import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

const Profile = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  return (
    <Card className="w-full max-w-md bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
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
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm">Battle Statistics</h3>
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
  );
};

export default Profile;
