"""
Safe Declarative Rule Engine.
Evaluates nested JSONB condition trees against extracted documents without eval().
Supports priority sorting, stop-on-match, and simulation / what-if testing.
"""

from typing import Dict, Any, List, Optional
import operator


class SafeRuleEvaluator:
    OPERATORS = {
        "==": operator.eq,
        "!=": operator.ne,
        ">": operator.gt,
        ">=": operator.ge,
        "<": operator.lt,
        "<=": operator.le,
        "contains": lambda a, b: b in a if a is not None else False,
        "not_contains": lambda a, b: b not in a if a is not None else True,
        "in": lambda a, b: a in b if b is not None else False,
        "not_in": lambda a, b: a not in b if b is not None else True,
        "is_empty": lambda a, _: not bool(a),
        "is_not_empty": lambda a, _: bool(a),
    }

    @classmethod
    def evaluate_condition_tree(cls, tree: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """
        Recursively evaluate declarative condition tree.
        Tree format example:
        {
           "and": [
               {"field": "expense_category", "op": "==", "value": "HOTEL"},
               {"or": [
                   {"field": "total_amount", "op": ">", "value": 500},
                   {"field": "country_code", "op": "==", "value": "USA"}
               ]}
           ]
        }
        """
        if not tree:
            return True

        if "and" in tree:
            return all(cls.evaluate_condition_tree(sub, context) for sub in tree["and"])

        if "or" in tree:
            return any(cls.evaluate_condition_tree(sub, context) for sub in tree["or"])

        if "not" in tree:
            return not cls.evaluate_condition_tree(tree["not"], context)

        # Single leaf condition
        field = tree.get("field")
        op_str = tree.get("op", "==")
        expected_val = tree.get("value")

        actual_val = context.get(field)
        op_func = cls.OPERATORS.get(op_str)

        if not op_func:
            return False

        try:
            # Handle numeric conversions if needed
            if isinstance(expected_val, (int, float)) and actual_val is not None:
                actual_val = float(actual_val)
            return op_func(actual_val, expected_val)
        except Exception:
            return False

    @classmethod
    def apply_rules(
        cls, rules: List[Dict[str, Any]], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes a priority-ordered list of rules against the context.
        Returns accumulated field mutations and audit trace.
        """
        sorted_rules = sorted(rules, key=lambda r: r.get("priority", 10))
        applied_actions: Dict[str, Any] = {}
        matched_rule_codes: List[str] = []

        working_context = dict(context)

        for r in sorted_rules:
            if not r.get("is_active", True):
                continue

            cond = r.get("condition_tree", {})
            if cls.evaluate_condition_tree(cond, working_context):
                matched_rule_codes.append(r.get("rule_code", "UNKNOWN"))
                actions = r.get("action_set", {})
                
                # Apply mutations
                set_fields = actions.get("set_fields", {})
                for k, v in set_fields.items():
                    applied_actions[k] = v
                    working_context[k] = v

                if r.get("stop_on_match", True):
                    break

        return {
            "mutated_fields": applied_actions,
            "matched_rules": matched_rule_codes,
            "final_context": working_context,
        }
