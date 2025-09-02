import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaType, type MediaItem } from "@shared/schema";

interface NavigationProps {
  onOpenAdmin: () => void;
  onLogout?: () => void;
  showAdminButtons?: boolean;
  activeFilter?: string;
  setActiveFilter?: (filter: string) => void;
  locationFilter?: string;
  setLocationFilter?: (filter: string) => void;
  mediaItems?: MediaItem[];
}

export function Navigation({ 
  onOpenAdmin, 
  onLogout, 
  showAdminButtons = false,
  activeFilter = "All",
  setActiveFilter,
  locationFilter = "All Locations",
  setLocationFilter,
  mediaItems = []
}: NavigationProps) {
  // Get unique locations for filter dropdown
  const locations = Array.from(new Set(mediaItems.map((item: MediaItem) => item.location))).sort();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-helicopter text-primary text-xl"></i>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">DroneFolio</span>
                <span className="text-xs text-muted-foreground">Aerial Photography & Videography</span>
              </div>
            </div>
            <i className="fas fa-times text-muted-foreground cursor-pointer hover:text-foreground transition-colors"></i>
          </div>
          
          {/* Filter Controls */}
          {mediaItems.length > 0 && setActiveFilter && setLocationFilter && (
            <div className="flex items-center space-x-3">
              {/* Filter Buttons */}
              {["All", MediaType.PHOTO_4K, MediaType.PANORAMA_180, MediaType.PANORAMA_360, MediaType.VIDEO].map((filter) => (
                <Button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  size="sm"
                  className={`text-xs ${
                    activeFilter === filter
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  data-testid={`button-filter-${filter.toLowerCase().replace(/[°\s]/g, '')}`}
                >
                  {filter === MediaType.PHOTO_4K ? "Photo" :
                   filter === MediaType.PANORAMA_180 ? "180°" :
                   filter === MediaType.PANORAMA_360 ? "360°" :
                   filter === MediaType.VIDEO ? "Videos" : filter}
                </Button>
              ))}
              
              {/* Location Filter */}
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Locations">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
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
