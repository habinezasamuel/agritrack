import { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Input';
import { Table, type Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import type { AdminPayment, BankAccount } from '../../types';
import { api } from '../../services/api';

type PaymentStatusFilter = 'all' | 'pending_verification' | 'paid' | 'failed' | 'refunded';

export function AdminPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  void bankAccounts;
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ totalConfirmed: 0, totalPending: 0, totalFailed: 0, totalRefunded: 0, netCollections: 0, count: 0 });
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [farmerFilter, setFarmerFilter] = useState('');
  void setFarmerFilter;
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [verifyAction, setVerifyAction] = useState<'paid' | 'failed' | 'refunded'>('paid');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState('ready_for_collection');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!api.isMockMode()) {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);
        if (farmerFilter) params.append('farmerId', farmerFilter);
        if (dateFrom) params.append('startDate', dateFrom);
        if (dateTo) params.append('endDate', dateTo);
        const data = await api.get<{ payments: AdminPayment[]; summary: any }>(`/admin/payments/?${params.toString()}`);
        setPayments(data.payments);
        setSummary(data.summary);
        setBankAccounts([
          { id: '1', bankName: 'Bank of Kigali', accountName: 'AgriTrack Rwanda Ltd', accountNumber: '0012345678901', branch: 'Kigali Main', isActive: true, isDefault: true, displayOrder: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
          { id: '2', bankName: 'Equity Bank Rwanda', accountName: 'AgriTrack Rwanda Ltd', accountNumber: '0098765432101', branch: 'Kigali Branch', isActive: true, isDefault: false, displayOrder: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        ]);
        return;
      }
      const mockPayments: AdminPayment[] = [
        { id: '1', orderId: '1', orderNumber: 'ORD-2024-001', farmerId: '3', farmerName: 'Paul Mukamana', farmerPhone: '+250 788 123 456', method: 'BANK_TRANSFER', amount: 578200, currency: 'RWF', status: 'PENDING_VERIFICATION', farmerReference: 'BK-2024-001', proofFile: 'proof1.jpg', initiatedAt: '2024-05-10T00:00:00Z', createdAt: '2024-05-10T00:00:00Z', updatedAt: '2024-05-10T00:00:00Z', applicationId: '1', applicationNumber: 'AGI-20240510120000-3', inputType: 'fertilizer', crop: 'Rice', quantity: 10, unit: 'KG', unitPrice: 45000, totalAmount: 578200, fieldName: 'Field A', farmName: 'Ruhango Farm', isSandbox: false, auditLogs: [], receiptNumber: undefined, receiptIssuedAt: undefined, verifiedAt: undefined, verifiedByName: undefined },
        { id: '2', orderId: '2', orderNumber: 'ORD-2024-002', farmerId: '3', farmerName: 'Paul Mukamana', farmerPhone: '+250 788 123 456', method: 'MOBILE_MONEY', amount: 224200, currency: 'RWF', status: 'PAID', providerTransactionId: 'MTN-2024-001', providerReference: 'TXN-123456', initiatedAt: '2024-05-05T00:00:00Z', confirmedAt: '2024-05-05T00:00:00Z', createdAt: '2024-05-05T00:00:00Z', updatedAt: '2024-05-05T00:00:00Z', applicationId: '2', applicationNumber: 'AGI-20240505120000-3', inputType: 'fertilizer', crop: 'Maize', quantity: 5, unit: 'KG', unitPrice: 38000, totalAmount: 224200, fieldName: 'Field B', farmName: 'Ruhango Farm', isSandbox: false, verifiedAt: '2024-05-05T00:00:00Z', verifiedByName: 'System Administrator', auditLogs: [], receiptNumber: 'RCT-AGI-20240505120000-3', receiptIssuedAt: '2024-05-05T00:00:00Z' },
        { id: '3', orderId: '3', orderNumber: 'ORD-2024-003', farmerId: '4', farmerName: 'Marie Uwimana', farmerPhone: '+250 788 987 654', method: 'BANK_TRANSFER', amount: 42480, currency: 'RWF', status: 'PENDING_VERIFICATION', farmerReference: 'EQ-2024-001', proofFile: 'proof2.jpg', initiatedAt: '2024-05-11T00:00:00Z', createdAt: '2024-05-11T00:00:00Z', updatedAt: '2024-05-11T00:00:00Z', applicationId: '3', applicationNumber: 'AGI-20240511120000-4', inputType: 'seed', crop: 'Maize', quantity: 30, unit: 'KG', unitPrice: 1200, totalAmount: 42480, fieldName: 'Field A', farmName: 'Ruhango Farm', isSandbox: false, auditLogs: [], receiptNumber: undefined, receiptIssuedAt: undefined, verifiedAt: undefined, verifiedByName: undefined },
        { id: '4', orderId: '4', orderNumber: 'ORD-2024-004', farmerId: '3', farmerName: 'Paul Mukamana', farmerPhone: '+250 788 123 456', method: 'MOBILE_MONEY', amount: 100000, currency: 'RWF', status: 'FAILED', farmerReference: 'FAIL-REF', initiatedAt: '2024-05-08T00:00:00Z', createdAt: '2024-05-08T00:00:00Z', updatedAt: '2024-05-08T00:00:00Z', applicationId: '4', applicationNumber: 'AGI-20240508120000-3', inputType: 'seed', crop: 'Rice', quantity: 100, unit: 'KG', unitPrice: 800, totalAmount: 100000, fieldName: 'Field A', farmName: 'Ruhango Farm', isSandbox: false, auditLogs: [], receiptNumber: undefined, receiptIssuedAt: undefined, verifiedAt: undefined, verifiedByName: undefined },
      ];
      const filtered = mockPayments.filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter.toUpperCase()) return false;
        if (searchQuery && !(p.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) && !(p.applicationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) && !(p.farmerName || '').toLowerCase().includes(searchQuery.toLowerCase()) && !(p.farmerReference || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (farmerFilter && p.farmerId !== farmerFilter) return false;
        if (dateFrom && p.createdAt < dateFrom) return false;
        if (dateTo && p.createdAt > dateTo + 'T23:59:59') return false;
        return true;
      });
      setPayments(filtered);
      const totalConfirmed = filtered.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
      const totalPending = filtered.filter((p) => p.status === 'PENDING_VERIFICATION').reduce((sum, p) => sum + p.amount, 0);
      const totalFailed = filtered.filter((p) => p.status === 'FAILED').reduce((sum, p) => sum + p.amount, 0);
      const totalRefunded = filtered.filter((p) => p.status === 'REFUNDED').reduce((sum, p) => sum + p.amount, 0);
      setSummary({ totalConfirmed, totalPending, totalFailed, totalRefunded, netCollections: totalConfirmed - totalRefunded, count: filtered.length });
      setBankAccounts([
        { id: '1', bankName: 'Bank of Kigali', accountName: 'AgriTrack Rwanda Ltd', accountNumber: '0012345678901', branch: 'Kigali Main', isActive: true, isDefault: true, displayOrder: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', bankName: 'Equity Bank Rwanda', accountName: 'AgriTrack Rwanda Ltd', accountNumber: '0098765432101', branch: 'Kigali Branch', isActive: true, isDefault: false, displayOrder: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ]);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery, farmerFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const openDetail = (payment: AdminPayment) => {
    setSelectedPayment(payment);
    setIsDetailOpen(true);
    setActionError('');
    setActionSuccess('');
  };

  const openVerify = (payment: AdminPayment) => {
    setSelectedPayment(payment);
    setVerifyAction('paid');
    setVerifyNotes('');
    setActionError('');
    setIsVerifyOpen(true);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      setActionError('');
      if (api.isMockMode()) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const newStatus = (verifyAction === 'paid' ? 'PAID' : verifyAction === 'failed' ? 'FAILED' : 'REFUNDED') as any;
        setPayments((prev) => prev.map((p) => p.id === selectedPayment.id ? { ...p, status: newStatus, verifiedAt: new Date().toISOString(), verifiedByName: user ? `${user.firstName} ${user.lastName}` : 'Admin', ...(verifyAction === 'paid' ? { receiptNumber: `RCT-${selectedPayment.applicationNumber}`, receiptIssuedAt: new Date().toISOString() } : {}) } : p));
        setSummary((prev) => {
          const oldPaid = selectedPayment.status === 'PAID' ? selectedPayment.amount : 0;
          const oldPending = selectedPayment.status === 'PENDING_VERIFICATION' ? selectedPayment.amount : 0;
          const newPaid = verifyAction === 'paid' ? selectedPayment.amount : 0;
          const newPending = verifyAction === 'paid' ? 0 : ((verifyAction as string) === 'pending_verification' ? selectedPayment.amount : 0);
          return { ...prev, totalConfirmed: prev.totalConfirmed - oldPaid + newPaid, totalPending: prev.totalPending - oldPending + newPending, totalFailed: prev.totalFailed + (verifyAction === 'failed' ? selectedPayment.amount : 0), netCollections: prev.netCollections - oldPaid + newPaid };
        });
        setActionSuccess(`Payment ${verifyAction === 'paid' ? 'verified and confirmed' : verifyAction === 'failed' ? 'marked as failed' : 'refunded'} successfully.`);
      } else {
        await api.post(`/payments/${selectedPayment.id}/verify/`, { status: verifyAction, notes: verifyNotes });
        setActionSuccess(`Payment ${verifyAction === 'paid' ? 'verified and confirmed' : verifyAction === 'failed' ? 'marked as failed' : 'refunded'} successfully.`);
        fetchPayments();
      }
      setIsVerifyOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed. Please try again.');
    }
  };

  const openDelivery = (payment: AdminPayment) => {
    setSelectedPayment(payment);
    setDeliveryStatus('ready_for_collection');
    setDeliveryNotes('');
    setActionError('');
    setIsDeliveryOpen(true);
  };

  const handleDeliveryUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      setActionError('');
      if (api.isMockMode()) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setPayments((prev) => prev.map((p) => p.id === selectedPayment.id ? { ...p, status: deliveryStatus.toUpperCase() as any } : p));
        setActionSuccess(`Delivery status updated to "${deliveryStatus.replace(/_/g, ' ')}".`);
      } else {
        await api.post(`/agricultural-input-applications/${selectedPayment.applicationId}/delivery/`, { status: deliveryStatus, notes: deliveryNotes });
        setActionSuccess(`Delivery status updated to "${deliveryStatus.replace(/_/g, ' ')}".`);
        fetchPayments();
      }
      setIsDeliveryOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed. Please try again.');
    }
  };

  const openNotify = (payment: AdminPayment) => {
    setSelectedPayment(payment);
    setNotifyMessage('');
    setActionError('');
    setIsNotifyOpen(true);
  };

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      setActionError('');
      if (api.isMockMode()) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        setActionSuccess('Notification sent to farmer successfully.');
      } else {
        await api.post(`/admin/applications/${selectedPayment.applicationId}/notify/`, { notes: notifyMessage });
        setActionSuccess('Notification sent to farmer successfully.');
      }
      setIsNotifyOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to send notification.');
    }
  };

  const exportCSV = () => {
    const headers = ['Order #', 'Application #', 'Farmer', 'Input Type', 'Crop', 'Qty', 'Unit Price', 'Total', 'Method', 'Status', 'Date'];
    const rows = payments.map((p) => [
      p.orderNumber, p.applicationNumber, p.farmerName, p.inputType, p.crop, p.quantity, p.unitPrice, p.amount, p.method, p.status, format(parseISO(p.createdAt), 'yyyy-MM-dd'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<AdminPayment>[] = [
    { key: 'orderNumber', header: 'Order #', render: (row) => (
      <span className="font-mono text-xs font-bold text-slate-700">{row.orderNumber}</span>
    )},
    { key: 'applicationNumber', header: 'Application #', render: (row) => (
      <span className="font-mono text-xs text-slate-500">{row.applicationNumber}</span>
    )},
    { key: 'farmerName', header: 'Farmer', className: 'min-w-[150px] font-semibold' },
    { key: 'inputType', header: 'Input', render: (row) => (
      <span className="capitalize">{row.inputType} ({row.crop})</span>
    )},
    { key: 'amount', header: 'Amount (RWF)', render: (row) => (
      <span className="font-bold text-slate-900">RWF {row.amount.toLocaleString()}</span>
    )},
    { key: 'method', header: 'Method', render: (row) => (
      <Badge variant={row.method === 'MOBILE_MONEY' ? 'info' : 'secondary'}>
        {row.method === 'MOBILE_MONEY' ? 'MTN Mobile Money' : 'Bank Transfer'}
      </Badge>
    )},
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'createdAt', header: 'Date', render: (row) => format(parseISO(row.createdAt), 'MMM dd, yyyy') },
    { key: 'actions', header: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openDetail(row)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">
          <i className="bi bi-eye"></i> View
        </button>
        {row.status === 'PENDING_VERIFICATION' && (
          <button onClick={() => openVerify(row)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
            <i className="bi bi-check-circle"></i> Verify
          </button>
        )}
        {(row.status === 'PAID' || (row.status as string) === 'READY_FOR_COLLECTION') && (
          <button onClick={() => openDelivery(row)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200">
            <i className="bi bi-truck"></i> Delivery
          </button>
        )}
        <button onClick={() => openNotify(row)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200">
          <i className="bi bi-bell"></i> Notify
        </button>
      </div>
    )},
  ];

  const pendingCount = payments.filter((p) => p.status === 'PENDING_VERIFICATION').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Financial management</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Payments & Sales</h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">Track, verify, and manage all farmer payments and orders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} leftIcon={<i className="bi bi-download"></i>}>
            Export CSV
          </Button>
          {pendingCount > 0 && (
            <Badge variant="warning" size="lg">{pendingCount} pending verification</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmed Payments</p>
              <p className="text-xl font-black text-emerald-700 mt-1">RWF {summary.totalConfirmed.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg"><i className="bi bi-check-circle-fill"></i></div>
          </div>
        </Card>
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Verification</p>
              <p className="text-xl font-black text-amber-700 mt-1">RWF {summary.totalPending.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-lg"><i className="bi bi-clock-history"></i></div>
          </div>
        </Card>
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Failed Payments</p>
              <p className="text-xl font-black text-red-700 mt-1">RWF {summary.totalFailed.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-lg"><i className="bi bi-x-circle-fill"></i></div>
          </div>
        </Card>
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Collections</p>
              <p className="text-xl font-black text-slate-900 mt-1">RWF {summary.netCollections.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-lg"><i className="bi bi-wallet2"></i></div>
          </div>
        </Card>
      </div>

      <Card variant="default" padding="md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-600 mb-1">Search</label>
            <Input
              placeholder="Order #, app #, farmer name, transaction ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatusFilter)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">From</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">To</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card variant="default" padding="none">
        <CardHeader title={`All Payments (${payments.length})`} subtitle="View and manage all farmer payments" />
        <CardBody>
          <Table
            columns={columns}
            data={payments}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No payments found."
            hoverable
          />
        </CardBody>
      </Card>

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Payment ${selectedPayment?.orderNumber}`} size="lg">
        {selectedPayment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Farmer</p><p className="font-medium">{selectedPayment.farmerName}</p></div>
              <div><p className="text-gray-500">Phone</p><p className="font-medium">{selectedPayment.farmerPhone}</p></div>
              <div><p className="text-gray-500">Application #</p><p className="font-medium">{selectedPayment.applicationNumber}</p></div>
              <div><p className="text-gray-500">Order #</p><p className="font-medium">{selectedPayment.orderNumber}</p></div>
              <div><p className="text-gray-500">Input Type</p><p className="font-medium capitalize">{selectedPayment.inputType} ({selectedPayment.crop})</p></div>
              <div><p className="text-gray-500">Quantity</p><p className="font-medium">{selectedPayment.quantity} {selectedPayment.unit}</p></div>
              <div><p className="text-gray-500">Unit Price</p><p className="font-medium">RWF {selectedPayment.unitPrice.toLocaleString()}</p></div>
              <div><p className="text-gray-500">Total</p><p className="font-medium">RWF {selectedPayment.totalAmount.toLocaleString()}</p></div>
              <div><p className="text-gray-500">Payment Method</p><p className="font-medium">{selectedPayment.method === 'MOBILE_MONEY' ? 'MTN Mobile Money' : 'Bank Transfer'}</p></div>
              <div><p className="text-gray-500">Transaction Reference</p><p className="font-medium">{selectedPayment.providerTransactionId || selectedPayment.farmerReference || '-'}</p></div>
              <div><p className="text-gray-500">Status</p><p className="font-medium"><StatusBadge status={selectedPayment.status} /></p></div>
              <div><p className="text-gray-500">Date</p><p className="font-medium">{format(parseISO(selectedPayment.createdAt), 'MMM dd, yyyy HH:mm')}</p></div>
            </div>
            {(selectedPayment.proofPhoto || (selectedPayment as any).proofFile) && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Proof of Payment</p>
                <p className="text-sm text-gray-700">{selectedPayment.proofPhoto || (selectedPayment as any).proofFile}</p>
              </div>
            )}
            {selectedPayment.receiptNumber && (
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <p className="text-sm text-emerald-700">Receipt Number</p>
                <p className="text-sm font-bold text-emerald-900">{selectedPayment.receiptNumber}</p>
                {selectedPayment.receiptIssuedAt && <p className="text-xs text-emerald-600">Issued: {format(parseISO(selectedPayment.receiptIssuedAt), 'MMM dd, yyyy HH:mm')}</p>}
              </div>
            )}
            <div className="flex gap-2">
              {selectedPayment.status === 'PENDING_VERIFICATION' && (
                <Button size="sm" onClick={() => { setIsDetailOpen(false); openVerify(selectedPayment); }}>Verify Payment</Button>
              )}
              {(selectedPayment.status === 'PAID' || (selectedPayment.status as string) === 'READY_FOR_COLLECTION') && (
                <Button size="sm" variant="outline" onClick={() => { setIsDetailOpen(false); openDelivery(selectedPayment); }}>Update Delivery Status</Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => { setIsDetailOpen(false); openNotify(selectedPayment); }}>Notify Farmer</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isVerifyOpen} onClose={() => setIsVerifyOpen(false)} title={`Verify Payment ${selectedPayment?.orderNumber}`} size="md">
        {selectedPayment && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Farmer</p><p className="font-medium">{selectedPayment.farmerName}</p></div>
                <div><p className="text-gray-500">Order</p><p className="font-medium">{selectedPayment.orderNumber}</p></div>
                <div><p className="text-gray-500">Amount</p><p className="font-medium">RWF {selectedPayment.amount.toLocaleString()}</p></div>
                <div><p className="text-gray-500">Method</p><p className="font-medium">{selectedPayment.method === 'MOBILE_MONEY' ? 'MTN Mobile Money' : 'Bank Transfer'}</p></div>
                <div><p className="text-gray-500">Reference</p><p className="font-medium">{selectedPayment.providerTransactionId || selectedPayment.farmerReference || '-'}</p></div>
                <div><p className="text-gray-500">Current Status</p><p className="font-medium"><StatusBadge status={selectedPayment.status} /></p></div>
              </div>
              {(selectedPayment.proofPhoto || (selectedPayment as any).proofFile) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Proof of Payment</p>
                  <p className="text-sm text-gray-700">{selectedPayment.proofPhoto || (selectedPayment as any).proofFile}</p>
                  <p className="text-xs text-yellow-600 mt-1">Note: Uploaded proof does not confirm funds were received. Verify against your account.</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Verification Decision</label>
              <div className="grid grid-cols-3 gap-3">
                {(['paid', 'failed', 'refunded'] as const).map((action) => (
                  <button key={action} type="button" onClick={() => setVerifyAction(action)} className={`p-3 rounded-lg border-2 transition-colors ${verifyAction === action ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="font-medium capitalize text-slate-900">{action === 'paid' ? 'Confirm Payment' : action === 'failed' ? 'Mark Failed' : 'Refund'}</p>
                    <p className="text-xs text-slate-500">{action === 'paid' ? 'Funds received' : action === 'failed' ? 'Payment failed' : 'Process refund'}</p>
                  </button>
                ))}
              </div>
            </div>
            <Textarea label="Verification Notes" required rows={3} value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} placeholder="Describe how you verified this payment..." />
            {actionError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{actionError}</p>}
            {actionSuccess && <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200">{actionSuccess}</p>}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsVerifyOpen(false)}>Cancel</Button>
              <Button type="submit" variant={verifyAction === 'paid' ? 'success' : 'danger'}>
                {verifyAction === 'paid' ? 'Confirm Payment' : verifyAction === 'failed' ? 'Mark as Failed' : 'Process Refund'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isDeliveryOpen} onClose={() => setIsDeliveryOpen(false)} title={`Update Delivery Status ${selectedPayment?.orderNumber}`} size="md">
        {selectedPayment && (
          <form onSubmit={handleDeliveryUpdate} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium">Order: {selectedPayment.orderNumber}</p>
              <p className="text-sm text-gray-500">Farmer: {selectedPayment.farmerName}</p>
              <p className="text-sm text-gray-500">Items: {selectedPayment.inputType} x {selectedPayment.quantity} {selectedPayment.unit}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Delivery Status</label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'ready_for_collection', label: 'Ready for Collection', desc: 'Items are prepared and ready for the farmer to collect' },
                  { value: 'collected', label: 'Collected', desc: 'Farmer has collected the items' },
                  { value: 'delivered', label: 'Delivered', desc: 'Items have been delivered to the farmer' },
                  { value: 'cancelled', label: 'Cancelled', desc: 'Order has been cancelled' },
                ].map((option) => (
                  <button key={option.value} type="button" onClick={() => setDeliveryStatus(option.value)} className={`p-3 rounded-lg border-2 text-left transition-colors ${deliveryStatus === option.value ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className="font-medium text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-500">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <Textarea label="Notes for Farmer" rows={2} value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} placeholder="Add any instructions or details for the farmer..." />
            {actionError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{actionError}</p>}
            {actionSuccess && <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200">{actionSuccess}</p>}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDeliveryOpen(false)}>Cancel</Button>
              <Button type="submit">Update Status</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isNotifyOpen} onClose={() => setIsNotifyOpen(false)} title={`Send Update to Farmer`} size="md">
        {selectedPayment && (
          <form onSubmit={handleNotify} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium">Farmer: {selectedPayment.farmerName}</p>
              <p className="text-sm text-gray-500">Order: {selectedPayment.orderNumber}</p>
            </div>
            <Textarea label="Message to Farmer" required rows={4} value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} placeholder="Enter the update message for the farmer..." />
            {actionError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{actionError}</p>}
            {actionSuccess && <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200">{actionSuccess}</p>}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsNotifyOpen(false)}>Cancel</Button>
              <Button type="submit">Send Notification</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}