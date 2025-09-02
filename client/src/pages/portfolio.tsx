import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { AdminModal } from "@/components/admin-modal";
import { FullscreenViewer } from "@/components/fullscreen-viewer";
import { LoginModal } from "@/components/login-modal";
import { Twitter, Youtube, User } from "lucide-react";
import type { MediaItem, Setting } from "@shared/schema";

export default function Portfolio() {
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    mediaItem: MediaItem | null;
  }>({
    isOpen: false,
    mediaItem: null,
  });

  const { data: mediaItems = [] } = useQuery<MediaItem[]>({
    queryKey: ["/api/media"],
  });

  const { data: settings = [] } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const footerImage = settings?.find((s: any) => s.key === 'footer_image_url')?.value || 
    'https://images.unsplash.com/photo-1519817914152-22d216bb9170?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&h=600';
  
  const twitterUrl = settings?.find((s: any) => s.key === 'twitter_url')?.value || 'https://x.com/yourprofile';
  const youtubeUrl = settings?.find((s: any) => s.key === 'youtube_url')?.value || 'https://youtube.com/yourchannel';
  const personalUrl = settings?.find((s: any) => s.key === 'personal_url')?.value || 'https://your-site.com';

  const handleOpenViewer = (mediaItem: MediaItem) => {
    setViewerState({ isOpen: true, mediaItem });
  };

  const handleCloseViewer = () => {
    setViewerState({ isOpen: false, mediaItem: null });
  };

  const showHero = mediaItems.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation 
        onOpenAdmin={() => setAdminModalOpen(true)} 
        onLogout={() => setIsAuthenticated(false)}
        showAdminButtons={isAuthenticated}
      />
      
      {/* Always show hero section */}
      <HeroSection 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        mediaItems={mediaItems}
      />
      
      {/* Show portfolio grid only when there are media items */}
      {!showHero && (
        <PortfolioGrid 
          onOpenViewer={handleOpenViewer} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          activeFilter={activeFilter}
          locationFilter={locationFilter}
        />
      )}

      {/* Footer */}
      <footer className="relative py-16 px-4 sm:px-6 lg:px-8 mt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src={footerImage}
            alt="Scenic aerial view of road through landscape" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8">
            Let's Create Something Breathtaking
          </h2>
          
          <div className="flex justify-center space-x-6">
            <a 
              href={twitterUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-primary transition-colors p-3 rounded-full hover:bg-white/10"
              data-testid="link-twitter"
            >
              <Twitter size={32} />
            </a>
            <a 
              href={youtubeUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-primary transition-colors p-3 rounded-full hover:bg-white/10"
              data-testid="link-youtube"
            >
              <Youtube size={32} />
            </a>
            <a 
              href={personalUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-primary transition-colors p-3 rounded-full hover:bg-white/10"
              data-testid="link-personal"
            >
              <User size={32} />
            </a>
          </div>
          
          <div className="mt-12 text-sm text-white/70">
            © 2025 DroneFolio
            <span 
              onClick={() => setLoginModalOpen(true)}
              data-testid="admin-access-dot"
              style={{ 
                textShadow: 'none !important',
                boxShadow: 'none !important',
                filter: 'none !important',
                cursor: 'default'
              }}
            >
              .
            </span>
            {" "}All rights reserved.
          </div>
        </div>
      </footer>

      <AdminModal 
        isOpen={adminModalOpen} 
        onClose={() => setAdminModalOpen(false)} 
      />

      <FullscreenViewer
        isOpen={viewerState.isOpen}
        mediaItem={viewerState.mediaItem}
        onClose={handleCloseViewer}
      />

      <LoginModal 
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={() => setIsAuthenticated(true)}
      />
    </div>
  );
}
