(function () {
  var config = window.AUTOGO_CONFIG || {};

  if (window.history && window.history.replaceState && /\/index\.html$/i.test(window.location.pathname)) {
    var cleanPath = window.location.pathname.replace(/index\.html$/i, "");
    window.history.replaceState(null, "", cleanPath + window.location.search + window.location.hash);
  }

  var yearNode = document.querySelector("[data-year]");
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());

  var header = document.querySelector(".header");
  var hero = document.querySelector(".hero");

  function syncHeader() {
    if (!header || !hero) return;
    var sheet = hero.querySelector(".hero__sheet");
    var mark = sheet || hero;
    var edge = mark.getBoundingClientRect().top + window.scrollY;
    header.classList.toggle("is-hero", window.scrollY + header.offsetHeight < edge);
  }

  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  function setToggle(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Меню");
  }

  function closeNav() {
    if (!toggle || !nav) return;
    nav.classList.remove("is-open");
    setToggle(false);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      setToggle(open);
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav();
    });
  }

  document.querySelectorAll(".faq__button").forEach(function (button) {
    button.addEventListener("click", function () {
      var panel = document.getElementById(button.getAttribute("aria-controls"));
      var willOpen = button.getAttribute("aria-expanded") !== "true";

      document.querySelectorAll(".faq__button").forEach(function (other) {
        var otherPanel = document.getElementById(other.getAttribute("aria-controls"));
        other.setAttribute("aria-expanded", "false");
        if (otherPanel) otherPanel.hidden = true;
      });

      button.setAttribute("aria-expanded", willOpen ? "true" : "false");
      if (panel) panel.hidden = !willOpen;
    });
  });

  function setLink(selector, url, label) {
    var slot = document.querySelector(selector);
    if (!slot || !url) return;
    var link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    slot.replaceChildren(link);
  }

  if (config.instagramUrl) {
    setLink("[data-instagram-slot]", config.instagramUrl, "Instagram");
  }

  if (config.tiktokUrl) {
    setLink("[data-tiktok-slot]", config.tiktokUrl, "TikTok");
  }

  var phoneSlot = document.querySelector("[data-phone-value]");
  var phoneRow = document.querySelector("[data-phone-row]");
  if (phoneSlot && config.phoneDisplay) {
    if (config.phoneHref) {
      var phoneLink = document.createElement("a");
      phoneLink.href = config.phoneHref;
      phoneLink.textContent = config.phoneDisplay;
      phoneSlot.replaceChildren(phoneLink);
    } else {
      phoneSlot.textContent = config.phoneDisplay;
    }
    if (phoneRow) phoneRow.hidden = false;
  }

  var messengerSlot = document.querySelector("[data-messenger-value]");
  var messengerRow = document.querySelector("[data-messenger-row]");
  if (messengerSlot && config.messengerUrl) {
    var messengerLink = document.createElement("a");
    messengerLink.href = config.messengerUrl;
    messengerLink.target = "_blank";
    messengerLink.rel = "noopener noreferrer";
    messengerLink.textContent = config.messengerLabel || "Написать";
    messengerSlot.replaceChildren(messengerLink);
    if (messengerRow) messengerRow.hidden = false;
  }

  function youtubeId(url) {
    var match = String(url || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return match ? match[1] : "";
  }

  var reel = document.querySelector("[data-reel]");
  var track = document.querySelector("[data-reel-track]");
  var videos = Array.isArray(config.videos) ? config.videos.filter(function (item) { return item && item.id; }) : [];

  if (!videos.length && config.youtubeUrl) {
    var onlyId = youtubeId(config.youtubeUrl);
    if (onlyId) videos = [{ id: onlyId, title: "Ролик Ярослава" }];
  }

  if (reel && track && videos.length) {
    videos.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "video";

      var poster = document.createElement("img");
      poster.alt = "";
      poster.width = 1280;
      poster.height = 720;
      poster.src = "https://i.ytimg.com/vi/" + item.id + "/maxresdefault.jpg";
      poster.addEventListener("error", function () {
        poster.src = "https://i.ytimg.com/vi/" + item.id + "/hqdefault.jpg";
      });

      var play = document.createElement("button");
      play.className = "video__play";
      play.type = "button";
      play.setAttribute("data-video-id", item.id);
      var playText = document.createElement("span");
      playText.className = "visually-hidden";
      playText.textContent = "Смотреть: " + (item.title || "ролик");
      play.appendChild(playText);

      var caption = document.createElement("p");
      caption.className = "video__caption";
      caption.textContent = item.title || "";

      card.appendChild(poster);
      card.appendChild(play);
      card.appendChild(caption);
      track.appendChild(card);
    });

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var paused = false;
    var playing = false;
    var timer = 0;
    var drag = null;
    var suppressClick = false;

    function cardStep() {
      var card = track.querySelector(".video");
      if (!card) return track.clientWidth;
      var styles = getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap) || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function advance() {
      var max = track.scrollWidth - track.clientWidth - 8;
      var next = track.scrollLeft + cardStep();
      track.scrollTo({
        left: next > max ? 0 : next,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    }

    function arm() {
      window.clearInterval(timer);
      if (reduceMotion || paused || playing || videos.length < 2 || document.hidden) return;
      timer = window.setInterval(advance, 4800);
    }

    function playVideo(button) {
      var id = button.getAttribute("data-video-id");
      var box = button.closest(".video");
      if (!id || !box) return;
      playing = true;
      arm();

      if (window.location.protocol === "file:") {
        window.open("https://www.youtube.com/watch?v=" + id, "_blank", "noopener");
        return;
      }

      var frame = document.createElement("iframe");
      frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      frame.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&rel=0";
      frame.title = button.textContent.trim() || "Ролик Ярослава";
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      box.replaceChildren(frame);
    }

    track.addEventListener("click", function (event) {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      var button = event.target.closest("[data-video-id]");
      if (button) playVideo(button);
    });

    track.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      drag = { x: event.clientX, left: track.scrollLeft, moved: false, id: event.pointerId };
      track.classList.add("is-dragging");
      paused = true;
      arm();
    });

    track.addEventListener("pointermove", function (event) {
      if (!drag || drag.id !== event.pointerId) return;
      var dx = event.clientX - drag.x;
      if (Math.abs(dx) > 6) drag.moved = true;
      if (drag.moved) track.scrollLeft = drag.left - dx;
    });

    function endDrag(event) {
      if (!drag || (event && drag.id !== event.pointerId)) return;
      suppressClick = drag.moved;
      drag = null;
      track.classList.remove("is-dragging");
      paused = false;
      arm();
    }

    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);

    track.addEventListener("mouseenter", function () {
      paused = true;
      arm();
    });
    track.addEventListener("mouseleave", function () {
      if (!drag) {
        paused = false;
        arm();
      }
    });
    track.addEventListener("focusin", function () {
      paused = true;
      arm();
    });
    track.addEventListener("focusout", function () {
      paused = false;
      arm();
    });

    track.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      track.scrollBy({
        left: (event.key === "ArrowRight" ? 1 : -1) * cardStep(),
        behavior: reduceMotion ? "auto" : "smooth"
      });
    });

    document.addEventListener("visibilitychange", arm);
    arm();
  }

  function fieldValue(form, name) {
    var field = form.elements[name];
    return field ? String(field.value || "").trim() : "";
  }

  function setStatus(form, state, message) {
    var status = form.querySelector("[data-status]");
    if (!status) return;
    status.dataset.state = state;
    status.textContent = message;
  }

  function showThanks(form) {
    form.classList.add("is-sent");
    var body = form.querySelector(".form__body");
    var thanks = form.querySelector("[data-form-thanks]");
    if (body) body.inert = true;
    if (!thanks) return;
    thanks.hidden = false;
    var title = thanks.querySelector("h2");
    if (!title) return;
    title.tabIndex = -1;
    title.focus();
  }

  function showForm(form) {
    form.classList.remove("is-sent");
    var body = form.querySelector(".form__body");
    var thanks = form.querySelector("[data-form-thanks]");
    if (thanks) thanks.hidden = true;
    if (body) body.inert = false;
    setStatus(form, "", "");
    var name = form.elements.name;
    if (name) name.focus();
  }

  document.querySelectorAll("[data-lead-form]").forEach(function (form) {
    var again = form.querySelector("[data-form-again]");
    if (again) {
      again.addEventListener("click", function () {
        showForm(form);
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (fieldValue(form, "website")) return;

      var payload = {
        token: config.crmToken || "",
        name: fieldValue(form, "name"),
        phone: fieldValue(form, "phone"),
        budget: fieldValue(form, "budget"),
        kind: fieldValue(form, "kind"),
        comment: fieldValue(form, "comment"),
        source: form.getAttribute("data-source") || "site",
        page: window.location.href,
        sentAt: new Date().toISOString()
      };

      if (!payload.name || !payload.phone) {
        setStatus(form, "error", "Укажите имя и телефон.");
        return;
      }

      if (form.getAttribute("data-require") === "budget" && !payload.budget) {
        setStatus(form, "error", "Укажите бюджет. Без него расчёт не собрать.");
        return;
      }

      var submit = form.querySelector("[type='submit']");
      if (submit) submit.disabled = true;

      if (!config.crmEndpoint) {
        setStatus(
          form,
          "ok",
          "Расчёт собран. Менеджер его не получит, пока в js/config.js пустой адрес CRM."
        );
        form.reset();
        if (submit) submit.disabled = false;
        return;
      }

      fetch(config.crmEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      })
        .then(function () {
          showThanks(form);
        })
        .catch(function () {
          setStatus(form, "error", "Расчёт не отправился. Попробуйте ещё раз.");
        })
        .finally(function () {
          if (submit) submit.disabled = false;
        });
    });
  });

  var cookie = document.querySelector("[data-cookie]");
  if (cookie) {
    var accepted = false;
    try {
      accepted = localStorage.getItem("autogo-cookies") === "1";
    } catch (error) {
      accepted = false;
    }

    if (!accepted) cookie.hidden = false;

    var accept = cookie.querySelector("[data-cookie-ok]");
    if (accept) {
      accept.addEventListener("click", function () {
        try {
          localStorage.setItem("autogo-cookies", "1");
        } catch (error) {
          accepted = true;
        }
        cookie.hidden = true;
      });
    }
  }

  var promo = document.querySelector("[data-promo]");
  if (promo) {
    var sheet = promo.querySelector(".promo__sheet");
    var pin = document.querySelector("[data-promo-pin]");

    function closePromo(focusPin) {
      promo.hidden = true;
      if (pin) pin.hidden = false;
      if (focusPin && pin) pin.focus();
    }

    function openPromo() {
      if (!promo.hidden) return;
      promo.hidden = false;
      if (pin) pin.hidden = true;
      var closeButton = promo.querySelector("[data-promo-close]");
      if (closeButton) closeButton.focus();
    }

    openPromo();

    promo.addEventListener("click", function (event) {
      if (event.target === promo || event.target.closest("[data-promo-close]")) closePromo(true);
    });

    if (pin) pin.addEventListener("click", openPromo);

    var pick = promo.querySelector("[data-promo-pick]");
    if (pick) {
      pick.addEventListener("click", function (event) {
        event.preventDefault();
        closePromo(false);
        var input = document.querySelector('#hero [name="name"]');
        if (!input) return;
        input.scrollIntoView({ block: "center" });
        input.focus();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (promo.hidden) return;
      if (event.key === "Escape") {
        closePromo(true);
        return;
      }
      if (event.key !== "Tab" || !sheet) return;
      var nodes = sheet.querySelectorAll("a, button");
      if (!nodes.length) return;
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

  }
})();
