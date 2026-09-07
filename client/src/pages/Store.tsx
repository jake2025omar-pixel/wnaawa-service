// Wnaawa style reminder: the store makes payment eligibility visible before checkout and keeps gold for allowed actions.
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, Check, Code2, Coins, FileBox, Globe2, Lock, PackageCheck, ShieldAlert, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { getBalance, spendPoints, validateCheckout, type PaymentMethod, type ProductType } from "../lib/ledger";
import { createLocalId, getStoredOrders, subscribeToLiveState, saveStoredOrders } from "../lib/liveState";
import { submitTicket } from "../lib/tickets";

type Filter = "All" | "Points" | "BOT & Website";
type Product = { id: string; title: string; eyebrow: string; description: string; type: ProductType; points: number; cash: string | null; visual: string; icon: typeof Bot; tag: string };

function ProductVisual({ kind }: { kind: string }) {
  return <div className={`product-visual product-visual-${kind}`} aria-hidden="true"><span className="visual-orb" /><span className="visual-panel" /><span className="visual-line visual-line-one" /><span className="visual-line visual-line-two" /><span className="visual-dot" /></div>;
}

const products: Product[] = [
  { id: "bot-starter", title: "Store bot starter", eyebrow: "BOT SERVICE", description: "A practical Telegram bot flow for FAQs, lead capture, and handoff.", type: "SERVICE_BOT", points: 650, cash: "$29", visual: "bot", icon: Bot, tag: "cash eligible" },
  { id: "web-launch", title: "Launch website", eyebrow: "WEBSITE SERVICE", description: "A focused website build with responsive sections and a clear action path.", type: "SERVICE_WEBSITE", points: 1200, cash: "$79", visual: "website", icon: Globe2, tag: "cash eligible" },
  { id: "template-kit", title: "Operations template kit", eyebrow: "TEMPLATE", description: "Reusable templates for organizing a lightweight digital service workflow.", type: "TEMPLATE", points: 180, cash: null, visual: "rewards", icon: FileBox, tag: "points only" },
  { id: "tech-support", title: "Technical service session", eyebrow: "DIGITAL SERVICE", description: "A structured session for debugging, setup, or practical digital guidance.", type: "DIGITAL_ASSET", points: 260, cash: null, visual: "rewards", icon: WandSparkles, tag: "points only" },
  { id: "reward-entry", title: "Campaign entry", eyebrow: "REWARD", description: "Use points for an available campaign entry subject to its terms.", type: "REWARD", points: 120, cash: null, visual: "rewards", icon: Sparkles, tag: "points only" },
  { id: "web-audit", title: "Website clarity audit", eyebrow: "WEBSITE SERVICE", description: "A concise review of structure, content hierarchy, and conversion clarity.", type: "SERVICE_WEBSITE", points: 400, cash: "$35", visual: "website", icon: Code2, tag: "cash eligible" },
];

