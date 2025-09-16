import db from './db/index.js';
import { subDays } from 'date-fns';

export async function generateReminders() {
  console.log('Running daily reminder check...');
  const thirtyDaysAgo = subDays(new Date(), 30);
  
  try {
    const clientsToFlag = await db('clients')
      .select('clients.id as client_id', 'clients.team_id')
      .leftJoin('interactions', 'clients.id', 'interactions.client_id')
      .groupBy('clients.id', 'clients.team_id')
      .having(db.raw('MAX(interactions.date) < ?', [thirtyDaysAgo]))
      .orWhere(db.raw('MAX(interactions.date) IS NULL'));

    if (clientsToFlag.length === 0) {
      console.log('No clients need reminders today.');
      return;
    }

    for (const client of clientsToFlag) {
      const existingReminder = await db('reminders')
        .where({ client_id: client.client_id, status: 'pending' })
        .first();

      if (!existingReminder) {
        await db('reminders').insert({
          client_id: client.client_id,
          rule: 'No contact in 30 days',
          status: 'pending',
          scheduled_at: new Date(),
        });
        console.log(`Generated reminder for client ID: ${client.client_id}`);
      }
    }
  } catch (error) {
    console.error('Error generating reminders:', error);
  }
}