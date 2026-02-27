// src/types.ts
export interface AppEvent {
  id: number;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  date: string;
  time: string | null;
  type: string | null;
  food_certainty: 'confirmed' | 'probable' | 'unknown';
  description: string | null;
  poster_url: string | null;
  reporter_email: string;
  created_at: string;
  participant_count: number;
  estimated_until: string | null;
}

export interface EventDetails extends AppEvent {
  participants: { user_email: string }[];
  comments: Comment[];
}

export interface Comment {
  id: number;
  user_email: string;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  user_email: string;
  content: string;
  created_at: string;
}