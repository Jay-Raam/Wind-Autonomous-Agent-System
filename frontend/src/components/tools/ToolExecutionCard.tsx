import React from 'react';
import { ToolExecution } from '../../types';
import { Card } from '../ui/Card';
import { Wrench, CheckCircle2, CircleDashed, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToolExecutionCardProps {
  tool: ToolExecution;
}

export const ToolExecutionCard: React.FC<ToolExecutionCardProps> = ({ tool }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <Card className="p-3 overflow-hidden border-neutral-100 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <Wrench size={12} />
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-neutral-900 dark:text-neutral-100">{tool.toolName}</h4>
            <p className="text-[10px] text-neutral-400 truncate max-w-[150px]">{tool.query}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {tool.status === 'running' && <CircleDashed size={12} className="animate-spin text-blue-500" />}
          {tool.status === 'completed' && <CheckCircle2 size={12} className="text-emerald-500" />}
          {tool.status === 'failed' && <XCircle size={12} className="text-rose-500" />}
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && tool.result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="rounded-lg bg-neutral-50 p-2 dark:bg-neutral-900">
              <pre className="text-[10px] leading-relaxed text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                {tool.result}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
