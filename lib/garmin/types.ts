export interface GarminTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
}

export interface GarminActivity {
  activityId: string;
  activityType: string;
  activityName: string;
  startTimeGmt: string;
  durationInSeconds: number;
  distanceInMeters?: number;
  elevationGainInMeters?: number;
  caloriesBurned?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  averageSpeedInMetersPerSecond?: number;
  averagePaceInSecondsPerKilometer?: number;
}
