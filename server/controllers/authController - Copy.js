const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const { accessToken, refreshToken } = generateTokens(user._id);

  // Store refresh token hash in DB
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  setTokenCookies(res, accessToken, refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: { id: user._id, username: user.username, role: user.role },
      accessToken,
    },
  });
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);
    res.json({ success: true, data: { accessToken } });
  } catch {
    return res.status(401).json({ success: false, message: 'Refresh token expired. Please login again.' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = '';
    await user.save();
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully.' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: { user: { id: req.user._id, username: req.user.username, role: req.user.role } },
  });
};

module.exports = { login, refresh, logout, getMe };
