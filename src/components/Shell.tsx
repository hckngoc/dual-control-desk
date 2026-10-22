export function Shell({
  children,
  lab = false,
}: {
  children: React.ReactNode;
  lab?: boolean;
}) {
  return (
    <div className="app">
      <aside>
        <a className="brand" href="/">
          ◈{" "}
          <span>
            DUAL<span className="light">CONTROL</span>
          </span>
        </a>
        <div className="workspace">
          FINANCE WORKSPACE<span>Hackathon prototype · 2026</span>
        </div>
        <nav>
          <a href="/dashboard">▦ &nbsp; Expense desk</a>
          <a href="/lab">◇ &nbsp; Interactive rehearsal</a>
          <a href="https://tide.org/tidecloak" target="_blank" rel="noreferrer">
            ↗ &nbsp; About TideCloak
          </a>
        </nav>
        <div className="aside-bottom">
          <div className="dot" /> Built with TideCloak
          <p>
            Synthetic data.
            <br />
            Mock payments only.
          </p>
        </div>
      </aside>
      <main>
        <header>
          <span>
            Workspace / <b>{lab ? "Rehearsal" : "Expense desk"}</b>
          </span>
          <span className={"pill " + (lab ? "amber" : "green")}>
            {lab ? "SIMULATION · NO TIDE AUTH" : "TIDECLOAK INTEGRATION"}
          </span>
        </header>
        {children}
      </main>
    </div>
  );
}
