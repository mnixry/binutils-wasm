import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { SpeedInsights } from "@vercel/speed-insights/react";

import IndexPage from "./views/IndexView";

function App() {
  return (
    <>
      <MantineProvider defaultColorScheme="auto">
        <IndexPage />
      </MantineProvider>
      {import.meta.env.VERCEL && <SpeedInsights />}
    </>
  );
}

export default App;
