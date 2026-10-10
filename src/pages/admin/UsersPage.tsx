import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Table, type Column } from '../../components/common/Table';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import type { User, UserRole } from '../../types';

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const [form, setForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'FARMER' as UserRole,
    phoneNumber: '',
    password: '',
    assignedOfficerId: '',
  });

  const [officers, setOfficers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setUsers([
        { id: '1', username: 'admin', email: 'admin@agritrack.rw', firstName: 'System', lastName: 'Administrator', role: 'ADMIN', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', username: 'officer1', email: 'officer1@agritrack.rw', firstName: 'Jean', lastName: 'Uwase', role: 'OFFICER', phoneNumber: '+250788123456', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '3', username: 'farmer1', email: 'farmer1@agritrack.rw', firstName: 'Paul', lastName: 'Mukamana', role: 'FARMER', phoneNumber: '+250788234567', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
        { id: '4', username: 'farmer2', email: 'farmer2@agritrack.rw', firstName: 'Marie', lastName: 'Uwimana', role: 'FARMER', phoneNumber: '+250788345678', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
      ]);
      setOfficers(users.filter((u) => u.role === 'OFFICER'));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.firstName || !form.lastName || !form.password) return;

    const newUser: User = {
      id: String(users.length + 1),
      username: form.username,
      email: form.email,
      firstName: form.firstName,
      lastName: form.lastName,
      role: form.role,
      phoneNumber: form.phoneNumber,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setIsModalOpen(false);
    setForm({ username: '', email: '', firstName: '', lastName: '', role: 'FARMER', phoneNumber: '', password: '', assignedOfficerId: '' });
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = () => {
    if (deleteDialog.id) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteDialog.id));
    }
    setDeleteDialog({ open: false, id: null });
  };

  const columns: Column<User>[] = [
    { key: 'username', header: 'Username' },
    { key: 'firstName', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
    { key: 'email', header: 'Email' },
    { key: 'phoneNumber', header: 'Phone', render: (row) => row.phoneNumber || '-' },
    { key: 'role', header: 'Role', render: (row) => <Badge variant={row.role === 'ADMIN' ? 'danger' : row.role === 'OFFICER' ? 'primary' : 'success'}>{row.role}</Badge> },
    { key: 'isActive', header: 'Status', render: (row) => <Badge variant={row.isActive ? 'success' : 'secondary'}>{row.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'createdAt', header: 'Created', render: (row) => format(parseISO(row.createdAt), 'MMM dd, yyyy') },
    { key: 'actions', header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Link to={`/admin/users/${row.id}`} className="text-green-700 hover:text-green-800 text-sm font-medium">Edit</Link>
        {row.id !== currentUser?.id && (
          <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      {/* Administrator Portal Identity Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#312e81] text-white p-6 sm:p-7 shadow-xl border border-indigo-700/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-400/20 text-indigo-200 border border-indigo-400/30 mb-2">
              🏛️ Administrator Portal • System Governance & Control
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              User & Access Management
            </h1>
            <p className="text-indigo-100/80 text-sm mt-1 max-w-xl">
              Create, audit, and manage authorized farmers, agricultural officers, and administrator credentials.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
            className="w-full shrink-0 px-5 py-3 font-extrabold bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-950/30 sm:w-auto rounded-xl border-0"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Account
          </Button>
        </div>
      </div>

      <Card variant="default" padding="none" className="overflow-hidden border-slate-200 bg-white shadow-md">
        <CardHeader title="All Users" subtitle={`${users.length} user(s)`} />
        <CardBody>
          <Table
            columns={columns}
            data={users}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No users found."
            hoverable
          />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create User Account" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Username"
              required
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="e.g., farmer3"
            />
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
            />
            <Input
              label="First Name"
              required
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            />
            <Input
              label="Last Name"
              required
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            />
            <Select
              label="Role"
              required
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
              options={[
                { value: 'FARMER', label: 'Farmer' },
                { value: 'OFFICER', label: 'Agricultural Officer' },
              ]}
              hint="Only farmers and officers can be created here. Admins are managed separately."
            />
            <Input
              label="Phone Number"
              type="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="+250788123456"
            />
            <Input
              label="Temporary Password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              hint="User will be asked to change this on first login"
            />
            {form.role === 'FARMER' && (
              <Select
                label="Assign to Officer"
                value={form.assignedOfficerId}
                onChange={(e) => setForm((prev) => ({ ...prev, assignedOfficerId: e.target.value }))}
                options={officers.map((o) => ({ value: o.id, label: `${o.firstName} ${o.lastName}` }))}
                placeholder="Select an officer"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Account</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user account? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}