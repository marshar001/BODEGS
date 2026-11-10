// supabase.js — shared by every BODEGS page.
// Load order on each page:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="supabase.js"></script>

// Dashboard -> Project Settings -> API
const SUPABASE_URL = "https://cdwstvsesiyvfcadyqzs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkd3N0dnNlc2l5dmZjYWR5cXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMzE3MDUsImV4cCI6MjEwODcwNzcwNX0.x4GYf-0YvR1gVUfXFKR3JntWO8lTaMGf_AT2Za9Kf8Y"; // public key, safe here. NEVER put the service_role key in this file.

// Named "sb" because the CDN library already uses the global name "supabase".
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- helpers ----------
const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");

async function currentUser() {
  const { data } = await sb.auth.getUser();
  return data.user || null;
}

// Send the visitor to login.html if they aren't signed in. Returns the user otherwise.
async function requireLogin() {
  const user = await currentUser();
  if (!user) {
    const here = location.pathname.split("/").pop() + location.search;
    location.href = "login.html?next=" + encodeURIComponent(here);
    return null;
  }
  return user;
}

// ---------- products ----------
async function loadProducts(category) {
  let q = sb
    .from("products")
    .select("id, name, price_ngn, category, image_url, sellers(boutique_name, verified)")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (category) q = q.ilike("category", category);
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return data;
}

async function loadProduct(id) {
  const { data, error } = await sb
    .from("products")
    .select("id, name, description, price_ngn, category, image_url, sellers(boutique_name, verified)")
    .eq("id", id)
    .single();
  if (error) { console.error(error); return null; }
  return data;
}

// ---------- cart ----------
async function addToCart(productId, qty = 1) {
  const user = await requireLogin();
  if (!user) return false;
  const { error } = await sb
    .from("cart_items")
    .upsert({ user_id: user.id, product_id: productId, qty }, { onConflict: "user_id,product_id" });
  if (error) { console.error(error); return false; }
  return true;
}

async function loadCart() {
  const user = await requireLogin();
  if (!user) return [];
  const { data, error } = await sb
    .from("cart_items")
    .select("qty, products(id, name, price_ngn, image_url)")
    .eq("user_id", user.id);
  if (error) { console.error(error); return []; }
  return data;
}

// ---------- Cloudflare Turnstile (bot check) ----------
// Public site key: safe to keep here. The SECRET key is only ever typed into Supabase.
const TURNSTILE_SITE_KEY = "0x4AAAAAAF69DBrKDW7Iko73";
let _cfToken = "";
let _cfWidget = null;
let _cfLoading = false;
let _cfPendingBox = null;

function _cfDraw(boxId) {
  const box = document.getElementById(boxId);
  if (!box || !window.turnstile) return;
  if (_cfWidget !== null) { try { window.turnstile.remove(_cfWidget); } catch (e) {} _cfWidget = null; }
  _cfToken = "";
  _cfWidget = window.turnstile.render(box, {
    sitekey: TURNSTILE_SITE_KEY,
    theme: "auto",
    callback: function (t) { _cfToken = t; },
    "expired-callback": function () { _cfToken = ""; },
    "error-callback": function () { _cfToken = ""; }
  });
}

// Shows the check box inside <div id="boxId">. Safe to call more than once.
function showCaptcha(boxId) {
  if (window.turnstile) { _cfDraw(boxId); return; }
  _cfPendingBox = boxId;
  if (_cfLoading) return;
  _cfLoading = true;
  const s = document.createElement("script");
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  s.async = true;
  s.onload = function () { if (_cfPendingBox) _cfDraw(_cfPendingBox); };
  s.onerror = function () { _cfLoading = false; };
  document.head.appendChild(s);
}

// The current token ("" if the person has not passed the check yet).
function captchaToken() { return _cfToken; }

// Tokens work once only, so call this after every sign-in / sign-up / reset attempt.
function resetCaptcha() {
  _cfToken = "";
  if (_cfWidget !== null && window.turnstile) { try { window.turnstile.reset(_cfWidget); } catch (e) {} }
}

// ---------- auth ----------
async function signUp(email, password, fullName, age) {
  const data = { full_name: fullName };
  if (age) { data.age = age; }
  try {
    return await sb.auth.signUp({ email, password, options: { data, captchaToken: captchaToken() || undefined } });
  } finally { resetCaptcha(); }
}
async function signIn(email, password) {
  try {
    return await sb.auth.signInWithPassword({ email, password, options: { captchaToken: captchaToken() || undefined } });
  } finally { resetCaptcha(); }
}
async function signOut() {
  await sb.auth.signOut();
  location.href = "index.html";
}

// ---------- boutique application (used by boutique.html once you add document fields) ----------
async function uploadSellerDoc(file, label) {
  const user = await currentUser();
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `${user.id}/${label}-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from("seller-docs").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

async function submitBoutiqueApplication(fields, files) {
  const user = await requireLogin();
  if (!user) return { error: new Error("Please sign in first") };
  const id_doc_path = await uploadSellerDoc(files.idDoc, "id");
  const address_doc_path = await uploadSellerDoc(files.addressDoc, "address");
  const cac_doc_path = files.cacDoc ? await uploadSellerDoc(files.cacDoc, "cac") : null;
  return sb.from("seller_applications").insert({
    user_id: user.id,
    full_name: fields.fullName,
    boutique_name: fields.boutiqueName,
    phone: fields.phone,
    email: fields.email,
    city: fields.city,
    category: fields.category,
    about: fields.about,
    social: fields.social || null,
    cac_number: fields.cacNumber || null,
    id_doc_path, address_doc_path, cac_doc_path
  });
}

// ---------- shopper look: load theme.js on every page that loads this file (it skips seller/login pages) ----------
(function () {
  if (document.querySelector('script[src^="theme.js"]')) return;
  const s = document.createElement("script");
  s.src = "theme.js?v=20261031";
  document.head.appendChild(s);
})();

// ---------- bottom navigation: one shared bar on every page that has one (including profile.html) ----------
(function () {
  function add() {
    if (!document.querySelector("nav.bottom-nav")) return;
    if (document.querySelector('script[src^="nav.js"]')) return;
    const s = document.createElement("script");
    s.src = "nav.js?v=6";
    document.body.appendChild(s);
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", add); } else { add(); }
})();
