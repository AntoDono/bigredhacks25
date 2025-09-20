import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User } from "lucide-react";

const Profile = () => {
  const { user, logout } = useAuth();

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

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">{user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Member since:</strong> {formatDate(user.createdAt)}</p>
        </div>
        
        <Button 
          onClick={logout}
          variant="outline" 
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};

export default Profile;
