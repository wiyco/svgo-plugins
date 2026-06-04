import type {
  SvgPlaygroundDefinition,
  TransformFn,
  TransformWorkerFactory,
} from "../model";

import { getPlaygroundPackageName } from "../../../playgrounds/registry";
import { useWorkerTransform } from "../worker/use-svg-transform-worker";
import { SvgPlaygroundIntro } from "./SvgPlayground/SvgPlaygroundHeader";
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

const SvgPlaygroundBootShell = (props: {
  definition: SvgPlaygroundDefinition;
}) => {
  const { definition } = props;
  const packageName = getPlaygroundPackageName(definition.slug);

  return (
    <main className="app-shell playground-shell">
      <SvgPlaygroundIntro
        packageName={packageName}
        slug={definition.slug}
        title={definition.title}
      />
      <section className="panel panel-boot">
        <div className="preview-placeholder">Booting the transform worker…</div>
      </section>
    </main>
  );
};

export const SvgPlaygroundApp = (props: SvgPlaygroundAppProps) => {
  const { createWorker, definition } = props;

  const transform = useWorkerTransform(createWorker);

  if (transform === null) {
    return <SvgPlaygroundBootShell definition={definition} />;
  }

  return <SvgPlaygroundPage definition={definition} transform={transform} />;
};
