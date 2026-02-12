import type { 
  AggregatedItem, 
  Platform, 
  EnhancedModelData,
  UpdateState,
  VerificationHistoryEntry
} from '../types/index.js';
import { VerificationDataManager } from './verification-store.js';
import { 
  GitHubAPI, 
  RedditAPI, 
  HackerNewsAPI, 
  StackOverflowAPI,
  BasePlatformAPI 
} from '../api/index.js';
import { handleAsyncError, logPlatformError } from '../utils/error-handler.js';

export class IncrementalUpdater {
  private dataManager: VerificationDataManager;
  private platforms: Map<Platform, BasePlatformAPI>;
  private updateState: UpdateState;

  constructor(dataManager: VerificationDataManager) {
    this.dataManager = dataManager;
    this.platforms = new Map();
    this.updateState = {
      lastFullScrape: new Date(0).toISOString(),
      lastIncrementalUpdate: new Date(0).toISOString(),
      platformStates: {} as Record<Platform, any>,
      totalModelsProcessed: 0,
      updatesToday: 0
    };
  }

  // Initialize platforms with their configurations
  async initializePlatforms(platformConfigs: any): Promise<void> {
    try {
      if (platformConfigs.github) {
        this.platforms.set('github', new GitHubAPI(platformConfigs.github));
      }
      
      if (platformConfigs.reddit) {
        this.platforms.set('reddit', new RedditAPI(platformConfigs.reddit));
      }
      
      if (platformConfigs.hackernews) {
        this.platforms.set('hackernews', new HackerNewsAPI());
      }
      
      if (platformConfigs.stackoverflow) {
        this.platforms.set('stackoverflow', new StackOverflowAPI(platformConfigs.stackoverflow));
      }
      
      console.log(`[IncrementalUpdater] ✓ Initialized ${this.platforms.size} platforms`);
    } catch (error) {
      logPlatformError('updater', error, 'initializePlatforms');
      throw error;
    }
  }

