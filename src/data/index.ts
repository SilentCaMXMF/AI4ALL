// Data pipeline and storage components
export { VerificationDataManager } from './verification-store.js';
export { IncrementalUpdater } from './incremental-updater.js';
export { APIKeyManager } from './api-key-manager.js';
export { VerificationHistoryTracker } from './history-tracker.js';

// Re-export types for convenience
export type {
  VerificationDatabase,
  EnhancedModelData,
  VerificationHistoryEntry,
  PlatformVerificationDetails,
  AvailabilityEntry,
  UpdateState,
  APIKeyConfig,
  PipelineConfig
} from '../types/index.js';