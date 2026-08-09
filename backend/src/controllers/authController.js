import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || 'super_secret_live_quiz_key_2026';
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const userRole = role === 'admin' ? 'admin' : 'student';
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: userRole,
    });

    console.log(`👤 New user registered: ${user.name} (${user.email}) as ${user.role}`);

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    console.log(`🔐 Login attempt for email: ${cleanEmail}`);

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      console.warn(`❌ Login failed: User not found for email ${cleanEmail}`);
      return res.status(401).json({ message: 'Invalid credentials. User account does not exist.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn(`❌ Login failed: Password mismatch for ${cleanEmail}`);
      return res.status(401).json({ message: 'Invalid credentials. Password is incorrect.' });
    }

    console.log(`✅ Login successful for ${user.name} (${user.role})`);
    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

export const getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};
