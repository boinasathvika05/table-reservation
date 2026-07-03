import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { TableProperties, Plus, Edit, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';

const TablesManager = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State (for both create and edit)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    number: '',
    capacity: 2,
    status: 'available'
  });
  const [formLoading, setFormLoading] = useState(false);

  const { showToast } = useToast();

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tables');
      if (res.success) {
        setTables(res.data.tables);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch restaurant floor tables.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ number: '', capacity: 2, status: 'available' });
    setShowForm(true);
  };

  const handleOpenEdit = (table) => {
    setEditingId(table._id);
    setForm({
      number: table.number,
      capacity: table.capacity,
      status: table.status
    });
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (form.capacity <= 0) {
      showToast('Table capacity must be greater than 0', 'error');
      return;
    }

    setFormLoading(true);
    try {
      if (editingId) {
        // Edit request
        const res = await api.put(`/tables/${editingId}`, form);
        if (res.success) {
          showToast('Table updated successfully!', 'success');
          setShowForm(false);
          fetchTables();
        }
      } else {
        // Create request
        const res = await api.post('/tables', form);
        if (res.success) {
          showToast('Table added to floor layout!', 'success');
          setShowForm(false);
          fetchTables();
        }
      }
    } catch (err) {
      showToast(err.message || 'Table action failed.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this table?')) return;

    try {
      const res = await api.delete(`/tables/${id}`);
      if (res.success) {
        showToast('Table removed successfully.', 'success');
        fetchTables();
      }
    } catch (err) {
      showToast(err.message || 'Cannot delete table. It might have future reservations.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Manage Seating Inventory</h3>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Add Table
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : tables.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <TableProperties size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <p>No tables registered on the floor. Click "Add Table" to get started.</p>
        </div>
      ) : (
        <div className="table-container animate-fade-in">
          <table className="table">
            <thead>
              <tr>
                <th>Table Label/Number</th>
                <th>Seat Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(table => (
                <tr key={table._id}>
                  <td style={{ fontWeight: 800 }}>{table.number}</td>
                  <td>{table.capacity} guests max</td>
                  <td>
                    <span className={`badge badge-${table.status}`}>
                      {table.status === 'available' ? 'Available' : 'Maintenance'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem' }} onClick={() => handleOpenEdit(table)} title="Edit Table">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.35rem' }} onClick={() => handleDelete(table._id)} title="Delete Table">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Dialog Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              {editingId ? 'Edit Table Configurations' : 'Add New Floor Table'}
            </h3>
            
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Table Number/Label</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. T16"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Seat Capacity</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="30"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 2 })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                <label className="form-label">Seating Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="available">Available (Active Floor)</option>
                  <option value="maintenance">Maintenance (Offline)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Save Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesManager;
