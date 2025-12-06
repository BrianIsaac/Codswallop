import * as vscode from 'vscode';
import * as ts from 'typescript';
import { getEventBus, FunctionComplexity } from './event-bus';

/**
 * Analyses TypeScript/JavaScript code for cyclomatic complexity.
 *
 * Uses the formula: CC = 1 + (if) + (loops) + (case) + (catch) + (&&/||) + (ternary)
 */
export class ComplexityAnalyser implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private cache = new Map<string, { version: number; functions: FunctionComplexity[] }>();
  private readonly debounceMs: number;

  constructor() {
    const config = vscode.workspace.getConfiguration('codswallop');
    this.debounceMs = 500;

    this.setupListeners();
  }

  /**
   * Sets up document change listeners for complexity analysis.
   */
  private setupListeners(): void {
    const changeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
      if (this.isAnalysableDocument(event.document)) {
        this.scheduleAnalysis(event.document);
      }
    });

    const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
      if (this.isAnalysableDocument(document)) {
        this.scheduleAnalysis(document);
      }
    });

    this.disposables.push(changeDisposable, openDisposable);

    vscode.window.visibleTextEditors.forEach((editor) => {
      if (this.isAnalysableDocument(editor.document)) {
        this.scheduleAnalysis(editor.document);
      }
    });
  }

  /**
   * Checks if a document should be analysed for complexity.
   */
  private isAnalysableDocument(document: vscode.TextDocument): boolean {
    const supportedLanguages = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'];
    return supportedLanguages.includes(document.languageId);
  }

  /**
   * Schedules a debounced complexity analysis for a document.
   */
  private scheduleAnalysis(document: vscode.TextDocument): void {
    const uri = document.uri.toString();

    const existingTimer = this.debounceTimers.get(uri);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.analyseDocument(document);
      this.debounceTimers.delete(uri);
    }, this.debounceMs);

    this.debounceTimers.set(uri, timer);
  }

  /**
   * Analyses a document and emits complexity events.
   */
  analyseDocument(document: vscode.TextDocument): FunctionComplexity[] {
    const uri = document.uri.toString();
    const version = document.version;

    const cached = this.cache.get(uri);
    if (cached && cached.version === version) {
      return cached.functions;
    }

    const text = document.getText();
    const functions = this.analyseFunctions(text, document.languageId);

    this.cache.set(uri, { version, functions });

    getEventBus().fire('complexity:analysed', { uri, functions });

    return functions;
  }

  /**
   * Parses source code and calculates complexity for each function.
   */
  private analyseFunctions(sourceText: string, languageId: string): FunctionComplexity[] {
    const functions: FunctionComplexity[] = [];

    const scriptKind = this.getScriptKind(languageId);
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );

    const visit = (node: ts.Node): void => {
      if (this.isFunctionLike(node)) {
        const complexity = this.calculateComplexity(node);
        const name = this.getFunctionName(node);
        const startLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;
        const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;

        functions.push({
          name,
          line: startLine,
          complexity,
          endLine,
        });
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);

    return functions;
  }

  /**
   * Determines the TypeScript script kind from the language ID.
   */
  private getScriptKind(languageId: string): ts.ScriptKind {
    switch (languageId) {
      case 'typescript':
        return ts.ScriptKind.TS;
      case 'typescriptreact':
        return ts.ScriptKind.TSX;
      case 'javascript':
        return ts.ScriptKind.JS;
      case 'javascriptreact':
        return ts.ScriptKind.JSX;
      default:
        return ts.ScriptKind.TS;
    }
  }

  /**
   * Checks if a node is a function-like declaration.
   */
  private isFunctionLike(node: ts.Node): boolean {
    return (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isConstructorDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node)
    );
  }

  /**
   * Extracts the function name from a function-like node.
   */
  private getFunctionName(node: ts.Node): string {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      return node.name?.getText() || '<anonymous>';
    }
    if (ts.isConstructorDeclaration(node)) {
      return 'constructor';
    }
    if (ts.isGetAccessorDeclaration(node)) {
      return `get ${node.name.getText()}`;
    }
    if (ts.isSetAccessorDeclaration(node)) {
      return `set ${node.name.getText()}`;
    }
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent) && parent.name) {
        return parent.name.getText();
      }
      if (ts.isPropertyAssignment(parent) && parent.name) {
        return parent.name.getText();
      }
    }
    return '<anonymous>';
  }

  /**
   * Calculates cyclomatic complexity for a function node.
   *
   * CC = 1 + (if) + (loops) + (case) + (catch) + (&&/||) + (ternary)
   */
  private calculateComplexity(node: ts.Node): number {
    let complexity = 1;

    const countComplexity = (n: ts.Node): void => {
      switch (n.kind) {
        case ts.SyntaxKind.IfStatement:
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.DoStatement:
        case ts.SyntaxKind.CaseClause:
        case ts.SyntaxKind.CatchClause:
        case ts.SyntaxKind.ConditionalExpression:
          complexity++;
          break;
        case ts.SyntaxKind.BinaryExpression:
          const binary = n as ts.BinaryExpression;
          if (
            binary.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
            binary.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
            binary.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
          ) {
            complexity++;
          }
          break;
      }

      ts.forEachChild(n, countComplexity);
    };

    ts.forEachChild(node, countComplexity);

    return complexity;
  }

  /**
   * Gets all functions with complexity exceeding a threshold.
   */
  getHighComplexityFunctions(uri: string, threshold?: number): FunctionComplexity[] {
    const config = vscode.workspace.getConfiguration('codswallop');
    const complexityThreshold = threshold ?? config.get<number>('thresholds.complexity', 20);

    const cached = this.cache.get(uri);
    if (!cached) {
      return [];
    }

    return cached.functions.filter((f) => f.complexity > complexityThreshold);
  }

  /**
   * Clears the cache for a specific document or all documents.
   */
  clearCache(uri?: string): void {
    if (uri) {
      this.cache.delete(uri);
    } else {
      this.cache.clear();
    }
  }

  dispose(): void {
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    this.cache.clear();
    this.disposables.forEach((d) => d.dispose());
  }
}

let complexityAnalyser: ComplexityAnalyser | undefined;

/**
 * Gets the singleton ComplexityAnalyser instance.
 */
export function getComplexityAnalyser(): ComplexityAnalyser {
  if (!complexityAnalyser) {
    complexityAnalyser = new ComplexityAnalyser();
  }
  return complexityAnalyser;
}
