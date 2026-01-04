'use client';

import { useState, useEffect } from 'react';
import { pipelinesAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface PipelineEditorProps {
  pipeline: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PipelineEditor({ pipeline, onClose, onSuccess }: PipelineEditorProps) {
  const [formData, setFormData] = useState({
    name: pipeline?.name || '',
    description: pipeline?.description || '',
    is_default: pipeline?.is_default || false,
  });
  const [stages, setStages] = useState<any[]>(pipeline?.stages || []);
  const [saving, setSaving] = useState(false);

  const addStage = () => {
    setStages([
      ...stages,
      {
        id: `temp-${Date.now()}`,
        name: '',
        description: '',
        position: stages.length,
        probability: 0,
        automation_rules: {},
      },
    ]);
  };

  const updateStage = (index: number, field: string, value: any) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        ...formData,
        stages: stages.map((stage, index) => ({
          ...stage,
          position: index,
        })),
      };

      if (pipeline) {
        await pipelinesAPI.update(pipeline.id, data);
      } else {
        await pipelinesAPI.create(data);
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save pipeline:', error);
      alert('Failed to save pipeline');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full my-8">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {pipeline ? 'Edit Pipeline' : 'New Pipeline'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Pipeline Info */}
          <div className="space-y-4">
            <Input
              label="Pipeline Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Sales Pipeline"
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Describe this pipeline..."
            />

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium">Set as default pipeline</span>
            </label>
          </div>

          {/* Stages */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Stages</h3>
              <Button type="button" variant="secondary" onClick={addStage}>
                ➕ Add Stage
              </Button>
            </div>

            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm text-gray-600">Stage {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeStage(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Stage Name"
                      value={stage.name}
                      onChange={(e) => updateStage(index, 'name', e.target.value)}
                      required
                      placeholder="New Lead"
                    />

                    <Input
                      label="Probability %"
                      type="number"
                      min="0"
                      max="100"
                      value={stage.probability}
                      onChange={(e) => updateStage(index, 'probability', parseInt(e.target.value))}
                      placeholder="0-100"
                    />
                  </div>

                  <Textarea
                    label="Description"
                    value={stage.description}
                    onChange={(e) => updateStage(index, 'description', e.target.value)}
                    rows={2}
                    placeholder="Stage description..."
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Pipeline'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
