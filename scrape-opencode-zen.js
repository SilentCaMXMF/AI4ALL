import { ModelsDevService } from './src/services/models-dev-service.js';
import { createHeader } from './src/utils/console-utils.js';

async function fetchOpencodeZenModels() {
  console.log('[Scraper] Fetching Opencode Zen models from models.dev...');
  
  try {
    const service = new ModelsDevService();
    
    // Create structured model data
    const modelData = await service.createModelData(['opencode', 'zen']);
    
    // Log provider summary
    service.logProviderSummary(modelData.models);
    
    // Save to file
    await service.saveModelData('opencode-zen-models.json', modelData);
    
    // Show summary
    createHeader('Opencode Zen Free Models Summary');
    
    console.log(`Total API Providers:       ${modelData.summary.totalProviders.toString().padStart(3)}`);
    console.log(`Total Models in API:       ${modelData.summary.totalModels.toString().padStart(3)}`);
    console.log(`Opencode/Zen Models:       ${modelData.summary.opencodeZenModels.toString().padStart(3)}`);
    console.log(`FREE Models Available:     ${modelData.summary.freeModels.toString().padStart(3)}`);
    console.log(`Unique Providers:          ${modelData.summary.providerCount.toString().padStart(3)}`);
    console.log();
    
    return modelData;
    
  } catch (error) {
    console.error('[Scraper] Error:', error);
    throw error;
  }
}
}
    });

    if (!response.ok) {
      throw new Error(`Models.dev API error: ${response.status}`);
    }

    const providersData = await response.json();
    const providerIds = Object.keys(providersData);
    console.log(`[Scraper] Total providers in API: ${providerIds.length}`);
    
    // Extract all models with their provider info
    const allModels = [];
    for (const [providerId, provider] of Object.entries(providersData)) {
      if (provider.models) {
        for (const [modelId, model] of Object.entries(provider.models)) {
          allModels.push({
            ...model,
            providerId,
            providerName: provider.name || providerId,
            modelId,
            providerUrl: provider.doc || '',
            npm: provider.npm,
            api: provider.api
          });
        }
      }
    }
    
    console.log(`[Scraper] Total models: ${allModels.length}`);
    
    // Filter for Opencode Zen models specifically
    const opencodeZenModels = allModels.filter(model => {
      const searchString = `${model.providerName || ''} ${model.providerId || ''} ${model.modelId || ''} ${model.name || ''}`.toLowerCase();
      return searchString.includes('opencode') || searchString.includes('zen');
    });
    
    console.log(`[Scraper] Found ${opencodeZenModels.length} Opencode/Zen related models`);
    
    // Filter for FREE models (inputCost === 0 or undefined)
    const freeModels = opencodeZenModels.filter(model => {
      const inputCost = model.cost?.input !== undefined ? model.cost.input : model.inputCost;
      return inputCost === 0 || inputCost === undefined || inputCost === null;
    });
    
    console.log(`[Scraper] Found ${freeModels.length} FREE Opencode/Zen models`);
    
    // Categorize by provider
    const byProvider = {};
    for (const model of freeModels) {
      const provider = model.providerName || model.providerId || 'Unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = [];
      }
      byProvider[provider].push(model);
    }
    
    console.log('\n[Scraper] Models by Provider:');
    for (const [provider, models] of Object.entries(byProvider)) {
      console.log(`  ${provider}: ${models.length} models`);
      models.slice(0, 3).forEach(m => {
        const inputCost = m.cost?.input !== undefined ? m.cost.input : m.inputCost;
        const cost = inputCost === 0 || inputCost === undefined ? 'FREE' : `$${inputCost}/1M`;
        console.log(`    - ${m.name} (${cost})`);
      });
    }
    
    // Create structured data with rich info
    const modelData = {
      lastUpdated: new Date().toISOString(),
      summary: {
        totalProviders: providerIds.length,
        totalModels: allModels.length,
        opencodeZenModels: opencodeZenModels.length,
        freeModels: freeModels.length,
        providerCount: Object.keys(byProvider).length
      },
      providers: Object.keys(byProvider),
      modelsByProvider: byProvider,
      models: freeModels.map(model => {
        const inputCost = model.cost?.input !== undefined ? model.cost.input : model.inputCost;
        const outputCost = model.cost?.output !== undefined ? model.cost.output : model.outputCost;
        
        return {
          id: model.id,
          name: model.name || model.modelId,
          provider: model.providerName || model.providerId,
          providerId: model.providerId,
          modelId: model.modelId,
          family: model.family,
          description: model.description || '',
          inputCost: inputCost,
          outputCost: outputCost,
          contextLimit: model.limit?.context || model.contextLimit,
          outputLimit: model.limit?.output || model.outputLimit,
          toolCall: model.tool_call || model.toolCall || false,
          reasoning: model.reasoning || false,
          structuredOutput: model.structured_output || false,
          attachments: model.attachment || false,
          modalities: model.modalities || { input: ['text'], output: ['text'] },
          openWeights: model.open_weights || false,
          knowledge: model.knowledge,
          releaseDate: model.release_date,
          lastUpdated: model.last_updated,
          url: `https://models.dev/?search=${encodeURIComponent(model.providerId || '')}&model=${encodeURIComponent(model.modelId || '')}`,
          providerUrl: model.providerUrl,
          npm: model.npm,
          api: model.api,
          isFree: true
        };
      })
    };
    
    // Sort models by provider and name
    modelData.models.sort((a, b) => {
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider);
      }
      return a.name.localeCompare(b.name);
    });
    
    // Save to file
    await mkdir('data', { recursive: true });
    await writeFile('data/opencode-zen-models.json', JSON.stringify(modelData, null, 2));
    
    console.log('\n[Scraper] ✅ Saved to data/opencode-zen-models.json');
    
    // Show summary
    createHeader('Opencode Zen Free Models Summary');
    
    console.log(`Total API Providers:       ${modelData.summary.totalProviders.toString().padStart(3)}`);
    console.log(`Total Models in API:       ${modelData.summary.totalModels.toString().padStart(3)}`);
    console.log(`Opencode/Zen Models:       ${modelData.summary.opencodeZenModels.toString().padStart(3)}`);
    console.log(`FREE Models Available:     ${modelData.summary.freeModels.toString().padStart(3)}`);
    console.log(`Unique Providers:          ${modelData.summary.providerCount.toString().padStart(3)}`);
    console.log();
    
    return modelData;
    
  } catch (error) {
    console.error('[Scraper] Error:', error);
    throw error;
  }
}

fetchOpencodeZenModels();
