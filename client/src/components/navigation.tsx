import { Button } from "@/components/ui/button";
import droneIcon from "@assets/generated_images/Modern_drone_icon_silhouette_e04e9b81.png";

interface NavigationProps {
  onOpenAdmin: () => void;
  onLogout?: () => void;
  showAdminButtons?: boolean;
}

export function Navigation({ onOpenAdmin, onLogout, showAdminButtons = false }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img src={droneIcon} alt="Drone" className="w-7 h-7 filter invert" />
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-foreground">DroneFolio</span>
                </div>
                <span className="text-xs text-muted-foreground">Aerial Photography & Videography</span>
              </div>
              <img src={droneIcon} alt="Drone" className="w-7 h-7 filter invert" />
            </div>
          </div>
          
          
          {showAdminButtons && (
            <div className="flex items-center space-x-3">
              <Button 
                onClick={onOpenAdmin}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
                data-testid="button-admin-settings"
              >
                Admin Settings
              </Button>
              <Button 
                variant="destructive"
                className="text-sm font-medium"
                onClick={onLogout}
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
