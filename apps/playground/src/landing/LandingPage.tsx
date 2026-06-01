import { PLAYGROUNDS } from "../playgrounds/registry";

export const LandingPage = () => {
  return (
    <main className="landing-shell">
      <header className="landing-hero">
        <p className="landing-kicker">Workspace Playground</p>
        <h1>SVGO Plugin Playgrounds</h1>
        <p className="landing-copy">
          Each slug-specific page is served from the shared
          <code> apps/playground </code>
          app and published as static HTML at its own path.
        </p>
      </header>

      <ul className="landing-grid">
        {PLAYGROUNDS.map((playground) => {
          return (
            <li key={playground.slug} className="landing-card">
              <a href={`./${playground.slug}/`}>
                <strong>{playground.slug}</strong>
                <span>{playground.summary}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
};
