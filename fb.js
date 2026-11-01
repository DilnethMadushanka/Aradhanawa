/* Aradhanawa Firebase layer: Auth (Google + email) and Firestore.
 * Loaded by index.html only when firebase-config.js has a config.
 * index.html reads everything synchronously from FBX.profile / FBX.data (kept fresh by live listeners)
 * and calls the async methods below to write.
 *
 * Collections
 *   users/{uid}            name, email, phone, plan, created, lastLogin, photo
 *   admins/{email}         email, added, by           (who may open the admin dashboard)
 *   orders/{id}            kind, design, type, name, email, phone, amount, status, created, uid
 *                          + paid orders (written only by api/pay/*): amountCents, currency, paid, paidAt, payRef, payState, method
 *   invitations/{uid_type} uid, ownerName, ownerEmail, type, lang, tpl, title, names, date, venue, ev, guests, guestCount, updated
 *   galleries/{uid_type}   uid, type, photos [data:image/jpeg URLs], updated   (public read: guest links show these)
 *   rsvps/{id}             inviteId, ownerUid, type, event, guest, name, coming, count, msg, created
 *   settings/site          config {FREE_GUESTS, STUDIO_WA, PRICE_PLUS, PRICE_CUSTOM, PLANS [{id, kind, name, price, details, on}], MUSIC}, tplOff []
 */
const V = "10.12.2";
const CDN = `https://www.gstatic.com/firebasejs/${V}`;

