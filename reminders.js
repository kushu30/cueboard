import { subDays } from 'date-fns';
import Client from './models/Client.js';
import Interaction from './models/Interaction.js';
import Reminder from './models/Reminder.js';

export async function generateReminders() {
  console.log('Running daily cadence check...');
  try {
    const clients = await Client.find({}, '_id contact_cadence_days');
    
    const lastContacts = await Interaction.aggregate([
      { $sort: { date: -1 } },
      { $group: { _id: "$client_id", last_contact_date: { $first: "$date" } } }
    ]);
    
    const lastContactMap = new Map(lastContacts.map(i => [i._id.toString(), i.last_contact_date]));

    for (const client of clients) {
      const lastContactDate = lastContactMap.get(client._id.toString());
      const cadence = client.contact_cadence_days || 30;
      const dueDate = subDays(new Date(), cadence);

      if (!lastContactDate || lastContactDate < dueDate) {
        const existingReminder = await Reminder.findOne({ 
          client_id: client._id, 
          status: 'pending' 
        });

        if (!existingReminder) {
          await Reminder.create({
            client_id: client._id,
            rule: `Contact due (Cadence: ${cadence} days)`,
          });
          console.log(`Generated reminder for client ID: ${client._id}`);
        }
      }
    }
  } catch (error) {
    console.error('Error generating reminders:', error);
  }
}