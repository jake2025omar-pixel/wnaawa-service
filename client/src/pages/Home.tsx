// Wnaawa style reminder: asymmetric dark bento, restrained gold actions, and clear service-first language.
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Bot, ChartNoAxesCombined, Check, ChevronRight, Code2, Coins, Gift, Globe2, Layers3, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import { PointsBadge } from "../App";
import { getBalance, getLedger } from "../lib/ledger";
import { getRewardSessions, getStoredOrders, getStoredTickets, subscribeToLiveState } from "../lib/liveState";

function ServiceVisual({ kind }: { kind: string }) {
  return <div className={`service-visual service-visual-${kind}`} aria-hidden="true"><span className="visual-orb" /><span className="visual-panel" /><span className="visual-line visual-line-one" /><span className="visual-line visual-line-two" /><span className="visual-dot" /></div>;
}

const services = [
  { title: "Telegram bot creation", label: "BOT SERVICE", description: "Automations that help stores respond, route, and serve with less friction.", points: "from 650 pts", cash: "$29", visual: "bot", icon: Bot, href: "/store" },
  { title: "Website development", label: "WEBSITE SERVICE", description: "Focused digital experiences built around a clear customer journey.", points: "from 1,200 pts", cash: "$79", visual: "website", icon: Globe2, href: "/store" },
  { title: "Digital assets & templates", label: "POINTS ONLY", description: "Practical building blocks for your next digital workflow.", points: "from 90 pts", cash: null, visual: "rewards", icon: Layers3, href: "/store" },
];

export default function Home() {
  const [, refresh] = useState(0);
  useEffect(() => subscribeToLiveState(() => refresh((value) => value + 1)), []);
  const balance = getBalance();
  const ledgerCount = getLedger().length;
  const tickets = getStoredTickets();
  const orders = getStoredOrders();
  const rewardSessions = getRewardSessions();

  return (
    <div className="page-stack">
      <section className="hero-grid">
        <div className="hero-copy">
          <div className="section-kicker"><span className="kicker-line" /> digital services + points</div>
          <h1>Useful services.<br /><em>Meaningful</em> rewards.</h1>
          <p className="hero-lede">We help you access digital services and get benefits inside the platform — with clear rules and no guaranteed cash claims.</p>
          <div className="hero-actions">
            <Link href="/store" className="primary-button">Explore the store <ArrowRight size={16} /></Link>
            <Link href="/watch" className="text-button">View available rewards <ChevronRight size={16} /></Link>
          </div>
          <div className="hero-trust"><ShieldCheck size={15} /> <span>Points are tracked in a transparent ledger.</span></div>
        </div>
        <div className="hero-balance-card glass-card gold-wash">
          <div className="card-topline"><span className="eyebrow"><Coins size={13} /> your balance</span><span className="live-status"><span /> live</span></div>
          <div className="hero-points">{balance.toLocaleString()}<small>pts</small></div>
          <div className="hero-points-foot"><span>Available to use in the store</span><PointsBadge /></div>
          <div className="balance-chart" aria-hidden="true"><span style={{ height: "34%" }} /><span style={{ height: "51%" }} /><span style={{ height: "43%" }} /><span style={{ height: "65%" }} /><span style={{ height: "54%" }} /><span style={{ height: "82%" }} /><span style={{ height: "71%" }} /><span style={{ height: "91%" }} /></div>
          <div className="chart-labels"><span>last 7 activities</span><span>ledger #{ledgerCount.toString().padStart(2, "0")}</span></div>
        </div>
        <div className="hero-orbit-card glass-card"><div className="orbit-mark"><Sparkles size={21} /></div><p className="orbit-title">One workspace.<br /><strong>Four ways forward.</strong></p><div className="orbit-list"><span><Check size={14} /> services</span><span><Check size={14} /> store</span><span><Check size={14} /> rewards</span></div></div>
      </section>

      <section className="metrics-row" aria-label="Account overview">
        <div className="metric-card glass-card"><div className="metric-icon"><Ticket size={17} /></div><div><span className="metric-label">Tickets</span><strong>{String(tickets.length).padStart(2, "0")}</strong><small>real requests</small></div><span className="metric-trend">{tickets.filter((ticket) => ticket.status === "PENDING").length} pending</span></div>
        <div className="metric-card glass-card"><div className="metric-icon"><Gift size={17} /></div><div><span className="metric-label">Rewards</span><strong>{String(rewardSessions.length).padStart(2, "0")}</strong><small>saved sessions</small></div><span className="metric-trend">{rewardSessions.filter((item) => item.status === "PENDING_VERIFICATION").length} pending</span></div>
        <div className="metric-card glass-card"><div className="metric-icon"><ChartNoAxesCombined size={17} /></div><div><span className="metric-label">Orders</span><strong>{String(orders.length).padStart(2, "0")}</strong><small>service requests</small></div><span className="metric-trend">{orders.length ? "latest saved" : "none yet"}</span></div>
        <div className="metric-card glass-card"><div className="metric-icon"><ShieldCheck size={17} /></div><div><span className="metric-label">Account</span><strong>Good</strong><small>status verified</small></div><span className="metric-trend is-neutral">protected</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><div className="section-kicker"><span className="kicker-line" /> start with what matters</div><h2>Built for momentum.</h2></div><Link href="/store" className="section-link">View all services <ArrowRight size={15} /></Link></div>
        <div className="service-grid">{services.map((service) => { const Icon = service.icon; return <Link href={service.href} key={service.title} className="service-card glass-card"><div className="service-image-wrap"><ServiceVisual kind={service.visual} /><span className="service-label"><Icon size={13} /> {service.label}</span></div><div className="service-copy"><div><h3>{service.title}</h3><p>{service.description}</p></div><div className="service-meta"><span className="price-points"><Coins size={14} /> {service.points}</span>{service.cash ? <span className="cash-alt">cash from {service.cash}</span> : <span className="points-only">points only</span>}</div></div></Link>; })}</div>
      </section>

      <section className="policy-strip glass-card"><div className="policy-icon"><ShieldCheck size={20} /></div><div><strong>Clear by design.</strong><p>Cash checkout is reserved for BOT and WEBSITE services. All other products and benefits are points only.</p></div><Link href="/store" className="policy-link">See the rules <ArrowRight size={14} /></Link></section>
    </div>
  );
}
