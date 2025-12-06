/**
 * MCP Server entry point for Codswallop.
 *
 * This module provides the vibecheck generation tool as an MCP service.
 * In development, it runs locally. In production, it can be deployed
 * to ship.leanmcp.com for classroom scalability.
 */

import { getVibecheckService, VibecheckService } from './services/vibecheck-service';
import { VibecheckInput } from './schemas/vibecheck-input';
import { VibecheckOutput } from './schemas/vibecheck-output';

export { VibecheckService, getVibecheckService };
export { VibecheckInput } from './schemas/vibecheck-input';
export { VibecheckOutput, VibecheckQuestion, VibecheckResult } from './schemas/vibecheck-output';

/**
 * MCP Tool definition for vibecheck generation.
 *
 * This follows the LeanMCP pattern but can be used directly
 * within the VSCode extension without running a separate server.
 */
export interface VibecheckTool {
  name: 'generateVibecheck';
  description: 'Generate comprehension quiz questions for a code snippet';
  inputSchema: {
    type: 'object';
    properties: {
      code: { type: 'string'; description: 'Code snippet to analyse' };
      language: { type: 'string'; enum: ['typescript', 'javascript', 'python'] };
      triggeredBy: { type: 'string'; enum: ['line_spike', 'high_complexity', 'paste'] };
      context: { type: 'string'; description: 'Additional context'; optional: true };
      difficulty: { type: 'string'; enum: ['beginner', 'intermediate', 'advanced']; optional: true };
      numQuestions: { type: 'number'; minimum: 2; maximum: 6; optional: true };
    };
    required: ['code', 'language', 'triggeredBy'];
  };
}

/**
 * Creates the MCP tool definition for vibecheck generation.
 *
 * Returns:
 *     The tool definition object.
 */
export function createVibecheckToolDefinition(): VibecheckTool {
  return {
    name: 'generateVibecheck',
    description: 'Generate comprehension quiz questions for a code snippet',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Code snippet to analyse' },
        language: { type: 'string', enum: ['typescript', 'javascript', 'python'] },
        triggeredBy: { type: 'string', enum: ['line_spike', 'high_complexity', 'paste'] },
        context: { type: 'string', description: 'Additional context', optional: true },
        difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], optional: true },
        numQuestions: { type: 'number', minimum: 2, maximum: 6, optional: true },
      },
      required: ['code', 'language', 'triggeredBy'],
    },
  };
}

/**
 * Executes the vibecheck generation tool.
 *
 * Args:
 *     input: The vibecheck input parameters.
 *
 * Returns:
 *     A promise resolving to the generated questions.
 */
export async function executeVibecheckTool(
  input: VibecheckInput
): Promise<VibecheckOutput> {
  const service = getVibecheckService();
  return service.generateVibecheck(input);
}
