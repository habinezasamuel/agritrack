import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Table, type Column } from '../../components/common/Table';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import type { InputProduct, StockMovement } from '../../types';

export function AdminProductsPage() {
  const [products, setProducts] = useState<InputProduct[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const [form, setForm] = useState({
    name: '',
    category: 'SEED' as 'SEED' | 'FERTILIZER',
    varietyOrDescription: '',
    packSize: '',
    unit: 'KG' as InputProduct['unit'],
    priceRwf: '',
    stockQuantity: '',
    minOrderQuantity: '',
    maxOrderQuantity: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setProducts([
        { id: '1', name: 'Rice Seed IR 52', category: 'SEED', varietyOrDescription: 'IR 52 - High yield rice variety', packSize: 25, unit: 'KG', priceRwf: 800, stockQuantity: 500, reservedQuantity: 50, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'NPK 17-17-17', category: 'FERTILIZER', varietyOrDescription: 'Balanced NPK fertilizer', packSize: 50, unit: 'KG', priceRwf: 45000, stockQuantity: 200, reservedQuantity: 20, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '3', name: 'Urea', category: 'FERTILIZER', varietyOrDescription: '46% Nitrogen fertilizer', packSize: 50, unit: 'KG', priceRwf: 38000, stockQuantity: 150, reservedQuantity: 10, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '4', name: 'Maize Seed SC 627', category: 'SEED', varietyOrDescription: 'SC 627 - Hybrid maize', packSize: 25, unit: 'KG', priceRwf: 1200, stockQuantity: 300, reservedQuantity: 0, status: 'ACTIVE', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ]);
      setMovements([
        { id: '1', productId: '1', productName: 'Rice Seed IR 52', type: 'IN', quantity: 500, referenceType: 'PURCHASE', notes: 'Initial stock', performedById: '1', performedByName: 'System Administrator', createdAt: '2024-01-01T00:00:00Z' },
        { id: '2', productId: '1', productName: 'Rice Seed IR 52', type: 'RESERVATION', quantity: 50, referenceType: 'ORDER', referenceId: '1', notes: 'Reserved for ORD-2024-001', performedById: '1', performedByName: 'System Administrator', createdAt: '2024-05-03T00:00:00Z' },
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.priceRwf) return;

    const newProduct: InputProduct = {
      id: String(products.length + 1),
      name: form.name,
      category: form.category,
      varietyOrDescription: form.varietyOrDescription,
      packSize: parseFloat(form.packSize) || 1,
      unit: form.unit,
      priceRwf: parseFloat(form.priceRwf),
      stockQuantity: parseFloat(form.stockQuantity) || 0,
      reservedQuantity: 0,
      status: 'ACTIVE',
      minOrderQuantity: form.minOrderQuantity ? parseFloat(form.minOrderQuantity) : undefined,
      maxOrderQuantity: form.maxOrderQuantity ? parseFloat(form.maxOrderQuantity) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [...prev, newProduct]);
    setIsModalOpen(false);
    setForm({ name: '', category: 'SEED', varietyOrDescription: '', packSize: '', unit: 'KG', priceRwf: '', stockQuantity: '', minOrderQuantity: '', maxOrderQuantity: '' });
  };

  const toggleStatus = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'ACTIVE' ? 'UNAVAILABLE' : 'ACTIVE', updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = () => {
    if (deleteDialog.id) {
      setProducts((prev) => prev.filter((p) => p.id !== deleteDialog.id));
    }
    setDeleteDialog({ open: false, id: null });
  };

  const columns: Column<InputProduct>[] = [
    { key: 'name', header: 'Product' },
    { key: 'category', header: 'Category', render: (row) => <Badge variant={row.category === 'SEED' ? 'success' : 'info'}>{row.category}</Badge> },
    { key: 'varietyOrDescription', header: 'Description' },
    { key: 'packSize', header: 'Pack Size', render: (row) => `${row.packSize} ${row.unit}` },
    { key: 'priceRwf', header: 'Price (RWF)', render: (row) => row.priceRwf.toLocaleString() },
    { key: 'stockQuantity', header: 'Stock', render: (row) => (
      <div>
        <p className="font-medium">{row.stockQuantity} {row.unit}</p>
        <p className="text-xs text-gray-500">{row.reservedQuantity} reserved</p>
      </div>
    )},
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'actions', header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <button onClick={() => toggleStatus(row.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        </button>
        <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
      </div>
    )},
  ];

  const movementColumns: Column<StockMovement>[] = [
    { key: 'productName', header: 'Product' },
    { key: 'type', header: 'Type', render: (row) => (
      <Badge variant={row.type === 'IN' ? 'success' : row.type === 'OUT' ? 'danger' : row.type === 'RESERVATION' ? 'warning' : 'info'}>
        {row.type}
      </Badge>
    )},
    { key: 'quantity', header: 'Quantity' },
    { key: 'referenceType', header: 'Reference', render: (row) => `${row.referenceType}${row.referenceId ? `: ${row.referenceId}` : ''}` },
    { key: 'notes', header: 'Notes' },
    { key: 'performedByName', header: 'Performed By' },
    { key: 'createdAt', header: 'Date', render: (row) => format(parseISO(row.createdAt), 'MMM dd, yyyy') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Catalogue</h1>
          <p className="text-gray-500">Manage seed and fertilizer products, prices, and stock.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Button>
      </div>

      <Card variant="default" padding="none">
        <CardHeader title="All Products" subtitle={`${products.length} product(s)`} />
        <CardBody>
          <Table
            columns={columns}
            data={products}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No products found."
            hoverable
          />
        </CardBody>
      </Card>

      <Card variant="default" padding="none">
        <CardHeader title="Stock Movements" subtitle={`${movements.length} movement(s)`} />
        <CardBody>
          <Table
            columns={movementColumns}
            data={movements}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No stock movements recorded."
            hoverable
          />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Rice Seed IR 52"
            />
            <Select
              label="Category"
              required
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as 'SEED' | 'FERTILIZER' }))}
              options={[
                { value: 'SEED', label: 'Seed' },
                { value: 'FERTILIZER', label: 'Fertilizer' },
              ]}
            />
            <Input
              label="Variety / Description"
              value={form.varietyOrDescription}
              onChange={(e) => setForm((prev) => ({ ...prev, varietyOrDescription: e.target.value }))}
              placeholder="e.g., IR 52 - High yield rice variety"
            />
            <Input
              label="Pack Size"
              type="number"
              min="0"
              step="0.01"
              value={form.packSize}
              onChange={(e) => setForm((prev) => ({ ...prev, packSize: e.target.value }))}
              placeholder="e.g., 25"
            />
            <Select
              label="Unit"
              value={form.unit}
              onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value as InputProduct['unit'] }))}
              options={[
                { value: 'KG', label: 'Kilogram (KG)' },
                { value: 'BAG', label: 'Bag' },
                { value: 'LITRE', label: 'Litre' },
                { value: 'TONNE', label: 'Tonne' },
              ]}
            />
            <Input
              label="Price (RWF)"
              type="number"
              min="0"
              required
              value={form.priceRwf}
              onChange={(e) => setForm((prev) => ({ ...prev, priceRwf: e.target.value }))}
              placeholder="e.g., 800"
            />
            <Input
              label="Initial Stock Quantity"
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
              placeholder="e.g., 500"
            />
            <Input
              label="Min Order Quantity (optional)"
              type="number"
              min="0"
              value={form.minOrderQuantity}
              onChange={(e) => setForm((prev) => ({ ...prev, minOrderQuantity: e.target.value }))}
            />
            <Input
              label="Max Order Quantity (optional)"
              type="number"
              min="0"
              value={form.maxOrderQuantity}
              onChange={(e) => setForm((prev) => ({ ...prev, maxOrderQuantity: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Product</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This will affect existing orders that reference it."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}