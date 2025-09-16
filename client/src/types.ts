export interface Client {
  id: number;
  name: string;
  company: string;
  contact_email: string;
  owner: string;
  tags: string;
  last_contact_date?: string;
  website_url?: string;
  contact_cadence_days: number;
  prep_notes?: string;
}

export interface Interaction {
  id: number;
  type: string;
  notes: string;
  date: string;
  user_email: string;
}