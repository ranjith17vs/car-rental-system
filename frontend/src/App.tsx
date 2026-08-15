import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { User, AuthState, UserRole, Car, BookingStatus, Booking } from './types';
import { MapPicker } from './MapPicker';
import apiService from './services/apiService';

const DRIVER_DAILY_FEE = 500;

export const TN_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
];
// --- Helper for Base64 Upload & Document Viewing ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scale = Math.min(MAX_WIDTH / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const openInNewTab = (base64: string) => {
  const win = window.open();
  if (win) {
    win.document.write(`<iframe src="${base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  }
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

// --- Toast Context & Provider ---
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (title: string, message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export const ToastProvider = ({ children }: { children?: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = (title: string, message: string, type: ToastType = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-4 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastCard = ({ item, onClose }: { item: ToastItem, onClose: () => void }) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const showTimeout = setTimeout(() => setVisible(true), 50);
    let timer: any;
    let progressInterval: any;
    const duration = item.duration !== undefined ? item.duration : 5000;

    if (duration > 0) {
      timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, duration);

      const step = 100 / (duration / 50);
      progressInterval = setInterval(() => {
        setProgress((p) => Math.max(0, p - step));
      }, 50);
    }

    return () => {
      clearTimeout(showTimeout);
      if (timer) clearTimeout(timer);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [item, onClose]);

  const getTheme = () => {
    switch (item.type) {
      case 'success':
        return {
          border: 'border-emerald-500/20 shadow-emerald-500/10',
          bg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-500',
          progressBar: 'bg-emerald-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case 'error':
        return {
          border: 'border-rose-500/20 shadow-rose-500/10',
          bg: 'bg-rose-500/10',
          iconColor: 'text-rose-500',
          progressBar: 'bg-rose-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        };
      case 'warning':
        return {
          border: 'border-amber-500/20 shadow-amber-500/10',
          bg: 'bg-amber-500/10',
          iconColor: 'text-amber-500',
          progressBar: 'bg-amber-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        };
      default:
        return {
          border: 'border-blue-500/20 shadow-blue-500/10',
          bg: 'bg-blue-500/10',
          iconColor: 'text-blue-500',
          progressBar: 'bg-blue-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const theme = getTheme();

  const handleManualClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const formatMessage = (msg: string) => {
    if (msg.includes('\n')) {
      return (
        <div className="space-y-2 mt-2 text-[11px] text-slate-700 font-medium">
          {msg.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            if (trimmed.match(/^\d+\./)) {
              const num = trimmed.split('.')[0];
              const content = trimmed.substring(trimmed.indexOf('.') + 1).trim();
              return (
                <div key={idx} className="flex gap-2 items-start text-left">
                  <span className={`font-black shrink-0 ${theme.iconColor}`}>{num}.</span>
                  <span className="leading-relaxed">{content}</span>
                </div>
              );
            }
            return <p key={idx} className="font-bold text-slate-900 leading-relaxed text-left text-xs">{trimmed}</p>;
          })}
        </div>
      );
    }
    return <p className="text-xs text-slate-600 font-medium leading-relaxed text-left mt-1">{msg}</p>;
  };

  return (
    <div
      className={`glass-morphism rounded-3xl pointer-events-auto border ${theme.border} p-5 shadow-2xl transition-all duration-300 ease-out relative overflow-hidden flex gap-4 ${
        visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}
      style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className={`w-10 h-10 rounded-2xl ${theme.bg} flex items-center justify-center shrink-0 ${theme.iconColor}`}>
        {theme.icon}
      </div>
      <div className="flex-1 pr-6">
        <h4 className="font-black text-slate-900 text-xs tracking-tight text-left uppercase tracking-widest">{item.title}</h4>
        {formatMessage(item.message)}
      </div>
      <button
        onClick={handleManualClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors text-xs"
      >
        ✕
      </button>
      {item.duration !== undefined && item.duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-1 transition-all duration-75 ${theme.progressBar}`}
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
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
              <span className="tracking-tighter uppercase">Drive<span className="text-blue-500 font-bold ml-1">Easy</span></span>
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
  const [filter, setFilter] = useState({ seats: '', fuel: '' });
  const navigate = useNavigate();

  useEffect(() => {
    apiService.getCars().then(setCars);
  }, []);

  const filteredCars = cars.filter(c =>
    c.availability &&
    (filter.seats === '' || String(c.seats) === String(filter.seats)) &&
    (filter.fuel === '' || c.fuel_type.toLowerCase() === filter.fuel.toLowerCase())
  );

  const seatsOptions = Array.from(new Set(cars.map(c => String(c.seats))));
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
                value={filter.seats}
                onChange={(e) => setFilter({ ...filter, seats: e.target.value })}
              >
                <option value="" className="bg-slate-900">All Seats</option>
                {seatsOptions.map(b => <option key={b} value={b} className="bg-slate-900">{b} Seats</option>)}
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
            onClick={() => setFilter({ seats: '', fuel: '' })}
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
                    {car.seats} Seats
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
  const { toast } = useToast();
  const [car, setCar] = useState<Car | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [showLightbox, setShowLightbox] = useState(false);
  const [dates, setDates] = useState({ pickup: '', return: '' });
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupDistrict, setPickupDistrict] = useState('');
  const [purpose, setPurpose] = useState('Tour');
  const [customerNumber, setCustomerNumber] = useState('');
  const [includeDriver, setIncludeDriver] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  const handleSearchLocation = async () => {
    if (!pickupLocation.trim()) return;
    setIsSearchingMap(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pickupLocation)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        toast("Not Found", "Could not find that location on the map.", "warning");
      }
    } catch (err) {
      toast("Error", "Failed to search location.", "error");
    } finally {
      setIsSearchingMap(false);
    }
  };

  // Customer Documents
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const [customerIdProof, setCustomerIdProof] = useState<string | null>(null);
  const [drivingLicense, setDrivingLicense] = useState<string | null>(null);

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({ upiId: '', cardNumber: '', expiry: '', cvv: '', name: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);


  useEffect(() => {
    apiService.getCars().then(cars => {
      const found = cars.find(c => c.id.toString() === id);
      setCar(found || null);
      if (found) setSelectedImage(found.images?.[0] || found.image);
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

  const processPaymentAndBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate payment validation / processing wait
    setTimeout(() => {
      setIsProcessing(false);
      setShowPaymentModal(false);
      handleBooking();
    }, 1000);
  };

  const handleBooking = async () => {
    if (!auth.isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!acceptedTerms) {
      toast("Agreement Required", "Please accept the Terms and Conditions to proceed.", "warning");
      return;
    }
    if (totalPrice <= 0) {
      toast("Invalid Dates", "Please select valid dates.", "error");
      return;
    }
    if (!pickupLocation.trim()) {
      toast("Location Missing", "Please enter a pickup location.", "error");
      return;
    }
    if (!customerPhoto || !customerIdProof || !drivingLicense) {
      toast("Documents Missing", "Customer Photo, ID Proof, and Driving License are required for verification.", "error");
      return;
    }

    await apiService.createBooking({
      user_id: auth.user!.id,
      car_id: car!.id,
      pickup_date: dates.pickup,
      return_date: dates.return,
      pickup_location: pickupLocation,
      total_price: totalPrice,
      status: BookingStatus.PENDING,
      has_driver: includeDriver,
      customer_photo: customerPhoto,
      customer_id_proof: customerIdProof,
      driving_license: drivingLicense,
      purpose: purpose,
      customer_number: customerNumber,
      pickup_district: pickupDistrict,
    });
    toast("Success", "Booking requested successfully!", "success");
    navigate('/my-bookings');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 relative">
      <div className="bg-mesh"></div>
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        <div className="sticky top-32">
          <div className="rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/5 h-[600px] group cursor-pointer" onClick={() => setShowLightbox(true)}>
            <img src={selectedImage || car.image} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-black/60 text-white font-black px-6 py-3 rounded-full text-sm uppercase tracking-widest backdrop-blur-md">Click to view</span>
            </div>
          </div>
          {(car.images && car.images.length > 1) && (
            <div className="flex gap-4 mt-6 overflow-x-auto pb-4 custom-scrollbar">
              {car.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setSelectedImage(img)}
                  className={`w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${selectedImage === img ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/20' : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/30'}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-12">
          <div className="animate-fade-in">
            <span className="text-blue-500 font-black tracking-widest uppercase text-xs">{car.brand}</span>
            <h1 className="text-6xl font-black text-white mt-2 tracking-tighter">{car.name}</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-morphism p-6 rounded-3xl border border-white/5">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Base Rental</p>
              <p className="text-3xl font-black text-white">₹{car.price_per_day}<span className="text-sm text-zinc-500 font-medium">/d</span></p>
            </div>
            <div className="glass-morphism p-6 rounded-3xl border border-white/5">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Engine Type</p>
              <p className="text-3xl font-black text-white uppercase">{car.fuel_type}</p>
            </div>
            <div className="glass-morphism p-6 rounded-3xl border border-white/5">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Seating</p>
              <p className="text-3xl font-black text-white uppercase">{car.seats || 'N/A'}</p>
            </div>
          </div>

          {/* Car Documents Section */}
          {((car.rc_doc || car.insurance_doc) && auth.isAuthenticated && auth.user?.role === UserRole.USER) && (
            <div className="glass-morphism p-6 rounded-3xl border border-white/5 space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Verify Documents</h4>
              <div className="flex flex-wrap gap-4">
                {car.rc_doc && (
                  <button 
                    onClick={() => openInNewTab(car.rc_doc!)} 
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span className="text-xs font-black text-white uppercase tracking-widest">RC Document</span>
                  </button>
                )}
                {car.insurance_doc && (
                  <button 
                    onClick={() => openInNewTab(car.insurance_doc!)} 
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl transition-all"
                  >
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span className="text-xs font-black text-white uppercase tracking-widest">Insurance</span>
                  </button>
                )}
              </div>
            </div>
          )}

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
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Pickup Location</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Enter pickup address or select on map below"
                    className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleSearchLocation(); } }}
                    required
                  />
                  <button type="button" onClick={handleSearchLocation} disabled={isSearchingMap} className="bg-blue-600 text-white px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[80px]">
                    {isSearchingMap ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Find'}
                  </button>
                </div>
                <MapPicker onLocationSelect={setPickupLocation} mapCenter={mapCenter} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Pickup District (Tamil Nadu)</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-white/5 border border-white/10 text-white p-4 pr-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold cursor-pointer"
                    value={pickupDistrict}
                    onChange={(e) => setPickupDistrict(e.target.value)}
                    required
                  >
                    <option value="" disabled className="bg-slate-900">Select a district</option>
                    {TN_DISTRICTS.map(d => (
                      <option key={d} value={d} className="bg-slate-900">{d}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Purpose of Rent</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-white/5 border border-white/10 text-white p-4 pr-12 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold cursor-pointer"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  >
                    <option value="Tour" className="bg-slate-900">Tour</option>
                    <option value="Wedding" className="bg-slate-900">Wedding</option>
                    <option value="Other Functions" className="bg-slate-900">Other Functions</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Customer Number</label>
                <input
                  type="text"
                  placeholder="Enter contact number"
                  className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  required
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


            <div className="space-y-4 p-6 bg-white/5 rounded-[2rem] border border-white/10">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Customer Verification</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 bg-white/5 p-3 rounded-xl">
                  <span className="text-xs font-bold text-white min-w-[120px]">Profile Photo</span>
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if(f) setCustomerPhoto(await fileToBase64(f)) }} className="text-[10px] text-zinc-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer w-full" />
                  {customerPhoto && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0"></div>}
                </div>
                
                <div className="flex items-center justify-between gap-4 bg-white/5 p-3 rounded-xl">
                  <span className="text-xs font-bold text-white min-w-[120px]">ID Proof</span>
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if(f) setCustomerIdProof(await fileToBase64(f)) }} className="text-[10px] text-zinc-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer w-full" />
                  {customerIdProof && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0"></div>}
                </div>

                <div className="flex items-center justify-between gap-4 bg-white/5 p-3 rounded-xl">
                  <span className="text-xs font-bold text-white min-w-[120px]">Driving License</span>
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if(f) setDrivingLicense(await fileToBase64(f)) }} className="text-[10px] text-zinc-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer w-full" />
                  {drivingLicense && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0"></div>}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between items-center mb-6">
                <span className="text-zinc-400 font-bold">Total Price</span>
                <span className="text-4xl font-black text-white">₹{totalPrice}</span>
              </div>
              
              <label className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="peer appearance-none w-5 h-5 rounded-lg border-2 border-white/20 checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm tracking-tight">
                    I accept the <a href="#" className="text-blue-500 hover:text-blue-400 underline" onClick={(e) => { e.preventDefault(); toast("Terms and Conditions", "1. The renter must hold a valid driving license.\n2. The vehicle must be returned in the same condition.\n3. Late returns will incur additional charges.\n4. Smoking and pets are not allowed in the vehicle.\n5. Customers must provide a 2-wheeler or equivalent security deposit equal to the car's rental value.", "info", 20000); }}>Terms and Conditions</a>
                  </p>
                </div>
              </label>

               <button
                onClick={handleBooking}
                disabled={!acceptedTerms}
                className={`w-full py-5 text-white rounded-[1.5rem] font-black text-lg shadow-2xl transition-all active:scale-[0.98] ${acceptedTerms ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'}`}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-morphism rounded-[3rem] p-12 max-w-md w-full border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.1)] relative">
            <button className="absolute top-8 right-8 text-white/50 hover:text-white" onClick={() => !isProcessing && setShowPaymentModal(false)}>✕</button>
            <h3 className="text-3xl font-black text-white tracking-tight mb-2 italic">Secure Payment</h3>
            <p className="text-zinc-500 mb-8 text-xs font-bold uppercase tracking-widest leading-relaxed">Amount to Pay: <span className="text-white">₹{totalPrice}</span></p>
            
            <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10 mb-8">
              <button disabled={isProcessing} type="button" onClick={() => setPaymentMethod('UPI')} className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${paymentMethod === 'UPI' ? 'bg-white text-slate-950 shadow-2xl shadow-white/10' : 'text-zinc-500 hover:text-white'}`}>UPI</button>
              <button disabled={isProcessing} type="button" onClick={() => setPaymentMethod('Card')} className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${paymentMethod === 'Card' ? 'bg-white text-slate-950 shadow-2xl shadow-white/10' : 'text-zinc-500 hover:text-white'}`}>Debit/Credit</button>
            </div>

            <form onSubmit={processPaymentAndBook} className="space-y-6">
              {paymentMethod === 'UPI' ? (
                <input type="text" placeholder="Enter UPI ID (e.g. name@upi)" required disabled={isProcessing} className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={paymentDetails.upiId} onChange={e => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })} />
              ) : (
                <div className="space-y-4">
                  <input type="text" placeholder="Card Number" required maxLength={16} disabled={isProcessing} className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={paymentDetails.cardNumber} onChange={e => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })} />
                  <div className="flex gap-4">
                    <input type="text" placeholder="MM/YY" required maxLength={5} disabled={isProcessing} className="flex-1 bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={paymentDetails.expiry} onChange={e => setPaymentDetails({ ...paymentDetails, expiry: e.target.value })} />
                    <input type="password" placeholder="CVV" required maxLength={3} disabled={isProcessing} className="flex-1 bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={paymentDetails.cvv} onChange={e => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })} />
                  </div>
                  <input type="text" placeholder="Name on Card" required disabled={isProcessing} className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={paymentDetails.name} onChange={e => setPaymentDetails({ ...paymentDetails, name: e.target.value })} />
                </div>
              )}
              
              <button type="submit" disabled={isProcessing} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest mt-4">
                {isProcessing ? 'Processing Payment...' : 'Verify & Pay'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showLightbox && (
        <div className="fixed inset-0 bg-black/95 z-[999] p-4 sm:p-10 flex items-center justify-center animate-fade-in" onClick={() => setShowLightbox(false)}>
          <button className="absolute top-6 right-6 text-white hover:text-blue-500 transition-colors bg-white/10 p-4 rounded-full z-50" onClick={() => setShowLightbox(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          {car?.images && car.images.length > 1 && (
            <button 
              className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-4 rounded-full transition-colors z-50"
              onClick={(e) => {
                e.stopPropagation();
                const imgs = car.images!;
                const idx = imgs.indexOf(selectedImage || car.image);
                setSelectedImage(imgs[idx > 0 ? idx - 1 : imgs.length - 1]);
              }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
          )}

          <img src={selectedImage || car.image} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl relative z-40" onClick={e => e.stopPropagation()} />

          {car?.images && car.images.length > 1 && (
            <button 
              className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 text-white bg-white/10 hover:bg-white/20 p-4 rounded-full transition-colors z-50"
              onClick={(e) => {
                e.stopPropagation();
                const imgs = car.images!;
                const idx = imgs.indexOf(selectedImage || car.image);
                setSelectedImage(imgs[idx < imgs.length - 1 ? idx + 1 : 0]);
              }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          )}
        </div>
      )}
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
  const { toast } = useToast();
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
      setTimer(60); // 1 minute
    } else {
      toast("Login Failed", result.error || 'Invalid credentials', "error");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await verifyLogin(form.email, otp);
    if (success) {
      navigate('/');
    } else {
      toast("Verification Failed", 'Invalid or expired OTP', "error");
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
  const { toast } = useToast();
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
      setTimer(60); // 1 minute
    } else {
      toast("Registration Failed", result.error || 'Failed to initiate registration', "error");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await verifyRegister(form.email, otp);
    if (success) {
      navigate('/');
    } else {
      toast("Verification Failed", 'Invalid or expired OTP', "error");
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({ upiId: '', cardNumber: '', expiry: '', cvv: '', name: '' });
  const [activePaymentBooking, setActivePaymentBooking] = useState<Booking | null>(null);

  const fetchUserBookings = () => {
    apiService.getBookings().then(all => {
      setBookings(all.filter(b => b.user_id.toString() === auth.user?.id.toString()));
    });
  };

  useEffect(() => {
    fetchUserBookings();
  }, [auth.user?.id]);

  const processPaymentAndBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentBooking) return;
    setIsProcessing(true);
    setTimeout(async () => {
      await apiService.updateBookingStatus(activePaymentBooking.id, activePaymentBooking.status, {
        payment_method: paymentMethod
      });
      setIsProcessing(false);
      setShowPaymentModal(false);
      fetchUserBookings();
    }, 2000);
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING: return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case BookingStatus.APPROVED: return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case BookingStatus.REJECTED: return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
      case BookingStatus.COMPLETED: return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
    }
  };

  // Note: openInNewTab is now in the global scope

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
                  {b.status === BookingStatus.APPROVED && !b.payment_method && (
                    <button onClick={() => { setActivePaymentBooking(b); setShowPaymentModal(true); }} className="px-5 py-2 rounded-xl text-[10px] bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 ml-3 transition-all">Pay Now</button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Duration</p>
                    <p className="font-bold text-zinc-300 text-sm">{b.pickup_date} <span className="text-blue-500 opacity-50 px-1">→</span> {b.return_date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Pickup Location</p>
                    <p className="font-bold text-zinc-300 text-sm">{b.pickup_location || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Purpose</p>
                    <p className="font-bold text-zinc-300 text-sm">{b.purpose || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Contact No.</p>
                    <p className="font-bold text-zinc-300 text-sm">{b.customer_number || b.user?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total Price</p>
                    <p className="font-black text-white text-lg">₹{b.total_price}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Payment</p>
                    <p className="font-bold text-[10px] tracking-widest uppercase bg-white/5 px-2 py-1 inline-block rounded-md text-zinc-300 whitespace-nowrap">{b.payment_method || 'PENDING'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 col-span-2 md:col-span-5">
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

      {showPaymentModal && activePaymentBooking && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-morphism rounded-[3rem] p-12 max-w-md w-full border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.1)] relative">
            <button className="absolute top-8 right-8 text-white/50 hover:text-white" onClick={() => !isProcessing && setShowPaymentModal(false)}>✕</button>
            <h3 className="text-3xl font-black text-white tracking-tight mb-2 italic">Secure Payment</h3>
            <p className="text-zinc-500 mb-8 text-xs font-bold uppercase tracking-widest leading-relaxed">Amount to Pay: <span className="text-white">₹{activePaymentBooking.total_price}</span></p>
            
            <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10 mb-8">
              <button disabled={isProcessing} type="button" onClick={() => setPaymentMethod('UPI')} className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${paymentMethod === 'UPI' ? 'bg-white text-slate-950 shadow-2xl shadow-white/10' : 'text-zinc-500 hover:text-white'}`}>UPI</button>
              <button disabled={isProcessing} type="button" onClick={() => setPaymentMethod('Card')} className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${paymentMethod === 'Card' ? 'bg-white text-slate-950 shadow-2xl shadow-white/10' : 'text-zinc-500 hover:text-white'}`}>Debit/Credit</button>
            </div>

            <form onSubmit={processPaymentAndBook} className="space-y-6">
              {paymentMethod === 'UPI' ? (
                <input type="text" placeholder="Enter UPI ID (e.g. name@upi)" required disabled={isProcessing} className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={paymentDetails.upiId} onChange={e => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })} />
              ) : (
                <div className="space-y-4">
                  <input type="text" placeholder="Card Number" required maxLength={16} disabled={isProcessing} className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={paymentDetails.cardNumber} onChange={e => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })} />
                  <div className="flex gap-4">
                    <input type="text" placeholder="MM/YY" required maxLength={5} disabled={isProcessing} className="flex-1 bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={paymentDetails.expiry} onChange={e => setPaymentDetails({ ...paymentDetails, expiry: e.target.value })} />
                    <input type="password" placeholder="CVV" required maxLength={3} disabled={isProcessing} className="flex-1 bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={paymentDetails.cvv} onChange={e => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })} />
                  </div>
                  <input type="text" placeholder="Name on Card" required disabled={isProcessing} className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={paymentDetails.name} onChange={e => setPaymentDetails({ ...paymentDetails, name: e.target.value })} />
                </div>
              )}
              
              <button type="submit" disabled={isProcessing} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 uppercase text-[10px] tracking-widest mt-4">
                {isProcessing ? 'Processing Payment...' : 'Verify & Pay'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'cars' | 'analytics'>('bookings');
  const [editingCarId, setEditingCarId] = useState<any>(null);
  const [driverEntry, setDriverEntry] = useState<{ id: any, name: string, phone: string, id_proof?: string } | null>(null);
  const { toast } = useToast();

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
    name: '', brand: '', seats: '', price_per_day: 0, fuel_type: '', image: '', images: [], availability: true, rc_doc: '', insurance_doc: ''
  });

  const getDistrictStats = () => {
    const stats: Record<string, number> = {};
    TN_DISTRICTS.forEach(d => stats[d] = 0);
    stats['Unknown'] = 0;
    
    bookings.forEach(b => {
      const d = b.pickup_district || 'Unknown';
      if (stats[d] !== undefined) {
        stats[d]++;
      } else {
        stats['Unknown']++;
      }
    });

    return Object.entries(stats).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
  };

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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (field === 'image') {
      const remainingSlots = 10 - (newCar.images?.length || 0);
      const fileArray = Array.from(files).slice(0, remainingSlots);
      if (fileArray.length === 0) return;
      
      const base64Images = await Promise.all(fileArray.map(f => fileToBase64(f)));
      setNewCar(prev => {
        const updatedImages = [...(prev.images || []), ...base64Images];
        return { ...prev, images: updatedImages, image: updatedImages[0] };
      });
    } else {
      const b64 = await fileToBase64(files[0]);
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
    if (!newCar.image) return toast("Image Required", "Upload car image.", "error");
    await apiService.saveCar(newCar as Car);
    resetForm();
    fetchAll();
  };

  const resetForm = () => {
    setEditingCarId(null);
    setNewCar({ name: '', brand: '', seats: '', price_per_day: 0, fuel_type: '', image: '', images: [], availability: true, rc_doc: '', insurance_doc: '' });
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
          <button onClick={() => setActiveTab('analytics')} className={`px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-white text-slate-950 shadow-2xl shadow-white/10' : 'text-zinc-500 hover:text-white'}`}>Analytics</button>
        </div>
      </div>

      {activeTab === 'bookings' && (
        <div className="glass-morphism rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/5">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Car / Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Purpose</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Driver</th>
                  <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Payment</th>
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
                      {b.customer_number && <p className="text-[10px] font-bold text-blue-400 mt-1">Contact: {b.customer_number}</p>}
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-zinc-200 text-sm">{b.car?.name}</p>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{b.pickup_date} <span className="opacity-30">/</span> {b.return_date}</p>
                      <p className="text-[10px] font-bold text-zinc-400 mt-1">Loc: {b.pickup_location || 'N/A'}</p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-1 rounded-lg">{b.purpose || 'N/A'}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${b.has_driver ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-white/5 text-zinc-500 border border-white/10'}`}>{b.has_driver ? 'Driver' : 'Self'}</span>
                        {b.driver_id_proof && <button onClick={() => openInNewTab(b.driver_id_proof!)} className="text-[8px] bg-white text-slate-950 px-2 py-0.5 rounded-md font-black hover:scale-105 transition-transform">VERIFY ID</button>}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-1 rounded-lg">{b.payment_method || 'N/A'}</span>
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
      )}
      {activeTab === 'cars' && (
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
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Seats</label>
                <input type="text" placeholder="e.g. 5" required className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={newCar.seats || ''} onChange={e => setNewCar({ ...newCar, seats: e.target.value })} />
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
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Car Images (Up to 10)</label>
                <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                  {newCar.images?.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-white/10 group/img">
                      <img src={img} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => {
                        const updated = newCar.images!.filter((_, i) => i !== idx);
                        setNewCar({ ...newCar, images: updated, image: updated[0] || '' });
                      }} className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-xs font-bold hover:scale-110">✕</button>
                    </div>
                  ))}
                  {(!newCar.images || newCar.images.length < 10) && (
                    <label className="w-24 h-24 shrink-0 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all text-white/40 hover:text-blue-500 group">
                      <span className="text-2xl group-hover:scale-125 transition-transform">+</span>
                      <span className="text-[8px] font-black uppercase mt-1">Add Image</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleCarFileUpload(e, 'image')} />
                    </label>
                  )}
                </div>
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
      {activeTab === 'analytics' && (
        <div className="space-y-16 animate-fade-in pb-32">
          <div className="glass-morphism rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-10 border-b border-white/5">
              <h3 className="text-3xl font-black text-white italic tracking-tight">District Analytics</h3>
              <p className="text-zinc-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Number of cars booked per district</p>
            </div>
            <div className="p-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {getDistrictStats().map(([district, count]) => (
                <div key={district} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{district}</span>
                  <div className="mt-4 flex items-end justify-between">
                    <span className="text-4xl font-black text-white tracking-tighter">{count}</span>
                    <span className="text-blue-500 font-bold uppercase text-[8px] tracking-widest mb-2">Bookings</span>
                  </div>
                </div>
              ))}
            </div>
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
      <ToastProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col selection:bg-blue-500/30">
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
      </ToastProvider>
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
