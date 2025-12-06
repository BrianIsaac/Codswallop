/**
 * MCP Client for Codswallop extension.
 *
 * Manages the connection to the vibecheck generation service,
 * supporting both the hosted MCP server (via LeanMCP) and local
 * API key fallback via VSCode's SecretStorage.
 */

import * as vscode from 'vscode';
import {
  getVibecheckService,
  VibecheckInput,
  VibecheckOutput,
  Language,
  TriggerType,
} from './mcp';
import { VibeDetection } from './vibe-detector';
import { getSession } from './auth-provider';

const API_KEY_SECRET_KEY = 'codswallop.anthropicApiKey';

/** MCP JSON-RPC response structure. */
interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: {
    content: Array<{
      type: 'text';
      text: string;
    }>;
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Client for interacting with the vibecheck generation service.
 *
 * Supports two modes:
 * 1. Hosted MCP server (when user is logged in via Clerk)
 * 2. Local Anthropic API key (fallback)
 */
export class MCPClient implements vscode.Disposable {
  private secretStorage: vscode.SecretStorage;
  private configured = false;
  private disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.secretStorage = context.secrets;
  }

  /**
   * Initialises the MCP client by loading the API key from storage.
   */
  async initialise(): Promise<void> {
    const apiKey = await this.secretStorage.get(API_KEY_SECRET_KEY);
    if (apiKey) {
      this.configureService(apiKey);
    }

    const secretChangeHandler = this.secretStorage.onDidChange(async (e) => {
      if (e.key === API_KEY_SECRET_KEY) {
        const newApiKey = await this.secretStorage.get(API_KEY_SECRET_KEY);
        if (newApiKey) {
          this.configureService(newApiKey);
        } else {
          this.configured = false;
        }
      }
    });

    this.disposables.push(secretChangeHandler);
  }

  /**
   * Configures the vibecheck service with an API key.
   */
  private configureService(apiKey: string): void {
    getVibecheckService().setApiKey(apiKey);
    this.configured = true;
    console.log('Codswallop: Vibecheck service configured with local API key');
  }

  /**
   * Checks if the client is configured with an API key.
   */
  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Gets the MCP server URL from configuration.
   */
  private getMcpServerUrl(): string {
    const config = vscode.workspace.getConfiguration('codswallop');
    return config.get<string>('mcpServerUrl') || 'https://codswallop.vercel.app/api/mcp';
  }

  /**
   * Sets the Anthropic API key, storing it securely.
   */
  async setApiKey(apiKey: string): Promise<void> {
    await this.secretStorage.store(API_KEY_SECRET_KEY, apiKey);
    this.configureService(apiKey);
  }

  /**
   * Clears the stored Anthropic API key.
   */
  async clearApiKey(): Promise<void> {
    await this.secretStorage.delete(API_KEY_SECRET_KEY);
    this.configured = false;
    console.log('Codswallop: API key cleared');
  }

  /**
   * Prompts the user to enter their Anthropic API key.
   */
  async promptForApiKey(): Promise<boolean> {
    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter your Anthropic API key for vibecheck generation',
      password: true,
      placeHolder: 'sk-ant-...',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'API key is required';
        }
        if (!value.startsWith('sk-ant-')) {
          return 'API key should start with sk-ant-';
        }
        return null;
      },
    });

    if (apiKey) {
      await this.setApiKey(apiKey);
      vscode.window.showInformationMessage('Codswallop: API key saved successfully');
      return true;
    }

    return false;
  }

  /**
   * Generates a vibecheck quiz for a detection.
   *
   * Tries the hosted MCP server first (if logged in), falls back to local API key.
   */
  async generateVibecheck(detection: VibeDetection): Promise<VibecheckOutput> {
    const session = await getSession();

    // Try hosted MCP server first if user is logged in
    if (session) {
      try {
        console.log('Codswallop: Attempting hosted MCP server...');
        return await this.generateVibecheckViaHostedMcp(detection, session.accessToken);
      } catch (error) {
        console.warn('Codswallop: Hosted MCP server failed, checking fallback...', error);
        // If hosted service fails and we have local API key, use that
        if (this.configured) {
          console.log('Codswallop: Falling back to local API key');
          return this.generateVibecheckViaLocalService(detection);
        }
        // Re-throw if no fallback available
        throw error;
      }
    }

    // Not logged in - check for local API key
    if (this.configured) {
      return this.generateVibecheckViaLocalService(detection);
    }

    // Neither logged in nor API key configured - offer choice
    const choice = await vscode.window.showInformationMessage(
      'To generate vibechecks, you can either login to use the hosted service or provide your own Anthropic API key.',
      'Login',
      'Use API Key'
    );

    if (choice === 'Login') {
      await vscode.commands.executeCommand('codswallop.login');
      const newSession = await getSession();
      if (newSession) {
        return this.generateVibecheckViaHostedMcp(detection, newSession.accessToken);
      }
      throw new Error('Login cancelled or failed');
    } else if (choice === 'Use API Key') {
      const configured = await this.promptForApiKey();
      if (configured) {
        return this.generateVibecheckViaLocalService(detection);
      }
      throw new Error('API key not configured');
    }

    throw new Error('Vibecheck generation cancelled');
  }

  /**
   * Generates vibecheck via the hosted MCP server.
   */
  private async generateVibecheckViaHostedMcp(
    detection: VibeDetection,
    accessToken: string
  ): Promise<VibecheckOutput> {
    const mcpServerUrl = this.getMcpServerUrl();
    const language = this.detectLanguage(detection.uri);
    const requestId = `req_${Date.now()}`;

    const response = await fetch(mcpServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: 'generateVibecheck',
          arguments: {
            code: detection.codeSnippet,
            language,
            triggeredBy: detection.triggeredBy,
            difficulty: 'intermediate',
            questionCount: 4,
            context: `File: ${vscode.Uri.parse(detection.uri).fsPath}, Line: ${detection.line + 1}`,
          },
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication expired. Please login again.');
      }
      throw new Error(`MCP server error: ${response.status} ${response.statusText}`);
    }

    // MCP handler returns SSE-formatted response, parse the data line
    const text = await response.text();
    const dataMatch = text.match(/^data: (.+)$/m);
    if (!dataMatch) {
      throw new Error('Invalid MCP response format');
    }
    const data = JSON.parse(dataMatch[1]) as MCPResponse;

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.result?.content?.[0]?.text) {
      throw new Error('Invalid response from MCP server');
    }

    const parsed = JSON.parse(data.result.content[0].text);
    return {
      questions: parsed.questions,
      focusAreas: parsed.focusAreas,
      estimatedDifficulty: parsed.estimatedDifficulty,
    };
  }

  /**
   * Generates vibecheck via the local Anthropic API key.
   */
  private async generateVibecheckViaLocalService(
    detection: VibeDetection
  ): Promise<VibecheckOutput> {
    const language = this.detectLanguage(detection.uri);

    const input: VibecheckInput = {
      code: detection.codeSnippet,
      language,
      triggeredBy: detection.triggeredBy as TriggerType,
      context: `File: ${vscode.Uri.parse(detection.uri).fsPath}, Line: ${detection.line + 1}`,
      difficulty: 'intermediate',
      numQuestions: 4,
    };

    return getVibecheckService().generateVibecheck(input);
  }

  /**
   * Detects the programming language from a file URI.
   */
  private detectLanguage(uri: string): Language {
    const lowerUri = uri.toLowerCase();

    if (lowerUri.endsWith('.ts') || lowerUri.endsWith('.tsx')) {
      return 'typescript';
    }
    if (lowerUri.endsWith('.js') || lowerUri.endsWith('.jsx')) {
      return 'javascript';
    }
    if (lowerUri.endsWith('.py')) {
      return 'python';
    }

    return 'typescript';
  }

  /**
   * Disposes of the MCP client resources.
   */
  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

let mcpClientInstance: MCPClient | null = null;

/**
 * Initialises the MCP client singleton.
 */
export async function initMCPClient(
  context: vscode.ExtensionContext
): Promise<MCPClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient(context);
    await mcpClientInstance.initialise();
  }
  return mcpClientInstance;
}

/**
 * Gets the MCP client singleton.
 */
export function getMCPClient(): MCPClient | null {
  return mcpClientInstance;
}
