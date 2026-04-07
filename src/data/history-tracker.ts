import type { 
  VerificationHistoryEntry, 
  EnhancedModelData, 
  Platform,
  ModelFeedback
} from '../types/index.js';
import { VerificationDataManager } from './verification-store.js';
import { handleAsyncError } from '../utils/error-handler.js';

export interface TrendAnalysis {
  platform: string;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  scoreChange: number;
  timeframe: string;
  confidence: number;
}

export interface ModelTrendReport {
  modelId: string;
  modelTitle: string;
  overallTrend: TrendAnalysis;
  platformTrends: Record<Platform, TrendAnalysis>;
  summary: {
    totalMentions: number;
    sentimentShift: 'positive' | 'negative' | 'neutral';
    reliabilityScore: number;
    recommendation: string;
  };
  generatedAt: string;
}

export class VerificationHistoryTracker {
  private dataManager: VerificationDataManager;

  constructor(dataManager: VerificationDataManager) {
    this.dataManager = dataManager;
  }

  // Record verification event
  async recordVerificationEvent(
    modelId: string,
    platform: Platform,
    eventType: VerificationHistoryEntry['type'],
    data: VerificationHistoryEntry['data'],
    metadata?: Record<string, unknown>
  ): Promise<void> {
    return await handleAsyncError(async () => {
      const entry: VerificationHistoryEntry = {
        id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        modelId,
        timestamp: new Date().toISOString(),
        platform,
        type: eventType,
        data,
        metadata
      };

      await this.dataManager.addVerificationHistory(entry);
      
      console.log(`[HistoryTracker] Recorded ${eventType} for ${modelId} from ${platform}`);
    }, 'history', 'recordVerificationEvent');
  }

