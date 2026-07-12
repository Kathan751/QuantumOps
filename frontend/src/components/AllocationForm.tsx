import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

interface Employee {
  id: number;
  name: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
}

interface AllocationFormProps {
  assetId: number;
  assetName: string;
  mode: 'checkout' | 'assign';
  onClose: () => void;
  onSuccess: () => void;
}

export const AllocationForm: React.FC<AllocationFormProps> = ({
  assetId,
  assetName,
  mode,
  onClose,
  onSuccess
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [assignType, setAssignType] = useState<'employee' | 'department'>('employee');
  const [targetEmployeeId, setTargetEmployeeId] = useState<number | ''>('');
  const [targetDepartmentId, setTargetDepartmentId] = useState<number | ''>('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (mode === 'assign') {
      const loadOptions = async () => {
        setLoading(true);
        try {
          const [empRes, deptRes] = await Promise.all([
            apiClient.get<Employee[]>('/employees'),
            apiClient.get<Department[]>('/departments')
          ]);
          setEmployees(empRes.data);
          setDepartments(deptRes.data);
        } catch (err) {
          setError('Failed to load employee/department listings');
        } finally {
          setLoading(false);
        }
      };
      loadOptions();
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formattedExpectedReturnDate = expectedReturnDate ? new Date(expectedReturnDate).toISOString() : null;

    try {
      if (mode === 'checkout') {
        await apiClient.post('/allocations/checkout', {
          assetId,
          expectedReturnDate: formattedExpectedReturnDate,
          notes: notes || null
        });
      } else {
        const payload: Record<string, any> = {
          assetId,
          expectedReturnDate: formattedExpectedReturnDate,
          notes: notes || null
        };
        if (assignType === 'employee') {
          if (!targetEmployeeId) {
            setError('Please select an employee');
            return;
          }
          payload.employeeId = Number(targetEmployeeId);
        } else {
          if (!targetDepartmentId) {
            setError('Please select a department');
            return;
          }
          payload.departmentId = Number(targetDepartmentId);
        }
        await apiClient.post('/allocations/assign', payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete allocation process');
    }
  };

  if (loading) {
    return (
      <div className="flex h-36 items-center justify-center bg-transparent">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-transparent text-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">
          {mode === 'checkout' ? 'Check Out Asset' : 'Assign Asset'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white font-bold text-xl cursor-pointer"
        >
          ×
        </button>
      </div>

      <div className="rounded-xl bg-purple-950/20 border border-purple-500/20 p-4">
        <span className="text-xs text-purple-400 block uppercase tracking-wider">Asset Item</span>
        <span className="text-sm font-semibold text-gray-200">{assetName}</span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'assign' && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Assignment Target</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="assignType"
                  checked={assignType === 'employee'}
                  onChange={() => setAssignType('employee')}
                  className="accent-purple-600 h-4 w-4 bg-gray-900 border-gray-800"
                />
                <span className="text-sm text-gray-300">Individual Employee</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="assignType"
                  checked={assignType === 'department'}
                  onChange={() => setAssignType('department')}
                  className="accent-purple-600 h-4 w-4 bg-gray-900 border-gray-800"
                />
                <span className="text-sm text-gray-300">Shared Department</span>
              </label>
            </div>

            {assignType === 'employee' ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mt-2">Target Employee</label>
                <select
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id} className="bg-gray-950">
                      {e.name} ({e.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mt-2">Target Department</label>
                <select
                  value={targetDepartmentId}
                  onChange={(e) => setTargetDepartmentId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-gray-950">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Expected Return Date</label>
          <input
            type="date"
            value={expectedReturnDate}
            onChange={(e) => setExpectedReturnDate(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Allocation Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any specific context or conditions regarding this assignment..."
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-purple-500 focus:bg-gray-900 transition resize-none"
          />
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-800/60">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-500 active:bg-purple-700 transition cursor-pointer"
          >
            {mode === 'checkout' ? 'Check Out' : 'Assign'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-800 bg-gray-900/40 py-3 font-semibold text-gray-400 hover:bg-gray-900 hover:text-gray-200 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
