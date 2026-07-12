import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface Department {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE';
  departmentId: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  department?: Department | null;
}

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user: currentUser } = useAuthStore();

  const fetchEmployeesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empsRes, deptsRes] = await Promise.all([
        apiClient.get<Employee[]>('/employees'),
        apiClient.get<Department[]>('/departments')
      ]);
      setEmployees(empsRes.data);
      setDepartments(deptsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch directory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesData();
  }, []);

  const handleRoleChange = async (id: number, newRole: Employee['role']) => {
    setError(null);
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;

    try {
      await apiClient.put(`/employees/${id}/promote`, {
        role: newRole,
        departmentId: emp.departmentId
      });
      fetchEmployeesData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update employee role');
    }
  };

  const handleDepartmentChange = async (id: number, newDeptId: number | null) => {
    setError(null);
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;

    try {
      await apiClient.put(`/employees/${id}/promote`, {
        role: emp.role,
        departmentId: newDeptId
      });
      fetchEmployeesData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update employee department');
    }
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white m-0">Employee Directory</h1>
        <p className="text-gray-400 text-sm mt-1">Manage staff roles, department assignments, and permissions</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden shadow-xl border border-gray-800/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800/80 bg-gray-950/20">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Email Address</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Assigned Department</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">System Role</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Account Status</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {employees.map((emp) => {
                const isSelf = emp.id === currentUser?.id;
                return (
                  <tr key={emp.id} className="hover:bg-gray-900/25 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-100">
                      {emp.name} {isSelf && <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 py-0.5 rounded ml-1.5 uppercase font-bold">You</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{emp.email}</td>
                    <td className="px-6 py-4 text-sm">
                      {isSelf ? (
                        <span className="text-gray-300">{emp.department?.name || 'Unassigned'}</span>
                      ) : (
                        <select
                          value={emp.departmentId || ''}
                          onChange={(e) => handleDepartmentChange(emp.id, e.target.value === '' ? null : Number(e.target.value))}
                          className="bg-transparent text-xs text-gray-300 outline-none border border-gray-800/60 rounded px-2 py-1 focus:border-purple-500 focus:bg-gray-950 transition cursor-pointer"
                        >
                          <option value="" className="bg-gray-950">Unassigned</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id} className="bg-gray-950">
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {isSelf ? (
                        <span className="text-purple-400 font-semibold uppercase text-xs tracking-wider">{emp.role}</span>
                      ) : (
                        <select
                          value={emp.role}
                          onChange={(e) => handleRoleChange(emp.id, e.target.value as Employee['role'])}
                          className="bg-transparent text-xs text-purple-400 font-semibold outline-none border border-gray-800/60 rounded px-2 py-1 focus:border-purple-500 focus:bg-gray-950 transition cursor-pointer"
                        >
                          <option value="EMPLOYEE" className="bg-gray-950">Employee</option>
                          <option value="DEPARTMENT_HEAD" className="bg-gray-950">Department Head</option>
                          <option value="ASSET_MANAGER" className="bg-gray-950">Asset Manager</option>
                          <option value="ADMIN" className="bg-gray-950">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${
                          emp.status === 'ACTIVE'
                            ? 'bg-green-950/50 border border-green-500/20 text-green-400'
                            : 'bg-red-950/50 border border-red-500/20 text-red-400'
                        }`}
                      >
                        {emp.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">
                      {new Date(emp.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
