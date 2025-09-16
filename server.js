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
      .select('reminders.id', 'reminders.rule', 'clients.name as client_name', 'clients.id as client_id', 'clients.priority')
      .orderByRaw("CASE clients.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END");
      
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

app.get('/clients', async (req, res) => {
  try {
    const { team_id } = req.user;
    
    const lastContactSubquery = db('interactions')
      .select('client_id')
      .max('date as last_contact_date')
      .groupBy('client_id')
      .as('last_contacts');

    const clients = await db('clients')
      .leftJoin(lastContactSubquery, 'clients.id', 'last_contacts.client_id')
      .where('clients.team_id', team_id)
      .select('clients.*', 'last_contacts.last_contact_date')
      .orderBy('clients.created_at', 'desc');
      
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

app.get('/api/agenda', async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const today = new Date().toISOString().slice(0, 10);
    const agendaItems = await db('agendas')
      .join('clients', 'agendas.client_id', 'clients.id')
      .where('agendas.user_id', user_id)
      .andWhere('agendas.agenda_date', today)
      .andWhere('agendas.status', 'pending')
      .select('agendas.*', 'clients.name as client_name', 'clients.contact_email');
    res.json(agendaItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agenda' });
  }
});

app.post('/api/agenda', async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const { client_id } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const existing = await db('agendas').where({ user_id, client_id, agenda_date: today }).first();
    if (existing) {
      return res.status(409).json({ error: 'Client is already on the agenda for today.' });
    }
    const [newItem] = await db('agendas').insert({ user_id, client_id }).returning('*');
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to agenda' });
  }
});

app.put('/api/agenda/:id', async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const { id } = req.params;
    const { discussion_points, status } = req.body;
    const [updatedItem] = await db('agendas')
      .where({ id, user_id })
      .update({ discussion_points, status })
      .returning('*');
    if (!updatedItem) return res.status(404).json({ error: 'Agenda item not found.' });
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agenda item' });
  }
});

app.delete('/api/agenda/:id', async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const { id } = req.params;
    const count = await db('agendas').where({ id, user_id }).del();
    if (count === 0) return res.status(404).json({ error: 'Agenda item not found.' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from agenda' });
  }
});

app.post('/clients', async (req, res) => {
  try {
    const { team_id } = req.user;
    const { name, contact_email, company, owner, website_url, contact_cadence_days, priority } = req.body;
    if (!name || !contact_email) {
      return res.status(400).json({ error: 'Name and contact_email are required' });
    }
    const [newClient] = await db('clients')
        .insert({ name, contact_email, company, owner, team_id, website_url, contact_cadence_days, priority, prep_notes: '' })
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

app.put('/clients/:id', async (req, res) => {
    try {
        const { team_id } = req.user;
        const { id } = req.params;
        const { name, company, contact_email, owner, tags, website_url, contact_cadence_days, prep_notes, priority } = req.body;
        const updateData = { name, company, contact_email, owner, tags, website_url, contact_cadence_days, prep_notes, priority };

        const [updatedClient] = await db('clients')
            .where({ id: id, team_id: team_id })
            .update(updateData)
            .returning('*');

         if (!updatedClient) {
            return res.status(404).json({ error: 'Client not found or access denied.' });
        }
        res.status(200).json(updatedClient);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update client' });
    }
});

app.delete('/clients/:id', async (req, res) => {
    try {
        const { team_id } = req.user;
        const { id } = req.params;

        const count = await db('clients').where({ id: id, team_id: team_id }).del();
        
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