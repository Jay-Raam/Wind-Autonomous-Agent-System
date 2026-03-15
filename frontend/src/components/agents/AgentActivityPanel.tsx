import React from 'react';
import { useAgentStore } from '../../store/agentStore';
import { AgentStepCard } from './AgentStepCard';
import { Activity, ListChecks, Wrench, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToolExecutionCard } from '../tools/ToolExecutionCard';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/Button';

export const AgentActivityPanel: React.FC = () => {
  const { steps, toolExecutions, plan, goal } = useAgentStore();
  const { setRightPanel } = useUIStore();

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-neutral-500" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
            Agent Activity
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden"
          onClick={() => setRightPanel(false)}
        >
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {goal && (
          <div className="border-b border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
            <span className="text-[10px] font-bold uppercase text-neutral-400">Current Goal</span>
            <p className="mt-1 wrap-break-word text-xs font-medium text-neutral-700 dark:text-neutral-300">{goal}</p>
          </div>
        )}

        {plan.length > 0 && (
          <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks size={14} className="text-neutral-400" />
              <span className="text-[10px] font-bold uppercase text-neutral-400">Task Plan</span>
            </div>
            <div className="space-y-2">
              {plan.map((step) => (
                <div key={step.id} className="flex items-start gap-2">
                  <div className={`mt-1 h-2 w-2 rounded-full ${step.status === 'done' ? 'bg-emerald-500' :
                      step.status === 'in-progress' ? 'bg-blue-500 animate-pulse' : 'bg-neutral-200 dark:bg-neutral-800'
                    }`} />
                  <span className={`text-[11px] ${step.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-700 dark:text-neutral-300'}`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-0">
          <AnimatePresence initial={false}>
            {steps.map((step, i) => (
              <AgentStepCard key={step.id} step={step} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {toolExecutions.length > 0 && (
          <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-3">
              <Wrench size={14} className="text-neutral-400" />
              <span className="text-[10px] font-bold uppercase text-neutral-400">Tool Executions</span>
            </div>
            <div className="space-y-3">
              {toolExecutions.map((tool) => (
                <ToolExecutionCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
