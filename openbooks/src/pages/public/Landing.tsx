// src/pages/public/Landing.tsx
import { Link } from "react-router-dom";
import "./landing.css";

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing__header">
        <div className="landing__container landing__headerInner">
          <div className="landing__brand">
            <img src="/openbooks.png" alt="OpenBooks logo" className="landing__logo" />
            <span className="landing__brandName">OpenBooks</span>
          </div>

          <nav className="landing__nav">
            <Link className="landing__link" to="/signin">
              Sign in
            </Link>
            <Link className="landing__btnPrimary" to="/signup">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="landing__main">
        <section className="landing__section landing__hero">
          <div className="landing__container">
            <h1 className="landing__h1">Simple bookkeeping. Clear financial insight.</h1>
            <p className="landing__sub">
              OpenBooks helps you record transactions, generate financial statements, and understand your
              business performance — all in one structured system.
            </p>

            <div className="landing__ctaRow">
              <Link className="landing__btnPrimary" to="/signup">
                Start free
              </Link>
              <Link className="landing__btnSecondary" to="/signin">
                Sign in
              </Link>
            </div>

            <p className="landing__note">No spreadsheets. No confusion. Just organized accounting.</p>
          </div>
        </section>

        <section className="landing__section">
          <div className="landing__container">
            <div className="landing__preview" aria-label="Product preview placeholder">
              <div className="landing__previewTitle">Dashboard Preview</div>
              <div className="landing__previewGrid">
                <div className="landing__previewCard" />
                <div className="landing__previewCard" />
                <div className="landing__previewCard" />
              </div>
            </div>

            <div className="landing__centerText">
              <h2 className="landing__h2">A clean dashboard built for clarity.</h2>
              <p className="landing__p">
                Track income, expenses, assets, and liabilities in one simple interface designed for real
                accounting logic.
              </p>
            </div>
          </div>
        </section>

        <section className="landing__section">
          <div className="landing__container landing__stack">
            <div className="landing__feature">
              <h3 className="landing__h3">Real double-entry accounting</h3>
              <p className="landing__p">
                Every transaction automatically generates balanced journal entries — so your books stay
                accurate without manual debit and credit work.
              </p>
            </div>

            <div className="landing__feature">
              <h3 className="landing__h3">Financial reports that update instantly</h3>
              <p className="landing__p">
                OpenBooks keeps your accounting reports connected. One transaction updates everything:
              </p>
              <ul className="landing__list">
                <li>Journal Entries</li>
                <li>Ledger</li>
                <li>Trial Balance</li>
                <li>Income Statement</li>
                <li>Owner’s Equity</li>
                <li>Cash Flow Statement</li>
                <li>Balance Sheet</li>
              </ul>
            </div>

            <div className="landing__feature">
              <h3 className="landing__h3">Guided transaction types</h3>
              <p className="landing__p">Record daily activity using structured buttons:</p>
              <div className="landing__pillGrid" aria-label="Transaction types">
                <span className="landing__pill">Buy Asset</span>
                <span className="landing__pill">Pay Liability</span>
                <span className="landing__pill">Investment</span>
                <span className="landing__pill">Withdrawal</span>
                <span className="landing__pill">Revenue / Income</span>
                <span className="landing__pill">Expense</span>
              </div>
              <p className="landing__p subtle">
                Each action follows accounting principles behind the scenes, so your reports stay consistent.
              </p>
            </div>

<div className="landing__feature">
  <h3 className="landing__h3">Structured role-based access</h3>

  <div className="landing__twoCol">
    <div className="landing__miniCard">
      <div className="landing__miniTitle">Owner</div>
      <ul className="landing__miniList">
        <li>Create and manage business transactions</li>
        <li>Oversee complete financial reports</li>
        <li>Manage business settings and structure</li>
        <li>Update and control profile information</li>
        <li>Monitor overall financial performance</li>
      </ul>
    </div>

    <div className="landing__miniCard">
      <div className="landing__miniTitle">Admin</div>
      <ul className="landing__miniList">
        <li>Oversee registered users</li>
        <li>Monitor businesses within the system</li>
        <li>Maintain platform integrity</li>
        <li>Ensure proper access control</li>
        <li>Support system-level management</li>
      </ul>
    </div>
  </div>

  <p className="landing__p subtle">
    Clear permissions. Defined responsibilities. Secure business control.
  </p>
</div>

          </div>
        </section>

        <section className="landing__section landing__how">
          <div className="landing__container">
            <h2 className="landing__h2">How it works</h2>
            <div className="landing__flow">
              <div className="landing__flowItem">Create account</div>
              <div className="landing__flowArrow" aria-hidden="true">↓</div>
              <div className="landing__flowItem">Set up business</div>
              <div className="landing__flowArrow" aria-hidden="true">↓</div>
              <div className="landing__flowItem">Add transactions</div>
              <div className="landing__flowArrow" aria-hidden="true">↓</div>
              <div className="landing__flowItem">Reports update automatically</div>
              <div className="landing__flowArrow" aria-hidden="true">↓</div>
              <div className="landing__flowItem">Understand your financial position</div>
            </div>
            <p className="landing__p subtle center">Accounting made structured and simple.</p>
          </div>
        </section>

        <section className="landing__section landing__final">
          <div className="landing__container landing__finalInner">
            <h2 className="landing__h2">Start managing your business with confidence.</h2>
            <p className="landing__p">Create your account and keep your reports updated in real time.</p>
            <div className="landing__ctaRow">
              <Link className="landing__btnPrimary" to="/signup">
                Create free account
              </Link>
              <Link className="landing__btnSecondary" to="/signin">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <div className="landing__container landing__footerInner">
          <div>
            <div className="landing__footerBrand">OpenBooks</div>
            <div className="landing__footerSub">Smart Bookkeeping and Financial Report</div>
          </div>
          <div className="landing__footerCopy">© {new Date().getFullYear()} OpenBooks</div>
        </div>
      </footer>
    </div>
  );
}