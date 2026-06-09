(function () {
  const LANGUAGES = {
    ja: { label: "日本語", google: "ja" },
    en: { label: "English", google: "en" },
    zh: { label: "中文", google: "zh-CN" },
  };

  const STORAGE_KEY = "tenshokyo-lang";
  const COOKIE_NAME = "googtrans";
  const LANG_COOKIE_NAME = "tenshokyo_lang";

  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .lang-switcher {
        position: fixed;
        top:3.5rem;
        right: 0rem;
        z-index: 1200;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.24rem;
        background: rgba(250, 248, 243, 0.86);
        border: 1px solid rgba(26, 26, 24, 0.12);
        backdrop-filter: blur(14px);
      }
      .lang-switcher button {
        border: 0;
        background: transparent;
        color: #6b6860;
        font-family: 'DM Mono', 'Noto Sans JP', sans-serif;
        font-size: 0.62rem;
        letter-spacing: 0.08em;
        line-height: 1;
        padding: 0.42rem 0.52rem;
        cursor: pointer;
        transition: background 0.18s, color 0.18s;
      }
      .lang-switcher button:hover,
      .lang-switcher button[aria-pressed="true"] {
        background: #1a1a18;
        color: #f5f2eb;
      }
      .goog-te-banner-frame,
      .goog-te-balloon-frame,
      #goog-gt-tt,
      .skiptranslate iframe {
        display: none !important;
      }
      body {
        top: 0 !important;
      }
      #google_translate_element {
        position: absolute;
        left: -9999px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
      @media (max-width: 600px) {
        .lang-switcher {
          top: 1rem;
          right: 1rem;
        }
        .lang-switcher button{
          padding: 0.38rem 0.44rem;
          font-size: 0.58rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function setCookie(name, value) {
    const expires = "expires=Fri, 31 Dec 9999 23:59:59 GMT";
    document.cookie = `${name}=${value}; ${expires}; path=/`;
    if (location.hostname) {
      document.cookie = `${name}=${value}; ${expires}; path=/; domain=${location.hostname}`;
      document.cookie = `${name}=${value}; ${expires}; path=/; domain=.${location.hostname}`;
    }
  }

  function clearTranslateCookies() {
    const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = `${COOKIE_NAME}=; ${expired}; path=/`;
    if (location.hostname) {
      document.cookie = `${COOKIE_NAME}=; ${expired}; path=/; domain=${location.hostname}`;
      document.cookie = `${COOKIE_NAME}=; ${expired}; path=/; domain=.${location.hostname}`;
    }
  }

  function readCookie(name) {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1];
  }

  function saveLanguage(lang) {
    try {
      window.localStorage?.setItem(STORAGE_KEY, lang);
    } catch (error) {
      // Google Translate can run the page in contexts where storage is unavailable.
    }
    setCookie(LANG_COOKIE_NAME, lang);
  }

  function currentLanguage() {
    try {
      return window.localStorage?.getItem(STORAGE_KEY) || readCookie(LANG_COOKIE_NAME) || "ja";
    } catch (error) {
      return readCookie(LANG_COOKIE_NAME) || "ja";
    }
  }

  function applyLanguage(lang) {
    saveLanguage(lang);
    document.documentElement.setAttribute("data-lang", lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;

    if (lang === "ja") {
      clearTranslateCookies();
    } else {
      setCookie(COOKIE_NAME, `/ja/${LANGUAGES[lang].google}`);
    }

    window.location.reload();
  }

  function createSwitcher() {
    const switcher = document.createElement("div");
    switcher.className = "lang-switcher notranslate";
    switcher.setAttribute("aria-label", "Language selector");
    switcher.setAttribute("translate", "no");

    const active = currentLanguage();
    Object.entries(LANGUAGES).forEach(([lang, config]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = config.label;
      button.setAttribute("aria-pressed", String(lang === active));
      button.addEventListener("click", () => {
        if (lang !== currentLanguage()) applyLanguage(lang);
      });
      switcher.appendChild(button);
    });

    document.body.appendChild(switcher);
  }

  function protectBrandName() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest("script, style, .notranslate")) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.includes("転生教")
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      const fragment = document.createDocumentFragment();
      node.nodeValue.split("転生教").forEach((part, index) => {
        if (index > 0) {
          const brand = document.createElement("span");
          brand.className = "notranslate";
          brand.setAttribute("translate", "no");
          brand.textContent = "転生教";
          fragment.appendChild(brand);
        }
        if (part) fragment.appendChild(document.createTextNode(part));
      });
      node.parentNode.replaceChild(fragment, node);
    });
  }

  function loadGoogleTranslate() {
    const holder = document.createElement("div");
    holder.id = "google_translate_element";
    document.body.appendChild(holder);

    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "ja",
          includedLanguages: "en,zh-CN",
          autoDisplay: false,
          multilanguagePage: true,
        },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    createSwitcher();
    protectBrandName();
    loadGoogleTranslate();
  });
})();
