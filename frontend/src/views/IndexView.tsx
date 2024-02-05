import { useState } from "react";

import {
  AppShell,
  Button,
  Center,
  Divider,
  Grid,
  Group,
  Modal,
  SegmentedControl,
  Text,
  Transition,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconBinary,
  IconBinaryOff,
  IconBoxSeam,
  IconBrandGithub,
} from "@tabler/icons-react";

import AssemblerPage from "../pages/AssemblerPage";
import DisassemblerPage from "../pages/DisassemblerPage";

export default function IndexPage() {
  const [mode, setMode] = useState<string>("asm");
  const [aboutOpened, { open: openAbout, close: closeAbout }] =
    useDisclosure(false);

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
                <Button onClick={openAbout} variant="transparent">
                  About
                </Button>
                <Modal
                  opened={aboutOpened}
                  onClose={closeAbout}
                  title="About"
                  overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                  }}
                >
                  <Text size="sm">
                    This is a web-based assembler and disassembler, utilizing
                    GNU Binutils and ported to WebAssembly, thus functioning as
                    a purely static website. The development of this website is
                    facilitated by the use of Mantine and Vite.
                  </Text>
                  <Button
                    component="a"
                    leftSection={<IconBrandGithub />}
                    fullWidth
                    variant="outline"
                    mt="md"
                    href="https://github.com/mnixry/binutils-wasm"
                    target="_blank"
                  >
                    Star on GitHub
                  </Button>
                  <Divider />
                  <Text size="xs" pt="md" style={{ fontFamily: "monospace" }}>
                    Copyright (C) {new Date().getFullYear()} Mix
                    <Divider my="sm" />
                    This program is free software: you can redistribute it
                    and/or modify it under the terms of the GNU General Public
                    License as published by the Free Software Foundation, either
                    version 3 of the License, or (at your option) any later
                    version. This program is distributed in the hope that it
                    will be useful, but WITHOUT ANY WARRANTY; without even the
                    implied warranty of MERCHANTABILITY or FITNESS FOR A
                    PARTICULAR PURPOSE. See the GNU General Public License for
                    more details. You should have received a copy of the GNU
                    General Public License along with this program. If not, see
                    https://www.gnu.org/licenses/.
                  </Text>
                </Modal>
              </Grid.Col>
            </Grid>
          </Center>
        </AppShell.Header>
        <AppShell.Main h="100vh">
          <Transition mounted={mode === "asm"}>
            {(styles) => <AssemblerPage style={styles} />}
          </Transition>
          <Transition mounted={mode === "disasm"}>
            {(styles) => <DisassemblerPage style={styles} />}
          </Transition>
        </AppShell.Main>
      </AppShell>
    </>
  );
}
