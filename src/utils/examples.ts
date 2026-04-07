import type { ModelExample } from '../types/index.js';

interface ModelInfo {
  id: string;
  providerId: string;
  npm?: string;
  api?: string;
}

export function generateExamples(model: ModelInfo): ModelExample[] {
  const modelId = model.id;
  const providerId = model.providerId;

  return [
    {
      language: 'curl',
      description: 'Basic API call with cURL',
      code: `curl https://api.example.com/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "${modelId}", "messages": [{"role": "user", "content": "Hello!"}]}'`
    },
    {
      language: 'javascript',
      description: 'JavaScript/TypeScript with fetch',
      code: `const response = await fetch('https://api.example.com/v1/chat', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer YOUR_API_KEY', 
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({ 
    model: '${modelId}', 
    messages: [{ role: 'user', content: 'Hello!' }] 
  })
});
const data = await response.json();`
    },
    {
      language: 'python',
      description: 'Python with OpenAI SDK',
      code: `import openai
openai.api_key = "your-api-key"

response = openai.ChatCompletion.create(
    model="${modelId}",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`
    }
  ];
}
