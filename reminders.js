import db from './db/index.js';
import { subDays } from 'date-fns';

export async function generateReminders() {
  console.log('Running daily cadence check...');
  try {
    const clients = await db('clients').select('id', 'contact_cadence_days');
    const lastContacts = await db('interactions')
      .select('client_id')
      .max('date as last_contact_date')
      .groupBy('client_id');
    
    const lastContactMap = new Map(lastContacts.map(i => [i.client_id, new Date(i.last_contact_date)]));

    for (const client of clients) {
      const lastContactDate = lastContactMap.get(client.id);
      const cadence = client.contact_cadence_days || 30;
      const dueDate = subDays(new Date(), cadence);

      // If last contact is older than the due date, or if there's no contact at all
      if (!lastContactDate || lastContactDate < dueDate) {
        const existingReminder = await db('reminders')
          .where({ client_id: client.id, status: 'pending' })
          .first();

        if (!existingReminder) {
          await db('reminders').insert({
            client_id: client.id,
            rule: `Contact due (Cadence: ${cadence} days)`,
            status: 'pending',
            scheduled_at: new Date(),
          });
          console.log(`Generated reminder for client ID: ${client.id}`);
        }
      }
    }
  } catch (error) {
    console.error('Error generating reminders:', error);
  }
}