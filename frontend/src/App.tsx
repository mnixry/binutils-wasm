import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

import IndexPage from "./views/IndexView";

function App() {
  return (
    <>
      <MantineProvider defaultColorScheme="auto">
        <IndexPage />
      </MantineProvider>
    </>
  );
}

export default App;
