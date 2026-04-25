export interface TrainingPeaksTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  athlete_id: string;
  athlete_external_id: string;
}

export interface TrainingPeaksActivity {
  id: string;
  title: string;
  sport: string;
  start_time: string; // ISO timestamp
  duration_sec: number;
  distance_meters?: number;
  elevation_gain?: number;
  calories?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_speed_mps?: number;
}
