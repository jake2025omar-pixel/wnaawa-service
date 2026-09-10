import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, ClipboardList, Coins, ExternalLink, Filter, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getStoredOrders, type LocalOrder } from "../lib/liveState";

type TicketStatus = "PENDING" | "PAID" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type ServerTicket = { id: number; serviceName: string; whatsapp: string; paymentMethod: "POINTS" | "CASH" | "BITCOIN"; pointsCost: number; status: TicketStatus; createdAt: string; updatedAt: string };
const statuses: Array<"ALL" | TicketStatus> = ["ALL", "PENDING", "PAID", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function Admin() {
  const [tickets, setTickets] = useState<ServerTicket[]>([]);
  const [orders, setOrders] = useState<LocalOrder[]>(getStoredOrders());
  const [status, setStatus] = useState<(typeof statuses)[number]>("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (query.trim()) params.set("q", query.trim());
    try {
      const response = await fetch(`/api/admin/tickets?${params.toString()}`, { credentials: "include" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Admin access is required");
      setTickets(payload.tickets ?? []);
      setServerError("");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to load server tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => { void loadTickets(); }, [loadTickets]);
  useEffect(() => { setOrders(getStoredOrders()); }, []);

  const pendingCount = useMemo(() => tickets.filter((ticket) => ticket.status === "PENDING").length, [tickets]);

  async function updateStatus(id: number, nextStatus: TicketStatus) {
    try {
      const response = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to update ticket");
      setTickets((current) => current.map((ticket) => ticket.id === id ? { ...ticket, status: nextStatus } : ticket));
      toast.success(`Ticket #${id} moved to ${nextStatus.replaceAll("_", " ").toLowerCase()}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update ticket");
    }
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <div className="section-kicker"><span className="kicker-line" /> admin workspace</div>
          <h1>Live request<br /><em>records.</em></h1>
          <p>Server-backed tickets delivered through Telegram, with filters and status controls for the configured admin workspace.</p>
        </div>
        <div className="store-balance glass-card"><span className="eyebrow"><ShieldCheck size={13} /> server data</span><strong>{tickets.length.toString().padStart(2, "0")}</strong><span>{pendingCount} pending ticket{pendingCount === 1 ? "" : "s"}</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><div className="section-kicker"><span className="kicker-line" /> tickets</div><h2>Customer requests.</h2></div><div className="admin-actions"><button className="secondary-button" onClick={() => void loadTickets()}><RefreshCw size={14} /> Refresh</button><Link href="/store" className="section-link"><ArrowLeft size={15} /> Back to store</Link></div></div>
        <div className="admin-toolbar glass-card"><label className="admin-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search service name" /></label><label className="admin-filter"><Filter size={14} /><select value={status} onChange={(event) => setStatus(event.target.value as (typeof statuses)[number])}>{statuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label></div>
        {serverError && <div className="status-banner status-muted glass-card"><ShieldCheck size={18} /><div><strong>Server tickets are protected.</strong><span>{serverError}. Sign in with the configured admin account to view private records.</span></div></div>}
        <div className="glass-card" style={{ overflowX: "auto" }}>
          {loading ? <p className="empty-state"><RefreshCw size={17} /> Loading server tickets…</p> : tickets.length === 0 ? <p className="empty-state">No matching server tickets. New requests will appear here after the Telegram delivery flow creates them.</p> : <div className="admin-table"><div className="admin-table-row admin-table-head"><span>ID</span><span>Service</span><span>WhatsApp</span><span>Payment</span><span>Status</span></div>{tickets.map((ticket) => <div className="admin-table-row" key={ticket.id}><span>#{ticket.id}</span><strong>{ticket.serviceName}</strong><span>{ticket.whatsapp}</span><span><Coins size={13} /> {ticket.paymentMethod}</span><label className="status-select"><select value={ticket.status} onChange={(event) => void updateStatus(ticket.id, event.target.value as TicketStatus)}>{statuses.filter((item) => item !== "ALL").map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label></div>)}</div>}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><div className="section-kicker"><span className="kicker-line" /> orders</div><h2>Points activity.</h2></div><span className="result-count">{orders.length} saved orders</span></div>
        <div className="admin-order-grid">{orders.length === 0 ? <div className="glass-card empty-state"><ClipboardList size={18} /> No points orders yet.</div> : orders.map((order) => <article className="glass-card admin-order-card" key={order.id}><div><span className="eyebrow"><ClipboardList size={13} /> {order.id}</span><h3>{order.title}</h3><p>{order.points.toLocaleString()} points · ticket {order.ticketId}</p></div><ExternalLink size={16} /></article>)}</div>
      </section>

      <div className="policy-strip glass-card"><CheckCircle2 size={18} /><span>Private records stay behind the admin session. Telegram notifications remain server-side and the bot token is never sent to the browser.</span></div>
    </div>
  );
}
