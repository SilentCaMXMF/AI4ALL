import { readFile } from 'fs/promises';
import { join } from 'path';
import type { AggregatedItem, ModelWithFeedback } from '../types/index.js';

export interface ModelCost {
  input: number;
  output: number;
  cache_read?: number;
  cache_write?: number;
}

export interface ModelLimit {
  context: number;
  output: number;
  input?: number;
}

export interface ModelModality {
  input: string[];
  output: string[];
}

export interface RawModelData {
  id: string;
  name: string;
  family?: string;
  attachment: boolean;
  reasoning: boolean;
  tool_call: boolean;
  temperature: boolean;
  knowledge?: string;
  release_date: string;
  last_updated: string;
  modalities: ModelModality;
  open_weights: boolean;
  cost: ModelCost;
  limit: ModelLimit;
  providerId: string;
  providerName: string;
  modelId: string;
  providerUrl: string;
  status?: string;
  provider?: {
    npm?: string;
  };
  interleaved?: {
    field: string;
  };
  structured_output?: boolean;
}

export interface ModelItem extends AggregatedItem {
  platform: 'modelsdev';
  type: 'model';
  metrics: {
    inputCost: number;
    outputCost: number;
    contextLimit: number;
    outputLimit: number;
    isFree: boolean;
    capabilities: number;
  };
  tags: string[];
  raw: RawModelData;
}

interface AggregatedData {
  items: AggregatedItem[];
  lastUpdated?: string;
}

const DATA_FILE_PATH = join(process.cwd(), 'data', 'aggregated-data.json');

export async function loadAllModels(): Promise<ModelItem[]> {
  try {
    const content = await readFile(DATA_FILE_PATH, 'utf-8');
    const data: AggregatedData = JSON.parse(content);
    
    return data.items.filter((item): item is ModelItem => 
      item.platform === 'modelsdev' && item.type === 'model'
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Data] Error loading models: ${errorMessage}`);
    return [];
  }
}

export function filterFreeModels(models: ModelItem[]): ModelItem[] {
  return models.filter(model => {
    const raw = model.raw;
    return raw?.cost?.input === 0 && raw?.cost?.output === 0;
  });
}

export async function getFreeModels(): Promise<ModelItem[]> {
  const allModels = await loadAllModels();
  return filterFreeModels(allModels);
}

export function isFreeModel(model: ModelItem): boolean {
  return model.raw?.cost?.input === 0 && model.raw?.cost?.output === 0;
}

/**
 * Group models by provider
 */
export function groupByProvider(models: ModelItem[]): Map<string, ModelItem[]> {
  const grouped = new Map<string, ModelItem[]>();
  
  for (const model of models) {
    const provider = model.raw.providerName || model.raw.providerId || 'Unknown';
    if (!grouped.has(provider)) {
      grouped.set(provider, []);
    }
    grouped.get(provider)!.push(model);
  }
  
  return grouped;
}

/**
 * Get unique providers from models
 */
export function getUniqueProviders(models: ModelItem[]): string[] {
  const providers = new Set<string>();
  for (const model of models) {
    providers.add(model.raw.providerName || model.raw.providerId || 'Unknown');
  }
  return Array.from(providers).sort();
}

/**
 * Get unique capabilities/tags from models
 */
export function getUniqueTags(models: ModelItem[]): string[] {
  const tags = new Set<string>();
  
  for (const model of models) {
    for (const tag of model.tags) {
      if (tag !== 'free' && tag !== 'modelsdev') {
        tags.add(tag);
      }
    }
  }
  
  return Array.from(tags).sort();
}

/**
 * Search models by query string
 */
export function searchModels(models: ModelItem[], query: string): ModelItem[] {
  if (!query.trim()) return models;
  
  const lowerQuery = query.toLowerCase();
  
  return models.filter(model => {
    const searchText = `
      ${model.title} 
      ${model.raw.name} 
      ${model.raw.providerName} 
      ${model.raw.family || ''} 
      ${model.tags.join(' ')}
    `.toLowerCase();
    
    return searchText.includes(lowerQuery);
  });
}

/**
 * Filter models by provider
 */
export function filterByProvider(models: ModelItem[], provider: string): ModelItem[] {
  return models.filter(model => 
    (model.raw.providerName || model.raw.providerId) === provider
  );
}

/**
 * Filter models by tag/capability
 */
export function filterByTag(models: ModelItem[], tag: string): ModelItem[] {
  return models.filter(model => model.tags.includes(tag));
}

/**
 * Get model statistics
 */
export function getModelStats(models: ModelItem[]) {
  const providers = getUniqueProviders(models);
  const tags = getUniqueTags(models);
  
  return {
    total: models.length,
    providers: providers.length,
    tags: tags.length,
    providerList: providers,
    tagList: tags,
  };
}
