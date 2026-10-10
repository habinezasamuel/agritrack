import { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Table, type Column } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import type { InputRequest, InputRequestItem, InputProduct, Field, CropSeason } from '../../types';
import { api } from '../../services/api';

type RequestStep = 1 | 2 | 3 | 4;

export function InputRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<InputRequest[]>([]);
  const [products, setProducts] = useState<InputProduct[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [seasons, setSeasons] = useState<CropSeason[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InputRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [requestStep, setRequestStep] = useState<RequestStep>(1);
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'BANK_TRANSFER'>('MOBILE_MONEY');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [nationalIdCard, setNationalIdCard] = useState<File | null>(null);
  const [farmerPhoto, setFarmerPhoto] = useState<File | null>(null);
  const [paymentFormError, setPaymentFormError] = useState('');
  const [paymentProof, setPaymentProof] = useState<{
    proofNumber: string;
    paidAt: string;
    amount: number;
    requestNumber: string;
    paymentMethod: 'MOBILE_MONEY' | 'BANK_TRANSFER';
    paymentPhoneNumber: string;
    bankName: string;
    bankAccountNumber: string;
    nationalIdNumber: string;
    idCardPhotoUrl: string;
    farmerPhotoUrl: string;
    status: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [form, setForm] = useState({
    fieldId: '',
    cropSeasonId: '',
    items: [] as { productId: string; quantity: string }[],
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!api.isMockMode()) {
        const [appsData, catalogData] = await Promise.all([
          api.get<{ applications: InputRequest[] }>('/agricultural-input-applications/'),
          api.get<{ fertilizers: InputProduct[]; seeds: InputProduct[] }>('/input-catalog/'),
        ]);
        const mapped: InputRequest[] = appsData.applications.map((app: any) => ({
          id: String(app.id),
          requestNumber: app.applicationNumber || app.application_number || `REQ-${app.id}`,
          farmerId: app.farmer?.id ? String(app.farmer.id) : String(app.farmer || ''),
          farmerName: app.farmer?.name || app.farmer_name || '',
          fieldId: app.field?.id ? String(app.field.id) : String(app.field || ''),
          fieldName: app.field?.name || app.field_name || '',
          cropSeasonId: '',
          cropSeasonName: app.crop || '',
          status: ((app.status || 'SUBMITTED') as string).toUpperCase() as InputRequest['status'],
          items: [{
            id: String(app.id),
            requestId: String(app.id),
            productId: app.inputType === 'fertilizer' ? String(app.fertilizer?.id || '1') : String(app.seed?.id || '1'),
            productName: app.input || 'Agricultural Input',
            productCategory: (app.inputType || 'FERTILIZER').toUpperCase(),
            productVariety: '',
            requestedQuantity: Number(app.quantity || 1),
            approvedQuantity: Number(app.quantity || 1),
            unitPrice: Number(app.unitPrice || app.unit_price || 0),
            lineTotal: Number(app.totalAmount || app.total_amount || 0),
          }],
          subtotal: Number(app.totalAmount || app.total_amount || 0),
          taxAmount: 0,
          totalAmount: Number(app.totalAmount || app.total_amount || 0),
          currency: 'RWF',
          paymentStatus: (app.paymentStatus || app.payment_status || 'UNPAID').toUpperCase() as any,
          submittedAt: app.createdAt || app.created_at,
          reviewedAt: app.approvedAt || app.approved_at,
          reviewNotes: app.adminComments || app.admin_comments,
          createdAt: app.createdAt || app.created_at || new Date().toISOString(),
          updatedAt: app.updatedAt || app.updated_at || new Date().toISOString(),
        }));
        setRequests(mapped);
        const allProducts: InputProduct[] = [
          ...catalogData.fertilizers.map((f) => ({ ...f, category: 'FERTILIZER' as const, status: 'ACTIVE' as const, reservedQuantity: 0, packSize: 1, minOrderQuantity: 1, maxOrderQuantity: 1000 })),
          ...catalogData.seeds.map((s) => ({ ...s, category: 'SEED' as const, status: 'ACTIVE' as const, reservedQuantity: 0, packSize: 1, minOrderQuantity: 1, maxOrderQuantity: 1000 })),
        ];
        setProducts(allProducts);
        setFields([]);
        setSeasons([]);
        return;
      }
      setFields([
        { id: '1', farmId: '1', farmName: 'Ruhango Farm', name: 'Field A', code: 'FA-001', areaHectares: 2.5, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', farmId: '1', farmName: 'Ruhango Farm', name: 'Field B', code: 'FB-001', areaHectares: 1.8, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ]);
      setSeasons([
        { id: '1', fieldId: '1', fieldName: 'Field A', cropTypeId: '1', cropTypeName: 'Rice', cropVarietyId: '1', cropVarietyName: 'IR 52', seasonId: '1', seasonName: '🌧️ Long rainy season', plantingMethod: 'TRANSPLANTING', plantingDate: '2024-03-15', plantedAreaHectares: 2.5, expectedGrowingDurationDays: 120, estimatedHarvestDate: '2024-07-13', status: 'ACTIVE', createdAt: '2024-02-10T00:00:00Z', updatedAt: '2024-02-10T00:00:00Z' },
        { id: '2', fieldId: '2', fieldName: 'Field B', cropTypeId: '2', cropTypeName: 'Maize', cropVarietyId: '3', cropVarietyName: 'SC 627', seasonId: '1', seasonName: '🌧️ Long rainy season', plantingMethod: 'DIRECT_SEEDING', plantingDate: '2024-03-01', plantedAreaHectares: 1.8, expectedGrowingDurationDays: 110, estimatedHarvestDate: '2024-06-19', status: 'ACTIVE', createdAt: '2024-02-25T00:00:00Z', updatedAt: '2024-02-25T00:00:00Z' },
      ]);
      setProducts([
        { id: '1', name: 'Rice Seed IR 52', category: 'SEED', varietyOrDescription: 'IR 52 - High yield rice variety', packSize: 25, unit: 'KG', priceRwf: 800, stockQuantity: 500, reservedQuantity: 50, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'NPK 17-17-17', category: 'FERTILIZER', varietyOrDescription: 'Balanced NPK fertilizer', packSize: 50, unit: 'KG', priceRwf: 45000, stockQuantity: 200, reservedQuantity: 20, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '3', name: 'Urea', category: 'FERTILIZER', varietyOrDescription: '46% Nitrogen fertilizer', packSize: 50, unit: 'KG', priceRwf: 38000, stockQuantity: 150, reservedQuantity: 10, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '4', name: 'Maize Seed SC 627', category: 'SEED', varietyOrDescription: 'SC 627 - Hybrid maize', packSize: 25, unit: 'KG', priceRwf: 1200, stockQuantity: 300, reservedQuantity: 0, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ]);
      setRequests([
        {
          id: '1', requestNumber: 'REQ-2024-001', farmerId: user?.id || '', farmerName: user ? `${user.firstName} ${user.lastName}` : '', fieldId: '1', fieldName: 'Field A', cropSeasonId: '1', cropSeasonName: 'Rice IR 52 - 🌧️ Long rainy season', status: 'APPROVED',
          items: [
            { id: '1', requestId: '1', productId: '1', productName: 'Rice Seed IR 52', productCategory: 'SEED', productVariety: 'IR 52', requestedQuantity: 50, approvedQuantity: 50, unitPrice: 800, lineTotal: 40000 },
            { id: '2', requestId: '1', productId: '2', productName: 'NPK 17-17-17', productCategory: 'FERTILIZER', productVariety: 'NPK 17-17-17', requestedQuantity: 10, approvedQuantity: 10, unitPrice: 45000, lineTotal: 450000 },
          ],
          subtotal: 490000, taxAmount: 88200, totalAmount: 578200, currency: 'RWF', paymentStatus: 'UNPAID',
          submittedAt: '2024-05-01T00:00:00Z', reviewedAt: '2024-05-03T00:00:00Z', reviewedById: 'admin-1', reviewedByName: 'Admin User', reviewNotes: 'Approved - stock available',
          createdAt: '2024-05-01T00:00:00Z', updatedAt: '2024-05-03T00:00:00Z',
        },
        {
          id: '2', requestNumber: 'REQ-2024-002', farmerId: user?.id || '', farmerName: user ? `${user.firstName} ${user.lastName}` : '', fieldId: '2', fieldName: 'Field B', cropSeasonId: '2', cropSeasonName: 'Maize SC 627 - 🌧️ Long rainy season', status: 'UNDER_REVIEW',
          items: [
            { id: '3', requestId: '2', productId: '4', productName: 'Maize Seed SC 627', productCategory: 'SEED', productVariety: 'SC 627', requestedQuantity: 30, approvedQuantity: 0, unitPrice: 1200, lineTotal: 36000 },
          ],
          subtotal: 36000, taxAmount: 6480, totalAmount: 42480, currency: 'RWF',
          submittedAt: '2024-05-10T00:00:00Z',
          createdAt: '2024-05-10T00:00:00Z', updatedAt: '2024-05-10T00:00:00Z',
        },
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

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: '' }],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: 'productId' | 'quantity', value: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const calculateTotal = () => {
    return form.items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      const quantity = parseFloat(item.quantity) || 0;
      return total + (product ? product.priceRwf * quantity : 0);
    }, 0);
  };

  const openRequestForm = () => {
    setRequestStep(1);
    setPaymentMethod('MOBILE_MONEY');
    setPaymentReference('');
    setPaymentPhoneNumber('');
    setBankName('');
    setBankAccountNumber('');
    setNationalIdNumber('');
    setNationalIdCard(null);
    setFarmerPhoto(null);
    setPaymentFormError('');
    setPaymentProof(null);
    setForm({ fieldId: '', cropSeasonId: '', items: [] });
    setIsModalOpen(true);
  };

  const closeRequestForm = () => {
    if (paymentProof) {
      URL.revokeObjectURL(paymentProof.idCardPhotoUrl);
      URL.revokeObjectURL(paymentProof.farmerPhotoUrl);
    }
    setIsModalOpen(false);
    setRequestStep(1);
    setPaymentFormError('');
    setPaymentProof(null);
    setIsSubmitting(false);
    setIsPaying(false);
  };

  const continueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fieldId || !form.cropSeasonId || form.items.length === 0) return;
    const validItems = form.items.filter((item) => item.productId && parseFloat(item.quantity) > 0);
    if (validItems.length === 0) return;
    setRequestStep(2);
    setPaymentFormError('');
  };

  const _handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = form.items.filter((item) => item.productId && parseFloat(item.quantity) > 0);
    if (!form.fieldId || !form.cropSeasonId || validItems.length === 0) return;
    if (!nationalIdNumber.trim() || !nationalIdCard || !farmerPhoto) {
      setPaymentFormError('Complete the national ID number, national ID card photo, and your live farmer photo before continuing.');
      return;
    }
    if (paymentMethod === 'MOBILE_MONEY' && !paymentPhoneNumber.trim()) {
      setPaymentFormError('Enter the Mobile Money number you will use for this payment.');
      return;
    }
    if (paymentMethod === 'BANK_TRANSFER' && (!bankName.trim() || !bankAccountNumber.trim())) {
      setPaymentFormError('Enter your bank name and bank account number for bank transfer.');
      return;
    }
    if (paymentMethod === 'BANK_TRANSFER' && !paymentReference.trim()) {
      setPaymentFormError('Enter the bank transaction reference to submit your payment.');
      return;
    }

    setIsSubmitting(true);
    setPaymentFormError('');
    try {
      if (api.isMockMode()) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const requestItems: InputRequestItem[] = validItems.map((item, index) => {
          const product = products.find((p) => p.id === item.productId);
          const quantity = parseFloat(item.quantity);
          return {
            id: String(index + 1),
            requestId: String(requests.length + 1),
            productId: item.productId,
            productName: product?.name,
            productCategory: product?.category,
            productVariety: product?.varietyOrDescription,
            requestedQuantity: quantity,
            approvedQuantity: quantity,
            unitPrice: product?.priceRwf || 0,
            lineTotal: (product?.priceRwf || 0) * quantity,
          };
        });
        const subtotal = requestItems.reduce((sum, item) => sum + item.lineTotal, 0);
        const taxAmount = subtotal * 0.18;
        const totalAmount = subtotal + taxAmount;
        const newRequest: InputRequest = {
          id: String(Date.now()),
          requestNumber: `REQ-2024-${String(requests.length + 1).padStart(3, '0')}`,
          farmerId: user?.id || '',
          farmerName: user ? `${user.firstName} ${user.lastName}` : '',
          fieldId: form.fieldId,
          fieldName: fields.find((f) => f.id === form.fieldId)?.name,
          cropSeasonId: form.cropSeasonId,
          cropSeasonName: seasons.find((s) => s.id === form.cropSeasonId)?.cropTypeName,
          status: 'PENDING_REVIEW',
          items: requestItems,
          subtotal,
          taxAmount,
          totalAmount,
          currency: 'RWF',
          paymentStatus: 'UNPAID',
          submittedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setRequests((prev) => [newRequest, ...prev]);
        setRequestStep(3);
      } else {
        const payload: Record<string, unknown> = {
          fieldId: form.fieldId,
          inputType: validItems[0].productId ? (products.find((p) => p.id === validItems[0].productId)?.category === 'SEED' ? 'seed' : 'fertilizer') : 'fertilizer',
          inputId: validItems[0].productId,
          quantity: parseFloat(validItems[0].quantity),
          crop: '',
          purpose: '',
          notes: `Payment method: ${paymentMethod}. Phone: ${paymentPhoneNumber}. Bank: ${bankName}. ID: ${nationalIdNumber}`,
        };
        const response = await api.post<{ application: InputRequest }>('/agricultural-input-applications/', payload);
        setRequests((prev) => [response.application, ...prev]);
        setRequestStep(3);
      }
    } catch (error) {
      setPaymentFormError(error instanceof Error ? error.message : 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  void _handleSubmit;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    const isManual = paymentMethod === 'BANK_TRANSFER';
    if (isManual && !paymentReference.trim()) {
      setPaymentFormError('Enter the transaction reference for your bank transfer.');
      return;
    }
    setIsPaying(true);
    setPaymentFormError('');
    try {
      if (api.isMockMode()) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const paidAt = new Date().toISOString();
        setPaymentProof({
          proofNumber: `PAY-${selectedRequest.requestNumber}`,
          paidAt,
          amount: selectedRequest.totalAmount,
          requestNumber: selectedRequest.requestNumber,
          paymentMethod,
          paymentPhoneNumber,
          bankName,
          bankAccountNumber,
          nationalIdNumber,
          idCardPhotoUrl: nationalIdCard ? URL.createObjectURL(nationalIdCard) : '',
          farmerPhotoUrl: farmerPhoto ? URL.createObjectURL(farmerPhoto) : '',
          status: 'PENDING_VERIFICATION',
        });
        setRequests((prev) => prev.map((r) => r.id === selectedRequest.id ? { ...r, paymentStatus: 'PENDING_VERIFICATION' } : r));
      } else {
        const payload: Record<string, unknown> = {
          method: paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'Bank Transfer',
          reference: paymentReference || `REF-${Date.now()}`,
          isSandbox: true,
          providerTransactionId: `TXN-${Date.now()}`,
          providerReference: `REF-${Date.now()}`,
        };
        const response = await api.post<{ application: InputRequest }>(`/agricultural-input-applications/${selectedRequest.id}/pay/`, payload);
        setRequests((prev) => prev.map((r) => r.id === selectedRequest.id ? response.application : r));
        setPaymentProof({
          proofNumber: (response.application as any).applicationNumber || (response.application as any).requestNumber || selectedRequest.requestNumber,
          paidAt: new Date().toISOString(),
          amount: response.application.totalAmount,
          requestNumber: selectedRequest.requestNumber,
          paymentMethod,
          paymentPhoneNumber,
          bankName,
          bankAccountNumber,
          nationalIdNumber,
          idCardPhotoUrl: nationalIdCard ? URL.createObjectURL(nationalIdCard) : '',
          farmerPhotoUrl: farmerPhoto ? URL.createObjectURL(farmerPhoto) : '',
          status: response.application.paymentStatus?.toUpperCase() || 'PAID',
        });
      }
      setRequestStep(4);
      setPaymentReference('');
      setPaymentPhoneNumber('');
      setBankName('');
      setBankAccountNumber('');
      setNationalIdNumber('');
      setNationalIdCard(null);
      setFarmerPhoto(null);
    } catch (error) {
      setPaymentFormError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  const viewRequest = (request: InputRequest) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
  };

  const openPaymentForRequest = (request: InputRequest) => {
    setSelectedRequest(request);
    setPaymentMethod('MOBILE_MONEY');
    setPaymentReference('');
    setPaymentPhoneNumber('');
    setBankName('');
    setBankAccountNumber('');
    setNationalIdNumber('');
    setNationalIdCard(null);
    setFarmerPhoto(null);
    setPaymentFormError('');
    setPaymentProof(null);
    setRequestStep(2);
    setIsModalOpen(true);
  };

  const columns: Column<InputRequest>[] = [
    { key: 'requestNumber', header: 'Request #', render: (row) => (
      <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
        {row.requestNumber}
      </span>
    )},
    { key: 'cropSeasonName', header: 'Crop / Input', render: (row) => (
      <span className="font-semibold text-slate-800">{row.cropSeasonName || 'General Season'}</span>
    )},
    { key: 'fieldName', header: 'Field', render: (row) => (
      <span className="text-slate-600 text-xs font-medium"><i className="bi bi-geo-alt text-emerald-600"></i> {row.fieldName}</span>
    )},
    { key: 'totalAmount', header: 'Total (RWF)', render: (row) => (
      <span className="font-bold text-slate-900">RWF {row.totalAmount.toLocaleString()}</span>
    )},
    { key: 'status', header: 'Status', render: (row) => (
      <div className="flex flex-col gap-1">
        <StatusBadge status={row.status} />
        {row.paymentStatus && row.paymentStatus !== 'UNPAID' && (
          <span className="text-xs text-slate-500">Payment: {row.paymentStatus.replace(/_/g, ' ')}</span>
        )}
      </div>
    )},
    { key: 'submittedAt', header: 'Submitted', render: (row) => (
      <span className="text-xs text-slate-500 font-mono">{row.submittedAt ? format(parseISO(row.submittedAt), 'MMM dd, yyyy') : '-'}</span>
    )},
    { key: 'actions', header: 'Actions', render: (row) => (
      <div className="flex items-center gap-2">
        <button 
          onClick={() => viewRequest(row)} 
          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
        >
          <i className="bi bi-eye"></i> Details
        </button>
        {(row.status === 'APPROVED' && (!row.paymentStatus || row.paymentStatus === 'UNPAID' || row.paymentStatus === 'FAILED')) && (
          <button 
            onClick={() => openPaymentForRequest(row)} 
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
          >
            <i className="bi bi-cart"></i> Pay Now
          </button>
        )}
      </div>
    )},
  ];

  const totalRequestedValue = requests.reduce((sum, r) => sum + r.totalAmount, 0);
  void totalRequestedValue;
  const pendingRequests = requests.filter((r) => r.status === 'PENDING_REVIEW' || r.status === 'UNDER_REVIEW').length;
  const paidRequests = requests.filter((r) => r.paymentStatus === 'PAID').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2 backdrop-blur-xs">
            <i className="bi bi-box-seam-fill"></i> Agricultural Inputs
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Input Requests & Subsidies</h1>
          <p className="text-emerald-100/80 text-sm mt-1">Order certified seeds, NPK/Urea fertilizers, and bio-pesticides for active crop seasons.</p>
        </div>
        <Button 
          variant="primary" 
          size="md"
          onClick={openRequestForm}
          leftIcon={<i className="bi bi-cart-plus-fill"></i>}
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold border-0 shadow-glow-primary"
        >
          New Input Request
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card-gradient">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Requisitions</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><i className="bi bi-card-checklist"></i></span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{requests.length}</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Registered Orders</span>
        </div>

        <div className="stat-card-gradient stat-card-amber">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Review</span>
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><i className="bi bi-clock-history"></i></span>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{pendingRequests}</p>
          <span className="text-xs text-amber-600 font-semibold mt-1 inline-block">Awaiting Officer Action</span>
        </div>

        <div className="stat-card-gradient stat-card-sky">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Orders</span>
            <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center"><i className="bi bi-wallet2"></i></span>
          </div>
          <p className="text-2xl font-black text-sky-700 mt-2">{paidRequests}</p>
          <span className="text-xs text-sky-600 font-semibold mt-1 inline-block">Payments Confirmed</span>
        </div>
      </div>

      <Card variant="glass" padding="none">
        <CardHeader 
          title="Input Requisition Log" 
          subtitle={`${requests.length} order(s) submitted`} 
          action={
            <span className="badge-modern badge-emerald">
              <i className="bi bi-bag-check-fill"></i> Ministry Approved Catalogs
            </span>
          }
        />
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={requests}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No input requests yet. Request seeds and fertilizer for your crops."
            hoverable
          />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeRequestForm} title={requestStep === 1 ? 'Apply for Seeds & Fertilizers' : requestStep === 2 ? (selectedRequest ? 'Make Payment' : 'Step 2: Payment Details') : requestStep === 3 ? 'Application Submitted' : 'Payment Confirmation'} size="xl">
        {requestStep === 1 ? (
        <form onSubmit={continueToPayment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Field"
              required
              value={form.fieldId}
              onChange={(e) => setForm((prev) => ({ ...prev, fieldId: e.target.value }))}
              options={fields.map((f) => ({ value: f.id, label: `${f.name} (${f.code})` }))}
              placeholder="Select a field"
            />
            <Select
              label="Crop Season"
              required
              value={form.cropSeasonId}
              onChange={(e) => setForm((prev) => ({ ...prev, cropSeasonId: e.target.value }))}
              options={seasons.map((s) => ({ value: s.id, label: `${s.cropTypeName} - ${s.cropVarietyName} (${s.seasonName})` }))}
              placeholder="Select a crop season"
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Choose seed and fertilizer</h3>
                <p className="text-xs text-slate-500 mt-1">Select one or more inputs for this crop season.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </Button>
            </div>

            {form.items.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No products added yet. Click "Add Product" to add items.</p>
            ) : (
              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Select
                        label="Product"
                        required
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        options={products.filter((p) => p.status === 'ACTIVE').map((p) => ({
                          value: p.id,
                          label: `${p.name} - RWF ${p.priceRwf.toLocaleString()}/${p.unit} (Stock: ${p.stockQuantity - p.reservedQuantity} ${p.unit})`,
                        }))}
                        placeholder="Select a product"
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                      />
                    </div>
                    <div className="w-32 pt-6">
                      <p className="text-sm font-medium text-gray-900">
                        {(() => {
                          const product = products.find((p) => p.id === item.productId);
                          const qty = parseFloat(item.quantity) || 0;
                          return product ? `RWF ${(product.priceRwf * qty).toLocaleString()}` : '-';
                        })()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="mt-6 p-2 text-red-600 hover:text-red-800"
                      aria-label="Remove item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">RWF {calculateTotal().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Tax (18%):</span>
              <span className="font-medium">RWF {(calculateTotal() * 0.18).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold mt-2 pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span className="text-green-700">RWF {(calculateTotal() * 1.18).toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Estimated total. Final prices confirmed upon admin approval.</p>
          </div>

          <CardFooter>
            <Button type="button" variant="ghost" onClick={closeRequestForm}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Continue to Payment'}</Button>
          </CardFooter>
        </form>
        ) : requestStep === 2 ? (
          <form onSubmit={handlePay} className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Order summary</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {form.items.filter((item) => item.productId && parseFloat(item.quantity) > 0).length} selected input(s)
                  </p>
                </div>
                <p className="text-xl font-black text-emerald-700">RWF {(calculateTotal() * 1.18).toLocaleString()}</p>
              </div>
              <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                {form.items.filter((item) => item.productId && parseFloat(item.quantity) > 0).map((item) => {
                  const product = products.find((productItem) => productItem.id === item.productId);
                  return (
                    <div key={item.productId} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{product?.name}</span>
                      <span className="text-slate-500">{item.quantity} {product?.unit}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-slate-900">Choose payment method</p>
              <p className="mb-3 text-xs text-slate-500">Select one method first. The form below will then ask only for the details needed for that payment method.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('MOBILE_MONEY');
                    setBankName('');
                    setBankAccountNumber('');
                    setPaymentReference('');
                  }}
                  className={`rounded-xl border-2 p-4 text-left transition ${paymentMethod === 'MOBILE_MONEY' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}
                >
                  <p className="font-bold text-slate-900">📱 Mobile Money {paymentMethod === 'MOBILE_MONEY' && <span className="ml-1 text-xs text-emerald-700">(Selected)</span>}</p>
                  <p className="mt-1 text-xs text-slate-500">Enter your Mobile Money number, then upload your ID and farmer photo.</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('BANK_TRANSFER');
                    setPaymentPhoneNumber('');
                  }}
                  className={`rounded-xl border-2 p-4 text-left transition ${paymentMethod === 'BANK_TRANSFER' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'}`}
                >
                  <p className="font-bold text-slate-900">🏦 Bank Transfer {paymentMethod === 'BANK_TRANSFER' && <span className="ml-1 text-xs text-emerald-700">(Selected)</span>}</p>
                  <p className="mt-1 text-xs text-slate-500">Enter your bank account and transaction reference, then upload your ID and farmer photo.</p>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div>
                <p className="font-bold text-slate-900">{paymentMethod === 'BANK_TRANSFER' ? 'Bank payment and identity details' : 'Mobile Money and identity details'}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {paymentMethod === 'BANK_TRANSFER'
                    ? 'Enter your bank account, upload your farmer photo, and upload a clear photo of your national identity card.'
                    : 'Enter the Mobile Money number, upload your farmer photo, and upload a clear photo of your national identity card.'}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {paymentMethod === 'MOBILE_MONEY' && (
                  <Input
                    label="Mobile Money number"
                    type="tel"
                    required
                    value={paymentPhoneNumber}
                    onChange={(e) => setPaymentPhoneNumber(e.target.value)}
                    placeholder="+250 7XX XXX XXX"
                    autoComplete="tel"
                  />
                )}
                {paymentMethod === 'BANK_TRANSFER' && (
                  <>
                    <Input
                      label="Bank name"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter your bank name"
                      autoComplete="organization"
                    />
                    <Input
                      label="Bank account number"
                      required
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Enter your bank account number"
                      autoComplete="off"
                    />
                  </>
                )}
                <Input
                  label="National ID number"
                  required
                  value={nationalIdNumber}
                  onChange={(e) => setNationalIdNumber(e.target.value)}
                  placeholder="Enter your national ID number"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="national-id-card" className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">
                  National identity card photo <span className="text-[var(--color-error)] ml-1" aria-hidden="true">*</span>
                </label>
                <input
                  id="national-id-card"
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setNationalIdCard(e.target.files?.[0] || null)}
                  className="block w-full rounded-xl border border-[var(--color-border-input)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-text)] file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-emerald-800"
                />
                <p className="mt-1 text-xs text-slate-500">Accepted: JPG, PNG, or WebP. Make sure your photo and ID details are readable.</p>
                {nationalIdCard && <p className="mt-1 text-xs font-medium text-emerald-700">Selected: {nationalIdCard.name}</p>}
              </div>
              <div>
                <label htmlFor="farmer-photo" className="block text-xs sm:text-sm font-semibold text-[var(--color-text)] mb-1.5">
                  Farmer photo <span className="text-[var(--color-error)] ml-1" aria-hidden="true">*</span>
                </label>
                <input
                  id="farmer-photo"
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp"
                  capture="user"
                  onChange={(e) => setFarmerPhoto(e.target.files?.[0] || null)}
                  className="block w-full rounded-xl border border-[var(--color-border-input)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-text)] file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-emerald-800"
                />
                <p className="mt-1 text-xs text-slate-500">Take or upload a clear photo of yourself for identity verification.</p>
                {farmerPhoto && <p className="mt-1 text-xs font-medium text-emerald-700">Selected: {farmerPhoto.name}</p>}
              </div>
            </div>

            {paymentMethod === 'MOBILE_MONEY' ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-bold">Mobile Money payment</p>
                <p className="mt-1">Your payment request will be sent to the Mobile Money number you entered above. Confirm the prompt on that phone.</p>
                <p className="mt-2 text-xs text-amber-700">Demo mode: no real money will be moved.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Bank transaction reference"
                  required
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter the reference from your bank"
                />
                <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                  Complete the bank transfer using the account details above, then enter the transaction reference before submitting. Your payment will be marked as "Pending Verification" until an admin confirms receipt.
                </p>
              </div>
            )}

            {paymentFormError && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
                {paymentFormError}
              </p>
            )}

            <CardFooter>
              <Button type="button" variant="ghost" onClick={() => setRequestStep(1)}>Back to input selection</Button>
              <Button type="submit" disabled={isPaying}>{isPaying ? 'Processing...' : `Pay RWF ${(calculateTotal() * 1.18).toLocaleString()}`}</Button>
            </CardFooter>
          </form>
        ) : requestStep === 3 ? (
          <div className="space-y-5">
            <div className="rounded-2xl border-2 border-emerald-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">AgriTrack</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-900">Application Submitted</h3>
                  <p className="mt-1 text-sm text-slate-500">Your input request has been submitted and is pending admin review.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div><p className="text-slate-500">Request number</p><p className="font-bold text-slate-900">{selectedRequest?.requestNumber || requests[0]?.requestNumber}</p></div>
                <div><p className="text-slate-500">Submitted on</p><p className="font-bold text-slate-900">{format(new Date(), 'MMM dd, yyyy HH:mm')}</p></div>
                <div><p className="text-slate-500">Status</p><p className="font-bold text-amber-700">Pending Review</p></div>
                <div><p className="text-slate-500">Estimated total</p><p className="font-bold text-slate-900">RWF {(calculateTotal() * 1.18).toLocaleString()}</p></div>
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-bold">What happens next?</p>
                <p className="mt-1">An admin will review your request, confirm availability, and set final prices. You will receive a notification when your request is approved and ready for payment.</p>
              </div>
            </div>
            <div className="flex flex-col justify-end gap-3 sm:flex-row">
              <Button type="button" variant="outline" onClick={closeRequestForm}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {paymentProof && (
              <div className="rounded-2xl border-2 border-emerald-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-dashed border-slate-300 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">AgriTrack payment receipt</p>
                    <h3 className="mt-1 text-2xl font-black text-slate-900">Payment Submitted</h3>
                    <p className="mt-1 text-sm text-slate-500">Keep this proof for collection and future verification.</p>
                  </div>
                  {paymentProof.farmerPhotoUrl && <img src={paymentProof.farmerPhotoUrl} alt="Farmer photo" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div><p className="text-slate-500">Proof number</p><p className="font-bold text-slate-900">{paymentProof.proofNumber}</p></div>
                  <div><p className="text-slate-500">Payment date</p><p className="font-bold text-slate-900">{format(parseISO(paymentProof.paidAt), 'MMM dd, yyyy HH:mm')}</p></div>
                  <div><p className="text-slate-500">Request number</p><p className="font-bold text-slate-900">{paymentProof.requestNumber}</p></div>
                  <div><p className="text-slate-500">Amount paid</p><p className="font-bold text-emerald-700">RWF {paymentProof.amount.toLocaleString()}</p></div>
                  <div><p className="text-slate-500">Payment method</p><p className="font-bold text-slate-900">{paymentProof.paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'Bank Transfer'}</p></div>
                  <div><p className="text-slate-500">Status</p><p className="font-bold text-amber-700">{paymentProof.status}</p></div>
                  {paymentProof.paymentMethod === 'MOBILE_MONEY' && <div><p className="text-slate-500">Mobile Money number</p><p className="font-bold text-slate-900">{paymentProof.paymentPhoneNumber}</p></div>}
                  {paymentProof.paymentMethod === 'BANK_TRANSFER' && <div><p className="text-slate-500">Bank account</p><p className="font-bold text-slate-900">{paymentProof.bankName} · {paymentProof.bankAccountNumber}</p></div>}
                  <div><p className="text-slate-500">National ID</p><p className="font-bold text-slate-900">{paymentProof.nationalIdNumber}</p></div>
                </div>
                <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-bold">Payment is pending verification</p>
                  <p className="mt-1">Your payment has been submitted and is awaiting verification by an admin. You will be notified once it is confirmed.</p>
                </div>
              </div>
            )}
            <div className="flex flex-col justify-end gap-3 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => window.print()}>
                <i className="bi bi-printer mr-2"></i> Print / Save as PDF
              </Button>
              <Button type="button" onClick={closeRequestForm}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Request ${selectedRequest?.requestNumber}`} size="lg">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={selectedRequest.status} />
                {selectedRequest.paymentStatus && selectedRequest.paymentStatus !== 'UNPAID' && (
                  <p className="text-xs text-slate-500 mt-1">Payment: {selectedRequest.paymentStatus.replace(/_/g, ' ')}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-green-700">RWF {selectedRequest.totalAmount.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
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
              <div>
                <p className="text-gray-500">Reviewed</p>
                <p className="font-medium">{selectedRequest.reviewedAt ? format(parseISO(selectedRequest.reviewedAt), 'MMM dd, yyyy') : 'Pending'}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
              <Table
                columns={[
                  { key: 'productName', header: 'Product' },
                  { key: 'requestedQuantity', header: 'Requested', render: (row: InputRequestItem) => `${row.requestedQuantity} ${row.productCategory === 'SEED' ? 'kg' : 'bags'}` },
                  { key: 'approvedQuantity', header: 'Approved', render: (row: InputRequestItem) => `${row.approvedQuantity} ${row.productCategory === 'SEED' ? 'kg' : 'bags'}` },
                  { key: 'unitPrice', header: 'Unit Price', render: (row: InputRequestItem) => `RWF ${row.unitPrice.toLocaleString()}` },
                  { key: 'lineTotal', header: 'Total', render: (row: InputRequestItem) => `RWF ${row.lineTotal.toLocaleString()}` },
                ]}
                data={selectedRequest.items}
                keyExtractor={(row) => row.id}
                hoverable={false}
              />
            </div>

            {selectedRequest.reviewNotes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">Review Notes</p>
                <p className="text-sm text-blue-700 mt-1">{selectedRequest.reviewNotes}</p>
                {selectedRequest.rejectionReason && (
                  <p className="text-sm text-red-700 mt-2">Reason: {selectedRequest.rejectionReason}</p>
                )}
              </div>
            )}

            {selectedRequest.status === 'APPROVED' && (!selectedRequest.paymentStatus || selectedRequest.paymentStatus === 'UNPAID' || selectedRequest.paymentStatus === 'FAILED') && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-900">Payment Required</p>
                <p className="text-sm text-green-700 mt-1">
                  Please proceed to payment to confirm your order. Total: RWF {selectedRequest.totalAmount.toLocaleString()}
                </p>
                <Button className="mt-3" size="sm" onClick={() => { setIsDetailOpen(false); openPaymentForRequest(selectedRequest); }}>
                  Proceed to Payment
                </Button>
              </div>
            )}

            {selectedRequest.status === 'READY_FOR_COLLECTION' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-sm font-medium text-emerald-900">Ready for Collection</p>
                <p className="text-sm text-emerald-700 mt-1">Your items have been prepared and are ready for collection. Please bring your ID and this receipt.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}