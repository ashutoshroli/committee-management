import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', committee_role: 'member' });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/members');
      setMembers(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await api.put(`/members/${editingMember.id}`, form);
        toast.success('Member updated!');
      } else {
        await api.post('/members', form);
        toast.success('Member added!');
      }
      setShowModal(false);
      setEditingMember(null);
      setForm({ name: '', phone: '', email: '', address: '', committee_role: 'member' });
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      phone: member.phone || '',
      email: member.email || '',
      address: member.address || '',
      committee_role: member.committee_role
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
      await api.delete(`/members/${id}`);
      toast.success('Member deleted');
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <div className="text-center py-10">Loading members...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Members</h1>
        <button
          onClick={() => { setEditingMember(null); setForm({ name: '', phone: '', email: '', address: '', committee_role: 'member' }); setShowModal(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <FiPlus /> Add Member
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Phone</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Role</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map(member => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-800">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{member.phone || '-'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700 capitalize">
                    {member.committee_role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/members/${member.id}`} className="text-blue-600 hover:text-blue-800 p-1"><FiEye size={16} /></Link>
                    <button onClick={() => handleEdit(member)} className="text-yellow-600 hover:text-yellow-800 p-1"><FiEdit size={16} /></button>
                    <button onClick={() => handleDelete(member.id)} className="text-red-600 hover:text-red-800 p-1"><FiTrash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <p className="text-center py-8 text-gray-500">No members found. Add your first member!</p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingMember ? 'Edit Member' : 'Add Member'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text" placeholder="Name *" required value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="tel" placeholder="Phone" value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email" placeholder="Email" value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                placeholder="Address" value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={form.committee_role}
                onChange={(e) => setForm({...form, committee_role: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="member">Member</option>
                <option value="president">President</option>
                <option value="secretary">Secretary</option>
                <option value="treasurer">Treasurer</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                  {editingMember ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
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

export default Members;
