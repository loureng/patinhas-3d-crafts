import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import { ErrorDetails } from './error-crawler.js';

dotenv.config();

export interface IssueDescription {
  title: string;
  body: string;
  labels: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  milestone?: string;
}

export class GeminiIssueGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateIssueDescription(error: ErrorDetails): Promise<IssueDescription> {
    console.log(`🤖 Generating issue description for: ${error.type} - ${error.message}`);

    try {
      const prompt = this.buildPrompt(error);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseResponse(text, error);
    } catch (error) {
      console.error('Error generating issue description:', error);
      return this.getFallbackDescription(error as ErrorDetails);
    }
  }

  async generateBatchDescriptions(errors: ErrorDetails[]): Promise<Map<string, IssueDescription>> {
    console.log(`🤖 Generating descriptions for ${errors.length} errors...`);
    
    const descriptions = new Map<string, IssueDescription>();
    const batchSize = 5; // Process in batches to avoid rate limits

    for (let i = 0; i < errors.length; i += batchSize) {
      const batch = errors.slice(i, i + batchSize);
      const batchPromises = batch.map(async (error) => {
        try {
          const description = await this.generateIssueDescription(error);
          descriptions.set(error.id, description);
          
          // Small delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`Failed to generate description for error ${error.id}:`, err);
          descriptions.set(error.id, this.getFallbackDescription(error));
        }
      });

      await Promise.all(batchPromises);
      
      // Delay between batches
      if (i + batchSize < errors.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return descriptions;
  }

  private buildPrompt(error: ErrorDetails): string {
    const context = `
# Jardim das Patinhas - E-commerce de Produtos 3D para Pets

## Context
Jardim das Patinhas é um e-commerce brasileiro especializado em produtos 3D personalizados para pets. O site utiliza:
- Frontend: React + TypeScript + Vite
- UI: Tailwind CSS + Radix UI
- 3D: Three.js para visualização de produtos
- Backend: Supabase (BaaS)
- Pagamentos: Mercado Pago
- Autenticação: Supabase Auth + Google OAuth

## Error Details
**Type:** ${error.type}
**Severity:** ${error.severity}
**URL:** ${error.url}
**Message:** ${error.message}
**Timestamp:** ${error.timestamp}

**Technical Details:**
${JSON.stringify(error.details, null, 2)}

${error.stackTrace ? `**Stack Trace:**
${error.stackTrace}` : ''}

## Your Task
Analyze this error and create a comprehensive GitHub issue that includes:

1. **Clear, concise title** (50-80 characters)
2. **Detailed description** with:
   - Problem summary
   - Steps to reproduce
   - Expected vs actual behavior
   - Technical analysis
   - Suggested solutions
   - Priority level reasoning

3. **Appropriate labels** from: [bug, enhancement, frontend, backend, ui, api, security, performance, a11y, mobile, critical, high-priority]

4. **Priority assessment** (low/medium/high/critical)

Focus on:
- Business impact for pet e-commerce
- User experience implications
- Technical root cause analysis
- Actionable solutions
- Brazilian Portuguese context when relevant

Format your response as JSON:
{
  "title": "Clear issue title",
  "body": "Detailed markdown description",
  "labels": ["bug", "frontend", "high-priority"],
  "priority": "high",
  "assignee": "",
  "milestone": ""
}
`;

    return context;
  }

  private parseResponse(text: string, originalError: ErrorDetails): IssueDescription {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (!parsed.title || !parsed.body) {
          throw new Error('Missing required fields in AI response');
        }

        return {
          title: this.sanitizeTitle(parsed.title),
          body: this.enhanceBody(parsed.body, originalError),
          labels: this.validateLabels(parsed.labels || []),
          priority: this.validatePriority(parsed.priority || originalError.severity),
          assignee: parsed.assignee || '',
          milestone: parsed.milestone || ''
        };
      }
      
      throw new Error('No JSON found in AI response');
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getFallbackDescription(originalError);
    }
  }

  private sanitizeTitle(title: string): string {
    // Remove markdown, limit length, ensure it starts with capital
    const cleaned = title.replace(/[#*`]/g, '').trim();
    const limited = cleaned.length > 80 ? cleaned.substring(0, 77) + '...' : cleaned;
    return limited.charAt(0).toUpperCase() + limited.slice(1);
  }

  private enhanceBody(body: string, error: ErrorDetails): string {
    const enhancedBody = `${body}

---

## 🔍 **Technical Details**

**Error ID:** \`${error.id}\`
**Detected:** ${new Date(error.timestamp).toLocaleString('pt-BR')}
**URL:** ${error.url}
**Type:** ${error.type}
**Severity:** ${error.severity}

<details>
<summary>📋 Raw Error Data</summary>

\`\`\`json
${JSON.stringify(error.details, null, 2)}
\`\`\`

</details>

${error.stackTrace ? `
<details>
<summary>🐛 Stack Trace</summary>

\`\`\`
${error.stackTrace}
\`\`\`

</details>
` : ''}

---

**Generated by:** 🤖 Autonomous Error Detection System
**Context:** Jardim das Patinhas - Pet E-commerce Platform`;

    return enhancedBody;
  }

  private validateLabels(labels: string[]): string[] {
    const validLabels = [
      'bug', 'enhancement', 'frontend', 'backend', 'ui', 'api', 
      'security', 'performance', 'a11y', 'mobile', 'critical', 
      'high-priority', 'medium-priority', 'low-priority',
      'error-detection', 'automation', 'crawler'
    ];

    const filtered = labels.filter(label => 
      typeof label === 'string' && validLabels.includes(label.toLowerCase())
    );

    // Add default labels based on error type
    const defaultLabels = this.getDefaultLabels(labels[0] || '');
    
    return [...new Set([...filtered, ...defaultLabels])];
  }

  private getDefaultLabels(errorType: string): string[] {
    const labelMap: Record<string, string[]> = {
      'page_not_found': ['bug', 'frontend', 'routing'],
      'invalid_redirect': ['bug', 'frontend', 'routing'],
      'dead_click': ['bug', 'frontend', 'ui'],
      'js_error': ['bug', 'frontend', 'javascript'],
      'api_error': ['bug', 'backend', 'api'],
      'rendering_error': ['bug', 'frontend', 'ui'],
      'console_error': ['bug', 'frontend', 'javascript']
    };

    return labelMap[errorType] || ['bug', 'error-detection'];
  }

  private validatePriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    return validPriorities.includes(priority) ? priority as any : 'medium';
  }

  private getFallbackDescription(error: ErrorDetails): IssueDescription {
    const titleMap: Record<string, string> = {
      'page_not_found': 'Página não encontrada (404)',
      'invalid_redirect': 'Redirecionamento inválido detectado',
      'dead_click': 'Elemento clicável sem funcionalidade',
      'js_error': 'Erro JavaScript detectado',
      'api_error': 'Falha na API',
      'rendering_error': 'Problema de renderização',
      'console_error': 'Erro no console do navegador'
    };

    const title = titleMap[error.type] || 'Erro detectado automaticamente';

    const body = `## 🚨 Erro Detectado Automaticamente

**Descrição:** ${error.message}

**URL:** ${error.url}
**Tipo:** ${error.type}
**Severidade:** ${error.severity}
**Detectado em:** ${new Date(error.timestamp).toLocaleString('pt-BR')}

### 📋 Detalhes Técnicos

\`\`\`json
${JSON.stringify(error.details, null, 2)}
\`\`\`

${error.stackTrace ? `
### 🐛 Stack Trace

\`\`\`
${error.stackTrace}
\`\`\`
` : ''}

### 🔧 Próximos Passos

1. Reproduzir o erro na URL indicada
2. Analisar o código relacionado
3. Implementar correção
4. Testar a solução
5. Verificar regressões

---

**Gerado por:** Sistema Autônomo de Detecção de Erros
**ID do Erro:** \`${error.id}\``;

    return {
      title: `${title} - ${error.url}`,
      body,
      labels: this.getDefaultLabels(error.type),
      priority: error.severity as any,
      assignee: '',
      milestone: ''
    };
  }

  // Health check method
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Test connection - respond with "OK"');
      const response = await result.response;
      const text = response.text();
      return text.toLowerCase().includes('ok');
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

// CLI usage for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const generator = new GeminiIssueGenerator();
    
    // Test connection
    const connected = await generator.testConnection();
    console.log(`Connection test: ${connected ? '✅ OK' : '❌ Failed'}`);
    
    if (!connected) {
      console.error('Please check your GEMINI_API_KEY environment variable');
      process.exit(1);
    }

    // Test with sample error
    const sampleError: ErrorDetails = {
      id: 'test-123',
      type: 'dead_click',
      severity: 'medium',
      url: 'https://jardimdaspatinhas.com/produtos',
      message: 'Button "Adicionar ao Carrinho" não responde',
      details: {
        selector: 'button.add-to-cart',
        text: 'Adicionar ao Carrinho',
        expectedAction: 'add_item_to_cart'
      },
      timestamp: new Date().toISOString()
    };

    const description = await generator.generateIssueDescription(sampleError);
    console.log('\n📝 Generated Issue:');
    console.log('Title:', description.title);
    console.log('Labels:', description.labels);
    console.log('Priority:', description.priority);
    console.log('\nBody:\n', description.body);
  })();
}