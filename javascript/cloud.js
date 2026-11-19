/* Supabase cloud backend for AMESI SALEM portfolio. */
(function (w) {
  "use strict";
  var cfg = w.SALEM_SUPABASE_CONFIG || {};
  var configured = /^https:\/\//.test(cfg.url || "") && cfg.anonKey && cfg.anonKey.indexOf("PASTE_") !== 0;
  var client = configured && w.supabase ? w.supabase.createClient(cfg.url, cfg.anonKey) : null;
  function ready() { if (!client) throw new Error("Cloud backend is not configured yet. Follow SUPABASE-SETUP.md."); }
  var api = {
    configured: !!client,
    signIn: async function (email, password) { ready(); var r = await client.auth.signInWithPassword({ email: email, password: password }); if (r.error) throw r.error; return r.data; },
    signOut: async function () { if (client) await client.auth.signOut(); },
    updatePassword: async function (password) { ready(); var r = await client.auth.updateUser({ password: password }); if (r.error) throw r.error; },
    session: async function () { if (!client) return null; var r = await client.auth.getSession(); return r.data.session; },
    listMessages: async function () { ready(); var r = await client.from("enquiries").select("*").order("created_at", { ascending: false }); if (r.error) throw r.error; return r.data; },
    createMessage: async function (data) { ready(); var r = await client.from("enquiries").insert({ name:data.name, email:data.email, service:data.service || "", budget:data.budget || "", timeline:data.timeline || "", message:data.message, read:false }); if (r.error) throw r.error; },
    setRead: async function (id, read) { ready(); var r = await client.from("enquiries").update({ read:!!read }).eq("id", id); if (r.error) throw r.error; },
    deleteMessage: async function (id) { ready(); var r = await client.from("enquiries").delete().eq("id", id); if (r.error) throw r.error; },
    reply: async function (id, replyText) { ready(); var r = await client.from("enquiries").update({ reply:replyText, replied_at:new Date().toISOString() }).eq("id", id); if (r.error) throw r.error; },
    listServices: async function () { ready(); var r = await client.from("portfolio_services").select("*").order("sort_order", { ascending:true }); if (r.error) throw r.error; return r.data; },
    saveService: async function (item) { ready(); var row = { title:item.title, description:item.description, icon:item.icon || "bi-code-slash", features:item.features || [], published:item.published !== false, sort_order:item.sort_order || 0 }; if (item.id && /^[0-9a-f-]{36}$/i.test(item.id)) row.id=item.id; var r = await client.from("portfolio_services").upsert(row).select().single(); if (r.error) throw r.error; return r.data; },
    deleteService: async function (id) { ready(); var r = await client.from("portfolio_services").delete().eq("id", id); if (r.error) throw r.error; }
  };
  w.SalemCloud = api;
})(window);
