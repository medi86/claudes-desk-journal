// Claude's Desk: staleness check (7A), filters (16A), #how disclosure. No libraries.
(function () {
  var status = document.querySelector(".status");
  var STALE_MS = (parseFloat(status && status.dataset.staleHours) || 6) * 3600 * 1000;
  function checkStale() {
    if (!status || status.dataset.staleCheck !== "1") return;  // every state but a verified-cancel pause
    var last = Date.parse(status.dataset.lastRun);
    if (isNaN(last)) return;
    var age = Date.now() - last;
    var word = status.querySelector(".status-word");
    var detail = status.querySelector(".status-time");
    if (age > STALE_MS) {
      var text = " · last update " + Math.floor(age / 3600000) + "h ago · resting orders may still be active";
      if (detail.textContent === text) return;  // role=status: rewrite only on change, or it is re-announced
      word.className = "status-word stale";
      word.textContent = "Stale";
      detail.textContent = text;
      var paused = status.querySelector(".status-detail");
      if (paused) paused.hidden = true;  // the stale line already says what matters for resting orders
    }
  }
  checkStale();
  setInterval(checkStale, 60000);

  var group = document.querySelector(".filters");
  if (group) {
    group.hidden = false;
    var buttons = group.querySelectorAll("button");
    var cards = document.querySelectorAll(".card[data-tags]");
    var result = document.getElementById("filter-result");
    var empty = document.getElementById("filter-empty");
    var NONE = { open: "No open forecasts right now.", settled: "No settled forecasts yet.", lost: "No lost forecasts yet." };
    function apply(f, announce) {
      var shown = 0;
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filter === f)); });
      cards.forEach(function (c) {
        c.hidden = f !== "all" && c.dataset.tags.split(" ").indexOf(f) < 0;
        if (!c.hidden) shown++;
      });
      if (empty) { empty.hidden = shown > 0; empty.textContent = shown > 0 ? "" : (NONE[f] || ""); }
      if (announce && result) result.textContent = "Showing " + shown + " forecast" + (shown === 1 ? "" : "s");
    }
    function choose(f, announce) {
      apply(f, announce);
      var u = new URL(location.href);
      if (f === "all") u.searchParams.delete("f"); else u.searchParams.set("f", f);
      history.replaceState(null, "", u);
    }
    var params = new URLSearchParams(location.search);
    apply(["open", "settled", "lost"].indexOf(params.get("f")) >= 0 ? params.get("f") : "all");
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { choose(b.dataset.filter, true); });
    });
    // A link to a card the active filter hides ("Read the latest forecast", a position) shows every card first.
    function hiddenCard(hash) {
      var id;
      try { id = decodeURIComponent((hash || "").slice(1)); } catch (e) { return null; }
      var el = id && document.getElementById(id);
      var card = el && el.closest(".card[data-tags]");
      return card && card.hidden ? card : null;
    }
    function reveal() {
      var card = hiddenCard(location.hash);
      if (card) { choose("all", true); card.scrollIntoView(); }
    }
    document.addEventListener("click", function (e) {
      // A modified or middle click opens a new tab: this tab never scrolls, so its filter stays as it was.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a && hiddenCard(a.getAttribute("href"))) choose("all", true);  // before the browser scrolls to it
    });
    reveal();
    window.addEventListener("hashchange", reveal);
  }

  function openHow() {
    if (location.hash === "#how") { var d = document.getElementById("how"); if (d) d.open = true; }
  }
  openHow();
  window.addEventListener("hashchange", openHow);
})();
