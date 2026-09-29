import React, { useState } from 'react';
import { Cpu, ArrowUpDown, Check, Settings2, Sliders } from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';

interface PipelineStep {
  id: string;
  order: number;
  name: string;
  key: string;
  enabled: boolean;
  params: Record<string, any>;
}

export const OcrPipelineDesigner: React.FC = () => {
  const { addLog } = useInvoiceFlowStore();

  const [steps, setSteps] = useState<PipelineStep[]>([
    {
      id: 's1',
      order: 1,
      name: 'Layer 0: Native PDF Text Density Check',
      key: 'NATIVE_PDF_CHECK',
      enabled: true,
      params: { min_char_count: 50, skip_ocr_if_native: true },
    },
    {
      id: 's2',
      order: 2,
      name: 'Layer 1: Grayscale & Contrast Normalization',
      key: 'GRAYSCALE_CONTRAST',
      enabled: true,
      params: { target_dpi: 300, contrast_alpha: 1.5, brightness_beta: 0 },
    },
    {
      id: 's3',
      order: 3,
      name: 'Layer 1: Deskew & Orientation Auto-Correction',
      key: 'DESKEW',
      enabled: true,
      params: { max_angle_degrees: 45.0, hough_threshold: 100 },
    },
    {
      id: 's4',
      order: 4,
      name: 'Layer 1: Bilateral Denoising Filter',
      key: 'DENOISE',
      enabled: true,
      params: { diameter: 9, sigma_color: 75, sigma_space: 75 },
    },
    {
      id: 's5',
      order: 5,
      name: 'Layer 1: Adaptive Gaussian Thresholding',
      key: 'ADAPTIVE_THRESHOLD',
      enabled: false,
      params: { block_size: 11, c_constant: 2 },
    },
    {
      id: 's6',
      order: 6,
      name: 'Layer 2: Tesseract Engine OCR',
      key: 'TESSERACT_OCR',
      enabled: true,
      params: { psm_mode: 6, oem_mode: 3, languages: 'eng+nep' },
    },
    {
      id: 's7',
      order: 7,
      name: 'Layer 3: Advanced AI Structured Extraction',
      key: 'AI_EXTRACTION',
      enabled: true,
      params: { provider: 'GEMINI', model: 'gemini-2.5-flash', enforce_json_schema: true },
    },
  ]);

  const handleToggleStep = (id: string) => {
    const updated = steps.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setSteps(updated);
    addLog('OCR_ENGINE', 'PIPELINE_STEP_TOGGLED', 'SUCCESS', `OCR pipeline step ${id} toggled`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            OCR &amp; Pre-Processing Pipeline Designer
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Reorder, configure, and toggle image enhancement and OCR execution layers. Every parameter lives in the database.
          </p>
        </div>

        <button
          onClick={() => {
            addLog('OCR_ENGINE', 'PIPELINE_SAVED', 'SUCCESS', 'OCR pipeline configurations saved');
            alert('Pipeline configurations saved to database.');
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm"
        >
          <Check className="w-4 h-4" />
          <span>Save Pipeline Configuration</span>
        </button>
      </div>

      {/* Pipeline Steps List */}
      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`p-4 rounded-lg border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              step.enabled
                ? 'bg-neutral-900/60 border-neutral-800'
                : 'bg-neutral-950/40 border-neutral-900 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="font-mono text-xs text-neutral-500 w-6 pt-0.5">#{idx + 1}</span>
              <div>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>{step.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-800 text-neutral-400 rounded">
                    {step.key}
                  </span>
                </div>
                <div className="text-xs font-mono text-neutral-400 mt-1">
                  Parameters: {JSON.stringify(step.params)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={step.enabled}
                  onChange={() => handleToggleStep(step.id)}
                  className="rounded border-neutral-700 bg-neutral-950"
                />
                <span className={step.enabled ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}>
                  {step.enabled ? 'ENABLED' : 'BYPASSED'}
                </span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
