import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Input';
import { Table, type Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import type { HarvestEntry, Expense, Sale, CropSeason, Activity } from '../../types';
import { farmService } from '../../services/farmService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type HarvestTab = 'harvests' | 'expenses' | 'sales' | 'summary';

const EXPENSE_CATEGORY_BY_ACTIVITY: Record<string, Expense['category']> = {
  land_preparation: 'LABOR',
  fertilizer_application: 'FERTILIZER',
  weeding: 'LABOR',
  pesticide_application: 'PESTICIDE',
  irrigation: 'IRRIGATION',
  harvesting: 'LABOR',
  other: 'OTHER',
};

const ACTIVITY_TYPE_BY_CATEGORY: Record<string, string> = {
  FERTILIZER: 'fertilizer_application',
  PESTICIDE: 'pesticide_application',
  IRRIGATION: 'irrigation',
  LABOR: 'land_preparation',
};

function activityToExpense(a: Activity): Expense {
  const typeKey = (a.type || '').toLowerCase();
  return {
    id: a.id,
    cropSeasonId: a.cropSeasonId,
    category: EXPENSE_CATEGORY_BY_ACTIVITY[typeKey] || 'OTHER',
    description: a.description || '',
    amount: a.cost || 0,
    currency: 'RWF',
    expenseDate: a.activityDate,
    paymentMethod: 'CASH',
    recordedById: a.performedById,
    recordedByName: a.performedByName,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export function HarvestsPage() {
  const [activeTab, setActiveTab] = useState<HarvestTab>('summary');
  const [seasons, setSeasons] = useState<CropSeason[]>([]);
  const [harvests, setHarvests] = useState<HarvestEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalType, setModalType] = useState<null | 'harvest' | 'expense' | 'sale'>(null);

  const [harvestForm, setHarvestForm] = useState({
    cropSeasonId: '',
    harvestPlotName: '',
    harvestDate: new Date().toISOString().split('T')[0],
    quantityKg: '',
    moistureContentPercent: '',
    qualityGrade: 'GRADE_1' as HarvestEntry['qualityGrade'],
    notes: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    cropSeasonId: '',
    category: 'SEEDS' as Expense['category'],
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH' as Expense['paymentMethod'],
    reference: '',
  });

  const [saleForm, setSaleForm] = useState({
    cropSeasonId: '',
    buyerName: '',
    quantityKg: '',
    unitPrice: '',
    saleDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH' as Sale['paymentMethod'],
    paymentReference: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [seasonsRes, harvestsRes, activitiesRes, salesRes] = await Promise.all([
        farmService.getCropSeasons(),
        farmService.getHarvestRecords(),
        farmService.getActivities(),
        farmService.getSales(),
      ]);
      setSeasons(seasonsRes);
      setHarvests(harvestsRes);
      setExpenses(activitiesRes.map(activityToExpense));
      setSales(salesRes);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHarvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!harvestForm.cropSeasonId || !harvestForm.quantityKg) return;

    try {
      const created = await farmService.createHarvestRecord({
        cropSeasonId: harvestForm.cropSeasonId,
        harvestDate: harvestForm.harvestDate,
        quantityKg: parseFloat(harvestForm.quantityKg),
        moistureContentPercent: harvestForm.moistureContentPercent ? parseFloat(harvestForm.moistureContentPercent) : undefined,
        qualityGrade: harvestForm.qualityGrade,
        harvestPlotName: harvestForm.harvestPlotName,
        notes: harvestForm.notes,
      });
      setHarvests((prev) => [created, ...prev]);
      setModalType(null);
    } catch (error) {
      console.error('Failed to record harvest:', error);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;

    const cropSeasonId = expenseForm.cropSeasonId || seasons[0]?.id;
    if (!cropSeasonId) return;

    try {
      const created = await farmService.createActivity({
        cropSeasonId,
        type: ACTIVITY_TYPE_BY_CATEGORY[expenseForm.category] || 'other',
        activityDate: expenseForm.expenseDate,
        description: expenseForm.description,
        cost: parseFloat(expenseForm.amount),
        paymentMethod: expenseForm.paymentMethod,
        reference: expenseForm.reference,
      });
      setExpenses((prev) => [activityToExpense(created), ...prev]);
      setModalType(null);
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.buyerName || !saleForm.quantityKg || !saleForm.unitPrice) return;

    try {
      const created = await farmService.createSale({
        buyerName: saleForm.buyerName,
        quantityKg: parseFloat(saleForm.quantityKg),
        unitPrice: parseFloat(saleForm.unitPrice),
        saleDate: saleForm.saleDate,
        cropSeasonId: saleForm.cropSeasonId || undefined,
        paymentMethod: saleForm.paymentMethod,
        paymentReference: saleForm.paymentReference,
        notes: saleForm.notes,
      });
      setSales((prev) => [created, ...prev]);
      setModalType(null);
    } catch (error) {
      console.error('Failed to add sale:', error);
    }
  };

  const totalHarvestKg = harvests.reduce((sum, h) => sum + h.quantityKg, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const cashBalance = totalSales - totalExpenses;

  const harvestColumns: Column<HarvestEntry>[] = [
    { key: 'harvestPlotName', header: 'Plot' },
    { key: 'harvestDate', header: 'Date', render: (row) => format(parseISO(row.harvestDate), 'MMM dd, yyyy') },
    { key: 'quantityKg', header: 'Quantity (kg)', render: (row) => row.quantityKg.toLocaleString() },
    { key: 'moistureContentPercent', header: 'Moisture %', render: (row) => row.moistureContentPercent ? `${row.moistureContentPercent}%` : '-' },
    { key: 'qualityGrade', header: 'Grade', render: (row) => <Badge variant={row.qualityGrade === 'GRADE_1' ? 'success' : row.qualityGrade === 'GRADE_2' ? 'info' : 'warning'}>{row.qualityGrade?.replace('_', ' ')}</Badge> },
    { key: 'notes', header: 'Notes' },
  ];

  const expenseColumns: Column<Expense>[] = [
    { key: 'category', header: 'Category', render: (row) => <Badge variant="info">{row.category.replace('_', ' ')}</Badge> },
    { key: 'description', header: 'Description' },
    { key: 'amount', header: 'Amount (RWF)', render: (row) => row.amount.toLocaleString() },
    { key: 'paymentMethod', header: 'Payment', render: (row) => row.paymentMethod.replace('_', ' ') },
    { key: 'expenseDate', header: 'Date', render: (row) => format(parseISO(row.expenseDate), 'MMM dd, yyyy') },
  ];

  const saleColumns: Column<Sale>[] = [
    { key: 'buyerName', header: 'Buyer' },
    { key: 'quantityKg', header: 'Quantity (kg)', render: (row) => row.quantityKg.toLocaleString() },
    { key: 'unitPrice', header: 'Unit Price (RWF)', render: (row) => row.unitPrice.toLocaleString() },
    { key: 'totalAmount', header: 'Total (RWF)', render: (row) => row.totalAmount.toLocaleString() },
    { key: 'paymentMethod', header: 'Payment', render: (row) => row.paymentMethod.replace('_', ' ') },
    { key: 'saleDate', header: 'Date', render: (row) => format(parseISO(row.saleDate), 'MMM dd, yyyy') },
  ];

  const expenseChartData = {
    labels: expenses.map((e) => e.category.replace('_', ' ')),
    datasets: [
      {
        label: 'Expenses (RWF)',
        data: expenses.map((e) => e.amount),
        backgroundColor: ['#16a34a', '#2563eb', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'],
      },
    ],
  };

  const salesChartData = {
    labels: sales.map((s) => s.buyerName),
    datasets: [
      {
        label: 'Sales (RWF)',
        data: sales.map((s) => s.totalAmount),
        backgroundColor: '#16a34a',
      },
    ],
  };

  const harvestChartData = {
    labels: harvests.map((h) => h.harvestPlotName || 'Harvest'),
    datasets: [
      {
        label: 'Harvest Quantity (kg)',
        data: harvests.map((h) => h.quantityKg),
        backgroundColor: '#16a34a',
      },
    ],
  };

  const tabs: { id: HarvestTab; label: string; icon: string }[] = [
    { id: 'summary', label: 'Financial Summary', icon: 'bi-pie-chart-fill' },
    { id: 'harvests', label: 'Harvest Logs', icon: 'bi-basket3-fill' },
    { id: 'expenses', label: 'Input Expenses', icon: 'bi-receipt' },
    { id: 'sales', label: 'Sales & Invoices', icon: 'bi-cash-coin' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-indigo-950 text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2 backdrop-blur-xs">
            <i className="bi bi-cash-stack"></i> Harvest Yield & Financials
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Harvests, Expenses & Sales</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Record crop collections, manage farm expenditures, track produce buyers, and monitor net profit.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setModalType('expense')}
            leftIcon={<i className="bi bi-dash-circle text-rose-300"></i>}
            className="border-white/30 text-white hover:bg-white/10"
          >
            Add Expense
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setModalType('sale')}
            leftIcon={<i className="bi bi-plus-circle text-emerald-300"></i>}
            className="border-white/30 text-white hover:bg-white/10"
          >
            Add Sale
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setModalType('harvest')}
            leftIcon={<i className="bi bi-basket-fill"></i>}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold border-0 shadow-glow-accent"
          >
            Record Harvest
          </Button>
        </div>
      </div>

      {/* Modern 4-Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card-gradient">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Harvest</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><i className="bi bi-basket2-fill"></i></span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalHarvestKg.toLocaleString()} <span className="text-sm font-semibold text-slate-500">kg</span></p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">High Yield Season</span>
        </div>

        <div className="stat-card-gradient stat-card-rose">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center"><i className="bi bi-arrow-down-right-circle-fill"></i></span>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">RWF {totalExpenses.toLocaleString()}</p>
          <span className="text-xs text-slate-500 font-medium mt-1 inline-block">Inputs & Operations</span>
        </div>

        <div className="stat-card-gradient stat-card-sky">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</span>
            <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center"><i className="bi bi-arrow-up-right-circle-fill"></i></span>
          </div>
          <p className="text-2xl font-black text-sky-700 mt-2">RWF {totalSales.toLocaleString()}</p>
          <span className="text-xs text-sky-600 font-medium mt-1 inline-block">Off-taker Revenue</span>
        </div>

        <div className={`stat-card-gradient ${cashBalance >= 0 ? 'stat-card-amber' : 'stat-card-rose'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Net Margin</span>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${cashBalance >= 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
              <i className="bi bi-wallet2"></i>
            </span>
          </div>
          <p className={`text-2xl font-black mt-2 ${cashBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            RWF {cashBalance.toLocaleString()}
          </p>
          <span className="text-xs font-semibold text-slate-500 mt-1 inline-block">
            {cashBalance >= 0 ? '🟢 Profitable Balance' : '🔴 Negative Cashflow'}
          </span>
        </div>
      </div>

      {/* Modern Navigation Pills */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-slate-200/80">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <i className={`bi ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="default" padding="md">
            <CardHeader title="Expenses by Category" />
            <CardBody>
              <Bar data={expenseChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </CardBody>
          </Card>
          <Card variant="default" padding="md">
            <CardHeader title="Sales by Buyer" />
            <CardBody>
              <Bar data={salesChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </CardBody>
          </Card>
          <Card variant="default" padding="md">
            <CardHeader title="Harvest by Plot" />
            <CardBody>
              <Bar data={harvestChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </CardBody>
          </Card>
          <Card variant="default" padding="md">
            <CardHeader title="Financial Summary" />
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Sales</span>
                  <span className="font-semibold text-green-700">RWF {totalSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="font-semibold text-red-600">- RWF {totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="font-medium text-gray-900">Cash Balance (Sales - Expenses)</span>
                  <span className={`font-bold ${cashBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    RWF {cashBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'harvests' && (
        <Card variant="default" padding="none">
          <CardHeader title="Harvest Records" subtitle={`${harvests.length} record(s)`} />
          <CardBody>
            <Table
              columns={harvestColumns}
              data={harvests}
              keyExtractor={(row) => row.id}
              isLoading={isLoading}
              emptyMessage="No harvest records yet."
              hoverable
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'expenses' && (
        <Card variant="default" padding="none">
          <CardHeader title="Expense Records" subtitle={`${expenses.length} record(s)`} />
          <CardBody>
            <Table
              columns={expenseColumns}
              data={expenses}
              keyExtractor={(row) => row.id}
              isLoading={isLoading}
              emptyMessage="No expense records yet."
              hoverable
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'sales' && (
        <Card variant="default" padding="none">
          <CardHeader title="Sales Records" subtitle={`${sales.length} record(s)`} />
          <CardBody>
            <Table
              columns={saleColumns}
              data={sales}
              keyExtractor={(row) => row.id}
              isLoading={isLoading}
              emptyMessage="No sales records yet."
              hoverable
            />
          </CardBody>
        </Card>
      )}

      <Modal isOpen={modalType === 'harvest'} onClose={() => setModalType(null)} title="Record Harvest" size="md">
        <form onSubmit={handleHarvestSubmit} className="space-y-4">
          <Select
            label="Crop Season"
            required
            value={harvestForm.cropSeasonId}
            onChange={(e) => setHarvestForm((prev) => ({ ...prev, cropSeasonId: e.target.value }))}
            options={seasons.map((s) => ({ value: s.id, label: `${s.cropTypeName} - ${s.cropVarietyName} (${s.seasonName})` }))}
            placeholder="Select crop season"
          />
          <Input
            label="Plot Name (optional)"
            value={harvestForm.harvestPlotName}
            onChange={(e) => setHarvestForm((prev) => ({ ...prev, harvestPlotName: e.target.value }))}
            placeholder="e.g., Plot 1 - North"
          />
          <Input
            label="Harvest Date"
            type="date"
            required
            value={harvestForm.harvestDate}
            onChange={(e) => setHarvestForm((prev) => ({ ...prev, harvestDate: e.target.value }))}
          />
          <Input
            label="Quantity (kg)"
            type="number"
            min="0"
            step="0.01"
            required
            value={harvestForm.quantityKg}
            onChange={(e) => setHarvestForm((prev) => ({ ...prev, quantityKg: e.target.value }))}
          />
          <Input
            label="Moisture Content (%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={harvestForm.moistureContentPercent}
            onChange={(e) => setHarvestForm((prev) => ({ ...prev, moistureContentPercent: e.target.value }))}
          />
          <Select
            label="Quality Grade"
            value={harvestForm.qualityGrade}
            onChange={(e) => setHarvestForm((prev) => ({ ...prev, qualityGrade: e.target.value as HarvestEntry['qualityGrade'] }))}
            options={[
              { value: 'GRADE_1', label: 'Grade 1 (Premium)' },
              { value: 'GRADE_2', label: 'Grade 2 (Standard)' },
              { value: 'GRADE_3', label: 'Grade 3 (Lower)' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
          />
          <Textarea
            label="Notes"
            rows={2}
            value={harvestForm.notes}
            onChange={(e) => setHarvestForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit">Save Harvest</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'expense'} onClose={() => setModalType(null)} title="Add Expense" size="md">
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <Select
            label="Crop Season (optional)"
            value={expenseForm.cropSeasonId}
            onChange={(e) => setExpenseForm((prev) => ({ ...prev, cropSeasonId: e.target.value }))}
            options={seasons.map((s) => ({ value: s.id, label: `${s.cropTypeName} - ${s.cropVarietyName}` }))}
            placeholder="Select crop season"
          />
          <Select
            label="Category"
            required
            value={expenseForm.category}
            onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value as Expense['category'] }))}
            options={[
              { value: 'SEEDS', label: 'Seeds' },
              { value: 'FERTILIZER', label: 'Fertilizer' },
              { value: 'PESTICIDE', label: 'Pesticide' },
              { value: 'LABOR', label: 'Labor' },
              { value: 'EQUIPMENT', label: 'Equipment' },
              { value: 'IRRIGATION', label: 'Irrigation' },
              { value: 'TRANSPORT', label: 'Transport' },
              { value: 'OTHER', label: 'Other' },
            ]}
          />
          <Textarea
            label="Description"
            required
            rows={2}
            value={expenseForm.description}
            onChange={(e) => setExpenseForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <Input
            label="Amount (RWF)"
            type="number"
            min="0"
            required
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <Input
            label="Expense Date"
            type="date"
            required
            value={expenseForm.expenseDate}
            onChange={(e) => setExpenseForm((prev) => ({ ...prev, expenseDate: e.target.value }))}
          />
          <Select
            label="Payment Method"
            value={expenseForm.paymentMethod}
            onChange={(e) => setExpenseForm((prev) => ({ ...prev, paymentMethod: e.target.value as Expense['paymentMethod'] }))}
            options={[
              { value: 'CASH', label: 'Cash' },
              { value: 'MOBILE_MONEY', label: 'Mobile Money' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              { value: 'CREDIT', label: 'Credit' },
            ]}
          />
          <Input
            label="Reference (optional)"
            value={expenseForm.reference}
            onChange={(e) => setExpenseForm((prev) => ({ ...prev, reference: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit">Save Expense</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'sale'} onClose={() => setModalType(null)} title="Add Sale" size="md">
        <form onSubmit={handleSaleSubmit} className="space-y-4">
          <Select
            label="Crop Season (optional)"
            value={saleForm.cropSeasonId}
            onChange={(e) => setSaleForm((prev) => ({ ...prev, cropSeasonId: e.target.value }))}
            options={seasons.map((s) => ({ value: s.id, label: `${s.cropTypeName} - ${s.cropVarietyName}` }))}
            placeholder="Select crop season"
          />
          <Input
            label="Buyer Name"
            required
            value={saleForm.buyerName}
            onChange={(e) => setSaleForm((prev) => ({ ...prev, buyerName: e.target.value }))}
          />
          <Input
            label="Quantity (kg)"
            type="number"
            min="0"
            step="0.01"
            required
            value={saleForm.quantityKg}
            onChange={(e) => setSaleForm((prev) => ({ ...prev, quantityKg: e.target.value }))}
          />
          <Input
            label="Unit Price (RWF/kg)"
            type="number"
            min="0"
            required
            value={saleForm.unitPrice}
            onChange={(e) => setSaleForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
          />
          {saleForm.quantityKg && saleForm.unitPrice && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">Total Amount:</p>
              <p className="text-lg font-semibold text-green-700">
                RWF {(parseFloat(saleForm.quantityKg) * parseFloat(saleForm.unitPrice)).toLocaleString()}
              </p>
            </div>
          )}
          <Input
            label="Sale Date"
            type="date"
            required
            value={saleForm.saleDate}
            onChange={(e) => setSaleForm((prev) => ({ ...prev, saleDate: e.target.value }))}
          />
          <Select
            label="Payment Method"
            value={saleForm.paymentMethod}
            onChange={(e) => setSaleForm((prev) => ({ ...prev, paymentMethod: e.target.value as Sale['paymentMethod'] }))}
            options={[
              { value: 'CASH', label: 'Cash' },
              { value: 'MOBILE_MONEY', label: 'Mobile Money' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              { value: 'CREDIT', label: 'Credit' },
            ]}
          />
          <Input
            label="Payment Reference (optional)"
            value={saleForm.paymentReference}
            onChange={(e) => setSaleForm((prev) => ({ ...prev, paymentReference: e.target.value }))}
          />
          <Textarea
            label="Notes"
            rows={2}
            value={saleForm.notes}
            onChange={(e) => setSaleForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalType(null)}>Cancel</Button>
            <Button type="submit">Save Sale</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}