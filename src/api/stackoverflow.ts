import { BasePlatformAPI, AggregatedItem, FetchOptions, FetchResult, Platform } from '../types/index';

interface StackOverflowQuestion {
  question_id: number;
  title: string;
  body_markdown?: string;
  link: string;
  score: number;
  answer_count: number;
  view_count: number;
  creation_date: number;
  last_activity_date: number;
  tags: string[];
  owner: {
    display_name: string;
    link: string;
    profile_image?: string;
  };
  is_answered: boolean;
}

interface StackOverflowAnswer {
  answer_id: number;
  question_id: number;
  body_markdown?: string;
  link: string;
  score: number;
  creation_date: number;
  owner: {
    display_name: string;
    link: string;
    profile_image?: string;
  };
  is_accepted: boolean;
}

export class StackOverflowAPI extends BasePlatformAPI {
  readonly platform: Platform = 'stackoverflow';
  readonly rateLimitPerHour = 300; // 300 requests/day without key, 10000 with key
  
  private apiKey?: string;
  private tags: string[];

  constructor(config: { key?: string; tags?: string[] } = {}) {
    super();
    this.apiKey = config.key;
    this.tags = config.tags || ['javascript', 'typescript', 'react', 'nodejs'];
  }

  async fetchItems(options: FetchOptions = {}): Promise<FetchResult> {
    const items: AggregatedItem[] = [];
    
    try {
      // Fetch questions for each tag
      for (const tag of this.tags.slice(0, 3)) { // Limit to avoid rate limits
        const questions = await this.fetchQuestions(tag);
        items.push(...questions.map(q => this.normalizeQuestion(q)));

        // Fetch answers for recent questions
        for (const question of questions.slice(0, 2)) {
          const answers = await this.fetchAnswers(question.question_id);
          items.push(...answers.map(a => this.normalizeAnswer(a, question.title)));
        }
      }

      return {
        items: items.slice(0, options.limit || 30),
        hasMore: false
      };
    } catch (error) {
      throw this.handleError(error, 'fetchItems');
    }
  }

  private async fetchQuestions(tag: string): Promise<StackOverflowQuestion[]> {
    await this.rateLimit();
    
    const params = new URLSearchParams({
      order: 'desc',
      sort: 'creation',
      tagged: tag,
      site: 'stackoverflow',
      pagesize: '5',
      filter: 'withbody'
    });

    if (this.apiKey) {
      params.append('key', this.apiKey);
    }

    const response = await fetch(
      `https://api.stackexchange.com/2.3/questions?${params.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SocialMediaAggregator'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Stack Overflow API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { items?: StackOverflowQuestion[] };
    return data.items || [];
  }

  private async fetchAnswers(questionId: number): Promise<StackOverflowAnswer[]> {
    await this.rateLimit();
    
    const params = new URLSearchParams({
      order: 'desc',
      sort: 'votes',
      site: 'stackoverflow',
      pagesize: '3',
      filter: 'withbody'
    });

    if (this.apiKey) {
      params.append('key', this.apiKey);
    }

    const response = await fetch(
      `https://api.stackexchange.com/2.3/questions/${questionId}/answers?${params.toString()}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SocialMediaAggregator'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Stack Overflow API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { items?: StackOverflowAnswer[] };
    return data.items || [];
  }

  private normalizeQuestion(question: StackOverflowQuestion): AggregatedItem {
    return {
      id: `stackoverflow-question-${question.question_id}`,
      platform: 'stackoverflow',
      type: 'question',
      title: question.title,
      content: question.body_markdown || '',
      author: {
        name: question.owner.display_name,
        url: question.owner.link,
        avatar: question.owner.profile_image
      },
      timestamp: new Date(question.creation_date * 1000).toISOString(),
      url: question.link,
      metrics: {
        upvotes: question.score,
        comments: question.answer_count,
        views: question.view_count
      },
      tags: question.tags,
      raw: question
    };
  }

  private normalizeAnswer(answer: StackOverflowAnswer, questionTitle: string): AggregatedItem {
    return {
      id: `stackoverflow-answer-${answer.answer_id}`,
      platform: 'stackoverflow',
      type: 'answer',
      title: `Answer to: ${questionTitle}`,
      content: answer.body_markdown || '',
      author: {
        name: answer.owner.display_name,
        url: answer.owner.link,
        avatar: answer.owner.profile_image
      },
      timestamp: new Date(answer.creation_date * 1000).toISOString(),
      url: answer.link,
      metrics: {
        upvotes: answer.score
      },
      tags: [],
      raw: answer
    };
  }
}
