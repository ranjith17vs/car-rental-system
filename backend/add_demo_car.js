import fs from 'fs';

async function main() {
    const img1 = 'data:image/png;base64,' + fs.readFileSync('C:\\Users\\vsran\\.gemini\\antigravity\\brain\\205f8c97-ee06-4892-b160-9fcb5cb34038\\car_exterior_front_1774514043460.png').toString('base64');
    const img2 = 'data:image/png;base64,' + fs.readFileSync('C:\\Users\\vsran\\.gemini\\antigravity\\brain\\205f8c97-ee06-4892-b160-9fcb5cb34038\\car_exterior_side_1774514061030.png').toString('base64');
    const img3 = 'data:image/png;base64,' + fs.readFileSync('C:\\Users\\vsran\\.gemini\\antigravity\\brain\\205f8c97-ee06-4892-b160-9fcb5cb34038\\car_interior_1774514077855.png').toString('base64');

    const carData = {
        name: "Neon Apex 2026",
        brand: "NeonMotors",
        seats: "2",
        price_per_day: 4500,
        fuel_type: "Electric",
        image: img1,
        images: [img1, img2, img3],
        availability: true,
        rc_doc: "",
        insurance_doc: ""
    };

    console.log("Posting to API");
    const res = await fetch('http://localhost:5000/api/cars', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(carData)
    });
    
    if(res.ok) {
        const body = await res.text();
        console.log("Success HTTP", res.status, body);
    } else {
        console.error("Failed", res.status);
    }
}
main().catch(console.error);
