import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

function LoanDetail() {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ payment_amount: '', payment_date: new Date().toISOString().split('T')[0], remarks: '' });

  useEffect(() => {
    fetchLoan();
  }, [id]);

  const fetchLoan = async () => {
    try {
      const res = await api.get(`/loans/${id}`);
      setLoan(res.data.data);
    } catch (error) {
      console.error('Failed to fetch loan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/loans/${id}/payment`, {
        payment_amount: parseFloat(paymentForm.payment_amount),
        payment_date: paymentForm.payment_date,
        remarks: paymentForm.remarks
      });
      toast.success(res.data.message);
      setShowPaymentModal(false);
      setPaymentForm({ payment_amount: '', payment_date: new Date().toISOString().split('T')[0], remarks: '' });
      fetchLoan();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  };

  const handleForeclose = async () => {
    if (!confirm(`Are you sure you want to foreclose? Amount: ₹${loan.foreclosure_amount.toLocaleString()}`)) return;
    try {
      const res = await api.post(`/loans/${id}/foreclose`, { payment_date: new Date().toISOString().split('T')[0] });
      toast.success(res.data.message);
      fetchLoan();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Foreclosure failed');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!loan) return <div className="text-center py-10 text-red-500">Loan not found</div>;

  return (
    <div>
      <Link to="/loans" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4">
        <FiArrowLeft /> Back to Loans
      </Link>

      {/* Loan Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{loan.member_name}</h1>
            <p className="text-gray-500">Loan #{loan.id} | Started: {new Date(loan.start_date).toLocaleDateString()}</p>
          </div>
          <span className={`px-3 py-1 text-sm rounded-full font-medium ${
            loan.status === 'active' ? 'bg-orange-100 text-orange-700' :
            loan.status === 'closed' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {loan.status}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Principal</p>
            <p className="font-bold text-lg">₹{parseFloat(loan.principal_amount).toLocaleString()}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-500">Remaining Principal</p>
            <p className="font-bold text-lg text-red-600">₹{parseFloat(loan.remaining_principal).toLocaleString()}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Interest Rate</p>
            <p className="font-bold text-lg">{loan.interest_rate}%/month</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Monthly Payment</p>
            <p className="font-bold text-lg">₹{parseFloat(loan.monthly_payment_amount).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-gray-500">Current Month Interest</p>
            <p className="font-bold">₹{loan.current_month_interest?.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-500">Foreclosure Amount</p>
            <p className="font-bold">₹{loan.foreclosure_amount?.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-500">Total Interest Paid</p>
            <p className="font-bold">₹{parseFloat(loan.total_interest_paid || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {loan.status === 'active' && (
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowPaymentModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Record Payment
            </button>
            <button onClick={handleForeclose} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
              Foreclose
            </button>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>
        {loan.payments && loan.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Amount</th>
                  <th className="text-left px-4 py-2">Interest</th>
                  <th className="text-left px-4 py-2">Principal</th>
                  <th className="text-left px-4 py-2">Remaining</th>
                  <th className="text-left px-4 py-2">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loan.payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 font-medium">₹{parseFloat(p.payment_amount).toLocaleString()}</td>
                    <td className="px-4 py-2 text-orange-600">₹{parseFloat(p.interest_component).toLocaleString()}</td>
                    <td className="px-4 py-2 text-green-600">₹{parseFloat(p.principal_component).toLocaleString()}</td>
                    <td className="px-4 py-2">₹{parseFloat(p.remaining_principal_after).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        p.payment_type === 'foreclosure' ? 'bg-blue-100 text-blue-700' :
                        p.payment_type === 'interest_only' ? 'bg-yellow-100 text-yellow-700' :
                        p.payment_type === 'partial' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {p.payment_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No payments recorded yet</p>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Record Payment</h2>
            <p className="text-sm text-gray-500 mb-4">
              Current interest: ₹{loan.current_month_interest?.toLocaleString()} | 
              Set EMI: ₹{parseFloat(loan.monthly_payment_amount).toLocaleString()}
            </p>

            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setPaymentForm({...paymentForm, payment_amount: loan.monthly_payment_amount})}
                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded"
              >
                Full EMI
              </button>
              <button 
                onClick={() => setPaymentForm({...paymentForm, payment_amount: loan.current_month_interest})}
                className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"
              >
                Interest Only
              </button>
              <button 
                onClick={() => setPaymentForm({...paymentForm, payment_amount: loan.foreclosure_amount})}
                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
              >
                Foreclosure
              </button>
            </div>

            <form onSubmit={handlePayment} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number" required min="1" step="0.01" value={paymentForm.payment_amount}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_amount: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date" value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <input
                  type="text" value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({...paymentForm, remarks: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                  Submit Payment
                </button>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoanDetail;
