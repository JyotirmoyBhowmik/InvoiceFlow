import React, { useState } from 'react';
import {
  Scale,
  Plus,
  Play,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Edit3,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { RuleDefinition } from '../types';

export const RuleBuilder: React.FC = () => {
  const { rules, setRules, fields, addLog } = useInvoiceFlowStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleDefinition | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<RuleDefinition | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const [newRule, setNewRule] = useState<Omit<RuleDefinition, 'id'>>({
    rule_code: '',
    rule_name: '',
    rule_type: 'TAX',
    priority: 10,
    stop_on_match: true,
    is_active: true,
    condition_field: 'expense_category',
    condition_op: '==',
    condition_value: 'HOTEL',
    action_field: 'tax_code',
    action_value: 'V1',
  });

  // Simulator State
  const [simPayload, setSimPayload] = useState<string>(
    JSON.stringify(
      {
        expense_category: 'HOTEL',
        total_amount: 4500.0,
        currency: 'INR',
        vendor_name: 'Taj Mahal Palace Mumbai',
        country_code: 'IND',
      },
      null,
      2
    )
  );

  const [simResult, setSimResult] = useState<{
    matched: string[];
    mutated: Record<string, any>;
    status: string;
    evaluated_at: string;
  } | null>(null);

  const handleAddRule = () => {
    if (!newRule.rule_code || !newRule.rule_name) return;
    const rule: RuleDefinition = {
      ...newRule,
      id: `rule_${Date.now()}`,
    };
    setRules([...rules, rule]);
    addLog('RULE_ENGINE', 'RULE_CREATED', 'SUCCESS', `Rule added: ${rule.rule_code}`);
    showToast(`Rule added: ${rule.rule_code}`);
    setIsAdding(false);
    setNewRule({
      rule_code: '',
      rule_name: '',
      rule_type: 'TAX',
      priority: 10,
      stop_on_match: true,
      is_active: true,
      condition_field: 'expense_category',
      condition_op: '==',
      condition_value: 'HOTEL',
      action_field: 'tax_code',
      action_value: 'V1',
    });
  };

  const handleSaveEditRule = () => {
    if (!editingRule || !editingRule.rule_code || !editingRule.rule_name) return;
    setRules(rules.map((r) => (r.id === editingRule.id ? editingRule : r)));
    addLog('RULE_ENGINE', 'RULE_UPDATED', 'SUCCESS', `Rule updated: ${editingRule.rule_code}`);
    showToast(`Rule updated: ${editingRule.rule_code}`);
    setEditingRule(null);
  };

  const handleDeleteRuleConfirm = () => {
    if (!ruleToDelete) return;
    setRules(rules.filter((x) => x.id !== ruleToDelete.id));
    addLog('RULE_ENGINE', 'RULE_DELETED', 'WARNING', `Rule deleted: ${ruleToDelete.rule_code}`);
    showToast(`Rule deleted: ${ruleToDelete.rule_code}`);
    setRuleToDelete(null);
  };

  const handleRunSimulation = () => {
    try {
      const parsed = JSON.parse(simPayload);
      const matched: string[] = [];
      const mutated: Record<string, any> = {};

      const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

      for (const r of sortedRules) {
        if (!r.is_active) continue;

        const val = parsed[r.condition_field];
        let isMatch = false;

        if (r.condition_op === '==') isMatch = String(val) === String(r.condition_value);
        else if (r.condition_op === '!=') isMatch = String(val) !== String(r.condition_value);
        else if (r.condition_op === '>') isMatch = Number(val) > Number(r.condition_value);
        else if (r.condition_op === '<') isMatch = Number(val) < Number(r.condition_value);
        else if (r.condition_op === 'contains') isMatch = String(val).toLowerCase().includes(String(r.condition_value).toLowerCase());

        if (isMatch) {
          matched.push(r.rule_code);
          mutated[r.action_field] = r.action_value;
          if (r.stop_on_match) break;
        }
      }

      setSimResult({
        matched,
        mutated,
        status: matched.length > 0 ? 'MATCHED' : 'NO_RULE_MATCHED',
        evaluated_at: new Date().toLocaleTimeString(),
      });

      addLog(
        'RULE_ENGINE',
        'SIMULATION_RUN',
        'SUCCESS',
        `Simulated rule evaluation: ${matched.length} rules matched`,
        12,
        undefined,
        undefined,
        undefined,
        parsed,
        mutated
      );
      showToast(`Simulation complete: ${matched.length} rule(s) matched`);
    } catch (e: any) {
      showToast('Invalid JSON input payload: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            Declarative Rule Builder &amp; Dry-Run Simulator
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Zero hardcoded logic. Define tax slabs, category defaulting, GL account resolution, and cost-center splits visually with full edit &amp; delete capabilities.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Business Rule</span>
        </button>
      </div>

      {/* Add Rule Modal */}
      {isAdding && (
        <div className="p-4 rounded-lg bg-neutral-900 border border-blue-500/40 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Define Safe Declarative Rule
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-neutral-400 block mb-1">Rule Code *</label>
              <input
                type="text"
                placeholder="R_HOTEL_TAX_V1"
                value={newRule.rule_code}
                onChange={(e) => setNewRule({ ...newRule, rule_code: e.target.value.toUpperCase() })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-neutral-400 block mb-1">Rule Name / Description *</label>
              <input
                type="text"
                placeholder="Default Hotel Folio Tax Code to V1"
                value={newRule.rule_name}
                onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              />
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Rule Type</label>
              <select
                value={newRule.rule_type}
                onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value as any })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
              >
                <option value="TAX">TAX</option>
                <option value="CATEGORY">CATEGORY</option>
                <option value="DEFAULTING">DEFAULTING</option>
                <option value="ROUTING">ROUTING</option>
                <option value="SPLIT">SPLIT</option>
              </select>
            </div>

            {/* Condition Section */}
            <div className="md:col-span-4 p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2">
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">IF Condition:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-neutral-500 block mb-1">Target Field</label>
                  <select
                    value={newRule.condition_field}
                    onChange={(e) => setNewRule({ ...newRule, condition_field: e.target.value })}
                    className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 font-mono"
                  >
                    {fields.map((f) => (
                      <option key={f.field_key} value={f.field_key}>
                        {f.display_label} ({f.field_key})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-neutral-500 block mb-1">Operator</label>
                  <select
                    value={newRule.condition_op}
                    onChange={(e) => setNewRule({ ...newRule, condition_op: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 font-mono"
                  >
                    <option value="==">Equals (==)</option>
                    <option value="!=">Not Equals (!=)</option>
                    <option value=">">Greater Than (&gt;)</option>
                    <option value="<">Less Than (&lt;)</option>
                    <option value="contains">Contains</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-500 block mb-1">Value Match</label>
                  <input
                    type="text"
                    value={newRule.condition_value}
                    onChange={(e) => setNewRule({ ...newRule, condition_value: e.target.value })}
                    className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200"
                    placeholder="HOTEL"
                  />
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="md:col-span-4 p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">THEN Action (Mutation):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-500 block mb-1">Mutate Target Field</label>
                  <select
                    value={newRule.action_field}
                    onChange={(e) => setNewRule({ ...newRule, action_field: e.target.value })}
                    className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 font-mono"
                  >
                    {fields.map((f) => (
                      <option key={f.field_key} value={f.field_key}>
                        {f.display_label} ({f.field_key})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-neutral-500 block mb-1">Assign Value</label>
                  <input
                    type="text"
                    value={newRule.action_value}
                    onChange={(e) => setNewRule({ ...newRule, action_value: e.target.value })}
                    className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200"
                    placeholder="V1"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Priority (1-100)</label>
              <input
                type="number"
                value={newRule.priority}
                onChange={(e) => setNewRule({ ...newRule, priority: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-neutral-300">
                <input
                  type="checkbox"
                  checked={newRule.stop_on_match}
                  onChange={(e) => setNewRule({ ...newRule, stop_on_match: e.target.checked })}
                  className="rounded bg-neutral-950 border-neutral-700"
                />
                Stop on Match
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRule}
              disabled={!newRule.rule_code || !newRule.rule_name}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded transition-colors"
            >
              Save Rule
            </button>
          </div>
        </div>
      )}

      {/* Rules Table with Edit & Delete */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        {rules.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            <Scale className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <div className="font-semibold text-neutral-300">No Declarative Rules Configured</div>
            <p className="mt-1 text-neutral-500">
              Create rules to automatically map tax rates, determine expense GL accounts, or enforce approval routes.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
            >
              + Add First Rule
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Rule Code &amp; Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Condition (IF)</th>
                <th className="py-2.5 px-3">Action (THEN)</th>
                <th className="py-2.5 px-3 text-center">Stop on Match</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-800/30">
                  <td className="py-2 px-3 font-mono text-neutral-400">{r.priority}</td>
                  <td className="py-2 px-3">
                    <div className="font-mono font-medium text-white">{r.rule_code}</div>
                    <div className="text-[11px] text-neutral-400">{r.rule_name}</div>
                  </td>
                  <td className="py-2 px-3 font-mono text-neutral-400">{r.rule_type}</td>
                  <td className="py-2 px-3 font-mono text-blue-400">
                    {r.condition_field} {r.condition_op} "{r.condition_value}"
                  </td>
                  <td className="py-2 px-3 font-mono text-emerald-400">
                    {r.action_field} = "{r.action_value}"
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-neutral-400">
                    {r.stop_on_match ? 'YES' : 'NO'}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingRule({ ...r })}
                        className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded transition-colors"
                        title="Edit Business Rule"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRuleToDelete(r)}
                        className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                        title="Delete Business Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* EDIT RULE MODAL */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Edit Business Rule: {editingRule.rule_code}
              </h3>
              <button onClick={() => setEditingRule(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Rule Code *</label>
                <input
                  type="text"
                  value={editingRule.rule_code}
                  onChange={(e) => setEditingRule({ ...editingRule, rule_code: e.target.value.toUpperCase() })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Rule Type</label>
                <select
                  value={editingRule.rule_type}
                  onChange={(e) => setEditingRule({ ...editingRule, rule_type: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                >
                  <option value="TAX">TAX</option>
                  <option value="CATEGORY">CATEGORY</option>
                  <option value="DEFAULTING">DEFAULTING</option>
                  <option value="ROUTING">ROUTING</option>
                  <option value="SPLIT">SPLIT</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-neutral-400 block mb-1">Rule Name / Description *</label>
                <input
                  type="text"
                  value={editingRule.rule_name}
                  onChange={(e) => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">IF Condition Field</label>
                <select
                  value={editingRule.condition_field}
                  onChange={(e) => setEditingRule({ ...editingRule, condition_field: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                >
                  {fields.map((f) => (
                    <option key={f.field_key} value={f.field_key}>
                      {f.display_label} ({f.field_key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Operator</label>
                <select
                  value={editingRule.condition_op}
                  onChange={(e) => setEditingRule({ ...editingRule, condition_op: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                >
                  <option value="==">== (Equals)</option>
                  <option value="!=">!= (Not Equals)</option>
                  <option value=">">&gt; (Greater)</option>
                  <option value="<">&lt; (Less)</option>
                  <option value="contains">contains</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">IF Value Match</label>
                <input
                  type="text"
                  value={editingRule.condition_value}
                  onChange={(e) => setEditingRule({ ...editingRule, condition_value: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">THEN Target Field</label>
                <select
                  value={editingRule.action_field}
                  onChange={(e) => setEditingRule({ ...editingRule, action_field: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                >
                  {fields.map((f) => (
                    <option key={f.field_key} value={f.field_key}>
                      {f.display_label} ({f.field_key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">THEN Assign Value</label>
                <input
                  type="text"
                  value={editingRule.action_value}
                  onChange={(e) => setEditingRule({ ...editingRule, action_value: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Priority</label>
                <input
                  type="number"
                  value={editingRule.priority}
                  onChange={(e) => setEditingRule({ ...editingRule, priority: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>

              <div className="flex items-center pt-4">
                <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingRule.stop_on_match}
                    onChange={(e) => setEditingRule({ ...editingRule, stop_on_match: e.target.checked })}
                    className="rounded bg-neutral-950 border-neutral-700"
                  />
                  <span>Stop evaluation on match</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditRule}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RULE DELETE CONFIRMATION */}
      {ruleToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-700/60 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete Rule</h3>
            </div>
            <p className="text-xs text-neutral-300">
              Are you sure you want to delete rule <strong className="text-white">{ruleToDelete.rule_code}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setRuleToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRuleConfirm}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Dry-Run Simulator Section */}
      <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Rule Execution Sandbox &amp; Dry-Run Simulator</h2>
          </div>
          <button
            onClick={handleRunSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Execute Dry-Run</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">Test Invoice Payload (JSON)</label>
            <textarea
              rows={8}
              value={simPayload}
              onChange={(e) => setSimPayload(e.target.value)}
              className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded font-mono text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400 font-medium">Evaluation Results &amp; Mutations</label>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded font-mono text-xs min-h-[160px] overflow-y-auto">
              {simResult ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 pb-1 border-b border-neutral-800">
                    <span className="text-emerald-400 font-semibold">{simResult.status}</span>
                    <span>Evaluated at {simResult.evaluated_at}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Matched Rules:</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {simResult.matched.length > 0 ? (
                        simResult.matched.map((m) => (
                          <span key={m} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[11px]">
                            {m}
                          </span>
                        ))
                      ) : (
                        <span className="text-neutral-600">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Mutated Output Fields:</span>
                    <pre className="text-emerald-400 text-[11px] mt-0.5">
                      {JSON.stringify(simResult.mutated, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-neutral-600 py-10 text-center">
                  Click "Execute Dry-Run" to simulate the rule engine against the test payload.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
