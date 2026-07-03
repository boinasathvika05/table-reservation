import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Settings, Save, Clock, Users, ShieldAlert, DollarSign, Calendar, TableProperties, Bell, Trash2, Plus, AlertTriangle } from 'lucide-react';

const SettingsManager = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  const [newHoliday, setNewHoliday] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [showToast]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.success) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch global restaurant limits.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await api.put('/settings', settings);
      if (res.success) {
        showToast('Restaurant configurations updated successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save configurations.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReset = async () => {
    setResetLoading(true);
    try {
      const res = await api.post('/settings/reset');
      if (res.success) {
        showToast('Settings reset to factory defaults successfully!', 'success');
        setSettings(res.data.settings);
        setShowResetModal(false);
      }
    } catch (err) {
      showToast(err.message || 'Failed to reset configurations.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleChange = (key, val) => {
    setSettings(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleAddHoliday = () => {
    if (!newHoliday) return;
    if (settings.holidayDates.includes(newHoliday)) {
      showToast('This date is already a holiday.', 'error');
      return;
    }
    handleChange('holidayDates', [...settings.holidayDates, newHoliday].sort());
    setNewHoliday('');
  };

  const handleRemoveHoliday = (dateToRemove) => {
    handleChange('holidayDates', settings.holidayDates.filter(d => d !== dateToRemove));
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={24} style={{ color: 'var(--accent-color)' }} />
          Configure Global Operations
        </h3>
        <button className="btn btn-danger" onClick={() => setShowResetModal(true)}>
          <ShieldAlert size={16} /> Reset to Defaults
        </button>
      </div>

      {settings && (
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* Restaurant Hours */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} /> Restaurant Hours
              </h4>
              <div className="form-group">
                <label className="form-label">Opening Time (24h)</label>
                <input type="time" className="form-input" value={settings.openingHour} onChange={(e) => handleChange('openingHour', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Closing Time (24h)</label>
                <input type="time" className="form-input" value={settings.closingHour} onChange={(e) => handleChange('closingHour', e.target.value)} required />
              </div>
            </div>

            {/* Reservation Rules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} /> Reservation Rules
              </h4>
              <div className="form-group">
                <label className="form-label">Reservation Duration (minutes)</label>
                <input type="number" className="form-input" min="30" max="300" step="15" value={settings.reservationDuration} onChange={(e) => handleChange('reservationDuration', parseInt(e.target.value, 10) || 120)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Buffer Time Between Reservations (mins)</label>
                <input type="number" className="form-input" min="0" max="120" step="5" value={settings.bufferTimeMinutes} onChange={(e) => handleChange('bufferTimeMinutes', parseInt(e.target.value, 10) || 15)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Max Guests Per Booking</label>
                <input type="number" className="form-input" min="1" max="100" value={settings.maxGuestsPerBooking} onChange={(e) => handleChange('maxGuestsPerBooking', parseInt(e.target.value, 10) || 20)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Advance Booking Days Limit</label>
                <input type="number" className="form-input" min="1" max="365" value={settings.advanceBookingDaysLimit} onChange={(e) => handleChange('advanceBookingDaysLimit', parseInt(e.target.value, 10) || 90)} required />
              </div>
            </div>

            {/* Cancellation & Business */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} /> Cancellation & Business
              </h4>
              <div className="form-group">
                <label className="form-label">Cancellation Window (hours prior)</label>
                <input type="number" className="form-input" min="0" max="168" value={settings.cancellationWindowHours} onChange={(e) => handleChange('cancellationWindowHours', parseInt(e.target.value, 10) || 24)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input type="text" className="form-input" value={settings.currency} onChange={(e) => handleChange('currency', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Average Spend Per Guest ({settings.currency})</label>
                <input type="number" className="form-input" min="0" step="0.01" value={settings.averageSpendPerGuest} onChange={(e) => handleChange('averageSpendPerGuest', parseFloat(e.target.value) || 0)} required />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!settings.weekendRestrictions} onChange={(e) => handleChange('weekendRestrictions', !e.target.checked)} />
                  Enable Weekend Bookings
                </label>
                {settings.weekendRestrictions && <p style={{ fontSize: '0.75rem', color: 'var(--error-color)' }}>Saturday and Sunday bookings are currently disabled.</p>}
              </div>
            </div>

            {/* Holiday Management */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} /> Holiday Management
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reservations are disabled on these dates.</p>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="date" className="form-input" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} style={{ flexGrow: 1 }} />
                <button type="button" className="btn btn-secondary" onClick={handleAddHoliday}><Plus size={16} /> Add</button>
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {settings.holidayDates.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No holidays configured.</div>
                ) : (
                  settings.holidayDates.map(date => (
                    <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: '4px' }}>
                      <span style={{ fontSize: '0.9rem' }}>{date}</span>
                      <button type="button" onClick={() => handleRemoveHoliday(date)} style={{ background: 'none', border: 'none', color: 'var(--error-color)', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Table Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TableProperties size={18} /> Table Settings
              </h4>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.enableTableJoining} onChange={(e) => handleChange('enableTableJoining', e.target.checked)} />
                  Enable Table Joining (Auto-combine tables for large parties)
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Maximum Tables to Join</label>
                <input type="number" className="form-input" min="1" max="10" value={settings.maxTablesPerReservation} onChange={(e) => handleChange('maxTablesPerReservation', parseInt(e.target.value, 10) || 1)} disabled={!settings.enableTableJoining} required />
              </div>
            </div>

            {/* Notifications */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} /> Notifications
              </h4>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.enableEmailNotifications} onChange={(e) => handleChange('enableEmailNotifications', e.target.checked)} />
                  Enable Email Confirmations
                </label>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.enableBookingReminders} onChange={(e) => handleChange('enableBookingReminders', e.target.checked)} />
                  Enable Booking Reminders
                </label>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={settings.enableCancellationNotifications} onChange={(e) => handleChange('enableCancellationNotifications', e.target.checked)} />
                  Enable Cancellation Notifications
                </label>
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="submit" className="btn btn-primary" disabled={saveLoading} style={{ padding: '0.75rem 2rem' }}>
              <Save size={18} />
              {saveLoading ? 'Saving...' : 'Apply Operational Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <AlertTriangle size={48} style={{ color: 'var(--error-color)', margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Reset to Defaults?</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                This action will permanently erase your current configuration and restore all settings to their factory defaults. This cannot be undone.
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowResetModal(false)} style={{ flex: 1, justifyContent: 'center' }} disabled={resetLoading}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleReset} style={{ flex: 1, justifyContent: 'center' }} disabled={resetLoading}>
                {resetLoading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsManager;
