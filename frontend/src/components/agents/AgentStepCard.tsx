import React from 'react';
import { motion } from 'motion/react';
import { AgentStep } from '../../types';
import { cn } from '../../utils/helpers';
import { 
  CircleDashed, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Layout, 
  BarChart3, 
  PenTool,
  Terminal
} from 'lucide-react';

interface AgentStepCardProps {
  step: AgentStep;
  index: number;
}

export const AgentStepCard: React.FC<AgentStepCardProps> = ({ step, index }) => {
  const getIcon = () => {
    switch (step.role) {
      case 'planner': return <Layout size={14} />;
      case 'researcher': return <Search size={14} />;
      case 'analyzer': return <BarChart3 size={14} />;
      case 'writer': return <PenTool size={14} />;
      case 'executor': return <Terminal size={14} />;
      default: return <CircleDashed size={14} />;
    }
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case 'running': return <CircleDashed size={14} className="animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'failed': return <XCircle size={14} className="text-rose-500" />;
      default: return <CircleDashed size={14} className="text-neutral-300" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "group relative flex gap-3 border-l-2 py-4 pl-6 transition-all",
        step.status === 'running' ? "border-blue-500 bg-blue-50/30 dark:bg-blue-900/10" : "border-neutral-200 dark:border-neutral-800"
      )}
    >
      <div className={cn(
        "absolute -left-[9px] top-5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-4 ring-white dark:bg-neutral-900 dark:ring-neutral-950",
        step.status === 'running' ? "text-blue-500" : "text-neutral-400"
      )}>
        {getStatusIcon()}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              {getIcon()}
            </span>
            <span className="text-xs font-bold uppercase tracking-tight text-neutral-900 dark:text-neutral-100">
              {step.agentName}
            </span>
          </div>
          <span className="text-[10px] font-medium text-neutral-400">
            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          {step.message}
        </p>
      </div>
    </motion.div>
  );
};
