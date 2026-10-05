(function () {
  var config = window.MOTOGO_CONFIG || {};

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

  function closeNav() {
    if (!toggle || !nav) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
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

  setLink("[data-instagram-slot]", config.instagramUrl, "Открыть профиль");

  var phoneSlot = document.querySelector("[data-phone-value]");
  if (phoneSlot && config.phoneDisplay) {
    if (config.phoneHref) {
      var phoneLink = document.createElement("a");
      phoneLink.href = config.phoneHref;
      phoneLink.textContent = config.phoneDisplay;
      phoneSlot.replaceChildren(phoneLink);
    } else {
      phoneSlot.textContent = config.phoneDisplay;
    }
  }

  var messengerSlot = document.querySelector("[data-messenger-value]");
  if (messengerSlot && config.messengerUrl) {
    var messengerLink = document.createElement("a");
    messengerLink.href = config.messengerUrl;
    messengerLink.target = "_blank";
    messengerLink.rel = "noopener noreferrer";
    messengerLink.textContent = config.messengerLabel || "Написать";
    messengerSlot.replaceChildren(messengerLink);
  }

  function youtubeId(url) {
    var match = String(url || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return match ? match[1] : "";
  }

  var videoTrigger = document.querySelector("[data-video-trigger]");
  var videoId = youtubeId(config.youtubeUrl);

  if (videoTrigger) {
    var videoBox = videoTrigger.closest(".video");
    var poster = videoBox ? videoBox.querySelector("img") : null;

    if (videoId && poster) {
      poster.src = "https://i.ytimg.com/vi/" + videoId + "/maxresdefault.jpg";
    }

    if (!videoId) {
      videoTrigger.title = "Ссылку на ролик добавьте в js/config.js";
    }

    videoTrigger.addEventListener("click", function () {
      if (!videoId || !videoBox) return;

      if (window.location.protocol === "file:") {
        window.open("https://www.youtube.com/watch?v=" + videoId, "_blank", "noopener");
        return;
      }

      var frame = document.createElement("iframe");
      frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      frame.src = "https://www.youtube.com/embed/" + videoId + "?autoplay=1&rel=0";
      frame.title = "Видео Ярослава: как MotoGO проверяет автомобиль из США до покупки";
      frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      videoBox.replaceChildren(frame);
    });
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

  document.querySelectorAll("[data-lead-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (fieldValue(form, "website")) return;

      var payload = {
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
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (!response.ok) throw new Error("crm");
          setStatus(form, "ok", "Расчёт ушёл менеджеру. Он свяжется с вами.");
          form.reset();
        })
        .catch(function () {
          setStatus(form, "error", "Расчёт не отправился. Попробуйте ещё раз.");
        })
        .finally(function () {
          if (submit) submit.disabled = false;
        });
    });
  });
})();
