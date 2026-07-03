import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Calendar, Users, Clock, FileText, CheckCircle, XCircle, RefreshCw, Edit, Trash2 } from 'lucide-react';

const CustomerDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past'

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guests: 2,
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    notes: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Rebook State
  const [rebookingRes, setRebookingRes] = useState(null);
  const [rebookDate, setRebookDate] = useState(new Date().toISOString().split('T')[0]);
  const [rebookTime, setRebookTime] = useState('18:00');
  const [rebookLoading, setRebookLoading] = useState(false);

  const { showToast } = useToast();

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/reservations?limit=100');
      if (response && response.success) {
        setReservations(response.data.reservations);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Handle Booking Creation
  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (bookingForm.guests <= 0) {
      showToast('Guests count must be greater than 0', 'error');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (bookingForm.date < today) {
      showToast('Booking date cannot be in the past', 'error');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await api.post('/reservations', bookingForm);
      if (res.success) {
        showToast('Table booked successfully!', 'success');
        // Reset form
        setBookingForm({
          guestName: '',
          guestEmail: '',
          guestPhone: '',
          guests: 2,
          date: new Date().toISOString().split('T')[0],
          startTime: '18:00',
          notes: ''
        });
        fetchReservations();
      }
    } catch (err) {
      showToast(err.message || 'Table allocation failed. Try another slot.', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle Cancellation
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      const res = await api.put(`/reservations/${id}/cancel`);
      if (res.success) {
        showToast('Reservation cancelled successfully', 'success');
        fetchReservations();
      }
    } catch (err) {
      showToast(err.message || 'Unable to cancel booking.', 'error');
    }
  };

  // Open Edit Modal
  const openEdit = (res) => {
    setEditingId(res._id);
    setEditForm({
      guestName: res.guestName,
      guestEmail: res.guestEmail,
      guestPhone: res.guestPhone,
      guests: res.guests,
      date: res.date,
      startTime: res.startTime,
      notes: res.notes
    });
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await api.put(`/reservations/${editingId}`, editForm);
      if (res.success) {
        showToast('Reservation updated successfully', 'success');
        setEditingId(null);
        fetchReservations();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update reservation.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle One-Click Rebook Submit
  const handleRebookSubmit = async (e) => {
    e.preventDefault();
    setRebookLoading(true);
    try {
      const res = await api.post('/reservations', {
        guestName: rebookingRes.guestName,
        guestEmail: rebookingRes.guestEmail,
        guestPhone: rebookingRes.guestPhone,
        guests: rebookingRes.guests,
        date: rebookDate,
        startTime: rebookTime,
        notes: rebookingRes.notes || 'Rebooked reservation'
      });
      if (res.success) {
        showToast('Rebooked successfully!', 'success');
        setRebookingRes(null);
        fetchReservations();
      }
    } catch (err) {
      showToast(err.message || 'Rebook failed. Slot might be full.', 'error');
    } finally {
      setRebookLoading(false);
    }
  };

  // Filter reservations
  const upcomingReservations = reservations.filter(r => ['pending', 'confirmed', 'checked_in'].includes(r.status));
  const pastReservations = reservations.filter(r => ['completed', 'cancelled', 'no_show'].includes(r.status));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="stats-grid">
        <div className="card stat-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(17, 24, 39, 0.5) 100%)' }}>
          <div className="stat-header">
            <span>Upcoming Covers</span>
            <Calendar size={18} />
          </div>
          <div className="stat-value">{upcomingReservations.reduce((acc, r) => acc + r.guests, 0)}</div>
          <div className="stat-footer">Across {upcomingReservations.length} confirmed bookings</div>
        </div>

        <div className="card stat-card">
          <div className="stat-header">
            <span>Past Visits</span>
            <CheckCircle size={18} />
          </div>
          <div className="stat-value">
            {pastReservations.filter(r => r.status === 'completed').length}
          </div>
          <div className="stat-footer">Completed reservations count</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        {/* Book a Table Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} style={{ color: 'var(--accent-color)' }} />
            Book a Seating
          </h3>
          <form onSubmit={handleBookingSubmit}>
            <div className="form-group">
              <label className="form-label">Guest Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Name"
                value={bookingForm.guestName}
                onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Guest Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Email"
                value={bookingForm.guestEmail}
                onChange={(e) => setBookingForm({ ...bookingForm, guestEmail: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="Phone"
                value={bookingForm.guestPhone}
                onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Guests</label>
                <div style={{ position: 'relative' }}>
                  <Users size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    className="form-input"
                    style={{ paddingLeft: '2.25rem' }}
                    min="1"
                    max="20"
                    value={bookingForm.guests}
                    onChange={(e) => setBookingForm({ ...bookingForm, guests: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Start Time</label>
              <div style={{ position: 'relative' }}>
                <Clock size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="time"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Special Notes</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="Preferences..."
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={bookingLoading}>
              {bookingLoading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Book Seating'}
            </button>
          </form>
        </div>

        {/* Reservations History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <button
              onClick={() => setActiveTab('upcoming')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'upcoming' ? 'var(--accent-color)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'upcoming' ? '2px solid var(--accent-color)' : 'none',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Active Reservations ({upcomingReservations.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === 'past' ? 'var(--accent-color)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'past' ? '2px solid var(--accent-color)' : 'none',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Past Bookings ({pastReservations.length})
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(activeTab === 'upcoming' ? upcomingReservations : pastReservations).length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  <FileText size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  <p>No reservations found for this view.</p>
                </div>
              ) : (
                (activeTab === 'upcoming' ? upcomingReservations : pastReservations).map((res) => (
                  <div key={res._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                          {res.date} at {res.startTime}
                        </span>
                        <span className={`badge badge-${res.status}`}>{res.status}</span>
                      </div>
                      
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', gap: '1.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Users size={14} /> {res.guests} Guests
                        </span>
                        <span>
                          Tables: {res.tables.map(t => t.number).join(', ')}
                        </span>
                      </div>

                      {res.notes && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Notes: "{res.notes}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {activeTab === 'upcoming' && !['completed', 'no_show', 'cancelled'].includes(res.status) && (
                        <>
                          <button className="btn btn-secondary" onClick={() => openEdit(res)} title="Edit Reservation" style={{ padding: '0.5rem' }}>
                            <Edit size={16} />
                          </button>
                          <button className="btn btn-danger" onClick={() => handleCancel(res._id)} title="Cancel Booking" style={{ padding: '0.5rem' }}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}

                      {activeTab === 'past' && (
                        <button className="btn btn-success" onClick={() => setRebookingRes(res)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                          <RefreshCw size={14} /> Rebook
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Reservation Modal */}
      {editingId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Update Seating Details</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Guest Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.guestName}
                  onChange={(e) => setEditForm({ ...editForm, guestName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Guest Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={editForm.guestEmail}
                  onChange={(e) => setEditForm({ ...editForm, guestEmail: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Guests</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="20"
                    value={editForm.guests}
                    onChange={(e) => setEditForm({ ...editForm, guests: parseInt(e.target.value, 10) || 1 })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Special Notes</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rebook Modal */}
      {rebookingRes && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>
              One-Click Rebook Reservation
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Rebooking for {rebookingRes.guestName} ({rebookingRes.guests} guests). Please select the new date and time:
            </p>
            <form onSubmit={handleRebookSubmit}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={rebookDate}
                  onChange={(e) => setRebookDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={rebookTime}
                  onChange={(e) => setRebookTime(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRebookingRes(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={rebookLoading}>
                  {rebookLoading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Book Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
