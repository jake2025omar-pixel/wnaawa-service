// Wnaawa style reminder: reward interactions must be transparent; the visual timer never grants points.
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, Gift, Info, LockKeyhole, Play, RefreshCw, ShieldCheck, TimerReset, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { getRewardAvailability, getRewardSessions, getStoredTickets, markPaymentVerified, saveRewardSession, setRewardAvailability, subscribeToLiveState } from "../lib/liveState";

const TOTAL_SECONDS = 20;
const PLACEMENT_ID = "2454518";

type SessionStatus = "READY" | "CREATED" | "STARTED" | "PENDING_VERIFICATION" | "VERIFIED" | "REWARDED" | "EXPIRED" | "REJECTED";

type RewardSession = { id: string; provider: string; placement: string; status: SessionStatus; createdAt: string; expiresAt: string };

function createRewardSession(): RewardSession {
  const createdAt = new Date();
  return { id: `rs-demo-${createdAt.getTime()}`, provider: "A-ADS", placement: PLACEMENT_ID, status: "CREATED", createdAt: createdAt.toISOString(), expiresAt: new Date(createdAt.getTime() + 60000).toISOString() };
}

export default function Watch() {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [session, setSession] = useState<RewardSession | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [notice, setNotice] = useState<"idle" | "pending" | "unavailable" | "expired">("idle");
  const [tickets, setTickets] = useState(getStoredTickets());
  const [availability, setAvailability] = useState(getRewardAvailability());
  useEffect(() => subscribeToLiveState(() => {
    setTickets(getStoredTickets());
    setAvailability(getRewardAvailability());
  }), []);

  useEffect(() => {
    if (!hasStarted || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [hasStarted, secondsLeft]);

  useEffect(() => {
    if (hasStarted && secondsLeft === 0) {
      setNotice("pending");
      setSession((current) => {
        if (!current) return current;
        const next = { ...current, status: "PENDING_VERIFICATION" as SessionStatus };
        saveRewardSession(next);
        return next;
      });
    }
  }, [hasStarted, secondsLeft]);

  const progress = useMemo(() => ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100, [secondsLeft]);
  const ringStyle = { "--progress": `${progress * 3.6}deg` } as React.CSSProperties;

  function startRewardSession() {
    if (availability === "BLOCKED") {
      toast.error("Reward inventory is currently unavailable.");
      return;
    }
    setRewardAvailability("AVAILABLE");
    setAvailability("AVAILABLE");
    const next = { ...createRewardSession(), status: "STARTED" as SessionStatus };
    saveRewardSession(next);
    setSession(next);
    setSecondsLeft(TOTAL_SECONDS);
    setHasStarted(true);
    setNotice("idle");
    toast("Reward session created. The network must verify completion before points can be added.");
  }

  function resetSession() {
    setSession(null);
    setHasStarted(false);
    setSecondsLeft(TOTAL_SECONDS);
    setNotice("idle");
  }

  function verifyPayment() {
    const ticket = tickets[0];
    if (!ticket) {
      toast.error("Create a ticket before verifying payment.");
      return;
    }
    markPaymentVerified(ticket.id);
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, status: "VERIFIED" as SessionStatus };
      saveRewardSession(next);
      return next;
    });
    toast.success(`Payment verification linked to ticket ${ticket.id}.`);
  }

  return (
    <div className="page-stack">
      <section className="page-intro"><div><div className="section-kicker"><span className="kicker-line" /> optional rewards</div><h1>Watch when it’s<br /><em>worth your time.</em></h1><p>Eligible rewarded ads can add 5 points after the network verifies a completed experience. Availability depends on inventory, region, device, and account limits.</p></div><div className="intro-side-note"><ShieldCheck size={18} /><span>No guaranteed winning.<br />No automatic cash value.</span></div></section>

      <section className="reward-layout">
        <div className="reward-card glass-card">
          <div className="reward-card-header"><span className="reward-badge"><Gift size={14} /> {availability === "BLOCKED" ? "reward unavailable" : availability === "AVAILABLE" ? "reward available" : "availability checking"}</span><span className="network-label">A-ADS / {PLACEMENT_ID}</span></div>
          <div className="reward-main"><div className="reward-copy"><h2>Watch an optional<br /><strong>eligible ad</strong> to get 5 points.</h2><p>Points are added only after provider verification. A timer alone never changes your balance.</p><div className="reward-rules"><span><CheckCircle2 size={15} /> one-time reward session</span><span><CheckCircle2 size={15} /> duplicate checks applied</span><span><CheckCircle2 size={15} /> verification required</span></div></div><div className="timer-stack"><div className={`timer-ring ${hasStarted ? "timer-ring-active" : ""}`} style={ringStyle}><div className="timer-inner">{secondsLeft}<small>sec</small></div></div><span className="timer-label">{hasStarted ? "session active" : "15s + 5s"}</span></div></div>
          <div className="ad-embed-shell"><div className="ad-embed-topline"><span><span className="ad-dot" /> secure ad placement</span><span className="embed-lock"><LockKeyhole size={12} /> sandboxed</span></div><div className="ad-embed-content"><div className="ad-symbol"><Play size={19} fill="currentColor" /></div><strong>A-ADS rewarded placement</strong><span>Placement {PLACEMENT_ID} · {availability === "BLOCKED" ? "inventory unavailable" : availability === "AVAILABLE" ? "inventory available" : "inventory status pending"}</span><small>Network inventory is checked before a session can be verified.</small></div></div>
          <div className="reward-card-footer"><div className="session-state">{session ? <><span className="state-dot state-dot-live" /> {session.status.replaceAll("_", " ").toLowerCase()}</> : <><Clock3 size={14} /> ready to start</>}</div><div className="inline-actions">{hasStarted ? <button className="secondary-button" onClick={resetSession}><RefreshCw size={15} /> reset</button> : <button className="primary-button" onClick={startRewardSession}><Play size={15} fill="currentColor" /> Watch Ad</button>}<button className="ghost-button" onClick={verifyPayment} disabled={tickets.length === 0}><ShieldCheck size={15} /> Verify payment</button></div></div>
        </div>

        <aside className="reward-side-stack"><div className="side-card glass-card"><div className="side-card-icon"><Info size={17} /></div><h3>How rewards work</h3><ol><li><span>01</span> Start a temporary reward session.</li><li><span>02</span> Complete an eligible network experience.</li><li><span>03</span> Provider verifies the event.</li><li><span>04</span> Ledger records +5 points once.</li></ol></div><div className="side-card side-card-muted glass-card"><div className="side-card-icon"><XCircle size={17} /></div><h3>Not available right now?</h3><p>That means no eligible inventory is connected for this session. Try later — no points are granted when an ad is unavailable or incomplete.</p><Link href="/store" className="text-button">Use points in the store <ArrowRight size={15} /></Link></div></aside>
      </section>

      {notice === "pending" && <div className="status-banner status-pending glass-card"><TimerReset size={18} /><div><strong>Verification pending.</strong><span>The network must confirm this session before points can be added.</span></div><button onClick={() => { setRewardAvailability("BLOCKED"); setAvailability("BLOCKED"); setNotice("unavailable"); setSession((current) => { if (!current) return current; const next = { ...current, status: "REJECTED" as SessionStatus }; saveRewardSession(next); return next; }); }}>Dismiss</button></div>}
      {notice === "unavailable" && <div className="status-banner status-muted glass-card"><Info size={18} /><div><strong>No rewarded ad available currently.</strong><span>Try later. No points were added.</span></div><button onClick={() => setNotice("idle")}>Dismiss</button></div>}
    </div>
  );
}
