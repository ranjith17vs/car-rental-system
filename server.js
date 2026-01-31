import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- DB Helper ---
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        return { cars: [], users: [], bookings: [] };
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
};

const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- Init DB if empty ---
const initDB = () => {
    const data = readDB();
    if (data.cars.length === 0) {
        data.cars = [
            { id: 1, name: "Scorpio-N", brand: "Mahindra", price_per_day: 4500, fuel_type: "Diesel", image: "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?auto=format&fit=crop&q=80&w=800", availability: true },
            { id: 2, name: "Thar Rooftop", brand: "Mahindra", price_per_day: 3500, fuel_type: "Diesel", image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800", availability: true },
            { id: 3, name: "Fortuner Legender", brand: "Toyota", price_per_day: 8500, fuel_type: "Diesel", image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=800", availability: true }
        ];
        data.users = [
            { id: 1, name: "Admin User", email: "admin@driveeasy.com", phone: "9876543210", role: "admin", password: "admin123" },
            { id: 2, name: "Test User", email: "user@driveeasy.com", phone: "9876543211", role: "user", password: "user123" }
        ];
        writeDB(data);
    }
};
initDB();

// --- API Routes ---

app.get('/api/cars', (req, res) => {
    res.json(readDB().cars);
});

app.post('/api/cars', (req, res) => {
    const data = readDB();
    const car = req.body;
    if (car.id) {
        const idx = data.cars.findIndex(c => c.id === car.id);
        if (idx !== -1) data.cars[idx] = car;
        else data.cars.push(car);
    } else {
        car.id = data.cars.length > 0 ? Math.max(...data.cars.map(c => c.id)) + 1 : 1;
        data.cars.push(car);
    }
    writeDB(data);
    res.json(car);
});

app.delete('/api/cars/:id', (req, res) => {
    const data = readDB();
    data.cars = data.cars.filter(c => c.id !== parseInt(req.params.id));
    writeDB(data);
    res.json({ success: true });
});

app.get('/api/users', (req, res) => {
    res.json(readDB().users);
});

app.post('/api/users/register', (req, res) => {
    const data = readDB();
    const user = req.body;
    user.id = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
    user.role = user.role || 'user';
    data.users.push(user);
    writeDB(data);
    res.json(user);
});

app.get('/api/bookings', (req, res) => {
    const data = readDB();
    const bookings = data.bookings.map(b => ({
        ...b,
        car: data.cars.find(c => c.id === b.car_id),
        user: data.users.find(u => u.id === b.user_id)
    }));
    res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
    const data = readDB();
    const booking = req.body;
    booking.id = data.bookings.length > 0 ? Math.max(...data.bookings.map(b => b.id)) + 1 : 1;
    data.bookings.push(booking);
    writeDB(data);
    res.json(booking);
});

app.patch('/api/bookings/:id', (req, res) => {
    const data = readDB();
    const idx = data.bookings.findIndex(b => b.id === parseInt(req.params.id));
    if (idx !== -1) {
        data.bookings[idx] = { ...data.bookings[idx], ...req.body };
        writeDB(data);
        res.json(data.bookings[idx]);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
});
