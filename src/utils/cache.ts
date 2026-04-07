import { readFile, writeFile, mkdir, access, constants } from 'fs/promises';
import { join } from 'path';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class FileCache {
  private cacheDir: string;

  constructor(cacheDir: string = join(process.cwd(), 'data', 'cache')) {
    this.cacheDir = cacheDir;
  }

  private getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    return join(this.cacheDir, `${safeKey}.json`);
  }

  async ensureCacheDir(): Promise<void> {
    try {
      await access(this.cacheDir, constants.F_OK);
    } catch {
      await mkdir(this.cacheDir, { recursive: true });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.ensureCacheDir();
      const filePath = this.getFilePath(key);
      await access(filePath, constants.F_OK);
      
      const content = await readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);
      
      const now = Date.now();
      const age = now - entry.timestamp;
      
      if (age > entry.ttl) {
        console.log(`[FileCache] Cache expired for key: ${key} (age: ${age}ms)`);
        return null;
      }
      
      console.log(`[FileCache] Cache hit for key: ${key} (age: ${age}ms)`);
      return entry.data;
    } catch (error) {
      console.log(`[FileCache] Cache miss for key: ${key}`);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttlMs: number = 3600000): Promise<void> {
    try {
      await this.ensureCacheDir();
      const filePath = this.getFilePath(key);
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs
      };
      
      await writeFile(filePath, JSON.stringify(entry, null, 2));
      console.log(`[FileCache] Cached key: ${key} (TTL: ${ttlMs}ms)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[FileCache] Error setting cache for key: ${key}`, errorMessage);
    }
  }

  async clear(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      await access(filePath, constants.F_OK);
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
      console.log(`[FileCache] Cleared cache for key: ${key}`);
    } catch (error) {
      // File doesn't exist, nothing to clear
    }
  }
}