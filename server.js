import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './db/index.js';
import authRouter from './auth.js';
import authMiddleware from './middleware/auth.js';
import cron from 'node-cron';
import { generateReminders } from './reminders.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.BASE_URL }));
app.use(express.json());

app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Cueboard API is alive!' });
});

app.use(authMiddleware);

app.get('/api/reminders', async (req, res) => {
  try {
    const { team_id } = req.user;
    const reminders = await db('reminders')
      .join('clients', 'reminders.client_id', 'clients.id')
      .where('clients.team_id', team_id)
      .andWhere('reminders.status', 'pending')
      .select('reminders.id', 'reminders.rule', 'clients.name as client_name', 'clients.id as client_id');
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

app.get('/clients', async (req, res) => {
  try {
    const { team_id } = req.user;
    const clients = await db('clients').where({ team_id }).select('*').orderBy('created_at', 'desc');
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

app.post('/clients', async (req, res) => {
  try {
    const { team_id } = req.user;
    const { name, contact_email, company, owner } = req.body;
    if (!name || !contact_email) {
      return res.status(400).json({ error: 'Name and contact_email are required' });
    }
    const [newClient] = await db('clients')
        .insert({ name, contact_email, company, owner, team_id })
        .returning('*');
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

app.put('/api/reminders/:id', async (req, res) => {
  try {
    const { team_id } = req.user;
    const { id: reminderId } = req.params;
    const { status } = req.body;

    // A security check to ensure the reminder being updated belongs to a client on the user's team.
    const reminder = await db('reminders')
      .join('clients', 'reminders.client_id', 'clients.id')
      .where('reminders.id', reminderId)
      .andWhere('clients.team_id', team_id)
      .first();
      
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found or access denied.' });
    }
    
    await db('reminders').where({ id: reminderId }).update({ status });
    res.status(200).json({ message: 'Reminder updated successfully.' });

  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// PUT /clients/:id - Update a client by ID
app.put('/clients/:id', async (req, res) => {
    try {
        const { team_id } = req.user;
        const { id } = req.params;
        const updates = req.body;
        
        const [updatedClient] = await db('clients')
            .where({ id: id, team_id: team_id }) // Security check
            .update(updates)
            .returning('*');

         if (!updatedClient) {
            return res.status(404).json({ error: 'Client not found or access denied.' });
        }
        res.status(200).json(updatedClient);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// DELETE /clients/:id - Delete a client by ID
app.delete('/clients/:id', async (req, res) => {
    try {
        const { team_id } = req.user;
        const { id } = req.params;

        const count = await db('clients').where({ id: id, team_id: team_id }).del(); // Security check
        
        if (count === 0) {
            return res.status(404).json({ error: 'Client not found or access denied.' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

app.get('/clients/:id/interactions', async (req, res) => {
    try {
        const { team_id } = req.user;
        const { id: client_id } = req.params;

        const client = await db('clients').where({ id: client_id, team_id }).first();
        if (!client) {
            return res.status(404).json({ error: 'Client not found or access denied.' });
        }
        
        const interactions = await db('interactions')
            .join('users', 'interactions.user_id', 'users.id')
            .where({ client_id })
            .select('interactions.*', 'users.email as user_email')
            .orderBy('date', 'desc');

        res.status(200).json(interactions);
    } catch (error) {
        console.error("Error fetching interactions:", error);
        res.status(500).json({ error: 'Failed to fetch interactions' });
    }
});

app.post('/clients/:id/interactions', async (req, res) => {
    try {
        const { team_id, id: user_id, email: user_email } = req.user;
        const { id: client_id } = req.params;
        const { type, notes, next_action_date } = req.body;

        const client = await db('clients').where({ id: client_id, team_id }).first();
        if (!client) {
            return res.status(404).json({ error: 'Client not found or access denied.' });
        }
        if (!type || !notes) {
            return res.status(400).json({ error: 'Interaction type and notes are required' });
        }

        const insertData = { client_id, type, notes, user_id };
        if (next_action_date) {
            insertData.next_action_date = next_action_date;
        }

        const [newInteraction] = await db('interactions').insert(insertData).returning('*');
        const finalInteraction = { ...newInteraction, user_email };

        res.status(201).json(finalInteraction);
    } catch (error) {
        console.error("Error creating interaction:", error);
        res.status(500).json({ error: 'Failed to create interaction' });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

cron.schedule('0 2 * * *', generateReminders);