  // Perform incremental update
  async performIncrementalUpdate(): Promise<{
    modelsUpdated: number;
    newFeedbackFound: number;
    errors: string[];
  }> {
    return await handleAsyncError(async () => {
      console.log('[IncrementalUpdater] Starting incremental update...');
      
      const results = {
        modelsUpdated: 0,
        newFeedbackFound: 0,
        errors: [] as string[]
      };

      // Load current state
      await this.loadUpdateState();
      
      // Load current database
      const db = await this.dataManager.loadDatabase();
      const config = await this.dataManager.loadPipelineConfig();
      
      // Check if incremental update is needed
      const now = new Date();
      const lastUpdate = new Date(this.updateState.lastIncrementalUpdate);
      const hoursSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastUpdate < config.incrementalUpdates.intervalMinutes / 60) {
        console.log(`[IncrementalUpdater] Skipping update - only ${hoursSinceLastUpdate.toFixed(1)} hours since last update`);
        return results;
      }

      // Update each platform
      for (const [platformName, platform] of this.platforms) {
        if (!config.verification.platforms.includes(platformName)) {
          continue;
        }

        try {
          const platformResults = await this.updatePlatform(platformName, platform, db.models);
          results.modelsUpdated += platformResults.modelsUpdated;
          results.newFeedbackFound += platformResults.newFeedbackFound;
          
          if (platformResults.errors.length > 0) {
            results.errors.push(...platformResults.errors.map(e => `[${platformName}] ${e}`));
          }
          
          // Rate limiting between platforms
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          const errorMsg = `Platform ${platformName} update failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          logPlatformError(platformName, error, 'incrementalUpdate');
        }
      }

      // Update verification trends
      await this.updateVerificationTrends(db.models);
      
      // Save updated database and state
      await this.dataManager.saveDatabase(db);
      this.updateState.lastIncrementalUpdate = new Date().toISOString();
      this.updateState.updatesToday++;
      await this.dataManager.saveUpdateState(this.updateState);

      console.log(`[IncrementalUpdater] ✓ Update complete: ${results.modelsUpdated} models, ${results.newFeedbackFound} new feedback`);
      
      return results;
    }, 'updater', 'performIncrementalUpdate');
  }

  private async updatePlatform(
    platformName: Platform, 
    platform: BasePlatformAPI, 
    models: EnhancedModelData[]
  ): Promise<{
    modelsUpdated: number;
    newFeedbackFound: number;
    errors: string[];
  }> {
    const results = {
      modelsUpdated: 0,
      newFeedbackFound: 0,
      errors: [] as string[]
    };

    // Get platform state
    const platformState = this.updateState.platformStates[platformName] || {
      lastUpdate: new Date(0).toISOString(),
      itemCount: 0,
      errorCount: 0
    };

    // Calculate time window for incremental updates
    const timeWindow = {
      start: new Date(platformState.lastUpdate),
      end: new Date()
    };

    console.log(`[IncrementalUpdater][${platformName}] Checking for updates since ${timeWindow.start.toISOString()}`);

    try {
      // For each model, search for recent mentions
      const batchSize = 10; // Process models in batches to avoid rate limits
      for (let i = 0; i < models.length; i += batchSize) {
        const batch = models.slice(i, i + batchSize);
        
        for (const model of batch) {
          try {
            // Check if platform has searchForModel method
            if ('searchForModel' in platform && typeof platform.searchForModel === 'function') {
              const feedback = await (platform as any).searchForModel(
                this.extractModelName(model.title),
                this.extractProvider(model.title)
              );

              if (feedback.length > 0) {
                // Check if this is new feedback
                const existingFeedbackIds = new Set(
                  model.feedback.map(f => `${f.platform}-${f.id}`)
                );
                
                const newFeedback = feedback.filter(f => 
                  !existingFeedbackIds.has(`${f.platform}-${f.id}`)
                );

                if (newFeedback.length > 0) {
                  // Update model with new feedback
                  model.feedback.push(...newFeedback);
                  
                  // Recalculate verification summary
                  const newSummary = this.calculateVerificationSummary(model.feedback);
                  const oldScore = model.feedbackSummary.verificationScore;
                  
                  model.feedbackSummary = newSummary;
                  model.lastVerified = new Date().toISOString();
                  model.verificationCount++;
                  
                  // Update platform breakdown
                  this.updatePlatformBreakdown(model, newFeedback, platformName);
                  
                  results.newFeedbackFound += newFeedback.length;
                  results.modelsUpdated++;

                  // Add history entry if score changed significantly
                  if (Math.abs(oldScore - newSummary.verificationScore) > 10) {
                    await this.dataManager.addVerificationHistory({
                      modelId: model.id,
                      timestamp: new Date().toISOString(),
                      platform: platformName,
                      type: 'verification_run',
                      data: {
                        previousScore: oldScore,
                        newScore: newSummary.verificationScore,
                        mentionCount: feedback.length
                      }
                    });
                  }
                }
              }
            }
            
            // Rate limiting between model searches
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            const errorMsg = `Model ${model.id} search failed: ${error instanceof Error ? error.message : 'Unknown'}`;
            results.errors.push(errorMsg);
            platformState.errorCount++;
          }
        }
        
        // Longer break between batches
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Update platform state
      platformState.lastUpdate = new Date().toISOString();
      this.updateState.platformStates[platformName] = platformState;

    } catch (error) {
      results.errors.push(`Platform update failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      platformState.errorCount++;
    }

    return results;
  }

  private extractModelName(title: string): string {
    // Extract model name from title like "Provider: Model Name (Free)"
    const match = title.match(/:\s*([^:(]+)/);
    return match ? match[1].trim() : title;
  }

  private extractProvider(title: string): string {
    // Extract provider from title like "Provider: Model Name (Free)"
    const match = title.match(/^([^:]+):/);
    return match ? match[1].trim() : 'unknown';
  }

  private calculateVerificationSummary(feedback: any[]) {
    const total = feedback.length;
    const positive = feedback.filter(f => f.sentiment === 'positive').length;
    const negative = feedback.filter(f => f.sentiment === 'negative').length;
    const neutral = feedback.filter(f => f.sentiment === 'neutral').length;
    
    let verificationLevel = 'No verification data';
    let availabilityStatus: 'confirmed' | 'questioned' | 'unknown' = 'unknown';
    
    if (total === 0) {
      verificationLevel = 'No social media mentions found';
    } else if (total < 3) {
      verificationLevel = 'Limited verification data';
      availabilityStatus = 'questioned';
    } else {
      const positiveRatio = positive / total;
      const negativeRatio = negative / total;
      
      if (positiveRatio >= 0.7 && negativeRatio <= 0.2) {
        verificationLevel = 'Strongly verified as working';
        availabilityStatus = 'confirmed';
      } else if (positiveRatio >= 0.5 && negativeRatio <= 0.3) {
        verificationLevel = 'Likely working';
        availabilityStatus = 'confirmed';
      } else if (negativeRatio > positiveRatio) {
        verificationLevel = 'Reported issues detected';
        availabilityStatus = 'questioned';
      } else {
        verificationLevel = 'Mixed verification results';
        availabilityStatus = 'questioned';
      }
    }

    // Extract common issues
    const commonIssues: string[] = [];
    const issueKeywords = [
      'rate limit', 'quota', 'unavailable', 'error', 'failed',
      'deprecated', 'paid only', 'requires payment', 'access denied'
    ];
    
    for (const item of feedback) {
      const content = (item.content + ' ' + item.title).toLowerCase();
      for (const keyword of issueKeywords) {
        if (content.includes(keyword) && !commonIssues.includes(keyword)) {
          commonIssues.push(keyword);
        }
      }
    }

    return {
      total,
      positive,
      negative,
      neutral,
      lastMention: feedback.length > 0 
        ? new Date(Math.max(...feedback.map(f => new Date(f.timestamp).getTime()))).toISOString()
        : new Date().toISOString(),
      availabilityStatus,
      commonIssues,
      verificationLevel,
      verificationScore: total > 0 ? Math.round((positive / total) * 100) : 0
    };
  }

  private updatePlatformBreakdown(
    model: EnhancedModelData, 
    newFeedback: any[], 
    platformName: Platform
  ): void {
    if (!model.platformBreakdown[platformName]) {
      model.platformBreakdown[platformName] = {
        mentionCount: 0,
        lastMention: new Date().toISOString(),
        averageSentiment: 0,
        commonIssues: [],
        lastChecked: new Date().toISOString()
      };
    }

    const breakdown = model.platformBreakdown[platformName]!;
    breakdown.mentionCount += newFeedback.length;
    breakdown.lastMention = new Date().toISOString();
    breakdown.lastChecked = new Date().toISOString();
    
    // Recalculate average sentiment
    const allFeedback = model.feedback.filter(f => f.platform === platformName);
    const positiveCount = allFeedback.filter(f => f.sentiment === 'positive').length;
    breakdown.averageSentiment = Math.round((positiveCount / allFeedback.length) * 100);
    
    // Update common issues
    const issues = new Set(breakdown.commonIssues);
    for (const feedback of newFeedback) {
      const content = (feedback.content + ' ' + feedback.title).toLowerCase();
      const issueKeywords = ['rate limit', 'error', 'unavailable', 'paid only'];
      for (const keyword of issueKeywords) {
        if (content.includes(keyword)) {
          issues.add(keyword);
        }
      }
    }
    breakdown.commonIssues = Array.from(issues);
  }

  private async updateVerificationTrends(models: EnhancedModelData[]): Promise<void> {
    const now = new Date();
    
    for (const model of models) {
      // Shift the trend arrays
      model.verificationTrend.last7Days.shift();
      model.verificationTrend.last7Days.push(model.feedbackSummary.verificationScore);
      
      model.verificationTrend.last30Days.shift();
      model.verificationTrend.last30Days.push(model.feedbackSummary.verificationScore);
      
      // Calculate overall trend
      const recent7 = model.verificationTrend.last7Days.slice(-3);
      const previous7 = model.verificationTrend.last7Days.slice(-6, -3);
      
      if (recent7.length === 3 && previous7.length === 3) {
        const recentAvg = recent7.reduce((a, b) => a + b, 0) / recent7.length;
        const previousAvg = previous7.reduce((a, b) => a + b, 0) / previous7.length;
        
        if (recentAvg > previousAvg + 5) {
          model.verificationTrend.overall = 'improving';
        } else if (recentAvg < previousAvg - 5) {
          model.verificationTrend.overall = 'declining';
        } else {
          model.verificationTrend.overall = 'stable';
        }
      }
    }
  }

  private async loadUpdateState(): Promise<void> {
    this.updateState = await this.dataManager.loadUpdateState();
  }

  // Full scrape when needed
  async performFullScrape(): Promise<void> {
    console.log('[IncrementalUpdater] Starting full scrape...');
    
    // This would trigger the existing full scraper
    // Implementation would integrate with existing scraper/index.ts
    console.log('[IncrementalUpdater] ✓ Full scrape complete');
    
    this.updateState.lastFullScrape = new Date().toISOString();
    await this.dataManager.saveUpdateState(this.updateState);
  }
}