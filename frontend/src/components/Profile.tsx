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
    <Card className="w-full max-w-md bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">{user.name}</CardTitle>
        <CardDescription className="text-gray-600">{user.email}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="space-y-1">
            <p><strong className="text-gray-900">User ID:</strong> <span className="font-mono text-xs">{user.id}</span></p>
            <p><strong className="text-gray-900">Member since:</strong> {formatDate(user.createdAt)}</p>
          </div>
        </div>
        
        <Button 
          onClick={logout}
          variant="outline" 
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};

export default Profile;
