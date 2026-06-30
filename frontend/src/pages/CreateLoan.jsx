import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';

function CreateLoan() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    member_id: '',
    principal_amount: '',
    interest_rate: '',
    monthly_payment_amount: '',
    tenure_months: '',
    start_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    calculatePreview();
  }, [form.principal_amount, form.interest_rate, form.monthly_payment_amount]);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data.data.filter(m => m.is_active));
    } catch (error) {
      console.error(error);
    }
  };

  const calculatePreview = () => {
    const principal = parseFloat(form.principal_amount);
    const rate = parseFloat(form.interest_rate);
    const payment = parseFloat(form.monthly_payment_amount);

    if (!principal || !rate || !payment) {
      setPreview(null);
      return;
    }

    const firstMonthInterest = principal * (rate / 100);
    const firstMonthPrincipal = payment - firstMonthInterest;

    // Calculate tenure
    let remaining = principal;
    let months = 0;
    let totalInterest = 0;
    while (remaining > 0 && months < 600) {
      const interest = remaining * (rate / 100);
      totalInterest += interest;
      const prinPortion = payment - interest;
      if (prinPortion <= 0) {
        setPreview({
          firstMonthInterest,
          firstMonthPrincipal: 0,
          warning: 'Monthly payment is less than or equal to interest. Loan will never close!',
          totalInterest: null,
          estimatedMonths: null
        });
        return;
      }
      remaining -= prinPortion;
      months++;
    }

    setPreview({
      firstMonthInterest: firstMonthInterest.toFixed(2),
      firstMonthPrincipal: firstMonthPrincipal.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      estimatedMonths: months,
      totalPayable: (principal + totalInterest).toFixed(2),
      warning: null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        principal_amount: parseFloat(form.principal_amount),
        interest_rate: parseFloat(form.interest_rate),
        monthly_payment_amount: parseFloat(form.monthly_payment_amount),
        tenure_months: form.tenure_months ? parseInt(form.tenure_months) : null,
        member_id: parseInt(form.member_id)
      };

      const res = await api.post('/loans', payload);
      toast.success('Loan created successfully!');
      navigate(`/loans/${res.data.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create loan');
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/loans')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4">
        <FiArrowLeft /> Back to Loans
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Loan</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
              <select
                value={form.member_id} required
                onChange={(e) => setForm({...form, member_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Member</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (₹) *</label>
              <input
                type="number" required min="1" value={form.principal_amount}
                onChange={(e) => setForm({...form, principal_amount: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., 100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Interest Rate (%) *</label>
              <input
                type="number" required min="0.01" step="0.01" value={form.interest_rate}
                onChange={(e) => setForm({...form, interest_rate: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment Amount (₹) *</label>
              <input
                type="number" required min="1" value={form.monthly_payment_amount}
                onChange={(e) => setForm({...form, monthly_payment_amount: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., 10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (Months) - Optional</label>
              <input
                type="number" min="1" value={form.tenure_months}
                onChange={(e) => setForm({...form, tenure_months: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Leave empty for open-ended"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date" value={form.start_date}
                onChange={(e) => setForm({...form, start_date: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({...form, remarks: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Optional notes"
              />
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium">
              Create Loan
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Loan Preview</h2>
          {preview ? (
            <div className="space-y-4">
              {preview.warning && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {preview.warning}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">First Month Interest</p>
                  <p className="font-bold text-lg">₹{parseFloat(preview.firstMonthInterest).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">First Month Principal</p>
                  <p className="font-bold text-lg">₹{parseFloat(preview.firstMonthPrincipal).toLocaleString()}</p>
                </div>
              </div>

              {preview.estimatedMonths && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-500">Estimated Tenure</p>
                      <p className="font-bold text-lg">{preview.estimatedMonths} months</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-500">Total Interest</p>
                      <p className="font-bold text-lg">₹{parseFloat(preview.totalInterest).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-500">Total Payable (Principal + Interest)</p>
                    <p className="font-bold text-xl">₹{parseFloat(preview.totalPayable).toLocaleString()}</p>
                  </div>
                </>
              )}

              <p className="text-xs text-gray-400 mt-4">
                * This is a projected estimate based on regular monthly payments. 
                Actual amounts may vary with partial payments or compounding.
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-10">
              Fill in the loan details to see preview
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateLoan;
