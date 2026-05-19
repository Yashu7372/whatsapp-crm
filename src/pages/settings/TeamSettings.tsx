import { useState } from 'react';
import { UserPlus, Shield, Mail, Trash2, CheckCircle, Crown, Eye, MessageSquare, X } from 'lucide-react';

type Role = 'owner' | 'agent' | 'viewer';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'invited';
  joinedAt?: string;
}

const PERMISSIONS: { label: string; owner: boolean; agent: boolean; viewer: boolean }[] = [
  { label: 'View all conversations',   owner: true,  agent: true,  viewer: true  },
  { label: 'Reply to customers',       owner: true,  agent: true,  viewer: false },
  { label: 'Take over from AI bot',    owner: true,  agent: true,  viewer: false },
  { label: 'Close/reopen conversations', owner: true, agent: true, viewer: false },
  { label: 'View contacts',            owner: true,  agent: true,  viewer: true  },
  { label: 'Create campaigns',         owner: true,  agent: false, viewer: false },
  { label: 'Manage FAQ / bot config',  owner: true,  agent: false, viewer: false },
  { label: 'Invite or remove team',    owner: true,  agent: false, viewer: false },
  { label: 'Billing & subscription',   owner: true,  agent: false, viewer: false },
];

const roleIcon: Record<Role, React.ReactNode> = {
  owner: <Crown size={13} />,
  agent: <MessageSquare size={13} />,
  viewer: <Eye size={13} />,
};
const roleColors: Record<Role, string> = { owner: 'purple', agent: 'blue', viewer: 'gray' };
const roleDescriptions: Record<Role, string> = {
  owner: 'Full access — can configure, invite, and manage billing',
  agent: 'Can reply to customers and manage conversations',
  viewer: 'Read-only access to conversations and contacts',
};

const avatarColors = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#0891b2'];

const INITIAL_TEAM: TeamMember[] = [];

export default function TeamSettings() {
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('agent');
  const [inviteError, setInviteError] = useState('');
  const [saved, setSaved] = useState('');

  const handleInvite = () => {
    if (!inviteEmail.trim()) { setInviteError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(inviteEmail)) { setInviteError('Enter a valid email'); return; }
    if (team.some(m => m.email === inviteEmail.trim())) { setInviteError('This email is already in the team'); return; }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteName.trim() || inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'invited',
      joinedAt: new Date().toISOString(),
    };
    setTeam([...team, newMember]);
    setSaved(`Invitation sent to ${newMember.email}`);
    setTimeout(() => setSaved(''), 3000);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('agent');
    setInviteError('');
    setShowInvite(false);
  };

  const handleRoleChange = (id: string, role: Role) => {
    setTeam(team.map(m => m.id === id ? { ...m, role } : m));
    setSaved('Role updated');
    setTimeout(() => setSaved(''), 2000);
  };

  const handleRemove = (id: string) => {
    const member = team.find(m => m.id === id);
    if (!member) return;
    if (member.role === 'owner' && team.filter(m => m.role === 'owner').length === 1) {
      alert('Cannot remove the only owner');
      return;
    }
    setTeam(team.filter(m => m.id !== id));
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Team Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Invite team members and manage their access permissions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600 }}>
              <CheckCircle size={14} /> {saved}
            </span>
          )}
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
            <UserPlus size={16} /> Invite Member
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: 28, width: '100%', maxWidth: 480,
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Invite Team Member</h3>
              <button className="icon-btn" onClick={() => { setShowInvite(false); setInviteError(''); }}><X size={18} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Name (optional)</label>
              <input className="form-input" placeholder="e.g. John Smith"
                value={inviteName} onChange={e => setInviteName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" placeholder="colleague@business.com"
                value={inviteEmail} onChange={e => { setInviteEmail(e.target.value); setInviteError(''); }} />
              {inviteError && <p style={{ color: 'var(--red)', fontSize: '0.78rem', marginTop: 4 }}>{inviteError}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['owner', 'agent', 'viewer'] as Role[]).map(role => (
                  <label key={role} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14,
                    border: `2px solid ${inviteRole === role ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    background: inviteRole === role ? 'var(--accent-glow)' : 'var(--bg-primary)',
                    transition: 'all var(--transition)',
                  }}>
                    <input type="radio" name="role" value={role}
                      checked={inviteRole === role} onChange={() => setInviteRole(role)}
                      style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.88rem' }}>
                        <span className={`badge ${roleColors[role]}`}>{roleIcon[role]} {role}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{roleDescriptions[role]}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => { setShowInvite(false); setInviteError(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleInvite}>
                <Mail size={15} /> Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Table */}
      <div className="card" style={{ padding: 0, marginBottom: 20 }}>
        {team.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div className="empty-icon"><UserPlus size={36} style={{ opacity: 0.3 }} /></div>
            <h3>No team members yet</h3>
            <p>Invite colleagues to help manage conversations and customers</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowInvite(true)}>
              <UserPlus size={14} /> Invite First Member
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member, i) => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: avatarColors[i % avatarColors.length],
                          fontWeight: 700, fontSize: '0.78rem', color: '#fff',
                        }}>
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{member.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Mail size={13} color="var(--text-muted)" /> {member.email}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: '4px 8px', fontSize: '0.82rem', width: 'auto', minWidth: 100 }}
                        value={member.role}
                        onChange={e => handleRoleChange(member.id, e.target.value as Role)}
                      >
                        <option value="owner">👑 Owner</option>
                        <option value="agent">💬 Agent</option>
                        <option value="viewer">👁 Viewer</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${member.status === 'active' ? 'green' : 'orange'}`}>
                        {member.status === 'active' ? '● Active' : '⏳ Invited'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        style={{ color: 'var(--red)', width: 32, height: 32 }}
                        onClick={() => handleRemove(member.id)}
                        title="Remove member"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Matrix */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={17} /> Role Permissions
          </h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          Permissions are fixed per role. Change a member's role above to adjust their access.
        </p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Permission</th>
                <th style={{ textAlign: 'center' }}>
                  <span className="badge purple"><Crown size={11} /> Owner</span>
                </th>
                <th style={{ textAlign: 'center' }}>
                  <span className="badge blue"><MessageSquare size={11} /> Agent</span>
                </th>
                <th style={{ textAlign: 'center' }}>
                  <span className="badge gray"><Eye size={11} /> Viewer</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((perm, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{perm.label}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1rem' }}>{perm.owner ? '✅' : '—'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1rem' }}>{perm.agent ? '✅' : '—'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1rem' }}>{perm.viewer ? '✅' : '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
