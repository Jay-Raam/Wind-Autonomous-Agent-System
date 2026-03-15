import { ToolRepository } from '../repositories/tool.repository.js';
import type { ToolExecutionInput } from '../types/tool.types.js';
import { AppError } from '../utils/errors.js';
import vm from 'node:vm';

export class ToolService {
  constructor(private readonly toolRepository = new ToolRepository()) {}

  async execute(input: ToolExecutionInput): Promise<string> {
    switch (input.toolName) {
      case 'CalculatorTool':
        return this.executeCalculator(input.query);
      case 'WebSearchTool':
        return this.executeWebSearch(input.query);
      case 'DocumentReaderTool':
        return this.executeDocumentReader(input.query);
      default:
        throw new AppError('Unsupported tool', 400, 'UNSUPPORTED_TOOL');
    }
  }

  private executeCalculator(expression: string): string {
    const sanitized = expression.replace(/\s/g, '');

    if (!/^[0-9+\-*/().]+$/.test(sanitized)) {
      throw new AppError('Invalid calculator expression', 400, 'INVALID_EXPRESSION');
    }

    const script = new vm.Script(sanitized);
    const result = script.runInNewContext(Object.create(null), { timeout: 100 });

    if (typeof result !== 'number') {
      throw new AppError('Calculator returned non-numeric output', 400, 'INVALID_EXPRESSION');
    }

    return `Calculator result: ${result}`;
  }

  private executeWebSearch(query: string): string {
    return `WebSearchTool sandbox result for query: ${query}`;
  }

  private executeDocumentReader(query: string): string {
    return `DocumentReaderTool sandbox parsed content for: ${query}`;
  }
}
