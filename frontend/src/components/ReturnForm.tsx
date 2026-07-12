import React, { useState } from 'react';
import apiClient from '../api/client';

interface ReturnFormProps {
  allocationId: number;
  assetName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnForm: React.FC<ReturnFormProps> = ({
  allocationId,
  assetName,
  onClose,
  onSuccess
}) => {
  const [conditionAtReturn, setConditionAtReturn] = useState('Good');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiClient.post(`/allocations/${allocationId}/return`, {
        conditionAtReturn,
        notes: notes || null
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete return process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-transparent text-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Return Asset</h3>
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
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Returned Condition</label>
          <select
            value={conditionAtReturn}
            onChange={(e) => setConditionAtReturn(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
            required
          >
            <option value="New" className="bg-gray-950">New</option>
            <option value="Good" className="bg-gray-950">Good</option>
            <option value="Fair" className="bg-gray-950">Fair</option>
            <option value="Poor" className="bg-gray-950">Poor</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Return Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Specify any changes in condition, loss of accessories, or general return feedback..."
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-purple-500 focus:bg-gray-900 transition resize-none"
          />
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-800/60">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-500 active:bg-purple-700 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? 'Processing...' : 'Complete Return'}
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
