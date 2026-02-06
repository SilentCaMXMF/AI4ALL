import { BasePlatformAPI } from '../types/index.js';
import type { AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
    html_url: string;
    avatar_url: string;
  };
  pull_request?: undefined;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    html_url: string;
    avatar_url: string;
  };
  comments: number;
  labels: Array<{ name: string }>;
  pull_request?: {
    url: string;
    html_url: string;
  };
}

interface GitHubSearchItem {
  total_count: number;
  incomplete_results: boolean;
  items: (GitHubRepo | GitHubIssue)[];
}

interface GitHubLabel {
  name: string;
}

interface GitHubDiscussion {
  id: number;
  title: string;
  body: string;
  html_url: string;
  created_at: string;
  comments: number;
  labels: GitHubLabel[];
  category?: {
    name: string;
  };
  user: {
    login: string;
    html_url: string;
    avatar_url: string;
  };
}

interface ScrapeState {
  lastScrapeTime: string;
  currentPeriod: number;
  requestsUsedThisPeriod: number;
  requestsUsedToday: number;
  searchesPerformed: string[];
}

export class GitHubAPI extends BasePlatformAPI {
  readonly platform: Platform = 'github';
  readonly rateLimitPerHour = 5000;
  readonly periodsPerDay = 48; // 24 hours / 30 minutes = 48 periods
  readonly requestsPerPeriod: number;
  
  private token: string;
  private username?: string;
  private orgs: string[];
  private searchQueries: string[];
  private stateFile: string;
  private state: ScrapeState;

  constructor(config: { 
    token: string; 
    username?: string; 
    orgs?: string[];
    searchQueries?: string[];
  }) {
    super();
    this.token = config.token;
    this.username = config.username;
    this.orgs = config.orgs || [];
    this.searchQueries = config.searchQueries || [
      'free AI models',
      'open source LLM',
      'free API providers',
      'opencode',
      'zen AI'
    ];
    this.stateFile = join(process.cwd(), 'data', 'github-scrape-state.json');
    
    // Calculate requests per 30-minute period
    // 5000 req/hour = 2500 req/30min, but we want to stay conservative
    // Use 20% of hourly limit per period = 1000 requests per 30-min period
    this.requestsPerPeriod = Math.floor(this.rateLimitPerHour * 0.20);
    
    this.state = {
      lastScrapeTime: new Date(0).toISOString(),
      currentPeriod: 0,
      requestsUsedThisPeriod: 0,
      requestsUsedToday: 0,
      searchesPerformed: []
    };
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    await this.loadState();
    
    const now = new Date();
    const currentPeriod = this.getCurrentPeriod(now);
    
    // Reset counters if we're in a new period
    if (currentPeriod !== this.state.currentPeriod) {
      console.log(`[GitHub] New period started: ${currentPeriod}/48`);
      this.state.currentPeriod = currentPeriod;
      this.state.requestsUsedThisPeriod = 0;
      this.state.searchesPerformed = [];
      
      // Reset daily counter if it's a new day
      const lastScrape = new Date(this.state.lastScrapeTime);
      if (now.getDate() !== lastScrape.getDate()) {
        this.state.requestsUsedToday = 0;
        console.log(`[GitHub] New day started - resetting daily counters`);
      }
    }

    const items: AggregatedItem[] = [];
    const timeWindow = this.calculateTimeWindow(now);
    
    console.log(`[GitHub] Scraping period ${currentPeriod}/48`);
    console.log(`[GitHub] Time window: ${timeWindow.start.toISOString()} to ${timeWindow.end.toISOString()}`);
    console.log(`[GitHub] Requests available this period: ${this.requestsPerPeriod - this.state.requestsUsedThisPeriod}`);
    
    try {
      // Calculate which search to perform based on period
      const searchIndex = currentPeriod % this.searchQueries.length;
      const query = this.searchQueries[searchIndex];
      
      console.log(`[GitHub] Current search focus: "${query}"`);
      
      // Search for fresh repositories (created/updated in time window)
      const repos = await this.searchFreshRepos(query, timeWindow);
      items.push(...repos.map(repo => this.normalizeRepo(repo as GitHubRepo)));
      
      // Search for fresh issues
      const issues = await this.searchFreshIssues(query, timeWindow);
      items.push(...issues.map(issue => this.normalizeIssue(issue as GitHubIssue)));
      
      // Search for discussions (if API available)
      try {
        const discussions = await this.searchFreshDiscussions(query, timeWindow);
        items.push(...discussions.map(disc => this.normalizeDiscussion(disc)));
      } catch {
        // Discussions might not be available for all repos
      }
      
      // Every 6 periods (3 hours), also fetch user/org repos
      if (currentPeriod % 6 === 0) {
        console.log(`[GitHub] Periodic user/org repo check (every 3 hours)`);
        if (this.username) {
          const userRepos = await this.fetchRecentUserRepos(this.username, timeWindow);
          items.push(...userRepos.map(repo => this.normalizeRepo(repo)));
        }
        
        for (const org of this.orgs.slice(0, 2)) { // Limit to avoid rate limits
          const orgRepos = await this.fetchRecentOrgRepos(org, timeWindow);
          items.push(...orgRepos.map(repo => this.normalizeRepo(repo)));
        }
      }
      
      // Update state
      this.state.lastScrapeTime = now.toISOString();
      await this.saveState();
      
      console.log(`[GitHub] Scraped ${items.length} fresh items`);
      console.log(`[GitHub] Requests used this period: ${this.state.requestsUsedThisPeriod}/${this.requestsPerPeriod}`);
      console.log(`[GitHub] Requests used today: ${this.state.requestsUsedToday}/${this.rateLimitPerHour * 24}`);
      
      return {
        items: items.slice(0, options.limit || 50),
        hasMore: this.state.requestsUsedThisPeriod < this.requestsPerPeriod
      };
    } catch (error) {
      throw this.handleError(error, 'fetchItems');
    }
  }

