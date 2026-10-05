// ==========================================
// WRAPPER: Excalidraw z synchronizacją Real-Time (Socket.io)
// ==========================================

"use client";

import "../style.css";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  Excalidraw,
  WelcomeScreen,
  MainMenu,
  reconcileElements,
  restoreElements,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { Loader } from "@/components/layout/Loader";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";

type ExcalidrawOnChange = NonNullable<
  ComponentProps<typeof Excalidraw>["onChange"]
>;
type ExcalidrawElement = Parameters<ExcalidrawOnChange>[0][number];

interface ExcalidrawBoardProps {
  boardId: string;
  username: string;
}

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:4000";

const HELP_TRANSLATIONS: Record<string, string> = {
  "Crop image": "Przytnij obraz",
  "Finish image cropping": "Zakończ przycinanie obrazu",
  "Toggle grid": "Przełącz siatkę",
  "Canvas & Shape properties": "Właściwości płótna i kształtów",
  "Find on canvas": "Szukaj na tablicy",
  "Command palette": "Paleta poleceń",
  "Create a flowchart from a generic element":
    "Utwórz schemat z wybranego elementu",
  "Navigate a flowchart": "Nawiguj po schemacie",
  "Show font picker": "Pokaż wybór czcionki",
};

// Zbiór znaków zgodny ze specyfikacją Jepson Fractional Indexing (Base62)
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// Generuje 100% poprawne, czyste klucze indeksów ułamkowych dla Excalidraw
const getCleanFractionalIndex = (i: number): string => {
  if (i < 62) {
    return `a${BASE62[i]}`;
  }
  if (i < 62 + 62 * 62) {
    const offset = i - 62;
    const c1 = Math.floor(offset / 62);
    const c2 = offset % 62;
    return `b${BASE62[c1]}${BASE62[c2]}`;
  }
  const offset = i - (62 + 62 * 62);
  const c1 = Math.floor(offset / (62 * 62));
  const c2 = Math.floor(offset / 62) % 62;
  const c3 = offset % 62;
  return `c${BASE62[c1]}${BASE62[c2]}${BASE62[c3]}`;
};

// Naprawia skażone i znikające klucze warstw
const sanitizeAndRebalanceElements = (
  elements: readonly ExcalidrawElement[],
): { elements: ExcalidrawElement[]; fixed: boolean } => {
  if (!elements || elements.length === 0) {
    return { elements: [] as ExcalidrawElement[], fixed: false };
  }

  // 1. Sortujemy elementy według aktualnego indeksu
  const sorted = [...elements].sort((a, b) => {
    if (a.index && b.index && a.index !== b.index) {
      return a.index < b.index ? -1 : 1;
    }
    return a.id.localeCompare(b.id);
  });

  // 2. Weryfikacja potrzeby rebalansu (duplikaty, dwukropki, brak kolejności).
  let needsRebalance = false;
  const seen = new Set<string>();
  let lastIdx = "";

  for (const el of sorted) {
    if (
      !el.index ||
      el.index.includes(":") ||
      seen.has(el.index) ||
      el.index <= lastIdx
    ) {
      needsRebalance = true;
      break;
    }
    seen.add(el.index);
    lastIdx = el.index;
  }

  if (!needsRebalance) {
    return { elements: sorted, fixed: false };
  }

  // 3. Nadajemy czyste, prawidłowe klucze fractional indexing (a0, a1 ... aZ, b00 ...)
  const rebalanced = sorted.map((el, idx) => ({
    ...el,
    index: getCleanFractionalIndex(
      idx,
    ) as unknown as ExcalidrawElement["index"],
  }));

  return { elements: rebalanced, fixed: true };
};

const getElementsVersionSum = (
  elements: readonly ExcalidrawElement[],
): number => {
  return elements.reduce((acc, el) => acc + el.version + el.versionNonce, 0);
};

