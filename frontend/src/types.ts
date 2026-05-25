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
  seats: string;
  price_per_day: number;
  fuel_type: string;
  image: string;
  images?: string[];
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
  pickup_location?: string;
  total_price: number;
  status: BookingStatus;
  has_driver: boolean;
  driver_name?: string;
  driver_phone?: string;
  driver_id_proof?: string; // Optional field for Driver ID Proof
  payment_method?: string; // Optioanl field for selected payment method
  customer_photo?: string;
  customer_id_proof?: string;
  driving_license?: string;
  purpose?: string; // Added field for purpose of rent
  customer_number?: string; // Added field for customer contact number
  // Joins
  car?: Car;
  user?: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}