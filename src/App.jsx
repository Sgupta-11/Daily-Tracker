import { useState, useEffect } from "react";

const STORAGE_KEY = "daily-checkin-log-v3";
const CALORIE_TARGET = 1950;
const START_WEIGHT = 105;
const GOAL_WEIGHT = 80;

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FUNKY_LINES = [
  { pct: 0,   text: "Day one. The watch is waiting. 👀" },
  { pct: 5,   text: "5% in. Your body remembers this." },
  { pct: 10,  text: "10% closer. The mirror is starting to notice." },
  { pct: 15,  text: "15% there. Old you would've quit by now." },
  { pct: 20,  text: "20% done. You're not the same person who started." },
  { pct: 25,  text: "Quarter way. The watch is getting nervous. ⌚" },
  { pct: 30,  text: "30% in. People are going to start asking questions." },
  { pct: 35,  text: "35% there. Dream physique loading... ▓▓▓░░░░░" },
  { pct: 40,  text: "40% done. Clothes are fitting different, aren't they." },
  { pct: 45,  text: "45% in. Almost halfway to that watch. Keep going." },
  { pct: 50,  text: "Halfway. The version of you that gave up doesn't exist anymore. 🔥" },
  { pct: 55,  text: "55% there. You're genuinely built different now." },
  { pct: 60,  text: "60% done. That watch is close enough to smell. ⌚" },
  { pct: 65,  text: "65% in. The hard part is behind you." },
  { pct: 70,  text: "70% there. Dream physique loading... ▓▓▓▓▓▓▓░░░" },
  { pct: 75,  text: "75% done. Three quarters. The watch is basically yours." },
  { pct: 80,  text: "80% in. You look different. You move different. You ARE different." },
  { pct: 85,  text: "85% there. Final stretch. Don't you dare stop now." },
  { pct: 90,  text: "90% done. The watch is on the table. Reach out and take it. ⌚🔥" },
  { pct: 95,  text: "95%. You absolute unit. One last push." },
  { pct: 100, text: "100%. Go buy the watch. You earned every second of it. ⌚👑" },
];

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getWeekKeys() {
  const keys = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().split("T")[0]);
  }
  return keys;
}

function YesNo({ value, onYes, onNo }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button onClick={onYes} style={{
        width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer",
        background: value === true ? "#4ade80" : "#1a1a1a",
        color: value === true ? "#000" : "#444",
        fontSize: 15, fontWeight: 700, transition: "all 0.15s",
      }}>✓</button>
      <button onClick={onNo} style={{
        width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer",
        background: value === false ? "#f87171" : "#1a1a1a",
        color: value === false ? "#000" : "#444",
        fontSize: 15, fontWeight: 700, transition: "all 0.15s",
      }}>✗</button>
    </div>
  );
}

function getFunkyLine(pct) {
  const clamped = Math.min(100, Math.max(0, pct));
  let best = FUNKY_LINES[0];
  for (const line of FUNKY_LINES) {
    if (clamped >= line.pct) best = line;
  }
  return best.text;
}

