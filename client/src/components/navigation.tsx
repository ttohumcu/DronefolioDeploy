import { Button } from "@/components/ui/button";

interface NavigationProps {
  onOpenAdmin: () => void;
}

export function Navigation({ onOpenAdmin }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-helicopter text-primary text-xl"></i>
              <span className="text-xl font-bold text-foreground">DroneFolio</span>
            </div>
            <i className="fas fa-times text-muted-foreground cursor-pointer hover:text-foreground transition-colors"></i>
          </div>
          
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
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
