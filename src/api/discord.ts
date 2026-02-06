import { BasePlatformAPI, AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index.js';

interface DiscordMessage {
  id: string;
  content: string;
  author: {
    username: string;
    id: string;
    avatar?: string;
  };
  timestamp: string;
  edited_timestamp: string | null;
  channel_id: string;
  guild_id?: string;
  attachments: Array<{
    url: string;
    filename: string;
    content_type?: string;
  }>;
  embeds: unknown[];
  reactions?: Array<{
    count: number;
    emoji: {
      name: string;
    };
  }>;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  guild_id: string;
}

export class DiscordAPI extends BasePlatformAPI {
  readonly platform: Platform = 'discord';
  readonly rateLimitPerHour = 1000; // Discord has complex rate limits per endpoint
  
  private token: string;
  private channelIds: string[];

  constructor(config: { token: string; channels?: string[] }) {
    super();
    this.token = config.token;
    this.channelIds = config.channels || [];
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    const items: AggregatedItem[] = [];
    
    try {
      // Fetch messages from each channel
      for (const channelId of this.channelIds.slice(0, 5)) {
        const messages = await this.fetchChannelMessages(channelId);
        items.push(...messages.map(msg => this.normalizeMessage(msg)));
      }

      return {
        items: items.slice(0, options.limit || 25),
        hasMore: false
      };
    } catch (error) {
      throw this.handleError(error, 'fetchItems');
    }
  }

  private async fetchChannelMessages(channelId: string): Promise<DiscordMessage[]> {
    await this.rateLimit();

    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages?limit=10`,
      {
        headers: {
          'Authorization': `Bot ${this.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SocialMediaAggregator/1.0'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        console.warn(`[Discord] No access to channel ${channelId}`);
        return [];
      }
      throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async fetchGuildChannels(guildId: string): Promise<DiscordChannel[]> {
    await this.rateLimit();

    const response = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: {
          'Authorization': `Bot ${this.token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SocialMediaAggregator/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private normalizeMessage(message: DiscordMessage): AggregatedItem {
    const reactionCount = message.reactions?.reduce((sum, r) => sum + r.count, 0) || 0;
    
    return {
      id: `discord-${message.id}`,
      platform: 'discord',
      type: 'comment',
      title: `Message in ${message.channel_id}`,
      content: message.content || '(No text content)',
      author: {
        name: message.author.username,
        avatar: message.author.avatar 
          ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`
          : undefined
      },
      timestamp: message.timestamp,
      url: `https://discord.com/channels/${message.guild_id || '@me'}/${message.channel_id}/${message.id}`,
      metrics: {
        likes: reactionCount
      },
      tags: message.attachments.length > 0 ? ['has-attachments'] : [],
      raw: message
    };
  }
}
