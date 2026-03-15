export type ToolName = 'WebSearchTool' | 'CalculatorTool' | 'DocumentReaderTool';

export interface ToolExecutionInput {
  taskId: string;
  toolName: ToolName;
  query: string;
}
