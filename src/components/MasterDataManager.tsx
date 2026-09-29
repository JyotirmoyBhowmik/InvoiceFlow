import React, { useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Search,
  Upload,
  Download,
  CheckCircle2,
  Building,
  UserCheck,
  Tag,
  CreditCard,
  Percent,
  Calendar,
  Layers,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';

export const MasterDataManager: React.FC = () => {
  const store = useInvoiceFlowStore();

  const [activeTab, setActiveTab] = useState<
    | 'vendors'
    | 'employees'
    | 'cost_centers'
    | 'gl_accounts'
    | 'company_codes'
    | 'categories'
    | 'tax_codes'
    | 'currencies'
    | 'fiscal_periods'
  >('vendors');

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [vendorForm, setVendorForm] = useState({
    vendor_code: '',
    vendor_name: '',
    tax_identifier: '',
    country_code: 'USA',
    recon_account_gl: '211000',
    payment_terms: 'NT30',
  });

  const [employeeForm, setEmployeeForm] = useState({
    employee_code: '',
    full_name: '',
    official_email: '',
    department_code: 'FIN',
    cost_center_code: 'CC100',
    grade_level: 'M2',
    approval_level: 1,
  });

  const [costCenterForm, setCostCenterForm] = useState({
    code: '',
    name: '',
    company_code: '1000',
    department: 'OPERATIONS',
  });

  const [glAccountForm, setGlAccountForm] = useState({
    gl_code: '',
    gl_name: '',
    account_head: 'EXPENSES',
    company_code: '1000',
    is_balance_sheet: false,
  });

  const [companyCodeForm, setCompanyCodeForm] = useState({
    code: '',
    name: '',
    country_code: 'USA',
    currency_code: 'USD',
    chart_of_accounts: 'CAUS',
    fiscal_variant: 'K4',
  });

  const [categoryForm, setCategoryForm] = useState({
    category_code: '',
    category_name: '',
    default_gl_code: '600100',
    subcategories: 'Flight, Train, Taxi',
    requires_approval_limit: true,
  });

  const [taxCodeForm, setTaxCodeForm] = useState({
    code: '',
    sap_tax_code: '',
    description: '',
    rate_percent: 0,
    valid_from: '2026-01-01',
    valid_to: '9999-12-31',
    is_reverse_charge: false,
  });

  const [currencyForm, setCurrencyForm] = useState({
    code: '',
    name: '',
    symbol: '$',
    decimal_places: 2,
    exchange_rate_to_base: 1.0,
    is_base_currency: false,
  });

  // Handlers
  const handleAddVendor = () => {
    if (!vendorForm.vendor_code || !vendorForm.vendor_name) return;
    store.setVendors([
      ...store.vendors,
      {
        id: `v_${Date.now()}`,
        ...vendorForm,
        is_active: true,
      },
    ]);
    store.addLog('MASTER_DATA', 'VENDOR_CREATED', 'SUCCESS', `Vendor created: ${vendorForm.vendor_name} (${vendorForm.vendor_code})`);
    setIsAdding(false);
    setVendorForm({ vendor_code: '', vendor_name: '', tax_identifier: '', country_code: 'USA', recon_account_gl: '211000', payment_terms: 'NT30' });
  };

  const handleAddEmployee = () => {
    if (!employeeForm.employee_code || !employeeForm.full_name) return;
    store.setEmployees([
      ...store.employees,
      {
        id: `emp_${Date.now()}`,
        ...employeeForm,
        is_active: true,
      },
    ]);
    store.addLog('MASTER_DATA', 'EMPLOYEE_CREATED', 'SUCCESS', `Employee created: ${employeeForm.full_name} (${employeeForm.employee_code})`);
    setIsAdding(false);
    setEmployeeForm({ employee_code: '', full_name: '', official_email: '', department_code: 'FIN', cost_center_code: 'CC100', grade_level: 'M2', approval_level: 1 });
  };

  const handleAddCostCenter = () => {
    if (!costCenterForm.code || !costCenterForm.name) return;
    store.setCostCenters([
      ...store.costCenters,
      {
        id: `cc_${Date.now()}`,
        ...costCenterForm,
        is_active: true,
      },
    ]);
    store.addLog('MASTER_DATA', 'COST_CENTER_CREATED', 'SUCCESS', `Cost center created: ${costCenterForm.code} - ${costCenterForm.name}`);
    setIsAdding(false);
    setCostCenterForm({ code: '', name: '', company_code: '1000', department: 'OPERATIONS' });
  };

  const handleAddGlAccount = () => {
    if (!glAccountForm.gl_code || !glAccountForm.gl_name) return;
    store.setGlAccounts([
      ...store.glAccounts,
      {
        id: `gl_${Date.now()}`,
        ...glAccountForm,
        is_active: true,
      },
    ]);
    store.addLog('MASTER_DATA', 'GL_CREATED', 'SUCCESS', `GL account created: ${glAccountForm.gl_code} - ${glAccountForm.gl_name}`);
    setIsAdding(false);
    setGlAccountForm({ gl_code: '', gl_name: '', account_head: 'EXPENSES', company_code: '1000', is_balance_sheet: false });
  };

  const handleAddCompanyCode = () => {
    if (!companyCodeForm.code || !companyCodeForm.name) return;
    store.setCompanyCodes([
      ...store.companyCodes,
      {
        id: `comp_${Date.now()}`,
        ...companyCodeForm,
        is_active: true,
      },
    ]);
    store.addLog('MASTER_DATA', 'COMPANY_CODE_CREATED', 'SUCCESS', `Company code created: ${companyCodeForm.code} - ${companyCodeForm.name}`);
    setIsAdding(false);
    setCompanyCodeForm({ code: '', name: '', country_code: 'USA', currency_code: 'USD', chart_of_accounts: 'CAUS', fiscal_variant: 'K4' });
  };

  const handleAddCategory = () => {
    if (!categoryForm.category_code || !categoryForm.category_name) return;
    store.setExpenseCategories([
      ...store.expenseCategories,
      {
        id: `cat_${Date.now()}`,
        category_code: categoryForm.category_code.toUpperCase(),
        category_name: categoryForm.category_name,
        default_gl_code: categoryForm.default_gl_code,
        subcategories: categoryForm.subcategories.split(',').map((s) => s.trim()),
        requires_approval_limit: categoryForm.requires_approval_limit,
        is_active: true,
      },
    ]);
    store.addLog('MASTER_DATA', 'CATEGORY_CREATED', 'SUCCESS', `Expense category created: ${categoryForm.category_code}`);
    setIsAdding(false);
    setCategoryForm({ category_code: '', category_name: '', default_gl_code: '600100', subcategories: 'Flight, Train, Taxi', requires_approval_limit: true });
  };

  const handleAddTaxCode = () => {
    if (!taxCodeForm.code || !taxCodeForm.sap_tax_code) return;
    store.setTaxCodes([
      ...store.taxCodes,
      {
        id: `tax_${Date.now()}`,
        ...taxCodeForm,
        is_active: true,
      },
    ]);
    store.addLog('MASTER_DATA', 'TAX_CODE_CREATED', 'SUCCESS', `Tax code created: ${taxCodeForm.code} (${taxCodeForm.rate_percent}%)`);
    setIsAdding(false);
    setTaxCodeForm({ code: '', sap_tax_code: '', description: '', rate_percent: 0, valid_from: '2026-01-01', valid_to: '9999-12-31', is_reverse_charge: false });
  };

  const handleAddCurrency = () => {
    if (!currencyForm.code) return;
    store.setCurrencies([
      ...store.currencies,
      {
        id: `curr_${Date.now()}`,
        ...currencyForm,
        code: currencyForm.code.toUpperCase(),
      },
    ]);
    store.addLog('MASTER_DATA', 'CURRENCY_CREATED', 'SUCCESS', `Currency created: ${currencyForm.code}`);
    setIsAdding(false);
    setCurrencyForm({ code: '', name: '', symbol: '$', decimal_places: 2, exchange_rate_to_base: 1.0, is_base_currency: false });
  };

  const downloadJsonTemplate = (type: string) => {
    const templateData = {
      entity_type: type,
      schema_version: '1.0',
      description: `Structural upload template for ${type}. Fill with real enterprise records.`,
      records: [],
    };
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InvoiceFlow_${type}_template.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            Enterprise Master Data Manager
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Zero mock or fake records. Maintain ERP references for Vendors, Employees, Cost Centers, Account Heads, Company Codes, and Tax Slabs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadJsonTemplate(activeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Template</span>
          </button>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-neutral-800 text-xs">
        {[
          { id: 'vendors', label: `Vendors (${store.vendors.length})` },
          { id: 'employees', label: `Employees (${store.employees.length})` },
          { id: 'cost_centers', label: `Cost Centres (${store.costCenters.length})` },
          { id: 'gl_accounts', label: `GL Accounts (${store.glAccounts.length})` },
          { id: 'company_codes', label: `Company Codes (${store.companyCodes.length})` },
          { id: 'categories', label: `Expense Categories (${store.expenseCategories.length})` },
          { id: 'tax_codes', label: `Tax Codes (${store.taxCodes.length})` },
          { id: 'currencies', label: `Currencies (${store.currencies.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setIsAdding(false);
            }}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Entity Form Modal */}
      {isAdding && (
        <div className="p-4 rounded-lg bg-neutral-900 border border-blue-500/40 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Create Master Record: {activeTab.replace('_', ' ').toUpperCase()}
          </h3>

          {activeTab === 'vendors' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Vendor Code *</label>
                <input
                  type="text"
                  placeholder="VEND1001"
                  value={vendorForm.vendor_code}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendor_code: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-neutral-400 block mb-1">Vendor Legal Name *</label>
                <input
                  type="text"
                  placeholder="Acme Industrial Corp LLC"
                  value={vendorForm.vendor_name}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendor_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Tax ID / PAN / GSTIN</label>
                <input
                  type="text"
                  placeholder="PAN-99482104"
                  value={vendorForm.tax_identifier}
                  onChange={(e) => setVendorForm({ ...vendorForm, tax_identifier: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Recon GL Account</label>
                <input
                  type="text"
                  placeholder="211000"
                  value={vendorForm.recon_account_gl}
                  onChange={(e) => setVendorForm({ ...vendorForm, recon_account_gl: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Payment Terms</label>
                <input
                  type="text"
                  placeholder="NT30"
                  value={vendorForm.payment_terms}
                  onChange={(e) => setVendorForm({ ...vendorForm, payment_terms: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Employee Code *</label>
                <input
                  type="text"
                  placeholder="EMP001"
                  value={employeeForm.employee_code}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, employee_code: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={employeeForm.full_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, full_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Official Email</label>
                <input
                  type="email"
                  placeholder="jane.doe@enterprise.com"
                  value={employeeForm.official_email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, official_email: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>
            </div>
          )}

          {activeTab === 'cost_centers' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Cost Center Code *</label>
                <input
                  type="text"
                  placeholder="CC-100"
                  value={costCenterForm.code}
                  onChange={(e) => setCostCenterForm({ ...costCenterForm, code: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-neutral-400 block mb-1">Cost Center Name *</label>
                <input
                  type="text"
                  placeholder="Finance &amp; Operations"
                  value={costCenterForm.name}
                  onChange={(e) => setCostCenterForm({ ...costCenterForm, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Category Code *</label>
                <input
                  type="text"
                  placeholder="TRAVEL"
                  value={categoryForm.category_code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, category_code: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="Business Travel &amp; Lodging"
                  value={categoryForm.category_name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Default Expense GL</label>
                <input
                  type="text"
                  placeholder="600100"
                  value={categoryForm.default_gl_code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, default_gl_code: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (activeTab === 'vendors') handleAddVendor();
                if (activeTab === 'employees') handleAddEmployee();
                if (activeTab === 'cost_centers') handleAddCostCenter();
                if (activeTab === 'gl_accounts') handleAddGlAccount();
                if (activeTab === 'company_codes') handleAddCompanyCode();
                if (activeTab === 'categories') handleAddCategory();
                if (activeTab === 'tax_codes') handleAddTaxCode();
                if (activeTab === 'currencies') handleAddCurrency();
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
            >
              Save Record
            </button>
          </div>
        </div>
      )}

      {/* Main Table Views with Zero-Data Pristine Empty State */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        {activeTab === 'vendors' && (
          <div>
            {store.vendors.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-400">
                <Building className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <div className="font-semibold text-neutral-300">No Vendor Records Configured</div>
                <p className="mt-1 text-neutral-500 max-w-sm mx-auto">
                  Per the non-negotiable enterprise rule, zero dummy vendors exist. Add real vendors manually or download the upload template.
                </p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                >
                  + Add First Vendor
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                    <th className="py-2.5 px-3">Vendor Code</th>
                    <th className="py-2.5 px-3">Legal Name</th>
                    <th className="py-2.5 px-3">Tax ID</th>
                    <th className="py-2.5 px-3">Recon GL</th>
                    <th className="py-2.5 px-3">Terms</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  {store.vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-neutral-800/30">
                      <td className="py-2 px-3 font-mono text-neutral-200">{v.vendor_code}</td>
                      <td className="py-2 px-3 font-medium text-white">{v.vendor_name}</td>
                      <td className="py-2 px-3 font-mono text-neutral-400">{v.tax_identifier || '-'}</td>
                      <td className="py-2 px-3 font-mono text-neutral-400">{v.recon_account_gl}</td>
                      <td className="py-2 px-3 font-mono text-neutral-400">{v.payment_terms}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => store.setVendors(store.vendors.filter((x) => x.id !== v.id))}
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
        )}

        {activeTab === 'employees' && (
          <div>
            {store.employees.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-400">
                <UserCheck className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <div className="font-semibold text-neutral-300">No Employee Master Records</div>
                <p className="mt-1 text-neutral-500 max-w-sm mx-auto">
                  Empty table ready for real organization personnel mappings.
                </p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                >
                  + Add First Employee
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                    <th className="py-2.5 px-3">Employee Code</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Dept</th>
                    <th className="py-2.5 px-3">Cost Center</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  {store.employees.map((e) => (
                    <tr key={e.id} className="hover:bg-neutral-800/30">
                      <td className="py-2 px-3 font-mono text-neutral-200">{e.employee_code}</td>
                      <td className="py-2 px-3 font-medium text-white">{e.full_name}</td>
                      <td className="py-2 px-3 text-neutral-400">{e.official_email}</td>
                      <td className="py-2 px-3 font-mono text-neutral-400">{e.department_code}</td>
                      <td className="py-2 px-3 font-mono text-neutral-400">{e.cost_center_code}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => store.setEmployees(store.employees.filter((x) => x.id !== e.id))}
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
        )}

        {activeTab === 'categories' && (
          <div>
            {store.expenseCategories.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-400">
                <Tag className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <div className="font-semibold text-neutral-300">No Expense Categories Configured</div>
                <p className="mt-1 text-neutral-500 max-w-sm mx-auto">
                  Add category definitions (e.g. TRAVEL, FOOD, HOTEL, FUEL) to drive automated GL code and tax determination rules.
                </p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                >
                  + Add Category
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                    <th className="py-2.5 px-3">Category Code</th>
                    <th className="py-2.5 px-3">Category Name</th>
                    <th className="py-2.5 px-3">Default GL</th>
                    <th className="py-2.5 px-3">Subcategories</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300">
                  {store.expenseCategories.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-800/30">
                      <td className="py-2 px-3 font-mono font-semibold text-blue-400">{c.category_code}</td>
                      <td className="py-2 px-3 font-medium text-white">{c.category_name}</td>
                      <td className="py-2 px-3 font-mono text-neutral-400">{c.default_gl_code}</td>
                      <td className="py-2 px-3 text-neutral-400">{c.subcategories.join(', ')}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => store.setExpenseCategories(store.expenseCategories.filter((x) => x.id !== c.id))}
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
        )}

        {/* Cost centers & other tabs with standard table view */}
        {activeTab === 'cost_centers' && (
          <div className="py-12 text-center text-xs text-neutral-400">
            {store.costCenters.length === 0 ? (
              <div>
                <div className="font-semibold text-neutral-300">No Cost Centers Configured</div>
                <p className="mt-1 text-neutral-500">Add cost centers to enable automated expense assignment.</p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                >
                  + Add Cost Center
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {store.costCenters.map((cc) => (
                    <tr key={cc.id} className="text-neutral-300">
                      <td className="py-2 px-3 font-mono text-white">{cc.code}</td>
                      <td className="py-2 px-3">{cc.name}</td>
                      <td className="py-2 px-3 font-mono">{cc.company_code}</td>
                      <td className="py-2 px-3">{cc.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
