import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  LayoutDashboard, ListChecks, DownloadCloud, BarChart3, TrendingUp, Settings,
  Mail, FileText, MessageCircle, Sparkles, Check, X, Repeat, Car, ShoppingBag,
  ShoppingBasket, UtensilsCrossed, ReceiptText, HeartPulse, Clapperboard, Tag,
  Leaf, Plus, Wand2, Search, CircleCheck, Upload, ChevronRight, Wallet, ArrowUpRight,
  ArrowDownRight, Loader2, ShieldCheck, Bot,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  THEME                                                              */
/* ------------------------------------------------------------------ */
const T = {
  paper: "#FBF8F1", paper2: "#F4EFE4", card: "#FFFFFF",
  ink: "#1B2A24", ink2: "#475750", muted: "#8B978F", line: "#EAE3D4",
  green: "#2E7D5B", greenSoft: "#E5F0E9", greenBright: "#3FA77C",
  coral: "#E07A55", amber: "#D89A3C", blue: "#5B8DC9", purple: "#8E7BC4",
  pink: "#D77BA6", teal: "#3FA39A", red: "#D45D5D", indigo: "#6A78C9",
};

const CATS = {
  "Income":            { color: T.green,   icon: TrendingUp },
  "Food & Dining":     { color: T.coral,   icon: UtensilsCrossed },
  "Groceries":         { color: T.amber,   icon: ShoppingBasket },
  "Transport":         { color: T.blue,    icon: Car },
  "Shopping":          { color: T.purple,  icon: ShoppingBag },
  "Bills & Utilities": { color: T.teal,    icon: ReceiptText },
  "Entertainment":     { color: T.pink,    icon: Clapperboard },
  "Subscriptions":     { color: T.indigo,  icon: Repeat },
  "Health":            { color: T.red,     icon: HeartPulse },
  "Investments":       { color: "#2E9E84", icon: Leaf },
  "Other":             { color: T.muted,   icon: Tag },
};
const CAT_NAMES = Object.keys(CATS);

const SRC = {
  gmail:     { label: "Gmail",    icon: Mail,          color: T.red },
  statement: { label: "Statement",icon: FileText,      color: T.blue },
  whatsapp:  { label: "WhatsApp", icon: MessageCircle, color: T.greenBright },
  manual:    { label: "Manual",   icon: Plus,          color: T.muted },
  seed:      { label: "Synced",   icon: Wallet,        color: T.muted },
};

/* ------------------------------------------------------------------ */
/*  PROTOTYPE CLOCK (deterministic)                                    */
/* ------------------------------------------------------------------ */
const NOW = new Date("2026-06-10T10:00:00");
const iso = (y, m, d) => new Date(y, m - 1, d, 12).toISOString();
const OPENING_BALANCE = 218400; // bank balance before any seeded txns

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
const fmtINR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inr = (n) => fmtINR.format(Math.round(n || 0));
const inrAbs = (n) => fmtINR.format(Math.abs(Math.round(n || 0)));
const monthName = (d) => d.toLocaleString("en-IN", { month: "long" });
const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
let _id = 1;
const uid = () => `t${_id++}`;

// "AI" categoriser — keyword rules with a confidence score.
const RULES = [
  [/swiggy|zomato|domino|mcdonald|kfc|starbucks|chaayos|cafe|biryani|restaurant|eatfit|behrouz/i, "Food & Dining", 0.96],
  [/bigbasket|blinkit|zepto|dmart|grofers|reliance fresh|more supermarket|grocery|instamart/i, "Groceries", 0.95],
  [/uber|ola|rapido|irctc|indigo|vistara|fuel|petrol|hpcl|iocl|metro|bmtc|namma/i, "Transport", 0.94],
  [/amazon|flipkart|myntra|ajio|nykaa|croma|reliance digital|meesho|tata cliq/i, "Shopping", 0.92],
  [/netflix|spotify|prime|hotstar|youtube premium|disney|apple\.com\/bill|icloud|adobe/i, "Subscriptions", 0.95],
  [/bookmyshow|pvr|inox|cinepolis|steam|playstation/i, "Entertainment", 0.9],
  [/bescom|electricity|jio|airtel|\bvi\b|vodafone|broadband|act fibernet|gas|water bill|rent|maintenance|tata power/i, "Bills & Utilities", 0.93],
  [/apollo|1mg|pharmeasy|pharmacy|hospital|clinic|practo|medplus|cult\.fit|gym/i, "Health", 0.9],
  [/zerodha|coin|groww|smallcase|mutual fund|\bsip\b|nps|kuvera|indmoney/i, "Investments", 0.97],
  [/salary|payroll|interest credit|refund|cashback|reimburse/i, "Income", 0.95],
];
function aiCategorise(merchant, amount) {
  for (const [re, cat, conf] of RULES) {
    if (re.test(merchant)) {
      if (cat === "Income" && amount < 0) continue;
      return { category: cat, confidence: conf };
    }
  }
  if (amount > 0) return { category: "Income", confidence: 0.7 };
  return { category: "Other", confidence: 0.45 };
}

/* ------------------------------------------------------------------ */
/*  SEED DATA                                                          */
/* ------------------------------------------------------------------ */
function buildSeed() {
  const rows = [
    // [year, month, day, merchant, amount]
    [2026, 5, 1, "Monthly Salary", 185000],
    [2026, 5, 2, "House Rent", -35000],
    [2026, 5, 2, "Zerodha Coin · SIP", -25000],
    [2026, 5, 3, "BESCOM Electricity", -2180],
    [2026, 5, 3, "Jio Postpaid", -399],
    [2026, 5, 4, "Swiggy", -612],
    [2026, 5, 5, "BigBasket", -3240],
    [2026, 5, 6, "Uber", -288],
    [2026, 5, 7, "Netflix", -649],
    [2026, 5, 8, "Amazon", -1899],
    [2026, 5, 9, "Spotify", -119],
    [2026, 5, 10, "Chaayos", -420],
    [2026, 5, 12, "Cult.fit Membership", -2500],
    [2026, 5, 13, "Zomato", -540],
    [2026, 5, 15, "Myntra", -2760],
    [2026, 5, 16, "Blinkit", -870],
    [2026, 5, 18, "BookMyShow · PVR", -980],
    [2026, 5, 19, "HPCL Fuel", -2000],
    [2026, 5, 21, "Apollo Pharmacy", -640],
    [2026, 5, 22, "Swiggy", -498],
    [2026, 5, 24, "Amazon", -1299],
    [2026, 5, 26, "Ola", -340],
    [2026, 5, 28, "Reliance Fresh", -1560],
    [2026, 5, 30, "Starbucks", -510],
    // June (up to the 9th — "today" is the 10th)
    [2026, 6, 1, "Monthly Salary", 185000],
    [2026, 6, 2, "House Rent", -35000],
    [2026, 6, 2, "Zerodha Coin · SIP", -25000],
    [2026, 6, 3, "BESCOM Electricity", -2310],
    [2026, 6, 3, "Jio Postpaid", -399],
    [2026, 6, 4, "Swiggy", -726],
    [2026, 6, 5, "BigBasket", -2980],
    [2026, 6, 6, "Netflix", -649],
    [2026, 6, 6, "Uber", -310],
    [2026, 6, 7, "Spotify", -119],
    [2026, 6, 8, "Amazon", -2499],
    [2026, 6, 9, "Chaayos", -380],
  ];
  return rows.map(([y, m, d, merchant, amount]) => {
    const { category, confidence } = aiCategorise(merchant, amount);
    return { id: uid(), date: iso(y, m, d), merchant, amount, category, confidence, source: "seed" };
  });
}

