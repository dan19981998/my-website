const hero = document.querySelector('.hero');
const heroCursorGlow = document.querySelector('.hero__cursor-glow');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const delay = (duration) => new Promise((resolve) => {
    window.setTimeout(resolve, duration);
});

if (hero && heroCursorGlow && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('mousemove', (event) => {
        const bounds = hero.getBoundingClientRect();
        const offsetX = event.clientX - bounds.left;
        const offsetY = event.clientY - bounds.top;

        heroCursorGlow.style.left = `${offsetX}px`;
        heroCursorGlow.style.top = `${offsetY}px`;
    });

    hero.addEventListener('mouseleave', () => {
        heroCursorGlow.style.opacity = '0';
    });

    hero.addEventListener('mouseenter', () => {
        heroCursorGlow.style.opacity = '1';
    });
}

const typeForward = async (element, text, speed, startIndex = 0) => {
    for (let index = startIndex + 1; index <= text.length; index += 1) {
        element.textContent = text.slice(0, index);
        await delay(speed);
    }
};

const deleteBackward = async (element, targetLength, speed) => {
    for (let index = element.textContent.length; index >= targetLength; index -= 1) {
        element.textContent = element.textContent.slice(0, index);
        await delay(speed);
    }
};

const runHeroTyping = async () => {
    const subtitle = document.querySelector('.hero__subtitle');
    const subtitleText = document.querySelector('.hero__subtitle-text');
    const typingCursor = document.querySelector('.hero__typing-cursor');

    if (!subtitle || !subtitleText) {
        return;
    }

    const text = subtitle.dataset.typeText ?? '';

    if (prefersReducedMotion.matches) {
        subtitleText.textContent = text;
        typingCursor?.classList.remove('is-active');
        return;
    }

    typingCursor?.classList.add('is-active');
    subtitleText.textContent = '';

    const glitchPoint = Math.floor(text.length * 0.55);
    const correctedPoint = Math.max(0, glitchPoint - 4);

    await delay(700);
    await typeForward(subtitleText, text.slice(0, glitchPoint), 65);
    await delay(280);
    await deleteBackward(subtitleText, correctedPoint, 45);
    await delay(180);
    await typeForward(subtitleText, text, 65, correctedPoint);
    await delay(1400);
    typingCursor?.classList.remove('is-active');
};

runHeroTyping();

const animateCountValue = (element, duration = 1500) => {
    const target = Number.parseInt(element.dataset.count ?? '0', 10);
    const suffix = element.dataset.suffix ?? '';

    if (!Number.isFinite(target)) {
        return;
    }

    if (prefersReducedMotion.matches) {
        element.textContent = `${target}${suffix}`;
        return;
    }

    const startTime = performance.now();

    const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);

        element.textContent = `${value}${suffix}`;

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };

    requestAnimationFrame(step);
};

const initStatsCountUp = () => {
    const statsSection = document.querySelector('.stats');
    const statValues = [...document.querySelectorAll('.stats__value[data-count]')];

    if (!statsSection || statValues.length === 0) {
        return;
    }

    const run = () => {
        statValues.forEach((value, index) => {
            window.setTimeout(() => {
                animateCountValue(value);
            }, index * 90);
        });
    };

    if (prefersReducedMotion.matches) {
        run();
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                run();
                observer.disconnect();
            }
        });
    }, {
        threshold: 0.35,
        rootMargin: '0px 0px -8% 0px'
    });

    observer.observe(statsSection);
};

initStatsCountUp();

const initResumeToggles = () => {
    const toggles = [...document.querySelectorAll('.resume__toggle')];

    if (toggles.length === 0) {
        return;
    }

    toggles.forEach((toggle) => {
        toggle.addEventListener('click', () => {
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            const list = document.getElementById(toggle.getAttribute('aria-controls'));
            const text = toggle.querySelector('.resume__toggle-text');

            toggle.setAttribute('aria-expanded', String(!isExpanded));
            list?.classList.toggle('is-open', !isExpanded);

            if (text) {
                text.textContent = isExpanded ? 'Show details' : 'Hide details';
            }
        });
    });
};

