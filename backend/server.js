import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import db from './firebase-config.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// --- API Routes ---

// Health check / Root route
app.get('/', (req, res) => {
    res.json({ message: "DriveEasy Backend is Running Successfully!", status: "online" });
});

// API Info route
app.get('/api', (req, res) => {
    res.json({ message: "API is reachable. Use specific endpoints like /api/cars", status: "online" });
});

// Get all cars
app.get('/api/cars', async (req, res) => {
    try {
        const snapshot = await db.collection('cars').get();
        const cars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(cars);
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add or update a car
app.post('/api/cars', async (req, res) => {
    try {
        const car = req.body;
        if (car.id) {
            const id = car.id.toString();
            const carData = { ...car };
            delete carData.id;
            await db.collection('cars').doc(id).set(carData, { merge: true });
            res.json({ id, ...carData });
        } else {
            const docRef = await db.collection('cars').add(car);
            res.json({ id: docRef.id, ...car });
        }
    } catch (error) {
        console.error('Error saving car:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a car
app.delete('/api/cars/:id', async (req, res) => {
    try {
        await db.collection('cars').doc(req.params.id).delete();
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Authentication Endpoints ---

// Login user - Step 1: Initialize Login (Send OTP)
app.post('/api/users/login-init', async (req, res) => {
    try {
        const { email, password } = req.body;
        const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();

        if (snapshot.empty) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store login attempt with OTP
        await db.collection('pending_logins').doc(email).set({
            email,
            otp,
            expiresAt: new Date(Date.now() + 1 * 60 * 1000) // 1 min
        });

        // Send Email
        await sendOTPEmail(email, otp, 'Login');

        res.json({ message: 'OTP sent for login', email });
    } catch (error) {
        console.error('Error initiating login:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login user - Step 2: Verify OTP
app.post('/api/users/login-verify', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const cleanEmail = email.trim();
        console.log(`🔍 Verifying LOGIN OTP for: [${cleanEmail}] with code: [${otp}]`);

        const docRef = db.collection('pending_logins').doc(cleanEmail);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.log(`❌ No pending login found for ${cleanEmail}`);
            return res.status(400).json({ error: 'Login session expired or not found' });
        }

        const data = doc.data();
        console.log(`📄 Found data in DB: OTP=[${data.otp}], Expires=[${data.expiresAt.toDate()}]`);

        if (data.otp !== otp.trim()) {
            console.log(`❌ OTP Mismatch: DB=[${data.otp}], Input=[${otp}]`);
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (new Date() > data.expiresAt.toDate()) {
            console.log(`❌ OTP Expired: DB Time=[${data.expiresAt.toDate()}], Current=[${new Date()}]`);
            return res.status(400).json({ error: 'OTP expired' });
        }

        // Finalize login
        const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        await docRef.delete();

        const response = { id: userDoc.id, ...userData };
        delete response.password;

        // Notify Admin (Async, don't block response)
        sendAdminLoginNotification(response);

        res.json(response);
    } catch (error) {
        console.error('Error verifying login OTP:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Email Configuration ---

let transporter;

async function initTransporter() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Use user-provided credentials
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        console.log('📧 SMTP Transporter initialized with personal credentials.');
    } else {
        // AUTOMATIC: Create a test account if no credentials provided
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('\n🚀 [AUTO-EMAIL] Created temporary test account!');
            console.log(`🔗 VIEW EMAILS HERE: https://ethereal.email/login (User: ${testAccount.user}, Pass: ${testAccount.pass})\n`);
        } catch (err) {
            console.error('❌ Failed to create auto-test account:', err);
        }
    }
}

// Initialize on start
initTransporter();

// Helper function to send email
async function sendOTPEmail(to, otp, type = 'Login') {
    if (!transporter) {
        await initTransporter();
    }

    const mailOptions = {
        from: `"DriveEasy Support" <support@driveeasy.com>`,
        to: to,
        subject: `${type} OTP Verification - DriveEasy`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2563eb; text-align: center;">DriveEasy Car Rental</h2>
                <hr>
                <p>Hello,</p>
                <p>You requested an OTP for <strong>${type}</strong> at DriveEasy.</p>
                <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otp}</span>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    This code will expire in 1 minute. If you did not request this, please ignore this email.
                </p>
                <hr>
                <p style="text-align: center; font-size: 12px; color: #9ca3af;">
                    © 2026 DriveEasy Car Rental India. All rights reserved.
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ ${type} OTP sent to ${to}`);
        console.log(`🔑 DEBUG: Code for ${to} is ${otp}`); // Temporary debug log

        // If it's an ethereal account, log the preview URL
        if (nodemailer.getTestMessageUrl(info)) {
            console.log(`🔗 PREVIEW EMAIL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (error) {
        console.error(`❌ Error sending ${type} email:`, error);
        console.log('---------------------------------------\n');
    }
}

// Helper function to notify admin of user login
async function sendAdminLoginNotification(userData) {
    if (!transporter) {
        await initTransporter();
    }

    const adminEmail = process.env.SMTP_USER || 'driveeasyrental17@gmail.com';

    const mailOptions = {
        from: `"DriveEasy System" <system@driveeasy.com>`,
        to: adminEmail,
        subject: `Login Alert: ${userData.name} has logged in`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #10b981; text-align: center;">Customer Login Notification</h2>
                <hr>
                <p>Hello Admin,</p>
                <p>A customer has just logged into the DriveEasy application.</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px;">
                    <p><strong>Customer Details:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Name:</strong> ${userData.name}</li>
                        <li><strong>Email:</strong> ${userData.email}</li>
                        <li><strong>Phone:</strong> ${userData.phone || 'N/A'}</li>
                        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                    </ul>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    This is an automated notification from the DriveEasy System.
                </p>
                <hr>
                <p style="text-align: center; font-size: 12px; color: #9ca3af;">
                    © 2026 DriveEasy Car Rental India.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Admin notification sent for login: ${userData.email}`);
    } catch (error) {
        console.error(`❌ Error sending admin notification:`, error);
    }
}

// Helper function to notify admin of new booking
async function sendAdminBookingNotification(bookingData) {
    if (!transporter) {
        await initTransporter();
    }

    const adminEmail = process.env.SMTP_USER || 'driveeasyrental17@gmail.com';

    const mailOptions = {
        from: `"DriveEasy System" <system@driveeasy.com>`,
        to: adminEmail,
        subject: `New Booking Alert: ${bookingData.car_name || 'Car'} booked`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2563eb; text-align: center;">New Car Booking Notification</h2>
                <hr>
                <p>Hello Admin,</p>
                <p>A new booking has been created in the DriveEasy application.</p>
                <div style="background: #eff6ff; padding: 20px; border-radius: 8px;">
                    <p><strong>Booking Details:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Car ID:</strong> ${bookingData.car_id}</li>
                        <li><strong>User ID:</strong> ${bookingData.user_id}</li>
                        <li><strong>Pickup Date:</strong> ${bookingData.pickup_date}</li>
                        <li><strong>Return Date:</strong> ${bookingData.return_date}</li>
                        <li><strong>Total Price:</strong> ₹${bookingData.total_price}</li>
                        <li><strong>Status:</strong> ${bookingData.status}</li>
                    </ul>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    This is an automated notification from the DriveEasy System.
                </p>
                <hr>
                <p style="text-align: center; font-size: 12px; color: #9ca3af;">
                    © 2026 DriveEasy Car Rental India.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Admin notification sent for booking: ${bookingData.car_id}`);
    } catch (error) {
        console.error(`❌ Error sending admin booking notification:`, error);
    }
}

// Helper function to notify customer of booking approval
async function sendCustomerApprovalEmail(bookingData, userData) {
    if (!transporter) {
        await initTransporter();
    }

    const mailOptions = {
        from: `"DriveEasy Support" <support@driveeasy.com>`,
        to: userData.email,
        subject: `Booking Approved! - DriveEasy`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #10b981; text-align: center;">Booking Approved!</h2>
                <hr>
                <p>Hello ${userData.name},</p>
                <p>Great news! Your booking has been <strong>Approved</strong> by the admin.</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px;">
                    <p><strong>Booking Summary:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Car ID:</strong> ${bookingData.car_id}</li>
                        <li><strong>Pickup Date:</strong> ${bookingData.pickup_date}</li>
                        <li><strong>Return Date:</strong> ${bookingData.return_date}</li>
                        <li><strong>Total Price:</strong> ₹${bookingData.total_price}</li>
                    </ul>
                </div>
                <p>You can now prepare for your journey. Please carry your documents as required.</p>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    Thank you for choosing DriveEasy.
                </p>
                <hr>
                <p style="text-align: center; font-size: 12px; color: #9ca3af;">
                    © 2026 DriveEasy Car Rental India.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Approval email sent to: ${userData.email}`);
    } catch (error) {
        console.error(`❌ Error sending customer approval email:`, error);
    }
}

// Initiate Registration (Send OTP)
app.post('/api/users/register-init', async (req, res) => {
    try {
        const { email, name, phone, password } = req.body;

        // 1. Check if user already exists
        const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!userSnapshot.empty) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Store pending user data with OTP
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.collection('pending_registrations').doc(email).set({
            name, phone, email, password: hashedPassword,
            otp,
            expiresAt: new Date(Date.now() + 1 * 60 * 1000) // 1 min
        });

        // Send Email
        await sendOTPEmail(email, otp, 'Registration');

        res.json({ message: 'OTP sent to email (check console)', email });
    } catch (error) {
        console.error('Error initiating registration:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify OTP and Complete Registration
app.post('/api/users/register-verify', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const cleanEmail = email.trim();
        console.log(`🔍 Verifying OTP for: [${cleanEmail}] with code: [${otp}]`);

        const docRef = db.collection('pending_registrations').doc(cleanEmail);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.log(`❌ No pending registration found for ${cleanEmail}`);
            return res.status(400).json({ error: 'Registration expired or not found' });
        }

        const data = doc.data();
        console.log(`📄 Found data in DB: OTP=[${data.otp}], Expires=[${data.expiresAt.toDate()}]`);

        if (data.otp !== otp.trim()) {
            console.log(`❌ OTP Mismatch: DB=[${data.otp}], Input=[${otp}]`);
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (new Date() > data.expiresAt.toDate()) {
            console.log(`❌ OTP Expired: DB Time=[${data.expiresAt.toDate()}], Current=[${new Date()}]`);
            return res.status(400).json({ error: 'OTP expired' });
        }

        // Create the actual user
        const newUserRef = await db.collection('users').add({
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: data.password,
            role: 'user'
        });

        // Cleanup
        await docRef.delete();

        res.json({
            id: newUserRef.id,
            name: data.name,
            email: data.email,
            role: 'user',
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all bookings with joined data
app.get('/api/bookings', async (req, res) => {
    try {
        const bookingsSnapshot = await db.collection('bookings').get();
        const carsSnapshot = await db.collection('cars').get();
        const usersSnapshot = await db.collection('users').get();

        const cars = Object.fromEntries(carsSnapshot.docs.map(doc => [doc.id, doc.data()]));
        const users = Object.fromEntries(usersSnapshot.docs.map(doc => [doc.id, doc.data()]));

        const bookings = bookingsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                car: cars[data.car_id] ? { id: data.car_id, ...cars[data.car_id] } : null,
                user: users[data.user_id] ? { id: data.user_id, ...users[data.user_id] } : null
            };
        });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create booking
app.post('/api/bookings', async (req, res) => {
    try {
        const booking = req.body;
        const docRef = await db.collection('bookings').add(booking);

        // Notify Admin
        sendAdminBookingNotification({ id: docRef.id, ...booking });

        res.json({ id: docRef.id, ...booking });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update booking status
app.patch('/api/bookings/:id', async (req, res) => {
    try {
        await db.collection('bookings').doc(req.params.id).update(req.body);
        const doc = await db.collection('bookings').doc(req.params.id).get();
        const bookingData = doc.data();

        // Check if status was updated to Approved
        if (req.body.status === 'Approved') {
            try {
                const userDoc = await db.collection('users').doc(bookingData.user_id).get();
                if (userDoc.exists) {
                    sendCustomerApprovalEmail({ id: doc.id, ...bookingData }, userDoc.data());
                }
            } catch (userErr) {
                console.error('Error fetching user for approval email:', userErr);
            }
        }

        res.json({ id: doc.id, ...bookingData });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
});
