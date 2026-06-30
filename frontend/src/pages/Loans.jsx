import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEye } from 'react-icons/fi';

function Loans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const res = await api.get('/loans');
      setLoans(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading loans...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Loans</h1>
        <Link
          to="/loans/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <FiPlus /> New Loan
        </Link>
      </div>

      {/* Loans Grid */}
      <div className="grid gap-4">
        {loans.map(loan => (
          <div key={loan.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800">{loan.member_name}</h3>
                <p className="text-sm text-gray-500">{loan.member_phone}</p>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                loan.status === 'active' ? 'bg-orange-100 text-orange-700' :
                loan.status === 'closed' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {loan.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-500">Principal</p>
                <p className="font-medium">₹{parseFloat(loan.principal_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Remaining</p>
                <p className="font-medium text-red-600">₹{parseFloat(loan.remaining_principal).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Interest Rate</p>
                <p className="font-medium">{loan.interest_rate}%/month</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Monthly Payment</p>
                <p className="font-medium">₹{parseFloat(loan.monthly_payment_amount).toLocaleString()}</p>
              </div>
              <div className="flex items-end">
                <Link
                  to={`/loans/${loan.id}`}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm"
                >
                  <FiEye size={14} /> View Details
                </Link>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Paid: ₹{parseFloat(loan.total_principal_paid || 0).toLocaleString()}</span>
                <span>{((parseFloat(loan.total_principal_paid || 0) / parseFloat(loan.principal_amount)) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (parseFloat(loan.total_principal_paid || 0) / parseFloat(loan.principal_amount)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}

        {loans.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500">No loans found. Create a new loan!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Loans;
