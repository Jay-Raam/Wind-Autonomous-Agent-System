import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Cpu, Thermometer, Shield, Zap } from 'lucide-react';
import { AI_MODEL_OPTIONS, ApiError, getSettings, type SystemSettings, updateSettings } from '../utils/api';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SETTINGS: SystemSettings = {
  aiModel: 'wind-v2.5',
  temperature: 0.6,
  requireToolApproval: true,
  autonomousMode: false,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={[
        'flex h-6 w-11 items-center rounded-full p-1 transition-colors',
        checked ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-800',
      ].join(' ')}
    >
      <span
        className={[
          'h-4 w-4 rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = React.useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const loadSettings = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await getSettings();

        if (!cancelled) {
          setSettings(response);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load settings';
          setErrorMessage(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const savedSettings = await updateSettings(settings);
      setSettings(savedSettings);
      onClose();
    } catch (error) {
      const message = error instanceof ApiError || error instanceof Error ? error.message : 'Failed to save settings';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="System Configuration">
      <div className="space-y-6">
        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <Cpu size={18} className="text-neutral-400" />
              <div className="min-w-0">
                <p className="text-sm font-bold">AI Model</p>
                <p className="text-[10px] text-neutral-400">Select the brain of your agent</p>
              </div>
            </div>
            <select
              value={settings.aiModel}
              disabled={isLoading || isSaving}
              onChange={(event) => setSettings((current) => ({ ...current, aiModel: event.target.value as SystemSettings['aiModel'] }))}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium dark:border-neutral-800 dark:bg-neutral-800 sm:w-52"
            >
              {AI_MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <Thermometer size={18} className="text-neutral-400" />
              <div className="min-w-0">
                <p className="text-sm font-bold">Temperature</p>
                <p className="text-[10px] text-neutral-400">Balance creativity vs precision</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:justify-end">
              <span className="w-10 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {settings.temperature.toFixed(1)}
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.temperature}
                disabled={isLoading || isSaving}
                onChange={(event) => setSettings((current) => ({ ...current, temperature: Number(event.target.value) }))}
                className="w-full max-w-44 accent-neutral-900 dark:accent-neutral-100"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <Shield size={18} className="text-neutral-400" />
              <div className="min-w-0">
                <p className="text-sm font-bold">Tool Permissions</p>
                <p className="text-[10px] text-neutral-400">Require approval for tool use</p>
              </div>
            </div>
            <Toggle
              checked={settings.requireToolApproval}
              onChange={(checked) => setSettings((current) => ({ ...current, requireToolApproval: checked }))}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <Zap size={18} className="text-neutral-400" />
              <div className="min-w-0">
                <p className="text-sm font-bold">Autonomous Mode</p>
                <p className="text-[10px] text-neutral-400">Allow agent to self-correct</p>
              </div>
            </div>
            <Toggle
              checked={settings.autonomousMode}
              onChange={(checked) => setSettings((current) => ({ ...current, autonomousMode: checked }))}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-800 sm:flex-row sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
