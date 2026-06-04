import { SvgPlaygroundApp } from "../../core/svg-playground/ui/SvgPlaygroundPage";
import { hoistStrokeWidthPlayground } from "./definition";

const createWorker = () => {
  return new Worker(new URL("./svg-transform.worker.ts", import.meta.url), {
    type: "module",
  });
};

const App = () => {
  return (
    <SvgPlaygroundApp
      createWorker={createWorker}
      definition={hoistStrokeWidthPlayground}
    />
  );
};

export default App;