/* ------------------------------------------------------------------ */
/*  SMALL UI PRIMITIVES                                                */
/* ------------------------------------------------------------------ */
function CatPill({ category, small }) {
  const c = CATS[category] || CATS.Other;
  const Icon = c.icon;
  return (
    <span className="kh-pill" style={{ background: c.color + "1A", color: c.color, fontSize: small ? 11 : 12 }}>
      <Icon size={small ? 12 : 13} /> {category}
    </span>
  );
}
function Conf({ value }) {
  const high = value >= 0.85, mid = value >= 0.6;
  const col = high ? T.green : mid ? T.amber : T.red;
  return (
    <span className="kh-conf" title="AI confidence" style={{ color: col, borderColor: col + "44" }}>
      <Sparkles size={10} /> {Math.round(value * 100)}%
    </span>
  );
}
function StatCard({ label, value, sub, accent, trend }) {
  return (
    <div className="kh-card kh-stat">
      <div className="kh-stat-label">{label}</div>
      <div className="kh-stat-value" style={{ color: accent || T.ink }}>{value}</div>
      {sub && (
        <div className="kh-stat-sub" style={{ color: trend === "up" ? T.green : trend === "down" ? T.red : T.muted }}>
          {trend === "up" && <ArrowUpRight size={13} />}
          {trend === "down" && <ArrowDownRight size={13} />}
          {sub}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN APP                                                           */
/* ------------------------------------------------------------------ */
export default function App() {
  const [view, setView] = useState("overview");
  const [txns, setTxns] = useState(buildSeed);
  const [toasts, setToasts] = useState([]);
  const [gmail, setGmail] = useState({ connected: false, scanned: false });
  const [stmtDone, setStmtDone] = useState(false);
  const [waDone, setWaDone] = useState(false);

  // Load fonts once.
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch (e) {} };
  }, []);

  const toast = (msg, icon) => {
    const id = uid();
    setToasts((t) => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  };

  const addTxns = (rows, source) => {
    const made = rows.map((r) => {
      const { category, confidence } = aiCategorise(r.merchant, r.amount);
      return { id: uid(), source, category, confidence, ...r };
    });
    setTxns((prev) => [...made, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
    return made;
  };

  const recategorise = (id, category) =>
    setTxns((prev) => prev.map((t) => (t.id === id ? { ...t, category, confidence: 1, edited: true } : t)));

  const balance = useMemo(
    () => OPENING_BALANCE + txns.reduce((s, t) => s + t.amount, 0),
    [txns]
  );

  const nav = [
    ["overview", "Overview", LayoutDashboard],
    ["transactions", "Transactions", ListChecks],
    ["import", "Import & Scan", DownloadCloud],
    ["reports", "Reports", BarChart3],
    ["forecast", "Forecast", TrendingUp],
  ];

  return (
    <div className="kh-root">
      <style>{CSS}</style>

      {/* sidebar */}
      <aside className="kh-side">
        <div className="kh-brand">
          <span className="kh-logo"><Leaf size={18} /></span>
          <div>
            <div className="kh-brand-name">Khata</div>
            <div className="kh-brand-tag">your money, gently sorted</div>
          </div>
        </div>

        <nav className="kh-nav">
          {nav.map(([k, label, Icon]) => (
            <button key={k} className={"kh-nav-item" + (view === k ? " active" : "")} onClick={() => setView(k)}>
              <Icon size={18} /> <span>{label}</span>
              {view === k && <ChevronRight size={15} className="kh-nav-chev" />}
            </button>
          ))}
        </nav>

        <div className="kh-side-foot">
          <div className="kh-bal-card">
            <div className="kh-bal-label"><Wallet size={13} /> Available balance</div>
            <div className="kh-bal-value">{inr(balance)}</div>
          </div>
          <button className="kh-nav-item" onClick={() => setView("import")} style={{ marginTop: 6 }}>
            <Settings size={18} /> <span>Connections</span>
          </button>
        </div>
      </aside>

      {/* main */}
      <main className="kh-main">
        <AssistantBar txns={txns} balance={balance} setView={setView} />

        <div className="kh-content">
          {view === "overview" && <Overview txns={txns} balance={balance} setView={setView} gmail={gmail} stmtDone={stmtDone} waDone={waDone} />}
          {view === "transactions" && <Transactions txns={txns} recategorise={recategorise} addTxns={addTxns} toast={toast} />}
          {view === "import" && (
            <ImportScan
              gmail={gmail} setGmail={setGmail} stmtDone={stmtDone} setStmtDone={setStmtDone}
              waDone={waDone} setWaDone={setWaDone} addTxns={addTxns} toast={toast} setView={setView}
            />
          )}
          {view === "reports" && <Reports txns={txns} />}
          {view === "forecast" && <Forecast txns={txns} balance={balance} />}
        </div>
      </main>

      {/* toasts */}
      <div className="kh-toasts">
        {toasts.map((t) => (
          <div key={t.id} className="kh-toast">
            <span className="kh-toast-ic">{t.icon || <CircleCheck size={16} />}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ASSISTANT BAR — the friendly AI presence                           */
/* ------------------------------------------------------------------ */
function AssistantBar({ txns, balance, setView }) {
  const insight = useMemo(() => {
    const month = txns.filter((t) => sameMonth(new Date(t.date), NOW));
    const spendByCat = {};
    let spend = 0;
    month.forEach((t) => {
      if (t.amount < 0 && t.category !== "Investments") {
        spend += -t.amount;
        spendByCat[t.category] = (spendByCat[t.category] || 0) + -t.amount;
      }
    });
    const top = Object.entries(spendByCat).sort((a, b) => b[1] - a[1])[0];
    const dim = daysInMonth(NOW.getFullYear(), NOW.getMonth());
    const daysLeft = dim - NOW.getDate();
    const recurringLeft = 0; // assume recurring already paid this month
    const safe = daysLeft > 0 ? Math.max(0, (balance - recurringLeft - 40000) / daysLeft) : 0;
    if (top) {
      const pct = Math.round((top[1] / spend) * 100);
      return `${top[0]} is your biggest category this month at ${inr(top[1])} — about ${pct}% of spending. You can comfortably spend ${inr(safe)}/day for the rest of June and still keep a ₹40k buffer.`;
    }
    return "Connect Gmail or upload a statement and I'll start sorting your spending automatically.";
  }, [txns, balance]);

  return (
    <div className="kh-assistant">
      <div className="kh-assistant-avatar"><Bot size={18} /></div>
      <div className="kh-assistant-body">
        <div className="kh-assistant-name">Khata Assistant <span className="kh-dot-live" /></div>
        <div className="kh-assistant-text">{insight}</div>
      </div>
      <button className="kh-btn ghost sm" onClick={() => setView("forecast")}>See forecast</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  OVERVIEW                                                           */
/* ------------------------------------------------------------------ */
function Overview({ txns, balance, setView, gmail, stmtDone, waDone }) {
  const stats = useMemo(() => {
    const m = txns.filter((t) => sameMonth(new Date(t.date), NOW));
    let income = 0, spend = 0, invest = 0;
    m.forEach((t) => {
      if (t.amount > 0) income += t.amount;
      else if (t.category === "Investments") invest += -t.amount;
      else spend += -t.amount;
    });
    return { income, spend, invest, net: income - spend - invest };
  }, [txns]);

  // running balance through the month (actual + dashed projection)
  const river = useMemo(() => {
    const y = NOW.getFullYear(), mo = NOW.getMonth();
    const dim = daysInMonth(y, mo);
    const today = NOW.getDate();
    // opening balance for the month = current balance minus this month's net
    const monthTxns = txns.filter((t) => sameMonth(new Date(t.date), NOW));
    const monthNet = monthTxns.reduce((s, t) => s + t.amount, 0);
    const openMonth = balance - monthNet;
    // avg daily discretionary burn so far
    let burn = 0;
    monthTxns.forEach((t) => { if (t.amount < 0 && t.category !== "Investments") burn += -t.amount; });
    const dailyBurn = burn / today;
    const data = [];
    let run = openMonth;
    for (let d = 1; d <= dim; d++) {
      if (d <= today) {
        const dayTx = monthTxns.filter((t) => new Date(t.date).getDate() === d).reduce((s, t) => s + t.amount, 0);
        run += dayTx;
        data.push({ day: d, actual: Math.round(run), projected: d === today ? Math.round(run) : null });
      } else {
        run -= dailyBurn;
        data.push({ day: d, actual: null, projected: Math.round(run) });
      }
    }
    return data;
  }, [txns, balance]);

  const byCat = useMemo(() => {
    const m = txns.filter((t) => sameMonth(new Date(t.date), NOW) && t.amount < 0);
    const map = {};
    m.forEach((t) => (map[t.category] = (map[t.category] || 0) + -t.amount));
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [txns]);

  const recent = txns.slice(0, 6);
  const connections = [
    ["Gmail", gmail.connected, () => setView("import")],
    ["Statements", stmtDone, () => setView("import")],
    ["WhatsApp", waDone, () => setView("import")],
  ];

  return (
    <div className="kh-fade">
      <PageHead title={`Good morning${""}`} sub={`${monthName(NOW)} ${NOW.getDate()}, ${NOW.getFullYear()} · here's where your money stands`} />

      <div className="kh-grid-4">
        <StatCard label="Spent this month" value={inr(stats.spend)} accent={T.coral} sub="across 9 categories" />
        <StatCard label="Income" value={inr(stats.income)} accent={T.green} trend="up" sub="salary credited" />
        <StatCard label="Invested" value={inr(stats.invest)} accent="#2E9E84" sub="SIP auto-debit" />
        <StatCard label="Net saved" value={inr(stats.net)} accent={T.ink} sub={`${Math.round((stats.net / stats.income) * 100)}% of income`} trend="up" />
      </div>

      <div className="kh-grid-river">
        <div className="kh-card">
          <CardHead title="Cash-flow this month" hint="Solid = actual · Dashed = projected to month-end" />
          <div style={{ height: 230 }}>
            <ResponsiveContainer>
              <AreaChart data={river} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="riverFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.green} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={T.green} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: T.muted }} tickLine={false} axisLine={{ stroke: T.line }} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: T.muted }} tickLine={false} axisLine={false} width={64}
                  tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip content={<RiverTip />} />
                <ReferenceLine x={NOW.getDate()} stroke={T.amber} strokeDasharray="3 3" label={{ value: "today", fontSize: 10, fill: T.amber, position: "top" }} />
                <Area type="monotone" dataKey="actual" stroke={T.green} strokeWidth={2.5} fill="url(#riverFill)" connectNulls />
                <Area type="monotone" dataKey="projected" stroke={T.green} strokeWidth={2} strokeDasharray="5 4" fill="none" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="kh-card">
          <CardHead title="Where it went" hint={`${monthName(NOW)}`} />
          <div style={{ height: 150 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={42} outerRadius={66} paddingAngle={2} stroke="none">
                  {byCat.map((e) => <Cell key={e.name} fill={(CATS[e.name] || CATS.Other).color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [inr(v), n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="kh-legend">
            {byCat.slice(0, 5).map((e) => (
              <div key={e.name} className="kh-legend-row">
                <span className="kh-legend-dot" style={{ background: (CATS[e.name] || CATS.Other).color }} />
                <span className="kh-legend-name">{e.name}</span>
                <span className="kh-legend-val">{inr(e.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="kh-grid-bottom">
        <div className="kh-card">
          <CardHead title="Recent activity" action={<button className="kh-link" onClick={() => setView("transactions")}>View all</button>} />
          <div className="kh-tx-list">
            {recent.map((t) => <TxRow key={t.id} t={t} compact />)}
          </div>
        </div>

        <div className="kh-card">
          <CardHead title="Connections" />
          <div className="kh-conn-list">
            {connections.map(([name, on, go]) => {
              const ic = SRC[name === "Gmail" ? "gmail" : name === "Statements" ? "statement" : "whatsapp"];
              const Ic = ic.icon;
              return (
                <button key={name} className="kh-conn-row" onClick={go}>
                  <span className="kh-conn-ic" style={{ background: ic.color + "1A", color: ic.color }}><Ic size={16} /></span>
                  <span className="kh-conn-name">{name}</span>
                  {on
                    ? <span className="kh-badge ok"><Check size={12} /> Active</span>
                    : <span className="kh-badge">Set up <ChevronRight size={12} /></span>}
                </button>
              );
            })}
          </div>
          <button className="kh-btn primary full" onClick={() => setView("import")} style={{ marginTop: 12 }}>
            <Wand2 size={15} /> Import & auto-sort
          </button>
        </div>
      </div>
    </div>
  );
}
function RiverTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload.find((p) => p.value != null);
  return (
    <div className="kh-tip">
      <div className="kh-tip-label">June {label}</div>
      <div className="kh-tip-val">{inr(v?.value)}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TRANSACTIONS                                                       */
/* ------------------------------------------------------------------ */
function Transactions({ txns, recategorise, addTxns, toast }) {
  const [cat, setCat] = useState("All");
  const [src, setSrc] = useState("All");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);

  const lowConf = txns.filter((t) => t.confidence < 0.6 && !t.edited);

  const filtered = txns.filter((t) => {
    if (cat !== "All" && t.category !== cat) return false;
    if (src !== "All" && t.source !== src) return false;
    if (q && !t.merchant.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const autoSort = () => {
    let n = 0;
    lowConf.forEach((t) => { recategorise(t.id, t.category); n++; });
    toast(n ? `Re-checked ${n} low-confidence transactions` : "Everything's already neatly sorted", <Wand2 size={16} />);
  };

  return (
    <div className="kh-fade">
      <PageHead title="Transactions" sub={`${txns.length} items · tap a category pill to recategorise`}
        action={
          <div className="kh-head-actions">
            {lowConf.length > 0 && (
              <button className="kh-btn ghost sm" onClick={autoSort}><Sparkles size={14} /> Auto-sort {lowConf.length}</button>
            )}
            <button className="kh-btn primary sm" onClick={() => setAdding((v) => !v)}><Plus size={14} /> Add</button>
          </div>
        }
      />

      {adding && <AddRow onAdd={(r) => { addTxns([r], "manual"); setAdding(false); toast("Transaction added", <Plus size={16} />); }} onCancel={() => setAdding(false)} />}

      <div className="kh-filters">
        <div className="kh-search">
          <Search size={15} color={T.muted} />
          <input placeholder="Search merchants…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="kh-select" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option>All</option>
          {CAT_NAMES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="kh-select" value={src} onChange={(e) => setSrc(e.target.value)}>
          <option value="All">All sources</option>
          {Object.entries(SRC).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="kh-card kh-tx-table">
        {filtered.map((t) => <TxRow key={t.id} t={t} onRecat={recategorise} />)}
        {filtered.length === 0 && <div className="kh-empty">No transactions match those filters.</div>}
      </div>
    </div>
  );
}

function TxRow({ t, compact, onRecat }) {
  const [open, setOpen] = useState(false);
  const src = SRC[t.source] || SRC.seed;
  const SrcIc = src.icon;
  const d = new Date(t.date);
  return (
    <div className={"kh-tx" + (compact ? " compact" : "")}>
      <span className="kh-tx-src" style={{ color: src.color }} title={src.label}><SrcIc size={15} /></span>
      <div className="kh-tx-main">
        <div className="kh-tx-merchant">{t.merchant}</div>
        <div className="kh-tx-meta">{d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
      </div>
      {!compact && (
        <div className="kh-tx-cat" onClick={() => onRecat && setOpen((v) => !v)}>
          <CatPill category={t.category} />
          {!t.edited && <Conf value={t.confidence} />}
          {open && onRecat && (
            <div className="kh-cat-menu" onClick={(e) => e.stopPropagation()} onMouseLeave={() => setOpen(false)}>
              {CAT_NAMES.map((c) => (
                <button key={c} className="kh-cat-opt" onClick={(e) => { e.stopPropagation(); onRecat(t.id, c); setOpen(false); }}>
                  <CatPill category={c} small /> {c === t.category && <Check size={13} color={T.green} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {compact && <CatPill category={t.category} small />}
      <div className="kh-tx-amt" style={{ color: t.amount > 0 ? T.green : T.ink }}>
        {t.amount > 0 ? "+" : "−"}{inrAbs(t.amount)}
      </div>
    </div>
  );
}

function AddRow({ onAdd, onCancel }) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [income, setIncome] = useState(false);
  const submit = () => {
    const n = parseFloat(amount);
    if (!merchant.trim() || !n) return;
    onAdd({ merchant: merchant.trim(), amount: income ? Math.abs(n) : -Math.abs(n), date: NOW.toISOString() });
  };
  return (
    <div className="kh-card kh-addrow kh-fade">
      <input className="kh-input" placeholder="Merchant (e.g. Swiggy)" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
      <input className="kh-input" placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ maxWidth: 130 }} />
      <button className={"kh-toggle" + (income ? " on" : "")} onClick={() => setIncome((v) => !v)}>{income ? "Income" : "Expense"}</button>
      <button className="kh-btn primary sm" onClick={submit}>Add</button>
      <button className="kh-btn ghost sm" onClick={onCancel}><X size={14} /></button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  IMPORT & SCAN                                                      */
/* ------------------------------------------------------------------ */
function ImportScan({ gmail, setGmail, stmtDone, setStmtDone, waDone, setWaDone, addTxns, toast, setView }) {
  return (
    <div className="kh-fade">
      <PageHead title="Import & Scan" sub="Bring your spending in from anywhere — Khata sorts it as it arrives." />
      <div className="kh-import-grid">
        <GmailCard gmail={gmail} setGmail={setGmail} addTxns={addTxns} toast={toast} setView={setView} />
        <StatementCard done={stmtDone} setDone={setStmtDone} addTxns={addTxns} toast={toast} setView={setView} />
        <WhatsAppCard done={waDone} setDone={setWaDone} addTxns={addTxns} toast={toast} setView={setView} />
      </div>
    </div>
  );
}

/* ---- Gmail ---- */
const GMAIL_FINDS = [
  { merchant: "Amazon", amount: -1499, label: "Order #408-22 confirmed" },
  { merchant: "Swiggy", amount: -534, label: "Order delivered · receipt" },
  { merchant: "Uber", amount: -276, label: "Your Tuesday evening trip" },
  { merchant: "BookMyShow · PVR", amount: -760, label: "Booking confirmation" },
  { merchant: "Apollo Pharmacy", amount: -430, label: "Invoice attached" },
  { merchant: "Tata Power", amount: -1840, label: "Electricity bill paid" },
];
function GmailCard({ gmail, setGmail, addTxns, toast, setView }) {
  const [oauth, setOauth] = useState(false);
  const [scan, setScan] = useState(0); // 0 idle, 1 scanning
  const [progress, setProgress] = useState(0);
  const [found, setFound] = useState([]);

  const connect = () => setOauth(true);
  const allow = () => {
    setOauth(false);
    setGmail({ connected: true, scanned: false });
    toast("Gmail connected — read-only access to receipts", <Mail size={16} />);
  };

  const startScan = () => {
    setScan(1); setProgress(0); setFound([]);
    let p = 0;
    const tick = setInterval(() => {
      p += Math.random() * 16 + 8;
      if (p >= 100) {
        p = 100; clearInterval(tick);
        const made = addTxns(GMAIL_FINDS.map((f) => ({ merchant: f.merchant, amount: f.amount, date: iso(2026, 6, 5 + Math.floor(Math.random() * 5)) })), "gmail");
        setFound(GMAIL_FINDS.map((f, i) => ({ ...f, cat: made[i].category })));
        setScan(0); setGmail({ connected: true, scanned: true });
        toast(`Found ${GMAIL_FINDS.length} transactions in your inbox`, <Sparkles size={16} />);
      }
      setProgress(Math.min(100, p));
    }, 240);
  };

  const ic = SRC.gmail;
  return (
    <div className="kh-card kh-imp">
      <div className="kh-imp-head">
        <span className="kh-imp-ic" style={{ background: ic.color + "16", color: ic.color }}><Mail size={20} /></span>
        <div>
          <div className="kh-imp-title">Gmail</div>
          <div className="kh-imp-sub">Scan receipt & order emails automatically</div>
        </div>
        {gmail.connected && <span className="kh-badge ok"><ShieldCheck size={12} /> Connected</span>}
      </div>

      {!gmail.connected && (
        <button className="kh-btn primary full" onClick={connect}><Mail size={15} /> Connect Gmail</button>
      )}

      {gmail.connected && scan === 0 && found.length === 0 && (
        <button className="kh-btn primary full" onClick={startScan}><Search size={15} /> Scan transaction emails</button>
      )}

      {scan === 1 && (
        <div className="kh-scan">
          <div className="kh-scan-row"><Loader2 size={15} className="kh-spin" /> Reading inbox… matching receipts</div>
          <div className="kh-bar"><div className="kh-bar-fill" style={{ width: progress + "%" }} /></div>
        </div>
      )}

      {found.length > 0 && (
        <div className="kh-finds kh-fade">
          <div className="kh-finds-head"><Check size={14} color={T.green} /> {found.length} found & auto-sorted</div>
          {found.map((f, i) => (
            <div key={i} className="kh-find" style={{ animationDelay: i * 60 + "ms" }}>
              <div className="kh-find-main">
                <div className="kh-find-merchant">{f.merchant}</div>
                <div className="kh-find-label">{f.label}</div>
              </div>
              <CatPill category={f.cat} small />
              <div className="kh-find-amt">−{inrAbs(f.amount)}</div>
            </div>
          ))}
          <button className="kh-btn ghost sm full" onClick={() => setView("transactions")} style={{ marginTop: 8 }}>Review in Transactions</button>
        </div>
      )}

      {oauth && (
        <div className="kh-modal-bg" onClick={() => setOauth(false)}>
          <div className="kh-oauth" onClick={(e) => e.stopPropagation()}>
            <div className="kh-oauth-bar"><span className="kh-g">G</span> Sign in with Google</div>
            <div className="kh-oauth-body">
              <div className="kh-oauth-title">Khata wants to access your Google Account</div>
              <div className="kh-oauth-acct"><span className="kh-oauth-ava">J</span><div><div style={{fontWeight:600}}>you@gmail.com</div><div className="kh-imp-sub">Personal account</div></div></div>
              <div className="kh-oauth-scope"><Mail size={14} /> Read your email receipts &amp; order confirmations <span className="kh-imp-sub">(read-only)</span></div>
              <div className="kh-oauth-note">This is a prototype — no real account is connected.</div>
              <div className="kh-oauth-actions">
                <button className="kh-btn ghost sm" onClick={() => setOauth(false)}>Cancel</button>
                <button className="kh-btn primary sm" onClick={allow}>Allow access</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Statement upload ---- */
const STMT_ROWS = [
  ["BigBasket", -2860], ["Myntra", -3499], ["Swiggy", -689], ["HPCL Fuel", -2000],
  ["Croma", -8990], ["Zomato", -612], ["Cult.fit Membership", -2500], ["Airtel Broadband", -1199],
];
function StatementCard({ done, setDone, addTxns, toast, setView }) {
  const [phase, setPhase] = useState("idle"); // idle | parsing | done
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);

  const parse = (name) => {
    setFileName(name); setPhase("parsing");
    setTimeout(() => {
      addTxns(STMT_ROWS.map(([merchant, amount], i) => ({ merchant, amount, date: iso(2026, 5, 6 + i * 2) })), "statement");
      setPhase("done"); setDone(true);
      toast(`Parsed ${STMT_ROWS.length} line items from statement`, <FileText size={16} />);
    }, 1900);
  };

  const ic = SRC.statement;
  return (
    <div className="kh-card kh-imp">
      <div className="kh-imp-head">
        <span className="kh-imp-ic" style={{ background: ic.color + "16", color: ic.color }}><FileText size={20} /></span>
        <div>
          <div className="kh-imp-title">Bank & Card Statements</div>
          <div className="kh-imp-sub">Upload a PDF or CSV — we extract every line</div>
        </div>
      </div>

      {phase === "idle" && (
        <>
          <div className="kh-drop" onClick={() => fileRef.current?.click()}>
            <Upload size={22} color={T.muted} />
            <div className="kh-drop-title">Drop a statement or click to browse</div>
            <div className="kh-imp-sub">PDF, CSV or XLS · HDFC, ICICI, Axis, SBI…</div>
            <input ref={fileRef} type="file" hidden onChange={(e) => parse(e.target.files?.[0]?.name || "statement.pdf")} />
          </div>
          <button className="kh-btn ghost sm full" onClick={() => parse("HDFC_CreditCard_May2026.pdf")} style={{ marginTop: 8 }}>
            Use a sample statement
          </button>
        </>
      )}

      {phase === "parsing" && (
        <div className="kh-scan">
          <div className="kh-scan-row"><Loader2 size={15} className="kh-spin" /> Reading {fileName}…</div>
          <div className="kh-parse-lines">
            {STMT_ROWS.slice(0, 4).map((r, i) => (
              <div key={i} className="kh-parse-line" style={{ animationDelay: i * 220 + "ms" }} />
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="kh-finds kh-fade">
          <div className="kh-finds-head"><Check size={14} color={T.green} /> {STMT_ROWS.length} line items imported</div>
          {STMT_ROWS.slice(0, 4).map(([m, a], i) => {
            const { category } = aiCategorise(m, a);
            return (
              <div key={i} className="kh-find" style={{ animationDelay: i * 60 + "ms" }}>
                <div className="kh-find-main"><div className="kh-find-merchant">{m}</div></div>
                <CatPill category={category} small />
                <div className="kh-find-amt">−{inrAbs(a)}</div>
              </div>
            );
          })}
          <div className="kh-imp-sub" style={{ padding: "4px 2px" }}>+{STMT_ROWS.length - 4} more added</div>
          <button className="kh-btn ghost sm full" onClick={() => setView("reports")}>See updated report</button>
        </div>
      )}
    </div>
  );
}

/* ---- WhatsApp invoice ---- */
const WA_SAMPLE = `Indri Cafe & Roastery
GST Invoice
Date: 09 Jun 2026
2x Flat White        ₹460
1x Banana Bread      ₹220
CGST + SGST          ₹49
-----------------------------
Total                ₹729
Paid via UPI`;
function WhatsAppCard({ done, setDone, addTxns, toast, setView }) {
  const [text, setText] = useState(WA_SAMPLE);
  const [phase, setPhase] = useState("idle");
  const [parsed, setParsed] = useState(null);

  const parse = () => {
    setPhase("parsing");
    setTimeout(() => {
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const merchant = lines[0] || "WhatsApp invoice";
      // total: prefer a line containing "total", else max ₹ amount
      const nums = [];
      lines.forEach((l) => {
        const m = l.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)/i);
        if (m) nums.push({ v: parseFloat(m[1].replace(/,/g, "")), total: /total|amount due|grand/i.test(l) });
      });
      let amt = 0;
      const totalLine = nums.find((n) => n.total);
      amt = totalLine ? totalLine.v : Math.max(0, ...nums.map((n) => n.v));
      const dm = text.match(/(\d{1,2})\s*([A-Za-z]{3,9})\s*(\d{4})/);
      const result = { merchant, amount: -amt, ...aiCategorise(merchant, -amt), dateStr: dm ? dm[0] : "today" };
      setParsed(result);
      setPhase("done");
    }, 1400);
  };

  const save = () => {
    addTxns([{ merchant: parsed.merchant, amount: parsed.amount, date: iso(2026, 6, 9) }], "whatsapp");
    setDone(true);
    toast("Invoice saved & categorised", <MessageCircle size={16} />);
    setPhase("idle");
  };

  const ic = SRC.whatsapp;
  return (
    <div className="kh-card kh-imp">
      <div className="kh-imp-head">
        <span className="kh-imp-ic" style={{ background: ic.color + "16", color: ic.color }}><MessageCircle size={20} /></span>
        <div>
          <div className="kh-imp-title">WhatsApp Invoices</div>
          <div className="kh-imp-sub">Forward a bill — we read the total & merchant</div>
        </div>
      </div>

      {phase !== "done" && (
        <>
          <textarea className="kh-textarea" value={text} onChange={(e) => setText(e.target.value)} rows={7} spellCheck={false} />
          <button className="kh-btn primary full" onClick={parse} disabled={phase === "parsing"} style={{ marginTop: 8 }}>
            {phase === "parsing" ? <><Loader2 size={15} className="kh-spin" /> Reading invoice…</> : <><Sparkles size={15} /> Parse invoice</>}
          </button>
        </>
      )}

      {phase === "done" && parsed && (
        <div className="kh-fade">
          <div className="kh-wa-result">
            <div className="kh-wa-field"><span>Merchant</span><b>{parsed.merchant}</b></div>
            <div className="kh-wa-field"><span>Amount</span><b>{inrAbs(parsed.amount)}</b></div>
            <div className="kh-wa-field"><span>Date</span><b>{parsed.dateStr}</b></div>
            <div className="kh-wa-field"><span>Category</span><CatPill category={parsed.category} small /></div>
          </div>
          <div className="kh-row-gap" style={{ marginTop: 10 }}>
            <button className="kh-btn ghost sm" onClick={() => setPhase("idle")}>Edit</button>
            <button className="kh-btn primary sm" onClick={save}><Check size={14} /> Save transaction</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  REPORTS                                                            */
/* ------------------------------------------------------------------ */
function Reports({ txns }) {
  const months = useMemo(() => {
    const set = new Map();
    txns.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!set.has(key)) set.set(key, { key, y: d.getFullYear(), m: d.getMonth(), label: `${monthName(d)} ${d.getFullYear()}` });
    });
    return [...set.values()].sort((a, b) => new Date(b.y, b.m) - new Date(a.y, a.m));
  }, [txns]);

  const [sel, setSel] = useState(`${NOW.getFullYear()}-${NOW.getMonth()}`);
  const cur = months.find((x) => x.key === sel) || months[0];

  const monthTxns = (y, m) => txns.filter((t) => { const d = new Date(t.date); return d.getFullYear() === y && d.getMonth() === m; });
  const sumSpend = (arr) => arr.filter((t) => t.amount < 0).reduce((s, t) => s + -t.amount, 0);

  const data = useMemo(() => {
    const tx = monthTxns(cur.y, cur.m);
    const byCat = {}; tx.forEach((t) => { if (t.amount < 0) byCat[t.category] = (byCat[t.category] || 0) + -t.amount; });
    const cats = Object.entries(byCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const totalSpend = sumSpend(tx);
    const income = tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);

    // daily spend
    const dim = daysInMonth(cur.y, cur.m);
    const daily = Array.from({ length: dim }, (_, i) => ({ day: i + 1, amt: 0 }));
    tx.forEach((t) => { if (t.amount < 0) daily[new Date(t.date).getDate() - 1].amt += -t.amount; });

    // top merchants
    const byMerch = {}; tx.forEach((t) => { if (t.amount < 0) byMerch[t.merchant] = (byMerch[t.merchant] || 0) + -t.amount; });
    const merchants = Object.entries(byMerch).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

    // prev month
    const prevD = new Date(cur.y, cur.m - 1);
    const prevSpend = sumSpend(monthTxns(prevD.getFullYear(), prevD.getMonth()));
    const delta = prevSpend ? Math.round(((totalSpend - prevSpend) / prevSpend) * 100) : 0;

    return { cats, totalSpend, income, daily, merchants, prevSpend, delta, prevLabel: `${monthName(prevD)}` };
  }, [cur, txns]);

  return (
    <div className="kh-fade">
      <PageHead title="Monthly report" sub="A clear picture of every rupee, sorted for you."
        action={
          <select className="kh-select" value={sel} onChange={(e) => setSel(e.target.value)}>
            {months.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        }
      />

      <div className="kh-grid-3">
        <StatCard label="Total spend" value={inr(data.totalSpend)} accent={T.coral}
          trend={data.delta > 0 ? "down" : "up"}
          sub={data.prevSpend ? `${data.delta > 0 ? "+" : ""}${data.delta}% vs ${data.prevLabel}` : "first tracked month"} />
        <StatCard label="Income" value={inr(data.income)} accent={T.green} />
        <StatCard label="Net" value={inr(data.income - data.totalSpend)} accent={T.ink}
          trend={data.income - data.totalSpend >= 0 ? "up" : "down"} sub="saved this month" />
      </div>

      <div className="kh-grid-2">
        <div className="kh-card">
          <CardHead title="Spend by category" />
          <div className="kh-catbars">
            {data.cats.map((c) => {
              const col = (CATS[c.name] || CATS.Other).color;
              const pct = Math.round((c.value / data.totalSpend) * 100);
              return (
                <div key={c.name} className="kh-catbar">
                  <div className="kh-catbar-top">
                    <CatPill category={c.name} small />
                    <span className="kh-catbar-val">{inr(c.value)} <span className="kh-imp-sub">· {pct}%</span></span>
                  </div>
                  <div className="kh-track"><div className="kh-track-fill" style={{ width: pct + "%", background: col }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="kh-card">
          <CardHead title="Daily spending" />
          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={data.daily} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.muted }} tickLine={false} axisLine={{ stroke: T.line }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: T.muted }} tickLine={false} axisLine={false} width={50}
                  tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip formatter={(v) => inr(v)} labelFormatter={(l) => `${monthName(new Date(cur.y, cur.m))} ${l}`}
                  contentStyle={{ borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 12 }} />
                <Bar dataKey="amt" fill={T.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="kh-card">
        <CardHead title="Top merchants" hint={cur.label} />
        <div className="kh-merch-grid">
          {data.merchants.map((m, i) => (
            <div key={m.name} className="kh-merch">
              <span className="kh-merch-rank">{i + 1}</span>
              <span className="kh-merch-name">{m.name}</span>
              <span className="kh-merch-val">{inr(m.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FORECAST                                                           */
/* ------------------------------------------------------------------ */
function Forecast({ txns, balance }) {
  const [horizon, setHorizon] = useState(60);

  const model = useMemo(() => {
    // Detect recurring items: merchants appearing in >=2 months with similar amount.
    const groups = {};
    txns.forEach((t) => {
      const d = new Date(t.date);
      const k = t.merchant;
      groups[k] = groups[k] || { merchant: k, months: new Set(), amts: [], category: t.category };
      groups[k].months.add(`${d.getFullYear()}-${d.getMonth()}`);
      groups[k].amts.push(t.amount);
    });
    const recurring = Object.values(groups)
      .filter((g) => g.months.size >= 2)
      .map((g) => ({ merchant: g.merchant, category: g.category, amount: Math.round(g.amts.reduce((s, a) => s + a, 0) / g.amts.length) }))
      .sort((a, b) => a.amount - b.amount);

    // Average daily discretionary burn (this month so far).
    const m = txns.filter((t) => sameMonth(new Date(t.date), NOW));
    let disc = 0;
    m.forEach((t) => { if (t.amount < 0 && t.category !== "Investments") disc += -t.amount; });
    const dailyBurn = Math.round(disc / NOW.getDate());

    // Build forward daily balance for the horizon.
    const recurExpense = recurring.filter((r) => r.amount < 0);
    const recurIncome = recurring.filter((r) => r.amount > 0);
    const data = [];
    let run = balance;
    const start = new Date(NOW);
    for (let i = 0; i <= horizon; i++) {
      const day = new Date(start); day.setDate(start.getDate() + i);
      if (i > 0) {
        run -= dailyBurn;
        if (day.getDate() === 1) { // salary
          recurIncome.forEach((r) => (run += r.amount));
          recurExpense.forEach((r) => (run += r.amount)); // rent/sip/bills cluster early month
        }
      }
      if (i % 3 === 0 || i === horizon) data.push({ day: i, date: day, balance: Math.round(run) });
    }
    const end = data[data.length - 1].balance;
    const lowest = Math.min(...data.map((d) => d.balance));
    const dim = daysInMonth(NOW.getFullYear(), NOW.getMonth());
    const daysLeft = dim - NOW.getDate();
    const monthEnd = balance - dailyBurn * daysLeft;
    const safeDaily = daysLeft > 0 ? Math.max(0, Math.round((balance - 40000) / daysLeft)) : 0;
    return { recurring, recurExpense, recurIncome, dailyBurn, data, end, lowest, monthEnd, safeDaily };
  }, [txns, balance, horizon]);

  return (
    <div className="kh-fade">
      <PageHead title="Cash-flow forecast" sub="Where your balance is heading, based on your habits & recurring bills."
        action={
          <div className="kh-seg">
            {[30, 60, 90].map((h) => (
              <button key={h} className={"kh-seg-btn" + (horizon === h ? " on" : "")} onClick={() => setHorizon(h)}>{h}d</button>
            ))}
          </div>
        }
      />

      <div className="kh-grid-4">
        <StatCard label="Balance today" value={inr(balance)} accent={T.ink} />
        <StatCard label="Projected month-end" value={inr(model.monthEnd)} accent={T.green} sub={`${monthName(NOW)} ${daysInMonth(NOW.getFullYear(), NOW.getMonth())}`} />
        <StatCard label={`In ${horizon} days`} value={inr(model.end)} accent={model.end >= balance ? T.green : T.coral} trend={model.end >= balance ? "up" : "down"} sub="if habits hold" />
        <StatCard label="Safe to spend / day" value={inr(model.safeDaily)} accent="#2E9E84" sub="keeps a ₹40k buffer" />
      </div>

      <div className="kh-card">
        <CardHead title={`Projected balance · next ${horizon} days`} hint={`Avg daily burn ${inr(model.dailyBurn)}`} />
        <div style={{ height: 250 }}>
          <ResponsiveContainer>
            <LineChart data={model.data} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.green} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={T.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: T.muted }} tickLine={false} axisLine={{ stroke: T.line }}
                tickFormatter={(v) => (v === 0 ? "now" : "+" + v + "d")} />
              <YAxis tick={{ fontSize: 11, fill: T.muted }} tickLine={false} axisLine={false} width={64}
                tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} />
              <Tooltip formatter={(v) => [inr(v), "Balance"]}
                labelFormatter={(l) => (l === 0 ? "Today" : `In ${l} days`)}
                contentStyle={{ borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 12 }} />
              <ReferenceLine y={40000} stroke={T.amber} strokeDasharray="4 4" label={{ value: "₹40k buffer", fontSize: 10, fill: T.amber, position: "insideTopRight" }} />
              <Line type="monotone" dataKey="balance" stroke={T.green} strokeWidth={2.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="kh-grid-2">
        <div className="kh-card">
          <CardHead title="Recurring outflows" hint="Detected automatically" />
          <div className="kh-tx-list">
            {model.recurExpense.map((r) => (
              <div key={r.merchant} className="kh-tx compact">
                <span className="kh-tx-src" style={{ color: (CATS[r.category] || CATS.Other).color }}><Repeat size={14} /></span>
                <div className="kh-tx-main"><div className="kh-tx-merchant">{r.merchant}</div></div>
                <CatPill category={r.category} small />
                <div className="kh-tx-amt">−{inrAbs(r.amount)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="kh-card kh-fc-note">
          <CardHead title="What this means" />
          <p className="kh-prose">
            With your salary of {inr(model.recurIncome.reduce((s, r) => s + r.amount, 0))} and recurring
            bills of {inrAbs(model.recurExpense.reduce((s, r) => s + r.amount, 0))} a month, your balance
            should reach <b style={{ color: model.end >= balance ? T.green : T.coral }}>{inr(model.end)}</b> in {horizon} days.
          </p>
          <p className="kh-prose">
            The dip you'll see early each month is rent and SIP debiting together. Your lowest projected
            point is <b>{inr(model.lowest)}</b> — comfortably above the buffer, so no cash crunch ahead.
          </p>
          <div className="kh-callout">
            <Sparkles size={15} color={T.green} />
            Spending up to <b>{inr(model.safeDaily)}/day</b> keeps you on track this month.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SHARED LAYOUT BITS                                                 */
/* ------------------------------------------------------------------ */
function PageHead({ title, sub, action }) {
  return (
    <div className="kh-pagehead">
      <div>
        <h1 className="kh-h1">{title}</h1>
        {sub && <div className="kh-sub">{sub}</div>}
      </div>
      {action}
    </div>
  );
}
function CardHead({ title, hint, action }) {
  return (
    <div className="kh-cardhead">
      <div>
        <div className="kh-cardtitle">{title}</div>
        {hint && <div className="kh-cardhint">{hint}</div>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CSS                                                                */
/* ------------------------------------------------------------------ */
const CSS = `
.kh-root{--paper:${T.paper};--card:${T.card};--ink:${T.ink};--ink2:${T.ink2};--muted:${T.muted};--line:${T.line};--green:${T.green};
  display:flex;min-height:100vh;background:var(--paper);color:var(--ink);
  font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.45;-webkit-font-smoothing:antialiased;}
.kh-root *{box-sizing:border-box;}
@media (prefers-reduced-motion: reduce){.kh-root *{animation:none!important;transition:none!important;}}

/* sidebar */
.kh-side{width:248px;flex-shrink:0;background:${T.paper2};border-right:1px solid var(--line);
  padding:22px 16px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;}
.kh-brand{display:flex;gap:11px;align-items:center;padding:0 6px 22px;}
.kh-logo{width:36px;height:36px;border-radius:11px;background:var(--green);color:#fff;display:grid;place-items:center;
  box-shadow:0 4px 12px ${T.green}40;}
.kh-brand-name{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:19px;letter-spacing:-.01em;}
.kh-brand-tag{font-size:11px;color:var(--muted);margin-top:-2px;}
.kh-nav{display:flex;flex-direction:column;gap:3px;}
.kh-nav-item{display:flex;align-items:center;gap:11px;padding:10px 12px;border:none;background:none;color:var(--ink2);
  font:inherit;font-weight:500;border-radius:11px;cursor:pointer;text-align:left;width:100%;transition:.15s;}
.kh-nav-item:hover{background:#fff;color:var(--ink);}
.kh-nav-item.active{background:#fff;color:var(--green);font-weight:600;box-shadow:0 2px 8px rgba(27,42,36,.05);}
.kh-nav-chev{margin-left:auto;}
.kh-side-foot{margin-top:auto;}
.kh-bal-card{background:var(--green);color:#fff;border-radius:14px;padding:14px 15px;margin:0 2px;
  box-shadow:0 8px 20px ${T.green}33;}
.kh-bal-label{display:flex;align-items:center;gap:6px;font-size:11.5px;opacity:.85;}
.kh-bal-value{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:23px;margin-top:3px;letter-spacing:-.01em;}

/* main */
.kh-main{flex:1;min-width:0;display:flex;flex-direction:column;}
.kh-content{padding:22px 30px 60px;max-width:1180px;width:100%;}
.kh-fade{animation:fadeUp .4s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}

/* assistant bar */
.kh-assistant{display:flex;gap:13px;align-items:center;padding:14px 30px;background:linear-gradient(180deg,#fff,${T.paper});
  border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5;}
.kh-assistant-avatar{width:38px;height:38px;border-radius:12px;flex-shrink:0;display:grid;place-items:center;
  background:${T.greenSoft};color:var(--green);}
.kh-assistant-body{flex:1;min-width:0;}
.kh-assistant-name{font-size:12px;font-weight:700;color:var(--green);display:flex;align-items:center;gap:7px;}
.kh-assistant-text{font-size:13px;color:var(--ink2);}
.kh-dot-live{width:7px;height:7px;border-radius:50%;background:${T.greenBright};box-shadow:0 0 0 0 ${T.greenBright};
  animation:pulse 2s infinite;}
@keyframes pulse{0%{box-shadow:0 0 0 0 ${T.greenBright}66;}70%{box-shadow:0 0 0 6px ${T.greenBright}00;}100%{box-shadow:0 0 0 0 ${T.greenBright}00;}}

/* page head */
.kh-pagehead{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:20px;flex-wrap:wrap;}
.kh-h1{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:27px;margin:0;letter-spacing:-.02em;}
.kh-sub{color:var(--muted);font-size:13.5px;margin-top:3px;}
.kh-head-actions{display:flex;gap:8px;}

/* cards & grids */
.kh-card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;
  box-shadow:0 1px 2px rgba(27,42,36,.03);}
.kh-cardhead{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;}
.kh-cardtitle{font-family:'Bricolage Grotesque',sans-serif;font-weight:600;font-size:15px;letter-spacing:-.01em;}
.kh-cardhint{font-size:11.5px;color:var(--muted);margin-top:1px;}
.kh-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
.kh-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px;}
.kh-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}
.kh-grid-river{display:grid;grid-template-columns:1.7fr 1fr;gap:14px;margin-bottom:16px;}
.kh-grid-bottom{display:grid;grid-template-columns:1.5fr 1fr;gap:14px;}

/* stat */
.kh-stat-label{font-size:12px;color:var(--muted);font-weight:500;}
.kh-stat-value{font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:25px;letter-spacing:-.02em;margin-top:3px;}
.kh-stat-sub{font-size:11.5px;margin-top:4px;display:flex;align-items:center;gap:3px;}

/* buttons */
.kh-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:none;border-radius:11px;
  font:inherit;font-weight:600;cursor:pointer;padding:11px 16px;transition:.15s;}
.kh-btn.sm{padding:8px 13px;font-size:13px;border-radius:9px;}
.kh-btn.full{width:100%;}
.kh-btn.primary{background:var(--green);color:#fff;box-shadow:0 4px 12px ${T.green}33;}
.kh-btn.primary:hover{background:${T.greenBright};}
.kh-btn.primary:disabled{opacity:.6;cursor:default;}
.kh-btn.ghost{background:${T.paper2};color:var(--ink2);}
.kh-btn.ghost:hover{background:${T.greenSoft};color:var(--green);}
.kh-link{background:none;border:none;color:var(--green);font:inherit;font-weight:600;font-size:13px;cursor:pointer;}
.kh-link:hover{text-decoration:underline;}

/* pills */
.kh-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-weight:600;line-height:1.4;white-space:nowrap;}
.kh-conf{display:inline-flex;align-items:center;gap:3px;font-size:10.5px;font-weight:600;border:1px solid;border-radius:20px;padding:2px 6px;}
.kh-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:var(--muted);background:${T.paper2};padding:4px 9px;border-radius:20px;}
.kh-badge.ok{color:var(--green);background:${T.greenSoft};}

/* transactions */
.kh-tx-list{display:flex;flex-direction:column;}
.kh-tx-table{padding:6px 8px;}
.kh-tx{display:flex;align-items:center;gap:12px;padding:11px 10px;border-radius:11px;transition:.12s;position:relative;}
.kh-tx:hover{background:${T.paper2};}
.kh-tx.compact{padding:9px 6px;}
.kh-tx-src{flex-shrink:0;width:26px;display:grid;place-items:center;}
.kh-tx-main{flex:1;min-width:0;}
.kh-tx-merchant{font-weight:600;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kh-tx-meta{font-size:11.5px;color:var(--muted);}
.kh-tx-cat{display:flex;align-items:center;gap:7px;cursor:pointer;position:relative;}
.kh-tx-amt{font-weight:700;font-size:14px;font-variant-numeric:tabular-nums;min-width:84px;text-align:right;}
.kh-cat-menu{position:absolute;top:28px;right:0;z-index:20;background:#fff;border:1px solid var(--line);border-radius:12px;
  padding:6px;box-shadow:0 12px 30px rgba(27,42,36,.16);width:210px;max-height:280px;overflow:auto;}
.kh-cat-opt{display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;border:none;background:none;
  padding:6px;border-radius:8px;cursor:pointer;font:inherit;}
.kh-cat-opt:hover{background:${T.paper2};}
.kh-empty{padding:30px;text-align:center;color:var(--muted);}

/* filters */
.kh-filters{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
.kh-search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:11px;padding:0 12px;flex:1;min-width:200px;}
.kh-search input{border:none;outline:none;background:none;font:inherit;padding:10px 0;flex:1;color:var(--ink);}
.kh-select{border:1px solid var(--line);background:#fff;border-radius:11px;padding:10px 12px;font:inherit;color:var(--ink);cursor:pointer;}
.kh-addrow{display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap;}
.kh-input{border:1px solid var(--line);border-radius:10px;padding:9px 12px;font:inherit;outline:none;flex:1;min-width:140px;}
.kh-input:focus{border-color:var(--green);}
.kh-toggle{border:1px solid var(--line);background:#fff;border-radius:10px;padding:9px 14px;font:inherit;font-weight:600;cursor:pointer;color:${T.coral};}
.kh-toggle.on{color:var(--green);border-color:${T.green};background:${T.greenSoft};}

/* legend */
.kh-legend{margin-top:8px;display:flex;flex-direction:column;gap:7px;}
.kh-legend-row{display:flex;align-items:center;gap:8px;font-size:12.5px;}
.kh-legend-dot{width:9px;height:9px;border-radius:3px;flex-shrink:0;}
.kh-legend-name{flex:1;color:var(--ink2);}
.kh-legend-val{font-weight:600;font-variant-numeric:tabular-nums;}

/* connections */
.kh-conn-list{display:flex;flex-direction:column;gap:8px;}
.kh-conn-row{display:flex;align-items:center;gap:11px;border:1px solid var(--line);background:#fff;border-radius:12px;
  padding:11px 13px;cursor:pointer;font:inherit;transition:.12s;}
.kh-conn-row:hover{border-color:${T.green}66;background:${T.paper};}
.kh-conn-ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;}
.kh-conn-name{flex:1;font-weight:600;text-align:left;}

/* import */
.kh-import-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:start;}
.kh-imp{display:flex;flex-direction:column;}
.kh-imp-head{display:flex;align-items:center;gap:11px;margin-bottom:14px;}
.kh-imp-ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;}
.kh-imp-title{font-family:'Bricolage Grotesque',sans-serif;font-weight:600;font-size:15px;}
.kh-imp-sub{font-size:11.5px;color:var(--muted);}
.kh-imp-head .kh-badge{margin-left:auto;align-self:flex-start;}

.kh-drop{border:1.5px dashed ${T.line};border-radius:13px;padding:26px 14px;text-align:center;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;gap:6px;transition:.15s;}
.kh-drop:hover{border-color:var(--green);background:${T.greenSoft}66;}
.kh-drop-title{font-weight:600;font-size:13px;}

.kh-scan{padding:6px 0;}
.kh-scan-row{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink2);margin-bottom:10px;}
.kh-bar{height:8px;background:${T.paper2};border-radius:20px;overflow:hidden;}
.kh-bar-fill{height:100%;background:linear-gradient(90deg,${T.green},${T.greenBright});border-radius:20px;transition:width .24s ease;}
.kh-spin{animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.kh-parse-lines{display:flex;flex-direction:column;gap:9px;margin-top:6px;}
.kh-parse-line{height:13px;border-radius:6px;background:linear-gradient(90deg,${T.paper2} 25%,#fff 50%,${T.paper2} 75%);
  background-size:200% 100%;animation:shimmer 1.2s infinite;}
@keyframes shimmer{from{background-position:200% 0;}to{background-position:-200% 0;}}

.kh-finds{display:flex;flex-direction:column;gap:2px;}
.kh-finds-head{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--green);margin-bottom:6px;}
.kh-find{display:flex;align-items:center;gap:9px;padding:8px 6px;border-radius:9px;animation:fadeUp .4s ease both;}
.kh-find:hover{background:${T.paper2};}
.kh-find-main{flex:1;min-width:0;}
.kh-find-merchant{font-weight:600;font-size:13px;}
.kh-find-label{font-size:11px;color:var(--muted);}
.kh-find-amt{font-weight:700;font-size:13px;font-variant-numeric:tabular-nums;}

/* oauth modal */
.kh-modal-bg{position:fixed;inset:0;background:rgba(27,42,36,.4);backdrop-filter:blur(3px);display:grid;place-items:center;z-index:50;animation:fadeUp .2s;}
.kh-oauth{background:#fff;width:360px;max-width:92vw;border-radius:16px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.3);}
.kh-oauth-bar{padding:14px 18px;border-bottom:1px solid var(--line);font-weight:600;font-size:13px;display:flex;align-items:center;gap:9px;color:var(--ink2);}
.kh-g{font-family:'Bricolage Grotesque';font-weight:700;color:#4285F4;font-size:16px;}
.kh-oauth-body{padding:18px;}
.kh-oauth-title{font-size:15px;font-weight:600;margin-bottom:14px;}
.kh-oauth-acct{display:flex;align-items:center;gap:11px;padding:11px;border:1px solid var(--line);border-radius:11px;margin-bottom:14px;}
.kh-oauth-ava{width:34px;height:34px;border-radius:50%;background:${T.coral};color:#fff;display:grid;place-items:center;font-weight:700;}
.kh-oauth-scope{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--ink2);background:${T.paper2};padding:11px;border-radius:10px;}
.kh-oauth-note{font-size:11px;color:var(--muted);margin:12px 0;font-style:italic;}
.kh-oauth-actions{display:flex;justify-content:flex-end;gap:8px;}

/* whatsapp */
.kh-textarea{width:100%;border:1px solid var(--line);border-radius:12px;padding:12px;font-family:'Inter',monospace;font-size:12.5px;
  line-height:1.5;resize:vertical;outline:none;color:var(--ink2);background:${T.paper};}
.kh-textarea:focus{border-color:var(--green);}
.kh-wa-result{background:${T.greenSoft}88;border-radius:12px;padding:6px 14px;}
.kh-wa-field{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid ${T.green}1A;}
.kh-wa-field:last-child{border-bottom:none;}
.kh-wa-field span{font-size:12px;color:var(--ink2);}
.kh-row-gap{display:flex;gap:8px;justify-content:flex-end;}

/* report bits */
.kh-catbars{display:flex;flex-direction:column;gap:13px;}
.kh-catbar-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
.kh-catbar-val{font-size:12.5px;font-weight:600;font-variant-numeric:tabular-nums;}
.kh-track{height:8px;background:${T.paper2};border-radius:20px;overflow:hidden;}
.kh-track-fill{height:100%;border-radius:20px;transition:width .5s ease;}
.kh-merch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.kh-merch{display:flex;align-items:center;gap:9px;padding:11px 13px;background:${T.paper};border-radius:11px;}
.kh-merch-rank{width:22px;height:22px;border-radius:7px;background:${T.greenSoft};color:var(--green);font-weight:700;font-size:12px;display:grid;place-items:center;flex-shrink:0;}
.kh-merch-name{flex:1;font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kh-merch-val{font-weight:700;font-size:13px;font-variant-numeric:tabular-nums;}

/* forecast */
.kh-seg{display:inline-flex;background:${T.paper2};border-radius:11px;padding:3px;}
.kh-seg-btn{border:none;background:none;font:inherit;font-weight:600;font-size:13px;padding:7px 14px;border-radius:8px;cursor:pointer;color:var(--ink2);}
.kh-seg-btn.on{background:#fff;color:var(--green);box-shadow:0 2px 6px rgba(27,42,36,.08);}
.kh-prose{font-size:13px;color:var(--ink2);line-height:1.6;margin:0 0 12px;}
.kh-callout{display:flex;align-items:center;gap:9px;background:${T.greenSoft};border-radius:12px;padding:13px 15px;font-size:13px;color:var(--ink2);}

/* tooltip */
.kh-tip{background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 12px;box-shadow:0 6px 16px rgba(27,42,36,.12);}
.kh-tip-label{font-size:11px;color:var(--muted);}
.kh-tip-val{font-weight:700;font-size:14px;}

/* toasts */
.kh-toasts{position:fixed;bottom:24px;right:24px;z-index:80;display:flex;flex-direction:column;gap:9px;}
.kh-toast{display:flex;align-items:center;gap:9px;background:var(--ink);color:#fff;padding:12px 16px;border-radius:12px;
  font-size:13px;font-weight:500;box-shadow:0 12px 30px rgba(27,42,36,.3);animation:toastIn .3s ease;}
.kh-toast-ic{display:grid;place-items:center;color:${T.greenBright};}
@keyframes toastIn{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:none;}}

/* responsive */
@media(max-width:980px){
  .kh-grid-4{grid-template-columns:repeat(2,1fr);}
  .kh-grid-river,.kh-grid-bottom,.kh-grid-2,.kh-grid-3,.kh-import-grid{grid-template-columns:1fr;}
  .kh-merch-grid{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:760px){
  .kh-side{position:fixed;bottom:0;top:auto;left:0;right:0;width:100%;height:auto;flex-direction:row;
    padding:8px;border-right:none;border-top:1px solid var(--line);z-index:40;overflow-x:auto;}
  .kh-brand,.kh-side-foot{display:none;}
  .kh-nav{flex-direction:row;width:100%;justify-content:space-around;}
  .kh-nav-item span{display:none;}
  .kh-nav-chev{display:none;}
  .kh-nav-item{flex-direction:column;padding:8px;flex:1;}
  .kh-main{padding-bottom:70px;}
  .kh-content{padding:16px;}
  .kh-assistant{padding:12px 16px;}
  .kh-grid-4{grid-template-columns:1fr;}
  .kh-merch-grid{grid-template-columns:1fr;}
  .kh-h1{font-size:23px;}
}
`;
