import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { APIKeyConfig, Platform } from '../types/index.js';
import { handleAsyncError, logPlatformError } from '../utils/error-handler.js';

export class APIKeyManager {
  private configPath: string;
  private config: APIKeyConfig;

  constructor(configPath: string = 'data/api-keys.json') {
    this.configPath = configPath;
    this.config = {
      keys: {} as any,
      rotationSchedule: {} as any
    };
  }

  async initialize(): Promise<void> {
    return await handleAsyncError(async () => {
      try {
        const content = await readFile(this.configPath, 'utf-8');
        this.config = JSON.parse(content) as APIKeyConfig;
        console.log('[APIKeyManager] ✓ Loaded existing API key configuration');
      } catch (error) {
        console.log('[APIKeyManager] Creating new API key configuration');
        await this.createDefaultConfig();
      }
      
      // Check environment variables for any missing keys
      await this.loadFromEnvironment();
      
      // Check for expiring keys
      await this.checkKeyExpiry();
      
    }, 'apikey', 'initialize');
  }

  private async createDefaultConfig(): Promise<void> {
    this.config = {
      keys: {
        github: {
          key: process.env.GITHUB_TOKEN || '',
          lastUsed: new Date(0).toISOString(),
          usageCount: 0,
          rateLimitRemaining: 5000,
          isActive: !!process.env.GITHUB_TOKEN
        },
        reddit: {
          key: process.env.REDDIT_CLIENT_ID || '',
          lastUsed: new Date(0).toISOString(),
          usageCount: 0,
          rateLimitRemaining: 60,
          isActive: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET)
        },
        stackoverflow: {
          key: process.env.STACKOVERFLOW_KEY || '',
          lastUsed: new Date(0).toISOString(),
          usageCount: 0,
          rateLimitRemaining: 300,
          isActive: !!process.env.STACKOVERFLOW_KEY
        },
        hackernews: {
          key: '', // No API key required for Hacker News
          lastUsed: new Date(0).toISOString(),
          usageCount: 0,
          rateLimitRemaining: 1000,
          isActive: true
        },
        huggingface: {
          key: process.env.HUGGINGFACE_TOKEN || '',
          lastUsed: new Date(0).toISOString(),
          usageCount: 0,
          rateLimitRemaining: 1000,
          isActive: !!process.env.HUGGINGFACE_TOKEN
        },
        x: {
          key: process.env.X_BEARER_TOKEN || '',
          lastUsed: new Date(0).toISOString(),
          usageCount: 0,
          rateLimitRemaining: 300,
          isActive: !!process.env.X_BEARER_TOKEN
        }
      } as any,
      rotationSchedule: {
        github: {
          frequency: 'never',
          lastRotation: new Date().toISOString()
        },
        reddit: {
          frequency: 'monthly',
          lastRotation: new Date().toISOString()
        },
        stackoverflow: {
          frequency: 'never',
          lastRotation: new Date().toISOString()
        },
        hackernews: {
          frequency: 'never',
          lastRotation: new Date().toISOString()
        },
        huggingface: {
          frequency: 'monthly',
          lastRotation: new Date().toISOString()
        },
        x: {
          frequency: 'monthly',
          lastRotation: new Date().toISOString()
        }
      } as any
    };

