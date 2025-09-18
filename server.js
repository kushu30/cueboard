import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import connectDB from './config/db.js';
import authRouter from './auth.js';
import authMiddleware from './middleware/auth.js';
import { generateReminders } from './reminders.js';
import Client from './models/client.js';
import User from './models/user.js';
import Interaction from './models/interaction.js';
import Reminder from './models/reminder.js';

connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

app.use(authMiddleware);

app.get('/api/users/me', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password_hash');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

app.get('/api/reminders', async (req, res) => {
  try {
    const { team_id } = req.user;
    const clientsForTeam = await Client.find({ team_id }).select('_id');
    const clientIds = clientsForTeam.map(c => c._id);
    
    const reminders = await Reminder.find({ client_id: { $in: clientIds }, status: 'pending' })
      .populate('client_id', 'name priority');

    const priorityOrder = { high: 1, medium: 2, low: 3 };
    reminders.sort((a, b) => priorityOrder[a.client_id.priority] - priorityOrder[b.client_id.priority]);
      
    const response = reminders.map(r => ({
        id: r._id,
        rule: r.rule,
        client_name: r.client_id.name,
        client_id: r.client_id._id,
        priority: r.client_id.priority
    }));

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

app.put('/api/reminders/:id', async (req, res) => {
  try {
    const { team_id } = req.user;
    const { id: reminderId } = req.params;
    const { status } = req.body;

    const reminder = await Reminder.findById(reminderId);
    if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found.' });
    }

    const client = await Client.findOne({ _id: reminder.client_id, team_id: team_id });
    if (!client) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    
    await Reminder.findByIdAndUpdate(reminderId, { status });
    res.status(200).json({ message: 'Reminder updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

app.get('/clients', async (req, res) => {
  try {
    const { team_id } = req.user;
    
    let clients = await Client.find({ team_id }).sort({ createdAt: -1 }).lean();
            
    const lastInteractions = await Interaction.aggregate([
        { $match: { client_id: { $in: clients.map(c => c._id) } } },
        { $sort: { date: -1 } },
        { $group: { _id: "$client_id", last_contact_date: { $first: "$date" } } }
    ]);
            
    const interactionMap = new Map(lastInteractions.map(i => [i._id.toString(), i.last_contact_date]));
            
    clients.forEach(client => {
        client.last_contact_date = interactionMap.get(client._id.toString());
    });

    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

app.post('/clients', async (req, res) => {
  try {
    const { team_id } = req.user;
    const { name, contact_email } = req.body;
    if (!name || !contact_email) {
      return res.status(400).json({ error: 'Name and contact_email are required' });
    }
    const newClient = await Client.create({ ...req.body, team_id });
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

app.put('/clients/:id', async (req, res) => {
    try {
        const { team_id } = req.user;
        const { id } = req.params;

        const updatedClient = await Client.findOneAndUpdate(
            { _id: id, team_id: team_id }, 
            req.body, 
            { new: true }
        );

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

        const result = await Client.findOneAndDelete({ _id: id, team_id: team_id });

        if (!result) {
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

        const client = await Client.findOne({ _id: client_id, team_id });
        if (!client) {
            return res.status(404).json({ error: 'Client not found or access denied.' });
        }

        const interactions = await Interaction.find({ client_id })
            .populate('user_id', 'email')
            .sort({ date: -1 });
        
        const response = interactions.map(i => ({
            ...i.toObject(),
            user_email: i.user_id.email
        }));

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch interactions' });
    }
});

app.post('/clients/:id/interactions', async (req, res) => {
    try {
        const { team_id, id: user_id } = req.user;
        const { id: client_id } = req.params;
        const { type, notes, next_action_date } = req.body;

        const client = await Client.findOne({ _id: client_id, team_id });
        if (!client) {
            return res.status(404).json({ error: 'Client not found or access denied.' });
        }
        if (!type || !notes) {
            return res.status(400).json({ error: 'Interaction type and notes are required' });
        }

        const newInteraction = await Interaction.create({ 
            client_id, 
            type, 
            notes, 
            user_id, 
            next_action_date 
        });

        const interactionWithUser = await newInteraction.populate('user_id', 'email');
        const response = {
            ...interactionWithUser.toObject(),
            user_email: interactionWithUser.user_id.email
        };

        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create interaction' });
    }
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

cron.schedule('0 2 * * *', generateReminders);