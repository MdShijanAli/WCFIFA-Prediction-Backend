import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Trophy,
  Home,
  Target,
  BarChart2,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Megaphone,
  ExternalLink,
} from "lucide-react";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Dashboard" },
  { path: "/predict", icon: Target, label: "Predict" },
  { path: "/leaderboard", icon: BarChart2, label: "Leaderboard" },
  { path: "/profile", icon: User, label: "Profile" },
];

const FALLBACK_LOGO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 40'><rect width='120' height='40' fill='%23e5e7eb'/><text x='60' y='25' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle'>LOGO</text></svg>";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80";

const sponsorAds = [
  {
    name: "Shukran Store",
    logo: "https://www.shukran.store/assets/shukranLogo.png",
    href: "#",
  },
  {
    name: "Techtrioz Solutions",
    logo: "https://media.licdn.com/dms/image/v2/C560BAQG94ffSNn0n3g/company-logo_200_200/company-logo_200_200/0/1630640418861?e=2147483647&v=beta&t=vNkgqi9VZLs2tkKEUamGjdTkfGivGzH6LP9fxURshPM",
    href: "#",
  },
  {
    name: "Visa",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg",
    href: "#",
  },
  {
    name: "Hyundai",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg",
    href: "#",
  },
  {
    name: "Qatar Airways",
    logo: "https://upload.wikimedia.org/wikipedia/en/9/9c/Qatar_Airways_Logo.svg",
    href: "#",
  },
  {
    name: "Budweiser",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Budweiser_logo.svg",
    href: "#",
  },
  {
    name: "Coca-Cola",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Coca-Cola_logo.svg",
    href: "#",
  },
  {
    name: "EA Sports",
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/3f/EA_Sports_2020.svg",
    href: "#",
  },
];

const bannerAds = [
  {
    title: "Techtrioz Solutions",
    subtitle: "Build smarter — 2026 stack",
    cta: "Explore",
    href: "#",
    image:
      "https://media.licdn.com/dms/image/v2/C560BAQG94ffSNn0n3g/company-logo_200_200/company-logo_200_200/0/1630640418861?e=2147483647&v=beta&t=vNkgqi9VZLs2tkKEUamGjdTkfGivGzH6LP9fxURshPM",
    accent: "from-blue-900/40 via-blue-950/70 to-blue-950/95",
  },
  {
    title: "Shukran Store",
    subtitle: "Watch every match LIVE",
    cta: "Subscribe",
    href: "#",
    image: "https://www.shukran.store/assets/shukranLogo.png",
    accent: "from-emerald-900/40 via-emerald-950/70 to-emerald-950/95",
  },
  {
    title: "Coca-Cola",
    subtitle: "Taste the matchday",
    cta: "Learn More",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80",
    accent: "from-red-900/40 via-red-950/70 to-red-950/95",
  },
  {
    title: "EA Sports FC 26",
    subtitle: "Play the new game",
    cta: "Get it Now",
    href: "#",
    image:
      "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80",
    accent: "from-amber-900/40 via-orange-950/70 to-orange-950/95",
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setAdIndex((i) => (i + 1) % bannerAds.length),
      6000,
    );
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const currentAd = bannerAds[adIndex];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Sidebar — FIXED, internal scroll */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 flex flex-col
          transform transition-transform duration-300 lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 grid place-items-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold leading-tight">NBWC</div>
              <div className="text-xs text-gray-400">
                Prediction Competition
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6">
          <nav className="flex flex-col gap-1">
            {navItems.map(({ path, icon: Icon, label }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                    ${active
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}
          </nav>

          {/* Banner ad */}
          <div className="px-1">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Megaphone className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Sponsored
              </span>
            </div>

            <a
              href={currentAd.href}
              className="relative block h-56 rounded-2xl overflow-hidden group ring-1 ring-white/10 shadow-xl"
            >
              <img
                key={currentAd.image}
                src={currentAd.image}
                alt={currentAd.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_BANNER;
                }}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${currentAd.accent}`}
              />
              <div className="relative h-full flex flex-col justify-end p-4">
                <h3 className="text-white font-bold text-lg leading-tight drop-shadow">
                  {currentAd.title}
                </h3>
                <p className="text-white/80 text-sm mb-3">
                  {currentAd.subtitle}
                </p>
                <span className="inline-flex items-center gap-1.5 self-start bg-white text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full group-hover:bg-primary-500 group-hover:text-white transition">
                  {currentAd.cta}
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>

            <div className="flex items-center justify-center gap-1.5 mt-3">
              {bannerAds.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setAdIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${i === adIndex
                      ? "w-6 bg-primary-500"
                      : "w-1.5 bg-gray-700 hover:bg-gray-600"
                    }`}
                  aria-label={`Show ad ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* User */}
        <div className="border-t border-gray-800 p-4 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 grid place-items-center font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 truncate">
                {user?.phone}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-gray-900/95 backdrop-blur border-b border-gray-800">
          <button onClick={() => setMobileOpen(true)} className="text-gray-300">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 font-semibold">
            <Trophy className="w-5 h-5 text-primary-500" />
            NBWC Prediction
          </div>
        </header>

        {/* Top sponsor marquee */}
        <div className="sticky top-0 z-30 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-b border-gray-800/80 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4">
            {/* Left label — inline, fixed width, no extra height */}
            <div className="hidden sm:flex items-center gap-2 shrink-0 pr-3 border-r border-gray-800">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-600/20 text-primary-400">
                <Megaphone className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-gray-300 whitespace-nowrap">
                Our Sponsors
              </span>
            </div>

            {/* Marquee */}
            <div className="relative overflow-hidden py-4">
              <div className="flex gap-4 animate-marquee whitespace-nowrap">
                {[...sponsorAds, ...sponsorAds].map((ad, i) => (
                  <a
                    key={i}
                    href={ad.href}
                    className="shrink-0 h-20 w-40 bg-white rounded-xl grid place-items-center px-5 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition"
                    title={ad.name}
                  >
                    <img
                      src={ad.logo}
                      alt={ad.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          FALLBACK_LOGO;
                      }}
                      className="max-h-12 max-w-full object-contain"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <main className="p-6">{children}</main>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 40s linear infinite; }
      `}</style>
    </div>
  );
}