export default function App() {
  const [log, setLog] = useState({});
  const [slip, setSlip] = useState("");
  const [plan, setPlan] = useState("");
  const [calories, setCalories] = useState("");
  const [weight, setWeight] = useState("");
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState("today");

  const todayKey = getTodayKey();
  const today = log[todayKey] || {};

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLog(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    const d = log[todayKey] || {};
    setSlip(d.slip || "");
    setPlan(d.plan || "");
    setCalories(d.calories || "");
    setWeight(d.weight || "");
  }, [todayKey]);

  function save(data) {
    const updated = { ...log, [todayKey]: { ...(log[todayKey] || {}), ...data } };
    setLog(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  }

  function handleSave() {
    save({ slip, plan, calories, weight });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Weight progress
  const allWeights = Object.entries(log)
    .filter(([, d]) => d.weight)
    .map(([, d]) => parseFloat(d.weight))
    .filter(w => !isNaN(w));
  const latestWeight = weight ? parseFloat(weight) : (allWeights.length > 0 ? allWeights[allWeights.length - 1] : START_WEIGHT);
  const totalToLose = START_WEIGHT - GOAL_WEIGHT;
  const lost = Math.max(0, START_WEIGHT - latestWeight);
  const progressPct = Math.min(100, Math.round((lost / totalToLose) * 100));
  const progressColor = progressPct >= 75 ? "#4ade80" : progressPct >= 40 ? "#facc15" : "#60a5fa";

  // Calories
  const cal = parseInt(calories) || null;
  const calColor = cal === null ? "#888" : cal <= CALORIE_TARGET ? "#4ade80" : cal <= CALORIE_TARGET + 300 ? "#facc15" : "#f87171";
  const calUnder = cal !== null ? cal <= CALORIE_TARGET : today.calUnder;

  function dayScore(d) {
    const c = parseInt(d.calories);
    const calVal = c ? c <= CALORIE_TARGET : d.calUnder;
    const vals = [d.gym, d.steps, d.protein, d.sleep, calVal];
    const answered = vals.filter(v => v !== undefined && v !== null);
    if (answered.length === 0) return null;
    return vals.filter(v => v === true).length / 5;
  }

  const weekKeys = getWeekKeys();
  const weekData = weekKeys.map(k => log[k] || {});
  const scores = weekData.map(dayScore);
  const recentScores = scores.slice(-2).filter(s => s !== null);
  const spiralWarning = recentScores.length === 2 && recentScores.every(s => s < 0.5);

  const streak = (() => {
    let count = 0;
    for (let i = scores.length - 2; i >= 0; i--) {
      if (scores[i] !== null && scores[i] >= 0.5) count++;
      else if (scores[i] !== null) break;
    }
    return count;
  })();

  const checks = [
    { id: "gym", emoji: "🏋️", label: "Gym", sub: "Showed up = counts" },
    { id: "steps", emoji: "👟", label: "10k Steps", sub: "Daily step goal" },
    { id: "protein", emoji: "🥩", label: "Protein", sub: "~150g target" },
    { id: "sleep", emoji: "😴", label: "Sleep supps", sub: "Mag + Ashwagandha" },
  ];

  const todayChecked = checks.filter(c => today[c.id] === true).length + (calUnder === true ? 1 : 0);

  function getStatus() {
    const score = todayChecked / 5;
    if (todayChecked === 0) return { text: "Log your day", color: "#555" };
    if (score >= 0.8) return { text: "Strong day 💪", color: "#4ade80" };
    if (score >= 0.5) return { text: "Decent day", color: "#facc15" };
    return { text: "Rough day — that's okay", color: "#f87171" };
  }

  const status = getStatus();
  const funkyLine = getFunkyLine(progressPct);

  return (
    <div style={{
      minHeight: "100vh", background: "#090909",
      color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif", paddingBottom: 60,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: "#0f0f0f", borderBottom: "1px solid #1c1c1c", padding: "24px 24px 20px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", textTransform: "uppercase", marginBottom: 5 }}>Daily Check-in</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#444", marginBottom: 2, letterSpacing: 1 }}>STREAK</div>
              <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1, color: streak > 0 ? "#4ade80" : "#2a2a2a" }}>{streak}</div>
              <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>good days</div>
            </div>
          </div>

          {/* Status pill */}
          <div style={{
            marginTop: 14, background: "#0a0a0a", border: "1px solid #1e1e1e",
            borderRadius: 10, padding: "10px 14px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ color: status.color, fontWeight: 600, fontSize: 13 }}>{status.text}</span>
            <span style={{ color: "#333", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>{todayChecked}/5 done</span>
          </div>

          {spiralWarning && (
            <div style={{
              marginTop: 10, background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.22)", borderRadius: 10,
              padding: "10px 14px", fontSize: 12, color: "#fca5a5", lineHeight: 1.5,
            }}>
              ⚠️ <strong>Two rough days in a row.</strong> Don't let it become three. Next meal — back on track.
            </div>
          )}
        </div>
      </div>

      {/* DREAM BODY PROGRESS BANNER */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 24px 0" }}>
        <div style={{
          background: "linear-gradient(135deg, #0d0d0d 0%, #111 100%)",
          border: `1px solid ${progressColor}33`,
          borderRadius: 16, padding: "18px 20px",
          position: "relative", overflow: "hidden",
        }}>
          {/* Glow */}
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 120, height: 120, borderRadius: "50%",
            background: `${progressColor}15`, filter: "blur(30px)",
            pointerEvents: "none",
          }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#444", textTransform: "uppercase", marginBottom: 4 }}>Dream Body Progress ⌚</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: progressColor, lineHeight: 1 }}>
                {progressPct}%
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#555" }}>{latestWeight} kg → {GOAL_WEIGHT} kg</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginTop: 2 }}>
                {Math.max(0, (latestWeight - GOAL_WEIGHT)).toFixed(1)} kg to go
              </div>
              <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>lost {lost.toFixed(1)} of {totalToLose} kg</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
            <div style={{
              height: "100%", width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${progressColor}99, ${progressColor})`,
              borderRadius: 3, transition: "width 0.6s ease",
            }} />
          </div>

          {/* Funky line */}
          <div style={{
            fontSize: 12, color: progressColor,
            fontStyle: "italic", lineHeight: 1.4, opacity: 0.9,
          }}>
            "{funkyLine}"
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "14px 24px 0" }}>
        <div style={{
          display: "flex", background: "#0d0d0d",
          border: "1px solid #1c1c1c", borderRadius: 10, padding: 3, gap: 3,
        }}>
          {["today", "week"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              background: view === v ? "#fff" : "transparent",
              color: view === v ? "#000" : "#444",
              transition: "all 0.18s",
            }}>
              {v === "today" ? "Today" : "This Week"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 24px 0" }}>

        {view === "today" && (
          <>
            {/* WEIGHT LOG */}
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Today's Weight</div>
            <div style={{
              background: "#0f0f0f", border: "1px solid #1c1c1c",
              borderRadius: 14, padding: "14px 18px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <span style={{ fontSize: 22 }}>⚖️</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={e => { setWeight(e.target.value); setSaved(false); }}
                    placeholder={`${latestWeight}`}
                    style={{
                      width: 90, background: "#161616", border: "1px solid #222",
                      borderRadius: 8, color: "#f0f0f0", padding: "8px 12px",
                      fontSize: 16, fontWeight: 700,
                      fontFamily: "'DM Mono', monospace", outline: "none",
                    }}
                  />
                  <span style={{ fontSize: 13, color: "#444" }}>kg</span>
                  {weight && parseFloat(weight) < latestWeight && (
                    <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>
                      ↓ {(latestWeight - parseFloat(weight)).toFixed(1)} kg
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#333", marginTop: 5 }}>
                  Weigh in morning, after bathroom, before eating
                </div>
              </div>
            </div>

            {/* ACTIVITY */}
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Activity</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {[{ id: "gym", emoji: "🏋️", label: "Gym", sub: "Showed up = counts" }, { id: "steps", emoji: "👟", label: "10k Steps", sub: "Daily step goal" }].map(q => {
                const val = today[q.id];
                return (
                  <div key={q.id} style={{
                    flex: 1,
                    background: val === true ? "rgba(74,222,128,0.07)" : val === false ? "rgba(248,113,113,0.06)" : "#0f0f0f",
                    border: `1px solid ${val === true ? "rgba(74,222,128,0.22)" : val === false ? "rgba(248,113,113,0.18)" : "#1c1c1c"}`,
                    borderRadius: 14, padding: "14px 12px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: 26 }}>{q.emoji}</span>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{q.label}</div>
                      <div style={{ fontSize: 11, color: "#444", marginTop: 1 }}>{q.sub}</div>
                    </div>
                    <YesNo value={val} onYes={() => save({ [q.id]: true })} onNo={() => save({ [q.id]: false })} />
                  </div>
                );
              })}
            </div>

            {/* NUTRITION */}
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Nutrition</div>

            {/* Calories — smaller input */}
            <div style={{
              background: "#0f0f0f",
              border: `1px solid ${cal === null ? "#1c1c1c" : cal <= CALORIE_TARGET ? "rgba(74,222,128,0.22)" : cal <= CALORIE_TARGET + 300 ? "rgba(250,204,21,0.22)" : "rgba(248,113,113,0.22)"}`,
              borderRadius: 14, padding: "14px 18px", marginBottom: 10, transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🔥</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Calories</div>
                    <div style={{ fontSize: 11, color: "#444" }}>Target: {CALORIE_TARGET} kcal</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Compact number input */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="number"
                      value={calories}
                      onChange={e => { setCalories(e.target.value); setSaved(false); }}
                      placeholder="0"
                      style={{
                        width: 72, background: "#161616", border: "1px solid #222",
                        borderRadius: 8, color: calColor,
                        padding: "7px 10px", fontSize: 14, fontWeight: 700,
                        fontFamily: "'DM Mono', monospace", outline: "none",
                        textAlign: "right", transition: "color 0.2s",
                      }}
                    />
                    <span style={{ fontSize: 11, color: "#444" }}>kcal</span>
                  </div>
                  <YesNo
                    value={cal !== null ? cal <= CALORIE_TARGET : today.calUnder}
                    onYes={() => save({ calUnder: true })}
                    onNo={() => save({ calUnder: false })}
                  />
                </div>
              </div>

              {cal !== null && (
                <>
                  <div style={{ marginTop: 10, height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${Math.min((cal / (CALORIE_TARGET + 500)) * 100, 100)}%`,
                      background: calColor, borderRadius: 2, transition: "width 0.3s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: calColor, marginTop: 5, textAlign: "right" }}>
                    {cal <= CALORIE_TARGET ? `${CALORIE_TARGET - cal} kcal under ✓` : `${cal - CALORIE_TARGET} kcal over`}
                  </div>
                </>
              )}
            </div>

            {/* Protein + Sleep */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[{ id: "protein", emoji: "🥩", label: "Protein", sub: "~150g target" }, { id: "sleep", emoji: "😴", label: "Sleep supps", sub: "Mag + Ashwagandha" }].map(q => {
                const val = today[q.id];
                return (
                  <div key={q.id} style={{
                    background: val === true ? "rgba(74,222,128,0.06)" : val === false ? "rgba(248,113,113,0.06)" : "#0f0f0f",
                    border: `1px solid ${val === true ? "rgba(74,222,128,0.2)" : val === false ? "rgba(248,113,113,0.18)" : "#1c1c1c"}`,
                    borderRadius: 14, padding: "13px 18px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{q.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{q.label}</div>
                        <div style={{ fontSize: 11, color: "#444", marginTop: 1 }}>{q.sub}</div>
                      </div>
                    </div>
                    <YesNo value={val} onYes={() => save({ [q.id]: true })} onNo={() => save({ [q.id]: false })} />
                  </div>
                );
              })}
            </div>

            {/* Reflection */}
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Reflection</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              <textarea value={slip} onChange={e => { setSlip(e.target.value); setSaved(false); }}
                placeholder="Any slip today? e.g. ordered chole bhature, skipped gym..." rows={2}
                style={{ width: "100%", background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, color: "#ccc", padding: "12px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }} />
              <textarea value={plan} onChange={e => { setPlan(e.target.value); setSaved(false); }}
                placeholder="Plan for tomorrow..." rows={2}
                style={{ width: "100%", background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, color: "#ccc", padding: "12px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.5 }} />
            </div>

            <button onClick={handleSave} style={{
              width: "100%", padding: "15px 0",
              background: saved ? "#4ade80" : "#fff",
              color: "#000", border: "none", borderRadius: 14,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
            }}>
              {saved ? "✓ Saved" : "Save Today"}
            </button>

            <div style={{ marginTop: 14, padding: "12px 16px", background: "#0a0a0a", border: "1px solid #141414", borderRadius: 12, fontSize: 12, color: "#2e2e2e", textAlign: "center", lineHeight: 1.6 }}>
              The goal is not a perfect week.<br />
              <span style={{ color: "#222" }}>Never two bad days in a row. That's it.</span>
            </div>
          </>
        )}

        {view === "week" && (
          <>
            {/* Weight chart */}
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Weight This Week</div>
            <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60, justifyContent: "space-between" }}>
                {getWeekKeys().map((key, i) => {
                  const d = log[key] || {};
                  const w = parseFloat(d.weight);
                  const dateObj = new Date(key + "T12:00:00");
                  const isToday = key === getTodayKey();
                  const hasW = !isNaN(w);
                  const barH = hasW ? Math.max(8, Math.min(60, ((START_WEIGHT - w + 5) / (totalToLose + 10)) * 60)) : 4;
                  return (
                    <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      {hasW && <div style={{ fontSize: 9, color: "#555", fontFamily: "'DM Mono', monospace" }}>{w}</div>}
                      <div style={{
                        width: "100%", height: barH,
                        background: hasW ? (isToday ? "#4ade80" : "#2a2a2a") : "#161616",
                        borderRadius: 4, transition: "height 0.4s ease",
                        border: isToday ? "1px solid rgba(74,222,128,0.4)" : "none",
                      }} />
                      <div style={{ fontSize: 9, color: isToday ? "#fff" : "#444" }}>{days[dateObj.getDay()]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day rows */}
            <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Last 7 Days</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {getWeekKeys().map((key) => {
                const d = log[key] || {};
                const score = dayScore(d);
                const dateObj = new Date(key + "T12:00:00");
                const isToday = key === getTodayKey();
                const c = parseInt(d.calories);
                const calVal = c ? c <= CALORIE_TARGET : d.calUnder;
                const yesItems = [d.gym, d.steps, d.protein, d.sleep, calVal].filter(v => v === true).length;
                const hasData = [d.gym, d.steps, d.protein, d.sleep, d.calories, d.calUnder].some(v => v !== undefined);
                const barColor = score >= 0.8 ? "#4ade80" : score >= 0.5 ? "#facc15" : "#f87171";

                return (
                  <div key={key} style={{
                    background: "#0f0f0f", border: `1px solid ${isToday ? "#2a2a2a" : "#161616"}`,
                    borderRadius: 11, padding: "11px 14px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 9, color: "#444" }}>{days[dateObj.getDay()]}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: isToday ? "#fff" : "#555" }}>{dateObj.getDate()}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                        {hasData && score !== null && (
                          <div style={{ height: "100%", width: `${score * 100}%`, background: barColor, borderRadius: 2 }} />
                        )}
                      </div>
                      {c ? <div style={{ fontSize: 9, color: c <= CALORIE_TARGET ? "#4ade80" : "#f87171", marginTop: 3, fontFamily: "'DM Mono', monospace" }}>{c} kcal</div> : null}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[{ e: "🏋️", v: d.gym }, { e: "👟", v: d.steps }, { e: "🥩", v: d.protein }, { e: "🔥", v: calVal }, { e: "😴", v: d.sleep }].map((item, idx) => (
                        <span key={idx} style={{ fontSize: 12, opacity: item.v === true ? 1 : 0.12 }}>{item.e}</span>
                      ))}
                    </div>
                    <div style={{ width: 24, textAlign: "right", flexShrink: 0 }}>
                      {hasData ? <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: barColor }}>{yesItems}/5</span>
                        : <span style={{ fontSize: 11, color: "#222" }}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Breakdown */}
            <div style={{ marginTop: 14, background: "#0f0f0f", border: "1px solid #1a1a1a", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ fontSize: 10, color: "#3a3a3a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Weekly Breakdown</div>
              {[
                { emoji: "🏋️", label: "Gym", key: "gym" },
                { emoji: "👟", label: "10k Steps", key: "steps" },
                { emoji: "🥩", label: "Protein", key: "protein" },
                { emoji: "🔥", label: "Calories", key: "cal" },
                { emoji: "😴", label: "Sleep supps", key: "sleep" },
              ].map(item => {
                const vals = weekData.map(d => {
                  if (item.key === "cal") { const c = parseInt(d.calories); return c ? c <= CALORIE_TARGET : d.calUnder; }
                  return d[item.key];
                });
                const yes = vals.filter(v => v === true).length;
                const logged = vals.filter(v => v !== undefined && v !== null).length;
                const ratio = logged > 0 ? yes / logged : 0;
                return (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                    <span style={{ fontSize: 14, width: 20 }}>{item.emoji}</span>
                    <span style={{ fontSize: 12, color: "#555", width: 76 }}>{item.label}</span>
                    <div style={{ flex: 1, height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${ratio * 100}%`, background: ratio >= 0.7 ? "#4ade80" : ratio >= 0.4 ? "#facc15" : "#f87171", borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, color: "#444", fontFamily: "'DM Mono', monospace", width: 24, textAlign: "right" }}>{yes}/{logged || 0}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
