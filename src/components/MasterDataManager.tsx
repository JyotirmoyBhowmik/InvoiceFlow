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
  Edit3,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useInvoiceFlowStore } from '../store/useInvoiceFlowStore';
import { VendorEntity, EmployeeEntity, CostCenterEntity, ExpenseCategoryEntity, TaxCodeEntity, CurrencyEntity } from '../types';

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
  >('vendors');

  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: string; data: any } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; label: string } | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Form states
  const [vendorForm, setVendorForm] = useState({
    vendor_code: '',
    vendor_name: '',
    tax_identifier: '',
    country_code: 'IND',
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

  const [categoryForm, setCategoryForm] = useState({
    category_code: '',
    category_name: '',
    default_gl_code: '600100',
    subcategories: 'Flight, Train, Taxi',
    requires_approval_limit: true,
  });

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
    store.addLog('MASTER_DATA', 'VENDOR_CREATED', 'SUCCESS', `Vendor master created: ${vendorForm.vendor_code}`);
    showToast(`Vendor registered: ${vendorForm.vendor_name}`);
    setIsAdding(false);
    setVendorForm({ vendor_code: '', vendor_name: '', tax_identifier: '', country_code: 'IND', recon_account_gl: '211000', payment_terms: 'NT30' });
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
    store.addLog('MASTER_DATA', 'EMPLOYEE_CREATED', 'SUCCESS', `Employee created: ${employeeForm.employee_code}`);
    showToast(`Employee registered: ${employeeForm.full_name}`);
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
    store.addLog('MASTER_DATA', 'COST_CENTER_CREATED', 'SUCCESS', `Cost center created: ${costCenterForm.code}`);
    showToast(`Cost center added: ${costCenterForm.name}`);
    setIsAdding(false);
    setCostCenterForm({ code: '', name: '', company_code: '1000', department: 'OPERATIONS' });
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
    showToast(`Category added: ${categoryForm.category_name}`);
    setIsAdding(false);
    setCategoryForm({ category_code: '', category_name: '', default_gl_code: '600100', subcategories: 'Flight, Train, Taxi', requires_approval_limit: true });
  };

  // Save Edit Handler
  const handleSaveEditItem = () => {
    if (!editingItem) return;

    if (editingItem.type === 'vendor') {
      store.setVendors(store.vendors.map((v) => (v.id === editingItem.data.id ? editingItem.data : v)));
      showToast(`Vendor updated: ${editingItem.data.vendor_name}`);
    } else if (editingItem.type === 'employee') {
      store.setEmployees(store.employees.map((e) => (e.id === editingItem.data.id ? editingItem.data : e)));
      showToast(`Employee updated: ${editingItem.data.full_name}`);
    } else if (editingItem.type === 'cost_center') {
      store.setCostCenters(store.costCenters.map((c) => (c.id === editingItem.data.id ? editingItem.data : c)));
      showToast(`Cost center updated: ${editingItem.data.name}`);
    } else if (editingItem.type === 'category') {
      store.setExpenseCategories(store.expenseCategories.map((c) => (c.id === editingItem.data.id ? editingItem.data : c)));
      showToast(`Category updated: ${editingItem.data.category_name}`);
    }
    setEditingItem(null);
  };

  // Delete Confirmation Handler
  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'vendor') {
      store.setVendors(store.vendors.filter((x) => x.id !== itemToDelete.id));
    } else if (itemToDelete.type === 'employee') {
      store.setEmployees(store.employees.filter((x) => x.id !== itemToDelete.id));
    } else if (itemToDelete.type === 'cost_center') {
      store.setCostCenters(store.costCenters.filter((x) => x.id !== itemToDelete.id));
    } else if (itemToDelete.type === 'category') {
      store.setExpenseCategories(store.expenseCategories.filter((x) => x.id !== itemToDelete.id));
    }
    showToast(`Deleted ${itemToDelete.label}`);
    setItemToDelete(null);
  };

  const downloadJsonTemplate = (type: string) => {
    const templateData = {
      entity_type: type,
      schema_version: '1.0',
      description: `Structural upload template for ${type}.`,
      records: [],
    };
    const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InvoiceFlow_${type}_template.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded template for ${type}`);
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
            Enterprise Master Data Manager
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Maintain ERP references for Vendors, Employees, Cost Centers, Account Heads, Company Codes, and Tax Slabs with full edit &amp; delete capabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadJsonTemplate(activeTab)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 rounded transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Template</span>
          </button>

          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm cursor-pointer"
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
          { id: 'categories', label: `Expense Categories (${store.expenseCategories.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setIsAdding(false);
            }}
            className={`px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
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
                  placeholder="EMP-10029"
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
                  placeholder="Finance & Operations"
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
                  placeholder="Business Travel & Lodging"
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
                else if (activeTab === 'employees') handleAddEmployee();
                else if (activeTab === 'cost_centers') handleAddCostCenter();
                else if (activeTab === 'categories') handleAddCategory();
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
            >
              Save Record
            </button>
          </div>
        </div>
      )}

      {/* Table Content with Edit and Delete options */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        {activeTab === 'vendors' && (
          <div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                  <th className="py-2.5 px-3">Vendor Code</th>
                  <th className="py-2.5 px-3">Legal Name</th>
                  <th className="py-2.5 px-3">Tax ID</th>
                  <th className="py-2.5 px-3">Recon GL</th>
                  <th className="py-2.5 px-3">Terms</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingItem({ type: 'vendor', data: { ...v } })}
                          className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Edit Vendor"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'vendor', id: v.id, label: v.vendor_name })}
                          className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'employees' && (
          <div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                  <th className="py-2.5 px-3">Employee Code</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Dept</th>
                  <th className="py-2.5 px-3">Cost Center</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingItem({ type: 'employee', data: { ...e } })}
                          className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Edit Employee"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'employee', id: e.id, label: e.full_name })}
                          className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'cost_centers' && (
          <div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                  <th className="py-2.5 px-3">Cost Center Code</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Company Code</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300">
                {store.costCenters.map((cc) => (
                  <tr key={cc.id} className="hover:bg-neutral-800/30">
                    <td className="py-2 px-3 font-mono text-white">{cc.code}</td>
                    <td className="py-2 px-3">{cc.name}</td>
                    <td className="py-2 px-3 font-mono text-neutral-400">{cc.company_code}</td>
                    <td className="py-2 px-3 text-neutral-400">{cc.department}</td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingItem({ type: 'cost_center', data: { ...cc } })}
                          className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Edit Cost Center"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'cost_center', id: cc.id, label: cc.name })}
                          className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Delete Cost Center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950 text-neutral-400">
                  <th className="py-2.5 px-3">Category Code</th>
                  <th className="py-2.5 px-3">Category Name</th>
                  <th className="py-2.5 px-3">Default GL</th>
                  <th className="py-2.5 px-3">Subcategories</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingItem({ type: 'category', data: { ...c } })}
                          className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Edit Category"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({ type: 'category', id: c.id, label: c.category_name })}
                          className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Edit Record: {editingItem.type.replace('_', ' ').toUpperCase()}
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingItem.type === 'vendor' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1">Vendor Legal Name</label>
                  <input
                    type="text"
                    value={editingItem.data.vendor_name}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, vendor_name: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Tax ID / PAN / GSTIN</label>
                  <input
                    type="text"
                    value={editingItem.data.tax_identifier || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, tax_identifier: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Recon Account GL</label>
                  <input
                    type="text"
                    value={editingItem.data.recon_account_gl}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, recon_account_gl: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={editingItem.data.payment_terms}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, payment_terms: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                  />
                </div>
              </div>
            )}

            {editingItem.type === 'employee' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingItem.data.full_name}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, full_name: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Official Email</label>
                  <input
                    type="email"
                    value={editingItem.data.official_email}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, official_email: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Cost Center</label>
                  <input
                    type="text"
                    value={editingItem.data.cost_center_code}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, cost_center_code: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                  />
                </div>
              </div>
            )}

            {editingItem.type === 'cost_center' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1">Cost Center Name</label>
                  <input
                    type="text"
                    value={editingItem.data.name}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Department</label>
                  <input
                    type="text"
                    value={editingItem.data.department}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, department: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                  />
                </div>
              </div>
            )}

            {editingItem.type === 'category' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1">Category Name</label>
                  <input
                    type="text"
                    value={editingItem.data.category_name}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, category_name: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Default Expense GL</label>
                  <input
                    type="text"
                    value={editingItem.data.default_gl_code}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, default_gl_code: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-neutral-200 font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditItem}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-700/60 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Delete Record</h3>
            </div>
            <p className="text-xs text-neutral-300">
              Are you sure you want to delete <strong className="text-white">{itemToDelete.label}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
