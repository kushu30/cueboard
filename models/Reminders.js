import mongoose from 'mongoose';

const ReminderSchema = new mongoose.Schema({
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
    },
    rule: String,
    status: {
        type: String,
        default: 'pending',
    },
    scheduled_at: {
        type: Date,
        default: Date.now,
    },
});

const Reminder = mongoose.model('Reminder', ReminderSchema);
export default Reminder;