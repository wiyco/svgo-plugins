import type { SvgPlaygroundDefinition, TransformFn } from "../model";

import { useWorkerTransform } from "../worker/use-svg-transform-worker";
import { SvgPlaygroundView } from "./SvgPlaygroundView";
import { useSvgPlaygroundController } from "./use-svg-playground-controller";

type SvgPlaygroundPageProps = {
  definition: SvgPlaygroundDefinition;
  transform: TransformFn;
};

export const SvgPlaygroundPage = (props: SvgPlaygroundPageProps) => {
  const { definition, transform } = props;

  const viewModel = useSvgPlaygroundController({
    definition,
    transform,
  });

  return <SvgPlaygroundView definition={definition} {...viewModel} />;
};

type SvgPlaygroundAppProps = {
  definition: SvgPlaygroundDefinition;
  workerUrl: URL;
};

export const SvgPlaygroundApp = (props: SvgPlaygroundAppProps) => {
  const { definition, workerUrl } = props;

  const transform = useWorkerTransform(workerUrl);

  if (transform === null) {
    return (
      <main className="app-shell">
        <section className="panel">
          <div className="preview-placeholder">
            Booting the transform worker…
          </div>
        </section>
      </main>
    );
  }

  return <SvgPlaygroundPage definition={definition} transform={transform} />;
};
