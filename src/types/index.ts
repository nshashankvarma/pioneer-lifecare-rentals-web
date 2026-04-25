export type UserRole = 'admin' | 'user';
export type RentalStatus = 'active' | 'closed';
export type LocationType = 'hospital' | 'home';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  expo_push_token?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  address?: string | null;
  contact?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentalItem {
  id: string;
  name: string;
  total_quantity: number;
  description?: string | null;
  created_at: string;
  updated_at: string;
  available_quantity?: number;
}

export interface Rental {
  id: string;
  agreement_no?: string | null;
  patient_name: string;
  contact_no?: string | null;
  location_type: LocationType;
  hospital_name?: string | null;
  ward_no?: string | null;
  house_address?: string | null;
  item_id?: string | null;
  item_name: string;
  issued_by?: string | null;
  issued_date: string;
  returned_date?: string | null;
  status: RentalStatus;
  notes?: string | null;
  closed_by?: string | null;
  advance_amount?: number | null;
  monthly_charge?: number | null;
  created_at: string;
  updated_at: string;
  issuer?: Profile | null;
  closer?: Profile | null;
}
