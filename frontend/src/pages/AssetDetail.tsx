import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';
import { AllocationForm } from '../components/AllocationForm';
import { ReturnForm } from '../components/ReturnForm';

interface Employee {
  id: number;
  name: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
}

interface Allocation {
  id: number;
  allocatedDate: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  status: 'ACTIVE' | 'RETURNED' | 'TRANSFERRED';
  employee: Employee | null;
  department: Department | null;
  conditionAtAllocation: string | null;
  conditionAtReturn: string | null;
}

interface MaintenanceRequest {
  id: number;
  issueDescription: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: string;
  assignedTechnicianName: string | null;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  raisedBy: { id: number; name: string };
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
  createdAt: string;
  category: { id: number; name: string; customFieldsSchema: any };
  location: { id: number; name: string } | null;
  registeredBy: { id: number; name: string; email: string };
  allocations: Allocation[];
  maintenanceRequests: MaintenanceRequest[];
}

export const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'allocations' | 'maintenance'>('allocations');

  // Modal actions state
  const [allocationMode, setAllocationMode] = useState<'checkout' | 'assign' | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const fetchAssetDetails = async () => {
    setError(null);
    try {
      const response = await apiClient.get<Asset>(`/assets/${id}`);
      setAsset(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="glass max-w-md mx-auto rounded-2xl p-8 text-center shadow-2xl border border-red-500/20 text-gray-100 mt-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 border border-red-500/30 text-red-400 text-3xl">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold mb-2">Error Loading Asset</h1>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          {error || 'Asset not found in directories.'}
        </p>
        <Link
          to="/assets"
          className="inline-block w-full rounded-xl bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-500 text-sm"
        >
          Return to Directory
        </Link>
      </div>
    );
  }

  const activeAllocation = asset.allocations?.find((a) => a.status === 'ACTIVE');
  const canReturn =
    activeAllocation &&
    (user?.role === 'ADMIN' ||
      user?.role === 'ASSET_MANAGER' ||
      activeAllocation.employeeId === user?.id);

  return (
    <div className="space-y-8 text-gray-100 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Link to="/assets" className="hover:underline">Asset Directory</Link>
            <span>/</span>
            <span className="text-gray-500">{asset.assetTag}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-1 m-0">{asset.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {asset.status === 'AVAILABLE' && (
            <>
              <button
                onClick={() => setAllocationMode('checkout')}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-purple-500 cursor-pointer"
              >
                Check Out
              </button>
              {(user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER') && (
                <button
                  onClick={() => setAllocationMode('assign')}
                  className="rounded-xl bg-purple-950 border border-purple-500/30 px-4 py-2 text-xs font-semibold text-purple-400 transition hover:bg-purple-900 cursor-pointer"
                >
                  Assign Asset
                </button>
              )}
            </>
          )}

          {asset.status === 'ALLOCATED' && canReturn && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-500 cursor-pointer"
            >
              Return Asset
            </button>
          )}

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold leading-5 border ${
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Core Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Serial Number</span>
                <span className="text-sm font-semibold text-gray-200">{asset.serialNumber || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Asset Category</span>
                <span className="text-sm font-semibold text-gray-200">{asset.category.name}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Location</span>
                <span className="text-sm font-semibold text-gray-200">{asset.location?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Current Condition</span>
                <span className="text-sm font-semibold text-gray-200">{asset.condition}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Acquisition Date</span>
                <span className="text-sm font-semibold text-gray-200">
                  {asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Acquisition Cost (USD)</span>
                <span className="text-sm font-semibold text-gray-200">
                  {asset.acquisitionCost ? `$${Number(asset.acquisitionCost).toLocaleString()}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Next Maintenance Due</span>
                <span className="text-sm font-semibold text-gray-200">
                  {asset.nextMaintenanceDueDate ? new Date(asset.nextMaintenanceDueDate).toLocaleDateString() : 'None Scheduled'}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Shared Resource Booking</span>
                <span className="text-sm font-semibold text-gray-200">{asset.isBookable ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>

          {asset.customFieldValues && Object.keys(asset.customFieldValues).length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Category Dynamic Attributes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(asset.customFieldValues).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-xs text-gray-500 block uppercase tracking-wider">{key}</span>
                    <span className="text-sm font-semibold text-gray-200">
                      {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '—')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">System Information</h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider">QR Code Identifier</span>
                <div className="mt-2 bg-white p-2.5 inline-block rounded-xl border border-gray-800">
                  <div className="h-28 w-28 bg-[#1f2937] flex flex-col items-center justify-center rounded-lg border border-purple-500/20 text-center p-2 text-white">
                    <p className="text-[10px] font-bold tracking-widest text-purple-400">QR CODE</p>
                    <p className="text-[8px] mt-1 break-all text-gray-400 font-mono select-all">{asset.qrCodeValue}</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Registered By</span>
                <p className="text-sm font-semibold text-gray-200 mt-1">{asset.registeredBy?.name}</p>
                <p className="text-xs text-gray-500">{asset.registeredBy?.email}</p>
              </div>

              <div>
                <span className="text-xs text-gray-500 block uppercase tracking-wider">Registered On</span>
                <p className="text-sm font-semibold text-gray-200 mt-1">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex border-b border-gray-800/80">
          <button
            onClick={() => setActiveTab('allocations')}
            className={`px-4 py-2.5 font-semibold text-sm border-b-2 cursor-pointer transition ${
              activeTab === 'allocations'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Allocation Log (Track A)
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2.5 font-semibold text-sm border-b-2 cursor-pointer transition ${
              activeTab === 'maintenance'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Maintenance Tickets (Track B)
          </button>
        </div>

        {activeTab === 'allocations' ? (
          <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800/80 bg-gray-950/20">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Recipient</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Allocated Date</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Expected Return</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Actual Return</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-sm">
                  {asset.allocations?.map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-gray-900/10 transition">
                      <td className="px-6 py-4">
                        {alloc.employee ? (
                          <div>
                            <p className="font-semibold text-gray-200">{alloc.employee.name}</p>
                            <p className="text-xs text-gray-500">{alloc.employee.email}</p>
                          </div>
                        ) : alloc.department ? (
                          <span className="font-semibold text-purple-400">{alloc.department.name} (Dept)</span>
                        ) : (
                          <span className="text-gray-600">Unknown</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {new Date(alloc.allocatedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {alloc.expectedReturnDate ? new Date(alloc.expectedReturnDate).toLocaleDateString() : 'Indefinite'}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {alloc.actualReturnDate ? new Date(alloc.actualReturnDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold border ${
                            alloc.status === 'ACTIVE'
                              ? 'bg-blue-950/40 border-blue-500/20 text-blue-400'
                              : alloc.status === 'RETURNED'
                              ? 'bg-green-950/40 border-green-500/20 text-green-400'
                              : 'bg-amber-950/40 border-amber-500/20 text-amber-400'
                          }`}
                        >
                          {alloc.status.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!asset.allocations || asset.allocations.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No allocation logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden border border-gray-800/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800/80 bg-gray-950/20">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Raised By</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Description</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Priority</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Assigned Tech</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">Resolved On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-sm">
                  {asset.maintenanceRequests?.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-900/10 transition">
                      <td className="px-6 py-4 text-gray-200 font-semibold">{ticket.raisedBy?.name}</td>
                      <td className="px-6 py-4 text-gray-400 truncate max-w-xs">{ticket.issueDescription}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded px-1.5 py-0.5 text-xs font-bold leading-5 ${
                            ticket.priority === 'LOW'
                              ? 'bg-gray-900 text-gray-400 border border-gray-800'
                              : ticket.priority === 'MEDIUM'
                              ? 'bg-blue-950/50 text-blue-400 border border-blue-500/20'
                              : ticket.priority === 'HIGH'
                              ? 'bg-amber-950/50 text-amber-400 border border-amber-500/20'
                              : 'bg-red-950/50 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {ticket.priority.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 font-medium capitalize">{ticket.status.toLowerCase().replace('_', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{ticket.assignedTechnicianName || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-gray-500 text-right">
                        {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {(!asset.maintenanceRequests || asset.maintenanceRequests.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No maintenance history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Checkout/Assign Modal Backdrop */}
      {allocationMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 p-4 backdrop-blur-sm">
          <div className="glass max-w-lg w-full rounded-2xl p-6 shadow-2xl relative border border-gray-800">
            <AllocationForm
              assetId={asset.id}
              assetName={asset.name}
              mode={allocationMode}
              onClose={() => setAllocationMode(null)}
              onSuccess={() => {
                setAllocationMode(null);
                fetchAssetDetails();
              }}
            />
          </div>
        </div>
      )}

      {/* Return Modal Backdrop */}
      {showReturnModal && activeAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 p-4 backdrop-blur-sm">
          <div className="glass max-w-lg w-full rounded-2xl p-6 shadow-2xl relative border border-gray-800">
            <ReturnForm
              allocationId={activeAllocation.id}
              assetName={asset.name}
              onClose={() => setShowReturnModal(false)}
              onSuccess={() => {
                setShowReturnModal(false);
                fetchAssetDetails();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
