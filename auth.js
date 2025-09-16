import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-super-secret-key';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { team_name, email, password } = req.body;

  if (!team_name || !email || !password) {
    return res.status(400).json({ error: 'Team name, email, and password are required.' });
  }

  try {
    // Use a transaction to ensure both team and user are created, or neither.
    await db.transaction(async (trx) => {
      // 1. Create the team
      const [newTeam] = await trx('teams').insert({ name: team_name }).returning('*');

      // 2. Hash the password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // 3. Create the user linked to the new team
      const [newUser] = await trx('users').insert({
        email,
        password_hash,
        team_id: newTeam.id,
      }).returning(['id', 'email', 'team_id']);

      res.status(201).json({ message: 'Registration successful!', user: newUser, team: newTeam });
    });
  } catch (error) {
    // Check for unique constraint violation (e.g., team name or email already exists)
    if (error.code === '23505') {
       return res.status(409).json({ error: 'A team or user with that name/email already exists.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Find the user by email
        const user = await db('users').where({ email }).first();
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Create a JWT token
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                team_id: user.team_id,
            },
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login.' });
    }
});


export default router;