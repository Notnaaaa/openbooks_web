import { Link } from "react-router-dom";
import "../../../styles/globals.css";

export default function Accounting() {
  return (
    <div className="page">
      <h1 className="h1">Accounting Reports</h1>
      <p className="muted">Choose a report.</p>

      <div className="cardWide" style={{ marginTop: 12 }}>
        <div className="btnRow">
          <Link className="btnGhost" to="/app/reports/accounting/journal">Journal Entry</Link>
          <Link className="btnGhost" to="/app/reports/accounting/ledger">Ledger</Link>
          <Link className="btnGhost" to="/app/reports/accounting/trial-balance">Trial Balance</Link>
        </div>
      </div>
    </div>
  );
}