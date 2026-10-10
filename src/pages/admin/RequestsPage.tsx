import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Input';
import { Table, type Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import type { InputRequest, InputProduct } from '../../types';

export function AdminRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<InputRequest[]>([]);
  const [products, setProducts] = useState<InputProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<InputRequest | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvedQuantities, setApprovedQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setProducts([
        { id: '1', name: 'Rice Seed IR 52', category: 'SEED', varietyOrDescription: 'IR 52', packSize: 25, unit: 'KG', priceRwf: 800, stockQuantity: 500, reservedQuantity: 50, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'NPK 17-17-17', category: 'FERTILIZER', varietyOrDescription: 'NPK 17-17-17', packSize: 50, unit: 'KG', priceRwf: 45000, stockQuantity: 200, reservedQuantity: 20, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '3', name: 'Urea', category: 'FERTILIZER', varietyOrDescription: 'Urea 46%', packSize: 50, unit: 'KG', priceRwf: 38000, stockQuantity: 150, reservedQuantity: 10, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '4', name: 'Maize Seed SC 627', category: 'SEED', varietyOrDescription: 'SC 627', packSize: 25, unit: 'KG', priceRwf: 1200, stockQuantity: 300, reservedQuantity: 0, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ]);
      setRequests([
        {
          id: '1', requestNumber: 'REQ-2024-001', farmerId: '3', farmerName: 'Paul Mukamana', fieldId: '1', fieldName: 'Field A', cropSeasonId: '1', cropSeasonName: 'Rice IR 52 - 🌧️ Long rainy season', status: 'UNDER_REVIEW',
          items: [
            { id: '1', requestId: '1', productId: '1', productName: 'Rice Seed IR 52', productCategory: 'SEED', productVariety: 'IR 52', requestedQuantity: 50, approvedQuantity: 0, unitPrice: 800, lineTotal: 40000 },
            { id: '2', requestId: '1', productId: '2', productName: 'NPK 17-17-17', productCategory: 'FERTILIZER', productVariety: 'NPK 17-17-17', requestedQuantity: 10, approvedQuantity: 0, unitPrice: 45000, lineTotal: 450000 },
          ],
          subtotal: 490000, taxAmount: 88200, totalAmount: 578200, currency: 'RWF',
          submittedAt: '2024-05-10T00:00:00Z',
          createdAt: '2024-05-10T00:00:00Z', updatedAt: '2024-05-10T00:00:00Z',
        },
        {
          id: '2', requestNumber: 'REQ-2024-002', farmerId: '4', farmerName: 'Marie Uwimana', fieldId: '2', fieldName: 'Field B', cropSeasonId: '2', cropSeasonName: 'Maize SC 627 - 🌧️ Long rainy season', status: 'SUBMITTED',
          items: [
            { id: '3', requestId: '2', productId: '4', productName: 'Maize Seed SC 627', productCategory: 'SEED', productVariety: 'SC 627', requestedQuantity: 30, approvedQuantity: 0, unitPrice: 1200, lineTotal: 36000 },
          ],
          subtotal: 36000, taxAmount: 6480, totalAmount: 42480, currency: 'RWF',
          submittedAt: '2024-05-11T00:00:00Z',
          createdAt: '2024-05-11T00:00:00Z', updatedAt: '2024-05-11T00:00:00Z',
        },
        {
          id: '3', requestNumber: 'REQ-2024-003', farmerId: '3', farmerName: 'Paul Mukamana', fieldId: '1', fieldName: 'Field A', cropSeasonId: '1', cropSeasonName: 'Rice IR 52 - 🌧️ Long rainy season', status: 'APPROVED',
          items: [
            { id: '4', requestId: '3', productId: '3', productName: 'Urea', productCategory: 'FERTILIZER', productVariety: 'Urea 46%', requestedQuantity: 5, approvedQuantity: 5, unitPrice: 38000, lineTotal: 190000 },
          ],
          subtotal: 190000, taxAmount: 34200, totalAmount: 224200, currency: 'RWF',
          submittedAt: '2024-05-04T00:00:00Z', reviewedAt: '2024-05-05T00:00:00Z', reviewedById: '1', reviewedByName: 'System Administrator', reviewNotes: 'Stock available, approved',
          createdAt: '2024-05-04T00:00:00Z', updatedAt: '2024-05-05T00:00:00Z',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openReview = (request: InputRequest) => {
    setSelectedRequest(request);
    setReviewAction('APPROVED');
    setReviewNotes('');
    setRejectionReason('');
    const quantities: Record<string, number> = {};
    request.items.forEach((item) => {
      quantities[item.id] = item.requestedQuantity;
    });
    setApprovedQuantities(quantities);
    setIsReviewOpen(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const updatedItems = selectedRequest.items.map((item) => ({
      ...item,
      approvedQuantity: reviewAction === 'REJECTED' ? 0 : approvedQuantities[item.id] || 0,
    }));

    const approvedSubtotal = updatedItems.reduce((sum, item) => sum + item.lineTotal * (item.approvedQuantity / item.requestedQuantity), 0);
    const approvedTax = approvedSubtotal * 0.18;
    const approvedTotal = approvedSubtotal + approvedTax;

    setRequests((prev) =>
      prev.map((req) =>
        req.id === selectedRequest.id
          ? {
              ...req,
              status: reviewAction,
              items: updatedItems,
              subtotal: approvedSubtotal,
              taxAmount: approvedTax,
              totalAmount: approvedTotal,
              reviewedAt: new Date().toISOString(),
              reviewedById: user?.id,
              reviewedByName: user ? `${user.firstName} ${user.lastName}` : '',
              reviewNotes,
              rejectionReason: reviewAction === 'REJECTED' ? rejectionReason : undefined,
              updatedAt: new Date().toISOString(),
            }
          : req
      )
    );

    setIsReviewOpen(false);
    setSelectedRequest(null);
  };

  const columns: Column<InputRequest>[] = [
    { key: 'requestNumber', header: 'Request #', className: 'whitespace-nowrap font-mono text-xs font-bold text-emerald-800', width: '130px' },
    { key: 'farmerName', header: 'Farmer', className: 'min-w-[150px] font-semibold' },
    { key: 'cropSeasonName', header: 'Crop Season', className: 'min-w-[220px]' },
    { key: 'totalAmount', header: 'Total', className: 'whitespace-nowrap font-bold', render: (row) => `RWF ${row.totalAmount.toLocaleString()}` },
    { key: 'status', header: 'Status', className: 'whitespace-nowrap', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'submittedAt', header: 'Submitted', className: 'whitespace-nowrap text-sm', render: (row) => row.submittedAt ? format(parseISO(row.submittedAt), 'MMM dd, yyyy') : '-' },
    { key: 'actions', header: 'Actions', className: 'whitespace-nowrap', render: (row) => (
      <div className="flex items-center gap-2">
        {(row.status === 'SUBMITTED' || row.status === 'UNDER_REVIEW') && (
          <Button size="sm" onClick={() => openReview(row)}>Review</Button>
        )}
        {row.status === 'APPROVED' && <Badge variant="success" dot>Ready for Order</Badge>}
      </div>
    )},
  ];

  const pendingCount = requests.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Agricultural inputs</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Request Review</h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">Review and approve farmer input requests.</p>
        </div>
        <Badge variant="warning" size="lg" className="self-start sm:self-auto">{pendingCount} pending review</Badge>
      </div>

      <Card variant="default" padding="none">
        <CardHeader
          title="Pending & Recent Requests"
          subtitle={`${requests.length} request(s) • Review status and approve quantities`}
          className="mb-0 border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-6"
        />
        <CardBody className="p-4 sm:p-6">
          <Table
            columns={columns}
            data={requests}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No requests to review."
            hoverable
          />
        </CardBody>
      </Card>

      <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title={`Review Request ${selectedRequest?.requestNumber}`} size="lg">
        {selectedRequest && (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Farmer</p>
                  <p className="font-medium">{selectedRequest.farmerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Field</p>
                  <p className="font-medium">{selectedRequest.fieldName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Crop Season</p>
                  <p className="font-medium">{selectedRequest.cropSeasonName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Submitted</p>
                  <p className="font-medium">{selectedRequest.submittedAt ? format(parseISO(selectedRequest.submittedAt), 'MMM dd, yyyy') : '-'}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
              <div className="space-y-3">
                {selectedRequest.items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  const availableStock = product ? product.stockQuantity - product.reservedQuantity : 0;
                  const isOverStock = (approvedQuantities[item.id] || 0) > availableStock;

                  return (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-500">{item.productVariety}</p>
                          <p className="text-sm text-gray-500">
                            Requested: {item.requestedQuantity} {product?.unit || ''} | 
                            Available: {availableStock} {product?.unit || ''} | 
                            Price: RWF {item.unitPrice.toLocaleString()}/{product?.unit || ''}
                          </p>
                        </div>
                        <div className="w-32">
                          <Input
                            label="Approve Qty"
                            type="number"
                            min="0"
                            max={item.requestedQuantity}
                            value={approvedQuantities[item.id] || ''}
                            onChange={(e) => setApprovedQuantities((prev) => ({
                              ...prev,
                              [item.id]: parseFloat(e.target.value) || 0,
                            }))}
                            disabled={reviewAction === 'REJECTED'}
                          />
                          {isOverStock && (
                            <p className="text-xs text-red-600 mt-1">Exceeds available stock!</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction('APPROVED')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    reviewAction === 'APPROVED'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-green-700">Approve All</p>
                  <p className="text-xs text-gray-500">Full quantities</p>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('PARTIALLY_APPROVED')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    reviewAction === 'PARTIALLY_APPROVED'
                      ? 'border-yellow-600 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-yellow-700">Partial</p>
                  <p className="text-xs text-gray-500">Adjust quantities</p>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('REJECTED')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    reviewAction === 'REJECTED'
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-red-700">Reject</p>
                  <p className="text-xs text-gray-500">With reason</p>
                </button>
              </div>
            </div>

            {reviewAction === 'REJECTED' && (
              <Textarea
                label="Rejection Reason"
                required
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why the request is rejected..."
              />
            )}

            <Textarea
              label="Review Notes"
              rows={2}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add notes for the farmer..."
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
              <Button type="submit" variant={reviewAction === 'REJECTED' ? 'danger' : 'primary'}>
                {reviewAction === 'APPROVED' ? 'Approve Request' : reviewAction === 'PARTIALLY_APPROVED' ? 'Partially Approve' : 'Reject Request'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}