import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { Table } from '../../components/common/Table';
import type { CropSeason, HarvestEntry, Expense, Sale, InputRequest, PaymentAttempt, CropProblem } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type ReportType = 'crop-progress' | 'harvests' | 'input-requests' | 'payments' | 'expenses-sales' | 'problems';

export function AdminReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('crop-progress');
  const [filters, setFilters] = useState({
    farmerId: '',
    fieldId: '',
    cropTypeId: '',
    seasonId: '',
    startDate: '',
    endDate: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  const [cropSeasons, setCropSeasons] = useState<CropSeason[]>([]);
  const [harvests, setHarvests] = useState<HarvestEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [requests, setRequests] = useState<InputRequest[]>([]);
  const [payments, setPayments] = useState<PaymentAttempt[]>([]);
  const [problems, setProblems] = useState<CropProblem[]>([]);
  const [farmers, setFarmers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setFarmers([
        { id: '3', name: 'Paul Mukamana' },
        { id: '4', name: 'Marie Uwimana' },
      ]);
      setCropSeasons([
        { id: '1', fieldId: '1', fieldName: 'Field A', cropTypeId: '1', cropTypeName: 'Rice', cropVarietyId: '1', cropVarietyName: 'IR 52', seasonId: '1',         seasonName: '🌧️ Long rainy season', plantingMethod: 'TRANSPLANTING', plantingDate: '2024-02-15', plantedAreaHectares: 2.5, expectedGrowingDurationDays: 120, estimatedHarvestDate: '2024-06-15', status: 'ACTIVE', createdAt: '2024-02-10T00:00:00Z', updatedAt: '2024-02-10T00:00:00Z' },
        { id: '2', fieldId: '2', fieldName: 'Field B', cropTypeId: '2', cropTypeName: 'Maize', cropVarietyId: '3', cropVarietyName: 'SC 627', seasonId: '1',         seasonName: '🌧️ Long rainy season', plantingMethod: 'DIRECT_SEEDING', plantingDate: '2024-03-01', plantedAreaHectares: 1.8, expectedGrowingDurationDays: 110, estimatedHarvestDate: '2024-06-20', status: 'ACTIVE', createdAt: '2024-02-25T00:00:00Z', updatedAt: '2024-02-25T00:00:00Z' },
      ]);
      setHarvests([
        { id: '1', cropSeasonId: '1', harvestPlotId: '1', harvestPlotName: 'Plot 1', harvestDate: '2024-06-10', quantityKg: 4500, moistureContentPercent: 14, qualityGrade: 'GRADE_1', recordedById: '3', recordedByName: 'Paul Mukamana', createdAt: '2024-06-10T00:00:00Z', updatedAt: '2024-06-10T00:00:00Z' },
        { id: '2', cropSeasonId: '1', harvestPlotId: '2', harvestPlotName: 'Plot 2', harvestDate: '2024-06-12', quantityKg: 2800, moistureContentPercent: 15, qualityGrade: 'GRADE_2', recordedById: '3', recordedByName: 'Paul Mukamana', createdAt: '2024-06-12T00:00:00Z', updatedAt: '2024-06-12T00:00:00Z' },
      ]);
      setExpenses([
        { id: '1', cropSeasonId: '1', category: 'SEEDS', description: 'Rice seed IR 52', amount: 40000, currency: 'RWF', expenseDate: '2024-02-15', paymentMethod: 'CASH', recordedById: '3', recordedByName: 'Paul Mukamana', createdAt: '2024-02-15T00:00:00Z', updatedAt: '2024-02-15T00:00:00Z' },
        { id: '2', cropSeasonId: '1', category: 'FERTILIZER', description: 'NPK 17-17-17', amount: 225000, currency: 'RWF', expenseDate: '2024-03-15', paymentMethod: 'MOBILE_MONEY', reference: 'MTN-001', recordedById: '3', recordedByName: 'Paul Mukamana', createdAt: '2024-03-15T00:00:00Z', updatedAt: '2024-03-15T00:00:00Z' },
      ]);
      setSales([
        { id: '1', cropSeasonId: '1', buyerName: 'Kigali Rice Mill', quantityKg: 5000, unitPrice: 450, totalAmount: 2250000, currency: 'RWF', saleDate: '2024-06-15', paymentMethod: 'BANK_TRANSFER', paymentReference: 'BK-2024-001', recordedById: '3', recordedByName: 'Paul Mukamana', createdAt: '2024-06-15T00:00:00Z', updatedAt: '2024-06-15T00:00:00Z' },
        { id: '2', cropSeasonId: '1', buyerName: 'Local Market', quantityKg: 2300, unitPrice: 500, totalAmount: 1150000, currency: 'RWF', saleDate: '2024-06-18', paymentMethod: 'CASH', recordedById: '3', recordedByName: 'Paul Mukamana', createdAt: '2024-06-18T00:00:00Z', updatedAt: '2024-06-18T00:00:00Z' },
      ]);
      setRequests([
        { id: '1', requestNumber: 'REQ-2024-001', farmerId: '3', farmerName: 'Paul Mukamana', fieldId: '1', fieldName: 'Field A', cropSeasonId: '1', cropSeasonName: 'Rice IR 52 - 🌧️ Long rainy season', status: 'APPROVED', items: [], subtotal: 490000, taxAmount: 88200, totalAmount: 578200, currency: 'RWF', submittedAt: '2024-05-01T00:00:00Z', reviewedAt: '2024-05-03T00:00:00Z', createdAt: '2024-05-01T00:00:00Z', updatedAt: '2024-05-03T00:00:00Z' },
        { id: '2', requestNumber: 'REQ-2024-002', farmerId: '4', farmerName: 'Marie Uwimana', fieldId: '2', fieldName: 'Field B', cropSeasonId: '2', cropSeasonName: 'Maize SC 627 - 🌧️ Long rainy season', status: 'UNDER_REVIEW', items: [], subtotal: 36000, taxAmount: 6480, totalAmount: 42480, currency: 'RWF', submittedAt: '2024-05-10T00:00:00Z', createdAt: '2024-05-10T00:00:00Z', updatedAt: '2024-05-10T00:00:00Z' },
      ]);
      setPayments([
        { id: '1', orderId: '2', orderNumber: 'ORD-2024-002', farmerId: '3', farmerName: 'Paul Mukamana', method: 'MOBILE_MONEY', amount: 224200, currency: 'RWF', status: 'PAID', providerTransactionId: 'MTN-2024-001', initiatedAt: '2024-05-05T00:00:00Z', confirmedAt: '2024-05-05T00:00:00Z', createdAt: '2024-05-05T00:00:00Z', updatedAt: '2024-05-05T00:00:00Z' },
        { id: '2', orderId: '1', orderNumber: 'ORD-2024-001', farmerId: '3', farmerName: 'Paul Mukamana', method: 'BANK_TRANSFER', amount: 578200, currency: 'RWF', status: 'PENDING_VERIFICATION', farmerReference: 'BK-2024-001', initiatedAt: '2024-05-10T00:00:00Z', createdAt: '2024-05-10T00:00:00Z', updatedAt: '2024-05-10T00:00:00Z' },
      ]);
      setProblems([
        { id: '1', cropSeasonId: '1', reportedDate: '2024-04-10', problemType: 'PEST', severity: 'MEDIUM', description: 'Stem borer observed', affectedAreaHectares: 0.5, photos: [], reportedById: '3', reportedByName: 'Paul Mukamana', status: 'ADVICE_GIVEN', createdAt: '2024-04-10T00:00:00Z', updatedAt: '2024-04-10T00:00:00Z' },
        { id: '2', cropSeasonId: '2', reportedDate: '2024-05-01', problemType: 'WEED', severity: 'LOW', description: 'Weed pressure in section B', photos: [], reportedById: '4', reportedByName: 'Marie Uwimana', status: 'REPORTED', createdAt: '2024-05-01T00:00:00Z', updatedAt: '2024-05-01T00:00:00Z' },
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          const stringValue = String(value ?? '');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  const reportTypes: { id: ReportType; label: string }[] = [
    { id: 'crop-progress', label: 'Crop Progress & Activities' },
    { id: 'harvests', label: 'Harvests & Yield' },
    { id: 'input-requests', label: 'Input Requests & Stock' },
    { id: 'payments', label: 'Payments & Balances' },
    { id: 'expenses-sales', label: 'Expenses & Sales' },
    { id: 'problems', label: 'Unresolved Problems' },
  ];

  const renderReport = () => {
    switch (reportType) {
      case 'crop-progress':
        return (
          <Table
            columns={[
              { key: 'fieldName', header: 'Field' },
              { key: 'cropTypeName', header: 'Crop', render: (row: CropSeason) => `${row.cropTypeName} - ${row.cropVarietyName}` },
              { key: 'seasonName', header: 'Season' },
              { key: 'plantingMethod', header: 'Method', render: (row: CropSeason) => row.plantingMethod.replace('_', ' ') },
              { key: 'plantingDate', header: 'Planting', render: (row: CropSeason) => format(parseISO(row.plantingDate), 'MMM dd, yyyy') },
              { key: 'plantedAreaHectares', header: 'Area (ha)', render: (row: CropSeason) => row.plantedAreaHectares.toFixed(2) },
              { key: 'estimatedHarvestDate', header: 'Est. Harvest', render: (row: CropSeason) => format(parseISO(row.estimatedHarvestDate), 'MMM dd, yyyy') },
              { key: 'status', header: 'Status', render: (row: CropSeason) => <StatusBadge status={row.status} /> },
            ]}
            data={cropSeasons}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No crop season data."
          />
        );

      case 'harvests':
        return (
          <Table
            columns={[
              { key: 'harvestPlotName', header: 'Plot' },
              { key: 'harvestDate', header: 'Date', render: (row: HarvestEntry) => format(parseISO(row.harvestDate), 'MMM dd, yyyy') },
              { key: 'quantityKg', header: 'Quantity (kg)', render: (row: HarvestEntry) => row.quantityKg.toLocaleString() },
              { key: 'moistureContentPercent', header: 'Moisture %', render: (row: HarvestEntry) => row.moistureContentPercent ? `${row.moistureContentPercent}%` : '-' },
              { key: 'qualityGrade', header: 'Grade', render: (row: HarvestEntry) => <Badge variant="success">{row.qualityGrade?.replace('_', ' ')}</Badge> },
              { key: 'recordedByName', header: 'Recorded By' },
            ]}
            data={harvests}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No harvest data."
          />
        );

      case 'input-requests':
        return (
          <Table
            columns={[
              { key: 'requestNumber', header: 'Request #' },
              { key: 'farmerName', header: 'Farmer' },
              { key: 'cropSeasonName', header: 'Crop Season' },
              { key: 'totalAmount', header: 'Total', render: (row: InputRequest) => `RWF ${row.totalAmount.toLocaleString()}` },
              { key: 'status', header: 'Status', render: (row: InputRequest) => <StatusBadge status={row.status} /> },
              { key: 'submittedAt', header: 'Submitted', render: (row: InputRequest) => row.submittedAt ? format(parseISO(row.submittedAt), 'MMM dd, yyyy') : '-' },
            ]}
            data={requests}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No input request data."
          />
        );

      case 'payments':
        return (
          <Table
            columns={[
              { key: 'orderNumber', header: 'Order #' },
              { key: 'farmerName', header: 'Farmer' },
              { key: 'method', header: 'Method', render: (row: PaymentAttempt) => row.method === 'MOBILE_MONEY' ? 'MTN Mobile Money' : 'Bank Transfer' },
              { key: 'amount', header: 'Amount', render: (row: PaymentAttempt) => `RWF ${row.amount.toLocaleString()}` },
              { key: 'status', header: 'Status', render: (row: PaymentAttempt) => <StatusBadge status={row.status} /> },
              { key: 'initiatedAt', header: 'Date', render: (row: PaymentAttempt) => format(parseISO(row.initiatedAt), 'MMM dd, yyyy') },
            ]}
            data={payments}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No payment data."
          />
        );

      case 'expenses-sales': {
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card variant="default" padding="md">
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-xl font-bold text-red-600">RWF {totalExpenses.toLocaleString()}</p>
              </Card>
              <Card variant="default" padding="md">
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-xl font-bold text-green-700">RWF {totalSales.toLocaleString()}</p>
              </Card>
              <Card variant="default" padding="md">
                <p className="text-sm text-gray-500">Cash Balance</p>
                <p className="text-xl font-bold text-blue-600">RWF {(totalSales - totalExpenses).toLocaleString()}</p>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card variant="default" padding="md">
                <CardHeader title="Expenses by Category" />
                <CardBody>
                  <Bar
                    data={{
                      labels: expenses.map((e) => e.category.replace('_', ' ')),
                      datasets: [{ label: 'Expenses (RWF)', data: expenses.map((e) => e.amount), backgroundColor: '#dc2626' }],
                    }}
                    options={{ responsive: true, plugins: { legend: { display: false } } }}
                  />
                </CardBody>
              </Card>
              <Card variant="default" padding="md">
                <CardHeader title="Sales by Buyer" />
                <CardBody>
                  <Bar
                    data={{
                      labels: sales.map((s) => s.buyerName),
                      datasets: [{ label: 'Sales (RWF)', data: sales.map((s) => s.totalAmount), backgroundColor: '#16a34a' }],
                    }}
                    options={{ responsive: true, plugins: { legend: { display: false } } }}
                  />
                </CardBody>
              </Card>
            </div>
            <Table
              columns={[
                { key: 'category', header: 'Category', render: (row: Expense) => row.category.replace('_', ' ') },
                { key: 'description', header: 'Description' },
                { key: 'amount', header: 'Amount (RWF)', render: (row: Expense) => row.amount.toLocaleString() },
                { key: 'expenseDate', header: 'Date', render: (row: Expense) => format(parseISO(row.expenseDate), 'MMM dd, yyyy') },
              ]}
              data={expenses}
              keyExtractor={(row) => row.id}
              isLoading={isLoading}
              emptyMessage="No expense data."
            />
          </div>
        );
      }

      case 'problems':
        return (
          <Table
            columns={[
              { key: 'problemType', header: 'Type', render: (row: CropProblem) => <Badge variant="danger">{row.problemType}</Badge> },
              { key: 'severity', header: 'Severity', render: (row: CropProblem) => <Badge variant={row.severity === 'CRITICAL' ? 'danger' : row.severity === 'HIGH' ? 'warning' : 'info'}>{row.severity}</Badge> },
              { key: 'reportedDate', header: 'Reported', render: (row: CropProblem) => format(parseISO(row.reportedDate), 'MMM dd, yyyy') },
              { key: 'description', header: 'Description' },
              { key: 'status', header: 'Status', render: (row: CropProblem) => <StatusBadge status={row.status} /> },
              { key: 'reportedByName', header: 'Reported By' },
            ]}
            data={problems.filter((p) => p.status !== 'RESOLVED')}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No unresolved problems."
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Administrator Portal Identity Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#312e81] text-white p-6 sm:p-7 shadow-xl border border-indigo-700/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-400/20 text-indigo-200 border border-indigo-400/30 mb-2">
              🏛️ Administrator Portal • System Intelligence & Analytics
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              Reports & Agricultural Analytics
            </h1>
            <p className="text-indigo-100/80 text-sm mt-1 max-w-xl">
              Generate comprehensive reports filtered by farmer, field, crop variety, seasonal cycles, and audit transactions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={printReport} className="border-indigo-400/30 text-indigo-100 hover:bg-white/10 hover:text-white font-bold text-xs">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Button>
            <Button
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-md border-0"
              onClick={() => {
                const data = reportType === 'crop-progress' ? cropSeasons as unknown as Record<string, unknown>[] :
                  reportType === 'harvests' ? harvests as unknown as Record<string, unknown>[] :
                  reportType === 'input-requests' ? requests as unknown as Record<string, unknown>[] :
                  reportType === 'payments' ? payments as unknown as Record<string, unknown>[] :
                  reportType === 'expenses-sales' ? expenses as unknown as Record<string, unknown>[] :
                  problems as unknown as Record<string, unknown>[];
                exportCSV(data, `agritrack-${reportType}`);
              }}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <Card variant="default" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            options={reportTypes.map((t) => ({ value: t.id, label: t.label }))}
          />
          <Select
            label="Farmer"
            value={filters.farmerId}
            onChange={(e) => setFilters((prev) => ({ ...prev, farmerId: e.target.value }))}
            options={[{ value: '', label: 'All Farmers' }, ...farmers.map((f) => ({ value: f.id, label: f.name }))]}
          />
          <Input
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <Input
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
          />
          <Select
            label="Crop Type"
            value={filters.cropTypeId}
            onChange={(e) => setFilters((prev) => ({ ...prev, cropTypeId: e.target.value }))}
            options={[{ value: '', label: 'All Crops' }, { value: '1', label: 'Rice' }, { value: '2', label: 'Maize' }]}
          />
          <Select
            label="Season"
            value={filters.seasonId}
            onChange={(e) => setFilters((prev) => ({ ...prev, seasonId: e.target.value }))}
            options={[{ value: '', label: 'All Seasons' }, { value: '1', label: '🌧️ Long rainy season' }, { value: '2', label: '☀️ Long dry season' }, { value: '3', label: '🌦️ Short rainy season' }, { value: '4', label: '☀️ Short dry season' }]}
          />
        </div>
      </Card>

      <Card variant="default" padding="none">
        <CardHeader title={reportTypes.find((t) => t.id === reportType)?.label || 'Report'} subtitle="Filtered report results" />
        <CardBody>
          {renderReport()}
        </CardBody>
      </Card>
    </div>
  );
}