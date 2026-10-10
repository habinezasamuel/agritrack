import { useEffect, useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Input';
import { Table, type Column } from '../../components/common/Table';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import type { Task, CropSeason } from '../../types';
import { clsx } from 'clsx';
import { farmService } from '../../services/farmService';

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [seasons, setSeasons] = useState<CropSeason[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM' as Task['priority'],
    cropSeasonId: '',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const [tasksRes, seasonsRes] = await Promise.all([
        farmService.getTasks(),
        farmService.getCropSeasons(),
      ]);
      setTasks(tasksRes);
      setSeasons(seasonsRes);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueDate || !form.cropSeasonId) return;

    try {
      const created = await farmService.createTask({
        cropSeasonId: form.cropSeasonId,
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        priority: form.priority,
      });
      setTasks((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setForm({ title: '', description: '', dueDate: '', priority: 'MEDIUM', cropSeasonId: '' });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const toggleComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const completed = task.status !== 'COMPLETED';
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: completed ? 'COMPLETED' : 'PENDING',
              completedDate: completed ? new Date().toISOString().split('T')[0] : undefined,
            }
          : t
      )
    );
    try {
      const updated = await farmService.updateTask(id, { completed });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (error) {
      console.error('Failed to update task:', error);
      fetchTasks();
    }
  };

  const handleDelete = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    const id = deleteDialog.id;
    setDeleteDialog({ open: false, id: null });
    if (!id) return;
    try {
      await farmService.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    if (filter === 'overdue') {
      return task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && differenceInDays(parseISO(task.dueDate), new Date()) < 0;
    }
    return task.status === filter.toUpperCase() || (filter === 'pending' && task.status === 'IN_PROGRESS');
  });

  const columns: Column<Task>[] = [
    {
      key: 'completed',
      header: '',
      width: '40px',
      render: (row) => (
        <button
          onClick={() => toggleComplete(row.id)}
          className={clsx(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            row.status === 'COMPLETED'
              ? 'bg-green-600 border-green-600 text-white'
              : 'border-gray-300 hover:border-green-500'
          )}
          aria-label={row.status === 'COMPLETED' ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {row.status === 'COMPLETED' && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ),
    },
    {
      key: 'title',
      header: 'Task',
      render: (row) => (
        <div>
          <p className={clsx('font-medium', row.status === 'COMPLETED' && 'line-through text-gray-400')}>{row.title}</p>
          {row.description && <p className="text-sm text-gray-500 mt-0.5">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (row) => {
        const daysLeft = differenceInDays(parseISO(row.dueDate), new Date());
        const isOverdue = daysLeft < 0 && row.status !== 'COMPLETED';
        return (
          <span className={clsx('font-medium', isOverdue && 'text-red-600')}>
            {format(parseISO(row.dueDate), 'MMM dd, yyyy')}
            {isOverdue && <span className="block text-xs">({Math.abs(daysLeft)} days overdue)</span>}
            {!isOverdue && daysLeft <= 3 && row.status !== 'COMPLETED' && (
              <span className="block text-xs text-yellow-600">({daysLeft} days left)</span>
            )}
          </span>
        );
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <Badge variant={row.priority === 'HIGH' || row.priority === 'URGENT' ? 'danger' : row.priority === 'MEDIUM' ? 'warning' : 'info'}>
          {row.priority}
        </Badge>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">
            Delete
          </button>
        </div>
      ),
    },
  ];

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    overdue: tasks.filter((t) => t.status !== 'COMPLETED' && differenceInDays(parseISO(t.dueDate), new Date()) < 0).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500">Track your farming tasks and deadlines.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="default" padding="md">
          <p className="text-sm text-gray-500">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
        </Card>
        <Card variant="default" padding="md">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{taskStats.pending}</p>
        </Card>
        <Card variant="default" padding="md">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
        </Card>
        <Card variant="default" padding="md">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
        </Card>
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'completed', 'overdue'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
              filter === f
                ? 'bg-green-700 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <Card variant="default" padding="none">
        <CardHeader title="Tasks" subtitle={`${filteredTasks.length} task(s)`} />
        <CardBody>
          <Table
            columns={columns}
            data={filteredTasks}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No tasks found. Create a new task to get started."
            hoverable
          />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Task" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Task Title"
            required
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Apply fertilizer"
          />
          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the task..."
          />
          <Select
            label="Crop Season"
            required
            value={form.cropSeasonId}
            onChange={(e) => setForm((prev) => ({ ...prev, cropSeasonId: e.target.value }))}
            options={seasons.map((s) => ({ value: s.id, label: `${s.cropTypeName} (${s.cropVarietyName}) - ${s.fieldName}` }))}
            placeholder="Select crop season"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
            <Select
              label="Priority"
              required
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as Task['priority'] }))}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}