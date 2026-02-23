import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { 
  VerificationDatabase, 
  EnhancedModelData, 
  VerificationHistoryEntry, 
  UpdateState, 
  APIKeyConfig,
  PipelineConfig,
  AggregatedItem,
  ModelWithFeedback,
  Platform 
} from '../types/index.js';
import { 
  handleAsyncError, 
  logPlatformError,
  saveStateFile,
  loadStateFile
} from '../utils/error-handler.js';

export class VerificationDataManager {
  private dataDir: string;
  private databaseFile: string;
  private historyFile: string;
  private updateStateFile: string;
  private apiKeysFile: string;
  private pipelineConfigFile: string;

  constructor(dataDir: string = 'data') {
    this.dataDir = dataDir;
    this.databaseFile = join(dataDir, 'verification-database.json');
    this.historyFile = join(dataDir, 'verification-history.json');
    this.updateStateFile = join(dataDir, 'update-state.json');
    this.apiKeysFile = join(dataDir, 'api-keys.json');
    this.pipelineConfigFile = join(dataDir, 'pipeline-config.json');
  }

  // Database operations
  async loadDatabase(): Promise<VerificationDatabase> {
    return await handleAsyncError(async () => {
      try {
        const content = await readFile(this.databaseFile, 'utf-8');
        const db = JSON.parse(content) as VerificationDatabase;
        
        // Validate and migrate if needed
        return this.migrateDatabase(db);
      } catch (error) {
        // Create new database if doesn't exist
        console.log('[DataManager] Creating new verification database');
        return await this.createFreshDatabase();
      }
    }, 'datastore', 'loadDatabase');
  }

  async saveDatabase(database: VerificationDatabase): Promise<void> {
    return await handleAsyncError(async () => {
      database.lastUpdated = new Date().toISOString();
      database.version = '2.0.0';
      
      await writeFile(this.databaseFile, JSON.stringify(database, null, 2));
      console.log(`[DataManager] ✓ Saved database with ${database.models.length} models`);
    }, 'datastore', 'saveDatabase');
  }

  private async createFreshDatabase(): Promise<VerificationDatabase> {
    // Load existing aggregated data to migrate
    const existingDataPath = join(this.dataDir, 'aggregated-data.json');
    let existingItems: AggregatedItem[] = [];
    
    try {
      const content = await readFile(existingDataPath, 'utf-8');
      const existing = JSON.parse(content) as { items: AggregatedItem[] };
      existingItems = existing.items || [];
    } catch (error) {
      console.log('[DataManager] No existing data found, starting fresh');
    }

    const models: EnhancedModelData[] = existingItems
      .filter(item => item.platform === 'modelsdev')
      .map(item => this.convertToEnhancedModel(item as ModelWithFeedback));

    return {
      models,
      verificationHistory: [],
      lastUpdated: new Date().toISOString(),
      version: '2.0.0'
    };
  }

  private migrateDatabase(db: VerificationDatabase): VerificationDatabase {
    // Handle future migrations here
    if (!db.version || db.version < '2.0.0') {
      console.log('[DataManager] Migrating database to v2.0.0');
      return this.migrateToV2(db);
    }
    return db;
  }

  private migrateToV2(db: any): VerificationDatabase {
    return {
      models: (db.models || []).map((model: any) => this.convertToEnhancedModel(model)),
      verificationHistory: db.verificationHistory || [],
      lastUpdated: db.lastUpdated || new Date().toISOString(),
      version: '2.0.0'
    };
  }

  private convertToEnhancedModel(item: ModelWithFeedback): EnhancedModelData {
    const now = new Date().toISOString();
    
    return {
      ...item,
      firstSeen: now,
      lastVerified: now,
      verificationCount: 1,
      platformBreakdown: this.extractPlatformBreakdown(item),
      verificationTrend: {
        last7Days: Array(7).fill(item.feedbackSummary?.verificationScore || 0),
        last30Days: Array(30).fill(item.feedbackSummary?.verificationScore || 0),
        overall: 'unknown'
      },
      availabilityHistory: [{
        timestamp: now,
        status: item.feedbackSummary?.availabilityStatus || 'unknown',
        reportedBy: [],
        issues: item.feedbackSummary?.commonIssues || []
      }],
      currentAvailability: item.feedbackSummary?.availabilityStatus || 'unknown'
    };
  }

  private extractPlatformBreakdown(item: ModelWithFeedback) {
    const breakdown: Record<string, any> = {};
    
    // Group feedback by platform
    const platformGroups = item.feedback.reduce((groups, feedback) => {
      if (!groups[feedback.platform]) {
        groups[feedback.platform] = [];
      }
      groups[feedback.platform].push(feedback);
      return groups;
    }, {} as Record<Platform, any[]>);

    // Calculate platform-specific metrics
    Object.entries(platformGroups).forEach(([platform, feedbacks]) => {
      const sentiments = feedbacks.map(f => f.sentiment || 'neutral');
      const positiveCount = sentiments.filter(s => s === 'positive').length;
      const averageSentiment = (positiveCount / sentiments.length) * 100;
      
      const issues = new Set<string>();
      feedbacks.forEach(f => {
        const content = (f.content + ' ' + f.title).toLowerCase();
        const issueKeywords = ['rate limit', 'error', 'unavailable', 'paid only'];
        issueKeywords.forEach(keyword => {
          if (content.includes(keyword)) issues.add(keyword);
        });
      });

      breakdown[platform] = {
        mentionCount: feedbacks.length,
        lastMention: new Date(Math.max(...feedbacks.map(f => new Date(f.timestamp).getTime()))).toISOString(),
        averageSentiment: Math.round(averageSentiment),
        commonIssues: Array.from(issues),
        lastChecked: new Date().toISOString()
      };
    });

    return breakdown;
  }

