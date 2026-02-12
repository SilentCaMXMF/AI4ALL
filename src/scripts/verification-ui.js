// Enhanced Verification UI JavaScript

class VerificationUI {
  constructor() {
    this.verificationData = new Map();
    this.init();
  }

  async init() {
    console.log('[VerificationUI] Initializing verification UI...');
    
    // Load verification data
    await this.loadVerificationData();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Update existing model cards with verification data
    this.updateModelCards();
    
    console.log('[VerificationUI] ✓ Initialization complete');
  }

  async loadVerificationData() {
    try {
      // Try to load from enhanced verification database first
      const response = await fetch('/data/verification-database.json');
      if (response.ok) {
        const data = await response.json();
        data.models.forEach(model => {
          this.verificationData.set(model.id, model);
        });
        console.log(`[VerificationUI] ✓ Loaded ${data.models.length} models from verification database`);
      } else {
        // Fallback to aggregated data
        const fallbackResponse = await fetch('/data/aggregated-data.json');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          fallbackData.items.forEach(model => {
            this.verificationData.set(model.id, model);
          });
          console.log(`[VerificationUI] ✓ Loaded ${fallbackData.items.length} models from aggregated data`);
        }
      }
    } catch (error) {
      console.error('[VerificationUI] ✗ Failed to load verification data:', error);
    }
  }

  setupEventListeners() {
    // Verification button clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');
      const modelId = target.getAttribute('data-model-id');
      
      if (action === 'view-verification' && modelId) {
        e.preventDefault();
        this.showVerificationModal(modelId);
      }
      
      if (action === 'view-timeline' && modelId) {
        e.preventDefault();
        this.showVerificationTimeline(modelId);
      }
    });

    // Modal overlay clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('modal-overlay') || target.classList.contains('timeline-overlay')) {
        this.closeAllModals();
      }
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Enhanced search with verification filters
    this.setupVerificationFilters();
  }

  updateModelCards() {
    const modelCards = document.querySelectorAll('.model-card');
    
    modelCards.forEach(card => {
      const modelId = card.getAttribute('data-model-id');
      if (!modelId) return;

      const verificationData = this.verificationData.get(modelId);
      if (!verificationData) return;

      this.enhanceModelCard(card, verificationData);
    });
  }

  enhanceModelCard(card: Element, verificationData: any) {
    // Add verification badge if not present
    if (!card.querySelector('.verification-badge')) {
      const headerActions = card.querySelector('.header-actions');
      if (headerActions) {
        const verificationBadge = this.createVerificationBadge(verificationData);
        headerActions.insertBefore(verificationBadge, headerActions.firstChild);
      }
    }

    // Add platform breakdown section
    if (verificationData.platformBreakdown && Object.keys(verificationData.platformBreakdown).length > 0) {
      const platformSection = this.createPlatformBreakdown(verificationData.platformBreakdown);
      const limits = card.querySelector('.model-limits');
      if (limits && !card.querySelector('.verification-breakdown')) {
        limits.parentNode?.insertBefore(platformSection, limits);
      }
    }

    // Add common issues section
    if (verificationData.feedbackSummary?.commonIssues?.length > 0) {
      const issuesSection = this.createIssuesSection(verificationData.feedbackSummary.commonIssues);
      const capabilities = card.querySelector('.capabilities');
      if (capabilities && !card.querySelector('.issues-section')) {
        capabilities.parentNode?.insertBefore(issuesSection, capabilities.nextSibling);
      }
    }

    // Add verification button
    const cardActions = card.querySelector('.card-actions');
    if (cardActions && !card.querySelector('.verification-btn')) {
      const verificationBtn = this.createVerificationButton(card.getAttribute('data-model-id')!);
      cardActions.appendChild(verificationBtn);
    }
  }

  createVerificationBadge(verificationData: any) {
    const score = verificationData.feedbackSummary?.verificationScore || 0;
    const status = verificationData.feedbackSummary?.availabilityStatus || 'unknown';
    const badge = this.getVerificationBadgeConfig(score, status);

    const badgeElement = document.createElement('div');
    badgeElement.className = 'verification-badge';
    badgeElement.style.cssText = `background-color: ${badge.color}`;
    badgeElement.innerHTML = `
      <span class="verification-icon">${badge.icon}</span>
      <span class="verification-label">${badge.label}</span>
      <span class="verification-score">${score}%</span>
    `;

    return badgeElement;
  }

  createPlatformBreakdown(platformBreakdown: any) {
    const platformIcons: Record<string, string> = {
      github: '🐙',
      reddit: '🤖',
      hackernews: '🔥',
      stackoverflow: '📚',
      huggingface: '🤗',
      discord: '💬',
      x: '🐦'
    };

    const breakdownElement = document.createElement('div');
    breakdownElement.className = 'verification-breakdown';
    
    const mentionsHtml = Object.entries(platformBreakdown).map(([platform, data]: [string, any]) => {
      const icon = platformIcons[platform] || '🌐';
      const sentimentClass = data.averageSentiment >= 70 ? 'positive' : data.averageSentiment < 40 ? 'negative' : '';
      
      return `
        <div class="platform-mention" title="${platform}: ${data.mentionCount} mentions, ${data.averageSentiment}% sentiment">
          <span class="platform-icon">${icon}</span>
          <span class="platform-count">${data.mentionCount}</span>
          ${sentimentClass ? `<span class="sentiment-indicator ${sentimentClass}"></span>` : ''}
        </div>
      `;
    }).join('');

    breakdownElement.innerHTML = `
      <div class="platform-mentions">
        ${mentionsHtml}
      </div>
    `;

    return breakdownElement;
  }

  createIssuesSection(commonIssues: string[]) {
    const issuesElement = document.createElement('div');
    issuesElement.className = 'issues-section';
    
    const issuesHtml = commonIssues.slice(0, 3).map(issue => 
      `<span class="issue-tag">${issue}</span>`
    ).join('');
    
    const moreText = commonIssues.length > 3 ? `<span class="issue-more">+${commonIssues.length - 3} more</span>` : '';

    issuesElement.innerHTML = `
      <div class="issues-header">
        <span class="issues-icon">⚠️</span>
        <span class="issues-title">Reported Issues:</span>
      </div>
      <div class="issues-list">
        ${issuesHtml}
        ${moreText}
      </div>
    `;

    return issuesElement;
  }

  createVerificationButton(modelId: string) {
    const button = document.createElement('button');
    button.className = 'verification-btn';
    button.setAttribute('data-action', 'view-verification');
    button.setAttribute('data-model-id', modelId);
    button.setAttribute('title', 'View verification details');
    button.innerHTML = '📊 Verification';

    return button;
  }

  getVerificationBadgeConfig(score: number, status: string) {
    if (score >= 80 && status === 'confirmed') {
      return { color: '#10b981', icon: '✓', label: 'Verified' };
    } else if (score >= 60 && status === 'confirmed') {
      return { color: '#f59e0b', icon: '⚡', label: 'Likely' };
    } else if (score >= 40) {
      return { color: '#ef4444', icon: '⚠️', label: 'Questioned' };
    } else {
      return { color: '#6b7280', icon: '❓', label: 'Unknown' };
    }
  }

  showVerificationModal(modelId: string) {
    const verificationData = this.verificationData.get(modelId);
    if (!verificationData) {
      console.error(`[VerificationUI] No verification data found for model: ${modelId}`);
      return;
    }

    // Create modal if it doesn't exist
    let modal = document.getElementById(`verification-modal-${modelId}`);
    if (!modal) {
      modal = this.createVerificationModal(modelId, verificationData);
      document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  createVerificationModal(modelId: string, verificationData: any) {
    const modal = document.createElement('div');
    modal.id = `verification-modal-${modelId}`;
    modal.className = 'verification-modal';
    
    // This would normally be server-rendered, but for dynamic loading we'll create it here
    modal.innerHTML = `
      <div class="modal-overlay" onclick="verificationUI.closeModal('${modelId}')"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Verification Details</h2>
          <button class="close-btn" onclick="verificationUI.closeModal('${modelId}')">×</button>
        </div>
        <div class="modal-body">
          ${this.createVerificationContent(verificationData)}
        </div>
        <div class="modal-footer">
          <button class="secondary-btn" onclick="verificationUI.closeModal('${modelId}')">Close</button>
        </div>
      </div>
    `;

    return modal;
  }

  createVerificationContent(verificationData: any) {
    const score = verificationData.feedbackSummary?.verificationScore || 0;
    const level = verificationData.feedbackSummary?.verificationLevel || 'No verification data';
    const status = verificationData.feedbackSummary?.availabilityStatus || 'unknown';
    const total = verificationData.feedbackSummary?.total || 0;
    const positive = verificationData.feedbackSummary?.positive || 0;
    const negative = verificationData.feedbackSummary?.negative || 0;
    const neutral = verificationData.feedbackSummary?.neutral || 0;

    return `
      <div class="model-info">
        <h3>${verificationData.title}</h3>
        <div class="verification-score-display">
          <div class="score-circle" style="background: conic-gradient(#10b981 ${score * 3.6}deg, #e5e7eb ${score * 3.6}deg)">
            <span class="score-text">${score}%</span>
          </div>
          <div class="score-details">
            <div class="status-badge">${level}</div>
            <div class="availability-badge">Status: <strong>${status}</strong></div>
          </div>
        </div>
      </div>
      
      <div class="sentiment-section">
        <h4>Sentiment Analysis (${total} total mentions)</h4>
        <div class="sentiment-bars">
          <div class="sentiment-bar">
            <span class="sentiment-label positive">Positive</span>
            <div class="sentiment-progress">
              <div class="sentiment-fill positive" style="width: ${total > 0 ? (positive / total) * 100 : 0}%"></div>
            </div>
            <span class="sentiment-count">${positive}</span>
          </div>
          <div class="sentiment-bar">
            <span class="sentiment-label neutral">Neutral</span>
            <div class="sentiment-progress">
              <div class="sentiment-fill neutral" style="width: ${total > 0 ? (neutral / total) * 100 : 0}%"></div>
            </div>
            <span class="sentiment-count">${neutral}</span>
          </div>
          <div class="sentiment-bar">
            <span class="sentiment-label negative">Negative</span>
            <div class="sentiment-progress">
              <div class="sentiment-fill negative" style="width: ${total > 0 ? (negative / total) * 100 : 0}%"></div>
            </div>
            <span class="sentiment-count">${negative}</span>
          </div>
        </div>
      </div>
    `;
  }

  showVerificationTimeline(modelId: string) {
    // Similar implementation for timeline modal
    console.log(`[VerificationUI] Showing timeline for model: ${modelId}`);
    // Implementation would be similar to showVerificationModal
  }

  closeModal(modelId: string) {
    const modal = document.getElementById(`verification-modal-${modelId}`);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  closeTimeline(modelId: string) {
    const timeline = document.getElementById(`verification-timeline-${modelId}`);
    if (timeline) {
      timeline.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  closeAllModals() {
    document.querySelectorAll('.verification-modal, .verification-timeline').forEach(modal => {
      (modal as HTMLElement).style.display = 'none';
    });
    document.body.style.overflow = 'auto';
  }

  setupVerificationFilters() {
    // Add verification filters to the existing filter controls
    const filterSection = document.querySelector('.filter-controls');
    if (!filterSection) return;

    // Create verification filter group
    const verificationFilterGroup = document.createElement('div');
    verificationFilterGroup.className = 'filter-group verification-filter';
    verificationFilterGroup.innerHTML = `
      <label>Min. Verification Score</label>
      <input type="range" id="verification-min" min="0" max="100" step="5" value="0" class="range-slider" />
      <span id="verification-min-value">0%</span>
    `;

    filterSection.appendChild(verificationFilterGroup);

    // Setup verification score slider
    const verificationSlider = document.getElementById('verification-min') as HTMLInputElement;
    const verificationValue = document.getElementById('verification-min-value');
    
    if (verificationSlider && verificationValue) {
      verificationSlider.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        verificationValue.textContent = `${value}%`;
        this.applyFilters();
      });
    }
  }

  applyFilters() {
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const contextMin = document.getElementById('context-min') as HTMLInputElement;
    const outputMin = document.getElementById('output-min') as HTMLInputElement;
    const verificationMin = document.getElementById('verification-min') as HTMLInputElement;
    const capabilityCheckboxes = document.querySelectorAll('.capability-checkbox');

    const filters = {
      search: searchInput?.value.toLowerCase() || '',
      contextMin: parseInt(contextMin?.value || '0'),
      outputMin: parseInt(outputMin?.value || '0'),
      verificationMin: parseInt(verificationMin?.value || '0'),
      capabilities: Array.from(capabilityCheckboxes)
        .filter(cb => (cb as HTMLInputElement).checked)
        .map(cb => (cb as HTMLInputElement).value)
    };

    this.filterModelCards(filters);
    this.updateClearFiltersButton(filters);
  }

  filterModelCards(filters: any) {
    const modelCards = document.querySelectorAll('.model-card');
    let visibleCount = 0;

    modelCards.forEach(card => {
      const modelId = card.getAttribute('data-model-id');
      if (!modelId) return;

      const verificationData = this.verificationData.get(modelId);
      const raw = (card as any)._raw || {};
      
      let isVisible = true;

      // Search filter
      if (filters.search) {
        const searchText = (raw.name || '').toLowerCase() + 
                          (raw.providerName || '').toLowerCase() +
                          (raw.family || '').toLowerCase();
        if (!searchText.includes(filters.search)) {
          isVisible = false;
        }
      }

      // Context limit filter
      const contextLimit = raw.limit?.context || raw.limit?.input || 0;
      if (contextLimit < filters.contextMin) {
        isVisible = false;
      }

      // Output limit filter
      const outputLimit = raw.limit?.output || 0;
      if (outputLimit < filters.outputMin) {
        isVisible = false;
      }

      // Verification score filter
      if (verificationData && verificationData.feedbackSummary?.verificationScore < filters.verificationMin) {
        isVisible = false;
      }

      // Capabilities filter
      if (filters.capabilities.length > 0) {
        const hasCapability = filters.capabilities.some(cap => {
          if (cap === 'Tool Calling') return raw.capabilities?.tool_call;
          if (cap === 'Reasoning') return raw.capabilities?.reasoning;
          if (cap === 'Vision') return raw.modalities?.input?.includes('image');
          if (cap === 'Audio') return raw.modalities?.input?.includes('audio');
          if (cap === 'Open Weights') return raw.open_weights;
          return false;
        });
        if (!hasCapability) isVisible = false;
      }

      // Apply visibility
      (card as HTMLElement).style.display = isVisible ? 'flex' : 'none';
      if (isVisible) visibleCount++;
    });

    // Update results count
    this.updateResultsCount(visibleCount);
  }

  updateClearFiltersButton(filters: any) {
    const clearBtn = document.getElementById('clear-filters') as HTMLElement;
    const hasActiveFilters = filters.search || 
                          filters.contextMin > 0 || 
                          filters.outputMin > 0 || 
                          filters.verificationMin > 0 || 
                          filters.capabilities.length > 0;
    
    if (clearBtn) {
      clearBtn.style.display = hasActiveFilters ? 'block' : 'none';
    }
  }

  updateResultsCount(count: number) {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
      resultsCount.textContent = count.toString();
    }
  }
}

// Initialize when DOM is ready
let verificationUI: VerificationUI;

document.addEventListener('DOMContentLoaded', () => {
  verificationUI = new VerificationUI();
});

// Make it globally available for onclick handlers
declare global {
  interface Window {
    verificationUI: VerificationUI;
  }
}

window.verificationUI = new VerificationUI();