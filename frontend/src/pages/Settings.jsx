import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.data);
      setForm(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', {
        name: form.name,
        description: form.description,
        monthly_instalment: parseFloat(form.monthly_instalment),
        default_interest_rate: parseFloat(form.default_interest_rate),
        late_fine_per_day: parseFloat(form.late_fine_per_day || 0),
        late_fine_per_month: parseFloat(form.late_fine_per_month || 0),
        grace_period_days: parseInt(form.grace_period_days || 0),
        payment_due_day: parseInt(form.payment_due_day || 5)
      });
      toast.success('Settings updated!');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  if (loading) return <div className="text-center py-10">Loading settings...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Committee Settings</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Committee Name</label>
            <input
              type="text" value={form.name || ''}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Instalment (₹)</label>
              <input
                type="number" min="0" value={form.monthly_instalment || ''}
                onChange={(e) => setForm({...form, monthly_instalment: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Interest Rate (%/month)</label>
              <input
                type="number" min="0" step="0.01" value={form.default_interest_rate || ''}
                onChange={(e) => setForm({...form, default_interest_rate: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Fine (₹/day)</label>
              <input
                type="number" min="0" value={form.late_fine_per_day || ''}
                onChange={(e) => setForm({...form, late_fine_per_day: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Fine (₹/month)</label>
              <input
                type="number" min="0" value={form.late_fine_per_month || ''}
                onChange={(e) => setForm({...form, late_fine_per_month: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grace Period (days)</label>
              <input
                type="number" min="0" value={form.grace_period_days || ''}
                onChange={(e) => setForm({...form, grace_period_days: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Due Day (of month)</label>
              <input
                type="number" min="1" max="28" value={form.payment_due_day || ''}
                onChange={(e) => setForm({...form, payment_due_day: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium">
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}

export default Settings;
