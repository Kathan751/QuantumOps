import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';
import { AssetForm } from '../components/AssetForm';

interface Category {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
}

interface Asset {
  id: number;
  assetTag: string;
  name: string;
  categoryId: number;
  serialNumber: string | null;
  acquisitionDate: string | null;
  acquisitionCost: any;
  condition: string;
  locationId: number | null;
  status: string;
  isBookable: boolean;
  customFieldValues: Record<string, any> | null;
  nextMaintenanceDueDate: string | null;
  category: { id: number; name: string };
  location: { id: number; name: string } | null;
}

export const AssetDirectory: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedLocation, setSelectedLocation] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<string | ''>('');

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isManager = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER';

  const loadLookups = async () => {
    try {
      const [catsRes, locsRes] = await Promise.all([
        apiClient.get<Category[]>('/categories'),
        apiClient.get<Location[]>('/locations')
      ]);
      setCategories(catsRes.data);
      setLocations(locsRes.data);
    } catch (err) {
      console.error('Failed to load lookup listings:', err);
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory !== '') params.categoryId = selectedCategory;
      if (selectedLocation !== '') params.locationId = selectedLocation;
      if (selectedStatus !== '') params.status = selectedStatus;

      const response = await apiClient.get<Asset[]>('/assets', { params });
      setAssets(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [search, selectedCategory, selectedLocation, selectedStatus]);

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    setError(null);
    try {
      await apiClient.delete(`/assets/${id}`);
      fetchAssets();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete asset');
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingAsset(null);
    fetchAssets();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingAsset(null);
  };

  const statuses = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'ALLOCATED', label: 'Allocated' },
    { value: 'RESERVED', label: 'Reserved' },
    { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
    { value: 'LOST', label: 'Lost' },
    { value: 'RETIRED', label: 'Retired' },
    { value: 'DISPOSED', label: 'Disposed' }
  ];

  return (
    <div className="space-y-8 text-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white m-0">Asset Directory</h1>
          <p className="text-gray-400 text-sm mt-1">Search, track, and manage organisation physical assets</p>
        </div>
        {isManager && (
          <button
            onClick={() => {
              setEditingAsset(null);
              setIsFormOpen(true);
            }}
            className="self-start sm:self-auto rounded-xl bg-purple-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition text-sm cursor-pointer"
          >
            + Register Asset
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Filter Row */}
      <div className="glass rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by tag, name, serial..."
          className="w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm placeholder-gray-600 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:bg-gray-900 transition"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-gray-950">
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:bg-gray-900 transition"
        >
          <option value="">All Locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id} className="bg-gray-950">
              {l.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:bg-gray-900 transition"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s.value} value={s.value} className="bg-gray-950">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Directory Grid/Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden shadow-xl border border-gray-800/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800/80 bg-gray-950/20">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Tag</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Asset Name</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Location</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Condition</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Shared Booking</th>
                  {isManager && <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-900/25 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-purple-400">
                      <Link to={`/assets/${asset.id}`} className="hover:underline">
                        {asset.assetTag}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-100">
                      <Link to={`/assets/${asset.id}`} className="hover:underline">
                        {asset.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{asset.category.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {asset.location?.name || <span className="text-gray-600">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 border ${
                          asset.status === 'AVAILABLE'
                            ? 'bg-green-950/50 border-green-500/20 text-green-400'
                            : asset.status === 'ALLOCATED'
                            ? 'bg-blue-950/50 border-blue-500/20 text-blue-400'
                            : asset.status === 'UNDER_MAINTENANCE'
                            ? 'bg-amber-950/50 border-amber-500/20 text-amber-400'
                            : 'bg-red-950/50 border-red-500/20 text-red-400'
                        }`}
                      >
                        {asset.status.replace('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{asset.condition}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${
                          asset.isBookable
                            ? 'bg-purple-950/60 border border-purple-500/30 text-purple-400'
                            : 'bg-gray-900 border border-gray-800 text-gray-500'
                        }`}
                      >
                        {asset.isBookable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    {isManager && (
                      <td className="px-6 py-4 text-sm text-right space-x-3">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan={isManager ? 8 : 7} className="px-6 py-12 text-center text-gray-500 text-sm">
                      No assets found matching the search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asset Form Modal Backdrop */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 p-4 backdrop-blur-sm">
          <div className="glass max-w-2xl w-full rounded-2xl p-6 shadow-2xl relative border border-gray-800">
            <AssetForm
              asset={editingAsset}
              onClose={handleFormClose}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};
