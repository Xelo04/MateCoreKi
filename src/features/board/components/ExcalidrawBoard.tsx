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
import { Excalidraw, WelcomeScreen, MainMenu } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { Loader } from "@/components/layout/Loader";
import { io, type Socket } from "socket.io-client";

type ExcalidrawOnChange = NonNullable<
  ComponentProps<typeof Excalidraw>["onChange"]
>;

interface ExcalidrawBoardProps {
  boardId: string;
}

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:4000";

// Tłumaczenia wybranych elementów dialogu pomocy Excalidraw
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

export function ExcalidrawBoard({ boardId }: ExcalidrawBoardProps) {
  const [isReady, setIsReady] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  // Flaga zabezpieczająca przed pętlą nieskończoną wysyłania zdarzeń
  const isReceivingRemoteUpdate = useRef(false);
  const socketRef = useRef<Socket | null>(null);

  // Mapa kursorów
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collaboratorsRef = useRef<Map<string, any>>(new Map());

  // * Patchowanie dialogu pomocy Excalidraw, aby wyświetlał tłumaczenia skrótów klawiszowych.
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

    // od razu, gdyby dialog już był otwarty
    patchHelpDialog();

    return () => observer.disconnect();
  }, []);

  // * Połączenie z mikroserwisem Node.js i obsługa zdarzeń Real-Time
  useEffect(() => {
    if (!excalidrawAPI) return;

    // Połączenie z mikroserwisem Node.js
    const socket = io(SOCKET_SERVER_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Połączono z serwerem Real-time:", socket.id);
      socket.emit("join-room", { boardId, username: "Użytkownik" });
    });

    // 1. Odbiór stanu początkowego (dla spóźnionych)
    socket.on("init-room-state", ({ elements }) => {
      if (elements && elements.length > 0) {
        isReceivingRemoteUpdate.current = true;
        excalidrawAPI.updateScene({ elements });
        setTimeout(() => {
          isReceivingRemoteUpdate.current = false;
        }, 50);
      }
    });

    // 2. Odbiór zdalnych zmian na tablicy od drugiego użytkownika
    socket.on("server-elements-change", ({ elements }) => {
      isReceivingRemoteUpdate.current = true;
      excalidrawAPI.updateScene({ elements });
      setTimeout(() => {
        isReceivingRemoteUpdate.current = false;
      }, 50);
    });

    // 3. Odbiór pozycji kursorów od drugiego użytkownika
    socket.on(
      "server-pointer-update",
      ({ socketId: remoteId, pointer, button, username, color }) => {
        collaboratorsRef.current.set(remoteId, {
          pointer,
          button,
          username,
          color,
        });

        excalidrawAPI.updateScene({
          collaborators: new Map(collaboratorsRef.current),
        });
      },
    );

    // 4. Gdy drugi użytkownik opuści pokój
    socket.on("user-left", ({ socketId: remoteId }) => {
      collaboratorsRef.current.delete(remoteId);
      excalidrawAPI.updateScene({
        collaborators: new Map(collaboratorsRef.current),
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [excalidrawAPI, boardId]);

  // * Tymczasowa funkcja obsługi zmian w tablicy (do podpięcia w kolejnych krokach)
  const handleChange: ExcalidrawOnChange = useCallback(
    (elements, appState) => {
      // Jeśli zmiana przychodzi z serwera, NIE wysyłamy jej z powrotem!
      if (isReceivingRemoteUpdate.current) return;

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("client-elements-change", {
          boardId,
          elements,
        });
      }
      // TODO: [BACKEND] Podpiąć zapisywanie stanu tablicy do bazy danych.
    },
    [boardId],
  );

  // * Wysyłanie ruchów myszki/rysika na żywo
  const handlePointerUpdate = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payload: any) => {
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
        {/* ==========================================
          WŁASNE MENU GŁÓWNE
          ========================================== */}
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

        {/* ==========================================
          EKRAN POWITALNY MATCOREKI
          ========================================== */}
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
