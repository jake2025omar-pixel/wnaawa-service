import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ClipboardList, Coins, ExternalLink, ShieldCheck } from "lucide-react";
import { getStoredOrders, getStoredTickets, subscribeToLiveState, type LocalOrder, type LocalTicket } from "../lib/liveState";

export default function Admin() {
  const [tickets, setTickets] = useState<LocalTicket[]>(getStoredTickets());
  const [orders, setOrders] = useState<LocalOrder[]>(getStoredOrders());

  useEffect(() => subscribeToLiveState(() => {
    setTickets(getStoredTickets());
    setOrders(getStoredOrders());
  }), []);

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <div className="section-kicker"><span className="kicker-line" /> admin workspace</div>
          <h1>Live request<br /><em>records.</em></h1>
          <p>This view reflects tickets and orders created in this browser. Server tickets are delivered to the configured Telegram admin through the webhook API.</p>
        </div>
        <div className="store-balance glass-card"><span className="eyebrow"><ShieldCheck size={13} /> data status</span><strong>{tickets.length.toString().padStart(2, "0")}</strong><span>tickets stored locally</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><div className="section-kicker"><span className="kicker-line" /> tickets</div><h2>Customer requests.</h2></div><Link href="/store" className="section-link"><ArrowLeft size={15} /> Back to store</Link></div>
        <div className="glass-card" style={{ overflowX: "auto" }}>
          {tickets.length === 0 ? <p className="empty-state">No tickets yet. Create one from the Store with a WhatsApp number and points balance.</p> : <div className="admin-table"><div className="admin-table-row admin-table-head"><span>ID</span><span>Service</span><span>WhatsApp</span><span>Payment</span><span>Status</span></div>{tickets.map((ticket) => <div className="admin-table-row" key={ticket.id}><span>{ticket.id}</span><strong>{ticket.serviceName}</strong><span>{ticket.whatsapp}</span><span><Coins size={13} /> {ticket.paymentMethod}</span><span className="status-pill">{ticket.status}</span></div>)}</div>}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><div className="section-kicker"><span className="kicker-line" /> orders</div><h2>Points activity.</h2></div><span className="result-count">{orders.length} saved orders</span></div>
        <div className="admin-order-grid">{orders.length === 0 ? <div className="glass-card empty-state"><ClipboardList size={18} /> No points orders yet.</div> : orders.map((order) => <article className="glass-card admin-order-card" key={order.id}><div><span className="eyebrow"><ClipboardList size={13} /> {order.id}</span><h3>{order.title}</h3><p>{order.points.toLocaleString()} points · ticket {order.ticketId}</p></div><ExternalLink size={16} /></article>)}</div>
      </section>
    </div>
  );
}