  private getCurrentPeriod(date: Date): number {
    // Calculate which 30-minute period we're in (0-47)
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return (hours * 2) + Math.floor(minutes / 30);
  }

  private calculateTimeWindow(endTime: Date): { start: Date; end: Date } {
    // Look back 2 hours for fresh content
    // This ensures we catch items even if there was a delay
    const start = new Date(endTime.getTime() - (2 * 60 * 60 * 1000));
    return { start, end: endTime };
  }

  private async searchFreshRepos(query: string, timeWindow: { start: Date; end: Date }): Promise<GitHubRepo[]> {
    await this.rateLimit();
    
    // Use GitHub search with date qualifiers
    const dateQuery = `pushed:>${timeWindow.start.toISOString().split('T')[0]} ${query}`;
    const encodedQuery = encodeURIComponent(dateQuery);
    
    console.log(`[GitHub] Searching repos: "${dateQuery}"`);
    
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodedQuery}&sort=updated&order=desc&per_page=20`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SocialMediaAggregator'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GitHubSearchItem;
    this.incrementRequestCounter();
    
    console.log(`[GitHub] Found ${data.total_count} repos (showing ${data.items.length})`);
    
    // Filter to only include repos actually updated in our time window
    return data.items.filter(repo => {
      const updatedAt = new Date((repo as GitHubRepo).updated_at);
      return updatedAt >= timeWindow.start && updatedAt <= timeWindow.end;
    }) as GitHubRepo[];
  }

  private async searchFreshIssues(query: string, timeWindow: { start: Date; end: Date }): Promise<GitHubIssue[]> {
    await this.rateLimit();
    
    const dateQuery = `created:>${timeWindow.start.toISOString()} ${query}`;
    const encodedQuery = encodeURIComponent(dateQuery);
    
    console.log(`[GitHub] Searching issues: "${dateQuery.substring(0, 60)}..."`);
    
    const response = await fetch(
      `https://api.github.com/search/issues?q=${encodedQuery}&sort=created&order=desc&per_page=20`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SocialMediaAggregator'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GitHubSearchItem;
    this.incrementRequestCounter();
    
    console.log(`[GitHub] Found ${data.total_count} issues (showing ${data.items.length})`);
    
