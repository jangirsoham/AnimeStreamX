import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const REVEAL_TARGETS = [
  ".section-heading",
  ".title-card",
  ".collection-card",
  ".editorial-feature",
  ".watchlist-banner",
  ".history-card",
  ".faq-list details",
  ".episode-list .episode-row",
  "[data-reveal]",
].join(", ");

/** Adds motion after rendering; no CSS class ever hides unobserved content. */
export function usePageMotion(routeKey: string) {
  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main || typeof main.animate !== "function") return;

    const preference = window.matchMedia(REDUCED_MOTION);
    let stopMotion = () => {};

    const startMotion = () => {
      const animations = new Map<Element, Animation>();
      const seen = new WeakSet<Element>();

      const animate = (
        element: Element,
        keyframes: Keyframe[],
        options: KeyframeAnimationOptions,
      ) => {
        const animation = element.animate(keyframes, options);
        animations.set(element, animation);
        const release = () => animations.delete(element);
        animation.onfinish = release;
        animation.oncancel = release;
      };

      // An opacity-only route entrance preserves focus, layout and scroll position.
      animate(main, [{ opacity: 0.7 }, { opacity: 1 }], {
        duration: 240,
        easing: "ease-out",
      });

      let observer: IntersectionObserver | undefined;
      let additions: MutationObserver | undefined;
      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          (entries) => {
            let stagger = 0;
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              observer?.unobserve(entry.target);
              if (
                document.hidden ||
                entry.target.contains(document.activeElement)
              )
                continue;

              animate(
                entry.target,
                [
                  { opacity: 0.6, transform: "translateY(12px)" },
                  { opacity: 1, transform: "translateY(0)" },
                ],
                {
                  duration: 460,
                  delay: Math.min(stagger++, 4) * 35,
                  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                  // Only the short stagger uses a fill; final layout stays CSS-owned.
                  fill: "backwards",
                },
              );
            }
          },
          { threshold: 0.06, rootMargin: "0px 0px -20px 0px" },
        );

        const observe = (element: Element) => {
          if (seen.has(element)) return;
          seen.add(element);
          observer?.observe(element);
        };
        const discover = (root: Element) => {
          if (root.matches(REVEAL_TARGETS)) observe(root);
          root.querySelectorAll(REVEAL_TARGETS).forEach(observe);
        };
        discover(main);

        // Filter results and season changes add nodes without changing the route.
        additions = new MutationObserver((records) => {
          for (const record of records) {
            record.addedNodes.forEach((node) => {
              if (node instanceof Element) discover(node);
            });
          }
        });
        additions.observe(main, { childList: true, subtree: true });
      }

      const settleFocusedContent = (event: FocusEvent) => {
        if (!(event.target instanceof Element)) return;
        for (const [element, animation] of animations) {
          if (element.contains(event.target)) animation.cancel();
        }
      };
      main.addEventListener("focusin", settleFocusedContent);

      return () => {
        observer?.disconnect();
        additions?.disconnect();
        main.removeEventListener("focusin", settleFocusedContent);
        animations.forEach((animation) => animation.cancel());
        animations.clear();
      };
    };

    const syncPreference = () => {
      stopMotion();
      stopMotion = preference.matches ? () => {} : startMotion();
    };
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => {
      preference.removeEventListener("change", syncPreference);
      stopMotion();
    };
  }, [routeKey]);
}

/** Passive, frame-batched scroll feedback without a continuous animation loop. */
export function ScrollTools({ routeKey }: { routeKey: string }) {
  const progress = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const fraction =
        height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0;
      if (progress.current)
        progress.current.style.transform = `scaleX(${fraction})`;
      setShowTop(window.scrollY > Math.max(600, window.innerHeight * 0.85));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const resize =
      "ResizeObserver" in window ? new ResizeObserver(schedule) : null;
    resize?.observe(document.body);
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resize?.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [routeKey]);

  const backToTop = () => {
    document.getElementById("main-content")?.focus({ preventScroll: true });
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia(REDUCED_MOTION).matches
        ? "instant"
        : "smooth",
    });
  };

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <div ref={progress} className="scroll-progress-fill" />
      </div>
      {showTop && (
        <button
          type="button"
          className="back-to-top"
          onClick={backToTop}
          aria-label="Back to top of page"
          title="Back to top"
        >
          <ArrowUp size={15} aria-hidden="true" />
          <span>Top</span>
        </button>
      )}
    </>
  );
}
