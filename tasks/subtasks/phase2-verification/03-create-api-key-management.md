# Task 03: Create Secure API Key Management System

## Description
Implement a secure API key management system to handle authentication for multiple platform APIs while protecting sensitive credentials.

## Files to Create/Modify

### 1. Environment Configuration (`src/config/api-keys.ts`)
```typescript
interface APIKeyConfig {
  github?: string;
  reddit?: {
    clientId: string;
    clientSecret: string;
    userAgent: string;
  };
  stackExchange?: string;
  huggingFace?: string;
  discord?: {
    botToken: string;
    clientId: string;
  };
  telegram?: string;
}

class APIKeyManager {
  private keys: APIKeyConfig;
  
  constructor();
  
  // Get API key with validation
  getKey(platform: Platform): string | null;
  
  // Check if platform is configured
  isConfigured(platform: Platform): boolean;
  
  // Validate key format
  validateKey(platform: Platform, key: string): boolean;
  
  // Mask sensitive keys for logging
  maskKey(key: string): string;
}
```

### 2. Environment Variables (`.env.example`)
```bash
# GitHub API (optional but recommended)
# Create token: https://github.com/settings/tokens
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Reddit API (required)
# Create app: https://www.reddit.com/prefs/apps
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=freeai4all/1.0

# Stack Exchange API (required)
# Create key: https://stackapps.com/apps/oauth/register
STACK_EXCHANGE_KEY=your_stack_exchange_key

# Hugging Face API (optional)
# Create token: https://huggingface.co/settings/tokens
HUGGING_FACE_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx

# Discord Bot (required for Discord integration)
# Create bot: https://discord.com/developers/applications
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_bot_client_id

# Telegram Bot (optional)
# Create bot: https://t.me/BotFather
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 3. API Client Factory (`src/api/ClientFactory.ts`)
```typescript
class APIClientFactory {
  private keyManager: APIKeyManager;
  private rateLimiters: Map<Platform, RateLimiter>;
  
  constructor();
  
  // Create authenticated API client for platform
  createClient(platform: Platform): BasePlatformAPI;
  
  // Create client with custom configuration
  createClientWithConfig(platform: Platform, config: any): BasePlatformAPI;
  
  // Get client without authentication (for public APIs)
  createPublicClient(platform: Platform): BasePlatformAPI;
}
```

### 4. Secure Storage (`src/utils/secure-storage.ts`)
```typescript
interface SecureStorageOptions {
  encryptionKey?: string;
  useFileVault?: boolean;
}

class SecureStorage {
  private encryptionKey: string;
  
  constructor(options?: SecureStorageOptions);
  
  // Encrypt sensitive data
  encrypt(data: string): string;
  
  // Decrypt sensitive data
  decrypt(encryptedData: string): string;
  
  // Store encrypted API keys
  storeKey(platform: Platform, key: string): void;
  
  // Retrieve decrypted API key
  retrieveKey(platform: Platform): string | null;
  
  // Rotate encryption key
  rotateKey(newKey: string): void;
}
```

### 5. API Validation (`src/utils/api-validation.ts`)
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class APIValidator {
  // Validate API key format
  validateKeyFormat(platform: Platform, key: string): ValidationResult;
  
  // Test API connectivity
  testConnection(platform: Platform, key: string): Promise<ValidationResult>;
  
  // Check rate limits
  checkRateLimits(platform: Platform): Promise<RateLimitInfo>;
  
  // Validate all configured keys
  validateAllKeys(): Promise<Record<Platform, ValidationResult>>;
}
```

## Implementation Plan

### Step 1: Basic Key Management
- Create APIKeyManager class
- Implement environment variable loading
- Add key validation and masking
- Create .env.example template

### Step 2: Secure Storage
- Implement encryption/decryption utilities
- Create secure key storage system
- Add key rotation functionality
- Integrate with APIKeyManager

### Step 3: Client Factory
- Create APIClientFactory class
- Implement platform-specific client creation
- Add authentication injection
- Handle missing keys gracefully

