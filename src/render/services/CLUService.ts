/**
 * CLUService - взаимодействие с Azure CLU для определения intent и entities
 */

interface CLUIntent {
  category: string;
  confidenceScore: number;
}

interface CLUEntity {
  category: string;
  text: string;
  offset: number;
  length: number;
  confidenceScore: number;
  extraInformation?: any[];
}

export interface CLUResponse {
  topIntent: string;
  intents: CLUIntent[];
  entities: CLUEntity[];
  raw: any;
}

interface CLUConfig {
  baseUrl: string;
  apiKey: string;
  projectName?: string;
  deploymentName?: string;
  locale: string;
}

export class CLUService {
  private config: CLUConfig;

  constructor(config: CLUConfig) {
    this.config = config;
  }

  async predict(text: string): Promise<CLUResponse> {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🧠 CLUService.predict() called');
      console.log('📝 Input text:', `"${text}"`);
      console.log('📡 API URL:', `${this.config.baseUrl}/v1/clu/predict`);
      console.log('🔑 API Key:', this.config.apiKey.substring(0, 15) + '...');

      const requestBody = {
        text,
        projectName: this.config.projectName,
        deploymentName: this.config.deploymentName,
        locale: this.config.locale
      };

      console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));
      console.log('🚀 Sending POST request...');

      const response = await fetch(`${this.config.baseUrl}/v1/clu/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response received');
      console.log('   Status:', response.status, response.statusText);
      console.log('   Headers:', {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length')
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ CLU API error response:', error);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        throw new Error(error.detail || `CLU request failed: ${response.status}`);
      }

      const result: CLUResponse = await response.json();

      console.log('✅ CLU Response received successfully');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 INTENT:', result.topIntent);
      console.log('📊 Confidence:', (result.intents[0]?.confidenceScore * 100).toFixed(1) + '%');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (result.entities.length > 0) {
        console.log('📋 ENTITIES:');
        result.entities.forEach((entity, index) => {
          console.log(`   ${index + 1}. ${entity.category} = "${entity.text}" (${(entity.confidenceScore * 100).toFixed(1)}%)`);
        });
      } else {
        console.log('📋 ENTITIES: none');
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 Full response:', result);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return result;
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ CLU prediction failed');
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));

      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('🔴 Network error - is the API server running on', this.config.baseUrl, '?');
      }

      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      throw error;
    }
  }

  getTopIntent(response: CLUResponse): string {
    return response.topIntent;
  }

  getEntitiesByCategory(response: CLUResponse, category: string): CLUEntity[] {
    return response.entities.filter(e => e.category === category);
  }

  getEntityText(entity: CLUEntity): string {
    return entity.text;
  }
}

export const createCLUService = (config: CLUConfig) => new CLUService(config);