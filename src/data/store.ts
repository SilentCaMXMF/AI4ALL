import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { join } from 'path';
import type { AggregatedItem } from '../types/index.js';

interface DataStoreState {
  items: AggregatedItem[];
  lastUpdated: string;
}

export class DataStore {
  private dataDir: string;
  private dataFile: string;
  private items: Map<string, AggregatedItem>;

  constructor(dataDir: string = 'data') {
    this.dataDir = join(process.cwd(), dataDir);
    this.dataFile = join(this.dataDir, 'aggregated-data.json');
    this.items = new Map();
  }

  async initialize(): Promise<void> {
    try {
      await access(this.dataDir);
    } catch {
      await mkdir(this.dataDir, { recursive: true });
    }

    try {
      const content = await readFile(this.dataFile, 'utf-8');
      const data: DataStoreState = JSON.parse(content);
      this.items = new Map(data.items.map(item => [item.id, item]));
    } catch {
      this.items = new Map();
    }
  }

  async save(item: AggregatedItem): Promise<void> {
    await this.initialize();
    
    if (!item.id) {
      throw new Error('Item must have an id');
    }
    
    this.items.set(item.id, item);
    await this.persist();
  }

  async saveMany(items: AggregatedItem[]): Promise<void> {
    await this.initialize();
    
    for (const item of items) {
      if (item.id) {
        this.items.set(item.id, item);
      }
    }
    await this.persist();
  }

  get(id: string): AggregatedItem | undefined {
    return this.items.get(id);
  }

  getAll(): AggregatedItem[] {
    return Array.from(this.items.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getByPlatform(platform: string): AggregatedItem[] {
    return this.getAll().filter(item => item.platform === platform);
  }

  getByType(type: string): AggregatedItem[] {
    return this.getAll().filter(item => item.type === type);
  }

  search(query: string): AggregatedItem[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.content.toLowerCase().includes(lowerQuery) ||
        item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  getStats(): { total: number; byPlatform: Record<string, number> } {
    const byPlatform: Record<string, number> = {};
    
    for (const item of this.items.values()) {
      byPlatform[item.platform] = (byPlatform[item.platform] || 0) + 1;
    }

    return {
      total: this.items.size,
      byPlatform
    };
  }

  async persist(): Promise<void> {
    const data: DataStoreState = {
      items: this.getAll(),
      lastUpdated: new Date().toISOString()
    };

    await writeFile(this.dataFile, JSON.stringify(data, null, 2));
  }
}
