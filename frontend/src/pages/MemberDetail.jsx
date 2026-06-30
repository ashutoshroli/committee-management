import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { FiArrowLeft } from 'react-icons/fi';

function MemberDetail() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMember();
  }, [id]);

  const fetchMember = async () => {
    try {
      const res = await api.get(`/members/${id}`);
      setMember(res.data.data);
    } catch (error) {
      console.error('Failed to fetch member:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!member) return <div className="text-center py-10 text-red-500">Member not found</div>;

  return (
    <div>
      <Link to="/members" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4">
        <FiArrowLeft /> Back to Members
      </Link>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{member.name}</h1>
            <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700 capitalize mt-2 inline-block">
              {member.committee_role}
            </span>
          </div>
          <span className={`px-3 py-1 text-sm rounded-full ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {member.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{member.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{member.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Join Date</p>
            <p className="font-medium">{new Date(member.join_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-medium">{member.address || '-'}</p>
          </div>
        </div>
      </div>

      {/* Active Loans */}
      {member.loans && member.loans.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold mb-4">Loans</h2>
          <div className="space-y-3">
            {member.loans.map(loan => (
              <Link key={loan.id} to={`/loans/${loan.id}`} className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">₹{parseFloat(loan.principal_amount).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Rate: {loan.interest_rate}% | EMI: ₹{parseFloat(loan.monthly_payment_amount).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${loan.status === 'active' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {loan.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">Remaining: ₹{parseFloat(loan.remaining_principal).toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Instalment Summary */}
      {member.instalment_summary && member.instalment_summary.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Instalment Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {member.instalment_summary.map((s, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-lg font-bold capitalize">{s.status}</p>
                <p className="text-sm text-gray-500">{s.count} months</p>
                <p className="text-xs text-gray-400">₹{parseFloat(s.total_paid || 0).toLocaleString()} paid</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberDetail;
