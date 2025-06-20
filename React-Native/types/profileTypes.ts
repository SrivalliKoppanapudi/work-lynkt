export interface Profile {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  occupation: string;
  education: string;
  workExperience: string;
  goals: string;
  profilePicture: string | null;
  isVerified: boolean;
  privacyLevel: 'public' | 'connections' | 'private';
  verificationPending?: boolean;
}

export interface ProfileErrors {
  name?: string;
  address?: string;
  phoneNumber?: string;
  occupation?: string;
  education?: string;
  workExperience?: string;
  goals?: string;
  profilePicture?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}