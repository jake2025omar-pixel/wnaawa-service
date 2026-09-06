import { useMemo, useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import {
  ArrowUpRight,
  Bot,
  CircleHelp,
  Coins,
  Gift,
  Home,
  LayoutGrid,
  Menu,
  MessageCircle,
  Moon,
  Package,
  ShieldCheck,
  Sparkles,
  Store,
  Ticket,
  TimerReset,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import HomePage from "./pages/Home";
import WatchPage from "./pages/Watch";
import StorePage from "./pages/Store";
import NotFound from "./pages/NotFound";
import { getBalance } from "./lib/ledger";

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/watch", label: "Rewards", icon: Gift },
  { href: "/store", label: "Store", icon: Store },
];

function BrandMark() {
  return (
    <div className="brand-lockup">
      <span className="brand-mark brand-mark-fallback" aria-label="Wnaawa mark"><span>W</span><i /></span>
      <div>
        <p className="brand-name">wnaawa</p>
        <p className="brand-caption">service center</p>
      </div>
    </div>
  );
}

function PointsBadge({ compact = false }: { compact?: boolean }) {
  const balance = getBalance();
  return (
    <div className={`points-pill ${compact ? "points-pill-compact" : ""}`}>
      <span className="points-pulse" />
      <Coins size={compact ? 14 : 16} strokeWidth={2.4} />
      <span>{balance.toLocaleString()} pts</span>
    </div>
  );
}

function NavLink({ href, label, icon: Icon }: (typeof navItems)[number]) {
  const [location] = useLocation();
  const active = href === "/" ? location === "/" : location.startsWith(href);
  return (
    <Link href={href} className={`nav-link ${active ? "nav-link-active" : ""}`}>
      <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
      <span>{label}</span>
    </Link>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const balance = useMemo(() => getBalance(), []);

  return (
    <div className="app-frame">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <aside className={`desktop-sidebar ${mobileOpen ? "mobile-sidebar-open" : ""}`}>
        <div className="sidebar-topline">
          <BrandMark />
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <div className="sidebar-balance glass-card">
          <div className="eyebrow"><WalletCards size={13} /> available balance</div>
          <div className="balance-value">{balance.toLocaleString()} <span>pts</span></div>
          <div className="balance-foot"><span>ledger verified</span><ShieldCheck size={14} /></div>
        </div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          <p className="nav-heading">Workspace</p>
          {navItems.map((item) => <NavLink key={item.href} {...item} />)}
          <p className="nav-heading nav-heading-spaced">Explore</p>
          <Link href="/watch" className="nav-link"><Ticket size={18} /><span>Campaigns</span></Link>
          <Link href="/store" className="nav-link"><LayoutGrid size={18} /><span>Services</span></Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Sparkles size={15} />
            <span>Put your points to work.</span>
          </div>
          <button className="profile-row" onClick={() => toast("Account profile is available after sign in.")}>
            <span className="avatar"><UserRound size={16} /></span>
            <span className="profile-copy"><strong>Account</strong><small>Member workspace</small></span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="topbar-context"><span className="context-dot" /> <span>Wnaawa / service center</span></div>
          <div className="topbar-actions">
            <PointsBadge compact />
            <button className="icon-button" onClick={() => toast("Theme is set to dark mode for the Wnaawa workspace.")} aria-label="Current theme"><Moon size={17} /></button>
            <button className="icon-button" onClick={() => toast("Help center is being prepared.")} aria-label="Open help"><CircleHelp size={17} /></button>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {navItems.map((item) => <NavLink key={item.href} {...item} />)}
        <button className="nav-link" onClick={() => toast("Account profile is available after sign in.")}><UserRound size={18} /><span>Account</span></button>
      </nav>
      <Toaster theme="dark" position="bottom-right" toastOptions={{ className: "wnaawa-toast" }} />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/watch" component={WatchPage} />
      <Route path="/store" component={StorePage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return <AppShell><Router /></AppShell>;
}

export { PointsBadge, BrandMark };
