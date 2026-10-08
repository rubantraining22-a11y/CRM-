// Role capabilities matrix
export const ROLE_PERMISSIONS = {
  admin: {
    roleName: 'Administrator (Full Control)',
    canAccessSettings: true,
    canBulkBroadcast: true,
    canManageTeam: true,
    canEditLeads: true,
    canSendMessages: true,
    canViewAnalytics: true,
    canManageMetaAPI: true,
    canUploadMedia: true,
    description: 'Unrestricted master access to all CRM showroom operations, API keys, team roles, and bulk messaging.',
  },
  sales: {
    roleName: 'Sales Team Executive',
    canAccessSettings: false,
    canBulkBroadcast: true,
    canManageTeam: false,
    canEditLeads: true,
    canSendMessages: true,
    canViewAnalytics: true,
    canManageMetaAPI: false,
    canUploadMedia: true,
    description: 'Direct sales desk access: lead follow-ups, test-drive scheduling, live WhatsApp chats, and customer quotes.',
  },
  user: {
    roleName: 'Standard User (Read-Only / Basic)',
    canAccessSettings: false,
    canBulkBroadcast: false,
    canManageTeam: false,
    canEditLeads: false,
    canSendMessages: false,
    canViewAnalytics: true,
    canManageMetaAPI: false,
    canUploadMedia: false,
    description: 'Standard viewer access to showroom dashboard and customer directory with write/send restrictions.',
  },
};

// Seed team members for Tata Motors showroom
export let teamUsers = [
  {
    id: 'usr_admin_ruban',
    name: 'Ruban',
    email: 'ruban@tatamotors.com',
    role: 'admin',
    showroom: 'Tata Motors SGA Hub - Coimbatore',
    activeLeads: 24,
    testDrives: 12,
    closedDeals: 8,
  },
  {
    id: 'usr_sales_2',
    name: 'Priya Sharma',
    email: 'priya.sharma@tatamotors.com',
    role: 'sales',
    showroom: 'Tata Motors SGA Hub - Coimbatore',
    activeLeads: 18,
    testDrives: 9,
    closedDeals: 5,
  },
  {
    id: 'usr_sales_3',
    name: 'Arun Patel',
    email: 'arun.patel@tatamotors.com',
    role: 'sales',
    showroom: 'Tata Motors SGA Hub - Coimbatore',
    activeLeads: 15,
    testDrives: 7,
    closedDeals: 4,
  },
  {
    id: 'usr_basic_4',
    name: 'Kavitha Murugan',
    email: 'kavitha.m@tatamotors.com',
    role: 'user',
    showroom: 'Tata Motors SGA Hub - Coimbatore',
    activeLeads: 5,
    testDrives: 2,
    closedDeals: 1,
  },
];

export const login = (req, res) => {
  const { email, role } = req.body;
  const targetUser = teamUsers.find((u) => u.email === email) || {
    id: 'usr_admin_ruban',
    name: email ? email.split('@')[0] : 'Ruban',
    email: email || 'ruban@tatamotors.com',
    role: role || 'admin',
    showroom: 'Tata Motors SGA Hub - Coimbatore',
  };

  const assignedRole = role || targetUser.role || 'admin';
  const updatedUser = { ...targetUser, role: assignedRole };

  return res.json({
    token: `jwt_secure_auth_token_crm_${Date.now()}`,
    user: updatedUser,
    permissions: ROLE_PERMISSIONS[assignedRole] || ROLE_PERMISSIONS.admin,
  });
};

export const getMe = (req, res) => {
  const user = req.user || teamUsers[0];
  const role = user.role || 'admin';
  return res.json({
    user,
    permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.admin,
  });
};

export const getTeamUsers = (req, res) => {
  res.json({
    users: teamUsers,
    roles: ROLE_PERMISSIONS,
  });
};

export const updateUserRole = (req, res) => {
  const { userId, newRole } = req.body;
  if (!ROLE_PERMISSIONS[newRole]) {
    return res.status(400).json({ error: `Invalid role: ${newRole}. Must be admin, sales, or user.` });
  }

  const user = teamUsers.find((u) => u.id === userId);
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  user.role = newRole;
  res.json({
    success: true,
    user,
    permissions: ROLE_PERMISSIONS[newRole],
  });
};
