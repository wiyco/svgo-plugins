type SvgPlaygroundProps = {
  transform: (_payload: { svg: string }) => Promise<unknown>;
};

export const SvgPlayground = (_props: SvgPlaygroundProps) => {
  return (
    <main className="app-shell">
      <div className="hero">
        <p className="eyebrow">Package Playground</p>
        <h1>SVGO plugin playground</h1>
        <p className="hero-body">
          Scaffold for the package-scoped playground app under{" "}
          <code>apps/playground/svgo-plugin-hoist-stroke-width</code>.
        </p>
      </div>
    </main>
  );
};

const App = () => {
  return <SvgPlayground transform={async () => null} />;
};

export default App;
