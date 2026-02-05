import { User, Car, Booking, BookingStatus, UserRole } from '../types';

// Seed data from db.json as initial state
const INITIAL_DATA = {
    "cars": [
        {
            "id": 1,
            "name": "Scorpio-N",
            "brand": "Mahindra",
            "price_per_day": 4500,
            "fuel_type": "Diesel",
            "image": "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?auto=format&fit=crop&q=80&w=800",
            "availability": true
        },
        {
            "id": 2,
            "name": "Thar Rooftop",
            "brand": "Mahindra",
            "price_per_day": 3500,
            "fuel_type": "Diesel",
            "image": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
            "availability": true
        },
        {
            "id": 3,
            "name": "Fortuner Legender",
            "brand": "Toyota",
            "price_per_day": 8500,
            "fuel_type": "Diesel",
            "image": "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800",
            "availability": true
        }
    ],
    "users": [
        {
            "id": 1,
            "name": "Admin User",
            "email": "admin@driveeasy.com",
            "phone": "9876543210",
            "role": "admin",
            "password": "admin123"
        },
        {
            "id": 2,
            "name": "Test User",
            "email": "user@driveeasy.com",
            "phone": "9876543211",
            "role": "user",
            "password": "user123"
        }
    ],
    "bookings": []
};

class MockDB {
    private getData() {
        const data = localStorage.getItem('car_rental_db');
        if (!data) {
            localStorage.setItem('car_rental_db', JSON.stringify(INITIAL_DATA));
            return INITIAL_DATA;
        }
        return JSON.parse(data);
    }

    private saveData(data: any) {
        localStorage.setItem('car_rental_db', JSON.stringify(data));
    }

    async getCars(): Promise<Car[]> {
        return this.getData().cars;
    }

    async getUsers(): Promise<User[]> {
        return this.getData().users;
    }

    async getBookings(): Promise<Booking[]> {
        const data = this.getData();
        return data.bookings.map((b: any) => ({
            ...b,
            car: data.cars.find((c: any) => c.id === b.car_id),
            user: data.users.find((u: any) => u.id === b.user_id)
        }));
    }

    async registerUser(userData: Partial<User>): Promise<User> {
        const data = this.getData();
        const newUser = {
            ...userData,
            id: data.users.length + 1,
            role: userData.role || UserRole.USER
        } as User;
        data.users.push(newUser);
        this.saveData(data);
        return newUser;
    }

    async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
        const data = this.getData();
        const newBooking = {
            ...bookingData,
            id: data.bookings.length + 1
        } as Booking;
        data.bookings.push(newBooking);
        this.saveData(data);
        return newBooking;
    }

    async updateBookingStatus(id: number, status: BookingStatus, driverDetails?: { name: string, phone: string, id_proof?: string }) {
        const data = this.getData();
        const index = data.bookings.findIndex((b: any) => b.id === id);
        if (index !== -1) {
            data.bookings[index] = { ...data.bookings[index], status, ...driverDetails };
            this.saveData(data);
        }
    }

    async saveCar(carData: Car) {
        const data = this.getData();
        if (carData.id) {
            const index = data.cars.findIndex((c: any) => c.id === carData.id);
            if (index !== -1) data.cars[index] = carData;
        } else {
            carData.id = data.cars.length + 1;
            data.cars.push(carData);
        }
        this.saveData(data);
    }

    async deleteCar(id: number) {
        const data = this.getData();
        data.cars = data.cars.filter((c: any) => c.id !== id);
        this.saveData(data);
    }
}

export default new MockDB();
