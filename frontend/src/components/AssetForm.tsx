import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

interface Category {
  id: number;
  name: string;
  customFieldsSchema: { name: string; type: 'string' | 'number' | 'boolean'; required: boolean }[] | null;
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
}

interface AssetFormProps {
  asset?: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssetForm: React.FC<AssetFormProps> = ({ asset, onClose, onSuccess }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [serialNumber, setSerialNumber] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [condition, setCondition] = useState('Good');
  const [locationId, setLocationId] = useState<number | ''>('');
  const [status, setStatus] = useState('AVAILABLE');
  const [isBookable, setIsBookable] = useState(false);
  const [nextMaintenanceDueDate, setNextMaintenanceDueDate] = useState('');

  // Dynamic Custom Field Values
  const [customValues, setCustomValues] = useState<Record<string, any>>({});
  const [selectedCategorySchema, setSelectedCategorySchema] = useState<Category['customFieldsSchema']>(null);

  useEffect(() => {
    const loadLookups = async () => {
      setLoading(true);
      try {
        const [catsRes, locsRes] = await Promise.all([
          apiClient.get<Category[]>('/categories'),
          apiClient.get<Location[]>('/locations')
        ]);
        setCategories(catsRes.data);
        setLocations(locsRes.data);

        if (asset) {
          setName(asset.name);
          setCategoryId(asset.categoryId);
          setSerialNumber(asset.serialNumber || '');
          setAcquisitionDate(asset.acquisitionDate ? new Date(asset.acquisitionDate).toISOString().split('T')[0] : '');
          setAcquisitionCost(asset.acquisitionCost ? String(asset.acquisitionCost) : '');
          setCondition(asset.condition);
          setLocationId(asset.locationId || '');
          setStatus(asset.status);
          setIsBookable(asset.isBookable);
          setNextMaintenanceDueDate(asset.nextMaintenanceDueDate ? new Date(asset.nextMaintenanceDueDate).toISOString().split('T')[0] : '');
          setCustomValues(asset.customFieldValues || {});

          const selectedCat = catsRes.data.find((c) => c.id === asset.categoryId);
          if (selectedCat) {
            setSelectedCategorySchema(selectedCat.customFieldsSchema);
          }
        }
      } catch (err: any) {
        setError('Failed to load lookup options');
      } finally {
        setLoading(false);
      }
    };
    loadLookups();
  }, [asset]);

  const handleCategoryChange = (catId: number | '') => {
    setCategoryId(catId);
    setCustomValues({});
    if (catId === '') {
      setSelectedCategorySchema(null);
      return;
    }
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      setSelectedCategorySchema(cat.customFieldsSchema);
      const initialValues: Record<string, any> = {};
      cat.customFieldsSchema?.forEach((field) => {
        initialValues[field.name] = field.type === 'boolean' ? false : '';
      });
      setCustomValues(initialValues);
    }
  };

  const handleCustomValueChange = (name: string, value: any) => {
    setCustomValues({
      ...customValues,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formattedAcquisitionDate = acquisitionDate ? new Date(acquisitionDate).toISOString() : null;
    const formattedNextMaintenanceDueDate = nextMaintenanceDueDate ? new Date(nextMaintenanceDueDate).toISOString() : null;

    const processedCustomValues: Record<string, any> = {};
    selectedCategorySchema?.forEach((field) => {
      const val = customValues[field.name];
      if (val !== undefined && val !== null && val !== '') {
        if (field.type === 'number') {
          processedCustomValues[field.name] = Number(val);
        } else if (field.type === 'boolean') {
          processedCustomValues[field.name] = Boolean(val);
        } else {
          processedCustomValues[field.name] = String(val);
        }
      } else {
        processedCustomValues[field.name] = null;
      }
    });

    const payload = {
      name,
      categoryId: Number(categoryId),
      serialNumber: serialNumber || null,
      acquisitionDate: formattedAcquisitionDate,
      acquisitionCost: acquisitionCost ? Number(acquisitionCost) : null,
      condition,
      locationId: locationId === '' ? null : Number(locationId),
      status,
      isBookable,
      customFieldValues: Object.keys(processedCustomValues).length > 0 ? processedCustomValues : null,
      nextMaintenanceDueDate: formattedNextMaintenanceDueDate
    };

    try {
      if (asset) {
        await apiClient.put(`/assets/${asset.id}`, payload);
      } else {
        await apiClient.post('/assets', payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save asset directory entry');
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center bg-transparent">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-transparent text-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">
          {asset ? `Edit Asset: ${asset.assetTag}` : 'Register New Asset'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white font-bold text-xl cursor-pointer"
        >
          ×
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/40 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Asset Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MacBook Pro 14"
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Category</label>
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-gray-950">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Serial Number</label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g. C02F5..."
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Location</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
            >
              <option value="">Select Location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id} className="bg-gray-950">
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Acquisition Date</label>
            <input
              type="date"
              value={acquisitionDate}
              onChange={(e) => setAcquisitionDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Acquisition Cost (USD)</label>
            <input
              type="number"
              step="0.01"
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(e.target.value)}
              placeholder="e.g. 1299.99"
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
            >
              <option value="New" className="bg-gray-950">New</option>
              <option value="Good" className="bg-gray-950">Good</option>
              <option value="Fair" className="bg-gray-950">Fair</option>
              <option value="Poor" className="bg-gray-950">Poor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Asset Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
            >
              <option value="AVAILABLE" className="bg-gray-950">Available</option>
              <option value="ALLOCATED" className="bg-gray-950">Allocated</option>
              <option value="RESERVED" className="bg-gray-950">Reserved</option>
              <option value="UNDER_MAINTENANCE" className="bg-gray-950">Under Maintenance</option>
              <option value="LOST" className="bg-gray-950">Lost</option>
              <option value="RETIRED" className="bg-gray-950">Retired</option>
              <option value="DISPOSED" className="bg-gray-950">Disposed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Next Maintenance Date</label>
            <input
              type="date"
              value={nextMaintenanceDueDate}
              onChange={(e) => setNextMaintenanceDueDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
            />
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isBookable}
                onChange={(e) => setIsBookable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-800 bg-gray-900 text-purple-600 focus:ring-purple-500 accent-purple-600"
              />
              <span className="text-sm font-semibold text-gray-300">Allow Shared Resource Booking</span>
            </label>
          </div>
        </div>

        {selectedCategorySchema && selectedCategorySchema.length > 0 && (
          <div className="border-t border-gray-800/80 pt-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400">Dynamic Category Specs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCategorySchema.map((field) => (
                <div key={field.name}>
                  {field.type === 'boolean' ? (
                    <div className="flex items-center pt-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customValues[field.name] || false}
                          onChange={(e) => handleCustomValueChange(field.name, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-800 bg-gray-900 text-purple-600 accent-purple-600"
                        />
                        <span className="text-sm font-semibold text-gray-300">
                          {field.name} {field.required && <span className="text-red-500">*</span>}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {field.name} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={customValues[field.name] === undefined ? '' : customValues[field.name]}
                        onChange={(e) => handleCustomValueChange(field.name, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-100 outline-none focus:border-purple-500 focus:bg-gray-900 transition"
                        required={field.required}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t border-gray-800/60">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-500 active:bg-purple-700 transition cursor-pointer"
          >
            {asset ? 'Save Asset' : 'Register Asset'}
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
