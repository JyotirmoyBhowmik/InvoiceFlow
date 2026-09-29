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
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { RuleDefinition } from '../types';

export const RuleBuilder: React.FC = () => {
  const { rules, setRules, fields, addLog } = useInvoiceFlowStore();

  const [isAdding, setIsAdding] = useState(false);
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
        total_amount: 450.0,
        currency: 'USD',
        vendor_name: 'Marriott Downtown',
        country_code: 'USA',
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
    } catch (e: any) {
      alert('Invalid JSON input payload: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            Declarative Rule Builder &amp; Dry-Run Simulator
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Zero hardcoded logic. Define tax slabs, category defaulting, GL account resolution, and cost-center splits visually.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-sm"
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
                <select
                  value={newRule.condition_field}
                  onChange={(e) => setNewRule({ ...newRule, condition_field: e.target.value })}
                  className="px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-200 font-mono"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.field_key}>
                      {f.display_label} ({f.field_key})
                    </option>
                  ))}
                </select>

                <select
                  value={newRule.condition_op}
                  onChange={(e) => setNewRule({ ...newRule, condition_op: e.target.value as any })}
                  className="px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-200 font-mono"
                >
                  <option value="==">EQUALS (==)</option>
                  <option value="!=">NOT EQUALS (!=)</option>
                  <option value=">">GREATER THAN (&gt;)</option>
                  <option value="<">LESS THAN (&lt;)</option>
                  <option value="contains">CONTAINS</option>
                </select>

                <input
                  type="text"
                  placeholder="Expected value (e.g. HOTEL)"
                  value={newRule.condition_value}
                  onChange={(e) => setNewRule({ ...newRule, condition_value: e.target.value })}
                  className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs font-mono"
                />
              </div>
            </div>

            {/* Action Section */}
            <div className="md:col-span-4 p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">THEN Action (Mutate Field):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={newRule.action_field}
                  onChange={(e) => setNewRule({ ...newRule, action_field: e.target.value })}
                  className="px-2 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-200 font-mono"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.field_key}>
                      Set: {f.display_label} ({f.field_key})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Target assigned value (e.g. V1 or 600200)"
                  value={newRule.action_value}
                  onChange={(e) => setNewRule({ ...newRule, action_value: e.target.value })}
                  className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-neutral-200 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-neutral-400 block mb-1">Priority (Low = First)</label>
              <input
                type="number"
                value={newRule.priority}
                onChange={(e) => setNewRule({ ...newRule, priority: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="stop_on_match"
                checked={newRule.stop_on_match}
                onChange={(e) => setNewRule({ ...newRule, stop_on_match: e.target.checked })}
                className="rounded border-neutral-700 bg-neutral-950"
              />
              <label htmlFor="stop_on_match" className="text-neutral-300 font-medium">
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

      {/* Rules Table */}
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
                <th className="py-2.5 px-3">Rule Code</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Condition (IF)</th>
                <th className="py-2.5 px-3">Action (THEN)</th>
                <th className="py-2.5 px-3 text-center">Stop on Match</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-800/30">
                  <td className="py-2 px-3 font-mono text-neutral-400">{r.priority}</td>
                  <td className="py-2 px-3 font-mono font-medium text-white">{r.rule_code}</td>
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
                    <button
                      onClick={() => setRules(rules.filter((x) => x.id !== r.id))}
                      className="p-1 text-neutral-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Real-Time Dry-Run Simulator Section */}
      <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Rule Execution Sandbox &amp; Dry-Run Simulator</h2>
          </div>
          <button
            onClick={handleRunSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors shadow-sm"
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
            <label className="text-xs text-neutral-400 font-medium">Evaluation Output</label>
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded font-mono text-xs text-neutral-300 min-h-[160px] overflow-y-auto">
              {simResult ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] pb-1 border-b border-neutral-800">
                    <span className="text-emerald-400 font-bold">{simResult.status}</span>
                    <span className="text-neutral-500">{simResult.evaluated_at}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[11px] block">Matched Rules:</span>
                    <div className="text-blue-400">
                      {simResult.matched.length > 0 ? simResult.matched.join(' → ') : 'None'}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[11px] block">Field Mutations:</span>
                    <pre className="text-emerald-400 mt-1">{JSON.stringify(simResult.mutated, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <div className="text-neutral-600 py-10 text-center">
                  Click "Execute Dry-Run" to test current rules against the invoice payload.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
