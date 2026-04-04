const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database("./ghostlydesk.db");

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT, brand TEXT, model TEXT, cond TEXT, bought REAL, recon REAL, fees REAL, asking REAL, status TEXT DEFAULT \'Available\', days INTEGER DEFAULT 0, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
  db.run("CREATE TABLE IF NOT EXISTS wishlist (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, brand TEXT, model TEXT, ref TEXT, budget REAL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

const GHL_KEY = process.env.GHL_API_KEY;
const GHL_LOC = process.env.GHL_LOCATION_ID;
const GHL_BASE = "https://services.leadconnectorhq.com";

function ghlHeaders() {
  return { Authorization: "Bearer " + GHL_KEY, Version: "2021-07-28" };
}

app.get("/api/contacts", async (req, res) => {
  try {
    const r = await axios.get(GHL_BASE + "/contacts", { headers: ghlHeaders(), params: { locationId: GHL_LOC, limit: 100 } });
    res.json(r.data);
  } catch(e) { res.json({ contacts: [], error: e.message }); }
});

app.get("/api/opportunities", async (req, res) => {
  try {
    const r = await axios.get(GHL_BASE + "/opportunities/search", { headers: ghlHeaders(), params: { location_id: GHL_LOC, limit: 100 } });
    res.json(r.data);
  } catch(e) { res.json({ opportunities: [], error: e.message }); }
});

app.get("/api/conversations", async (req, res) => {
  try {
    const r = await axios.get(GHL_BASE + "/conversations", { headers: ghlHeaders(), params: { locationId: GHL_LOC, limit: 50 } });
    res.json(r.data);
  } catch(e) { res.json({ conversations: [], error: e.message }); }
});

app.get("/api/inventory", (req, res) => {
  db.all("SELECT * FROM inventory ORDER BY created_at DESC", (err, rows) => res.json(rows || []));
});

app.post("/api/inventory", (req, res) => {
  const { ref, brand, model, cond, bought, recon, fees, asking, status, notes } = req.body;
  db.run("INSERT INTO inventory (ref,brand,model,cond,bought,recon,fees,asking,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [ref,brand,model,cond,bought||0,recon||0,fees||0,asking||0,status||"Available",notes||""],
    function(err) {
      if(err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put("/api/inventory/:id", (req, res) => {
  const { ref, brand, model, cond, bought, recon, fees, asking, status, notes } = req.body;
  db.run("UPDATE inventory SET ref=?,brand=?,model=?,cond=?,bought=?,recon=?,fees=?,asking=?,status=?,notes=? WHERE id=?",
    [ref,brand,model,cond,bought,recon,fees,asking,status,notes,req.params.id],
    (err) => res.json({ success: !err })
  );
});

app.delete("/api/inventory/:id", (req, res) => {
  db.run("DELETE FROM inventory WHERE id=?", [req.params.id], (err) => res.json({ success: !err }));
});

app.get("/api/wishlist", (req, res) => {
  db.all("SELECT * FROM wishlist ORDER BY created_at DESC", (err, rows) => res.json(rows || []));
});

app.post("/api/wishlist", (req, res) => {
  const { name, phone, brand, model, ref, budget } = req.body;
  db.run("INSERT INTO wishlist (name,phone,brand,model,ref,budget) VALUES (?,?,?,?,?,?)",
    [name,phone,brand,model,ref,budget||0],
    function(err) {
      if(err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put("/api/wishlist/:id", (req, res) => {
  const { name, phone, brand, model, ref, budget } = req.body;
  db.run("UPDATE wishlist SET name=?,phone=?,brand=?,model=?,ref=?,budget=? WHERE id=?",
    [name,phone,brand,model,ref,budget,req.params.id],
    (err) => res.json({ success: !err })
  );
});

app.delete("/api/wishlist/:id", (req, res) => {
  db.run("DELETE FROM wishlist WHERE id=?", [req.params.id], (err) => res.json({ success: !err }));
});

app.listen(3000, () => console.log("GhostlyDesk running on http://localhost:3000"));
