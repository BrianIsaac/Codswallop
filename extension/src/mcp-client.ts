/**
 * MCP Client for Codswallop extension.
 *
 * Manages the connection to the vibecheck generation service,
 * handles API key storage via VSCode's SecretStorage, and provides
 * a clean interface for generating vibechecks.
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

/**
 * Client for interacting with the vibecheck generation service.
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
   *
   * Returns:
   *     A promise that resolves when initialisation is complete.
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
    console.log('Codswallop: Vibecheck service configured');
  }

  /**
   * Checks if the client is configured with an API key.
   *
   * Returns:
   *     True if an API key has been set.
   */
  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Sets the Anthropic API key, storing it securely.
   *
   * Args:
   *     apiKey: The Anthropic API key.
   *
   * Returns:
   *     A promise that resolves when the key is stored.
   */
  async setApiKey(apiKey: string): Promise<void> {
    await this.secretStorage.store(API_KEY_SECRET_KEY, apiKey);
    this.configureService(apiKey);
  }

  /**
   * Clears the stored Anthropic API key.
   *
   * Returns:
   *     A promise that resolves when the key is cleared.
   */
  async clearApiKey(): Promise<void> {
    await this.secretStorage.delete(API_KEY_SECRET_KEY);
    this.configured = false;
    console.log('Codswallop: API key cleared');
  }

  /**
   * Prompts the user to enter their Anthropic API key.
   *
   * Returns:
   *     A promise that resolves to true if the key was set, false otherwise.
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
   * Args:
   *     detection: The vibe detection that triggered the vibecheck.
   *
   * Returns:
   *     A promise resolving to the generated vibecheck output.
   *
   * Raises:
   *     Error: If the client is not configured or generation fails.
   */
  async generateVibecheck(detection: VibeDetection): Promise<VibecheckOutput> {
    // Check if user is logged in or has API key configured
    const session = await getSession();

    if (!this.configured && !session) {
      // Neither logged in nor API key configured - offer choice
      const choice = await vscode.window.showInformationMessage(
        'To generate vibechecks, you can either login to use the hosted service or provide your own Anthropic API key.',
        'Login',
        'Use API Key'
      );

      if (choice === 'Login') {
        await vscode.commands.executeCommand('codswallop.login');
        // Check again after login
        const newSession = await getSession();
        if (!newSession) {
          throw new Error('Login cancelled or failed');
        }
      } else if (choice === 'Use API Key') {
        const configured = await this.promptForApiKey();
        if (!configured) {
          throw new Error('API key not configured');
        }
      } else {
        throw new Error('Vibecheck generation cancelled');
      }
    } else if (!this.configured && session) {
      // Logged in but no API key - this is fine, will use hosted service in Phase 5
      // For now, prompt for API key as hosted service isn't implemented yet
      const choice = await vscode.window.showInformationMessage(
        'Hosted vibecheck service is not yet available. Please provide your Anthropic API key to continue.',
        'Use API Key',
        'Cancel'
      );

      if (choice === 'Use API Key') {
        const configured = await this.promptForApiKey();
        if (!configured) {
          throw new Error('API key not configured');
        }
      } else {
        throw new Error('Vibecheck generation cancelled');
      }
    }

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
 *
 * Args:
 *     context: The extension context.
 *
 * Returns:
 *     The initialised MCP client.
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
 *
 * Returns:
 *     The MCP client instance, or null if not initialised.
 */
export function getMCPClient(): MCPClient | null {
  return mcpClientInstance;
}
