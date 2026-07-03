import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { Settings, Save, Clock, Users, ShieldAlert, DollarSign } from 'lucide-react';

const SettingsManager = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
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
    fetchSettings();
  }, [showToast]);

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

  const handleChange = (key, val) => {
    setSettings(prev => ({
      ...prev,
      [key]: val
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '800px' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Settings size={20} style={{ color: 'var(--accent-color)' }} />
        Configure Global Floor Parameters
      </h3>

      {settings && (
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* Hours Block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={16} /> Operational Hours
              </h4>

              <div className="form-group">
                <label className="form-label">Opening Hours (24h)</label>
                <input
                  type="time"
                  className="form-input"
                  value={settings.openingHour}
                  onChange={(e) => handleChange('openingHour', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Closing Hours (24h)</label>
                <input
                  type="time"
                  className="form-input"
                  value={settings.closingHour}
                  onChange={(e) => handleChange('closingHour', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Seating Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  min="30"
                  max="300"
                  step="15"
                  value={settings.reservationDuration}
                  onChange={(e) => handleChange('reservationDuration', parseInt(e.target.value, 10) || 120)}
                  required
                />
              </div>
            </div>

            {/* Constraints Block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Users size={16} /> Capacity & Policy
              </h4>

              <div className="form-group">
                <label className="form-label">Max Group Guests per Booking</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="100"
                  value={settings.maxGuestsPerBooking}
                  onChange={(e) => handleChange('maxGuestsPerBooking', parseInt(e.target.value, 10) || 20)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cancellation Limit (hours before booking)</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max="168"
                  value={settings.cancellationWindowHours}
                  onChange={(e) => handleChange('cancellationWindowHours', parseInt(e.target.value, 10) || 24)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Advance Booking Limit (days)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="365"
                  value={settings.advanceBookingDaysLimit}
                  onChange={(e) => handleChange('advanceBookingDaysLimit', parseInt(e.target.value, 10) || 90)}
                  required
                />
              </div>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
            {/* Financial Parameters */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <DollarSign size={14} /> Estimated Average Spend per Cover ($)
              </label>
              <input
                type="number"
                className="form-input"
                min="0"
                value={settings.averageSpendPerGuest}
                onChange={(e) => handleChange('averageSpendPerGuest', parseFloat(e.target.value) || 0)}
                required
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Calculates estimated revenue in metrics: $ \text{Guests} \times \text{Spend} $.
              </p>
            </div>

            {/* Buffer Intervals */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14} /> Table Reset Buffer Interval (minutes)
              </label>
              <input
                type="number"
                className="form-input"
                min="0"
                max="120"
                step="5"
                value={settings.bufferTimeMinutes}
                onChange={(e) => handleChange('bufferTimeMinutes', parseInt(e.target.value, 10) || 15)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saveLoading}>
              <Save size={16} />
              {saveLoading ? 'Saving Config...' : 'Apply Operational Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SettingsManager;
