import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import IndexPage from "./pages/IndexPage";

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
