import type {
  SvgPlaygroundDefinition,
  TransformFn,
  TransformWorkerFactory,
} from "../model";

import { useWorkerTransform } from "../worker/use-svg-transform-worker";
import { SvgPlaygroundPresenter } from "./SvgPlaygroundPresenter";
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

  return (
    <SvgPlaygroundPresenter definition={definition} viewModel={viewModel} />
  );
};

type SvgPlaygroundAppProps = {
  createWorker: TransformWorkerFactory;
  definition: SvgPlaygroundDefinition;
};

export const SvgPlaygroundApp = (props: SvgPlaygroundAppProps) => {
  const { createWorker, definition } = props;

  const transform = useWorkerTransform(createWorker);

  if (transform === null) {
    return (
      <main className="app-shell playground-shell">
        <section className="panel panel-boot">
          <div className="preview-placeholder">
            Booting the transform worker…
          </div>
        </section>
      </main>
    );
  }

  return <SvgPlaygroundPage definition={definition} transform={transform} />;
};