  // Analyze trends for a specific model
  async analyzeModelTrends(modelId: string, days: number = 30): Promise<ModelTrendReport> {
    return await handleAsyncError(async () => {
      const db = await this.dataManager.loadDatabase();
      const model = db.models.find(m => m.id === modelId);
      
      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      // Get history for the specified period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const relevantHistory = db.verificationHistory.filter(
        entry => entry.modelId === modelId && 
                 new Date(entry.timestamp) >= cutoffDate
      );

      // Analyze platform-specific trends
      const platformTrends: Record<Platform, TrendAnalysis> = {} as any;
      
      for (const platform of ['github', 'reddit', 'hackernews', 'stackoverflow', 'huggingface']) {
        const platformHistory = relevantHistory.filter(h => h.platform === platform);
        platformTrends[platform as Platform] = await this.analyzePlatformTrend(
          platform as Platform,
          platformHistory,
          days
        );
      }

      // Calculate overall trend
      const overallTrend = this.calculateOverallTrend(Object.values(platformTrends));

      // Calculate summary statistics
      const summary = this.calculateTrendSummary(model, relevantHistory, overallTrend);

      const report: ModelTrendReport = {
        modelId,
        modelTitle: model.title,
        overallTrend,
        platformTrends,
        summary,
        generatedAt: new Date().toISOString()
      };

      return report;
    }, 'history', 'analyzeModelTrends');
  }

  private async analyzePlatformTrend(
    platform: Platform,
    history: VerificationHistoryEntry[],
    days: number
  ): Promise<TrendAnalysis> {
    if (history.length < 3) {
      return {
        platform,
        trend: 'insufficient_data',
        scoreChange: 0,
        timeframe: `${days} days`,
        confidence: 0
      };
    }

    // Sort by timestamp
    history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Extract score changes
    const scoreChanges = history
      .filter(h => h.data.newScore !== undefined && h.data.previousScore !== undefined)
      .map(h => h.data.newScore! - h.data.previousScore!);

    // Calculate net change
    const scoreChange = scoreChanges.reduce((sum, change) => sum + change, 0);

    // Determine trend
    let trend: TrendAnalysis['trend'] = 'stable';
    const averageChange = scoreChange / scoreChanges.length;

    if (averageChange > 5) {
      trend = 'improving';
    } else if (averageChange < -5) {
      trend = 'declining';
    }

    // Calculate confidence based on data points and recency
    const recentEntries = history.filter(h => {
      const entryAge = (Date.now() - new Date(h.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return entryAge <= days / 2;
    });

    const confidence = Math.min(100, (recentEntries.length / history.length) * 100);

    return {
      platform,
      trend,
      scoreChange: Math.round(scoreChange),
      timeframe: `${days} days`,
      confidence: Math.round(confidence)
    };
  }

  private calculateOverallTrend(platformTrends: TrendAnalysis[]): TrendAnalysis {
    const validTrends = platformTrends.filter(t => t.trend !== 'insufficient_data');
    
    if (validTrends.length === 0) {
      return {
        platform: 'overall',
        trend: 'insufficient_data',
        scoreChange: 0,
        timeframe: '30 days',
        confidence: 0
      };
    }

    // Weight by confidence
    const weightedTrendScores = validTrends.map(t => {
      let score = 0;
      switch (t.trend) {
        case 'improving': score = 1; break;
        case 'stable': score = 0; break;
        case 'declining': score = -1; break;
      }
      return score * t.confidence;
    });

    const totalWeight = validTrends.reduce((sum, t) => sum + t.confidence, 0);
    const weightedAverage = weightedTrendScores.reduce((sum, score) => sum + score, 0) / totalWeight;

    let trend: TrendAnalysis['trend'] = 'stable';
    if (weightedAverage > 0.2) {
      trend = 'improving';
    } else if (weightedAverage < -0.2) {
      trend = 'declining';
    }

    const totalScoreChange = validTrends.reduce((sum, t) => sum + t.scoreChange, 0);
    const averageConfidence = validTrends.reduce((sum, t) => sum + t.confidence, 0) / validTrends.length;

    return {
      platform: 'overall',
      trend,
      scoreChange: Math.round(totalScoreChange),
      timeframe: '30 days',
      confidence: Math.round(averageConfidence)
    };
  }

  private calculateTrendSummary(
    model: EnhancedModelData,
    history: VerificationHistoryEntry[],
    overallTrend: TrendAnalysis
  ): ModelTrendReport['summary'] {
    // Calculate total mentions
    const totalMentions = model.feedback.length;

    // Determine sentiment shift
    const sentimentEntries = history.filter(h => h.type === 'sentiment_change');
    let sentimentShift: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (sentimentEntries.length > 0) {
      const positiveShifts = sentimentEntries.filter(h => h.data.sentimentChange === 'positive').length;
      const negativeShifts = sentimentEntries.filter(h => h.data.sentimentChange === 'negative').length;
      
      if (positiveShifts > negativeShifts) {
        sentimentShift = 'positive';
      } else if (negativeShifts > positiveShifts) {
        sentimentShift = 'negative';
      }
    }

    // Calculate reliability score based on trend and current verification
    const currentScore = model.feedbackSummary.verificationScore;
    const trendModifier = overallTrend.trend === 'improving' ? 10 : 
                        overallTrend.trend === 'declining' ? -10 : 0;
    
    const reliabilityScore = Math.max(0, Math.min(100, currentScore + trendModifier));

    // Generate recommendation
    let recommendation = '';
    if (overallTrend.confidence < 30) {
      recommendation = 'Insufficient data for reliable assessment';
    } else if (reliabilityScore >= 80 && overallTrend.trend !== 'declining') {
      recommendation = 'Highly recommended - strong verification and positive trends';
    } else if (reliabilityScore >= 60 && overallTrend.trend !== 'declining') {
      recommendation = 'Generally reliable - use with normal precautions';
    } else if (reliabilityScore >= 40) {
      recommendation = 'Use with caution - monitor for issues';
    } else {
      recommendation = 'Not recommended - significant reliability concerns';
    }

    return {
      totalMentions,
      sentimentShift,
      reliabilityScore,
      recommendation
    };
  }

  // Get trending models
  async getTrendingModels(
    trendType: 'improving' | 'declining' = 'improving',
    limit: number = 10
  ): Promise<ModelTrendReport[]> {
    return await handleAsyncError(async () => {
      const db = await this.dataManager.loadDatabase();
      const reports: ModelTrendReport[] = [];

      // Analyze top models by mention count
      const modelsByMentions = db.models
        .sort((a, b) => b.feedback.length - a.feedback.length)
        .slice(0, limit * 2); // Analyze more to get enough trending ones

      for (const model of modelsByMentions) {
        try {
          const report = await this.analyzeModelTrends(model.id);
          
          if (report.overallTrend.trend === trendType && report.overallTrend.confidence >= 50) {
            reports.push(report);
          }
        } catch (error) {
          console.warn(`[HistoryTracker] Failed to analyze trends for ${model.id}:`, error);
        }
      }

      // Sort by confidence and score change
      return reports
        .sort((a, b) => {
          if (a.overallTrend.confidence !== b.overallTrend.confidence) {
            return b.overallTrend.confidence - a.overallTrend.confidence;
          }
          return Math.abs(b.overallTrend.scoreChange) - Math.abs(a.overallTrend.scoreChange);
        })
        .slice(0, limit);
    }, 'history', 'getTrendingModels');
  }

  // Generate platform-wide trends report
  async generatePlatformReport(days: number = 7): Promise<{
    platform: Platform;
    totalModels: number;
    activeModels: number;
    averageVerificationScore: number;
    commonIssues: string[];
    trend: TrendAnalysis;
  }[]> {
    return await handleAsyncError(async () => {
      const db = await this.dataManager.loadDatabase();
      const platforms: Platform[] = ['github', 'reddit', 'hackernews', 'stackoverflow', 'huggingface'];
      
      const reports = [];

      for (const platform of platforms) {
        const modelsWithPlatform = db.models.filter(m => 
          m.platformBreakdown[platform]?.mentionCount || 0 > 0
        );

        if (modelsWithPlatform.length === 0) {
          continue;
        }

        const totalModels = modelsWithPlatform.length;
        const activeModels = modelsWithPlatform.filter(m => 
          new Date(m.platformBreakdown[platform]!.lastChecked).getTime() > 
          Date.now() - (days * 24 * 60 * 60 * 1000)
        ).length;

        const averageScore = modelsWithPlatform.reduce((sum, m) => 
          sum + m.platformBreakdown[platform]!.averageSentiment, 0
        ) / totalModels;

        // Extract common issues
        const allIssues = modelsWithPlatform.flatMap(m => 
          m.platformBreakdown[platform]!.commonIssues
        );
        const issueCounts = allIssues.reduce((counts, issue) => {
          counts[issue] = (counts[issue] || 0) + 1;
          return counts;
        }, {} as Record<string, number>);
        
        const commonIssues = Object.entries(issueCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([issue]) => issue);

        // Calculate platform trend
        const platformHistory = db.verificationHistory.filter(h => 
          h.platform === platform &&
          new Date(h.timestamp).getTime() > Date.now() - (days * 24 * 60 * 60 * 1000)
        );

        const trend = await this.analyzePlatformTrend(platform, platformHistory, days);

        reports.push({
          platform,
          totalModels,
          activeModels,
          averageVerificationScore: Math.round(averageScore),
          commonIssues,
          trend
        });
      }

      return reports;
    }, 'history', 'generatePlatformReport');
  }

  // Cleanup old history entries
  async cleanupHistory(retentionDays: number = 90): Promise<void> {
    return await handleAsyncError(async () => {
      const db = await this.dataManager.loadDatabase();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const originalCount = db.verificationHistory.length;
      
      // Keep important events longer
      const importantTypes = ['availability_change', 'issue_detected'];
      
      db.verificationHistory = db.verificationHistory.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        
        // Keep important entries longer
        if (importantTypes.includes(entry.type)) {
          return entryDate > new Date(cutoffDate.getTime() - (30 * 24 * 60 * 60 * 1000));
        }
        
        return entryDate > cutoffDate;
      });

      const cleanedCount = originalCount - db.verificationHistory.length;
      
      if (cleanedCount > 0) {
        await this.dataManager.saveDatabase(db);
        console.log(`[HistoryTracker] ✓ Cleaned up ${cleanedCount} old history entries`);
      }
    }, 'history', 'cleanupHistory');
  }
}