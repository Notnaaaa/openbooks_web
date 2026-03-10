import { Link } from "react-router-dom";
import "../../../styles/globals.css";

export default function Statement() {
  return (
    <div className="page">
      <h1 className="h1">Financial Statements</h1>
      <p className="muted">Choose a statement.</p>

      <div className="cardWide" style={{ marginTop: 12 }}>
        <div className="btnRow">
          <Link className="btnGhost" to="/app/reports/statement/income-statement">Income Statement</Link>
          <Link className="btnGhost" to="/app/reports/statement/balance-sheet">Balance Sheet</Link>
          <Link className="btnGhost" to="/app/reports/statement/owners-equity">Owner’s Equity</Link>
          <Link className="btnGhost" to="/app/reports/statement/cash-flow">Cash Flow</Link>
        </div>
      </div>
    </div>
  );
}