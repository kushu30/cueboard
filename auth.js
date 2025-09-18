import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Team from '../models/team.js';
import User from '../models/user.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-super-secret-key';

router.post('/company', async (req, res) => {
  const { team_name } = req.body;
  if (!team_name) {
    return res.status(400).json({ error: 'Company name is required.' });
  }

  try {
    const invite_code = crypto.randomBytes(8).toString('hex');
    const newTeam = await Team.create({ name: team_name, invite_code });
    res.status(201).json(newTeam);
  } catch (error) {
    if (error.code === 11000) {
       return res.status(409).json({ error: 'A company with that name already exists.' });
    }
    res.status(500).json({ error: 'Server error during company registration.' });
  }
});

router.post('/register', async (req, res) => {
  const { email, password, invite_code } = req.body;
  if (!email || !password || !invite_code) {
    return res.status(400).json({ error: 'Email, password, and invite code are required.' });
  }

  try {
    const team = await Team.findOne({ invite_code });
    if (!team) {
      return res.status(404).json({ error: 'Invalid invite code.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password_hash,
      team_id: team._id,
    });

    const userResponse = { id: newUser._id, email: newUser.email, team_id: newUser.team_id };
    res.status(201).json({ message: 'User registration successful!', user: userResponse });
  } catch (error) {
    if (error.code === 11000) {
       return res.status(409).json({ error: 'A user with that email already exists.' });
    }
    res.status(500).json({ error: 'Server error during user registration.' });
  }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const payload = { user: { id: user._id, email: user.email, team_id: user.team_id } };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login.' });
    }
});

export default router;