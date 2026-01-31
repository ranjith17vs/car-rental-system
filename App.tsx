import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { User, AuthState, UserRole, Car, BookingStatus, Booking } from './types';
import MockDB from './services/mockDb';

const DRIVER_DAILY_FEE = 500;

// --- Helper for Base64 Upload ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// --- Context ---
const AuthContext = createContext<{
  auth: AuthState;
  login: (email: string, pass: string) => boolean;
  register: (name: string, email: string, phone: string, pass: string) => void;
  logout: () => void;
} | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Components ---
const Navbar = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              DriveEasy
            </Link>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link to="/" className="text-zinc-600 hover:text-blue-600 font-medium">Browse Cars</Link>
            {auth.isAuthenticated ? (
              <>
                {auth.user?.role === UserRole.ADMIN ? (
                  <Link to="/admin" className="text-zinc-600 hover:text-blue-600 font-medium">Dashboard</Link>
                ) : (
                  <Link to="/my-bookings" className="text-zinc-600 hover:text-blue-600 font-medium">My Bookings</Link>
                )}
                <button onClick={() => { logout(); navigate('/login'); }} className="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-zinc-600 hover:text-blue-600 font-medium">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- Pages ---
const Home = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [filter, setFilter] = useState({ brand: '', fuel: '' });
  const navigate = useNavigate();

  useEffect(() => {
    MockDB.getCars().then(setCars);
  }, []);

  const filteredCars = cars.filter(c =>
    c.availability &&
    (filter.brand === '' || c.brand.toLowerCase() === filter.brand.toLowerCase()) &&
    (filter.fuel === '' || c.fuel_type.toLowerCase() === filter.fuel.toLowerCase())
  );

  const brands = Array.from(new Set(cars.map(c => c.brand)));
  const fuels = Array.from(new Set(cars.map(c => c.fuel_type)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-zinc-900 mb-4">Rent Your Dream Car in India</h1>
        <p className="text-lg text-zinc-600 max-w-2xl mx-auto">Verified fleet, Indian brands, and professional drivers at your service.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 mb-10 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Brand</label>
          <select
            className="w-full border-zinc-200 rounded-lg focus:ring-blue-500"
            value={filter.brand}
            onChange={(e) => setFilter({ ...filter, brand: e.target.value })}
          >
            <option value="">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-zinc-500 uppercase mb-1">Fuel Type</label>
          <select
            className="w-full border-zinc-200 rounded-lg focus:ring-blue-500"
            value={filter.fuel}
            onChange={(e) => setFilter({ ...filter, fuel: e.target.value })}
          >
            <option value="">All Fuels</option>
            {fuels.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCars.map(car => (
          <div key={car.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-200 hover:shadow-xl transition-shadow group">
            <div className="relative h-56">
              <img src={car.image} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-600 uppercase tracking-wider">
                {car.brand}
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">{car.name}</h3>
                  <p className="text-zinc-500 text-sm">{car.fuel_type}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600">₹{car.price_per_day}</span>
                  <span className="text-zinc-400 text-sm">/day</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/car/${car.id}`)}
                className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-blue-600 transition"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [dates, setDates] = useState({ pickup: '', return: '' });
  const [includeDriver, setIncludeDriver] = useState(false);
  const [driverIdProof, setDriverIdProof] = useState<string | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    MockDB.getCars().then(cars => {
      const found = cars.find(c => c.id === Number(id));
      setCar(found || null);
    });
  }, [id]);

  useEffect(() => {
    if (dates.pickup && dates.return && car) {
      const start = new Date(dates.pickup);
      const end = new Date(dates.return);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
      if (diff > 0) {
        let daily = car.price_per_day;
        if (includeDriver) daily += DRIVER_DAILY_FEE;
        setTotalPrice(diff * daily);
      } else {
        setTotalPrice(0);
      }
    }
  }, [dates, car, includeDriver]);

  if (!car) return <div className="p-10 text-center font-bold text-xl">Car not found or unavailable.</div>;

  const handleDriverIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const b64 = await fileToBase64(file);
      setDriverIdProof(b64);
    }
  };

  const handleBooking = async () => {
    if (!auth.isAuthenticated) {
      navigate('/login');
      return;
    }
    if (totalPrice <= 0) {
      alert("Please select valid dates");
      return;
    }
    await MockDB.createBooking({
      user_id: auth.user!.id,
      car_id: car!.id,
      pickup_date: dates.pickup,
      return_date: dates.return,
      total_price: totalPrice,
      status: BookingStatus.PENDING,
      has_driver: includeDriver,
      driver_id_proof: driverIdProof || undefined
    });
    alert("Booking requested successfully!");
    navigate('/my-bookings');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="rounded-3xl overflow-hidden shadow-2xl h-[500px]">
          <img src={car.image} className="w-full h-full object-cover" />
        </div>
        <div className="space-y-8">
          <div>
            <span className="text-blue-600 font-bold tracking-widest uppercase text-sm">{car.brand}</span>
            <h1 className="text-5xl font-black text-zinc-900 mt-2">{car.name}</h1>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-100 p-4 rounded-2xl">
              <p className="text-xs text-zinc-500 font-bold uppercase">Base Rate</p>
              <p className="text-2xl font-black text-zinc-900">₹{car.price_per_day}/day</p>
            </div>
            <div className="bg-zinc-100 p-4 rounded-2xl">
              <p className="text-xs text-zinc-500 font-bold uppercase">Fuel Type</p>
              <p className="text-2xl font-black text-zinc-900">{car.fuel_type}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold">Secure Your Booking</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Pickup Date</label>
                <input
                  type="date"
                  className="w-full p-3 border-zinc-200 rounded-xl"
                  value={dates.pickup}
                  onChange={(e) => setDates({ ...dates, pickup: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Return Date</label>
                <input
                  type="date"
                  className="w-full p-3 border-zinc-200 rounded-xl"
                  value={dates.return}
                  onChange={(e) => setDates({ ...dates, return: e.target.value })}
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 cursor-pointer hover:bg-zinc-100 transition">
              <input
                type="checkbox"
                className="w-5 h-5 rounded text-blue-600"
                checked={includeDriver}
                onChange={(e) => setIncludeDriver(e.target.checked)}
              />
              <div>
                <p className="font-bold text-zinc-900 text-sm">Hire Professional Driver</p>
                <p className="text-xs text-zinc-500">+₹{DRIVER_DAILY_FEE} extra per day</p>
              </div>
            </label>

            {includeDriver && (
              <div className="space-y-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <label className="block text-xs font-black text-blue-600 uppercase">Your ID Proof (for Driver Service)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDriverIdUpload}
                  className="text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {driverIdProof && <p className="text-[10px] font-bold text-emerald-600">ID Attached Successfully</p>}
              </div>
            )}

            {totalPrice > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-blue-800">Final Price</span>
                <span className="text-3xl font-black text-blue-600">₹{totalPrice}</span>
              </div>
            )}
            <button
              onClick={handleBooking}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
            >
              Proceed to Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Auth Components ---
const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await login(form.email, form.password)) navigate('/');
    else alert('Invalid credentials');
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-zinc-100">
      <h2 className="text-3xl font-black text-zinc-900 mb-8">Welcome Back</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-zinc-700 mb-2">Email Address</label>
          <input type="email" required className="w-full p-4 border-zinc-200 rounded-2xl" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-bold text-zinc-700 mb-2">Password</label>
          <input type="password" required className="w-full p-4 border-zinc-200 rounded-2xl" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-lg hover:bg-zinc-800 transition">Sign In</button>
      </form>
    </div>
  );
};

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(form.name, form.email, form.phone, form.password);
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-zinc-100">
      <h2 className="text-3xl font-black text-zinc-900 mb-8">Join DriveEasy</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-zinc-700 mb-2">Full Name</label>
          <input type="text" required className="w-full p-4 border-zinc-200 rounded-2xl" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-bold text-zinc-700 mb-2">Email</label>
          <input type="email" required className="w-full p-4 border-zinc-200 rounded-2xl" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-bold text-zinc-700 mb-2">Phone</label>
          <input type="text" required className="w-full p-4 border-zinc-200 rounded-2xl" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-bold text-zinc-700 mb-2">Password</label>
          <input type="password" required className="w-full p-4 border-zinc-200 rounded-2xl" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition">Register</button>
      </form>
    </div>
  );
};

const MyBookings = () => {
  const { auth } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    MockDB.getBookings().then(all => {
      setBookings(all.filter(b => b.user_id === auth.user?.id));
    });
  }, [auth.user?.id]);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING: return 'bg-amber-100 text-amber-700';
      case BookingStatus.APPROVED: return 'bg-emerald-100 text-emerald-700';
      case BookingStatus.REJECTED: return 'bg-rose-100 text-rose-700';
      case BookingStatus.COMPLETED: return 'bg-blue-100 text-blue-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  const openInNewTab = (base64: string) => {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-black text-zinc-900 mb-8">My Road Adventures</h2>
      <div className="space-y-6">
        {bookings.length === 0 ? (
          <div className="text-center p-20 bg-white rounded-3xl border border-zinc-200">
            <p className="text-zinc-500 text-lg mb-4">No bookings yet.</p>
            <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold inline-block">Explore Fleet</Link>
          </div>
        ) : (
          bookings.map(b => (
            <div key={b.id} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200 flex flex-wrap gap-8 items-center">
              <img src={b.car?.image} className="w-32 h-24 object-cover rounded-xl shadow-inner" />
              <div className="flex-1">
                <h4 className="text-xl font-bold text-zinc-900">{b.car?.name} <span className="text-xs font-normal text-zinc-400">({b.car?.brand})</span></h4>
                <p className="text-zinc-500 text-sm mt-1">{b.pickup_date} to {b.return_date}</p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {b.car?.rc_doc && (
                    <button onClick={() => openInNewTab(b.car!.rc_doc!)} className="text-[10px] bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg font-bold uppercase text-zinc-600">Vehicle RC</button>
                  )}
                  {b.car?.insurance_doc && (
                    <button onClick={() => openInNewTab(b.car!.insurance_doc!)} className="text-[10px] bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg font-bold uppercase text-zinc-600">Insurance</button>
                  )}
                </div>

                {b.driver_name && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Assigned Professional Driver</p>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-zinc-800">{b.driver_name} • {b.driver_phone}</p>
                      {b.driver_id_proof && (
                        <button onClick={() => openInNewTab(b.driver_id_proof!)} className="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm">View Driver ID</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-zinc-900">₹{b.total_price}</p>
                <div className="flex flex-col items-end gap-2 mt-2">
                  <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase ${getStatusColor(b.status)}`}>
                    {b.status}
                  </span>
                  {b.has_driver && <span className="text-[10px] font-bold text-blue-600 border border-blue-200 px-2 py-0.5 rounded-md uppercase">Driver Service</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'cars'>('bookings');
  const [editingCarId, setEditingCarId] = useState<number | null>(null);
  const [driverEntry, setDriverEntry] = useState<{ id: number, name: string, phone: string, id_proof?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rcInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    Promise.all([MockDB.getBookings(), MockDB.getCars(), MockDB.getUsers()]).then(([b, c, u]) => {
      setBookings(b);
      setCars(c);
      setUsers(u);
    });
  }, []);

  const [newCar, setNewCar] = useState<Partial<Car>>({
    name: '', brand: '', price_per_day: 0, fuel_type: '', image: '', availability: true, rc_doc: '', insurance_doc: ''
  });

  const handleStatus = async (id: number, status: BookingStatus) => {
    if (status === BookingStatus.APPROVED) {
      const b = bookings.find(x => x.id === id);
      if (b?.has_driver) {
        setDriverEntry({ id, name: '', phone: '', id_proof: '' });
        return;
      }
    }
    await MockDB.updateBookingStatus(id, status);
    window.location.reload();
  };

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (driverEntry) {
      await MockDB.updateBookingStatus(driverEntry.id, BookingStatus.APPROVED, {
        name: driverEntry.name, phone: driverEntry.phone, id_proof: driverEntry.id_proof
      });
      setDriverEntry(null);
      window.location.reload();
    }
  };

  const handleCarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'rc_doc' | 'insurance_doc') => {
    const file = e.target.files?.[0];
    if (file) {
      const b64 = await fileToBase64(file);
      setNewCar(prev => ({ ...prev, [field]: b64 }));
    }
  };

  const handleEditClick = (car: Car) => {
    setEditingCarId(car.id);
    setNewCar(car);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCar.image) return alert("Upload car image.");
    await MockDB.saveCar(newCar as Car);
    resetForm();
    window.location.reload();
  };

  const resetForm = () => {
    setEditingCarId(null);
    setNewCar({ name: '', brand: '', price_per_day: 0, fuel_type: '', image: '', availability: true, rc_doc: '', insurance_doc: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (rcInputRef.current) rcInputRef.current.value = '';
    if (insuranceInputRef.current) insuranceInputRef.current.value = '';
  };

  const openInNewTab = (base64: string) => {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Driver Assignment Modal */}
      {driverEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black mb-2">Assign Driver</h3>
            <p className="text-zinc-500 mb-8 text-sm leading-relaxed">Please manually provide driver details and upload an ID proof to complete the approval.</p>
            <form onSubmit={handleAssignDriver} className="space-y-5">
              <input type="text" placeholder="Driver Full Name" required className="w-full p-4 border rounded-2xl bg-zinc-50 border-zinc-200" value={driverEntry.name} onChange={e => setDriverEntry({ ...driverEntry, name: e.target.value })} />
              <input type="text" placeholder="Contact Number" required className="w-full p-4 border rounded-2xl bg-zinc-50 border-zinc-200" value={driverEntry.phone} onChange={e => setDriverEntry({ ...driverEntry, phone: e.target.value })} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Upload ID Proof</label>
                <input type="file" accept="image/*" required className="w-full p-3 border rounded-2xl bg-zinc-50 border-zinc-200 text-sm" onChange={async (e) => {
                  const f = e.target.files?.[0]; if (f) { const b64 = await fileToBase64(f); setDriverEntry({ ...driverEntry, id_proof: b64 }); }
                }} />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setDriverEntry(null)} className="flex-1 py-4 font-bold text-zinc-400 hover:text-zinc-600 transition">Discard</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200">Save & Approve</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Admin Console</h1>
          <p className="text-zinc-500 mt-2 font-medium">Full Manual Management of Fleet & Documents.</p>
        </div>
        <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-zinc-200">
          <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'bookings' ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-300' : 'text-zinc-500 hover:text-zinc-900'}`}>Requests</button>
          <button onClick={() => setActiveTab('cars')} className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'cars' ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-300' : 'text-zinc-500 hover:text-zinc-900'}`}>Fleet Fleet</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Pending Requests', val: bookings.filter(b => b.status === BookingStatus.PENDING).length },
          { label: 'Active Fleet', val: cars.filter(c => c.availability).length },
          { label: 'Total Revenue', val: `₹${bookings.filter(b => b.status === BookingStatus.COMPLETED).reduce((acc, b) => acc + b.total_price, 0)}` }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-4xl font-black text-zinc-900">{stat.val}</p>
          </div>
        ))}
      </div>

      {activeTab === 'bookings' ? (
        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Vehicle Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase text-center">Driver</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase">Pricing</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-zinc-50/50 transition">
                  <td className="px-6 py-5">
                    <p className="font-bold text-zinc-900">{b.user?.name}</p>
                    <p className="text-xs text-zinc-400">{b.user?.email}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-zinc-800">{b.car?.name}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">{b.pickup_date} → {b.return_date}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${b.has_driver ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-500'}`}>{b.has_driver ? 'Yes' : 'No'}</span>
                      {b.driver_id_proof && <button onClick={() => openInNewTab(b.driver_id_proof!)} className="text-[8px] bg-zinc-800 text-white px-2 py-1 rounded-md font-bold hover:scale-105 transition">VIEW ID</button>}
                    </div>
                  </td>
                  <td className="px-6 py-5 font-black text-lg">₹{b.total_price}</td>
                  <td className="px-6 py-5 text-right space-x-3">
                    {b.status === BookingStatus.PENDING && (
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleStatus(b.id, BookingStatus.APPROVED)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-100 active:scale-95 transition">APPROVE</button>
                        <button onClick={() => handleStatus(b.id, BookingStatus.REJECTED)} className="bg-zinc-200 text-zinc-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-rose-50 hover:text-rose-600 transition active:scale-95">REJECT</button>
                      </div>
                    )}
                    {b.status === BookingStatus.APPROVED && <button onClick={() => handleStatus(b.id, BookingStatus.COMPLETED)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-100 active:scale-95 transition">MARK COMPLETED</button>}
                    {b.status === BookingStatus.COMPLETED && <span className="text-[10px] font-black text-zinc-300 uppercase italic">Archived</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Manual Car Form */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-zinc-900">{editingCarId ? 'Manual Vehicle Overhaul' : 'Add New Manual Entry'}</h3>
                <p className="text-zinc-400 text-sm">Update every detail manually including documents.</p>
              </div>
              {editingCarId && <button onClick={resetForm} className="text-xs font-bold text-rose-500 hover:underline px-4 py-2 rounded-lg bg-rose-50">Cancel Edit</button>}
            </div>
            <form onSubmit={handleSaveCar} className="space-y-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Display Name</label>
                  <input type="text" placeholder="e.g. Scorpio-N" className="w-full p-4 border rounded-2xl bg-zinc-50 border-zinc-200" required value={newCar.name} onChange={e => setNewCar({ ...newCar, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Brand</label>
                  <input type="text" placeholder="e.g. Mahindra" className="w-full p-4 border rounded-2xl bg-zinc-50 border-zinc-200" required value={newCar.brand} onChange={e => setNewCar({ ...newCar, brand: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Rent / Day (₹)</label>
                  <input type="number" placeholder="e.g. 4500" className="w-full p-4 border rounded-2xl bg-zinc-50 border-zinc-200" required value={newCar.price_per_day} onChange={e => setNewCar({ ...newCar, price_per_day: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Power Source</label>
                  <input type="text" placeholder="e.g. Diesel / Petrol" className="w-full p-4 border rounded-2xl bg-zinc-50 border-zinc-200" required value={newCar.fuel_type} onChange={e => setNewCar({ ...newCar, fuel_type: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Operational Status</label>
                  <select className="w-full p-4 border rounded-2xl bg-zinc-50 border-zinc-200 font-bold" value={newCar.availability ? 'true' : 'false'} onChange={e => setNewCar({ ...newCar, availability: e.target.value === 'true' })}>
                    <option value="true">Live & Available</option>
                    <option value="false">Under Maintenance / Hidden</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Hero Image</label>
                  <input type="file" accept="image/*" ref={fileInputRef} className="w-full p-3 border rounded-2xl bg-zinc-50 border-zinc-200 text-sm" onChange={(e) => handleCarFileUpload(e, 'image')} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 p-8 bg-zinc-900 rounded-[2rem] text-white">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Registration Certificate (RC)</label>
                  <input type="file" accept="image/*,application/pdf" ref={rcInputRef} className="w-full p-3 border border-zinc-800 bg-zinc-800 rounded-xl text-xs text-zinc-400 file:bg-zinc-700 file:text-white file:border-0 file:mr-4 file:px-4 file:py-1 file:rounded" onChange={(e) => handleCarFileUpload(e, 'rc_doc')} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Insurance Policy</label>
                  <input type="file" accept="image/*,application/pdf" ref={insuranceInputRef} className="w-full p-3 border border-zinc-800 bg-zinc-800 rounded-xl text-xs text-zinc-400 file:bg-zinc-700 file:text-white file:border-0 file:mr-4 file:px-4 file:py-1 file:rounded" onChange={(e) => handleCarFileUpload(e, 'insurance_doc')} />
                </div>
              </div>

              <button type="submit" className={`w-full py-5 text-white font-black rounded-3xl transition shadow-2xl active:scale-[0.98] ${editingCarId ? 'bg-amber-500 shadow-amber-200' : 'bg-blue-600 shadow-blue-200'}`}>
                {editingCarId ? 'Update Master Record' : 'Commit New Vehicle to Fleet'}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cars.map(car => (
              <div key={car.id} className={`bg-white p-7 rounded-[2rem] border transition shadow-sm group hover:shadow-xl ${car.availability ? 'border-zinc-200' : 'border-rose-100 bg-rose-50/20'}`}>
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <img src={car.image} className="w-24 h-24 object-cover rounded-3xl shadow-lg ring-4 ring-white" />
                    {!car.availability && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-3xl flex items-center justify-center"><span className="text-[10px] font-black text-white uppercase tracking-tighter">OFFLINE</span></div>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-xl text-zinc-900 tracking-tight">{car.name}</h4>
                    <p className="text-sm font-bold text-blue-600">{car.brand}</p>
                    <p className="text-xs font-black text-zinc-400 mt-1 uppercase">₹{car.price_per_day} / DAY</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {['rc_doc', 'insurance_doc'].map((doc, idx) => (
                    car[doc as keyof Car] ? (
                      <button key={idx} onClick={() => openInNewTab(car[doc as keyof Car] as string)} className="flex-1 text-[9px] bg-zinc-100 hover:bg-zinc-200 py-2 rounded-xl font-black uppercase text-zinc-600 border border-zinc-200 transition">View {doc.split('_')[0]}</button>
                    ) : (
                      <div key={idx} className="flex-1 text-[9px] bg-zinc-50 py-2 rounded-xl font-bold uppercase text-zinc-300 border border-zinc-100 text-center">No {doc.split('_')[0]}</div>
                    )
                  ))}
                </div>

                <div className="flex gap-3 justify-between border-t border-zinc-100 pt-5">
                  <button onClick={() => handleEditClick(car)} className="flex-1 bg-zinc-100 hover:bg-zinc-900 hover:text-white py-3 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    RETOOL
                  </button>
                  <button onClick={() => { if (confirm('Wipe car record?')) MockDB.deleteCar(car.id); window.location.reload(); }} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Auth Provider ---
const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('drive_auth');
    return saved ? JSON.parse(saved) : { user: null, token: null, isAuthenticated: false };
  });

  const login = async (email: string, pass: string) => {
    const users = await MockDB.getUsers();
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      const newState = { user, token: 'mock-jwt-token', isAuthenticated: true };
      setAuth(newState);
      localStorage.setItem('drive_auth', JSON.stringify(newState));
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, phone: string, pass: string) => {
    const newUser = await MockDB.registerUser({ name, email, phone, password: pass });
    const newState = { user: newUser, token: 'mock-jwt-token', isAuthenticated: true };
    setAuth(newState);
    localStorage.setItem('drive_auth', JSON.stringify(newState));
  };

  const logout = () => {
    setAuth({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem('drive_auth');
  };

  return (
    <AuthContext.Provider value={{ auth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Main App Component ---
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/car/:id" element={<CarDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/my-bookings" element={<ProtectedRoute role={UserRole.USER}><MyBookings /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute role={UserRole.ADMIN}><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-zinc-200 py-10 mt-12">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-zinc-400 font-medium">© 2024 DriveEasy Car Rental India. Built for educational excellence.</p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </HashRouter>
  );
}

// --- Protected Route Helper ---
const ProtectedRoute = ({ children, role }: { children?: React.ReactNode, role?: UserRole }) => {
  const { auth } = useAuth();
  if (!auth.isAuthenticated) return <Navigate to="/login" />;
  if (role && auth.user?.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
}
