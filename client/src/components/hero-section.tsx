import { useQuery } from "@tanstack/react-query";

export function HeroSection() {
  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Find hero image URL from settings
  const heroImageSetting = settings?.find((s: any) => s.key === 'hero_image_url');
  const backgroundImage = heroImageSetting?.value || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&h=1380';

  return (
    <section className="hero-gradient pt-16 min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={backgroundImage}
          alt="Aerial view of city with river and bridges" 
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-foreground mb-6">
          DroneFolio
        </h1>
        <p className="text-xl sm:text-2xl text-muted-foreground mb-12 font-light">
          Aerial Photography & Videography
        </p>
        
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-border">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Your Portfolio Awaits
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            It looks a little empty here. Login as an admin to upload your first shot.
          </p>
        </div>
      </div>
    </section>
  );
}
