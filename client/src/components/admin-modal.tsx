import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MediaType } from "@shared/schema";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    mediaType: MediaType.PHOTO_4K,
    url: ""
  });

  const [settingsData, setSettingsData] = useState({
    heroImageUrl: "",
    footerImageUrl: "",
    twitterUrl: "",
    youtubeUrl: "",
    personalUrl: ""
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isOpen
  });

  // Load settings data when modal opens
  useState(() => {
    if (settings) {
      const settingsMap = settings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      setSettingsData({
        heroImageUrl: settingsMap.hero_image_url || "",
        footerImageUrl: settingsMap.footer_image_url || "",
        twitterUrl: settingsMap.twitter_url || "",
        youtubeUrl: settingsMap.youtube_url || "",
        personalUrl: settingsMap.personal_url || ""
      });
    }
  });

  const createMediaMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/media", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: "Media item added to portfolio successfully!"
      });
      setFormData({
        title: "",
        location: "",
        mediaType: MediaType.PHOTO_4K,
        url: ""
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add media item to portfolio.",
        variant: "destructive"
      });
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest("PUT", "/api/settings", { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings updated successfully!"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location || !formData.url) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }
    createMediaMutation.mutate(formData);
  };

  const handleUpdateSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-backdrop max-w-2xl max-h-[90vh] overflow-hidden bg-card border border-border">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-2xl font-bold text-foreground">Admin Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="uploads" className="w-full">
          <TabsList className="flex border-b border-border bg-secondary/50 w-full rounded-none">
            <TabsTrigger value="uploads" className="tab-btn flex-1" data-testid="tab-uploads">Uploads</TabsTrigger>
            <TabsTrigger value="appearance" className="tab-btn flex-1" data-testid="tab-appearance">Appearance</TabsTrigger>
            <TabsTrigger value="socials" className="tab-btn flex-1" data-testid="tab-socials">Socials</TabsTrigger>
            <TabsTrigger value="security" className="tab-btn flex-1" data-testid="tab-security">Security</TabsTrigger>
          </TabsList>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <TabsContent value="uploads" className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Add to Portfolio</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">Title / Batch Name</Label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter title or batch name"
                    className="w-full bg-input border border-border text-foreground"
                    data-testid="input-title"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">Location</Label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter location"
                    className="w-full bg-input border border-border text-foreground"
                    data-testid="input-location"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">Media Type</Label>
                  <Select value={formData.mediaType} onValueChange={(value) => setFormData({ ...formData, mediaType: value as MediaType })}>
                    <SelectTrigger className="w-full bg-input border border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MediaType.PHOTO_4K}>4K Photo</SelectItem>
                      <SelectItem value={MediaType.PANORAMA_180}>180° Panorama</SelectItem>
                      <SelectItem value={MediaType.PANORAMA_360}>360° Panorama</SelectItem>
                      <SelectItem value={MediaType.VIDEO}>Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    {formData.mediaType === MediaType.VIDEO ? "YouTube URL" : "Image URL"}
                  </Label>
                  <Input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder={formData.mediaType === MediaType.VIDEO ? "https://youtube.com/watch?v=..." : "https://images.unsplash.com/..."}
                    className="w-full bg-input border border-border text-foreground"
                    data-testid="input-url"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg py-4"
                  disabled={createMediaMutation.isPending}
                  data-testid="button-add-portfolio"
                >
                  {createMediaMutation.isPending ? "Adding..." : "Add to Portfolio"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">Customize Images</h3>
              
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Hero Background Image URL</Label>
                <Input
                  type="url"
                  value={settingsData.heroImageUrl}
                  onChange={(e) => setSettingsData({ ...settingsData, heroImageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-input border border-border text-foreground mb-4"
                  data-testid="input-hero-image"
                />
                <Button 
                  onClick={() => handleUpdateSetting('hero_image_url', settingsData.heroImageUrl)}
                  className="w-full bg-muted text-muted-foreground hover:bg-muted/80"
                  disabled={updateSettingMutation.isPending}
                  data-testid="button-update-hero"
                >
                  Update Hero Image
                </Button>
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Footer Background Image URL</Label>
                <Input
                  type="url"
                  value={settingsData.footerImageUrl}
                  onChange={(e) => setSettingsData({ ...settingsData, footerImageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-input border border-border text-foreground mb-4"
                  data-testid="input-footer-image"
                />
                <Button 
                  onClick={() => handleUpdateSetting('footer_image_url', settingsData.footerImageUrl)}
                  className="w-full bg-muted text-muted-foreground hover:bg-muted/80"
                  disabled={updateSettingMutation.isPending}
                  data-testid="button-update-footer"
                >
                  Update Footer Image
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="socials" className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Update Social Links</h3>
              
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">X (Twitter) Profile URL</Label>
                <Input
                  type="url"
                  value={settingsData.twitterUrl}
                  onChange={(e) => setSettingsData({ ...settingsData, twitterUrl: e.target.value })}
                  placeholder="https://x.com/yourprofile"
                  className="w-full bg-input border border-border text-foreground"
                  data-testid="input-twitter"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">YouTube Channel URL</Label>
                <Input
                  type="url"
                  value={settingsData.youtubeUrl}
                  onChange={(e) => setSettingsData({ ...settingsData, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/yourchannel"
                  className="w-full bg-input border border-border text-foreground"
                  data-testid="input-youtube"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Personal Page URL</Label>
                <Input
                  type="url"
                  value={settingsData.personalUrl}
                  onChange={(e) => setSettingsData({ ...settingsData, personalUrl: e.target.value })}
                  placeholder="https://your-site.com"
                  className="w-full bg-input border border-border text-foreground"
                  data-testid="input-personal"
                />
              </div>

              <Button 
                onClick={() => {
                  handleUpdateSetting('twitter_url', settingsData.twitterUrl);
                  handleUpdateSetting('youtube_url', settingsData.youtubeUrl);
                  handleUpdateSetting('personal_url', settingsData.personalUrl);
                }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={updateSettingMutation.isPending}
                data-testid="button-save-socials"
              >
                Save Social Links
              </Button>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Change Password</h3>
              
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Current Password</Label>
                <Input
                  type="password"
                  className="w-full bg-input border border-border text-foreground"
                  data-testid="input-current-password"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">New Password (min. 8 characters)</Label>
                <Input
                  type="password"
                  className="w-full bg-input border border-border text-foreground"
                  data-testid="input-new-password"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</Label>
                <Input
                  type="password"
                  className="w-full bg-input border border-border text-foreground"
                  data-testid="input-confirm-password"
                />
              </div>

              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                data-testid="button-update-password"
              >
                Update Password
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
