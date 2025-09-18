import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  invite_code: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

const Team = mongoose.model('Team', TeamSchema);
export default Team;