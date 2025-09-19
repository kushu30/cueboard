import mongoose from 'mongoose';

const InteractionSchema = new mongoose.Schema({
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  notes: String,
  date: {
    type: Date,
    default: Date.now,
  },
  next_action_date: Date,
});

const Interaction = mongoose.model('Interaction', InteractionSchema);
export default Interaction;
