import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { User, AuthState, UserRole, Car, BookingStatus, Booking } from './types';
import apiService from './services/apiService';

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
interface AuthContextType {
  auth: AuthState;
  login: (email: string, pass: string) => Promise<{ success: boolean, error?: string }>;
  verifyLogin: (email: string, otp: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, pass: string) => Promise<{ success: boolean, error?: string }>;
  verifyRegister: (email: string, otp: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    <nav className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pointer-events-none">
      <div className="max-w-7xl mx-auto glass-morphism rounded-2xl pointer-events-auto transition-all duration-300">
        <div className="flex justify-between h-16 px-6">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-black text-white flex items-center gap-2 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <span className="tracking-tighter">DRIVE<span className="text-blue-500">EASY</span></span>
            </Link>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-12">
            <Link to="/" className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all">Browse fleet</Link>
            {auth.isAuthenticated ? (
              <>
                {auth.user?.role === UserRole.ADMIN ? (
                  <Link to="/admin" className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all">Dashboard</Link>
                ) : (
                  <Link to="/my-bookings" className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all">My Bookings</Link>
                )}
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="bg-white/5 text-white border border-white/10 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 ml-4"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 ml-4">Register</Link>
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
    apiService.getCars().then(setCars);
  }, []);

  const filteredCars = cars.filter(c =>
    c.availability &&
    (filter.brand === '' || c.brand.toLowerCase() === filter.brand.toLowerCase()) &&
    (filter.fuel === '' || c.fuel_type.toLowerCase() === filter.fuel.toLowerCase())
  );

  const brands = Array.from(new Set(cars.map(c => c.brand)));
  const fuels = Array.from(new Set(cars.map(c => c.fuel_type)));

  return (
    <div className="relative pt-24 pb-20">
      <div className="bg-mesh"></div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
          Drive the Future of <br />
          <span className="gradient-text">Premium Car Rental</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-medium">
          Experience luxury on your terms. Verified fleet, transparent pricing, and professional service across India.
        </p>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="glass-morphism p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-center backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                className="appearance-none bg-white/5 border border-white/10 text-white pl-6 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-sm cursor-pointer transition-all hover:bg-white/10"
                value={filter.brand}
                onChange={(e) => setFilter({ ...filter, brand: e.target.value })}
              >
                <option value="" className="bg-slate-900">All Brands</option>
                {brands.map(b => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-white/5 border border-white/10 text-white pl-6 pr-12 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-sm cursor-pointer transition-all hover:bg-white/10"
                value={filter.fuel}
                onChange={(e) => setFilter({ ...filter, fuel: e.target.value })}
              >
                <option value="" className="bg-slate-900">All Fuels</option>
                {fuels.map(f => <option key={f} value={f} className="bg-slate-900">{f}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <button
            onClick={() => setFilter({ brand: '', fuel: '' })}
            className="text-zinc-500 hover:text-white transition-colors text-sm font-bold ml-4"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCars.map(car => (
            <div key={car.id} className="premium-card rounded-[2rem] overflow-hidden group">
              <div className="relative h-64 overflow-hidden">
                <img
                  src={car.image}
                  alt={car.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                <div className="absolute top-6 left-6">
                  <span className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-xl">
                    {car.brand}
                  </span>
                </div>
              </div>

              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{car.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{car.fuel_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-500 font-bold -mb-1">Starting from</p>
                    <span className="text-3xl font-black text-white">₹{car.price_per_day}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/car/${car.id}`)}
                  className="w-full py-4 bg-white/5 hover:bg-blue-600 text-white rounded-2xl font-black tracking-widest uppercase text-xs transition-all duration-300 border border-white/10 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
                >
                  Book Experience
                </button>
              </div>
            </div>
          ))}
        </div>
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
    apiService.getCars().then(cars => {
      const found = cars.find(c => c.id.toString() === id);
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

  if (!car) return <div className="p-20 text-center font-black text-2xl text-zinc-500">Retrieving vehicle specifications...</div>;

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
    await apiService.createBooking({
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
    <div className="max-w-7xl mx-auto px-4 py-32 relative">
      <div className="bg-mesh"></div>
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        <div className="sticky top-32">
          <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/5 h-[600px] group">
            <img src={car.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="animate-fade-in">
            <span className="text-blue-500 font-black tracking-widest uppercase text-xs">{car.brand}</span>
            <h1 className="text-6xl font-black text-white mt-2 tracking-tighter">{car.name}</h1>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="glass-morphism p-6 rounded-3xl border border-white/5">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Base Rental Rate</p>
              <p className="text-3xl font-black text-white">₹{car.price_per_day}<span className="text-sm text-zinc-500 font-medium">/day</span></p>
            </div>
            <div className="glass-morphism p-6 rounded-3xl border border-white/5">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Engine Type</p>
              <p className="text-3xl font-black text-white uppercase">{car.fuel_type}</p>
            </div>
          </div>

          <div className="glass-morphism p-10 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8 backdrop-blur-3xl">
            <h3 className="text-2xl font-black text-white tracking-tight">Reservation Details</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Pickup Date</label>
                <input
                  type="date"
                  className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  value={dates.pickup}
                  onChange={(e) => setDates({ ...dates, pickup: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Return Date</label>
                <input
                  type="date"
                  className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  value={dates.return}
                  onChange={(e) => setDates({ ...dates, return: e.target.value })}
                />
              </div>
            </div>

            <label className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  className="peer appearance-none w-6 h-6 rounded-lg border-2 border-white/20 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                  checked={includeDriver}
                  onChange={(e) => setIncludeDriver(e.target.checked)}
                />
                <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <div className="flex-1">
                <p className="font-black text-white text-sm tracking-tight">Include Driver Service</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">+₹{DRIVER_DAILY_FEE} per day</p>
              </div>
            </label>

            {includeDriver && (
              <div className="space-y-4 p-6 bg-blue-600/5 rounded-[2rem] border border-blue-500/20 animate-fade-in">
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest">ID Proof (Required)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDriverIdUpload}
                    className="flex-1 text-xs text-zinc-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer transition-all"
                  />
                  {driverIdProof && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase">Attached</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between items-center mb-6">
                <span className="text-zinc-400 font-bold">Total Price</span>
                <span className="text-4xl font-black text-white">₹{totalPrice}</span>
              </div>
              <button
                onClick={handleBooking}
                className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Auth Components ---
const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
  const [showPassword, setShowPassword] = useState(false);
  const { login, verifyLogin } = useAuth() as any;
  const navigate = useNavigate();
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleInit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) {
      setStep(2);
      setTimer(120); // 2 minutes
    } else {
      alert(result.error || 'Invalid credentials');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await verifyLogin(form.email, otp);
    if (success) {
      navigate('/');
    } else {
      alert('Invalid or expired OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-32 relative">
      <div className="bg-mesh"></div>
      <div className="max-w-md w-full glass-morphism p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative z-10 backdrop-blur-3xl animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{step === 1 ? 'Login' : 'Verify Login'}</h2>
          <p className="text-zinc-500 font-bold mt-2 uppercase text-[10px] tracking-widest">{step === 1 ? 'Enter credentials to continue' : 'Enter 6-digit OTP'}</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleInit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                placeholder="e.g. user@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group/pass">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-white/5 border border-white/10 text-white p-4 pr-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-500/20 transition-all active:scale-[0.98]">
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-center">Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                className="w-full bg-white/5 border border-white/10 text-white p-6 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-4xl text-center tracking-[1rem]"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <div className="flex justify-between items-center mt-4">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {timer > 0 ? (
                    <span>Expires in <span className="text-blue-500">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span></span>
                  ) : (
                    <span className="text-red-500 italic text-[8px]">OTP Expired</span>
                  )}
                </p>
                <button
                  type="button"
                  disabled={timer > 0}
                  onClick={() => handleInit()}
                  className={`text-[10px] font-black uppercase tracking-widest transition-colors ${timer > 0 ? 'text-zinc-700 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'}`}
                >
                  Resend OTP
                </button>
              </div>
            </div>
            <button type="submit" disabled={timer === 0} className={`w-full py-5 text-white rounded-[1.5rem] font-black text-lg shadow-2xl transition-all active:scale-[0.98] ${timer === 0 ? 'bg-zinc-800 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}`}>
              Login
            </button>
            <button type="button" onClick={() => { setStep(1); setTimer(0); }} className="w-full text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Edit Details</button>
          </form>
        )}
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm font-bold">New user? <Link to="/register" className="text-blue-500 hover:text-blue-400 transition-colors">Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [showPassword, setShowPassword] = useState(false);
  const { register, verifyRegister } = useAuth() as any;
  const navigate = useNavigate();
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleInit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = await register(form.name, form.email, form.phone, form.password);
    if (result.success) {
      setStep(2);
      setTimer(120); // 2 minutes
    } else {
      alert(result.error || 'Failed to initiate registration');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await verifyRegister(form.email, otp);
    if (success) {
      navigate('/');
    } else {
      alert('Invalid or expired OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-32 relative">
      <div className="bg-mesh"></div>
      <div className="max-w-md w-full glass-morphism p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative z-10 backdrop-blur-3xl animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">{step === 1 ? 'Register' : 'Verify Email'}</h2>
          <p className="text-zinc-500 font-bold mt-2 uppercase text-[10px] tracking-widest">{step === 1 ? 'Create your account' : 'Enter 6-digit OTP'}</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleInit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
              <input type="text" required className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" placeholder="e.g. John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email</label>
              <input type="email" required className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" placeholder="e.g. user@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Phone Number</label>
              <input type="text" required className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" placeholder="e.g. +91 99XXXXXX00" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group/pass">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-white/5 border border-white/10 text-white p-4 pr-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-500/20 transition-all active:scale-[0.98] mt-4">
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 text-center">Verification Code</label>
              <input
                type="text"
                required
                maxLength={6}
                className="w-full bg-white/5 border border-white/10 text-white p-6 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-4xl text-center tracking-[1rem]"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <div className="flex justify-between items-center mt-4">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {timer > 0 ? (
                    <span>Expires in <span className="text-blue-500">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span></span>
                  ) : (
                    <span className="text-red-500 italic text-[8px]">OTP Expired</span>
                  )}
                </p>
                <button
                  type="button"
                  disabled={timer > 0}
                  onClick={() => handleInit()}
                  className={`text-[10px] font-black uppercase tracking-widest transition-colors ${timer > 0 ? 'text-zinc-700 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'}`}
                >
                  Resend OTP
                </button>
              </div>
            </div>
            <button type="submit" disabled={timer === 0} className={`w-full py-5 text-white rounded-[1.5rem] font-black text-lg shadow-2xl transition-all active:scale-[0.98] ${timer === 0 ? 'bg-zinc-800 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}`}>
              Verify & Register
            </button>
            <button type="button" onClick={() => { setStep(1); setTimer(0); }} className="w-full text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Edit Details</button>
          </form>
        )}
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm font-bold">Already a member? <Link to="/login" className="text-blue-500 hover:text-blue-400 transition-colors">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

const MyBookings = () => {
  const { auth } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    apiService.getBookings().then(all => {
      setBookings(all.filter(b => b.user_id.toString() === auth.user?.id.toString()));
    });
  }, [auth.user?.id]);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING: return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case BookingStatus.APPROVED: return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case BookingStatus.REJECTED: return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case BookingStatus.COMPLETED: return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
    }
  };

  const openInNewTab = (base64: string) => {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 relative">
      <div className="bg-mesh"></div>
      <div className="mb-16">
        <h1 className="text-5xl font-black text-white tracking-tighter mb-4 italic">My Bookings</h1>
        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest ml-1">Archive of your reservations</p>
      </div>

      <div className="space-y-8">
        {bookings.length === 0 ? (
          <div className="glass-morphism p-20 rounded-[3rem] text-center border border-white/5 animate-fade-in shadow-2xl">
            <p className="text-zinc-500 text-lg mb-8 font-bold">No active reservations in your history.</p>
            <Link to="/" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95">Explore the Fleet</Link>
          </div>
        ) : (
          bookings.map(b => (
            <div key={b.id.toString()} className="glass-morphism p-10 rounded-[2.5rem] border border-white/5 flex flex-wrap gap-12 items-center group transition-all duration-700 hover:border-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/5 backdrop-blur-3xl animate-fade-in">
              <div className="w-48 h-32 rounded-[2rem] overflow-hidden shadow-2xl shrink-0 border border-white/10 group-hover:rotate-1 transition-transform">
                <img src={b.car?.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              </div>
              <div className="flex-1 min-w-[300px]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-3xl font-black text-white tracking-tight">{b.car?.name}</h4>
                    <p className="text-blue-500 font-black text-[10px] uppercase tracking-widest mt-1 opacity-70">{b.car?.brand}</p>
                  </div>
                  <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl ${getStatusColor(b.status)}`}>
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Duration</p>
                    <p className="font-bold text-zinc-300 text-sm">{b.pickup_date} <span className="text-blue-500 opacity-50 px-1">→</span> {b.return_date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total Price</p>
                    <p className="font-black text-white text-lg">₹{b.total_price}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {b.car?.rc_doc && (
                      <button onClick={() => openInNewTab(b.car!.rc_doc!)} className="text-[9px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg font-black uppercase text-zinc-400 transition-colors">RC Doc</button>
                    )}
                    {b.car?.insurance_doc && (
                      <button onClick={() => openInNewTab(b.car!.insurance_doc!)} className="text-[9px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg font-black uppercase text-zinc-400 transition-colors">Insurance</button>
                    )}
                  </div>
                </div>

                {b.driver_name && (
                  <div className="p-6 bg-blue-600/5 rounded-3xl border border-blue-500/10 flex justify-between items-center group/driver">
                    <div>
                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Driver Details</p>
                      <p className="text-sm font-bold text-white tracking-tight">{b.driver_name} • {b.driver_phone}</p>
                    </div>
                    {b.driver_id_proof && (
                      <button onClick={() => openInNewTab(b.driver_id_proof!)} className="text-[9px] bg-blue-600 text-white px-4 py-2 rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">Verify ID</button>
                    )}
                  </div>
                )}
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
  const [editingCarId, setEditingCarId] = useState<any>(null);
  const [driverEntry, setDriverEntry] = useState<{ id: any, name: string, phone: string, id_proof?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rcInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cars, setCars] = useState<Car[]>([]);

  const fetchAll = () => {
    Promise.all([apiService.getBookings(), apiService.getCars()]).then(([b, c]) => {
      setBookings(b);
      setCars(c);
    });
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const [newCar, setNewCar] = useState<Partial<Car>>({
    name: '', brand: '', price_per_day: 0, fuel_type: '', image: '', availability: true, rc_doc: '', insurance_doc: ''
  });

  const handleStatus = async (id: any, status: BookingStatus) => {
    if (status === BookingStatus.APPROVED) {
      const b = bookings.find(x => x.id.toString() === id.toString());
      if (b?.has_driver) {
        setDriverEntry({ id, name: '', phone: '', id_proof: '' });
        return;
      }
    }
    await apiService.updateBookingStatus(id, status);
    fetchAll();
  };

  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (driverEntry) {
      await apiService.updateBookingStatus(driverEntry.id, BookingStatus.APPROVED, {
        name: driverEntry.name, phone: driverEntry.phone, id_proof: driverEntry.id_proof
      });
      setDriverEntry(null);
      fetchAll();
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
    await apiService.saveCar(newCar as Car);
    resetForm();
    fetchAll();
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
    <div className="max-w-7xl mx-auto px-4 py-32 relative">
      <div className="bg-mesh"></div>

      {/* Driver Assignment Modal */}
      {driverEntry && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-morphism rounded-[3rem] p-12 max-w-md w-full border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.1)]">
            <h3 className="text-3xl font-black text-white tracking-tight mb-2 italic">Assign Driver</h3>
            <p className="text-zinc-500 mb-10 text-xs font-bold uppercase tracking-widest leading-relaxed">Provide driver details for this booking.</p>
            <form onSubmit={handleAssignDriver} className="space-y-6">
              <input type="text" placeholder="Driver Full Name" required className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={driverEntry.name} onChange={e => setDriverEntry({ ...driverEntry, name: e.target.value })} />
              <input type="text" placeholder="Driver Phone Number" required className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={driverEntry.phone} onChange={e => setDriverEntry({ ...driverEntry, phone: e.target.value })} />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">ID Proof Document</label>
                <input type="file" accept="image/*" required className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-white/10 file:text-white cursor-pointer" onChange={async (e) => {
                  const f = e.target.files?.[0]; if (f) { const b64 = await fileToBase64(f); setDriverEntry({ ...driverEntry, id_proof: b64 }); }
                }} />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setDriverEntry(null)} className="flex-1 py-4 font-black text-zinc-500 hover:text-white transition-colors uppercase text-[10px] tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-between items-end gap-8 mb-16">
        <div>
          <h1 className="text-6xl font-black text-white tracking-tighter italic">Admin Dashboard</h1>
          <p className="text-zinc-500 mt-2 font-bold uppercase text-[10px] tracking-widest ml-1">Manage Fleet & Bookings</p>
        </div>
        <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10 backdrop-blur-3xl">
          <button onClick={() => setActiveTab('bookings')} className={`px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'bookings' ? 'bg-white text-slate-950 shadow-2xl shadow-white/10' : 'text-zinc-500 hover:text-white'}`}>Bookings</button>
          <button onClick={() => setActiveTab('cars')} className={`px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'cars' ? 'bg-white text-slate-950 shadow-2xl shadow-white/10' : 'text-zinc-500 hover:text-white'}`}>Cars</button>
        </div>
      </div>

      {activeTab === 'bookings' ? (
        <div className="glass-morphism rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Car / Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Driver</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Price</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.map(b => (
                  <tr key={b.id.toString()} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-black text-white text-sm">{b.user?.name}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase opacity-50">{b.user?.email}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-zinc-200 text-sm">{b.car?.name}</p>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{b.pickup_date} <span className="opacity-30">/</span> {b.return_date}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${b.has_driver ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-white/5 text-zinc-500 border border-white/10'}`}>{b.has_driver ? 'Driver' : 'Self'}</span>
                        {b.driver_id_proof && <button onClick={() => openInNewTab(b.driver_id_proof!)} className="text-[8px] bg-white text-slate-950 px-2 py-0.5 rounded-md font-black hover:scale-105 transition-transform">VERIFY ID</button>}
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-white">₹{b.total_price}</td>
                    <td className="px-8 py-6 text-right space-x-3">
                      {b.status === BookingStatus.PENDING && (
                        <div className="flex justify-end gap-3">
                          <button onClick={() => handleStatus(b.id, BookingStatus.APPROVED)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">APPROVE</button>
                          <button onClick={() => handleStatus(b.id, BookingStatus.REJECTED)} className="bg-white/5 text-zinc-500 border border-white/10 px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all active:scale-95">REJECT</button>
                        </div>
                      )}
                      {b.status === BookingStatus.APPROVED && <button onClick={() => handleStatus(b.id, BookingStatus.COMPLETED)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">COMPLETE</button>}
                      {b.status === BookingStatus.REJECTED && <span className="text-[9px] font-black text-rose-500 uppercase italic opacity-50 tracking-widest">Rejected</span>}
                      {b.status === BookingStatus.COMPLETED && <span className="text-[9px] font-black text-zinc-500 uppercase italic opacity-30 tracking-widest">Completed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-16 animate-fade-in">
          {/* Manual Car Form */}
          <div className="glass-morphism p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full -mr-20 -mt-20"></div>
            <h3 className="text-3xl font-black text-white mb-10 italic tracking-tight">{editingCarId ? 'Edit Car' : 'Add New Car'}</h3>
            <form onSubmit={handleSaveCar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Model Name</label>
                <input type="text" placeholder="e.g. Scorpio-N" required className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={newCar.name} onChange={e => setNewCar({ ...newCar, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Manufacturer</label>
                <input type="text" placeholder="e.g. Mahindra" required className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={newCar.brand} onChange={e => setNewCar({ ...newCar, brand: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Price per Day</label>
                <input type="number" placeholder="Price per day" required className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={newCar.price_per_day} onChange={e => setNewCar({ ...newCar, price_per_day: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Fuel Type</label>
                <input type="text" placeholder="Diesel / EV / Petrol" required className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={newCar.fuel_type} onChange={e => setNewCar({ ...newCar, fuel_type: e.target.value })} />
              </div>

              <div className="lg:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Car Image</label>
                <input type="file" ref={fileInputRef} accept="image/*" className="w-full text-[10px] text-zinc-500 file:mr-4 file:py-3 file:px-10 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-blue-600 file:text-white cursor-pointer hover:file:bg-blue-700 transition-all border border-white/5 p-2 rounded-2xl" onChange={(e) => handleCarFileUpload(e, 'image')} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">RC Document</label>
                <input type="file" ref={rcInputRef} accept="image/*" className="w-full text-[10px] text-zinc-500 file:mr-4 file:py-3 file:px-10 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-emerald-600 file:text-white cursor-pointer hover:file:bg-emerald-700 transition-all border border-white/5 p-2 rounded-2xl" onChange={(e) => handleCarFileUpload(e, 'rc_doc')} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Insurance Document</label>
                <input type="file" ref={insuranceInputRef} accept="image/*" className="w-full text-[10px] text-zinc-500 file:mr-4 file:py-3 file:px-10 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-amber-600 file:text-white cursor-pointer hover:file:bg-amber-700 transition-all border border-white/5 p-2 rounded-2xl" onChange={(e) => handleCarFileUpload(e, 'insurance_doc')} />
              </div>

              <div className="lg:col-span-4 flex justify-end gap-6 pt-8 border-t border-white/5 mt-4">
                <button type="button" onClick={resetForm} className="px-10 py-4 font-black text-zinc-500 hover:text-white transition-colors uppercase text-[10px] tracking-widest">Reset</button>
                <button type="submit" className="px-14 py-4 bg-white text-slate-950 font-black rounded-2xl shadow-2xl shadow-white/10 hover:bg-zinc-100 transition-all active:scale-95 uppercase text-[10px] tracking-widest">Save Car</button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
            {cars.map(car => (
              <div key={car.id.toString()} className="glass-morphism rounded-[2.5rem] overflow-hidden border border-white/5 group hover:border-blue-500/20 transition-all shadow-2xl backdrop-blur-3xl">
                <div className="relative h-48 overflow-hidden">
                  <img src={car.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => handleEditClick(car)} className="p-2.5 bg-white/10 backdrop-blur-xl rounded-xl text-white hover:bg-blue-600 transition-colors shadow-2xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                    <button onClick={async () => { if (confirm("Delete this car?")) { await apiService.deleteCar(car.id); fetchAll(); } }} className="p-2.5 bg-white/10 backdrop-blur-xl rounded-xl text-white hover:bg-rose-600 transition-colors shadow-2xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-xl font-black text-white">{car.name}</h4>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{car.brand}</p>
                    </div>
                    <span className="text-2xl font-black text-white">₹{car.price_per_day}</span>
                  </div>
                  <div className="flex gap-2">
                    {car.rc_doc && <button onClick={() => openInNewTab(car.rc_doc!)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:bg-white/10 transition-all">RC</button>}
                    {car.insurance_doc && <button onClick={() => openInNewTab(car.insurance_doc!)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:bg-white/10 transition-all">Insurance</button>}
                  </div>
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

  const login = async (email: string, password: string): Promise<{ success: boolean, error?: string }> => {
    try {
      const result = await apiService.loginInit({ email, password });
      if ('error' in result) {
        return { success: false, error: result.error };
      }
      return { success: true };
    } catch (error) {
      console.error('Login initiation error:', error);
      return { success: false, error: 'Failed to initiate login' };
    }
  };

  const verifyLogin = async (email: string, otp: string): Promise<boolean> => {
    try {
      const result = await apiService.loginVerify(email, otp);
      if ('error' in result) {
        return false;
      }
      if (result && result.id) {
        const authData = { user: result as User, token: 'mock-jwt-token', isAuthenticated: true };
        setAuth(authData);
        localStorage.setItem('drive_auth', JSON.stringify(authData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login verification error:', error);
      return false;
    }
  };

  const initiateRegister = async (name: string, email: string, phone: string, pass: string): Promise<{ success: boolean, error?: string }> => {
    try {
      const result = await apiService.registerInit({ name, email, phone, password: pass });
      if ('error' in result) {
        return { success: false, error: result.error };
      }
      return { success: true };
    } catch (error) {
      console.error('Registration initiation error:', error);
      return { success: false, error: 'Failed to initiate registration' };
    }
  };

  const verifyRegister = async (email: string, otp: string): Promise<boolean> => {
    try {
      const result = await apiService.registerVerify(email, otp);
      if ('error' in result) {
        return false;
      }
      if (result && result.id) {
        const authData = { user: result as User, token: 'mock-jwt-token', isAuthenticated: true };
        setAuth(authData);
        localStorage.setItem('drive_auth', JSON.stringify(authData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration verification error:', error);
      return false;
    }
  };

  const logout = () => {
    setAuth({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem('drive_auth');
  };

  return (
    <AuthContext.Provider value={{ auth, login, verifyLogin, register: initiateRegister, verifyRegister, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Main App Component ---
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="min-h-screen bg-dark flex flex-col selection:bg-blue-500/30">
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
          <footer className="glass-morphism border-t border-white/5 py-12">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">© 2026 DriveEasy Car Rental India. Built for elite travelers.</p>
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
