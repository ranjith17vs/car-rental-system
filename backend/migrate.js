import fs from 'fs';
import db from './firebase-config.js';
import bcrypt from 'bcryptjs';

const rawData = fs.readFileSync('./db.json');
const data = JSON.parse(rawData);

async function migrate() {
    console.log('Starting migration to Firestore...');

    // Migrate Cars
    if (data.cars) {
        console.log(`Migrating ${data.cars.length} cars...`);
        for (const car of data.cars) {
            const id = car.id.toString();
            const carData = { ...car };
            delete carData.id;
            await db.collection('cars').doc(id).set(carData);
            console.log(` - Migrated car: ${car.name} (ID: ${id})`);
        }
    }

    // Migrate Users
    if (data.users) {
        console.log(`Migrating ${data.users.length} users...`);
        for (const user of data.users) {
            const id = user.id.toString();
            const userData = { ...user };
            delete userData.id;

            // Hash password if not already hashed (simple check)
            if (userData.password && !userData.password.startsWith('$2a$')) {
                userData.password = await bcrypt.hash(userData.password, 10);
            }

            await db.collection('users').doc(id).set(userData);
            console.log(` - Migrated user: ${user.email} (ID: ${id})`);
        }
    }

    // Migrate Bookings
    if (data.bookings) {
        console.log(`Migrating ${data.bookings.length} bookings...`);
        for (const booking of data.bookings) {
            const id = booking.id ? booking.id.toString() : null;
            const bookingData = { ...booking };
            if (id) {
                delete bookingData.id;
                await db.collection('bookings').doc(id).set(bookingData);
                console.log(` - Migrated booking (ID: ${id})`);
            } else {
                const docRef = await db.collection('bookings').add(bookingData);
                console.log(` - Added new booking (Firestore ID: ${docRef.id})`);
            }
        }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
