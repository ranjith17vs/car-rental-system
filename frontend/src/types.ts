export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum BookingStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  COMPLETED = 'Completed'
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
}

export interface Car {
  id: string | number;
  name: string;
  brand: string;
  price_per_day: number;
  fuel_type: string;
  image: string;
  availability: boolean;
  rc_doc?: string; // Optional field for Registration Document
  insurance_doc?: string; // Optional field for Insurance Document
}

export interface Booking {
  id: string | number;
  user_id: string | number;
  car_id: string | number;
  pickup_date: string;
  return_date: string;
  total_price: number;
  status: BookingStatus;
  has_driver: boolean;
  driver_name?: string;
  driver_phone?: string;
  driver_id_proof?: string; // Optional field for Driver ID Proof
  // Joins
  car?: Car;
  user?: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}