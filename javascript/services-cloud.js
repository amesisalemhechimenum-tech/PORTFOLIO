(function () {
  "use strict";
  var grid = document.getElementById("serviceGrid");
  if (!grid || !window.SalemCloud || !SalemCloud.configured) return;
  var esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]; }); };
  SalemCloud.listServices().then(function (services) {
    if (!services.length) return; // Keep the designed starter cards until the owner publishes their first cloud service.
    grid.innerHTML = services.filter(function (s) { return s.published; }).map(function (s, i) {
      var features = (s.features || []).map(function (f) { return '<li><i class="bi bi-check2"></i> ' + esc(f) + '</li>'; }).join("");
      return '<div class="col-lg-6"><article class="service-card' + (i === 1 ? ' featured-service' : '') + '"><div class="service-top"><div class="service-icon"><i class="bi ' + esc(s.icon || 'bi-code-slash') + '"></i></div><span class="service-number">' + String(i + 1).padStart(2, '0') + '</span></div><h3>' + esc(s.title) + '</h3><p>' + esc(s.description) + '</p>' + (features ? '<ul>' + features + '</ul>' : '') + '<a href="contact.html" class="service-link page-link">Discuss this service <i class="bi bi-arrow-up-right"></i></a></article></div>';
    }).join("");
  }).catch(function (e) { console.warn("Could not load cloud services; showing built-in services.", e); });
})();
