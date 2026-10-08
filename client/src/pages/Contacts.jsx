import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  Phone, 
  Mail, 
  MessageSquare, 
  Car, 
  Tag, 
  MoreVertical,
  Building,
  UserCheck,
  Send,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_CONTACTS = [
  {
    id: 1,
    name: 'Dr. Ramesh Sharma',
    phone: '+91 98201 44521',
    email: 'ramesh.sharma@apexhealth.in',
    city: 'Coimbatore',
    company: 'Apex Healthcare Trust',
    preferredCar: 'Tata Safari Dark Edition',
    status: 'Booking Confirmed',
    tags: ['VIP', 'Test Drive Done', 'High Budget'],
    lastContacted: 'Today 10:42 AM',
  },
  {
    id: 2,
    name: 'Priya Sundaram',
    phone: '+91 98450 11928',
    email: 'priya.s@novaretail.io',
    city: 'Tirupur',
    company: 'Nova Retail Tech',
    preferredCar: 'Tata Curvv EV 55kWh',
    status: 'Test Drive Scheduled',
    tags: ['EV Enthusiast', 'Subsidy Eligible'],
    lastContacted: 'Today 09:15 AM',
  },
  {
    id: 3,
    name: 'Vikram Malhotra',
    phone: '+91 99100 87341',
    email: 'vikram.m@kryptonlogistics.com',
    city: 'Coimbatore',
    company: 'Krypton Logistics Ltd',
    preferredCar: 'Tata Harrier AT',
    status: 'Quote Sent',
    tags: ['Exchange Vehicle', 'Corporate Discount'],
    lastContacted: 'Yesterday',
  },
  {
    id: 4,
    name: 'Ananya Deshmukh',
    phone: '+91 97690 32189',
    email: 'ananya@zenithcloud.org',
    city: 'Erode',
    company: 'Zenith Cloud Systems',
    preferredCar: 'Tata Nexon DCA',
    status: 'Finance Approved',
    tags: ['First Time Buyer', 'SBI Loan'],
    lastContacted: '2 days ago',
  },
  {
    id: 5,
    name: 'Karthik Subramanian',
    phone: '+91 94430 77123',
    email: 'karthik.s@autoline.in',
    city: 'Salem',
    company: 'Autoline Precision',
    preferredCar: 'Tata Punch EV LR',
    status: 'Inquiry',
    tags: ['WhatsApp Inbound'],
    lastContacted: '3 days ago',
  },
];

const Contacts = () => {
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Coimbatore',
    company: '',
    preferredCar: 'Tata Safari',
    tags: 'VIP'
  });

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Phone,Email,City,Preferred Car,Status\n"
      + contacts.map(c => `"${c.name}","${c.phone}","${c.email}","${c.city}","${c.preferredCar}","${c.status}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tata_motors_crm_contacts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📥 Contacts exported to CSV successfully');
  };

  const handleCreateContact = (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) {
      toast.error('Name and Phone are required');
      return;
    }
    const created = {
      id: Date.now(),
      ...newContact,
      status: 'Inquiry',
      tags: newContact.tags.split(',').map(t => t.trim()),
      lastContacted: 'Just now'
    };
    setContacts([created, ...contacts]);
    setIsAddModalOpen(false);
    toast.success('🎉 Customer profile created!');
    setNewContact({
      name: '',
      phone: '',
      email: '',
      city: 'Coimbatore',
      company: '',
      preferredCar: 'Tata Safari',
      tags: 'VIP'
    });
  };

  const handleDirectWhatsApp = (c) => {
    toast.success(`💬 WhatsApp chat opened for ${c.name} (${c.phone})`);
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.preferredCar.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            Customer Directory
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
            {filteredContacts.length} verified showroom profiles & exchange records
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        background: 'var(--bg-card)', 
        padding: '12px 18px', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border-card)',
        marginBottom: '24px'
      }}>
        <Search size={18} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Search by customer name, phone number, company, or model..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Contacts Table */}
      <div className="card-glass" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 16px' }}>Customer</th>
              <th style={{ padding: '14px 16px' }}>Contact Info</th>
              <th style={{ padding: '14px 16px' }}>Preferred Model</th>
              <th style={{ padding: '14px 16px' }}>Tags / Segments</th>
              <th style={{ padding: '14px 16px' }}>Showroom Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
              <tr key={contact.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '13px'
                    }}>
                      {contact.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{contact.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{contact.company || contact.city}</div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Phone size={13} color="var(--text-muted)" />
                    <span>{contact.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <Mail size={13} />
                    <span>{contact.email}</span>
                  </div>
                </td>

                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#10b981' }}>
                    <Car size={14} />
                    <span>{contact.preferredCar}</span>
                  </div>
                </td>

                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {contact.tags.map((tag, idx) => (
                      <span key={idx} style={{
                        fontSize: '11px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-card)',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        color: 'var(--text-secondary)',
                        fontWeight: 600
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>

                <td style={{ padding: '16px' }}>
                  <span className="badge-pro-tag">{contact.status}</span>
                </td>

                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleDirectWhatsApp(contact)}
                    className="btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <MessageSquare size={13} /> Chat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Contact Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Create New Customer Profile</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>FULL NAME *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Anand Mahindra" 
                  className="input-field" 
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>PHONE *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="+91 98201 44521" 
                    className="input-field" 
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>EMAIL</label>
                  <input 
                    type="email" 
                    placeholder="email@domain.com" 
                    className="input-field" 
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>CITY</label>
                  <input 
                    type="text" 
                    placeholder="Coimbatore" 
                    className="input-field" 
                    value={newContact.city}
                    onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>PREFERRED MODEL</label>
                  <select 
                    className="input-field"
                    value={newContact.preferredCar}
                    onChange={(e) => setNewContact({ ...newContact, preferredCar: e.target.value })}
                  >
                    <option value="Tata Safari">Tata Safari</option>
                    <option value="Tata Harrier">Tata Harrier</option>
                    <option value="Tata Curvv EV">Tata Curvv EV</option>
                    <option value="Tata Nexon">Tata Nexon</option>
                    <option value="Tata Punch EV">Tata Punch EV</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>TAGS (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="VIP, Test Drive Done, Exchange" 
                  className="input-field" 
                  value={newContact.tags}
                  onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
