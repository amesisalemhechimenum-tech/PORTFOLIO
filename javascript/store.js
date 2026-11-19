/* SHARED DATA STORE
   Used by the public pages and by the admin page.
   Everything is saved in this browser's localStorage. */

(function (w) {
    "use strict";

    var KEYS = {
        projects: "amesi_projects",
        messages: "amesi_messages",
        services: "amesi_services",
        settings: "amesi_settings"
    };

    var DEFAULT_SETTINGS = {
        available: true,
        availableText: "Available for Projects",
        unavailableText: "Currently Booked",
        email: "",
        phone: "",
        formEndpoint: ""
    };

    /* The five projects that are already on projects.html */
    var DEFAULT_PROJECTS = [
        {
            id: "p1",
            title: "Business Digital Presence",
            label: "WEB DEVELOPMENT",
            category: "Business Website",
            description: "A professional website concept focused on presenting a business clearly, building trust and helping visitors take action.",
            tags: ["HTML", "CSS", "Bootstrap", "Responsive"],
            image: "../images/project1.jpg",
            icon: "",
            link: "",
            published: true
        },
        {
            id: "p2",
            title: "Personal Portfolio Experience",
            label: "PERSONAL BRAND",
            category: "Portfolio",
            description: "A modern portfolio concept designed to showcase skills, projects, experience and personality in one memorable place.",
            tags: ["HTML", "CSS", "JavaScript", "UI"],
            image: "../images/project2.jpg",
            icon: "",
            link: "",
            published: true
        },
        {
            id: "p3",
            title: "Product Launch Page",
            label: "LANDING PAGE",
            category: "Landing Page",
            description: "A focused landing page concept built around clear messaging, visual hierarchy and strong calls to action.",
            tags: ["HTML", "CSS", "Bootstrap"],
            image: "../images/project3.jpg",
            icon: "",
            link: "",
            published: true
        },
        {
            id: "p4",
            title: "SALEM FX Experience",
            label: "SALEM FX",
            category: "Trading",
            description: "A digital concept around my journey as a forex trader, combining market analysis, personal branding and technology.",
            tags: ["Trading", "Branding", "Web"],
            image: "../images/project4.jpg",
            icon: "",
            link: "",
            published: true
        },
        {
            id: "p5",
            title: "Cybersecurity Lab",
            label: "CYBERSECURITY",
            category: "Security",
            description: "A learning project focused on exploring cybersecurity concepts, digital security and practical security thinking.",
            tags: ["Security", "Linux", "Networks"],
            image: "",
            icon: "bi-shield-lock-fill",
            link: "",
            published: true
        }
    ];

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function read(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function write(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    function uid(prefix) {
        return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    w.AmesiStore = {
        KEYS: KEYS,
        uid: uid,

        /* PROJECTS */
        hasCustomProjects: function () {
            return Array.isArray(read(KEYS.projects, null));
        },
        getProjects: function () {
            var saved = read(KEYS.projects, null);
            return Array.isArray(saved) ? saved : clone(DEFAULT_PROJECTS);
        },
        saveProjects: function (list) {
            return write(KEYS.projects, list);
        },
        resetProjects: function () {
            try { localStorage.removeItem(KEYS.projects); } catch (error) {}
        },

        /* SERVICES */
        getServices: function () { var saved = read(KEYS.services, []); return Array.isArray(saved) ? saved : []; },
        saveServices: function (list) { return write(KEYS.services, list); },

        /* MESSAGES */
        getMessages: function () {
            var saved = read(KEYS.messages, []);
            return Array.isArray(saved) ? saved : [];
        },
        saveMessages: function (list) {
            return write(KEYS.messages, list);
        },
        addMessage: function (data) {
            var list = this.getMessages();
            list.unshift({
                id: uid("m"),
                name: data.name || "",
                email: data.email || "",
                service: data.service || "",
                budget: data.budget || "",
                timeline: data.timeline || "",
                message: data.message || "",
                date: new Date().toISOString(),
                read: false
            });
            return write(KEYS.messages, list.slice(0, 500));
        },

        /* SETTINGS */
        hasCustomSettings: function () {
            return read(KEYS.settings, null) !== null;
        },
        getSettings: function () {
            var saved = read(KEYS.settings, {});
            return Object.assign({}, DEFAULT_SETTINGS, saved || {});
        },
        saveSettings: function (settings) {
            return write(KEYS.settings, settings);
        },

        /* HELPERS */
        escape: function (value) {
            return String(value == null ? "" : value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        },
        usedBytes: function () {
            var total = 0;
            try {
                for (var i = 0; i < localStorage.length; i++) {
                    var key = localStorage.key(i);
                    if (key && key.indexOf("amesi_") === 0) {
                        total += (key.length + (localStorage.getItem(key) || "").length) * 2;
                    }
                }
            } catch (error) {}
            return total;
        }
    };
})(window);
