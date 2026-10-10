import { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Table, type Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import type { InputRequest, PaymentAttempt, BankAccount, PaymentStatus, RequestStatus } from '../../types';
import { api } from '../../services/api';

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<InputRequest[]>([]);
  const [payments, setPayments] = useState<PaymentAttempt[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; order: InputRequest | null }>({ open: false, order: null });
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'BANK_TRANSFER'>('MOBILE_MONEY');
  const [bankReference, setBankReference] = useState('');
  const [proofFile, setProofFile] = useState<File[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState<{ proofNumber: string; amount: number; status: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!api.isMockMode()) {
        const [appsData] = await Promise.all([
          api.get<{ applications: any[] }>('/agricultural-input-applications/'),
        ]);
        const mappedOrders: InputRequest[] = appsData.applications.map((app) => ({
          id: String(app.id),
          requestNumber: app.applicationNumber,
          farmerId: app.farmer.id,
          farmerName: app.farmer.name,
          fieldId: app.field.id,
          fieldName: app.field.name,
          cropSeasonId: '',
          cropSeasonName: app.crop,
          status: app.status.toUpperCase() as InputRequest['status'],
          items: [{
            id: String(app.id),
            requestId: String(app.id),
            productId: app.inputType === 'fertilizer' ? String(app.fertilizer?.id || '') : String(app.seed?.id || ''),
            productName: app.input,
            productCategory: app.inputType.toUpperCase(),
            productVariety: '',
            requestedQuantity: app.quantity,
            approvedQuantity: app.quantity,
            unitPrice: app.unitPrice,
            lineTotal: app.totalAmount,
          }],
          subtotal: app.totalAmount,
          taxAmount: 0,
          totalAmount: app.totalAmount,
          currency: 'RWF',
          paymentStatus: (app.paymentStatus as any)?.toUpperCase(),
          submittedAt: app.createdAt,
          reviewedAt: app.approvedAt,
          reviewNotes: app.adminComments,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        }));
        setOrders(mappedOrders);
        setBankAccounts([
          { id: '1', bankName: 'Bank of Kigali', accountName: 'AgriTrack Rwanda Ltd', accountNumber: '0012345678901', branch: 'Kigali Main', isActive: true, isDefault: true, displayOrder: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
          { id: '2', bankName: 'Equity Bank Rwanda', accountName: 'AgriTrack Rwanda Ltd', accountNumber: '0098765432101', branch: 'Kigali Branch', isActive: true, isDefault: false, displayOrder: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        ]);
        return;
      }
      setOrders([
        {
          id: '1', requestNumber: 'ORD-2024-001', farmerId: user?.id || '', farmerName: user ? `${user.firstName} ${user.lastName}` : '', fieldId: '1', cropSeasonId: '1',
          status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID',
          items: [
            { id: '1', requestId: '1', productId: '1', productName: 'Rice Seed IR 52', productVariety: 'IR 52', unitPrice: 800, lineTotal: 40000, requestedQuantity: 50, approvedQuantity: 50, productCategory: 'SEED' },
            { id: '2', requestId: '1', productId: '2', productName: 'NPK 17-17-17', productVariety: 'NPK 17-17-17', unitPrice: 45000, lineTotal: 450000, requestedQuantity: 10, approvedQuantity: 10, productCategory: 'FERTILIZER' },
          ],
          subtotal: 490000, taxAmount: 88200, totalAmount: 578200, currency: 'RWF',
          createdAt: '2024-05-03T00:00:00Z', updatedAt: '2024-05-03T00:00:00Z',
        },
        {
          id: '2', requestNumber: 'ORD-2024-002', farmerId: user?.id || '', farmerName: user ? `${user.firstName} ${user.lastName}` : '', fieldId: '1', cropSeasonId: '1',
          status: 'READY_FOR_COLLECTION', paymentStatus: 'PAID',
          items: [
            { id: '3', requestId: '2', productId: '3', productName: 'Urea', productVariety: 'Urea 46%', unitPrice: 38000, lineTotal: 190000, requestedQuantity: 5, approvedQuantity: 5, productCategory: 'FERTILIZER' },
          ],
          subtotal: 190000, taxAmount: 34200, totalAmount: 224200, currency: 'RWF',
          createdAt: '2024-05-04T00:00:00Z', updatedAt: '2024-05-06T00:00:00Z',
        },
      ]);
      setPayments([
        { id: '1', orderId: '2', orderNumber: 'ORD-2024-002', farmerId: user?.id || '', method: 'MOBILE_MONEY', amount: 224200, currency: 'RWF', status: 'SUCCESS', providerTransactionId: 'MTN-2024-001', providerReference: 'TXN-123456', initiatedAt: '2024-05-05T00:00:00Z', confirmedAt: '2024-05-05T00:00:00Z', createdAt: '2024-05-05T00:00:00Z', updatedAt: '2024-05-05T00:00:00Z' },
      ]);
      setBankAccounts([
        { id: '1', bankName: 'Bank of Kigali', accountName: 'AgriTrack Rwanda Ltd', accountNumber: '0012345678901', branch: 'Kigali Main', isActive: true, isDefault: true, displayOrder: 1, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', bankName: 'Equity Bank Rwanda', accountName: 'AgriTrack Rwanda Ltd', accountNumber: '0098765432101', branch: 'Kigali Branch', isActive: true, isDefault: false, displayOrder: 2, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openPayment = (order: InputRequest) => {
    setPaymentModal({ open: true, order });
    setPaymentMethod('MOBILE_MONEY');
    setBankReference('');
    setProofFile([]);
    setPaymentError('');
    setPaymentSuccess(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal.order) return;
    const isManual = paymentMethod === 'BANK_TRANSFER';
    if (isManual && !bankReference.trim()) {
      setPaymentError('Enter the transaction reference for your bank transfer.');
      return;
    }
    setIsPaying(true);
    setPaymentError('');
    try {
      if (api.isMockMode()) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const paidAt = new Date().toISOString();
        const status: PaymentStatus = isManual ? 'PENDING_VERIFICATION' : 'PAID';
        const newPayment: PaymentAttempt = {
          id: String(Date.now()),
          orderId: paymentModal.order.id,
          orderNumber: paymentModal.order.requestNumber,
          farmerId: user?.id || '',
          method: paymentMethod,
          amount: paymentModal.order.totalAmount,
          currency: 'RWF',
          status: isManual ? 'PENDING_VERIFICATION' : 'SUCCESS',
          farmerReference: isManual ? bankReference : undefined,
          proofPhoto: proofFile.length > 0 ? proofFile[0].name : undefined,
          initiatedAt: paidAt,
          confirmedAt: isManual ? undefined : paidAt,
          createdAt: paidAt,
          updatedAt: paidAt,
        };
        setPayments((prev) => [newPayment, ...prev]);
        setOrders((prev) => prev.map((o) => o.id === paymentModal.order?.id ? { ...o, paymentStatus: status, status: (isManual ? 'PENDING_PAYMENT' : 'PAYMENT_CONFIRMED') as RequestStatus } : o));
        setPaymentSuccess({ proofNumber: `PAY-${paymentModal.order.requestNumber}`, amount: paymentModal.order.totalAmount, status });
      } else {
        const payload: Record<string, unknown> = {
          method: paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'Bank Transfer',
          reference: bankReference || `REF-${Date.now()}`,
          isSandbox: true,
          providerTransactionId: `TXN-${Date.now()}`,
          providerReference: `REF-${Date.now()}`,
        };
        const response = await api.post<{ application: any }>(`/agricultural-input-applications/${paymentModal.order.id}/pay/`, payload);
        const status = response.application.paymentStatus?.toUpperCase() || 'PAID';
        setOrders((prev) => prev.map((o) => o.id === paymentModal.order?.id ? { ...o, paymentStatus: status, status: response.application.status?.toUpperCase() || 'PAYMENT_CONFIRMED' } : o));
        setPaymentSuccess({ proofNumber: response.application.applicationNumber, amount: response.application.totalAmount, status });
      }
      setPaymentModal({ open: false, order: null });
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    if (paymentStatus === 'PENDING_VERIFICATION') return <StatusBadge status="UNDER_REVIEW" />;
    if (paymentStatus === 'PAID') return <Badge variant="success" dot>Paid</Badge>;
    if (paymentStatus === 'FAILED') return <Badge variant="danger" dot>Failed</Badge>;
    if (paymentStatus === 'REFUNDED') return <Badge variant="secondary" dot>Refunded</Badge>;
    return <StatusBadge status={status} />;
  };

  const orderColumns: Column<InputRequest>[] = [
    { key: 'requestNumber', header: 'Order #' },
    { key: 'cropSeasonName', header: 'Items', render: (row) => (
      <span className="font-semibold text-slate-800">{row.items.map(i => i.productName).join(', ')}</span>
    )},
    { key: 'totalAmount', header: 'Total', render: (row) => `RWF ${row.totalAmount.toLocaleString()}` },
    { key: 'status', header: 'Status', render: (row) => getStatusBadge(row.status, row.paymentStatus) },
    { key: 'createdAt', header: 'Date', render: (row) => format(parseISO(row.createdAt), 'MMM dd, yyyy') },
    { key: 'actions', header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        {(row.status === 'APPROVED' && (!row.paymentStatus || row.paymentStatus === 'UNPAID' || row.paymentStatus === 'FAILED')) && (
          <Button size="sm" onClick={() => openPayment(row)}>Pay Now</Button>
        )}
        {row.status === 'READY_FOR_COLLECTION' && (
          <Badge variant="success" dot>Ready for Collection</Badge>
        )}
        {row.status === 'PAYMENT_CONFIRMED' && (
          <Badge variant="info" dot>Being Prepared</Badge>
        )}
      </div>
    )},
  ];

  const paymentColumns: Column<PaymentAttempt>[] = [
    { key: 'orderNumber', header: 'Order #' },
    { key: 'method', header: 'Method', render: (row) => (
      <Badge variant={row.method === 'MOBILE_MONEY' ? 'info' : 'secondary'}>
        {row.method === 'MOBILE_MONEY' ? 'MTN Mobile Money' : 'Bank Transfer'}
      </Badge>
    )},
    { key: 'amount', header: 'Amount', render: (row) => `RWF ${row.amount.toLocaleString()}` },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'providerTransactionId', header: 'Transaction ID', render: (row) => row.providerTransactionId || '-' },
    { key: 'initiatedAt', header: 'Date', render: (row) => format(parseISO(row.initiatedAt), 'MMM dd, yyyy HH:mm') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders & Payments</h1>
          <p className="text-gray-500">Track your input orders and payment history.</p>
        </div>
      </div>

      <Card variant="default" padding="none">
        <CardHeader title="My Orders" subtitle={`${orders.length} order(s)`} />
        <CardBody>
          <Table
            columns={orderColumns}
            data={orders}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No orders yet. Submit an input request to create an order."
            hoverable
          />
        </CardBody>
      </Card>

      <Card variant="default" padding="none">
        <CardHeader title="Payment History" subtitle={`${payments.length} payment(s)`} />
        <CardBody>
          <Table
            columns={paymentColumns}
            data={payments}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No payments yet."
            hoverable
          />
        </CardBody>
      </Card>

      <Modal isOpen={paymentModal.open} onClose={() => { setPaymentModal({ open: false, order: null }); setPaymentError(''); setPaymentSuccess(null); }} title="Make Payment" size="lg">
        {paymentModal.order && !paymentSuccess && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Order {paymentModal.order.requestNumber}</p>
                  <p className="text-sm text-gray-500">{paymentModal.order.items.length} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-green-700">RWF {paymentModal.order.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOBILE_MONEY')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'MOBILE_MONEY'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📱</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">MTN Mobile Money</p>
                      <p className="text-xs text-gray-500">Pay with your MTN MoMo account</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">🏦</span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Bank Transfer</p>
                      <p className="text-xs text-gray-500">Transfer from your bank account</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {paymentMethod === 'MOBILE_MONEY' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-900">MTN Mobile Money Payment</p>
                <p className="text-sm text-yellow-700 mt-1">
                  You will receive a payment request on your registered mobile number. Enter your MTN MoMo PIN to authorize the payment.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  <strong>Demo Mode:</strong> No real money will be moved. This is a simulation for testing purposes.
                </p>
              </div>
            )}

            {paymentMethod === 'BANK_TRANSFER' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Bank Account Details</p>
                  {bankAccounts.filter((b) => b.isActive).map((bank) => (
                    <div key={bank.id} className="text-sm text-blue-800">
                      <p><strong>{bank.bankName}</strong></p>
                      <p>Account Name: {bank.accountName}</p>
                      <p>Account Number: {bank.accountNumber}</p>
                      <p>Branch: {bank.branch}</p>
                      <p className="mt-1">Reference: <strong>{paymentModal.order?.requestNumber}</strong></p>
                    </div>
                  ))}
                </div>
                <Input
                  label="Bank Transaction Reference"
                  required
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  placeholder="Enter transaction reference from your bank"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Payment (optional)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setProofFile(Array.from(e.target.files || []))}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload a screenshot or receipt (will be marked as "Pending Verification")</p>
                </div>
              </div>
            )}

            {paymentError && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
                {paymentError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => { setPaymentModal({ open: false, order: null }); setPaymentError(''); }}>Cancel</Button>
              <Button type="submit" disabled={isPaying}>
                {isPaying ? 'Processing...' : paymentMethod === 'MOBILE_MONEY' ? 'Initiate Payment' : 'Submit Transfer Details'}
              </Button>
            </div>
          </form>
        )}
        {paymentSuccess && (
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-5">
              <h3 className="text-xl font-black text-slate-900">Payment Submitted</h3>
              <p className="text-sm text-slate-600 mt-1">Proof number: {paymentSuccess.proofNumber}</p>
              <p className="text-sm text-slate-600">Amount: RWF {paymentSuccess.amount.toLocaleString()}</p>
              <p className="text-sm text-slate-600">Status: {paymentSuccess.status.replace(/_/g, ' ')}</p>
              {paymentSuccess.status === 'PENDING_VERIFICATION' && (
                <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-bold">Pending Verification</p>
                  <p className="mt-1">Your payment is awaiting admin verification. You will be notified once it is confirmed.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => { setPaymentModal({ open: false, order: null }); setPaymentSuccess(null); }}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}