    await this.saveConfig();
  }

  private async loadFromEnvironment(): Promise<void> {
    const envMappings = {
      GITHUB_TOKEN: 'github',
      REDDIT_CLIENT_ID: 'reddit',
      REDDIT_CLIENT_SECRET: 'reddit',
      STACKOVERFLOW_KEY: 'stackoverflow',
        HUGGINGFACE_TOKEN: 'huggingface',
      X_BEARER_TOKEN: 'x',
      X_API_KEY: 'x',
      X_API_SECRET: 'x'
    };

    let updated = false;

    for (const [envVar, platform] of Object.entries(envMappings)) {
      const value = process.env[envVar];
      if (value && this.config.keys[platform as Platform]) {
        const currentKey = this.config.keys[platform as Platform].key;
        
        // Update if different or empty
        if (!currentKey || currentKey !== value) {
          console.log(`[APIKeyManager] Updating ${platform} key from environment`);
          this.config.keys[platform as Platform].key = value;
          this.config.keys[platform as Platform].isActive = true;
          updated = true;
        }
      }
    }

    if (updated) {
      await this.saveConfig();
    }
  }

  private async checkKeyExpiry(): Promise<void> {
    const now = new Date();
    
    for (const [platform, keyConfig] of Object.entries(this.config.keys)) {
      if (keyConfig.expiresAt) {
        const expiryDate = new Date(keyConfig.expiresAt);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 7) {
          console.warn(`[APIKeyManager] ⚠️ ${platform} API key expires in ${daysUntilExpiry} days`);
          
          if (daysUntilExpiry <= 1) {
            console.error(`[APIKeyManager] ✗ ${platform} API key expires today!`);
            keyConfig.isActive = false;
          }
        }
      }
    }
  }

  async saveConfig(): Promise<void> {
    return await handleAsyncError(async () => {
      await writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      console.log('[APIKeyManager] ✓ Saved API key configuration');
    }, 'apikey', 'saveConfig');
  }

  // Get API key for platform
  getKey(platform: Platform): string | null {
    const keyConfig = this.config.keys[platform];
    
    if (!keyConfig || !keyConfig.isActive) {
      console.warn(`[APIKeyManager] No active key available for ${platform}`);
      return null;
    }

    if (keyConfig.rateLimitRemaining <= 0) {
      console.warn(`[APIKeyManager] Rate limit exceeded for ${platform}`);
      return null;
    }

    return keyConfig.key;
  }

  // Update key usage
  recordUsage(platform: Platform, remaining?: number): void {
    const keyConfig = this.config.keys[platform];
    
    if (!keyConfig) return;

    keyConfig.lastUsed = new Date().toISOString();
    keyConfig.usageCount++;
    
    if (remaining !== undefined) {
      keyConfig.rateLimitRemaining = remaining;
    }

    console.debug(`[APIKeyManager] ${platform} usage: ${keyConfig.usageCount}, remaining: ${keyConfig.rateLimitRemaining}`);
  }

  // Get platform configuration for API clients
  getPlatformConfig(platform: Platform): any {
    const key = this.getKey(platform);
    
    switch (platform) {
      case 'github':
        return key ? { token: key } : null;
        
      case 'reddit':
        return key && process.env.REDDIT_CLIENT_SECRET ? {
          clientId: key,
          clientSecret: process.env.REDDIT_CLIENT_SECRET,
          username: process.env.REDDIT_USERNAME || '',
          password: process.env.REDDIT_PASSWORD || '',
          subreddits: ['LocalLLaMA', 'MachineLearning', 'OpenAI', 'StableDiffusion']
        } : null;
        
      case 'stackoverflow':
        return key ? { key: key } : null;
        
      case 'hackernews':
        return { apiKey: null }; // No API key needed
        
      case 'huggingface':
        return key ? { token: key } : null;
        
      case 'x':
        return key ? { bearerToken: key } : null;
        
      default:
        return null;
    }
  }

  // Get all active platforms
  getActivePlatforms(): Platform[] {
    return Object.entries(this.config.keys)
      .filter(([_, config]) => config.isActive && config.key)
      .map(([platform, _]) => platform as Platform);
  }

  // Get usage statistics
  getUsageStats(): Record<Platform, {
    isActive: boolean;
    usageCount: number;
    rateLimitRemaining: number;
    lastUsed: string;
    expiresAt?: string;
  }> {
    const stats: any = {};
    
    for (const [platform, config] of Object.entries(this.config.keys)) {
      stats[platform] = {
        isActive: config.isActive,
        usageCount: config.usageCount,
        rateLimitRemaining: config.rateLimitRemaining,
        lastUsed: config.lastUsed,
        expiresAt: config.expiresAt
      };
    }
    
    return stats;
  }

  // Rotate key if needed
  async rotateKey(platform: Platform): Promise<boolean> {
    return await handleAsyncError(async () => {
      const schedule = this.config.rotationSchedule[platform];
      
      if (!schedule || schedule.frequency === 'never') {
        return false;
      }

      const now = new Date();
      const lastRotation = new Date(schedule.lastRotation);
      
      let shouldRotate = false;
      
      switch (schedule.frequency) {
        case 'daily':
          shouldRotate = now.getDate() !== lastRotation.getDate();
          break;
        case 'weekly':
          shouldRotate = now.getTime() - lastRotation.getTime() > 7 * 24 * 60 * 60 * 1000;
          break;
        case 'monthly':
          shouldRotate = now.getMonth() !== lastRotation.getMonth() || now.getFullYear() !== lastRotation.getFullYear();
          break;
      }

      if (shouldRotate) {
        console.log(`[APIKeyManager] Rotating ${platform} API key`);
        
        // In a real implementation, this would generate or fetch a new key
        // For now, we'll just update the rotation timestamp
        schedule.lastRotation = now.toISOString();
        
        // Calculate next rotation
        const nextRotation = new Date(now);
        switch (schedule.frequency) {
          case 'daily':
            nextRotation.setDate(nextRotation.getDate() + 1);
            break;
          case 'weekly':
            nextRotation.setDate(nextRotation.getDate() + 7);
            break;
          case 'monthly':
            nextRotation.setMonth(nextRotation.getMonth() + 1);
            break;
        }
        schedule.nextRotation = nextRotation.toISOString();
        
        await this.saveConfig();
        return true;
      }

      return false;
    }, 'apikey', 'rotateKey');
  }

  // Validate all keys
  async validateAllKeys(): Promise<Record<Platform, boolean>> {
    const results: Record<Platform, boolean> = {} as any;
    
    for (const [platform, config] of Object.entries(this.config.keys)) {
      if (!config.isActive || !config.key) {
        results[platform as Platform] = false;
        continue;
      }

      try {
        // Basic validation - could be enhanced with actual API calls
        const isValid = await this.validateKey(platform as Platform, config.key);
        results[platform as Platform] = isValid;
        
        if (!isValid) {
          console.warn(`[APIKeyManager] ${platform} key validation failed`);
          config.isActive = false;
        }
      } catch (error) {
        console.error(`[APIKeyManager] ${platform} key validation error:`, error);
        results[platform as Platform] = false;
        config.isActive = false;
      }
    }

    await this.saveConfig();
    return results;
  }

  private async validateKey(platform: Platform, key: string): Promise<boolean> {
    // Basic validation - could be enhanced with actual API calls
    if (!key || key.length < 10) {
      return false;
    }

    // Platform-specific validation
    switch (platform) {
      case 'github':
        return key.startsWith('ghp_') && key.length > 20;
      case 'reddit':
        return key.length > 10;
      case 'stackoverflow':
        return key.length > 10;
      case 'huggingface':
        return key.startsWith('hf_') && key.length > 20;
      case 'x':
        return key.length > 10;
      default:
        return true;
    }
  }

  // Export configuration (excluding sensitive data)
  exportSafeConfig(): any {
    return {
      activePlatforms: this.getActivePlatforms(),
      usageStats: this.getUsageStats(),
      rotationSchedule: this.config.rotationSchedule
    };
  }
}