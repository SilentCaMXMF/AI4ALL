import { BasePlatformAPI, AggregatedItem, FetchOptions, FetchResult, Platform, ContentType } from '../types/index.js';

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
}

export class GitHubAPI extends BasePlatformAPI {
  readonly platform: Platform = 'github';
  readonly rateLimitPerHour = 5000;
  
  private token: string;
  private username?: string;
  private orgs: string[];

  constructor(config: { token: string; username?: string; orgs?: string[] }) {
    super();
    this.token = config.token;
    this.username = config.username;
    this.orgs = config.orgs || [];
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    const items: AggregatedItem[] = [];
    
    try {
      // Fetch user repos
      if (this.username) {
        const repos = await this.fetchUserRepos(this.username);
        items.push(...repos.map(repo => this.normalizeRepo(repo)));
      }

      // Fetch org repos
      for (const org of this.orgs) {
        const repos = await this.fetchOrgRepos(org);
        items.push(...repos.map(repo => this.normalizeRepo(repo)));
      }

      // Fetch recent issues from all repos
      const allRepos = items.filter(item => item.type === 'repository');
      for (const repo of allRepos.slice(0, 5)) { // Limit to avoid rate limits
        const [owner, repoName] = repo.url.replace('https://github.com/', '').split('/');
        if (owner && repoName) {
          const issues = await this.fetchRepoIssues(owner, repoName);
          items.push(...issues.map(issue => this.normalizeIssue(issue, repo.title)));
        }
      }

      return {
        items: items.slice(0, options.limit || 50),
        hasMore: false
      };
    } catch (error) {
      throw this.handleError(error, 'fetchItems');
    }
  }

  private async fetchUserRepos(username: string): Promise<GitHubRepo[]> {
    await this.rateLimit();
    
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SocialMediaAggregator'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchOrgRepos(org: string): Promise<GitHubRepo[]> {
    await this.rateLimit();
    
    const response = await fetch(`https://api.github.com/orgs/${org}/repos?sort=updated&per_page=10`, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SocialMediaAggregator'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async fetchRepoIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
    await this.rateLimit();
    
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=open&sort=created&per_page=5`,
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

    return response.json();
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

  private normalizeIssue(issue: GitHubIssue, repoName: string): AggregatedItem {
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
}
