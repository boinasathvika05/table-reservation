import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { 
  DollarSign, Calendar, LayoutGrid, AlertCircle, TrendingUp, UserCheck, 
  Search, ChevronLeft, ChevronRight, Check, X, ShieldAlert 
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters State
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({
    status: '',
    date: new Date().toISOString().split('T')[0], // Defaults to today
    search: '',
    guests: ''
  });

  const { showToast } = useToast();

  const [settings, setSettings] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await api.get(`/reservations/stats?date=${filters.date}`);
      if (statsRes.success) {
        setStats(statsRes.data);
      }

      // 2. Fetch Tables (to display status grid)
      const tablesRes = await api.get('/tables');
      if (tablesRes.success) {
        setTables(tablesRes.data.tables);
      }

      // 3. Fetch Settings (for currency symbol)
      const settingsRes = await api.get('/settings');
      if (settingsRes.success) {
        setSettings(settingsRes.data.settings);
      }

      // 4. Fetch Paginated & Filtered Reservations
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      });
      const resRes = await api.get(`/reservations?${queryParams.toString()}`);
      if (resRes.success) {
        setReservations(resRes.data.reservations);
        setTotal(resRes.meta.total);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load operational data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters, showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle filter changes (Reset page to 1)
  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  };

  // Check In Guest Action
  const handleCheckIn = async (id) => {
    try {
      const res = await api.put(`/reservations/${id}/check-in`);
      if (res.success) {
        showToast('Guest checked in successfully!', 'success');
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Unable to check in guest.', 'error');
    }
  };

  // Cancel Booking Action
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await api.put(`/reservations/${id}/cancel`);
      if (res.success) {
        showToast('Booking cancelled.', 'success');
        loadDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Unable to cancel booking.', 'error');
    }
  };

  // Helper to determine if a table is currently occupied
  // For the active date filter, check if the table ID is assigned in any checked_in or confirmed reservations
  const getTableStatus = (tableId) => {
    // If the table is in maintenance
    const tbl = tables.find(t => t._id === tableId);
    if (tbl && tbl.status === 'maintenance') return 'maintenance';

    // Check if table is currently assigned to a checked_in or confirmed reservation on the active date filter
    const activeRes = reservations.find(r => 
      ['confirmed', 'checked_in'].includes(r.status) &&
      r.tables.some(t => t._id === tableId)
    );

    if (activeRes) {
      return activeRes.status === 'checked_in' ? 'occupied' : 'booked';
    }
    return 'available';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Analytics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="card stat-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(17, 24, 39, 0.5) 100%)' }}>
            <div className="stat-header">
              <span>Estimated Revenue</span>
              <DollarSign size={18} />
            </div>
            <div className="stat-value">{settings?.currency || '$'}{stats.basic.estimatedRevenue}</div>
            <div className="stat-footer">Based on average spend per guest</div>
          </div>

          <div className="card stat-card">
            <div className="stat-header">
              <span>Today's Covers</span>
              <Calendar size={18} />
            </div>
            <div className="stat-value">{stats.basic.totalReservations}</div>
            <div className="stat-footer">Bookings for target date</div>
          </div>

          <div className="card stat-card">
            <div className="stat-header">
              <span>Occupancy Percentage</span>
              <TrendingUp size={18} />
            </div>
            <div className="stat-value">{stats.basic.occupancyPercentage}%</div>
            <div className="stat-footer">{stats.basic.occupiedTables} / {stats.basic.occupiedTables + stats.basic.availableTables} tables occupied</div>
          </div>

          <div className="card stat-card">
            <div className="stat-header">
              <span>Repeat Customers</span>
              <UserCheck size={18} />
            </div>
            <div className="stat-value">{stats.advanced.repeatCustomers}</div>
            <div className="stat-footer">Guests with &gt; 1 bookings</div>
          </div>
        </div>
      )}

      {/* Advanced Stats Details */}
      {stats && (
        <div className="grid grid-cols-4">
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avg. Group Size</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>{stats.advanced.averageGuests} guests</div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Most Popular Table</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>Table {stats.advanced.mostPopularTable.number} ({stats.advanced.mostPopularTable.count} bookings)</div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Avg. Booking Lead Time</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>{stats.advanced.averageLeadTimeDays} days</div>
          </div>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Peak Booking Hour</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.25rem' }}>{stats.advanced.peakBookingHour}</div>
          </div>
        </div>
      )}

      {/* Floor Occupancy Layout Grid */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LayoutGrid size={20} style={{ color: 'var(--accent-color)' }} />
          Restaurant Floor Layout Map ({filters.date})
        </h3>
        
        {tables.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No tables configured on the floor layout.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
            {tables.map(table => {
              const status = getTableStatus(table._id);
              let cardBg = 'rgba(255, 255, 255, 0.03)';
              let borderColor = 'var(--border-color)';
              let statusText = 'Available';

              if (status === 'occupied') {
                cardBg = 'rgba(59, 130, 246, 0.1)';
                borderColor = 'var(--info-color)';
                statusText = 'Checked In';
              } else if (status === 'booked') {
                cardBg = 'rgba(16, 185, 129, 0.1)';
                borderColor = 'var(--success-color)';
                statusText = 'Booked';
              } else if (status === 'maintenance') {
                cardBg = 'rgba(239, 68, 68, 0.05)';
                borderColor = 'var(--error-color)';
                statusText = 'Maint.';
              }

              return (
                <div 
                  key={table._id} 
                  style={{
                    backgroundColor: cardBg,
                    border: `2px solid ${borderColor}`,
                    borderRadius: 'var(--border-radius-md)',
                    padding: '1rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>{table.number}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cap: {table.capacity}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.25rem', color: borderColor === 'var(--border-color)' ? 'var(--text-secondary)' : borderColor }}>
                    {statusText}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter and Table of Bookings */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Reservation Bookings Manager</h3>
          
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem', width: '200px', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                placeholder="Search Guest..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <input
              type="date"
              className="form-input"
              style={{ width: '150px', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            />

            <select
              className="form-input"
              style={{ width: '150px', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
        </div>

        {/* Table representation */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : reservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <ShieldAlert size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <p>No reservations matching criteria found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Email</th>
                  <th>Date & Time</th>
                  <th>Guests</th>
                  <th>Assigned Tables</th>
                  <th>Estimated Revenue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res._id}>
                    <td style={{ fontWeight: 700 }}>{res.guestName}</td>
                    <td>{res.guestEmail}</td>
                    <td>
                      <div>{res.date}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{res.startTime} - {res.endTime}</div>
                    </td>
                    <td>{res.guests}</td>
                    <td>{res.tables.map(t => t.number).join(', ')}</td>
                    <td style={{ fontWeight: 700 }}>{settings?.currency || '$'}{res.estimatedRevenue}</td>
                    <td>
                      <span className={`badge badge-${res.status}`}>{res.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {res.status === 'confirmed' && (
                          <button 
                            className="btn btn-success" 
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => handleCheckIn(res._id)}
                            title="Check In Guest"
                          >
                            <Check size={14} /> Check In
                          </button>
                        )}
                        
                        {!['completed', 'cancelled', 'no_show'].includes(res.status) && (
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => handleCancel(res._id)}
                            title="Cancel Booking"
                          >
                            <X size={14} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Showing Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem' }} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem' }} 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
