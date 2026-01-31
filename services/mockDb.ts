import { User, Car, Booking, BookingStatus, UserRole } from '../types';

const API_URL = 'http://localhost:5000/api';

class MockDB {
    async getCars(): Promise<Car[]> {
        const res = await fetch(`${API_URL}/cars`);
        return res.json();
    }

    async getUsers(): Promise<User[]> {
        const res = await fetch(`${API_URL}/users`);
        return res.json();
    }

    async getBookings(): Promise<Booking[]> {
        const res = await fetch(`${API_URL}/bookings`);
        return res.json();
    }

    async registerUser(userData: Partial<User>): Promise<User> {
        const res = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return res.json();
    }

    async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
        const res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        return res.json();
    }

    async updateBookingStatus(id: number, status: BookingStatus, driverDetails?: { name: string, phone: string, id_proof?: string }) {
        await fetch(`${API_URL}/bookings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, ...driverDetails })
        });
    }

    async saveCar(carData: Car) {
        await fetch(`${API_URL}/cars`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(carData)
        });
    }

    async deleteCar(id: number) {
        await fetch(`${API_URL}/cars/${id}`, {
            method: 'DELETE'
        });
    }
}

export default new MockDB();
