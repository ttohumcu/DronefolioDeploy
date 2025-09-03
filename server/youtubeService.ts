export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
}

export interface YouTubeChannelInfo {
  channelId: string;
  channelTitle: string;
}

export class YouTubeService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Extract channel ID from various YouTube URL formats
  private extractChannelId(channelUrl: string): string | null {
    const patterns = [
      // Channel ID format: https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxxx
      /youtube\.com\/channel\/([a-zA-Z0-9_-]{24})/,
      // Custom URL format: https://www.youtube.com/@channelname
      /youtube\.com\/@([a-zA-Z0-9_-]+)/,
      // Custom URL format: https://www.youtube.com/c/channelname
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      // User format: https://www.youtube.com/user/username
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = channelUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  // Get channel info from custom URL or handle
  private async getChannelInfo(channelIdentifier: string): Promise<YouTubeChannelInfo | null> {
    try {
      // First try as channel ID
      if (channelIdentifier.length === 24) {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIdentifier}&key=${this.apiKey}`
        );
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          return {
            channelId: data.items[0].id,
            channelTitle: data.items[0].snippet.title
          };
        }
      }

      // Try as custom URL or handle
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=${channelIdentifier}&key=${this.apiKey}`
      );
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        return {
          channelId: data.items[0].id,
          channelTitle: data.items[0].snippet.title
        };
      }

      // Try as custom URL
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${channelIdentifier}&key=${this.apiKey}`
      );
      const searchData = await searchResponse.json();
      
      if (searchData.items && searchData.items.length > 0) {
        return {
          channelId: searchData.items[0].snippet.channelId,
          channelTitle: searchData.items[0].snippet.title
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting channel info:', error);
      return null;
    }
  }

  // Get latest videos from a channel
  async getLatestVideos(channelUrl: string, maxResults: number = 24): Promise<YouTubeVideo[]> {
    try {
      const channelIdentifier = this.extractChannelId(channelUrl);
      if (!channelIdentifier) {
        throw new Error('Invalid YouTube channel URL format');
      }

      const channelInfo = await this.getChannelInfo(channelIdentifier);
      if (!channelInfo) {
        throw new Error('Could not find YouTube channel');
      }

      // Get videos from the channel
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${this.apiKey}&channelId=${channelInfo.channelId}&part=snippet&order=date&type=video&maxResults=${maxResults}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.items) {
        return [];
      }

      return data.items.map((item: any): YouTubeVideo => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      }));
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      throw error;
    }
  }
}