import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

interface CustomFieldDef {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  customFieldsSchema: CustomFieldDef[] | null;
  _count?: { assets: number };
}

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Category[]>('/categories');
      setCategories(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddField = () => {
    setCustomFields([...customFields, { name: '', type: 'string', required: false }]);
  };

  const handleRemoveField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof CustomFieldDef, value: any) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], [key]: value };
    setCustomFields(updated);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCustomFields([]);
    setIsEditing(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (customFields.some((f) => !f.name.trim())) {
      setError('Custom field names cannot be blank');
      return;
    }

    const payload = {
      name,
      description: description || null,
      customFieldsSchema: customFields.length > 0 ? customFields : null
    };

    try {
      if (isEditing && editId !== null) {
        await apiClient.put(`/categories/${editId}`, payload);
      } else {
        await apiClient.post('/categories', payload);
      }
      resetForm();
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save category');
    }
  };

  const handleEdit = (cat: Category) => {
    setIsEditing(true);
    setEditId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setCustomFields(cat.customFieldsSchema || []);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category? This cannot be undone.')) return;
    setError(null);
    try {
      await apiClient.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete category');
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white m-0">Asset Categories</h1>
        <p className="text-gray-400 text-sm mt-1">Manage categories and declare custom dynamic specification schemas</p>
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
              {isEditing ? 'Edit Category' : 'Create Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Laptops"
                  className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional brief description"
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-purple-500 focus:bg-gray-900 transition resize-none"
                />
              </div>

              {/* Dynamic Field Builder */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Custom Fields Schema</label>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
                  >
                    + Add Field
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {customFields.map((field, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-gray-900/40 p-2.5 rounded-xl border border-gray-800/60">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                        placeholder="Field Name"
                        className="flex-1 min-w-0 bg-transparent text-xs text-gray-100 outline-none border-b border-gray-800 focus:border-purple-500"
                        required
                      />
                      <select
                        value={field.type}
                        onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                        className="bg-gray-950 text-xs text-gray-400 outline-none"
                      >
                        <option value="string">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Yes/No</option>
                      </select>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                          className="accent-purple-600"
                        />
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">Req</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="text-red-400 hover:text-red-300 font-bold text-sm cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {customFields.length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-2">No custom schema defined.</p>
                  )}
                </div>
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
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Category Name</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Description</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Custom Schema Fields</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Registered Assets</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-900/25 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-100">{cat.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {cat.description || <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        <div className="flex flex-wrap gap-1">
                          {cat.customFieldsSchema && cat.customFieldsSchema.length > 0 ? (
                            cat.customFieldsSchema.map((field, index) => (
                              <span
                                key={index}
                                className="bg-gray-900 px-2 py-0.5 rounded border border-gray-800 text-[10px] text-gray-300"
                              >
                                {field.name} ({field.type}
                                {field.required ? '*' : ''})
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-600">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{cat._count?.assets || 0}</td>
                      <td className="px-6 py-4 text-sm text-right space-x-2">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                        No categories configured.
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
