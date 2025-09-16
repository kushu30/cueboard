export interface Client {
  id: number;
  name: string;
  company: string;
  contact_email: string;
  owner: string;
  tags: string;
}

export interface Interaction {
  id: number;
  type: string;
  notes: string;
  date: string;
  user_email: string;
}