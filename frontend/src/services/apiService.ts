import { User, Car, Booking, BookingStatus, UserRole } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    async getCars(): Promise<Car[]> {
        const res = await fetch(`${API_BASE_URL}/cars`);
        return res.json();
    }

    async getUsers(): Promise<User[]> {
        const res = await fetch(`${API_BASE_URL}/users`);
        return res.json();
    }

    async loginInit(credentials: { email: string, password: string }): Promise<{ message: string, email: string } | { error: string }> {
        const res = await fetch(`${API_BASE_URL}/users/login-init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return res.json();
    }

    async loginVerify(email: string, otp: string): Promise<User | { error: string }> {
        const res = await fetch(`${API_BASE_URL}/users/login-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        return res.json();
    }

    async getBookings(): Promise<Booking[]> {
        const res = await fetch(`${API_BASE_URL}/bookings`);
        return res.json();
    }

    async registerInit(userData: Partial<User>): Promise<{ message: string, email: string } | { error: string }> {
        const res = await fetch(`${API_BASE_URL}/users/register-init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return res.json();
    }

    async registerVerify(email: string, otp: string): Promise<User | { error: string }> {
        const res = await fetch(`${API_BASE_URL}/users/register-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        return res.json();
    }

    async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
        const res = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        return res.json();
    }

    async updateBookingStatus(id: string | number, status: BookingStatus, driverDetails?: { name: string, phone: string, id_proof?: string }) {
        const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, ...driverDetails })
        });
        return res.json();
    }

    async saveCar(carData: Car) {
        const res = await fetch(`${API_BASE_URL}/cars`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(carData)
        });
        return res.json();
    }

    async deleteCar(id: string | number) {
        const res = await fetch(`${API_BASE_URL}/cars/${id}`, {
            method: 'DELETE'
        });
        return res.json();
    }
}

export default new ApiService();
