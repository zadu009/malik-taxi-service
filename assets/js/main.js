(function () {
  "use strict";

  /* ---------- Header scroll state ---------- */
  const header = document.getElementById("siteHeader");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");
  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        mobileNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      })
    );
  }

  /* ---------- Scroll-driven hero morph (desktop only) ---------- */
  const mediaPin = document.getElementById("mediaPin");
  const mediaSlot = document.getElementById("mediaSlot");
  const taxiVideo = document.getElementById("taxiVideoSource");
  const taxiCanvas = document.getElementById("taxiIllustration");
  const taxiCtx = taxiCanvas ? taxiCanvas.getContext("2d") : null;

  // The clip has a solid black background (MP4/H.264 carries no alpha channel). Rather than
  // a CSS blend trick (which also washes out the taxi's dark paintwork), each seeked frame is
  // drawn to canvas and only the genuinely black pixels are keyed out to transparent — the
  // "max channel" test keeps dark-but-colored bodywork intact while dropping true black.
  function drawKeyedFrame() {
    if (!taxiCtx || !taxiVideo.videoWidth) return;
    taxiCtx.drawImage(taxiVideo, 0, 0, taxiCanvas.width, taxiCanvas.height);
    const frame = taxiCtx.getImageData(0, 0, taxiCanvas.width, taxiCanvas.height);
    const d = frame.data;
    const threshold = 24;
    for (let i = 0; i < d.length; i += 4) {
      const lum = Math.max(d[i], d[i + 1], d[i + 2]);
      if (lum < threshold) {
        d[i + 3] = 0;
      } else if (lum < threshold * 2) {
        d[i + 3] = Math.round(((lum - threshold) / threshold) * 255);
      }
    }
    taxiCtx.putImageData(frame, 0, 0);
  }
  if (taxiVideo) taxiVideo.addEventListener("seeked", drawKeyedFrame);
  const pinTrack = document.querySelector(".pin-track");
  const introSection = document.querySelector(".intro");
  const serviceItems = gsap.utils.toArray(".service-item");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = () => window.innerWidth > 980;

  // The door motion itself only spans t=1.9 (open) to t=2.3 (closed) in the source clip —
  // everything outside that window is a static hold (open at the very start, closed for the
  // rest of the clip). Scrubbing the full clip duration squeezed that ~0.4s of real motion
  // into a small slice of the scroll range, which read as a late, sudden snap. Instead the
  // scroll range is mapped 1:1 onto just that window, backwards, so it opens gradually across
  // the whole scroll (and closes again on the way back up).
  const DOOR_OPEN_T = 1.9;
  const DOOR_CLOSED_T = 2.35;
  let videoDuration = 0;
  if (taxiVideo) {
    taxiVideo.addEventListener("loadedmetadata", () => {
      videoDuration = taxiVideo.duration || 0;
      if (taxiCanvas) {
        taxiCanvas.width = taxiVideo.videoWidth;
        taxiCanvas.height = taxiVideo.videoHeight;
      }
      // Chrome/Safari only repaint a <video> on currentTime changes once playback has
      // actually started at least once; without this, every scrubbed seek is silently
      // ignored visually. Priming with a muted play/pause forces the decoder to engage.
      const primed = taxiVideo.play();
      const settle = () => {
        taxiVideo.pause();
        taxiVideo.currentTime = DOOR_CLOSED_T;
      };
      if (primed && typeof primed.then === "function") {
        primed.then(settle).catch(() => {});
      } else {
        settle();
      }
    });
  }

  if (window.gsap && window.ScrollTrigger && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    let triggers = [];

    function killTriggers() {
      triggers.forEach((t) => t.kill());
      triggers = [];
      gsap.set(mediaPin, { clearProps: "all" });
      if (taxiVideo) taxiVideo.currentTime = DOOR_CLOSED_T;
    }

    function buildDesktopScroll() {
      if (!mediaSlot || !pinTrack || !introSection) return;

      const MORPH_DISTANCE = 250;

      // The media panel is CSS `position: fixed` at all times (always "pinned" to the
      // viewport). ScrollTrigger drives its geometry: full-bleed at the top of the hero,
      // morphing into the 50vw showcase panel over the first MORPH_DISTANCE px, then
      // holding steady while the services section scrolls past it. It is naturally
      // covered by the closing section afterwards (that section paints above it, z-index-wise).
      const morphST = ScrollTrigger.create({
        trigger: introSection,
        start: "top top",
        end: `+=${MORPH_DISTANCE}`,
        scrub: true,
        onUpdate: (self) => updateMorph(self.progress),
        onRefresh: (self) => updateMorph(self.progress),
      });

      triggers.push(morphST);

      // Active service item follows the scroll position within the (normally scrolling) list.
      // Each item stays active until the next one reaches the centerline, so there is no
      // dead zone between items (the last one stays active until the list's bottom).
      serviceItems.forEach((item, i) => {
        const next = serviceItems[i + 1];
        const st = ScrollTrigger.create({
          trigger: item,
          start: "top center",
          endTrigger: next || item.closest(".showcase-list"),
          end: next ? "top center" : "bottom top",
          onToggle: (self) => item.classList.toggle("is-active", self.isActive),
        });
        triggers.push(st);
      });
    }

    function updateMorph(progress) {
      const slotRect = mediaSlot.getBoundingClientRect();
      const lerp = (a, b, t) => a + (b - a) * t;
      const eased = gsap.parseEase("power2.out")(progress);

      gsap.set(mediaPin, {
        top: 0,
        left: lerp(0, slotRect.left, eased),
        width: lerp(window.innerWidth, slotRect.width, eased),
        height: window.innerHeight,
        borderTopLeftRadius: lerp(0, 28, eased),
        borderBottomLeftRadius: lerp(0, 28, eased),
      });

      // The doors swing open gradually across the whole morph (and close again on the
      // way back up) — scrubbed 1:1 with scroll progress by seeking the video.
      if (taxiVideo && videoDuration) {
        taxiVideo.currentTime = DOOR_CLOSED_T - progress * (DOOR_CLOSED_T - DOOR_OPEN_T);
      }
    }

    let currentlyDesktop = isDesktop();
    if (currentlyDesktop) buildDesktopScroll();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const nowDesktop = isDesktop();
        if (nowDesktop !== currentlyDesktop) {
          killTriggers();
          currentlyDesktop = nowDesktop;
          if (currentlyDesktop) buildDesktopScroll();
        }
        ScrollTrigger.refresh();
      }, 200);
    });

    window.addEventListener("load", () => ScrollTrigger.refresh());
  } else {
    serviceItems.forEach((item) => item.classList.add("is-active"));
  }
})();
