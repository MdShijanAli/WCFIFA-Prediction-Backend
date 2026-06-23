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
import TechtrozWhiteImage from "@/assets/techtrioz-white.jpeg";
import TechtrozBlackImage from "@/assets/texhtrioz-black.jpeg";
import MCQBanner from "@/assets/mcq-banner.jpeg";
import MCQAds from "@/assets/mcq-ads.jpeg";

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
    name: "Techtrioz Solutions",
    logo: TechtrozBlackImage,
    href: "https://techtrioz.com/",
  },
  {
    name: "Techtrioz Solutions",
    logo: TechtrozWhiteImage,
    href: "https://techtrioz.com/",
  },
  {
    name: "MCQ Expert",
    logo: MCQAds,
    href: "https://mcqexpert.com/",
  },
  {
    name: "Techtrioz Solutions",
    logo: TechtrozBlackImage,
    href: "https://techtrioz.com/",
  },
  {
    name: "Techtrioz Solutions",
    logo: TechtrozWhiteImage,
    href: "https://techtrioz.com/",
  },
  {
    name: "MCQ Expert",
    logo: MCQAds,
    href: "https://mcqexpert.com/",
  },
  {
    name: "Techtrioz Solutions",
    logo: TechtrozBlackImage,
    href: "https://techtrioz.com/",
  },
  {
    name: "Techtrioz Solutions",
    logo: TechtrozWhiteImage,
    href: "https://techtrioz.com/",
  },
  {
    name: "MCQ Expert",
    logo: MCQAds,
    href: "https://mcqexpert.com/",
  },
];

const bannerAds = [
  {
    title: "Techtrioz Solutions",
    subtitle: "Build smarter — 2026 stack",
    cta: "Explore",
    href: "https://techtrioz.com/",
    image: TechtrozBlackImage,
    accent: "from-blue-900/40 via-blue-950/70 to-blue-950/95",
  },
  {
    title: "Techtrioz Solutions",
    subtitle: "Build smarter — 2026 stack",
    cta: "Explore",
    href: "https://techtrioz.com/",
    image: TechtrozWhiteImage,
    accent: "from-blue-900/40 via-blue-950/70 to-blue-950/95",
  },
  {
    title: "MCQ Expert",
    subtitle: "Ace your exams with confidence",
    cta: "Explore",
    href: "https://mcqexpert.com/",
    image: MCQBanner,
    accent: "from-emerald-900/40 via-emerald-950/70 to-emerald-950/95",
  },
  // {
  //   title: "Shukran Store",
  //   subtitle: "Watch every match LIVE",
  //   cta: "Subscribe",
  //   href: "#",
  //   image: "https://www.shukran.store/assets/shukranLogo.png",
  //   accent: "from-emerald-900/40 via-emerald-950/70 to-emerald-950/95",
  // },
  // {
  //   title: "Coca-Cola",
  //   subtitle: "Taste the matchday",
  //   cta: "Learn More",
  //   href: "#",
  //   image:
  //     "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80",
  //   accent: "from-red-900/40 via-red-950/70 to-red-950/95",
  // },
  // {
  //   title: "EA Sports FC 26",
  //   subtitle: "Play the new game",
  //   cta: "Get it Now",
  //   href: "#",
  //   image:
  //     "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80",
  //   accent: "from-amber-900/40 via-orange-950/70 to-orange-950/95",
  // },
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
    <div className="min-h-screen bg-[#F8F9FA] text-[#111827]">

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72
        bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5C518] grid place-items-center">
              <Trophy className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="font-bold leading-tight text-gray-900">NBWC</div>
              <div className="text-xs text-gray-500">
                Prediction Competition
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
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
                      ? "bg-[#F5C518] text-black shadow-sm"
                      : "text-gray-600 hover:text-black hover:bg-gray-100"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}
          </nav>

          {/* Banner Ad */}
          <div className="px-1">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Megaphone className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Sponsored
              </span>
            </div>

            <a
              href={currentAd.href}
              className="relative block h-56 rounded-2xl overflow-hidden group ring-1 ring-gray-200 shadow-md hover:shadow-lg transition"
            >
              <img
                key={currentAd.image}
                src={currentAd.image}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div
                className={`absolute inset-0 bg-gradient-to-t ${currentAd.accent}`}
              />

              <div className="relative h-full flex flex-col justify-end p-4">
                <h3 className="text-white font-bold text-lg">
                  {currentAd.title}
                </h3>
                <p className="text-white/80 text-sm mb-3">
                  {currentAd.subtitle}
                </p>

                <span className="inline-flex items-center gap-1.5 self-start
                bg-[#F5C518] text-black text-xs font-semibold px-3 py-1.5 rounded-full">
                  {currentAd.cta}
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* User */}
        <div className="border-t border-gray-200 p-4 shrink-0 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#F5C518] text-black grid place-items-center font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {user?.name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.phone}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2
            rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:pl-72">

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14
        bg-white border-b border-gray-200">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Trophy className="w-5 h-5 text-[#F5C518]" />
            NBWC Prediction
          </div>
        </header>

        {/* Sponsor Marquee */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 px-4">

            <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-gray-200">
              <Megaphone className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold uppercase text-gray-500">
                Our Sponsors
              </span>
            </div>

            <div className="relative overflow-hidden py-4">
              <div className="flex gap-4 animate-marquee whitespace-nowrap">
                {Array(2).fill([...sponsorAds, ...sponsorAds]).flat().map((ad, i) => (
                  <a
                    key={i}
                    href={ad.href}
                    className="shrink-0 h-20 w-40 bg-white border border-gray-200
                    rounded-xl grid place-items-center px-5 shadow-sm hover:shadow-md transition"
                  >
                    <img
                      src={ad.logo}
                      className="max-h-16 object-contain"
                    />
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>

        <div className="sticky top-28 bg-[#111827] text-white overflow-hidden border-b py-2 border-gray-800 animate-donation-marquee flex w-max gap-10 text-sm font-medium">
          {Array(2).fill([
            "💡 If you like our prediction platform, support us via donation",
            "📞 Donation Number: 01571261165 (bKash / Nagad)",
            "❤️ Your support helps us improve experience",
            "⚽ NBWC Prediction — Football lovers platform",
          ]).flat().map((text, i) => (
            <span key={i} className="whitespace-nowrap">
              {text}
            </span>
          ))}
        </div>

        <main className="p-6 bg-[#F8F9FA]">{children}</main>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 40s linear infinite; }

@keyframes donation-marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-donation-marquee {
  display: flex;
  width: max-content;
  animation: donation-marquee 60s linear infinite;
}
      `}</style>
    </div>
  );
}
