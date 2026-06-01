import { SvgPlaygroundApp } from "../../core/svg-playground/ui/SvgPlaygroundPage";
import { hoistStrokeWidthPlayground } from "./definition";

const workerUrl = new URL("./svg-transform.worker.ts", import.meta.url);

const App = () => {
  return (
    <SvgPlaygroundApp
      definition={hoistStrokeWidthPlayground}
      workerUrl={workerUrl}
    />
  );
};

export default App;