export function ExcalidrawBoard({ boardId, username }: ExcalidrawBoardProps) {
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const lastReceivedVersionSumRef = useRef<number>(0);
  const lastPointerUpdateRef = useRef<number>(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collaboratorsRef = useRef<Map<string, any>>(new Map());

  // Patchowanie dialogu pomocy
  useEffect(() => {
    const patchHelpDialog = () => {
      document
        .querySelectorAll(".HelpDialog__shortcut > div:first-child")
        .forEach((el) => {
          const text = el.textContent?.trim();
          if (text && HELP_TRANSLATIONS[text]) {
            el.textContent = HELP_TRANSLATIONS[text];
          }
        });
    };

    const observer = new MutationObserver(patchHelpDialog);
    observer.observe(document.body, { childList: true, subtree: true });

    patchHelpDialog();

    return () => observer.disconnect();
  }, []);

  // Połączenie z serwerem Socket.io
  useEffect(() => {
    if (!excalidrawAPI) return;

    const socket = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // Przekazujemy imię zalogowanego użytkownika do pokoju
      socket.emit("join-room", { boardId, username });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Powiadomienie o dołączeniu nowego użytkownika
    socket.on("user-joined", (user: { username: string }) => {
      toast.success(`${user.username} dołączył(a) do pokoju`);
    });

    // 1. Odbiór stanu początkowego
    socket.on("init-room-state", ({ elements, files }) => {
      if (files && Object.keys(files).length > 0) {
        excalidrawAPI.addFiles(Object.values(files));
      }

      if (elements && elements.length > 0) {
        const localElements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();

        const restoredRemote = restoreElements(elements, localElements, {
          repairBindings: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const { elements: cleanRemote } =
          sanitizeAndRebalanceElements(restoredRemote);

        const reconciled = reconcileElements(
          cleanRemote,
          localElements,
          appState,
        );

        const { elements: finalClean } =
          sanitizeAndRebalanceElements(reconciled);
        lastReceivedVersionSumRef.current = getElementsVersionSum(finalClean);

        excalidrawAPI.updateScene({ elements: finalClean });
      }
    });

    // 2. Odbiór zdalnych zmian
    socket.on(
      "server-elements-change",
      ({ elements: remoteElements, files: remoteFiles }) => {
        if (!remoteElements) return;

        if (remoteFiles && Object.keys(remoteFiles).length > 0) {
          excalidrawAPI.addFiles(Object.values(remoteFiles));
        }

        const localElements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();

        const restoredRemote = restoreElements(remoteElements, localElements, {
          repairBindings: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const { elements: cleanRemote } =
          sanitizeAndRebalanceElements(restoredRemote);

        const reconciled = reconcileElements(
          cleanRemote,
          localElements,
          appState,
        );

        const { elements: finalClean } =
          sanitizeAndRebalanceElements(reconciled);
        lastReceivedVersionSumRef.current = getElementsVersionSum(finalClean);

        excalidrawAPI.updateScene({ elements: finalClean });
      },
    );

    // 3. Odbiór kursorów
    socket.on(
      "server-pointer-update",
      ({
        socketId: remoteId,
        pointer,
        button,
        username: remoteUsername,
        color,
      }) => {
        collaboratorsRef.current.set(remoteId, {
          pointer,
          button,
          username: remoteUsername,
          color,
        });

        excalidrawAPI.updateScene({
          collaborators: new Map(collaboratorsRef.current),
        });
      },
    );

    // 4. Odejście użytkownika
    socket.on("user-left", ({ socketId: remoteId }) => {
      const user = collaboratorsRef.current.get(remoteId);
      if (user?.username) {
        toast.info(`${user.username} opuścił(a) pokój`);
      }

      collaboratorsRef.current.delete(remoteId);
      excalidrawAPI.updateScene({
        collaborators: new Map(collaboratorsRef.current),
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [excalidrawAPI, boardId, username]);

  // Obsługa zmian na tablicy z rebalansowaniem w locie
  const handleChange: ExcalidrawOnChange = useCallback(
    (elements) => {
      const { elements: cleanElements, fixed } =
        sanitizeAndRebalanceElements(elements);

      if (fixed && excalidrawAPI) {
        lastReceivedVersionSumRef.current =
          getElementsVersionSum(cleanElements);
        excalidrawAPI.updateScene({ elements: cleanElements });

        if (socketRef.current && socketRef.current.connected) {
          const files = excalidrawAPI.getFiles();
          socketRef.current.emit("client-elements-change", {
            boardId,
            elements: cleanElements,
            files,
          });
        }
        return;
      }

      const currentVersionSum = getElementsVersionSum(cleanElements);

      if (currentVersionSum === lastReceivedVersionSumRef.current) {
        return;
      }

      if (socketRef.current && socketRef.current.connected && excalidrawAPI) {
        const files = excalidrawAPI.getFiles();

        socketRef.current.emit("client-elements-change", {
          boardId,
          elements: cleanElements,
          files,
        });
      }

      // TODO: [BACKEND] Podpiąć autosafe do bazy danych
    },
    [boardId, excalidrawAPI],
  );

  // Wysyłanie kursorów na żywo z throttle do ~30 FPS
  const handlePointerUpdate = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payload: any) => {
      const now = Date.now();
      if (now - lastPointerUpdateRef.current < 33) return;
      lastPointerUpdateRef.current = now;

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("client-pointer-update", {
          boardId,
          pointer: payload.pointer,
          button: payload.button,
        });
      }
    },
    [boardId],
  );

  return (
    <>
      {/* Czerwony banner ostrzegawczy w przypadku rozłączenia z internetem/Socketem */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 z-9999 bg-destructive px-4 py-2 text-center text-sm font-semibold text-destructive-foreground shadow-md animate-in slide-in-from-top">
          ⚠️ Utracono połączenie z serwerem. Próbuję połączyć ponownie...
        </div>
      )}

      {/* Ekran ładowania do momentu, gdy Excalidraw jest gotowy do renderowania */}
      {!isReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
          <Loader />
        </div>
      )}

      <Excalidraw
        gridModeEnabled={true}
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate}
        langCode="pl-PL"
        theme="light"
        name={`Tablica zajęć ${boardId}`}
        excalidrawAPI={(api) => {
          setExcalidrawAPI(api);
          setIsReady(true);
        }}
        autoFocus={true}
        initialData={{
          appState: {
            viewBackgroundColor: "#ffffff",
            theme: "light",
            gridSize: 20,
          },
        }}
        UIOptions={{
          canvasActions: {
            loadScene: true,
            saveToActiveFile: true,
            toggleTheme: false,
            changeViewBackgroundColor: true,
            clearCanvas: true,
            saveAsImage: true,
            export: { saveFileToDisk: true },
          },
          tools: { image: true },
        }}
      >
        {/* Menu główne z opcjami pliku i zarządzania tablicą (Load, Save, Export, Clear, Background) */}
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.ItemCustom>
            <div className="text-xs text-muted-foreground opacity-50 px-2 pt-0 cursor-default pointer-events-none">
              MatCoreKi
            </div>
          </MainMenu.ItemCustom>
        </MainMenu>

        {/* Widok powitalny z instrukcjami i podpowiedziami */}
        <WelcomeScreen>
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Heading>
              <span style={{ fontSize: "2.5rem" }}>
                Tablica zajęć - MatCoreKi
              </span>
            </WelcomeScreen.Center.Heading>
            <WelcomeScreen.Center.Menu>
              <WelcomeScreen.Center.MenuItemLoadScene />
            </WelcomeScreen.Center.Menu>
          </WelcomeScreen.Center>

          <WelcomeScreen.Hints.MenuHint>
            Opcje pliku i zarządzanie tablicą
          </WelcomeScreen.Hints.MenuHint>

          <WelcomeScreen.Hints.ToolbarHint>
            Wybierz narzędzie z paska i zacznij rysować!
          </WelcomeScreen.Hints.ToolbarHint>

          <WelcomeScreen.Hints.HelpHint>
            Skróty klawiszowe i pomoc
          </WelcomeScreen.Hints.HelpHint>
        </WelcomeScreen>
      </Excalidraw>
    </>
  );
}
