import {
  AppShell,
  Center,
  Grid,
  Group,
  SegmentedControl,
  Text,
  rem,
} from "@mantine/core";
import { IconBoxSeam, IconBinary, IconBinaryOff } from "@tabler/icons-react";
import AssemblerPane from "../components/AssemblerPane";
import { useState } from "react";

export default function IndexPage() {
  const [mode, setMode] = useState<string>("asm");

  return (
    <>
      <AppShell header={{ height: 60 }}>
        <AppShell.Header>
          <Center h="100%">
            <Grid justify="space-between" align="center" w="100%" px="md">
              <Grid.Col span="content">
                <Group>
                  <IconBoxSeam />
                  <Text size="sm" fw={700}>
                    GNU/Binutils
                    <br />
                    [Dis]Assembler
                  </Text>
                </Group>
              </Grid.Col>
              <Grid.Col span="auto">
                <SegmentedControl
                  value={mode}
                  onChange={setMode}
                  data={[
                    {
                      value: "asm",
                      label: (
                        <Center style={{ gap: 10 }}>
                          <IconBinary
                            style={{ width: rem(16), height: rem(16) }}
                          />
                          <span>Assemble</span>
                        </Center>
                      ),
                    },
                    {
                      value: "disasm",
                      label: (
                        <Center style={{ gap: 10 }}>
                          <IconBinaryOff
                            style={{ width: rem(16), height: rem(16) }}
                          />
                          <span>Disassemble</span>
                        </Center>
                      ),
                    },
                  ]}
                />
              </Grid.Col>
              <Grid.Col span="content">
                <Text>About</Text>
              </Grid.Col>
            </Grid>
          </Center>
        </AppShell.Header>
        <AppShell.Main h="100vh">
          <AssemblerPane />
        </AppShell.Main>
      </AppShell>
    </>
  );
}
