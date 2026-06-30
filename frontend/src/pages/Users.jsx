import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'manager' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload = { name: form.name, email: form.email, phone: form.phone, role: form.role };
        await api.put(`/users/${editingUser.id}`, payload);
        toast.success('User updated!');
      } else {
        await api.post('/users', form);
        toast.success('User created!');
      }
      setShowModal(false);
      setEditingUser(null);
      setForm({ name: '', email: '', password: '', phone: '', role: 'manager' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', phone: user.phone || '', role: user.role });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="text-center py-10">Loading users...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">App Users (Login Roles)</h1>
        <button
          onClick={() => { setEditingUser(null); setForm({ name: '', email: '', password: '', phone: '', role: 'manager' }); setShowModal(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <FiPlus /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Role</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{user.name}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                    user.role === 'superadmin' ? 'bg-red-100 text-red-700' :
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'subadmin' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(user)} className="text-yellow-600 hover:text-yellow-800 p-1"><FiEdit size={16} /></button>
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 p-1"><FiTrash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text" placeholder="Name *" required value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email" placeholder="Email *" required value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              {!editingUser && (
                <input
                  type="password" placeholder="Password *" required value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              )}
              <input
                type="tel" placeholder="Phone" value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({...form, role: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="subadmin">Sub Admin</option>
                <option value="manager">Manager</option>
              </select>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                  {editingUser ? 'Update' : 'Create'}
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

export default Users;
