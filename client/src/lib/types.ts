export interface FilterState {
  type: string;
  location: string;
  search: string;
}

export interface ViewerState {
  isOpen: boolean;
  mediaItem: any | null;
}

export interface AdminState {
  isOpen: boolean;
  activeTab: string;
}
