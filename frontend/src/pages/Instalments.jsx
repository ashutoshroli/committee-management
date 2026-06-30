import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiRefreshCw } from 'react-icons/fi';

function Instalments() {
  const [instalments, setInstalments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInstalment, setSelectedInstalment] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    fetchInstalments();
  }, [month, year]);

  const fetchInstalments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/instalments?month=${month}&year=${year}`);
      setInstalments(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch instalments');
    } finally {
      setLoading(false);
    }
  };

  const generateInstalments = async () => {
    try {
      const res = await api.post('/instalments/generate', { month, year });
      toast.success(res.data.message);
      fetchInstalments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate');
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/instalments/${selectedInstalment.id}/pay`, {
        paid_amount: parseFloat(payAmount),
        paid_date: new Date().toISOString().split('T')[0]
      });
      toast.success('Payment recorded!');
      setShowPayModal(false);
      setSelectedInstalment(null);
      setPayAmount('');
      fetchInstalments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  };

  const openPayModal = (inst) => {
    setSelectedInstalment(inst);
    setPayAmount(parseFloat(inst.amount) - parseFloat(inst.paid_amount));
    setShowPayModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Monthly Instalments</h1>
        <button
          onClick={generateInstalments}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <FiRefreshCw /> Generate for {month}/{year}
        </button>
      </div>

      {/* Month/Year Filter */}
      <div className="flex gap-3 mb-6">
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="px-3 py-2 border rounded-lg">
          {Array.from({length: 12}, (_, i) => (
            <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('default', {month: 'long'})}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="px-3 py-2 border rounded-lg">
          {Array.from({length: 5}, (_, i) => {
            const y = new Date().getFullYear() - 2 + i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
      </div>

      {/* Summary */}
      {instalments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border text-center">
            <p className="text-2xl font-bold">{instalments.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
            <p className="text-2xl font-bold text-green-600">{instalments.filter(i => i.status === 'paid').length}</p>
            <p className="text-sm text-gray-500">Paid</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
            <p className="text-2xl font-bold text-yellow-600">{instalments.filter(i => i.status === 'partial').length}</p>
            <p className="text-sm text-gray-500">Partial</p>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-center">
            <p className="text-2xl font-bold text-red-600">{instalments.filter(i => i.status === 'unpaid' || i.status === 'late').length}</p>
            <p className="text-sm text-gray-500">Unpaid</p>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Member</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Paid</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Due Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Fine</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {instalments.map(inst => (
                <tr key={inst.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{inst.member_name}</p>
                    <p className="text-xs text-gray-500">{inst.member_phone}</p>
                  </td>
                  <td className="px-4 py-3">₹{parseFloat(inst.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">₹{parseFloat(inst.paid_amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{new Date(inst.due_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-red-600">
                    {parseFloat(inst.late_fine) > 0 ? `₹${parseFloat(inst.late_fine).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      inst.status === 'paid' ? 'bg-green-100 text-green-700' :
                      inst.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      inst.status === 'late' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {inst.status !== 'paid' && (
                      <button
                        onClick={() => openPayModal(inst)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {instalments.length === 0 && (
            <p className="text-center py-8 text-gray-500">
              No instalments for {month}/{year}. Click "Generate" to create.
            </p>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-2">Record Payment</h2>
            <p className="text-sm text-gray-500 mb-4">
              {selectedInstalment?.member_name} — Due: ₹{parseFloat(selectedInstalment?.amount).toLocaleString()}
            </p>
            <form onSubmit={handlePay} className="space-y-3">
              <input
                type="number" required min="1" step="0.01" value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Amount"
              />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">Pay</button>
                <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Instalments;