export async function init(cfg, hooks = {}) {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-auth.js`),
    import(`${CDN}/firebase-firestore.js`),
  ]);
  const app = initializeApp(cfg.config);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);
  const adminEmails = (cfg.adminEmails || []).map(e => String(e).toLowerCase().trim()).filter(Boolean);
  const now = () => new Date().toISOString();
  const changed = why => { try { hooks.onChange && hooks.onChange(why) } catch (e) { console.error(e) } };

  const FBX = {
    on: true,
    user: null,
    profile: null,
    data: { users: [], orders: [], invitations: [], rsvps: [], admins: [] },
    settings: null,
  };

  /* ---------- live listeners ---------- */
  let unsubs = [];
  const stop = () => { unsubs.forEach(u => u()); unsubs = [] };
  const listen = (key, q) => unsubs.push(F.onSnapshot(q,
    s => { FBX.data[key] = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.created || b.updated || "").localeCompare(String(a.created || a.updated || ""))); changed(key) },
    e => console.warn("[fb]", key, e.code || e)));

  // Site settings are public: prices, WhatsApp number and hidden templates apply to every visitor.
  F.onSnapshot(F.doc(db, "settings", "site"), s => { FBX.settings = s.exists() ? s.data() : {}; changed("settings") }, e => console.warn("[fb] settings", e.code || e));

  async function isAdmin(u) {
    const em = (u.email || "").toLowerCase();
    if (!em || !u.emailVerified) return false;
    if (adminEmails.includes(em)) return true;
    try { return (await F.getDoc(F.doc(db, "admins", em))).exists() } catch (e) { return false }
  }

  let pending = null;   // name/phone typed on the register form, used when the profile doc is first written
  async function loadProfile(u) {
    const ref = F.doc(db, "users", u.uid);
    let snap = null;
    try { snap = await F.getDoc(ref) } catch (e) { console.warn("[fb] profile", e.code || e) }
    let p = snap && snap.exists() ? snap.data() : null;
    if (!p) {
      p = { name: (pending && pending.name) || u.displayName || (u.email || "").split("@")[0] || "Friend",
            email: (u.email || "").toLowerCase(), phone: (pending && pending.phone) || u.phoneNumber || "",
            plan: "Free", created: now(), lastLogin: now(), photo: u.photoURL || "" };
      try { await F.setDoc(ref, p) } catch (e) { console.warn("[fb] create profile", e.code || e) }
    } else {
      F.updateDoc(ref, { lastLogin: now(), ...(u.photoURL && !p.photo ? { photo: u.photoURL } : {}) }).catch(() => {});
    }
    pending = null;
    const admin = await isAdmin(u);
    return { id: u.uid, ...p, email: p.email || (u.email || "").toLowerCase(), role: admin ? "admin" : "user", plan: admin ? "Staff" : (p.plan || "Free") };
  }

  function startListeners(u, admin) {
    stop();
    if (admin) {
      listen("users", F.collection(db, "users"));
      listen("orders", F.collection(db, "orders"));
      listen("invitations", F.collection(db, "invitations"));
      listen("rsvps", F.collection(db, "rsvps"));
      listen("admins", F.collection(db, "admins"));
    } else {
      listen("orders", F.query(F.collection(db, "orders"), F.where("uid", "==", u.uid)));
      listen("invitations", F.query(F.collection(db, "invitations"), F.where("uid", "==", u.uid)));
      listen("rsvps", F.query(F.collection(db, "rsvps"), F.where("ownerUid", "==", u.uid)));
    }
  }

  const settingsReady = new Promise(res => { const t = setTimeout(res, 2500); const u = F.onSnapshot(F.doc(db, "settings", "site"), () => { clearTimeout(t); u(); res() }, () => { clearTimeout(t); res() }) });
  const authReady = new Promise(res => {
    let first = true;
    A.onAuthStateChanged(auth, async u => {
      FBX.user = u;
      FBX.profile = u ? await loadProfile(u) : null;
      FBX.data = { users: [], orders: [], invitations: [], rsvps: [], admins: [] };
      if (u) startListeners(u, FBX.profile.role === "admin"); else stop();
      if (first) { first = false; res(FBX) } else changed("auth");
    });
  });
  const ready = Promise.all([authReady, settingsReady]).then(() => FBX);
  A.getRedirectResult(auth).catch(e => hooks.onError && hooks.onError(e));

  /* ---------- auth ---------- */
  FBX.signInGoogle = async () => {
    const p = new A.GoogleAuthProvider();
    p.setCustomParameters({ prompt: "select_account" });
    const prev = auth.currentUser && auth.currentUser.uid;
    try { const r = await A.signInWithPopup(auth, p); if (prev && prev === r.user.uid) await FBX.refresh(); return r }
    catch (e) {
      if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/cancelled-popup-request"].includes(e.code)) return A.signInWithRedirect(auth, p);
      throw e;
    }
  };
  FBX.signInEmail = (email, pw) => A.signInWithEmailAndPassword(auth, email, pw);
  FBX.register = async ({ name, email, phone, pw }) => {
    pending = { name, phone };
    const c = await A.createUserWithEmailAndPassword(auth, email, pw);
    A.updateProfile(c.user, { displayName: name }).catch(() => {});
    A.sendEmailVerification(c.user).catch(() => {});
    return c;
  };
  FBX.resetPassword = email => A.sendPasswordResetEmail(auth, email);
  FBX.signOut = () => A.signOut(auth);
  FBX.idToken = () => auth.currentUser ? auth.currentUser.getIdToken() : Promise.reject(new Error("Please log in to pay."));
  FBX.sendVerify = () => A.sendEmailVerification(auth.currentUser);
  FBX.refresh = async () => {
    const u = auth.currentUser; if (!u) return null;
    await u.reload(); await u.getIdToken(true);
    FBX.user = auth.currentUser; FBX.profile = await loadProfile(FBX.user);
    startListeners(FBX.user, FBX.profile.role === "admin"); changed("auth");
    return FBX.profile;
  };
  FBX.updateMe = async fields => {
    if (!FBX.user) throw new Error("Not signed in");
    const f = {}; for (const k of ["name", "phone"]) if (k in fields) f[k] = String(fields[k] || "").slice(0, 120);
    await F.updateDoc(F.doc(db, "users", FBX.user.uid), f);
    Object.assign(FBX.profile, f); changed("profile");
  };

  /* ---------- writes ---------- */
  FBX.addOrder = o => F.addDoc(F.collection(db, "orders"), {
    kind: o.kind, design: o.design, type: o.type, name: o.name || "", email: o.email || "", phone: o.phone || "",
    amount: o.amount || "", status: "New", created: now(), uid: FBX.user ? FBX.user.uid : null });
  FBX.setOrderStatus = (id, status) => F.updateDoc(F.doc(db, "orders", id), { status, updated: now() });
  FBX.deleteOrder = id => F.deleteDoc(F.doc(db, "orders", id));
  FBX.setUserPlan = (uid, plan) => F.updateDoc(F.doc(db, "users", uid), { plan });
  FBX.deleteUser = uid => F.deleteDoc(F.doc(db, "users", uid));   // profile only; the sign-in itself is removed in Firebase console → Authentication
  FBX.setAdmin = (email, on) => {
    const ref = F.doc(db, "admins", String(email).toLowerCase().trim());
    return on ? F.setDoc(ref, { email: ref.id, added: now(), by: FBX.profile ? FBX.profile.email : "" }) : F.deleteDoc(ref);
  };
  FBX.isAdminEmail = em => { em = String(em || "").toLowerCase(); return adminEmails.includes(em) || FBX.data.admins.some(a => a.id === em) };
  FBX.isBootstrapAdmin = em => adminEmails.includes(String(em || "").toLowerCase());
  FBX.saveSettings = c => F.setDoc(F.doc(db, "settings", "site"), { config: c, updated: now() }, { merge: true });
  // Admin → Prices. Merges into config, so the plan list replaces the old one and other settings stay.
  FBX.savePlans = c => F.setDoc(F.doc(db, "settings", "site"), { config: c, updated: now() }, { merge: true });
  FBX.setTplOff = list => F.setDoc(F.doc(db, "settings", "site"), { tplOff: list, updated: now() }, { merge: true });

  FBX.inviteId = type => FBX.user ? `${FBX.user.uid}_${type}` : "";
  FBX.saveInvite = inv => {
    if (!FBX.user) return Promise.resolve();
    const u = FBX.user, p = FBX.profile || {};
    return F.setDoc(F.doc(db, "invitations", `${u.uid}_${inv.type}`), {
      uid: u.uid, ownerName: p.name || "", ownerEmail: p.email || "", type: inv.type, lang: inv.lang || "", tpl: inv.tpl ?? 0,
      title: inv.title || "", names: inv.names || "", date: inv.date || "", venue: inv.venue || "",
      ev: inv.ev || {}, guests: inv.guests || [], guestCount: (inv.guests || []).length,
      updated: now() }, { merge: true });
  };
  // Gallery photos for the guest link. Kept apart from invitations so guests can read them without seeing the guest list.
  FBX.saveGallery = (type, photos) => {
    if (!FBX.user) return Promise.resolve();
    const u = FBX.user, ref = F.doc(db, "galleries", `${u.uid}_${type}`);
    return photos.length ? F.setDoc(ref, { uid: u.uid, type, photos, updated: now() }) : F.deleteDoc(ref);
  };
  FBX.deleteInvite = id => F.deleteDoc(F.doc(db, "invitations", id));
  FBX.addRsvp = r => F.addDoc(F.collection(db, "rsvps"), {
    inviteId: String(r.inviteId || "").slice(0, 200), ownerUid: String(r.ownerUid || "").slice(0, 128),
    type: String(r.type || "").slice(0, 20), event: String(r.event || "").slice(0, 200), guest: String(r.guest || "").slice(0, 120),
    name: String(r.name || "").slice(0, 120), coming: !!r.coming, count: Math.max(0, Math.min(20, +r.count || 0)),
    msg: String(r.msg || "").slice(0, 1000), created: now() });
  FBX.deleteRsvp = id => F.deleteDoc(F.doc(db, "rsvps", id));

  window.FBX = FBX;
  return ready;
}

export function errText(e) {
  const c = (e && e.code) || "";
  return ({
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/user-not-found": "No account with this email. Create one first.",
    "auth/email-already-in-use": "An account with this email already exists. Try logging in or use Google.",
    "auth/weak-password": "Password needs at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email.",
    "auth/too-many-requests": "Too many tries. Wait a minute and try again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before finishing.",
    "auth/unauthorized-domain": "This website address is not allowed in Firebase yet (Authentication → Settings → Authorized domains).",
    "auth/operation-not-allowed": "This sign-in method is not turned on in Firebase (Authentication → Sign-in method).",
    "auth/network-request-failed": "No internet connection. Please try again.",
    "permission-denied": "You don't have permission to do that.",
  })[c] || (e && e.message) || "Something went wrong. Please try again.";
}