### Step 4: Validation System
- Create APIValidator class
- Implement format validation
- Add connectivity testing
- Create validation dashboard

### Step 5: Security Features
- Add rate limit tracking
- Implement key usage monitoring
- Create audit logging
- Add key expiration handling

## Security Considerations

### Key Protection
✅ **Never log raw API keys** - always mask in logs  
✅ **Use environment variables** - never commit keys to repo  
✅ **Encrypt sensitive storage** - protect keys at rest  
✅ **Implement key rotation** - regular key updates  
✅ **Rate limit monitoring** - detect key abuse  

### Access Control
✅ **Principle of least privilege** - minimal required scopes  
✅ **Key separation** - different keys per environment  
✅ **Audit trail** - log key usage (without exposing keys)  
✅ **Expiration handling** - detect and handle expired keys  

## Platform-Specific Requirements

### GitHub API
```typescript
// Token validation
const GITHUB_TOKEN_PATTERN = /^ghp_[a-zA-Z0-9]{36}$/;
// Scopes: public_repo (minimum), read:org (if needed)
// Rate limit: 5000/hour authenticated, 60/hour unauthenticated
```

### Reddit API
```typescript
// Client credentials format
const REDDIT_CLIENT_PATTERN = /^[a-zA-Z0-9_-]{14,}$/;
// Requires OAuth 2.0 flow for access token
// Rate limit: 60/minute
```

### Stack Exchange API
```typescript
// Key format
const STACKEXCHANGE_KEY_PATTERN = /^[a-zA-Z0-9]{24}$/;
// Rate limit: 10000/day authenticated, 300/day unauthenticated
```

### Discord API
```typescript
// Bot token format
const DISCORD_TOKEN_PATTERN = /^M[A-Z0-9]{23}\.[\w-]{6}\.[\w-]{27}$/;
// Requires bot permissions for server access
```

## Error Handling

### Missing Keys
```typescript
class MissingAPIKeyError extends Error {
  constructor(platform: Platform) {
    super(`API key for ${platform} is not configured`);
    this.name = 'MissingAPIKeyError';
  }
}
```

### Invalid Keys
```typescript
class InvalidAPIKeyError extends Error {
  constructor(platform: Platform, reason: string) {
    super(`Invalid API key for ${platform}: ${reason}`);
    this.name = 'InvalidAPIKeyError';
  }
}
```

### Rate Limits
```typescript
class RateLimitExceededError extends Error {
  constructor(platform: Platform, resetTime: Date) {
    super(`Rate limit exceeded for ${platform}. Resets at ${resetTime}`);
    this.name = 'RateLimitExceededError';
  }
}
```

## Testing Strategy

### Unit Tests
- Test key validation patterns
- Test encryption/decryption
- Test client creation with/without keys
- Test error handling

### Integration Tests
- Test real API connections
- Test rate limit handling
- Test key rotation
- Test secure storage

### Security Tests
- Test that keys never appear in logs
- Test encryption strength
- Test unauthorized access prevention
- Test audit trail completeness

## Acceptance Criteria

✅ **Secure key storage** with encryption
✅ **API key validation** for all platforms
✅ **Graceful degradation** when keys missing
✅ **Comprehensive logging** without exposing keys
✅ **Rate limit monitoring** and handling
✅ **Key rotation** functionality
✅ **Security tests** passing all scenarios

## Files to Create
- `src/config/api-keys.ts`
- `.env.example`
- `src/api/ClientFactory.ts`
- `src/utils/secure-storage.ts`
- `src/utils/api-validation.ts`
- `tests/api/key-management.test.ts`

## Dependencies
- Task 01: Architecture and interfaces
- Task 02: Basic service structure

## Time Estimate
2-3 days for implementation and security testing

## Notes
Security is critical for this component. All API keys must be properly protected, and the system should fail gracefully when credentials are missing or invalid. Consider using a secrets management service in production environments.