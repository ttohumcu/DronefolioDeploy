import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function HeroSection({ searchQuery, onSearchChange }: HeroSectionProps) {
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  const { data: mediaItems = [] } = useQuery({
    queryKey: ["/api/media"],
  });

  // Find hero image URL from settings
  const heroImageSetting = settings?.find((s: any) => s.key === 'hero_image_url');
  const backgroundImage = heroImageSetting?.value || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&h=1380';

  const hasPortfolioItems = mediaItems.length > 0;

  return (
    <section className="hero-gradient pt-16 h-48 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={backgroundImage}
          alt="Aerial view of city with river and bridges" 
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        {!hasPortfolioItems ? (
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Your Portfolio Awaits
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Login as an admin to upload your first shot.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">
              Explore the Portfolio
            </h2>
          </div>
        )}
        
        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search by Title or Location"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-6 py-3 bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl text-foreground placeholder-muted-foreground text-base"
            data-testid="input-search"
          />
          <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
        </div>
      </div>
    </section>
  );
}