  // Model operations
  async updateModel(modelId: string, updates: Partial<EnhancedModelData>): Promise<void> {
    const db = await this.loadDatabase();
    const modelIndex = db.models.findIndex(m => m.id === modelId);
    
    if (modelIndex === -1) {
      throw new Error(`Model ${modelId} not found`);
    }

    db.models[modelIndex] = {
      ...db.models[modelIndex],
      ...updates,
      lastVerified: new Date().toISOString(),
      verificationCount: db.models[modelIndex].verificationCount + 1
    };

    await this.saveDatabase(db);
  }

  async addVerificationHistory(entry: Omit<VerificationHistoryEntry, 'id'>): Promise<void> {
    const db = await this.loadDatabase();
    
    const historyEntry: VerificationHistoryEntry = {
      ...entry,
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    db.verificationHistory.push(historyEntry);
    
    // Keep only last 1000 entries per model
    const modelHistory = db.verificationHistory.filter(h => h.modelId === entry.modelId);
    if (modelHistory.length > 1000) {
      db.verificationHistory = db.verificationHistory.filter((h, i) => {
        if (h.modelId !== entry.modelId) return true;
        return modelHistory.indexOf(h) >= modelHistory.length - 1000;
      });
    }

    await this.saveDatabase(db);
  }

  // Update state management
  async loadUpdateState(): Promise<UpdateState> {
    const defaultState: UpdateState = {
      lastFullScrape: new Date(0).toISOString(),
      lastIncrementalUpdate: new Date(0).toISOString(),
      platformStates: {} as Record<Platform, any>,
      totalModelsProcessed: 0,
      updatesToday: 0
    };

    return await loadStateFile(this.updateStateFile, defaultState, 'datastore');
  }

  async saveUpdateState(state: UpdateState): Promise<void> {
    await saveStateFile(this.updateStateFile, state, 'datastore');
  }

  // API key management
  async loadAPIKeys(): Promise<APIKeyConfig> {
    const defaultConfig: APIKeyConfig = {
      keys: {} as any,
      rotationSchedule: {} as any
    };

    return await loadStateFile(this.apiKeysFile, defaultConfig, 'datastore');
  }

  async saveAPIKeys(config: APIKeyConfig): Promise<void> {
    await saveStateFile(this.apiKeysFile, config, 'datastore');
  }

  // Pipeline configuration
  async loadPipelineConfig(): Promise<PipelineConfig> {
    const defaultConfig: PipelineConfig = {
      incrementalUpdates: {
        enabled: true,
        intervalMinutes: 15,
        batchSize: 50,
        maxAgeHours: 24
      },
      fullScraping: {
        enabled: true,
        schedule: '0 */6 * * *', // Every 6 hours
        retentionDays: 30
      },
      verification: {
        minimumMentions: 3,
        confidenceThreshold: 0.7,
        platforms: ['github', 'reddit', 'hackernews', 'stackoverflow'],
        deepAnalysisEnabled: true
      }
    };

    return await loadStateFile(this.pipelineConfigFile, defaultConfig, 'datastore');
  }

  async savePipelineConfig(config: PipelineConfig): Promise<void> {
    await saveStateFile(this.pipelineConfigFile, config, 'datastore');
  }

  // Analytics and reporting
  async getModelStatistics() {
    const db = await this.loadDatabase();
    
    const stats = {
      totalModels: db.models.length,
      verifiedModels: db.models.filter(m => m.feedbackSummary.verificationScore > 50).length,
      highlyVerifiedModels: db.models.filter(m => m.feedbackSummary.verificationScore > 80).length,
      availabilityBreakdown: {
        confirmed: db.models.filter(m => m.currentAvailability === 'confirmed').length,
        questioned: db.models.filter(m => m.currentAvailability === 'questioned').length,
        unknown: db.models.filter(m => m.currentAvailability === 'unknown').length,
        deprecated: db.models.filter(m => m.currentAvailability === 'deprecated').length
      },
      platformCoverage: {
        github: db.models.filter(m => m.platformBreakdown.github?.mentionCount || 0 > 0).length,
        reddit: db.models.filter(m => m.platformBreakdown.reddit?.mentionCount || 0 > 0).length,
        hackernews: db.models.filter(m => m.platformBreakdown.hackernews?.mentionCount || 0 > 0).length,
        stackoverflow: db.models.filter(m => m.platformBreakdown.stackoverflow?.mentionCount || 0 > 0).length
      }
    };

    return stats;
  }

  // Cleanup and maintenance
  async cleanupOldData(): Promise<void> {
    const db = await this.loadDatabase();
    const config = await this.loadPipelineConfig();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.fullScraping.retentionDays);
    
    // Clean old history entries
    const originalHistoryCount = db.verificationHistory.length;
    db.verificationHistory = db.verificationHistory.filter(
      entry => new Date(entry.timestamp) > cutoffDate
    );
    
    // Clean old availability entries
    db.models.forEach(model => {
      const originalAvailabilityCount = model.availabilityHistory.length;
      model.availabilityHistory = model.availabilityHistory.filter(
        entry => new Date(entry.timestamp) > cutoffDate
      );
      
      if (model.availabilityHistory.length !== originalAvailabilityCount) {
        console.log(`[DataManager] Cleaned ${originalAvailabilityCount - model.availabilityHistory.length} old availability entries for ${model.id}`);
      }
    });

    if (db.verificationHistory.length !== originalHistoryCount) {
      console.log(`[DataManager] Cleaned ${originalHistoryCount - db.verificationHistory.length} old history entries`);
    }

    await this.saveDatabase(db);
  }
}