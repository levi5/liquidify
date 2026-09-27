"use strict";
(function() {
  window.liquidify = window.liquidify || window.liquidx || {};
  window.liquidx = window.liquidify;
  window.liquidify[''] = {};
  const scope = window.liquidify[''];
const translate = (key, fallback) => {
  const i18n = window.LiquidifyTheme?.i18n;
  return i18n?.[key] || fallback;
};
const rootUrl = () => {
  const root = window.Shopify?.routes?.root || window.LiquidifyTheme?.root || "/";
  return root.endsWith("/") ? root : `${root}/`;
};
const addItem = async (id, quantity) => {
  const response = await fetch(`${rootUrl()}cart/add.js`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      id,
      quantity
    })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.description || data.message || translate("theme_add_error", "Could not add. Try again."));
  }
  return response.json();
};
const announcementCleanup = /* @__PURE__ */ new WeakMap();
function prepareAnnouncements(root) {
  root.querySelectorAll("[data-announcement]").forEach((bar) => {
    if (announcementCleanup.has(bar)) return;
    const messages = Array.from(bar.querySelectorAll("[data-announcement-message]")).filter((item) => item.textContent?.trim());
    if (messages.length < 2) return;
    let index = 0;
    let paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hovered = false;
    const pause = bar.querySelector("[data-announcement-pause]");
    const show = (step) => {
      index = (index + step + messages.length) % messages.length;
      messages.forEach((message, position) => {
        message.hidden = position !== index;
      });
    };
    const updatePause = () => {
      if (!pause) return;
      pause.textContent = paused ? "\u25B6" : "\u2161";
      pause.setAttribute("aria-pressed", String(paused));
      pause.setAttribute("aria-label", paused ? translate("theme_play_announcements", "Play announcements") : translate("theme_pause_announcements", "Pause announcements"));
    };
    const next = () => show(1);
    const previous = () => show(-1);
    const toggle = () => {
      paused = !paused;
      updatePause();
    };
    const enter = () => {
      hovered = true;
    };
    const leave = () => {
      hovered = false;
    };
    bar.querySelector("[data-announcement-next]")?.addEventListener("click", next);
    bar.querySelector("[data-announcement-prev]")?.addEventListener("click", previous);
    pause?.addEventListener("click", toggle);
    bar.addEventListener("pointerenter", enter);
    bar.addEventListener("pointerleave", leave);
    updatePause();
    const timer = window.setInterval(() => {
      if (!paused && !hovered && !document.hidden && !bar.matches(":focus-within")) show(1);
    }, 4500);
    announcementCleanup.set(bar, () => {
      clearInterval(timer);
      bar.querySelector("[data-announcement-next]")?.removeEventListener("click", next);
      bar.querySelector("[data-announcement-prev]")?.removeEventListener("click", previous);
      pause?.removeEventListener("click", toggle);
      bar.removeEventListener("pointerenter", enter);
      bar.removeEventListener("pointerleave", leave);
      announcementCleanup.delete(bar);
    });
  });
}
const benefitsCleanup = /* @__PURE__ */ new WeakMap();
function prepareBenefits(root) {
  root.querySelectorAll("[data-benefits-carousel]").forEach((wrapper) => {
    if (benefitsCleanup.has(wrapper)) return;
    const track = wrapper.querySelector("[data-benefits-track]");
    const prev = wrapper.querySelector("[data-benefits-prev]");
    const next = wrapper.querySelector("[data-benefits-next]");
    if (!track) return;
    const update = () => {
      const {
        scrollLeft,
        scrollWidth,
        clientWidth
      } = track;
      const maxScroll = scrollWidth - clientWidth;
      const overflow = scrollWidth > clientWidth + 2;
      track.style.justifyContent = overflow ? "flex-start" : "space-between";
      prev?.classList.toggle("hidden", !overflow || scrollLeft <= 0);
      next?.classList.toggle("hidden", !overflow || scrollLeft >= maxScroll - 2);
    };
    const step = () => track.clientWidth * 0.8;
    const onPrev = () => track.scrollBy({
      left: -step(),
      behavior: "smooth"
    });
    const onNext = () => track.scrollBy({
      left: step(),
      behavior: "smooth"
    });
    prev?.addEventListener("click", onPrev);
    next?.addEventListener("click", onNext);
    track.addEventListener("scroll", update, {
      passive: true
    });
    window.addEventListener("resize", update);
    update();
    benefitsCleanup.set(wrapper, () => {
      prev?.removeEventListener("click", onPrev);
      next?.removeEventListener("click", onNext);
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      benefitsCleanup.delete(wrapper);
    });
  });
}
function prepare(root = document) {
  root.querySelectorAll("select[data-selected]").forEach((select) => {
    select.value = select.dataset.selected || select.options[0]?.value || "";
  });
  prepareAnnouncements(root);
  prepareBenefits(root);
}
prepare();
document.addEventListener("shopify:section:load", (event) => prepare(event.target));
document.addEventListener("shopify:section:unload", (event) => {
  const section = event.target;
  if (!section) return;
  section.querySelectorAll("[data-announcement]").forEach((bar) => announcementCleanup.get(bar)?.());
  section.querySelectorAll("[data-benefits-carousel]").forEach((wrapper) => benefitsCleanup.get(wrapper)?.());
});
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!form.matches("[data-quick-add]")) return;
  event.preventDefault();
  if (form.dataset.pending) return;
  const button = form.querySelector("button[type=submit]");
  const message = form.querySelector(".quick-add-message");
  const id = Number(new FormData(form).get("id"));
  if (!id) return;
  form.dataset.pending = "true";
  button.disabled = true;
  message.textContent = translate("theme_adding", "Adding\u2026");
  try {
    const cart = await addItem(id, 1);
    message.textContent = translate("theme_added_to_bag", "Added to your bag.");
    window.dispatchEvent(new CustomEvent("cart:updated", {
      detail: {
        action: "add",
        id,
        cart
      }
    }));
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : translate("theme_add_error", "Could not add. Try again.");
  } finally {
    delete form.dataset.pending;
    button.disabled = false;
  }
});

  scope.translate = translate;
  scope.rootUrl = rootUrl;
  scope.addItem = addItem;
  scope.announcementCleanup = announcementCleanup;
  scope.prepareAnnouncements = prepareAnnouncements;
  scope.benefitsCleanup = benefitsCleanup;
  scope.prepareBenefits = prepareBenefits;
  scope.prepare = prepare;
})();