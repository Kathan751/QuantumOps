import { insightApi } from '../services/api.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { Button, Card, PageHeader, SimpleTable, StatusBadge } from '../components/ui.jsx';
import { formatDate } from '../lib/utils.js';

export default function NotificationsLogs() {
  const { data: notifications = [], refresh } = useAsyncData(insightApi.notifications, [], 30000, []);
  const { data: logs = [] } = useAsyncData(insightApi.logs, [], 0, []);
  return <div className="grid gap-6"><PageHeader eyebrow="Traceability" title="Activity Logs & Notifications" description="Role-aware alerts and immutable audit trails for every important workflow action." /><Card><h2 className="mb-3 text-xl font-black">Notification Center</h2><SimpleTable columns={[{ key: 'type', label: 'Type', render: (r) => <StatusBadge value={r.type} /> }, { key: 'message', label: 'Message' }, { key: 'createdAt', label: 'Time', render: (r) => formatDate(r.createdAt) }, { key: 'isRead', label: 'Read', render: (r) => r.isRead ? 'Yes' : 'No' }]} rows={notifications} renderActions={(r) => !r.isRead && <Button variant="secondary" onClick={() => insightApi.markRead(r.id).then(refresh)}>Mark read</Button>} /></Card><Card><h2 className="mb-3 text-xl font-black">Immutable Activity Log</h2><SimpleTable columns={[{ key: 'actor', label: 'Actor', render: (r) => r.actor?.name || 'System' }, { key: 'action', label: 'Action' }, { key: 'entityType', label: 'Object' }, { key: 'createdAt', label: 'When', render: (r) => formatDate(r.createdAt) }]} rows={logs} /></Card></div>;
}
