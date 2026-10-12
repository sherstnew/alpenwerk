import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { flushSync } from "react-dom";
import {
  calculateDeposit,
  clampAmount,
  MAX_AMOUNT,
  MIN_AMOUNT,
  products,
} from "./bank";
import type { Currency, Product, ProductId } from "./bank";
import { dictionaries, languageNames, locales, readLanguage } from "./i18n";
import type { Language, Translations } from "./i18n";
import "./App.css";

const currencies: Currency[] = ["CHF", "EUR", "USD"];
const languages: Language[] = ["ru", "de", "en"];
type Modal =
  | { kind: "product"; product: Product }
  | { kind: "compare" }
  | { kind: "application" }
  | { kind: "success" }
  | null;
interface Application {
  product: Product;
  amount: number;
  currency: Currency;
  compound: boolean;
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Mark() {
  return (
    <svg
      className="brand-mark"
      width="34"
      height="34"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 30 17 7l8 13 5-8 10 18H29l-9-14-9 14Z" fill="currentColor" />
      <path d="m13 29 5-9 6 9" stroke="var(--ground)" strokeWidth="2.5" />
    </svg>
  );
}
function Check() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 12 4 4L19 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Mountain({ index }: { index: number }) {
  const paths = [
    "M0 75 36 60 65 69 112 12 155 60 186 44 225 69 280 57",
    "M0 76 28 61 58 69 91 39 110 48 153 6 190 48 215 33 250 69 280 60",
    "M0 77 26 66 54 73 86 47 112 63 162 15 187 39 213 4 248 54 280 65",
  ];
  return (
    <svg
      className="mountain-drawing"
      viewBox="0 0 280 88"
      fill="none"
      aria-hidden="true"
    >
      <path d={paths[index]} stroke="currentColor" strokeWidth="1.1" />
      <path
        d={paths[index]}
        transform="translate(0 11)"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity=".25"
      />
      <path d="M0 86h280" stroke="currentColor" strokeWidth=".5" opacity=".3" />
    </svg>
  );
}

function GrowthChart({
  product,
  amount,
  compound,
  currency,
  lang,
  t,
}: {
  product: Product;
  amount: number;
  compound: boolean;
  currency: Currency;
  lang: Language;
  t: Translations;
}) {
  const result = calculateDeposit({
    principal: amount,
    annualRate: product.rates[currency],
    months: product.months,
    compound,
  });
  const maxIncome = calculateDeposit({
    principal: amount,
    annualRate: product.rates[currency],
    months: 24,
    compound,
  }).income;
  const [hoverMonth, setHoverMonth] = useState<number | null>(null);
  const x = (m: number) => 26 + (m / 24) * 510;
  const y = (income: number) => 170 - (income / Math.max(1, maxIncome)) * 132;
  const path = result.points
    .map((p) => `${x(p.month)},${y(p.income)}`)
    .join(" ");
  const active =
    result.points[Math.min(hoverMonth ?? product.months, product.months)];
  const money = (value: number) =>
    new Intl.NumberFormat(locales[lang], {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  return (
    <div className="growth-chart">
      <div className="chart-caption">
        <span>{t.chartTitle}</span>
        <span>{t.chartHint}</span>
      </div>
      <svg
        viewBox="0 0 562 182"
        role="img"
        aria-label={`${t.chartTitle}: ${money(amount)} → ${money(result.total)}, ${product.months} ${t.months}`}
        onPointerLeave={() => setHoverMonth(null)}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setHoverMonth(
            Math.max(
              0,
              Math.min(
                product.months,
                Math.round(
                  ((((e.clientX - rect.left) / rect.width) * 562 - 26) / 510) *
                    24,
                ),
              ),
            ),
          );
        }}
      >
        <title>{t.chartTitle}</title>
        {[38, 82, 126, 170].map((n) => (
          <line key={n} x1="26" x2="536" y1={n} y2={n} className="chart-grid" />
        ))}
        <polygon
          points={`26,170 ${path} ${x(product.months)},170`}
          className="chart-area"
        />
        <polyline points={path} className="chart-line" />
        <line
          x1={x(active.month)}
          x2={x(active.month)}
          y1={y(active.income)}
          y2="170"
          className="chart-guide"
        />
        <circle
          cx={x(active.month)}
          cy={y(active.income)}
          r="6"
          className="chart-dot"
        />
      </svg>
      <div className="chart-axis" aria-hidden="true">
        {[0, 6, 12, 24].map((m) => (
          <span
            key={m}
            className={
              m === product.months ? "chart-tick selected-tick" : "chart-tick"
            }
            style={{ left: `${(m / 24) * 100}%` }}
          >
            {m === 0 ? t.chartStart : `${m} ${t.months}`}
          </span>
        ))}
      </div>
      <div className="chart-scale">
        <span>{t.chartScale}</span>
        <span>
          {money(0)} → {money(maxIncome)}
        </span>
      </div>
      <div className="chart-readout">
        <span>
          {t.monthWord} {active.month}
        </span>
        <span>{money(active.total)}</span>
      </div>
      <details className="monthly-details">
        <summary>{t.chartTable}</summary>
        <div
          className="table-scroll"
          role="region"
          aria-label={t.chartTable}
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th>{t.monthWord}</th>
                <th>{t.income}</th>
                <th>{t.balance}</th>
              </tr>
            </thead>
            <tbody>
              {result.points.map((p) => (
                <tr key={p.month}>
                  <th>{p.month}</th>
                  <td>{money(p.income)}</td>
                  <td>{money(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function App() {
  const [lang, setLang] = useState<Language>(readLanguage);
  const [currency, setCurrency] = useState<Currency>("CHF");
  const [productId, setProductId] = useState<ProductId>("panorama");
  const [amount, setAmount] = useState(100_000);
  const [amountDraft, setAmountDraft] = useState("100000");
  const [amountEditing, setAmountEditing] = useState(false);
  const [compound, setCompound] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactLanguage, setContactLanguage] = useState<Language>(lang);
  const [errors, setErrors] = useState<{ name?: boolean; email?: boolean }>({});
  const t = dictionaries[lang];
  const product = products.find((p) => p.id === productId)!;
  const result = calculateDeposit({
    principal: amount,
    annualRate: product.rates[currency],
    months: product.months,
    compound,
  });
  const number = (n: number, decimals = 0) =>
    new Intl.NumberFormat(locales[lang], {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(n);
  const money = (n: number, curr = currency) =>
    new Intl.NumberFormat(locales[lang], {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  const rate = (n: number) =>
    new Intl.NumberFormat(locales[lang], {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(n / 100);
  const amountInvalid =
    !/^\d+$/.test(amountDraft) ||
    Number(amountDraft) < MIN_AMOUNT ||
    Number(amountDraft) > MAX_AMOUNT;
  const descriptions = {
    basis: t.basisDescription,
    panorama: t.panoramaDescription,
    horizon: t.horizonDescription,
  };
  const tags = {
    basis: t.basisTag,
    panorama: t.panoramaTag,
    horizon: t.horizonTag,
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", `${t.heroDescription} ${t.footerDemo}`);
    try {
      localStorage.setItem("alpenwerk-language", lang);
    } catch {
      /* Optional preference storage. */
    }
  }, [lang, t.title]);
  const modalOpen = modal !== null;
  useEffect(() => {
    if (modalOpen) {
      dialogRef.current?.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
    dialogRef.current?.close();
  }, [modalOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  function updateAmount(value: number) {
    const next = clampAmount(value);
    setAmount(next);
    setAmountDraft(String(next));
  }
  function chooseProduct(id: ProductId, scroll = true) {
    setProductId(id);
    if (scroll)
      document.getElementById("calculator")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }
  function openApplication() {
    const validAmount = clampAmount(Number(amountDraft));
    updateAmount(validAmount);
    setApplication({ product, amount: validAmount, currency, compound });
    if (!name && !email) setContactLanguage(lang);
    setErrors({});
    setModal({ kind: "application" });
    setMenuOpen(false);
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    const next = {
      name: !name.trim(),
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    };
    setErrors(next);
    if (next.name || next.email) {
      document
        .getElementById(next.name ? "application-name" : "application-email")
        ?.focus();
      return;
    }
    setModal({ kind: "success" });
    requestAnimationFrame(() =>
      document.getElementById("success-heading")?.focus(),
    );
  }
  const navigation = (
    <>
      <a href="#products" onClick={() => setMenuOpen(false)}>
        {t.navProducts}
      </a>
      <a href="#approach" onClick={() => setMenuOpen(false)}>
        {t.navApproach}
      </a>
      <a href="#calculator" onClick={() => setMenuOpen(false)}>
        {t.navCalculator}
      </a>
      <a href="#faq" onClick={() => setMenuOpen(false)}>
        {t.navFaq}
      </a>
    </>
  );
  const languageSelector = (className = "") => (
    <div
      className={`language-selector ${className}`}
      role="group"
      aria-label={t.language}
    >
      {languages.map((l) => (
        <button
          type="button"
          key={l}
          lang={l}
          aria-label={languageNames[l]}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
  const applicationResult = application
    ? calculateDeposit({
        principal: application.amount,
        annualRate: application.product.rates[application.currency],
        months: application.product.months,
        compound: application.compound,
      })
    : null;

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <header className="header" id="top">
        <div className="header-inner">
          <a href="#top" className="brand" aria-label="Alpenwerk">
            <Mark />
            <span>
              alpenwerk<span className="brand-period">.</span>
            </span>
          </a>
          <nav className="desktop-nav" aria-label={t.menu}>
            {navigation}
          </nav>
          <div className="header-actions">
            {languageSelector()}
            <button className="header-cta" onClick={openApplication}>
              {t.consultation}
              <Arrow diagonal />
            </button>
            <button
              className="menu-toggle"
              aria-label={menuOpen ? t.close : t.menu}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span />
              <span className={menuOpen ? "open" : ""} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            className="mobile-nav"
            id="mobile-navigation"
            aria-label={t.menu}
          >
            {navigation}
            <button className="primary-button" onClick={openApplication}>
              {t.consultation}
              <Arrow />
            </button>
          </nav>
        )}
      </header>
      <main id="main">
        <section className="hero content-width" aria-labelledby="hero-heading">
          <div className="hero-intro">
            <div className="hero-heading-wrap">
              <p className="eyebrow">
                <span className="tiny-cross" aria-hidden="true">
                  +
                </span>
                {t.eyebrow}
              </p>
              <h1 id="hero-heading">
                {t.heroFirst}
                <br />
                <span>{t.heroSecond}</span>
              </h1>
            </div>
            <div className="hero-copy">
              <p>{t.heroDescription}</p>
              <a className="text-link" href="#calculator">
                {t.heroCta}
                <Arrow diagonal />
              </a>
              <span className="demo-label">
                <span className="status-dot" />
                {t.demoBadge}
              </span>
            </div>
          </div>
          <div className="hero-panorama">
            <img
              src="/images/jungfrau.jpg"
              alt={t.landscape}
              fetchPriority="high"
              width="2400"
              height="1600"
            />
            <div className="panorama-location">
              <span className="coordinate">46°32′ N &nbsp; 7°57′ E</span>
              <span>{t.location}</span>
              <span className="panorama-altitude">{t.altitude}</span>
            </div>
            <div className="quick-calculator">
              <div className="quick-top">
                <span>{t.quickTitle}</span>
                <span className="small-mark" aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className="quick-capital">
                <span>{t.quickAmount}</span>
                <strong>
                  {number(amount)} <small>{currency}</small>
                </strong>
              </div>
              <label className="sr-only" htmlFor="quick-amount">
                {t.amountRange}
              </label>
              <input
                id="quick-amount"
                className="range"
                type="range"
                min={MIN_AMOUNT}
                max={MAX_AMOUNT}
                step="1000"
                value={amount}
                style={
                  {
                    "--range-fill": `${((amount - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT)) * 100}%`,
                  } as CSSProperties
                }
                onChange={(e) => updateAmount(Number(e.target.value))}
                aria-valuetext={money(amount)}
              />
              <div className="quick-meta">
                <span>
                  {product.name}{" "}
                  <span className="muted">
                    / {product.months} {t.months}
                  </span>
                </span>
                <span>
                  {rate(product.rates[currency])}{" "}
                  <span className="muted">{t.annual}</span>
                </span>
              </div>
              <div className="quick-return">
                <span>{t.income}</span>
                <strong>+{money(result.income)}</strong>
              </div>
              <a href="#calculator" className="primary-button">
                {t.quickLink}
                <Arrow />
              </a>
              <p className="quick-disclaimer">{t.rateDisclaimer}</p>
            </div>
          </div>
          <div className="image-footnote">
            <span>ALPENWERK</span>
            <a
              href="https://unsplash.com/photos/a-snowy-mountain-landscape-ZmSgK89kzFI"
              target="_blank"
              rel="noreferrer"
            >
              {t.photoCredit}
              <Arrow diagonal />
            </a>
          </div>
          <div className="principles">
            {[
              [t.principleOne, t.principleOneText],
              [t.principleTwo, t.principleTwoText],
              [t.principleThree, t.principleThreeText],
            ].map(([title, text], i) => (
              <div key={title}>
                <span className="principle-number">0{i + 1}</span>
                <div>
                  <h2>{title}</h2>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section
          className="products-section content-width section-space"
          id="products"
          aria-labelledby="products-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t.productsEyebrow}</p>
              <h2 id="products-heading" className="display-heading">
                {t.productsTitle}
              </h2>
            </div>
            <div className="section-description">
              <p>{t.productsDescription}</p>
              <button
                className="text-link"
                onClick={() => setModal({ kind: "compare" })}
              >
                {t.compare}
                <Arrow diagonal />
              </button>
            </div>
          </div>
          <div className="product-grid">
            {products.map((p, i) => (
              <article
                key={p.id}
                className={`product ${productId === p.id ? "is-selected" : ""}`}
              >
                <div className="product-top">
                  <span className="product-index">0{i + 1}</span>
                  <span className="product-tag">
                    {productId === p.id ? (
                      <>
                        <span className="status-dot" />
                        {t.recommended}
                      </>
                    ) : (
                      tags[p.id]
                    )}
                  </span>
                </div>
                <Mountain index={i} />
                <div className="product-name">
                  <h3>{p.name}</h3>
                  <span>
                    {p.months} {t.months}
                  </span>
                </div>
                <p className="product-description">{descriptions[p.id]}</p>
                <div className="product-rate">
                  <strong>{rate(p.rates[currency])}</strong>
                  <span>
                    {t.annual}
                    <br />
                    <span className="muted">{currency}</span>
                  </span>
                </div>
                <div className="product-features">
                  <span>
                    <Check />
                    {t.fixedRate}
                  </span>
                  <span>
                    <Check />
                    {t.starting} {number(MIN_AMOUNT)} {currency}
                  </span>
                </div>
                <button
                  className="product-select"
                  onClick={() => chooseProduct(p.id)}
                >
                  {productId === p.id ? t.selected : t.choose}
                  {productId === p.id ? <Check /> : <Arrow />}
                </button>
                <button
                  className="product-details"
                  onClick={() => setModal({ kind: "product", product: p })}
                >
                  {t.details}
                  <span aria-hidden="true">+</span>
                </button>
              </article>
            ))}
          </div>
          <p className="section-note">{t.rateDisclaimer}</p>
        </section>
        <section
          className="calculator-section section-space"
          id="calculator"
          aria-labelledby="calculator-heading"
        >
          <div className="content-width">
            <div className="section-heading calculator-heading">
              <div>
                <p className="eyebrow">{t.calculatorEyebrow}</p>
                <h2 id="calculator-heading" className="display-heading">
                  {t.calculatorTitle}
                </h2>
              </div>
              <p className="section-description">{t.calculatorDescription}</p>
            </div>
            <div className="calculator-grid">
              <div className="calculator-controls">
                <fieldset className="currency-field">
                  <legend>{t.currency}</legend>
                  <div className="segmented">
                    {currencies.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={currency === c}
                        onClick={() => setCurrency(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="amount-field">
                  <label htmlFor="deposit-amount">{t.amount}</label>
                  <div className="amount-input-wrap">
                    <input
                      id="deposit-amount"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={amountEditing ? amountDraft : number(amount)}
                      aria-invalid={amountInvalid}
                      aria-describedby={
                        amountInvalid ? "amount-error" : "amount-limits"
                      }
                      onChange={(e) => {
                        setAmountDraft(e.target.value);
                        const n = Number(e.target.value);
                        if (
                          /^\d+$/.test(e.target.value) &&
                          n >= MIN_AMOUNT &&
                          n <= MAX_AMOUNT
                        )
                          setAmount(n);
                      }}
                      onFocus={(e) => {
                        flushSync(() => setAmountEditing(true));
                        e.currentTarget.select();
                      }}
                      onBlur={() => {
                        updateAmount(Number(amountDraft));
                        setAmountEditing(false);
                      }}
                    />
                    <span>{currency}</span>
                  </div>
                  {amountInvalid && (
                    <p className="field-error" id="amount-error">
                      {t.amountError}
                    </p>
                  )}
                  <label className="sr-only" htmlFor="amount-slider">
                    {t.amountRange}
                  </label>
                  <input
                    id="amount-slider"
                    className="range"
                    type="range"
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    step="1000"
                    value={amount}
                    style={
                      {
                        "--range-fill": `${((amount - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT)) * 100}%`,
                      } as CSSProperties
                    }
                    onChange={(e) => updateAmount(Number(e.target.value))}
                    aria-valuetext={money(amount)}
                  />
                  <div className="range-limits" id="amount-limits">
                    <span>{number(MIN_AMOUNT)}</span>
                    <span>{number(MAX_AMOUNT)}</span>
                  </div>
                </div>
                <div className="term-field">
                  <div className="control-label">
                    <label htmlFor="term-slider">{t.term}</label>
                    <span>{product.name}</span>
                  </div>
                  <div className="term-buttons">
                    {products.map((p) => (
                      <button
                        key={p.id}
                        aria-pressed={p.id === productId}
                        onClick={() => chooseProduct(p.id, false)}
                      >
                        {p.months} <span>{t.months}</span>
                      </button>
                    ))}
                  </div>
                  <input
                    id="term-slider"
                    className="range term-range"
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={products.findIndex((p) => p.id === productId)}
                    onChange={(e) =>
                      chooseProduct(products[Number(e.target.value)].id, false)
                    }
                    aria-label={t.termRange}
                    aria-valuetext={`${product.months} ${t.months}`}
                    style={
                      {
                        "--range-fill": `${products.findIndex((p) => p.id === productId) * 50}%`,
                      } as CSSProperties
                    }
                  />
                </div>
                <div className="compound-control">
                  <div>
                    <label htmlFor="compound">{t.compound}</label>
                    <p id="compound-description">{t.compoundDescription}</p>
                  </div>
                  <button
                    id="compound"
                    role="switch"
                    aria-checked={compound}
                    aria-describedby="compound-description"
                    aria-label={t.compound}
                    onClick={() => setCompound(!compound)}
                  >
                    <span />
                  </button>
                </div>
                <p className="currency-note">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="10" cy="10" r="7" stroke="currentColor" />
                    <path d="M10 9v5m0-9v1" stroke="currentColor" />
                  </svg>
                  {t.currencyNote}
                </p>
              </div>
              <div className="calculator-result">
                <div className="result-heading">
                  <span>{t.resultTitle}</span>
                  <span>
                    {product.name} / {product.months} {t.months}
                  </span>
                </div>
                <span className="result-label">{t.income}</span>
                <div
                  className="income-value"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  +{number(result.income, 2)} <span>{currency}</span>
                </div>
                <div className="result-summary">
                  <div>
                    <span>{t.total}</span>
                    <strong>{money(result.total)}</strong>
                  </div>
                  <div>
                    <span>{t.fixedRate}</span>
                    <strong>
                      {rate(product.rates[currency])} <small>{t.annual}</small>
                    </strong>
                  </div>
                </div>
                <GrowthChart
                  product={product}
                  amount={amount}
                  compound={compound}
                  currency={currency}
                  lang={lang}
                  t={t}
                />
                <button className="result-apply" onClick={openApplication}>
                  {t.apply}
                  <Arrow />
                </button>
                <p className="result-note">{t.taxes}</p>
              </div>
            </div>
            <p className="calculation-note">{t.calculationNote}</p>
          </div>
        </section>
        <section
          className="approach-section content-width section-space"
          id="approach"
          aria-labelledby="approach-heading"
        >
          <div className="approach-story">
            <p className="eyebrow">{t.approachEyebrow}</p>
            <h2 id="approach-heading" className="display-heading">
              {t.approachTitle}
            </h2>
            <p className="approach-description">{t.approachDescription}</p>
            <div className="approach-art" aria-hidden="true">
              <svg viewBox="0 0 450 210" fill="none">
                <path
                  d="M10 200 145 40 240 150 315 10 440 200"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                {[15, 30, 45, 60, 75].map((n) => (
                  <path
                    key={n}
                    d={`M${10 + n} 200 ${145 + n * 0.25} ${40 + n * 0.55} ${240 + n * 0.25} ${150 + n * 0.15} ${315 + n * 0.1} ${10 + n * 0.7} ${440 - n} 200`}
                    stroke="currentColor"
                    strokeWidth=".7"
                    opacity={1 - n / 100}
                  />
                ))}
                <circle cx="315" cy="10" r="5" fill="currentColor" />
              </svg>
            </div>
            <p className="approach-signature">
              {t.approachSeal}
              <span>{t.approachSealSmall}</span>
            </p>
          </div>
          <div className="approach-points">
            {[
              [t.approachOne, t.approachOneText],
              [t.approachTwo, t.approachTwoText],
              [t.approachThree, t.approachThreeText],
            ].map(([title, text], i) => (
              <div key={title}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section
          className="faq-section content-width section-space"
          id="faq"
          aria-labelledby="faq-heading"
        >
          <div>
            <p className="eyebrow">{t.faqEyebrow}</p>
            <h2 id="faq-heading" className="display-heading">
              {t.faqTitle}
            </h2>
          </div>
          <div className="faq-list">
            {[
              [t.faq1, t.faq1Answer],
              [t.faq2, t.faq2Answer],
              [t.faq3, t.faq3Answer],
              [t.faq4, t.faq4Answer],
              [t.faq5, t.faq5Answer],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <span className="faq-symbol" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="closing-section">
          <div className="content-width closing-inner">
            <div>
              <h2>{t.closingTitle}</h2>
              <p>{t.closingText}</p>
            </div>
            <a className="primary-button" href="#calculator">
              {t.heroCta}
              <Arrow diagonal />
            </a>
            <svg
              className="closing-mountain"
              viewBox="0 0 340 210"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m0 210 110-175 80 123 48-80 100 132M110 35l7 78 73 45m48-80-5 69 105 63"
                stroke="currentColor"
              />
            </svg>
          </div>
        </section>
      </main>
      <footer className="footer content-width">
        <div className="footer-top">
          <div>
            <a href="#top" className="brand">
              <Mark />
              <span>alpenwerk.</span>
            </a>
            <p>{t.footerText}</p>
          </div>
          <a className="text-link" href="#top">
            {t.backTop}
            <Arrow diagonal />
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Alpenwerk</span>
          <span>{t.footerDemo}</span>
          {languageSelector("footer-languages")}
        </div>
        <p className="footer-disclaimer">{t.footerDisclaimer}</p>
      </footer>
      <dialog
        ref={dialogRef}
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const focusable = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]),a[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.getClientRects().length > 0);
          const first = focusable[0],
            last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }}
        className={`dialog ${modal?.kind === "compare" ? "wide-dialog" : ""}`}
        aria-labelledby="dialog-title"
        onClose={() => setModal(null)}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.target === e.currentTarget &&
            (e.clientX < r.left ||
              e.clientX > r.right ||
              e.clientY < r.top ||
              e.clientY > r.bottom)
          )
            setModal(null);
        }}
      >
        <div className="dialog-tools">
          {languageSelector()}
          <button
            className="close-button"
            aria-label={t.close}
            onClick={() => setModal(null)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
        {modal?.kind === "compare" && (
          <>
            <p className="eyebrow">{t.compare}</p>
            <h2 id="dialog-title">{t.compareTitle}</h2>
            <p className="dialog-description">{t.compareDescription}</p>
            <div
              className="table-scroll"
              role="region"
              tabIndex={0}
              aria-label={t.compareTitle}
            >
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>{t.term}</th>
                    {products.map((p) => (
                      <th key={p.id}>
                        {p.name}
                        <small>
                          {p.months} {t.months}
                        </small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currencies.map((c) => (
                    <tr key={c}>
                      <th>
                        {c} / {t.annual}
                      </th>
                      {products.map((p) => (
                        <td key={p.id}>{rate(p.rates[c])}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th>{t.minimum}</th>
                    {products.map((p) => (
                      <td key={p.id}>{number(MIN_AMOUNT)}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>{t.maximum}</th>
                    {products.map((p) => (
                      <td key={p.id}>{number(MAX_AMOUNT)}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>{t.compound}</th>
                    {products.map((p) => (
                      <td key={p.id}>{t.capitalizationAvailable}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>{t.earlyWithdrawal}</th>
                    {products.map((p) => (
                      <td key={p.id}>{t.earlyWithdrawalValue}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>{t.choose}</th>
                    {products.map((p) => (
                      <td key={p.id}>
                        <button
                          className="text-link"
                          onClick={() => {
                            chooseProduct(p.id);
                            setModal(null);
                          }}
                        >
                          {p.name}
                          <Arrow />
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="dialog-note">{t.rateDisclaimer}</p>
          </>
        )}
        {modal?.kind === "product" && (
          <>
            <p className="eyebrow">{tags[modal.product.id]}</p>
            <h2 id="dialog-title">
              {modal.product.name}
              <span className="detail-term">
                {modal.product.months} {t.months}
              </span>
            </h2>
            <Mountain
              index={products.findIndex((p) => p.id === modal.product.id)}
            />
            <p className="dialog-description">
              {descriptions[modal.product.id]}
            </p>
            <dl className="detail-list">
              {currencies.map((c) => (
                <div key={c}>
                  <dt>
                    {c} / {t.annual}
                  </dt>
                  <dd>{rate(modal.product.rates[c])}</dd>
                </div>
              ))}
              <div>
                <dt>{t.minimum}</dt>
                <dd>{number(MIN_AMOUNT)} CHF / EUR / USD</dd>
              </div>
              <div>
                <dt>{t.maximum}</dt>
                <dd>{number(MAX_AMOUNT)} CHF / EUR / USD</dd>
              </div>
            </dl>
            <p className="dialog-note">{t.productDialogNote}</p>
            <button
              className="primary-button"
              onClick={() => {
                chooseProduct(modal.product.id);
                setModal(null);
              }}
            >
              {t.choose}
              <Arrow />
            </button>
          </>
        )}
        {(modal?.kind === "application" || modal?.kind === "success") &&
          application &&
          applicationResult && (
            <>
              <p className="eyebrow">{t.formEyebrow}</p>
              <h2 id="dialog-title">
                {modal.kind === "application" ? (
                  t.formTitle
                ) : (
                  <span id="success-heading" tabIndex={-1}>
                    {t.successTitle}
                  </span>
                )}
              </h2>
              <p className="dialog-description">
                {modal.kind === "application"
                  ? t.formDescription
                  : t.successDescription}
              </p>
              <div className="application-summary" aria-label={t.formSummary}>
                <div>
                  <strong>{application.product.name}</strong>
                  <span>
                    {application.product.months} {t.months} ·{" "}
                    {rate(application.product.rates[application.currency])}{" "}
                    {t.annual}
                  </span>
                </div>
                <div>
                  <span>{t.amount}</span>
                  <strong>
                    {money(application.amount, application.currency)}
                  </strong>
                </div>
                <div>
                  <span>{t.income}</span>
                  <strong>
                    +{money(applicationResult.income, application.currency)}
                  </strong>
                </div>
                <div>
                  <span>{t.compound}</span>
                  {application.compound ? <Check /> : <span>—</span>}
                </div>
              </div>
              {modal.kind === "application" ? (
                <form noValidate onSubmit={submit} className="application-form">
                  <div>
                    <label htmlFor="application-name">{t.name}</label>
                    <input
                      id="application-name"
                      autoComplete="name"
                      value={name}
                      placeholder={t.namePlaceholder}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors((prev) => ({ ...prev, name: false }));
                      }}
                      required
                    />
                    {errors.name && (
                      <p className="field-error" id="name-error">
                        {t.nameError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="application-email">{t.email}</label>
                    <input
                      id="application-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      placeholder={t.emailPlaceholder}
                      aria-invalid={!!errors.email}
                      aria-describedby={
                        errors.email ? "email-error" : undefined
                      }
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((prev) => ({ ...prev, email: false }));
                      }}
                      required
                    />
                    {errors.email && (
                      <p className="field-error" id="email-error">
                        {t.emailError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="contact-language">
                      {t.contactLanguage}
                    </label>
                    <select
                      id="contact-language"
                      value={contactLanguage}
                      onChange={(e) =>
                        setContactLanguage(e.target.value as Language)
                      }
                    >
                      {languages.map((l) => (
                        <option key={l} value={l}>
                          {languageNames[l]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="primary-button" type="submit">
                    {t.formSubmit}
                    <Arrow />
                  </button>
                  <p className="dialog-note">{t.formNotice}</p>
                </form>
              ) : (
                <>
                  <div className="success-contact">
                    <Check />
                    <span>
                      {name.trim()} · {email.trim()}
                    </span>
                    <span>
                      {t.successContact}: {languageNames[contactLanguage]}
                    </span>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => setModal(null)}
                  >
                    {t.successBack}
                    <Arrow />
                  </button>
                </>
              )}
            </>
          )}
      </dialog>
    </>
  );
}
export default App;