initResumeToggles();

// Testimonial slider removed per user request

const initScrollSpy = () => {
    const navLinks = [...document.querySelectorAll('.sidebar__nav-link[href^="#"]')];
    const sections = [...document.querySelectorAll('main section[id]')];

    if (navLinks.length === 0 || sections.length === 0) return;

    const idToLink = new Map();
    navLinks.forEach((link) => {
        try {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) idToLink.set(href.slice(1), link);
        } catch (e) {
            // ignore
        }
    });

    const setActive = (link) => {
        if (!link) return;
        navLinks.forEach((l) => l.classList.remove('sidebar__nav-link--active'));
        link.classList.add('sidebar__nav-link--active');

        // On small screens, ensure the active nav item is visible by centering it
        if (window.matchMedia('(max-width: 780px)').matches) {
            try {
                link.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            } catch (e) {
                // fallback: adjust parent scrollLeft
                const parent = link.closest('.sidebar__nav');
                if (parent) {
                    const parentRect = parent.getBoundingClientRect();
                    const linkRect = link.getBoundingClientRect();
                    const offset = (linkRect.left + linkRect.right) / 2 - (parentRect.left + parentRect.right) / 2;
                    parent.scrollBy({ left: offset, behavior: 'smooth' });
                }
            }
        }
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const id = entry.target.id;
            const link = idToLink.get(id);
            if (!link) return;

            if (entry.isIntersecting) {
                // set active using helper (also auto-scrolls mobile nav)
                setActive(link);
            }
        });
    }, {
        root: null,
        rootMargin: '-30% 0px -55% 0px',
        threshold: 0.15,
    });

    sections.forEach((s) => observer.observe(s));

    // Fallback / complementary scroll handler for more reliable activation
    let ticking = false;
    const updateActiveByScroll = () => {
        const topOffset = window.matchMedia('(max-width: 780px)').matches ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-bar-height')) || 126 : 0;
        const scrollY = window.pageYOffset || window.scrollY;
        let currentId = sections[0]?.id;

        for (let i = 0; i < sections.length; i += 1) {
            const s = sections[i];
            const rectTop = s.getBoundingClientRect().top + window.pageYOffset - topOffset;
            if (scrollY >= rectTop - 24) {
                currentId = s.id;
            }
        }

        if (currentId) {
            const link = idToLink.get(currentId);
            if (link) {
                setActive(link);
            }
        }
    };

    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateActiveByScroll();
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // run an initial update
    setTimeout(updateActiveByScroll, 200);

    // ensure correct active on load (hash present or top of page)
    const applyInitial = () => {
        const hash = window.location.hash.replace('#', '');
        if (hash && idToLink.has(hash)) {
            setActive(idToLink.get(hash));
            return;
        }

        // fallback: pick first section in viewport
        sections.some((s) => {
            const rect = s.getBoundingClientRect();
            if (rect.top >= 0 && rect.top < window.innerHeight * 0.5) {
                const l = idToLink.get(s.id);
                if (l) {
                    setActive(l);
                    return true;
                }
            }
            return false;
        });
    };

    // smooth scroll for nav clicks (keeps active state predictable)
    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            const target = document.getElementById(href.slice(1));
            if (!target) return;
            e.preventDefault();
            const topOffset = window.matchMedia('(max-width: 780px)').matches ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mobile-bar-height')) || 126 : 0;
            const rect = target.getBoundingClientRect();
            const scrollTop = window.pageYOffset + rect.top - topOffset - 12; // small gap
            window.scrollTo({ top: scrollTop, behavior: 'smooth' });
        });
    });

    // run initial pass after a short delay to allow layout to stabilise
    setTimeout(applyInitial, 120);
    window.addEventListener('hashchange', applyInitial);
};

initScrollSpy();
