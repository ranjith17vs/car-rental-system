-- DriveEasy Database Schema

CREATE DATABASE IF NOT EXISTS car_rental_db;
USE car_rental_db;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cars Table
CREATE TABLE cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    price_per_day DECIMAL(10, 2) NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    image MEDIUMTEXT, -- Changed to MEDIUMTEXT to support Base64 strings
    rc_doc MEDIUMTEXT, -- Added field for RC document
    insurance_doc MEDIUMTEXT, -- Added field for Insurance document
    availability BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    car_id INT NOT NULL,
    pickup_date DATE NOT NULL,
    return_date DATE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending',
    has_driver BOOLEAN DEFAULT FALSE, -- Added field for driver request
    driver_name VARCHAR(255), -- Added field for assigned driver
    driver_phone VARCHAR(20), -- Added field for driver contact
    driver_id_proof MEDIUMTEXT, -- Added field for driver ID Base64
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

-- Seed Data for Admin
INSERT INTO users (name, email, phone, password, role) 
VALUES ('Admin User', 'admin@driveeasy.com', '1234567890', '$2b$10$YourHashedPasswordHere', 'admin');