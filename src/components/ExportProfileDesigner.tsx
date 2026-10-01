import React, { useState } from 'react';
import { Layers, Plus, Trash2, Check, RefreshCw, FileText, Download } from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { ExportColumnDef } from '../types';

export const ExportProfileDesigner: React.FC = () => {
  const { exportProfile, setExportProfile, fields, addLog } = useInvoiceFlowStore();

  const [columns, setColumns] = useState<ExportColumnDef[]>([...exportProfile.columns]);
  const [newCol, setNewCol] = useState<Partial<ExportColumnDef>>({
    header_text: '',
    record_type: 'ITEM',
    source_field_key: 'vendor_code',
    constant_value: '',
    transformation_rule: 'PAD_ZERO',
    field_length: 10,
    alignment: 'RIGHT',
    pad_char: '0',
    is_mandatory: false,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const handleSaveColumns = () => {
    const updated = { ...exportProfile, columns };
    setExportProfile(updated);
    addLog('EXPORT_ENGINE', 'PROFILE_COLUMNS_SAVED', 'SUCCESS', `Export profile layout columns updated (${columns.length} columns)`);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleAddColumn = () => {
    if (!newCol.header_text) return;
    const col: ExportColumnDef = {
      id: `col_${Date.now()}`,
      column_order: columns.length + 1,
      header_text: newCol.header_text.toUpperCase(),
      record_type: newCol.record_type || 'ITEM',
      source_field_key: newCol.source_field_key || '',
      constant_value: newCol.constant_value,
      transformation_rule: newCol.transformation_rule,
      field_length: newCol.field_length || 10,
      alignment: newCol.alignment || 'LEFT',
      pad_char: newCol.pad_char || ' ',
      is_mandatory: newCol.is_mandatory || false,
    };
    setColumns([...columns, col]);
    setIsAdding(false);
    setNewCol({
      header_text: '',
      record_type: 'ITEM',
      source_field_key: 'vendor_code',
      transformation_rule: 'PAD_ZERO',
      field_length: 10,
      alignment: 'RIGHT',
      pad_char: '0',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            SAP ECC Export Profile Designer
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Build CSV and fixed-width TXT file layouts column-by-column. Header &amp; item records, posting keys, zero padding, and SAP dates are all metadata-mapped.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccessMsg && (
            <span className="text-xs text-emerald-400 font-medium px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center gap-1.5">
              Layout configuration saved!
            </span>
          )}
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Column</span>
          </button>

          <button
            onClick={handleSaveColumns}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {/* Add Column Modal */}
      {isAdding && (
        <div className="p-4 rounded-lg bg-neutral-900 border border-blue-500/40 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Define SAP Export Column
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-neutral-400 block mb-1">Header Text (SAP Technical Name) *</label>
              <input
                type="text"
                placeholder="e.g. LIFNR"
                value={newCol.header_text}
                onChange={(e) => setNewCol({ ...newCol, header_text: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Record Type</label>
              <select
                value={newCol.record_type}
                onChange={(e) => setNewCol({ ...newCol, record_type: e.target.value as any })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              >
                <option value="HEADER">HEADER</option>
                <option value="ITEM">ITEM</option>
                <option value="CONTROL">CONTROL</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Source Field Mapping</label>
              <select
                value={newCol.source_field_key}
                onChange={(e) => setNewCol({ ...newCol, source_field_key: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              >
                <option value="">-- Constant Value --</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.field_key}>
                    {f.display_label} ({f.field_key})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Constant Value (if static)</label>
              <input
                type="text"
                placeholder="e.g. H or KR"
                value={newCol.constant_value || ''}
                onChange={(e) => setNewCol({ ...newCol, constant_value: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Transformation Rule</label>
              <select
                value={newCol.transformation_rule || ''}
                onChange={(e) => setNewCol({ ...newCol, transformation_rule: e.target.value as any })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              >
                <option value="">None</option>
                <option value="PAD_ZERO">PAD_ZERO (Leading Zeros)</option>
                <option value="UPPERCASE">UPPERCASE</option>
                <option value="DATE_SAP">DATE_SAP (DD.MM.YYYY)</option>
                <option value="TRIM">TRIM</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Field Length (Fixed-Width TXT)</label>
              <input
                type="number"
                value={newCol.field_length || 10}
                onChange={(e) => setNewCol({ ...newCol, field_length: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Alignment</label>
              <select
                value={newCol.alignment}
                onChange={(e) => setNewCol({ ...newCol, alignment: e.target.value as any })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              >
                <option value="LEFT">LEFT</option>
                <option value="RIGHT">RIGHT</option>
              </select>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Pad Char</label>
              <input
                type="text"
                maxLength={1}
                value={newCol.pad_char || ' '}
                onChange={(e) => setNewCol({ ...newCol, pad_char: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white">
              Cancel
            </button>
            <button
              onClick={handleAddColumn}
              disabled={!newCol.header_text}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded transition-colors"
            >
              Add Column
            </button>
          </div>
        </div>
      )}

      {/* Columns Designer Table */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
              <th className="py-2.5 px-3">Order</th>
              <th className="py-2.5 px-3">SAP Column Name</th>
              <th className="py-2.5 px-3">Record Type</th>
              <th className="py-2.5 px-3">Source Field Mapping</th>
              <th className="py-2.5 px-3">Transform</th>
              <th className="py-2.5 px-3 text-center">Length</th>
              <th className="py-2.5 px-3 text-center">Align</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 text-neutral-300">
            {columns.map((col, idx) => (
              <tr key={col.id} className="hover:bg-neutral-800/30">
                <td className="py-2 px-3 font-mono text-neutral-500">#{idx + 1}</td>
                <td className="py-2 px-3 font-mono font-bold text-white">{col.header_text}</td>
                <td className="py-2 px-3 font-mono text-neutral-400">{col.record_type}</td>
                <td className="py-2 px-3 font-mono text-blue-400">
                  {col.source_field_key || (
                    <span className="text-amber-400">CONST: "{col.constant_value}"</span>
                  )}
                </td>
                <td className="py-2 px-3 font-mono text-neutral-400">{col.transformation_rule || '-'}</td>
                <td className="py-2 px-3 font-mono text-center text-neutral-400">{col.field_length}</td>
                <td className="py-2 px-3 font-mono text-center text-neutral-400">{col.alignment}</td>
                <td className="py-2 px-3 text-right">
                  <button
                    onClick={() => setColumns(columns.filter((c) => c.id !== col.id))}
                    className="p-1 text-neutral-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