export default function Store() {
  const [filter, setFilter] = useState<Filter>("All");
  const [payment, setPayment] = useState<PaymentMethod>("POINTS");
  const [selectedProduct, setSelectedProduct] = useState(products[2]);
  const [guardMessage, setGuardMessage] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [, refresh] = useState(0);
  useEffect(() => subscribeToLiveState(() => refresh((value) => value + 1)), []);
  const balance = getBalance();

  const filtered = useMemo(() => {
    if (filter === "Points") return products.filter((product) => !product.cash);
    if (filter === "BOT & Website") return products.filter((product) => Boolean(product.cash));
    return products;
  }, [filter]);

  function choose(product: Product) {
    setSelectedProduct(product);
    setGuardMessage(null);
    setPayment(product.cash ? "CASH" : "POINTS");
  }

  function validate() {
    const result = validateCheckout(selectedProduct.type, payment);
    if (!result.ok) {
      setGuardMessage(`403 — ${result.message}`);
      toast.error("Cash checkout blocked for this item.");
      return;
    }
    setGuardMessage(result.message);
  }

  async function requestCash(product: Product) {
    const result = validateCheckout(product.type, "CASH");
    if (!result.ok) {
      setGuardMessage(`403 — ${result.message}`);
      toast.error("Cash checkout blocked for this item.");
      return;
    }
    if (!whatsapp.trim()) {
      toast.error("Add the customer WhatsApp number before creating a ticket.");
      setGuardMessage("WhatsApp is required to create a ticket.");
      return;
    }
    const ticket = await submitTicket({ serviceName: product.title, whatsapp: whatsapp.trim(), paymentMethod: "CASH", pointsCost: 0 });
    toast.success(`Cash request ticket ${ticket.id} created.`);
    setGuardMessage(`Ticket ${ticket.id} created. The admin will follow up on WhatsApp.`);
  }

  async function buyWithPoints(product: Product) {
    const result = validateCheckout(product.type, "POINTS");
    if (!result.ok) return;
    if (!whatsapp.trim()) {
      toast.error("Add the customer WhatsApp number before creating a ticket.");
      setGuardMessage("WhatsApp is required to create a ticket.");
      return;
    }
    if (balance < product.points) {
      toast.error("Not enough points for this order.");
      return;
    }
    spendPoints(product.points, "SPEND_STORE", product.id);
    const ticket = await submitTicket({ serviceName: product.title, whatsapp: whatsapp.trim(), paymentMethod: "POINTS", pointsCost: product.points });
    saveStoredOrders([{ id: createLocalId("order"), productId: product.id, title: product.title, points: product.points, ticketId: ticket.id, createdAt: new Date().toISOString() }, ...getStoredOrders()]);
    toast.success(`${product.points.toLocaleString()} points deducted and ticket ${ticket.id} created.`);
    setGuardMessage(`Ticket ${ticket.id} created. Payment verification is available after this ticket exists.`);
  }

  return (
    <div className="page-stack">
      <section className="page-intro store-intro"><div><div className="section-kicker"><span className="kicker-line" /> the service store</div><h1>Good work needs<br /><em>good tools.</em></h1><p>Choose a service, asset, or reward. The payment rule is always visible before you commit.</p></div><div className="store-balance glass-card"><span className="eyebrow"><Coins size={13} /> available to spend</span><strong>{balance.toLocaleString()} <small>pts</small></strong><span>Cash purchase is disabled for points packages.</span></div></section>

      <div className="store-toolbar"><div className="filter-group" role="tablist" aria-label="Filter store items">{(["All", "Points", "BOT & Website"] as Filter[]).map((item) => <button key={item} className={`filter-pill ${filter === item ? "filter-pill-active" : ""}`} onClick={() => setFilter(item)}>{item}</button>)}</div><span className="result-count">{filtered.length.toString().padStart(2, "0")} items available</span></div>

      <section className="store-grid">{filtered.map((product, index) => { const Icon = product.icon; return <article className={`store-product glass-card ${index === 0 ? "store-product-featured" : ""}`} key={product.id}><div className="product-art"><ProductVisual kind={product.visual} /><span className="product-type"><Icon size={13} /> {product.eyebrow}</span></div><div className="product-body"><div className="product-title-row"><div><h3>{product.title}</h3><p>{product.description}</p></div><span className={`availability-dot ${product.cash ? "is-gold" : ""}`} title={product.cash ? "Cash eligible service" : "Points only"} /></div><div className="product-price-row"><span className="product-points"><Coins size={14} /> {product.points.toLocaleString()} pts</span>{product.cash ? <span className="product-cash">or {product.cash} cash</span> : <span className="product-only"><Lock size={11} /> points only</span>}</div><div className="product-actions"><button className="primary-button primary-button-small" onClick={() => buyWithPoints(product)}><PackageCheck size={14} /> Use points</button>{product.cash ? <button className="ghost-button" onClick={() => requestCash(product)}>Cash request <ArrowRight size={14} /></button> : <span className="product-tag"><Check size={12} /> {product.tag}</span>}</div></div></article>; })}</section>

      <section className="checkout-guard glass-card"><div className="guard-heading"><div className="guard-icon"><ShieldAlert size={19} /></div><div><div className="section-kicker"><span className="kicker-line" /> policy gate</div><h2>Test the checkout rule.</h2><p>In production this validation belongs on the server. The frontend mirrors the rule so the user sees it before payment.</p></div></div><div className="guard-controls"><label>WhatsApp<input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="Customer WhatsApp" /></label><label>Product<select value={selectedProduct.id} onChange={(event) => { const product = products.find((item) => item.id === event.target.value); if (product) choose(product); }}>{products.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}</select></label><label>Payment method<select value={payment} onChange={(event) => setPayment(event.target.value as PaymentMethod)}><option value="POINTS">POINTS</option><option value="CASH">CASH</option></select></label><button className="primary-button" onClick={validate}>Validate checkout <ArrowRight size={15} /></button></div>{guardMessage && <div className={`guard-result ${guardMessage.startsWith("403") ? "guard-result-error" : "guard-result-success"}`}><span>{guardMessage.startsWith("403") ? <ShieldAlert size={15} /> : <Check size={15} />}</span>{guardMessage}</div>}<div className="guard-foot"><span><Lock size={12} /> No cash checkout for templates, assets, rewards, or points packages.</span><Link href="/watch">Earn points through available rewards <ArrowRight size={13} /></Link></div></section>
    </div>
  );
}
