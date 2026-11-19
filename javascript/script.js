/* MY JAVASCRIPT FILE */

document.addEventListener("DOMContentLoaded", function () {

    /* PAGE LOADER */
    const pageLoader = document.getElementById("pageLoader");

    function hideLoader() {
        if (!pageLoader) return;
        pageLoader.classList.add("hidden");
    }

    window.addEventListener("load", function () {
        setTimeout(hideLoader, 500);
    });

    // Safety fallback
    setTimeout(hideLoader, 2500);


    /* FALLING SNOW */
    const snowContainer = document.getElementById("snowContainer");

    function createSnow() {
        if (!snowContainer) return;

        snowContainer.innerHTML = "";

        const count = window.innerWidth <= 767 ? 40 : 80;

        for (let i = 0; i < count; i++) {
            const flake = document.createElement("span");
            flake.className = "snowflake";

            const size = Math.random() * 4 + 2;
            const left = Math.random() * 100;
            const duration = Math.random() * 12 + 8;
            const delay = Math.random() * -20;
            const opacity = Math.random() * 0.6 + 0.3;

            flake.style.width = size + "px";
            flake.style.height = size + "px";
            flake.style.left = left + "%";
            flake.style.opacity = opacity;
            flake.style.animationDuration = duration + "s";
            flake.style.animationDelay = delay + "s";

            snowContainer.appendChild(flake);
        }
    }

    createSnow();


    /* REBUILD SNOW ON RESIZE */
    let snowResizeTimer;

    window.addEventListener("resize", function () {
        clearTimeout(snowResizeTimer);
        snowResizeTimer = setTimeout(createSnow, 500);
    });


    /* FLOATING NAVIGATION */
    const navigation = document.getElementById("floatingNavigation");
    const toggle = document.getElementById("navToggle");
    const menu = document.getElementById("navMenu");

    if (navigation && toggle && menu) {

        let open = false;
        let dragging = false;
        let moved = false;
        let pointerId = null;

        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;

        // Tracks whether the user has manually dragged the navigation
        let hasBeenDragged = false;

        /* ---------------- CENTER NAVIGATION ---------------- */
        function centerNavigation() {
            const width = navigation.offsetWidth;
            const height = navigation.offsetHeight;

            const left = (window.innerWidth - width) / 2;
            const top = (window.innerHeight - height) / 2;

            navigation.style.left = left + "px";
            navigation.style.top = top + "px";
            navigation.style.right = "auto";
            navigation.style.bottom = "auto";
            navigation.style.transform = "none";
        }

        // Put the button exactly in the center when the page opens
        requestAnimationFrame(function () {
            centerNavigation();
        });

        /* ---------------- OPEN MENU ---------------- */
        function openMenu() {
            open = true;
            navigation.classList.add("open");
            toggle.setAttribute("aria-expanded", "true");
            toggle.setAttribute("aria-label", "Close navigation");
        }

        /* ---------------- CLOSE MENU ---------------- */
        function closeMenu() {
            open = false;
            navigation.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Open navigation");
        }

        /* ---------------- TOGGLE MENU ---------------- */
        function toggleMenu() {
            if (open) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        /* ---------------- POINTER DOWN ---------------- */
        toggle.addEventListener("pointerdown", function (event) {
            event.preventDefault();

            dragging = true;
            moved = false;
            pointerId = event.pointerId;

            startX = event.clientX;
            startY = event.clientY;

            const rect = navigation.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            try {
                toggle.setPointerCapture(event.pointerId);
            } catch (error) {}
        });

        /* ---------------- POINTER MOVE ---------------- */
        toggle.addEventListener("pointermove", function (event) {
            if (!dragging || event.pointerId !== pointerId) return;

            const moveX = event.clientX - startX;
            const moveY = event.clientY - startY;

            // Only count it as a drag after moving more than 6 pixels
            if (Math.abs(moveX) > 6 || Math.abs(moveY) > 6) {
                if (!moved) {
                    navigation.style.transform = "none";
                }
                moved = true;
                hasBeenDragged = true;
            }

            if (!moved) return;

            // Close the menu while physically dragging
            if (open) closeMenu();

            const width = navigation.offsetWidth;
            const height = navigation.offsetHeight;

            const maxLeft = window.innerWidth - width - 5;
            const maxTop = window.innerHeight - height - 5;

            let newLeft = startLeft + moveX;
            let newTop = startTop + moveY;

            // Prevent the button from leaving the screen
            newLeft = Math.max(5, Math.min(newLeft, maxLeft));
            newTop = Math.max(5, Math.min(newTop, maxTop));

            navigation.style.left = newLeft + "px";
            navigation.style.top = newTop + "px";
            navigation.style.right = "auto";
            navigation.style.bottom = "auto";
        });

        /* ---------------- POINTER UP ---------------- */
        toggle.addEventListener("pointerup", function (event) {
            if (event.pointerId !== pointerId) return;

            dragging = false;
            pointerId = null;

            try {
                toggle.releasePointerCapture(event.pointerId);
            } catch (error) {}

            // If the user did NOT drag, treat the action as a click
            if (!moved) {
                toggleMenu();
            }
        });

        /* ---------------- POINTER CANCEL ---------------- */
        toggle.addEventListener("pointercancel", function () {
            dragging = false;
            pointerId = null;
        });

        /* ---------------- CLOSE WHEN CLICKING OUTSIDE ---------------- */
        document.addEventListener("pointerdown", function (event) {
            if (!open) return;
            if (!navigation.contains(event.target)) {
                closeMenu();
            }
        });

        /* ---------------- ESCAPE KEY ---------------- */
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && open) {
                closeMenu();
            }
        });

        /* ---------------- KEEP BUTTON ON SCREEN ---------------- */
        window.addEventListener("resize", function () {
            // If never dragged, keep it centered
            if (!hasBeenDragged) {
                centerNavigation();
                return;
            }

            // If dragged, keep position but don't let it go off-screen
            const rect = navigation.getBoundingClientRect();
            const width = navigation.offsetWidth;
            const height = navigation.offsetHeight;

            let left = rect.left;
            let top = rect.top;

            left = Math.max(5, Math.min(left, window.innerWidth - width - 5));
            top = Math.max(5, Math.min(top, window.innerHeight - height - 5));

            navigation.style.left = left + "px";
            navigation.style.top = top + "px";
        });
    }

    /* ACTIVE NAVIGATION */
    const navItems = document.querySelectorAll(".floating-navigation .nav-item");

    let currentPage = window.location.pathname.split("/").pop().toLowerCase();
    if (currentPage === "") {
        currentPage = "index.html";
    }

    navItems.forEach(function (item) {
        const href = item.getAttribute("href");
        if (!href) return;

        const page = href.split("/").pop().toLowerCase();

        item.classList.remove("active");
        if (page === currentPage) {
            item.classList.add("active");
        }
    });

    /*  PAGE TRANSITION */
    const transition = document.getElementById("pageTransition");

    function goToPage(url, source) {
        if (!url) return;

        if (!transition) {
            window.location.href = url;
            return;
        }

        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;

        if (source) {
            const rect = source.getBoundingClientRect();
            x = rect.left + rect.width / 2;
            y = rect.top + rect.height / 2;
        }

        transition.style.setProperty("--transition-x", x + "px");
        transition.style.setProperty("--transition-y", y + "px");
        transition.classList.add("active");

        setTimeout(function () {
            window.location.href = url;
        }, 700);
    }

    /* NAVIGATION CLICK */
    navItems.forEach(function (item) {
        item.addEventListener("click", function (event) {
            const url = item.getAttribute("href");
            if (!url) return;

            event.preventDefault();

            navItems.forEach(function (nav) {
                nav.classList.remove("active");
            });
            item.classList.add("active");

            const navigation = document.getElementById("floatingNavigation");
            if (navigation) {
                navigation.classList.remove("open");
            }

            goToPage(url, item);
        });
    });

    /*  PAGE LINKS */
    const pageLinks = document.querySelectorAll("a.page-link");

    pageLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            const url = link.getAttribute("href");

            if (!url || url === "#" || url.startsWith("#")) return;

            if (
                link.target === "_blank" ||
                url.startsWith("http") ||
                url.startsWith("mailto:") ||
                url.startsWith("tel:")
            ) {
                return;
            }

            event.preventDefault();

            const navigation = document.getElementById("floatingNavigation");
            if (navigation) {
                navigation.classList.remove("open");
            }

            goToPage(url, link);
        });
    });

    /* SMOOTH ANCHORS */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function (event) {
            const id = link.getAttribute("href");
            if (!id || id === "#") return;

            const target = document.querySelector(id);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    /* PREVENT IMAGE DRAG */
    document.querySelectorAll("img").forEach(function (image) {
        image.setAttribute("draggable", "false");
    });

    /* CONTACT FORM
       Saves the enquiry for the admin inbox and, if a form endpoint
       is set in Admin > Settings, also sends it there. */
    document.querySelectorAll(".contact-form").forEach(function (form) {
        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const button = form.querySelector('button[type="submit"]');
            if (!button) return;

            const data = {};
            new FormData(form).forEach(function (value, key) {
                data[key] = String(value).trim();
            });

            const original = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="bi bi-hourglass-split"></i> Sending...';

            if (!window.SalemCloud || !SalemCloud.configured) {
                button.disabled = false;
                button.innerHTML = original;
                alert("The enquiry system is not connected yet. Please try again later or contact me by email.");
                return;
            }

            SalemCloud.createMessage(data).then(function () {
                button.innerHTML = '<i class="bi bi-check-circle-fill"></i> Message Sent';
                form.reset();
                setTimeout(function () { button.innerHTML = original; button.disabled = false; }, 3000);
            }).catch(function (error) {
                console.error("Enquiry submission failed:", error);
                button.disabled = false;
                button.innerHTML = original;
                alert("Your message could not be sent. Please check your connection and try again.");
            });
        });
    });

    /* SITE SETTINGS FROM ADMIN (availability, email, phone) */
    if (window.AmesiStore && AmesiStore.hasCustomSettings()) {
        const settings = AmesiStore.getSettings();
        const statusText = settings.available ? settings.availableText : settings.unavailableText;

        document.querySelectorAll(".availability-badge > span:last-child").forEach(function (el) {
            el.textContent = statusText;
        });

        document.querySelectorAll(".contact-badge").forEach(function (el) {
            el.innerHTML = '<i class="bi bi-circle-fill"></i> ' + AmesiStore.escape(statusText);
        });

        document.querySelectorAll(".availability-status").forEach(function (el) {
            el.innerHTML = "<span></span> " + AmesiStore.escape(statusText);
        });

        if (settings.email) {
            document.querySelectorAll('a[href^="mailto:"]').forEach(function (el) {
                el.setAttribute("href", "mailto:" + settings.email);
                const strong = el.querySelector("strong");
                if (strong) strong.textContent = settings.email;
            });
        }

        if (settings.phone) {
            document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
                el.setAttribute("href", "tel:" + settings.phone.replace(/[^\d+]/g, ""));
                const strong = el.querySelector("strong");
                if (strong) strong.textContent = settings.phone;
            });
        }
    }

    /* PROJECTS FROM ADMIN
       Only replaces the built-in cards once projects were saved in Admin. */
    const projectGrid = document.getElementById("projectGrid");

    if (projectGrid && window.AmesiStore && AmesiStore.hasCustomProjects()) {
        const esc = AmesiStore.escape;
        const projects = AmesiStore.getProjects().filter(function (project) {
            return project.published !== false;
        });

        projectGrid.innerHTML = projects.map(function (project, index) {
            const column = index < 2 ? "col-lg-6" : "col-lg-4";
            const featured = index === 0 ? " featured-project" : "";
            const number = String(index + 1).padStart(2, "0");

            const media = project.image
                ? '<div class="project-image"><img src="' + esc(project.image) + '" alt="' + esc(project.title) + '" loading="lazy">'
                : '<div class="project-image project-placeholder"><div class="placeholder-content"><i class="bi ' + esc(project.icon || "bi-folder-fill") + '"></i><span>' + esc(project.label) + '</span></div>';

            const external = /^https?:\/\//i.test(project.link || "");
            const overlay = project.image
                ? '<div class="project-overlay"><span>' + esc(project.label) + '</span>' +
                  (external
                      ? '<a href="' + esc(project.link) + '" target="_blank" rel="noopener" class="project-view" aria-label="Open project">'
                      : '<a href="contact.html" class="project-view page-link" aria-label="Discuss this project">') +
                  '<i class="bi bi-arrow-up-right"></i></a></div>'
                : "";

            const tags = (project.tags || []).map(function (tag) {
                return "<span>" + esc(tag) + "</span>";
            }).join("");

            return '<div class="' + column + '"><article class="project-card' + featured + '">' +
                media + overlay + "</div>" +
                '<div class="project-content"><div class="project-meta"><span>' + number + "</span><span>" + esc(project.category) + "</span></div>" +
                "<h3>" + esc(project.title) + "</h3><p>" + esc(project.description) + "</p>" +
                '<div class="project-tags">' + tags + "</div></div></article></div>";
        }).join("");

        /* Re-attach the page transition to the new internal links */
        projectGrid.querySelectorAll("a.page-link").forEach(function (link) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                goToPage(link.getAttribute("href"), link);
            });
        });
    }

    /* HIDDEN ADMIN ENTRY
       Triple-click the copyright line in the footer. */
    document.querySelectorAll(".site-footer p").forEach(function (line) {
        if (line.textContent.indexOf("\u00A9") === -1) return;

        line.addEventListener("click", function (event) {
            if (event.detail !== 3) return;

            const selection = window.getSelection();
            if (selection) selection.removeAllRanges();

            goToPage("admin.html", line);
        });
    });

    /* CERTIFICATE VIEWER (education page) */
    const certDialog = document.getElementById("certLightbox");

    if (certDialog && typeof certDialog.showModal === "function") {
        let certTrigger = null;

        document.querySelectorAll("[data-lightbox-open]").forEach(function (opener) {
            opener.addEventListener("click", function (event) {
                event.preventDefault();
                certTrigger = opener;
                document.body.style.overflow = "hidden";
                certDialog.showModal();
            });
        });

        // click on the dark area or the close button closes the viewer
        certDialog.addEventListener("click", function (event) {
            if (event.target === certDialog || event.target.closest("[data-lightbox-close]")) {
                certDialog.close();
            }
        });

        // runs for the close button, the Escape key and backdrop clicks
        certDialog.addEventListener("close", function () {
            document.body.style.overflow = "";
            if (certTrigger) certTrigger.focus();
        });
    }

    /* PAGE READY */
    document.body.classList.add("page-ready");

});