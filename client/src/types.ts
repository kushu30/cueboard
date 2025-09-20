export interface Client {
  id?: number | string;
  _id?: string;
  name: string;
  company?: string;
  contact_email?: string;
  owner?: string;
  tags?: string;
  status?: 'active' | 'paused' | 'churned';
  priority?: ClientPriority;
  last_contact_date?: string;
  website_url?: string;
  contact_cadence_days?: number;
  prep_notes?: string;
}

export interface Interaction {
  id?: number | string;
  _id?: string;
  client_id?: string | number;
  user_id?: string | number;
  type?: string;
  notes?: string;
  date?: string | number | Date;
  user_email?: string;
}

export type ClientPriority = 'high' | 'medium' | 'low';
