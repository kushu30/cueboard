import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  company: String,
  contact_email: {
    type: String,
    required: true,
  },
  owner: String,
  tags: String,
  website_url: String,
  contact_cadence_days: {
    type: Number,
    default: 7,
  },
  prep_notes: String,
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
}, { timestamps: true });

const Client = mongoose.model('Client', ClientSchema);
export default Client;