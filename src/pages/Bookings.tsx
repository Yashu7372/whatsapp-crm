import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Calendar } from 'lucide-react';
import { api } from '../services/api';

const statusStyle: Record<string, string> = {
  pending: 'orange', confirmed: 'green', cancelled: 'red', no_show: 'yellow',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Bookings() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  useEffect(() => {
    api.getBookings()
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
    const interval = setInterval(() => api.getBookings().then(setBookings).catch(console.error), 15000);
    return () => clearInterval(interval);
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const days: { date: number; month: number; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--)
      days.push({ date: daysInPrev - i, month: month - 1, isCurrentMonth: false });
    for (let i = 1; i <= daysInMonth; i++)
      days.push({ date: i, month, isCurrentMonth: true });
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++)
      days.push({ date: i, month: month + 1, isCurrentMonth: false });
    return days;
  }, [currentDate]);

  const getBookingsForDay = (day: number, month: number) =>
    bookings.filter(b => {
      if (!b.scheduled_at) return false;
      const d = new Date(b.scheduled_at);
      return d.getDate() === day && d.getMonth() === month;
    });

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading bookings...</div>;

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="icon-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
            <ChevronLeft size={18} />
          </button>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, minWidth: 160, textAlign: 'center' }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button className="icon-btn" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
            <button className={`tab ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>Calendar</button>
            <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><Calendar size={40} style={{ opacity: 0.3 }} /></div>
            <h3>No bookings yet</h3>
            <p>Bookings will appear here when your AI bot captures appointment requests from customers</p>
          </div>
        </div>
      ) : view === 'calendar' ? (
        <div className="card" style={{ padding: 12 }}>
          <div className="calendar-grid">
            {DAYS.map(d => <div className="calendar-header-cell" key={d}>{d}</div>)}
            {calendarDays.map((day, i) => {
              const dayBookings = getBookingsForDay(day.date, day.month);
              const isToday = day.isCurrentMonth && day.date === today.getDate() &&
                currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
              return (
                <div key={i} className={`calendar-cell ${isToday ? 'today' : ''} ${!day.isCurrentMonth ? 'other-month' : ''}`}>
                  <div className="day-num">{day.date}</div>
                  {dayBookings.slice(0, 2).map(b => (
                    <div key={b.id} className="booking-dot" style={{
                      background: b.status === 'confirmed' ? 'var(--accent-glow)' : 'var(--orange-glow)',
                      color: b.status === 'confirmed' ? 'var(--accent)' : 'var(--orange)',
                    }}>
                      {(b.contact_name || '?').split(' ')[0]} · {(b.service_type || 'Appt').split(' ')[0]}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', paddingLeft: 4 }}>+{dayBookings.length - 2} more</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Patient</th><th>Service</th><th>Date & Time</th><th>Duration</th><th>Status</th></tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User size={16} color="var(--text-muted)" />
                        <span style={{ fontWeight: 600 }}>{b.contact_name || b.contact_id}</span>
                      </div>
                    </td>
                    <td>{b.service_type || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' +
                        new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                        <Clock size={13} /> {b.duration_mins || 30}min
                      </span>
                    </td>
                    <td><span className={`badge ${statusStyle[b.status] || 'gray'}`}>{b.status || 'pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
