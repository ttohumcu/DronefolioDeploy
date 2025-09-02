
export enum MediaType {
  PHOTO_4K = '4K Photo',
  PANORAMA_180 = '180° Panorama',
  PANORAMA_360 = '360° Panorama',
  VIDEO = 'Video',
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  url: string; 
  location: string;
}

export enum View {
  PORTFOLIO = 'portfolio',
  ADMIN = 'admin',
}
