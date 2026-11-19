/* ADMIN PAGE — Supabase authenticated cloud dashboard. */

(function () {
    "use strict";

    var Store = window.AmesiStore;
    var esc = Store.escape;

    var SESSION_KEY = "amesi_cloud_session";
    var STORAGE_LIMIT = 5 * 1024 * 1024;

    function $(id) { return document.getElementById(id); }
    function toast(text, type) {
        var el = document.createElement("div");
        el.className = "toast" + (type === "error" ? " error" : "");
        el.textContent = text;
        $("toastStack").appendChild(el);
        setTimeout(function () { el.remove(); }, 3500);
    }
    function formatDate(iso) { var d = new Date(iso); if (isNaN(d)) return ""; return d.toLocaleDateString([], {day:"numeric",month:"short"}) + " " + d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}); }
    function formatFull(iso) { var d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString(); }
    function initials(name) { var a=String(name||"?").trim().split(/\s+/); return ((a[0]||"?")[0]+(a[1]?a[1][0]:"")).toUpperCase(); }
    function labelize(v) { return v ? String(v).replace(/-/g," ").replace(/\b\w/g,function(c){return c.toUpperCase();}) : "Not specified"; }
    function persist(ok) { if (!ok) toast("Could not save this change.","error"); return ok; }
    function showAuth() { $("adminApp").hidden=true; $("authScreen").hidden=false; $("authError").textContent=""; }
    var modalEl = $("modal");
    function openModal(title, bodyHtml, footHtml) { $("modalTitle").textContent=title; $("modalBody").innerHTML=bodyHtml; $("modalFoot").innerHTML=footHtml||""; modalEl.hidden=false; document.body.style.overflow="hidden"; }
    function closeModal() { modalEl.hidden=true; document.body.style.overflow=""; $("modalBody").innerHTML=""; $("modalFoot").innerHTML=""; }
    modalEl.addEventListener("click",function(e){if(e.target.closest("[data-close]"))closeModal();});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!modalEl.hidden)closeModal();});

    async function hydrateCloud() {
        var rows = await SalemCloud.listMessages();
        Store.saveMessages(rows.map(function(m){ return {id:m.id,name:m.name,email:m.email,service:m.service,budget:m.budget,timeline:m.timeline,message:m.message,date:m.created_at,read:m.read,reply:m.reply||"",replied_at:m.replied_at}; }));
        var services = await SalemCloud.listServices();
        Store.saveServices(services);
    }
    async function enterApp() {
        try { await hydrateCloud(); } catch (e) { toast("Could not load cloud data: " + e.message,"error"); return; }
        sessionStorage.setItem(SESSION_KEY,"1"); $("authScreen").hidden=true; $("adminApp").hidden=false; route();
    }
    $("authForm").addEventListener("submit",async function(event){
        event.preventDefault(); var error=$("authError"); error.textContent="";
        if (!window.SalemCloud || !SalemCloud.configured) { error.textContent="Cloud backend is not configured. Follow SUPABASE-SETUP.md."; return; }
        var btn=$("authSubmit"); btn.disabled=true;
        try { await SalemCloud.signIn($("authEmail").value.trim(),$("authPass").value); await enterApp(); }
        catch(e) { error.textContent=e.message||"Sign-in failed."; }
        finally { btn.disabled=false; }
    });
    $("logoutBtn").addEventListener("click",async function(){ await SalemCloud.signOut(); sessionStorage.removeItem(SESSION_KEY); $("adminApp").hidden=true; $("authScreen").hidden=false; $("authPass").value=""; });
    (async function restoreSession(){ if(!SalemCloud.configured)return; try { var session=await SalemCloud.session(); if(session) await enterApp(); } catch(e) { console.warn(e); } })();

    /* ================= ROUTER ================= */

    var VIEWS = {
        dashboard: { kicker: "OVERVIEW", title: "Dashboard", render: renderDashboard },
        projects: { kicker: "PORTFOLIO", title: "Projects", render: renderProjects },
        services: { kicker: "OFFERINGS", title: "Services", render: renderServices },
        messages: { kicker: "INBOX", title: "Messages", render: renderMessages },
        settings: { kicker: "CONFIGURATION", title: "Settings", render: renderSettings }
    };

    var currentView = "dashboard";

    function route() {
        if (sessionStorage.getItem(SESSION_KEY) !== "1") return;

        var name = (location.hash || "#dashboard").slice(1);
        if (!VIEWS[name]) name = "dashboard";
        currentView = name;

        Object.keys(VIEWS).forEach(function (key) {
            $("view-" + key).hidden = key !== name;
        });

        document.querySelectorAll(".sidebar-nav a").forEach(function (link) {
            link.classList.toggle("active", link.dataset.view === name);
        });

        $("viewKicker").textContent = VIEWS[name].kicker;
        $("viewTitle").textContent = VIEWS[name].title;
        $("topbarActions").innerHTML = "";

        VIEWS[name].render();
        updateUnreadBadge();
        window.scrollTo(0, 0);
    }

    window.addEventListener("hashchange", route);

    function refresh() { VIEWS[currentView].render(); updateUnreadBadge(); }

    function updateUnreadBadge() {
        var unread = Store.getMessages().filter(function (m) { return !m.read; }).length;
        var badge = $("navUnread");
        badge.hidden = unread === 0;
        badge.textContent = unread > 99 ? "99+" : unread;
    }

    /* ================= DASHBOARD ================= */

    function renderDashboard() {
        var projects = Store.getProjects();
        var messages = Store.getMessages();
        var unread = messages.filter(function (m) { return !m.read; }).length;
        var published = projects.filter(function (p) { return p.published !== false; }).length;
        var settings = Store.getSettings();

        var stats = [
            { icon: "bi-kanban-fill", value: published, label: "Live projects" + (projects.length !== published ? " (" + (projects.length - published) + " hidden)" : ""), glow: "var(--cyan-glow)" },
            { icon: "bi-inbox-fill", value: messages.length, label: "Total messages", glow: "var(--blue-glow)" },
            { icon: "bi-envelope-exclamation-fill", value: unread, label: "Unread messages", glow: "rgba(255, 83, 190, 0.3)" },
            { icon: "bi-broadcast", value: settings.available ? "Open" : "Booked", label: "Availability", glow: "rgba(77, 255, 181, 0.3)" }
        ];

        $("statGrid").innerHTML = stats.map(function (s) {
            return '<div class="stat-card" style="--stat:' + s.glow + '"><div class="stat-icon"><i class="bi ' + s.icon + '"></i></div><strong>' + esc(s.value) + "</strong><span>" + esc(s.label) + "</span></div>";
        }).join("");

        var recent = messages.slice(0, 4);
        $("dashMessages").innerHTML = recent.length
            ? recent.map(function (m) {
                return '<div class="dash-msg"><div class="avatar">' + esc(initials(m.name)) + '</div><div class="msg-body"><div class="msg-top"><span class="msg-name">' + esc(m.name || "Unknown") + "</span>" +
                    (m.read ? "" : '<span class="msg-service">NEW</span>') + '</div><p class="msg-preview">' + esc(m.message) + '</p></div><span class="msg-date">' + esc(formatDate(m.date)) + "</span></div>";
            }).join("")
            : '<div class="empty-state"><i class="bi bi-inbox"></i><p>No messages yet.</p></div>';

        $("qaAvailText").textContent = settings.available ? "Mark as booked" : "Mark as available";

        var used = Store.usedBytes();
        var pct = Math.min(100, (used / STORAGE_LIMIT) * 100);
        $("meterBar").style.width = Math.max(pct, 1.5) + "%";
        $("meterBar").classList.toggle("warn", pct > 75);
        $("meterText").textContent = (used / 1024).toFixed(1) + " KB used of about 5 MB." + (pct > 75 ? " Running low: remove large images or export a backup." : "");
    }

    $("qaNewProject").addEventListener("click", function () { location.hash = "#projects"; openProjectForm(null); });

    $("qaAvailability").addEventListener("click", function () {
        var s = Store.getSettings();
        s.available = !s.available;
        if (persist(Store.saveSettings(s))) {
            toast(s.available ? "Marked as available." : "Marked as booked.");
            refresh();
        }
    });

    $("qaExport").addEventListener("click", exportBackup);

    /* ================= PROJECTS ================= */

    var projectQuery = "";

    function renderProjects() {
        $("topbarActions").innerHTML = '<button type="button" class="adm-btn primary" id="addProjectBtn"><i class="bi bi-plus-lg"></i><span>Add project</span></button>';
        $("addProjectBtn").addEventListener("click", function () { openProjectForm(null); });

        var all = Store.getProjects();
        var q = projectQuery.toLowerCase();
        var list = $("projectList");

        if (!all.length) {
            list.innerHTML = '<div class="empty-state"><i class="bi bi-kanban"></i><p>No projects yet. Add your first one.</p></div>';
            return;
        }

        var rows = all.map(function (p, index) { return { p: p, index: index }; }).filter(function (item) {
            if (!q) return true;
            return (item.p.title + " " + item.p.category + " " + item.p.description + " " + (item.p.tags || []).join(" ")).toLowerCase().indexOf(q) !== -1;
        });

        if (!rows.length) {
            list.innerHTML = '<div class="empty-state"><i class="bi bi-search"></i><p>No projects match your search.</p></div>';
            return;
        }

        list.innerHTML = rows.map(function (item) {
            var p = item.p, i = item.index;
            var thumb = p.image
                ? '<img src="' + esc(p.image) + '" alt="">'
                : '<i class="bi ' + esc(p.icon || "bi-folder-fill") + '"></i>';
            var tags = (p.tags || []).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") +
                (p.published === false ? '<span class="draft">Hidden</span>' : "");

            return '<article class="project-row' + (p.published === false ? " is-hidden" : "") + '" data-id="' + esc(p.id) + '">' +
                '<div class="row-order"><button type="button" class="icon-btn" data-act="up" aria-label="Move up"' + (i === 0 || q ? " disabled" : "") + '><i class="bi bi-chevron-up"></i></button>' +
                "<b>" + String(i + 1).padStart(2, "0") + '</b><button type="button" class="icon-btn" data-act="down" aria-label="Move down"' + (i === all.length - 1 || q ? " disabled" : "") + '><i class="bi bi-chevron-down"></i></button></div>' +
                '<div class="row-thumb">' + thumb + "</div>" +
                '<div class="row-info"><h3>' + esc(p.title) + "</h3><p>" + esc(p.category) + " · " + esc(p.description) + '</p><div class="row-tags">' + tags + "</div></div>" +
                '<div class="row-actions">' +
                '<button type="button" class="icon-btn" data-act="toggle" aria-label="' + (p.published === false ? "Show" : "Hide") + ' project" title="' + (p.published === false ? "Show on site" : "Hide from site") + '"><i class="bi ' + (p.published === false ? "bi-eye-slash" : "bi-eye") + '"></i></button>' +
                '<button type="button" class="icon-btn" data-act="edit" aria-label="Edit project"><i class="bi bi-pencil-fill"></i></button>' +
                '<button type="button" class="icon-btn danger" data-act="delete" aria-label="Delete project"><i class="bi bi-trash3-fill"></i></button></div></article>';
        }).join("");
    }

    $("projectSearch").addEventListener("input", function () { projectQuery = this.value.trim(); renderProjects(); });

    $("projectList").addEventListener("click", function (event) {
        var btn = event.target.closest("button[data-act]");
        if (!btn) return;

        var id = btn.closest(".project-row").dataset.id;
        var list = Store.getProjects();
        var index = list.findIndex(function (p) { return p.id === id; });
        if (index === -1) return;

        var act = btn.dataset.act;

        if (act === "edit") { openProjectForm(list[index]); return; }

        if (act === "delete") {
            confirmDialog("Delete project?", "\"" + list[index].title + "\" will be removed from your Projects page.", "Delete", function () {
                list.splice(index, 1);
                if (persist(Store.saveProjects(list))) { toast("Project deleted."); refresh(); }
            });
            return;
        }

        if (act === "toggle") {
            list[index].published = list[index].published === false;
            if (persist(Store.saveProjects(list))) { toast(list[index].published ? "Project is live." : "Project hidden."); refresh(); }
            return;
        }

        var target = act === "up" ? index - 1 : index + 1;
        if (target < 0 || target >= list.length) return;
        var moved = list.splice(index, 1)[0];
        list.splice(target, 0, moved);
        if (persist(Store.saveProjects(list))) refresh();
    });

    function resizeImage(file, maxWidth) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onerror = reject;
            reader.onload = function () {
                var img = new Image();
                img.onerror = reject;
                img.onload = function () {
                    var scale = Math.min(1, maxWidth / img.width);
                    var canvas = document.createElement("canvas");
                    canvas.width = Math.round(img.width * scale);
                    canvas.height = Math.round(img.height * scale);
                    var ctx = canvas.getContext("2d");
                    ctx.fillStyle = "#06112b";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", 0.82));
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function openProjectForm(project) {
        var isNew = !project;
        var p = project || { id: "", title: "", label: "", category: "", description: "", tags: [], image: "", icon: "", link: "", published: true };
        var imageData = p.image || "";

        var body =
            '<form id="projectForm" novalidate>' +
            '<div class="adm-field"><label for="pfTitle">Title *</label><input type="text" id="pfTitle" class="adm-input" maxlength="80" value="' + esc(p.title) + '"></div>' +
            '<div class="row g-3">' +
            '<div class="col-sm-6 adm-field"><label for="pfCategory">Category</label><input type="text" id="pfCategory" class="adm-input" maxlength="40" placeholder="e.g. Business Website" value="' + esc(p.category) + '"></div>' +
            '<div class="col-sm-6 adm-field"><label for="pfLabel">Image badge</label><input type="text" id="pfLabel" class="adm-input" maxlength="30" placeholder="e.g. WEB DEVELOPMENT" value="' + esc(p.label) + '"></div>' +
            "</div>" +
            '<div class="adm-field"><label for="pfDesc">Description *</label><textarea id="pfDesc" class="adm-input" maxlength="400">' + esc(p.description) + "</textarea></div>" +
            '<div class="adm-field"><label for="pfTags">Tags</label><input type="text" id="pfTags" class="adm-input" placeholder="HTML, CSS, JavaScript" value="' + esc((p.tags || []).join(", ")) + '"><small class="field-hint">Separate with commas.</small></div>' +
            '<div class="adm-field"><label>Cover image</label><div class="image-field"><div class="image-preview" id="pfPreview"></div>' +
            '<div class="image-actions"><button type="button" class="adm-btn small" id="pfUpload"><i class="bi bi-upload"></i><span>Upload</span></button>' +
            '<button type="button" class="adm-btn small danger" id="pfRemoveImg"><i class="bi bi-x-lg"></i><span>Remove</span></button>' +
            '<input type="file" id="pfFile" accept="image/*" hidden></div></div>' +
            '<small class="field-hint">Uploads are resized to keep storage small. With no image, an icon card is shown instead.</small></div>' +
            '<div class="row g-3"><div class="col-sm-6 adm-field"><label for="pfIcon">Icon (when no image)</label><input type="text" id="pfIcon" class="adm-input" placeholder="bi-shield-lock-fill" value="' + esc(p.icon) + '"><small class="field-hint">Any <a class="adm-link" href="https://icons.getbootstrap.com/" target="_blank" rel="noopener">Bootstrap icon</a> class.</small></div>' +
            '<div class="col-sm-6 adm-field"><label for="pfLink">Project link</label><input type="url" id="pfLink" class="adm-input" placeholder="https://..." value="' + esc(p.link) + '"><small class="field-hint">Optional. Opens from the arrow button.</small></div></div>' +
            '<label class="switch-row"><span><strong>Show on site</strong><small>Turn off to keep it as a draft.</small></span><input type="checkbox" id="pfPublished"' + (p.published !== false ? " checked" : "") + '><i class="switch"></i></label>' +
            '<p class="auth-error" id="pfError" role="alert" style="text-align:left"></p></form>';

        openModal(
            isNew ? "Add project" : "Edit project",
            body,
            '<button type="button" class="adm-btn" data-close>Cancel</button><button type="button" class="adm-btn primary" id="pfSave"><i class="bi bi-check2"></i><span>' + (isNew ? "Add project" : "Save changes") + "</span></button>"
        );

        function paintPreview() {
            $("pfPreview").innerHTML = imageData ? '<img src="' + esc(imageData) + '" alt="">' : '<i class="bi bi-image"></i>';
            $("pfRemoveImg").hidden = !imageData;
        }
        paintPreview();

        $("pfUpload").addEventListener("click", function () { $("pfFile").click(); });
        $("pfRemoveImg").addEventListener("click", function () { imageData = ""; paintPreview(); });

        $("pfFile").addEventListener("change", function () {
            var file = this.files[0];
            if (!file) return;
            if (!/^image\//.test(file.type)) { $("pfError").textContent = "Please choose an image file."; return; }
            resizeImage(file, 1100).then(function (data) { imageData = data; paintPreview(); $("pfError").textContent = ""; })
                .catch(function () { $("pfError").textContent = "That image could not be read."; });
        });

        $("pfSave").addEventListener("click", function () {
            var title = $("pfTitle").value.trim();
            var description = $("pfDesc").value.trim();
            var link = $("pfLink").value.trim();
            var icon = $("pfIcon").value.trim();
            var err = $("pfError");

            if (!title) { err.textContent = "Please add a title."; $("pfTitle").focus(); return; }
            if (!description) { err.textContent = "Please add a description."; $("pfDesc").focus(); return; }
            if (link && !/^https?:\/\//i.test(link)) { err.textContent = "The link must start with http:// or https://"; return; }
            if (icon && !/^bi-[a-z0-9-]+$/i.test(icon)) { err.textContent = "Icon must look like bi-shield-lock-fill."; return; }

            var data = {
                id: p.id || Store.uid("p"),
                title: title,
                label: $("pfLabel").value.trim() || $("pfCategory").value.trim().toUpperCase(),
                category: $("pfCategory").value.trim(),
                description: description,
                tags: $("pfTags").value.split(",").map(function (t) { return t.trim(); }).filter(Boolean).slice(0, 8),
                image: imageData,
                icon: icon,
                link: link,
                published: $("pfPublished").checked
            };

            var list = Store.getProjects();
            if (isNew) {
                list.push(data);
            } else {
                var i = list.findIndex(function (x) { return x.id === p.id; });
                if (i !== -1) list[i] = data;
            }

            if (persist(Store.saveProjects(list))) {
                closeModal();
                toast(isNew ? "Project added." : "Project updated.");
                refresh();
            }
        });
    }

    /* ================= SERVICES ================= */
    function renderServices() {
        $("topbarActions").innerHTML = '<button type="button" class="adm-btn primary" id="addServiceBtn"><i class="bi bi-plus-lg"></i><span>Add service</span></button>';
        $("addServiceBtn").addEventListener("click",function(){openServiceForm(null);});
        var items=Store.getServices();
        $("serviceAdminList").innerHTML = items.length ? items.map(function(x,i){return '<article class="project-row" data-id="'+esc(x.id)+'"><div class="row-order"><b>'+String(i+1).padStart(2,"0")+'</b></div><div class="row-thumb"><i class="bi '+esc(x.icon||"bi-code-slash")+'"></i></div><div class="row-info"><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><div class="row-tags">'+(x.published?'<span>Published</span>':'<span class="draft">Hidden</span>')+'</div></div><div class="row-actions"><button class="icon-btn" data-act="edit" title="Edit"><i class="bi bi-pencil-fill"></i></button><button class="icon-btn danger" data-act="delete" title="Delete"><i class="bi bi-trash3-fill"></i></button></div></article>';}).join("") : '<div class="empty-state"><i class="bi bi-grid"></i><p>No cloud services yet. Add your first service.</p></div>';
        $("serviceAdminList").querySelectorAll("button[data-act]").forEach(function(btn){btn.addEventListener("click",function(){var id=btn.closest("[data-id]").dataset.id;var item=items.find(function(x){return x.id===id;});if(btn.dataset.act==="edit")openServiceForm(item);else if(confirm("Delete this service?")){SalemCloud.deleteService(id).then(function(){return hydrateCloud();}).then(refresh).then(function(){toast("Service deleted.");}).catch(function(e){toast(e.message,"error");});}});});
    }
    function openServiceForm(item) {
        var x=item||{title:"",description:"",icon:"bi-code-slash",features:[],published:true};
        var body='<form id="serviceForm"><div class="adm-field"><label>Service title *</label><input id="sfTitle" class="adm-input" maxlength="90" value="'+esc(x.title)+'" required></div><div class="adm-field"><label>Description *</label><textarea id="sfDesc" class="adm-input" maxlength="500" required>'+esc(x.description)+'</textarea></div><div class="adm-field"><label>Bootstrap icon class</label><input id="sfIcon" class="adm-input" value="'+esc(x.icon||"bi-code-slash")+'" placeholder="bi-code-slash"></div><div class="adm-field"><label>Features (one per line)</label><textarea id="sfFeatures" class="adm-input" rows="4">'+esc((x.features||[]).join("\n"))+'</textarea></div><label class="switch-row"><span><strong>Publish on website</strong></span><input id="sfPublished" type="checkbox"'+(x.published!==false?' checked':'')+'><i class="switch"></i></label><p class="auth-error" id="sfError"></p></form>';
        openModal(item?"Edit service":"Add service",body,'<button class="adm-btn" data-close>Cancel</button><button class="adm-btn primary" id="sfSave">Save service</button>');
        $("sfSave").addEventListener("click",async function(){var title=$("sfTitle").value.trim(),description=$("sfDesc").value.trim(),icon=$("sfIcon").value.trim()||"bi-code-slash";if(!title||!description){$("sfError").textContent="Enter a title and description.";return;}if(!/^bi-[a-z0-9-]+$/i.test(icon)){$("sfError").textContent="Use a Bootstrap icon class such as bi-code-slash.";return;}var btn=$("sfSave");btn.disabled=true;try{var current=Store.getServices();var saved=await SalemCloud.saveService({id:x.id,title:title,description:description,icon:icon,features:$("sfFeatures").value.split("\n").map(function(v){return v.trim();}).filter(Boolean),published:$("sfPublished").checked,sort_order:item?x.sort_order:current.length});closeModal();await hydrateCloud();refresh();toast("Service saved.");}catch(e){$("sfError").textContent=e.message;btn.disabled=false;}});
    }

    /* ================= MESSAGES ================= */

    var messageFilter = "all";
    var messageQuery = "";

    function renderMessages() {
        var all = Store.getMessages();

        if (all.some(function (m) { return !m.read; })) {
            $("topbarActions").innerHTML = '<button type="button" class="adm-btn" id="markAllBtn"><i class="bi bi-check2-all"></i><span>Mark all read</span></button>';
            $("markAllBtn").addEventListener("click", function () {
                Promise.all(all.map(function(m){return SalemCloud.setRead(m.id,true);})).then(function(){return hydrateCloud();}).then(refresh).catch(function(e){toast(e.message,"error");});
            });
        }

        var q = messageQuery.toLowerCase();
        var list = all.filter(function (m) {
            if (messageFilter === "unread" && m.read) return false;
            if (messageFilter === "read" && !m.read) return false;
            if (!q) return true;
            return (m.name + " " + m.email + " " + m.message + " " + m.service).toLowerCase().indexOf(q) !== -1;
        });

        var box = $("messageList");

        if (!list.length) {
            box.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><p>' +
                (all.length ? "No messages match this view." : "No messages yet. Enquiries from your contact form will show up here.") + "</p></div>";
            return;
        }

        box.innerHTML = list.map(function (m) {
            return '<button type="button" class="message-item' + (m.read ? "" : " unread") + '" data-id="' + esc(m.id) + '"><span class="dot"></span>' +
                '<span class="msg-body"><span class="msg-top"><span class="msg-name">' + esc(m.name || "Unknown") + "</span>" +
                (m.service ? '<span class="msg-service">' + esc(labelize(m.service).toUpperCase()) + "</span>" : "") +
                '</span><p class="msg-preview">' + esc(m.message) + '</p></span><span class="msg-date">' + esc(formatDate(m.date)) + "</span></button>";
        }).join("");
    }

    $("messageFilters").addEventListener("click", function (event) {
        var btn = event.target.closest("button[data-filter]");
        if (!btn) return;
        messageFilter = btn.dataset.filter;
        this.querySelectorAll("button").forEach(function (b) { b.classList.toggle("active", b === btn); });
        renderMessages();
    });

    $("messageSearch").addEventListener("input", function () { messageQuery = this.value.trim(); renderMessages(); });

    $("messageList").addEventListener("click", function (event) {
        var item = event.target.closest(".message-item");
        if (item) openMessage(item.dataset.id);
    });

    function openMessage(id) {
        var all = Store.getMessages();
        var m = all.find(function (x) { return x.id === id; });
        if (!m) return;

        if (!m.read) {
            m.read = true;
            SalemCloud.setRead(m.id,true).then(hydrateCloud).then(refresh).catch(function(e){toast(e.message,"error");});
        }

        var subject = encodeURIComponent("Re: your project enquiry");
        var quoted = encodeURIComponent("\n\n---\nOn " + formatFull(m.date) + ", " + m.name + " wrote:\n" + m.message);

        var body =
            '<div class="detail-grid">' +
            "<div><small>FROM</small><span>" + esc(m.name || "Unknown") + "</span></div>" +
            "<div><small>EMAIL</small><span>" + esc(m.email) + "</span></div>" +
            "<div><small>SERVICE</small><span>" + esc(labelize(m.service)) + "</span></div>" +
            "<div><small>RECEIVED</small><span>" + esc(formatFull(m.date)) + "</span></div>" +
            "<div><small>BUDGET</small><span>" + esc(labelize(m.budget)) + "</span></div>" +
            "<div><small>TIMELINE</small><span>" + esc(labelize(m.timeline)) + "</span></div></div>" +
            '<div class="detail-message">' + esc(m.message) + "</div>" +
            '<div class="adm-field mt-3"><label for="messageReply">Your reply (saved to this enquiry)</label><textarea id="messageReply" class="adm-input" rows="4" placeholder="Write your response...">' + esc(m.reply || "") + '</textarea></div>' +
            (m.reply ? '<p class="field-hint">Last reply saved ' + esc(formatFull(m.replied_at)) + '</p>' : '');

        openModal(
            "Message from " + (m.name || "Unknown"),
            body,
            '<button type="button" class="adm-btn danger left" id="msgDelete"><i class="bi bi-trash3"></i><span>Delete</span></button>' +
            '<button type="button" class="adm-btn" id="msgUnread"><i class="bi bi-envelope"></i><span>Mark unread</span></button>' +
            '<button type="button" class="adm-btn primary" id="saveReply"><i class="bi bi-save"></i><span>Save reply</span></button>' +
            (m.email ? '<a class="adm-btn" href="mailto:' + esc(m.email) + "?subject=" + subject + "&body=" + encodeURIComponent(m.reply || "") + '"><i class="bi bi-envelope-arrow-up"></i><span>Email saved reply</span></a>' : "")
        );

        $("saveReply").addEventListener("click", async function(){ var replyText=$("messageReply").value.trim(); if(!replyText){toast("Write a reply first.","error");return;} try{await SalemCloud.reply(id,replyText);await hydrateCloud();closeModal();refresh();toast("Reply saved to this enquiry.");}catch(e){toast(e.message,"error");} });

        $("msgUnread").addEventListener("click", function () {
            var list = Store.getMessages();
            var target = list.find(function (x) { return x.id === id; });
            if (target) target.read = false;
            Store.saveMessages(list);
            SalemCloud.setRead(id,false).then(hydrateCloud).then(function(){closeModal();refresh();}).catch(function(e){toast(e.message,"error");});
        });

        $("msgDelete").addEventListener("click", function () {
            confirmDialog("Delete message?", "This message will be permanently removed.", "Delete", function () {
                SalemCloud.deleteMessage(id).then(hydrateCloud).then(function(){toast("Message deleted.");refresh();}).catch(function(e){toast(e.message,"error");});
            });
        });
    }

    /* ================= SETTINGS ================= */

    function renderSettings() {
        var s = Store.getSettings();
        $("setAvailable").checked = !!s.available;
        $("setAvailableText").value = s.availableText;
        $("setUnavailableText").value = s.unavailableText;
        $("setEmail").value = s.email;
        $("setPhone").value = s.phone;
    }

    $("settingsForm").addEventListener("submit", function (event) {
        event.preventDefault();

        var email = $("setEmail").value.trim();

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast("That email address does not look right.", "error"); return; }

        var settings = {
            available: $("setAvailable").checked,
            availableText: $("setAvailableText").value.trim() || "Available for Projects",
            unavailableText: $("setUnavailableText").value.trim() || "Currently Booked",
            email: email,
            phone: $("setPhone").value.trim()
        };

        if (persist(Store.saveSettings(settings))) toast("Settings saved.");
    });

    $("passForm").addEventListener("submit", async function (event) {
        event.preventDefault(); var next=$("passNew").value;
        if(next.length<8){toast("Use at least 8 characters.","error");return;}
        if(next!==$("passNew2").value){toast("The passwords do not match.","error");return;}
        try{await SalemCloud.updatePassword(next);$("passForm").reset();toast("Account password updated.");}catch(e){toast(e.message,"error");}
    });

    /* ================= BACKUP ================= */

    function exportBackup() {
        var payload = {
            app: "amesi-portfolio-admin",
            version: 1,
            exportedAt: new Date().toISOString(),
            projects: Store.hasCustomProjects() ? Store.getProjects() : null,
            messages: Store.getMessages(),
            settings: Store.hasCustomSettings() ? Store.getSettings() : null
        };

        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "portfolio-backup-" + new Date().toISOString().slice(0, 10) + ".json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        toast("Backup downloaded.");
    }

    $("exportBtn").addEventListener("click", exportBackup);
    $("importBtn").addEventListener("click", function () { $("importFile").click(); });

    $("importFile").addEventListener("change", function () {
        var file = this.files[0];
        this.value = "";
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function () {
            var data;
            try { data = JSON.parse(reader.result); } catch (e) { toast("That file is not valid JSON.", "error"); return; }

            if (!data || data.app !== "amesi-portfolio-admin") { toast("This is not a backup from this admin page.", "error"); return; }
            if ((data.projects && !Array.isArray(data.projects)) || !Array.isArray(data.messages || [])) { toast("Backup file is damaged.", "error"); return; }

            confirmDialog("Import backup?", "This replaces your current projects, messages and settings with the ones in the file.", "Import", function () {
                var ok = true;
                if (data.projects) ok = Store.saveProjects(data.projects) && ok;
                ok = Store.saveMessages(data.messages || []) && ok;
                if (data.settings) ok = Store.saveSettings(data.settings) && ok;
                if (persist(ok)) { toast("Backup imported."); refresh(); }
            });
        };
        reader.readAsText(file);
    });

    $("resetProjectsBtn").addEventListener("click", function () {
        confirmDialog("Reset projects?", "Your edits are discarded and the original five projects come back.", "Reset", function () {
            Store.resetProjects();
            toast("Projects reset.");
            refresh();
        });
    });

    $("clearMessagesBtn").addEventListener("click", function () {
        confirmDialog("Clear all messages?", "Every message in the inbox will be permanently deleted.", "Clear all", function () {
            Promise.all(Store.getMessages().map(function(m){return SalemCloud.deleteMessage(m.id);})).then(hydrateCloud).then(function(){toast("Inbox cleared.");refresh();}).catch(function(e){toast(e.message,"error");});
        });
    });

    /* ================= START ================= */

    if (sessionStorage.getItem(SESSION_KEY) === "1") { $("authScreen").hidden=true; $("adminApp").hidden=false; route(); }
    else { showAuth(); }
})();
