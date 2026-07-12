import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

interface Employee {
  id: number;
  name: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
  parentDepartmentId: number | null;
  departmentHeadId: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  departmentHead?: Employee | null;
  parentDepartment?: { id: number; name: string } | null;
  childDepartments?: { id: number; name: string }[];
  _count?: { employees: number };
}

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [parentDepartmentId, setParentDepartmentId] = useState<number | ''>('');
  const [departmentHeadId, setDepartmentHeadId] = useState<number | ''>('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptsRes, empsRes] = await Promise.all([
        apiClient.get<Department[]>('/departments'),
        apiClient.get<Employee[]>('/employees')
      ]);
      setDepartments(deptsRes.data);
      setEmployees(empsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load directory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const resetForm = () => {
    setName('');
    setParentDepartmentId('');
    setDepartmentHeadId('');
    setStatus('ACTIVE');
    setIsEditing(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      parentDepartmentId: parentDepartmentId === '' ? null : Number(parentDepartmentId),
      departmentHeadId: departmentHeadId === '' ? null : Number(departmentHeadId),
      status
    };

    try {
      if (isEditing && editId !== null) {
        await apiClient.put(`/departments/${editId}`, payload);
      } else {
        await apiClient.post('/departments', payload);
      }
      resetForm();
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save department');
    }
  };

  const handleEdit = (dept: Department) => {
    setIsEditing(true);
    setEditId(dept.id);
    setName(dept.name);
    setParentDepartmentId(dept.parentDepartmentId || '');
    setDepartmentHeadId(dept.departmentHeadId || '');
    setStatus(dept.status);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    setError(null);
    try {
      await apiClient.delete(`/departments/${id}`);
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete department');
    }
  };

  if (loading && departments.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white m-0">Departments</h1>
        <p className="text-gray-400 text-sm mt-1">Configure company structure and department heads</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Panel */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">
              {isEditing ? 'Edit Department' : 'Create Department'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. IT Department"
                  className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Parent Department</label>
                <select
                  value={parentDepartmentId}
                  onChange={(e) => setParentDepartmentId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
                >
                  <option value="">None (Top Level)</option>
                  {departments
                    .filter((d) => d.id !== editId)
                    .map((d) => (
                      <option key={d.id} value={d.id} className="bg-gray-950">
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Department Head</label>
                <select
                  value={departmentHeadId}
                  onChange={(e) => setDepartmentHeadId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
                >
                  <option value="">No Head Assigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-gray-950">
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
                >
                  <option value="ACTIVE" className="bg-gray-950">Active</option>
                  <option value="INACTIVE" className="bg-gray-950">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-purple-600 py-2.5 font-semibold text-white hover:bg-purple-500 active:bg-purple-700 transition text-sm cursor-pointer"
                >
                  {isEditing ? 'Save Changes' : 'Create'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 rounded-xl border border-gray-800 bg-gray-900/40 py-2.5 font-semibold text-gray-400 hover:bg-gray-900 hover:text-gray-200 transition text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Directory Panel */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl overflow-hidden shadow-xl border border-gray-800/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800/80 bg-gray-950/20">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Parent</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Manager / Head</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Staff Count</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-gray-900/25 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-100">{dept.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {dept.parentDepartment?.name || <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {dept.departmentHead ? (
                          <div>
                            <p className="text-gray-200 font-medium">{dept.departmentHead.name}</p>
                            <p className="text-xs text-gray-500">{dept.departmentHead.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-600">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{dept._count?.employees || 0}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${
                            dept.status === 'ACTIVE'
                              ? 'bg-green-950/50 border border-green-500/20 text-green-400'
                              : 'bg-red-950/50 border border-red-500/20 text-red-400'
                          }`}
                        >
                          {dept.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right space-x-2">
                        <button
                          onClick={() => handleEdit(dept)}
                          className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {departments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                        No departments registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