    // Filter issues only (not PRs) created in time window
    return data.items.filter((item): item is GitHubIssue => {
      const createdAt = new Date(item.created_at);
      return !item.pull_request && createdAt >= timeWindow.start && createdAt <= timeWindow.end;
    });
  }

  private async searchFreshDiscussions(query: string, timeWindow: { start: Date; end: Date }): Promise<GitHubDiscussion[]> {
    await this.rateLimit();
    
    const dateQuery = `created:>${timeWindow.start.toISOString()} label:discussion ${query}`;
    const encodedQuery = encodeURIComponent(dateQuery);
    
    const response = await fetch(
      `https://api.github.com/search/issues?q=${encodedQuery}&sort=created&order=desc&per_page=10`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SocialMediaAggregator'
        }
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as GitHubSearchItem;
    this.incrementRequestCounter();
    
    return data.items.filter(item => {
      const createdAt = new Date(item.created_at);
      return createdAt >= timeWindow.start && createdAt <= timeWindow.end;
    }) as unknown as GitHubDiscussion[];
  }

  private async fetchRecentUserRepos(username: string, timeWindow: { start: Date; end: Date }): Promise<GitHubRepo[]> {
    await this.rateLimit();
    
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=20`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SocialMediaAggregator'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos = await response.json() as GitHubRepo[];
    this.incrementRequestCounter();
    
    // Filter to only recent updates
    return repos.filter(repo => {
      const pushedAt = new Date(repo.pushed_at);
      return pushedAt >= timeWindow.start && pushedAt <= timeWindow.end;
    });
  }

  private async fetchRecentOrgRepos(org: string, timeWindow: { start: Date; end: Date }): Promise<GitHubRepo[]> {
    await this.rateLimit();
    
    const response = await fetch(
      `https://api.github.com/orgs/${org}/repos?sort=pushed&per_page=20`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SocialMediaAggregator'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repos = await response.json() as GitHubRepo[];
    this.incrementRequestCounter();
    
    // Filter to only recent updates
    return repos.filter(repo => {
      const pushedAt = new Date(repo.pushed_at);
      return pushedAt >= timeWindow.start && pushedAt <= timeWindow.end;
    });
  }

  private incrementRequestCounter(): void {
    this.state.requestsUsedThisPeriod++;
    this.state.requestsUsedToday++;
  }

  private async loadState(): Promise<void> {
    try {
      const content = await readFile(this.stateFile, 'utf-8');
      this.state = JSON.parse(content);
    } catch {
      // File doesn't exist, use default state
      this.state = {
        lastScrapeTime: new Date(0).toISOString(),
        currentPeriod: 0,
        requestsUsedThisPeriod: 0,
        requestsUsedToday: 0,
        searchesPerformed: []
      };
    }
  }

  private async saveState(): Promise<void> {
    try {
      await writeFile(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.warn('[GitHub] Could not save state:', error);
    }
  }

  getStats(): { period: number; requestsThisPeriod: number; requestsToday: number; limit: number } {
    return {
      period: this.state.currentPeriod,
      requestsThisPeriod: this.state.requestsUsedThisPeriod,
      requestsToday: this.state.requestsUsedToday,
      limit: this.requestsPerPeriod
    };
  }

  private normalizeRepo(repo: GitHubRepo): AggregatedItem {
    return {
      id: `github-repo-${repo.id}`,
      platform: 'github',
      type: 'repository',
      title: repo.name,
      content: repo.description || '',
      author: {
        name: repo.owner.login,
        url: repo.owner.html_url,
        avatar: repo.owner.avatar_url
      },
      timestamp: repo.updated_at,
      url: repo.html_url,
      metrics: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count
      },
      tags: repo.language ? [repo.language] : [],
      raw: repo
    };
  }

  private normalizeIssue(issue: GitHubIssue): AggregatedItem {
    const repoName = issue.html_url.split('/').slice(-3, -1).join('/');
    return {
      id: `github-issue-${issue.id}`,
      platform: 'github',
      type: 'issue',
      title: `${repoName} #${issue.number}: ${issue.title}`,
      content: issue.body || '',
      author: {
        name: issue.user.login,
        url: issue.user.html_url,
        avatar: issue.user.avatar_url
      },
      timestamp: issue.created_at,
      url: issue.html_url,
      metrics: {
        comments: issue.comments
      },
      tags: issue.labels.map(label => label.name),
      raw: issue
    };
  }

  private normalizeDiscussion(discussion: GitHubDiscussion): AggregatedItem {
    return {
      id: `github-discussion-${discussion.id}`,
      platform: 'github',
      type: 'discussion',
      title: discussion.title,
      content: discussion.body || '',
      author: {
        name: discussion.user.login,
        url: discussion.user.html_url,
        avatar: discussion.user.avatar_url
      },
      timestamp: discussion.created_at,
      url: discussion.html_url,
      metrics: {
        comments: discussion.comments
      },
      tags: discussion.labels
        ? discussion.labels.map((l: GitHubLabel) => l.name)
        : (([discussion.category?.name].filter(Boolean) as string[])),
      raw: discussion
    };
  }
}
