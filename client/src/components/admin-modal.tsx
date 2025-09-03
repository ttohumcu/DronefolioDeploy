import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MediaType, type MediaItem } from "@shared/schema";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: MediaItem | null;
}

export function AdminModal({ isOpen, onClose, editingItem }: AdminModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    mediaType: "4K Photo" as MediaType,
    url: "",
    thumbnailUrl: ""
  });

  // Load editing item data when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        location: editingItem.location || "",
        mediaType: editingItem.mediaType as MediaType,
        url: editingItem.url,
        thumbnailUrl: editingItem.thumbnailUrl || ""
      });
    } else {
      setFormData({
        title: "",
        location: "",
        mediaType: "4K Photo" as MediaType,
        url: "",
        thumbnailUrl: ""
      });
    }
  }, [editingItem]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedHeroFile, setSelectedHeroFile] = useState<File | null>(null);
  const [selectedFooterFile, setSelectedFooterFile] = useState<File | null>(null);

  const [settingsData, setSettingsData] = useState({
    heroImageUrl: "",
    footerImageUrl: "",
    twitterUrl: "",
    youtubeUrl: "",
    personalUrl: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isOpen
  });

  // Load settings data when modal opens
  useEffect(() => {
    if (settings && Array.isArray(settings)) {
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
  }, [settings]);

  const saveMediaMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingItem) {
        await apiRequest("PUT", `/api/media/${editingItem.id}`, data);
      } else {
        await apiRequest("POST", "/api/media", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: editingItem ? "Media item updated successfully!" : "Media item added to portfolio successfully!"
      });
      setFormData({
        title: "",
        location: "",
        mediaType: "4K Photo" as MediaType,
        url: "",
        thumbnailUrl: ""
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: editingItem ? "Failed to update media item." : "Failed to add media item to portfolio.",
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

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      await apiRequest("PUT", "/api/user/password", { currentPassword, newPassword });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password updated successfully!"
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to update password.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For videos, location is not required
    const isVideo = formData.mediaType === MediaType.VIDEO;
    const missingFields = [];
    
    if (!formData.title) missingFields.push("title");
    if (!isVideo && !formData.location) missingFields.push("location");
    if (!formData.url) missingFields.push("URL");
    
    if (missingFields.length > 0) {
      toast({
        title: "Error",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive"
      });
      return;
    }
    saveMediaMutation.mutate(formData);
  };

  const handleUpdateSetting = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value });
  };

  const handlePasswordUpdate = () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error", 
        description: "New password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirmation do not match.",
        variant: "destructive"
      });
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const importVideosMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/youtube/import", { channelUrl: settingsData.youtubeUrl });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Success",
        description: `Successfully imported ${data.count} videos from your YouTube channel!`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import YouTube videos. Please check your channel URL and try again.",
        variant: "destructive"
      });
    }
  });

  const handleImportYouTubeVideos = () => {
    if (!settingsData.youtubeUrl) {
      toast({
        title: "Error",
        description: "Please set your YouTube channel URL first",
        variant: "destructive"
      });
      return;
    }
    importVideosMutation.mutate();
  };

  const handleUploadAndUpdateSetting = async (settingKey: string, file: File | null) => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select an image file first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload the file first
      const uploadResult = await uploadFileMutation.mutateAsync(file);
      
      // Then update the setting with the uploaded URL
      handleUpdateSetting(settingKey, uploadResult.url);
      
      // Clear the selected file
      if (settingKey === 'hero_image_url') {
        setSelectedHeroFile(null);
      } else if (settingKey === 'footer_image_url') {
        setSelectedFooterFile(null);
      }
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not upload the background image.",
        variant: "destructive"
      });
    }
  };

  const analyzePhotoMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await fetch("/api/ai/analyze-photo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("AI Analysis success data:", data);
      setFormData(prev => ({
        ...prev,
        title: data.title || "",
        location: data.location || ""
      }));
      toast({
        title: "AI Analysis Complete",
        description: "Title and location have been generated from your photo!"
      });
    },
    onError: (error) => {
      console.error("AI analysis error:", error);
      toast({
        title: "AI Analysis Failed",
        description: "Could not analyze the photo. Please enter title and location manually.",
        variant: "destructive"
      });
    }
  });

  const handleAIAnalysis = async () => {
    if (formData.mediaType === MediaType.VIDEO) {
      // For videos, we analyze the YouTube URL directly
      if (!formData.url) {
        toast({
          title: "No Video URL",
          description: "Please enter a YouTube URL first.",
          variant: "destructive"
        });
        return;
      }
      
      analyzePhotoMutation.mutate(formData.url);
      return;
    }

    if (!selectedFile) {
      toast({
        title: "No Image Selected",
        description: "Please select an image file first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const uploadResult = await uploadFileMutation.mutateAsync(selectedFile);
      // Convert relative URL to full URL for AI analysis
      const fullUrl = `${window.location.origin}${uploadResult.url}`;
      analyzePhotoMutation.mutate(fullUrl);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not upload the image for AI analysis.",
        variant: "destructive"
      });
    }
  };

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl || ""
      }));
      toast({
        title: "Upload Complete",
        description: "Your image has been uploaded successfully!"
      });
      setSelectedFile(null);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload the image. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPG, PNG, WebP, etc.)",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (500MB max)
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File Too Large", 
          description: "Please select an image smaller than 500MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      uploadFileMutation.mutate(selectedFile);
    }
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

                {formData.mediaType !== MediaType.VIDEO && (
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
                )}

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">Media Type</Label>
                  <Select value={formData.mediaType} onValueChange={(value) => setFormData({ ...formData, mediaType: value as MediaType })}>
                    <SelectTrigger className="w-full bg-input border border-border text-foreground">
                      <SelectValue placeholder="Select media type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MediaType.PHOTO_4K}>{MediaType.PHOTO_4K}</SelectItem>
                      <SelectItem value={MediaType.PANORAMA_180}>{MediaType.PANORAMA_180}</SelectItem>
                      <SelectItem value={MediaType.PANORAMA_360}>{MediaType.PANORAMA_360}</SelectItem>
                      <SelectItem value={MediaType.VIDEO}>{MediaType.VIDEO}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    {formData.mediaType === MediaType.VIDEO ? "YouTube URL" : "Image"}
                  </Label>
                  
                  {formData.mediaType === MediaType.VIDEO ? (
                    <Input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full bg-input border border-border text-foreground"
                      data-testid="input-url"
                    />
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="w-full text-sm file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
                        data-testid="input-file"
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Button 
                  type="button"
                  onClick={handleAIAnalysis}
                  disabled={analyzePhotoMutation.isPending || uploadFileMutation.isPending || (!formData.url && !selectedFile)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 transition-all duration-200"
                  data-testid="button-ai-analyze"
                >
                  {(analyzePhotoMutation.isPending || uploadFileMutation.isPending) ? (
                    formData.mediaType === MediaType.VIDEO ? "✨ Analyzing Video..." : "✨ Analyzing Photo..."
                  ) : (
                    "✨ Ask AI for Title & Location"
                  )}
                </Button>

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-lg py-4"
                  disabled={saveMediaMutation.isPending}
                  data-testid="button-add-portfolio"
                >
                  {saveMediaMutation.isPending ? (editingItem ? "Updating..." : "Adding...") : (editingItem ? "Update Portfolio" : "Add to Portfolio")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">Customize Images</h3>
              
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Hero Background Image</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 500 * 1024 * 1024) {
                        toast({
                          title: "File Too Large",
                          description: "Please select an image smaller than 500MB",
                          variant: "destructive"
                        });
                        return;
                      }
                      setSelectedHeroFile(file);
                    }
                  }}
                  className="w-full text-sm file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer mb-4"
                  data-testid="input-hero-file"
                />
                {selectedHeroFile && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Selected: {selectedHeroFile.name} ({(selectedHeroFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <Button 
                  onClick={() => handleUploadAndUpdateSetting('hero_image_url', selectedHeroFile)}
                  className="w-full bg-muted text-muted-foreground hover:bg-muted/80"
                  disabled={updateSettingMutation.isPending || !selectedHeroFile}
                  data-testid="button-update-hero"
                >
                  Upload & Update Hero Image
                </Button>
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Footer Background Image</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 500 * 1024 * 1024) {
                        toast({
                          title: "File Too Large",
                          description: "Please select an image smaller than 500MB",
                          variant: "destructive"
                        });
                        return;
                      }
                      setSelectedFooterFile(file);
                    }
                  }}
                  className="w-full text-sm file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer mb-4"
                  data-testid="input-footer-file"
                />
                {selectedFooterFile && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Selected: {selectedFooterFile.name} ({(selectedFooterFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <Button 
                  onClick={() => handleUploadAndUpdateSetting('footer_image_url', selectedFooterFile)}
                  className="w-full bg-muted text-muted-foreground hover:bg-muted/80"
                  disabled={updateSettingMutation.isPending || !selectedFooterFile}
                  data-testid="button-update-footer"
                >
                  Upload & Update Footer Image
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

              <div className="space-y-4">
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
                
                <Button 
                  onClick={handleImportYouTubeVideos}
                  className="w-full bg-red-600 text-white hover:bg-red-700 font-semibold"
                  disabled={importVideosMutation.isPending || !settingsData.youtubeUrl}
                  data-testid="button-import-videos"
                >
                  {importVideosMutation.isPending ? "Importing..." : "Import Latest 24 YouTube Videos"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Change Password</h3>
              
              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Current Password</Label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full bg-input border border-border text-foreground"
                  data-testid="input-current-password"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">New Password (min. 8 characters)</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full bg-input border border-border text-foreground"
                  data-testid="input-new-password"
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full bg-input border border-border text-foreground"
                  data-testid="input-confirm-password"
                />
              </div>

              <Button 
                onClick={handlePasswordUpdate}
                disabled={updatePasswordMutation.isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                data-testid="button-update-password"
              >
                {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
