const express = require("express");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const adapter = new FileSync("db.json");
const db = low(adapter);

db.defaults({ inventory: [], wishlist: [] }).write();

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
  res.json(db.get("inventory").value());
});

app.post("/api/inventory", (req, res) => {
  const item = { ...req.body, id: Date.now(), days: 0, created_at: new Date().toISOString() };
  db.get("inventory").push(item).write();
  const matches = db.get("wishlist").filter(w => w.ref && w.ref.toLowerCase() === (item.ref || "").toLowerCase()).value();
  if(matches.length > 0) console.log("Wishlist match for " + item.ref + " - " + matches.length + " client(s)");
  res.json(item);
});

app.put("/api/inventory/:id", (req, res) => {
  db.get("inventory").find({ id: parseInt(req.params.id) }).assign(req.body).write();
  res.json({ success: true });
});

app.delete("/api/inventory/:id", (req, res) => {
  db.get("inventory").remove({ id: parseInt(req.params.id) }).write();
  res.json({ success: true });
});

app.get("/api/wishlist", (req, res) => {
  res.json(db.get("wishlist").value());
});

app.post("/api/wishlist", (req, res) => {
  const item = { ...req.body, id: Date.now(), created_at: new Date().toISOString() };
  db.get("wishlist").push(item).write();
  res.json(item);
});

app.put("/api/wishlist/:id", (req, res) => {
  db.get("wishlist").find({ id: parseInt(req.params.id) }).assign(req.body).write();
  res.json({ success: true });
});

app.delete("/api/wishlist/:id", (req, res) => {
  db.get("wishlist").remove({ id: parseInt(req.params.id) }).write();
  res.json({ success: true });
});

app.listen(3000, () => console.log("GhostlyDesk running on http://localhost:3000"));
