# JukuSpace — wytyczne projektu

Ten dokument jest wspólnym standardem pracy nad JukuSpace. Jego celem jest
utrzymanie kodu, który jest przewidywalny, łatwy do review i zrozumiały dla
osoby dołączającej do projektu. Wytyczne opisują decyzje właściwe dla tego
repozytorium; nie zastępują dokumentacji bibliotek ani typów wynikających z
implementacji.

## 1. O projekcie

JukuSpace to aplikacja webowa wspierająca pracę korepetytorów matematyki.
Łączy interaktywną tablicę, komunikację, kalendarz, repozytorium materiałów
oraz generowanie zadań wspierane przez LLM. Interfejs ma być prosty i wygodny
również dla starszych nauczycieli.

Priorytety projektu, w tej kolejności, to:

1. poprawność danych i bezpieczeństwo,
2. czytelność oraz łatwość utrzymania,
3. dostępność i spójny UX,
4. wydajność, gdy nie pogarsza dwóch powyższych punktów.

## 2. Stack i źródła prawdy

Używamy:

- **Next.js 16.3.5** z App Routerem,
- **React 19.2** i **TypeScript 5** w trybie `strict`,
- **Tailwind CSS v4** (`@import "tailwindcss";`),
- komponentów **shadcn/ui** przechowywanych w `src/components/ui/`,
- **lucide-react** dla ikon, **framer-motion** dla animacji,
- **react-hook-form**, **zod** i `@hookform/resolvers` dla formularzy,
- **zustand** dla globalnego stanu,
- **sonner** dla powiadomień,
- **date-fns** i **react-day-picker** dla dat,
- **@excalidraw/excalidraw** dla tablicy,
- **socket.io-client** dla komunikacji w czasie rzeczywistym,
- backendu **FastAPI** rozwijanego niezależnie.

Wersje i skrypty w `package.json`, konfiguracja TypeScript w `tsconfig.json`,
reguły ESLint w `eslint.config.mjs` są źródłem prawdy. Konfigurację lokalną
opisuje `README.md`; obecnie korzystamy z jednego niecommitowanego `.env`
z serwerową zmienną `API_URL`. Nie opisujemy wersji, których projekt faktycznie
nie używa.

Przed wysłaniem zmiany uruchom:

```bash
npm run lint
npm run build
```

Jeżeli zmiana dotyczy konkretnego obszaru, najpierw uruchom możliwie
najmniejszą właściwą weryfikację, a przed mergem oba polecenia. Nowe narzędzia,
skrypty lub zależności dodaj dopiero wtedy, gdy rozwiązują konkretny problem i
zostały uzasadnione w opisie zmiany.

## 3. Organizacja kodu

```text
src/
├── app/                  # Routing, layouty i pliki konwencji Next.js
├── components/
│   ├── layout/           # Elementy wspólne, np. Sidebar, Loader, Header
│   └── ui/               # Komponenty shadcn/ui
├── features/             # Funkcjonalności pogrupowane domenowo
├── lib/                  # Infrastruktura współdzielona, np. API i auth
├── store/                # Globalny stan Zustand
├── config.ts             # Konfiguracja aplikacji
└── proxy.ts              # Integracja z mechanizmem routingu/proxy
```

Każdy feature powinien mieć możliwie zamknięty zakres:

```text
features/[feature-name]/
├── views/                # Główne widoki używane przez app/
├── components/           # Komponenty używane tylko w tym feature
├── service.ts            # Operacje API i mapowanie danych
├── types.ts              # Typy domenowe i typy odpowiedzi API
├── schema.ts             # Schematy Zod, jeżeli feature przyjmuje dane
├── hook.ts               # Hooki związane z feature, gdy ich wspólne miejsce
└── utils.ts              # Czyste funkcje pomocnicze, gdy są potrzebne
```

`app/` nie zawiera logiki biznesowej. Pliki `page.tsx` powinny głównie
przekazywać parametry do widoku z `features/`. Kod trafia do `components/`
tylko wtedy, gdy jest rzeczywiście współdzielony. Nie przenoś logiki do
globalnego katalogu wyłącznie po to, aby skrócić import.

## 4. Nazewnictwo i format kodu

- Komponenty React i widoki: `PascalCase.tsx`.
- Hooki, serwisy, utils i store: `kebab-case.ts`.
- Eksportowany hook zaczyna się od `use`, np. `useCalendarWeek`.
- Typy API mają przedrostek `Api`, typy używane przez UI są domenowe.
- Funkcje i zmienne nazywamy zgodnie z działaniem, nie implementacją.
- Preferujemy małe funkcje o jednej odpowiedzialności i jawne typy zwracane
  z publicznych funkcji serwisów.
- Nie stosujemy `any`, nieuzasadnionych rzutowań ani „magic strings”.
- Używamy istniejącego aliasu `@/*` zamiast długich ścieżek względnych.
- Nie formatujemy niezwiązanych plików przy okazji małej zmiany.
- Stałe domenowe (listy dni tygodnia, statusów, typów recurrence) używane
  w więcej niż jednym komponencie umieszczamy w `utils.ts` danego feature
  i importujemy z jednego miejsca. Nie duplikujemy tablic i obiektów
  konfiguracyjnych między komponentami.

## 4a. Komentarze w kodzie (obowiązkowe)

Kod JukuSpace musi być bogato skomentowany. Komentarze pełnią rolę nawigacji
po pliku i dokumentacji inline — nie są opcjonalne.

### Konwencja prefiksów

- `// ==========================================` — baner otwierający sekcję
  pliku (nagłówek bloku, np. "KOMPONENT", "HOOK", "SERWIS", "TYPY").
- `// ----- Nazwa podsekcji -----` — wewnętrzny podział sekcji w pliku.
- `// * ...` — ważna uwaga lub kluczowa decyzja projektowa, którą czytelnik
  musi zauważyć (np. dlaczego używamy T12:00:00 przy parsowaniu daty).
- `// ! ...` — ostrzeżenie, pułapka, nietrywialne ograniczenie lub rzecz,
  którą łatwo zepsuć (np. "nie zmieniać kolejności tych efektów").
- `// ? ...` — otwarte pytanie, wątpliwość lub rzecz do przedyskutowania
  w review (np. "? czy backend zwróci kiedyś pole X w innym formacie").
- `// TODO: [BACKEND] ...` — zadanie do zrobienia podczas integracji z API.
- `// TODO: [UX] ...` / `// TODO: [A11Y] ...` — zadania w konkretnym obszarze.
- `// ...` (zwykły) — krótkie wyjaśnienie co robi dana linia/blok, nawet
  jeśli wydaje się oczywiste.
- Nie opisujemy komentarzem tego, co wynika z nazwy funkcji lub zmiennej.
  `// Konwertuje czas na minuty` nad `timeToMinutes` jest zbędne.
  `// Dlaczego T12:00:00 — unikamy przesunięcia DST` nad `parseDateKey`
  jest wartościowe, bo wyjaśnia nietrywialną decyzję.

### Zasady stosowania

1. Każdy plik `.ts`/`.tsx` otwieramy banerem opisującym jego rolę w module.
2. W plikach `.tsx` komentujemy **każdą sekcję JSX** — nagłówek, formularz,
   przyciski akcji, modale, legendy. Nawet pojedynczy przycisk zasługuje na
   komentarz, jeśli ma konkretne znaczenie biznesowe (np. "Przełącznik
   płatności z animacją hover").
3. W serwisach każda publiczna funkcja ma komentarz opisujący cel, parametry
   istotne biznesowo oraz powiązany endpoint. `TODO: [BACKEND]` oznacza
   wyłącznie faktycznie brakującą integrację, nie podłączony endpoint.
4. W hookach komentujemy każdą zwracaną akcję i każdy useEffect — co robi,
   dlaczego istnieje, jakie ma dependencies i co sprząta.
5. W utils każda funkcja pomocnicza ma komentarz z opisem działania oraz
   przykładem użycia, jeśli nazwa nie wystarcza.
6. W schematach Zod każda sekcja (osobny schema) ma baner z nazwą formularza,
   do którego należy.
7. Komentarze piszemy po polsku, w tonie technicznym i zwięźle.
8. Komentarze powinny ułatwiać szybkie skanowanie pliku wzrokiem — czytelnik
   dołączający do projektu powinien zrozumieć strukturę pliku bez czytania
   implementacji.

### Czego nie robimy

- Nie usuwamy istniejących komentarzy przy refaktorze "bo są zbędne".
- Nie zostawiamy pustych banerów bez treści.
- Nie piszemy komentarzy w stylu "// setter stanu" nad `setX(y)` — komentarz
  ma dodawać kontekst, a nie powtarzać kod.

### Komentarze w plikach TSX

- W bloku JSX (między tagami) używamy **wyłącznie** `{/* * komentarz */}`.
  Zwykłe `//` wewnątrz JSX jest traktowane jako tekst i łamie ESLint.
- Powyżej bloku JSX (w ciele komponentu, nad `return`) stosujemy standardowe
  `// *`, `// !`, `// ?` jak w plikach `.ts`.
- Nie wstawiamy komentarzy między atrybutami jednego taga — jeśli atrybut
  wymaga wyjaśnienia, komentujemy nad całym blokiem.

## 5. Granice Server/Client i cykl życia danych

- Domyślnie komponent jest Server Component. `"use client"` dodajemy tylko,
  gdy potrzebne są hooki, eventy, browser API lub biblioteka kliencka.
- Dyrektywa `"use client"` musi znajdować się przed importami.
- Nie przekazujemy do Client Components funkcji, instancji klas ani danych,
  których nie da się bezpiecznie serializować.
- Tokeny, sekrety i prywatne dane nie trafiają do kodu klienta. Zmienna
  `NEXT_PUBLIC_*` może zawierać wyłącznie wartość przeznaczoną do ujawnienia
  w przeglądarce.
- Kod zależny od `window`, `document`, localStorage lub biblioteki browserowej
  uruchamiamy dopiero po stronie klienta i zgodnie z jej dokumentacją.
- Efekty mają sprzątać subskrypcje, timery i requesty. Dla fetchowania używamy
  `AbortController` albo flagi ochronnej, aby nie zapisywać wyniku po
  odmontowaniu komponentu.
- Stan ładowania, pusty wynik, błąd i sukces są osobnymi stanami UI. Nie
  udajemy sukcesu pustą tablicą ani cichym fallbackiem.
- Refy (`useRef`) mutujemy **wyłącznie** w `useEffect` lub event handlerach.
  Przypisanie `ref.current = ...` w ciele komponentu (podczas renderu) jest
  zabronione — React 19 Compiler może to zoptymalizować nieprzewidywalnie.
  Jeśli potrzebujesz "ostatniej wartości propa", zaktualizuj ref w `useEffect`.
- Guardy typu `if (!data) return null` umieszczamy **po** wszystkich hookach
  (`useState`, `useEffect`, `useMemo`, `useForm`, `useWatch` itp.).
  Hooki muszą być wywoływane w identycznej kolejności w każdym renderze.
  Wyjątkiem są hooki wewnątrz własnych hooków, które same nie mają early
  returnów.
- Funkcje przekazywane jako props do komponentów dzieci (`onXxx`) owijamy
  w `useCallback` z poprawnymi zależnościami, gdy dziecko jest memoizowane
  lub gdy zmiana referencji powoduje kosztowny re-render (np. siatka
  kalendarza, lista z setkami elementów). Nie owijamy w `useCallback`
  handlerów używanych tylko w jednym miejscu w JSX bez memoizacji.

`useEffect` nie służy do obliczania danych, które można wyliczyć z propsów lub
stanu. Nie wykonujemy synchronicznego `setState` na początku efektu bez
uzasadnienia; stan początkowy powinien odpowiadać pierwszemu renderowi.

## 6. Warstwa API i model danych

Docelowym źródłem danych jest niezależny backend FastAPI. Nie dodajemy nowych
mocków do działania aplikacji; istniejące obszary testowe zastępujemy prawdziwym
API podczas ich integracji. Izolowane atrapy używane wyłącznie w testach są
dozwolone. Frontend oddziela kontrakt FastAPI od modelu widoku:

1. Żądania przeglądarki wykonujemy przez `src/lib/api/api-client.ts`.
2. Operacje wywoływane przez widoki są w `features/*/service.ts`, nie w
   komponentach. Serwerowe operacje autoryzacji znajdują się w module auth.
3. Oddzielamy DTO backendu (`ApiStudent`) od modelu widoku (`Student`);
   typy zwykle znajdują się w `types.ts`, a walidowane dane sesji na serwerze
   w module sesji.
4. Mapowanie DTO do modelu UI odbywa się w serwisie lub, dla serwerowej
   sesji auth, przed przekazaniem danych do klienta.
5. Komponenty nie importują i nie wyświetlają typów `Api*`.
6. Payload ma osobny typ, jeśli różni się od odpowiedzi lub jego osobny typ
   poprawia bezpieczeństwo. `Omit` stosujemy tylko wtedy, gdy pola naprawdę
   mają ten sam kontrakt; nie ukrywamy nim różnic domenowych.

### Autoryzacja i pośrednik Next.js

- `API_URL` jest dostępne tylko na serwerze Next.js. Zarówno lokalna praca
  aplikacji, jak i produkcja używają docelowego backendu; testy mogą uruchamiać
  izolowaną atrapę na localhost.
- Logowanie, rejestracja, odtworzenie sesji, zmiana hasła i wylogowanie
  przechodzą przez `/api/auth/*`. Token jest w ciasteczku HttpOnly; w produkcji
  ma także `Secure` i prefiks `__Host-`. Nie umieszczamy go w JavaScript,
  Zustand ani localStorage.
- Chronione żądania JSON przechodzą przez `/api/backend/*`. Serwer Next.js
  sprawdza sesję, rolę i dozwolone trasy oraz przekazuje token jako Bearer.
  Dodając endpoint, aktualizujemy listę tras i testy. Walidacja formularza
  nie zastępuje walidacji na serwerze.
- Mutacje sprawdzają pochodzenie żądania. Przed produkcją hosting i reverse
  proxy muszą prawidłowo obsługiwać HTTPS i nagłówek `Host`; nie zakładamy,
  że samo ciasteczko HttpOnly chroni przed XSS.
- Panel obsługuje obecnie rolę `tutor`. Socket.IO i przesyłanie plików mają
  osobny przepływ i nie są objęte tym pośrednikiem.

Serwis powinien jasno rozdzielać odczyty, mutacje i mapowanie. Błędy z API
przekazujemy dalej jako błąd domenowy/infrastrukturalny; nie zwracamy
„udanej” wartości zastępczej. Komunikaty dla użytkownika pokazujemy w warstwie
widoku lub hooka, natomiast status i szczegóły błędu zachowujemy w typie błędu.

Dla list i detali:

- listy pobierają lekkie modele listy,
- edycja z listy pobiera szczegóły dopiero po wybraniu elementu,
- po udanej mutacji aktualizujemy UI optymistycznie tylko wtedy, gdy rollback
  lub refetch jest zdefiniowany,
- widok profilu używa pobranych już danych i po zapisie wykonuje refetch,
- operacje idempotentne i wielokrotnie wywoływane muszą być bezpieczne przy
  ponownym renderze lub ponowieniu requestu.

## 7. Formularze i walidacja

Każdy formularz:

1. ma schemat Zod w `schema.ts`,
2. eksportuje typ przez `z.infer`,
3. używa `useForm` z `zodResolver`,
4. pokazuje błąd przy konkretnym polu i dostępny dla niego komunikat,
5. blokuje submit podczas `isSubmitting`,
6. obsługuje sukces i błąd przez `toast.success()` / `toast.error()`,
7. nie wysyła danych, które nie przeszły walidacji.

Przy resetowaniu formularza z `defaultValues` przekazywanymi jako props,
upewnij się że `useEffect` nie odpala się przy każdym renderze z powodu
nowej referencji obiektu. Użyj `useRef` do przechowania ostatniej wartości
lub porównuj serializowany snapshot. Reset powinien następować tylko przy
faktycznej zmianie stanu (np. otwarcie modalu), nie przy każdym re-renderze.

Walidacja po stronie klienta poprawia UX, ale nie zastępuje walidacji backendu.
Nie umieszczamy haseł, tokenów ani danych osobowych w logach, URL-ach ani
komunikatach toast. Po błędzie zachowujemy dane formularza, jeżeli jest to
bezpieczne i wygodne dla użytkownika.

## 8. UI, UX i dostępność

Nie tworzymy własnych bazowych odpowiedników `Button`, `Input`, `Select`,
`Card`, `Dialog` itp. Używamy komponentów z `src/components/ui/`. Komponenty
shadcn modyfikujemy tylko wtedy, gdy zmiana jest wspólna i uzasadniona.

- Standardowa wysokość głównych pól i przycisków to `h-11` (44 px).
- Mniejsze kontrolki są dopuszczalne tylko w gęstych tabelach i korzystają
  z ustalonego wariantu `size="sm"`.
- Pola i przyciski: `rounded-xl`; karty i dialogi: `rounded-2xl`;
  badge i tabs: `rounded-full`.
- Kolory korzystają ze zmiennych design systemu. Usuwanie i ostrzeżenia
  używają `--destructive`, bez ręcznego dobierania podobnych odcieni.
- Modale biznesowe korzystają z `src/components/ui/modal-shell.tsx`.
- `Loader` pełnoekranowy jest tylko dla `app/loading.tsx`; w treści używamy
  `ContentLoader`, zachowując nawigację i nagłówki.
- Każda ikona ma etykietę lub `aria-label`, jeśli nie towarzyszy jej tekst.
- Interaktywne elementy są obsługiwalne klawiaturą, mają widoczny focus,
  poprawny kontrast i nie przekazują znaczenia wyłącznie kolorem.
- Formularze mają powiązane `label`, komunikaty błędów oraz sensowny
  `autocomplete`. Animacja nie może blokować obsługi ani być jedynym sygnałem.

## 9. Stan globalny i hooki

Stan trafia do Zustand tylko wtedy, gdy jest współdzielony między odległymi
częściami aplikacji lub musi przeżyć zmianę widoku. Stan formularza, otwarcia
modala i jednorazowego ładowania pozostaje lokalnie.

Store znajduje się w `src/store/use-[nazwa]-store.ts` i rozdziela typ stanu od
akcji. Nie przechowujemy w nim danych pochodnych, które można obliczyć.
Akcje są atomowe i nie ukrywają requestów bez jasnego kontraktu błędów.

Hooki feature nie powinny dublować pobierania danych. Wspólne zachowanie
wydzielamy dopiero po pojawieniu się co najmniej dwóch rzeczywistych użyć.

## 10. Tablica i komunikacja czasu rzeczywistego

`src/features/board/components/ExcalidrawBoard.tsx`, pliki stylów tablicy oraz
mikroserwis `realtime-server/` są strefą chronioną. Zawierają mechanizmy
fractional indexing/rebalancing, optymalizację cursorów do 30 FPS i
reconciliation warstw.

Nie zmieniamy ich bez uzgodnienia z właścicielem obszaru. Każda zmiana musi
opisać wpływ na synchronizację, kolejność warstw, reconnect, duplikowanie
elementów i obciążenie sieci. Eventy Socket.IO muszą mieć jawne typy payloadów,
obsługę rozłączenia oraz ochronę przed wielokrotnym zarejestrowaniem listenera.

## 11. Daty, czas i lokalizacja

- Daty i godziny parsujemy oraz formatujemy przez `date-fns` i istniejące
  utility (`parseDateKey`, `toDateKey` z `utils.ts`). Nie składamy ich
  ręcznie w wielu komponentach.
- **Zabronione:** `new Date("YYYY-MM-DD")` — w strefach czasowych z DST
  (np. CEST/CET w Polsce) może zwrócić dzień wcześniejszy. Zawsze używaj
  `parseDateKey("YYYY-MM-DD")`, który ustawia godzinę na 12:00.
- `new Date(isoString)` jest dopuszczalne tylko dla pełnych timestampów
  z strefą czasową (np. `"2025-01-15T10:00:00Z"` z API).
- Kontrakt API i format wyświetlany w UI muszą być jawne.
- Nie porównujemy dat jako nieprzenośnych stringów, jeśli zawierają czas lub
  strefę.
- Pamiętamy o polskiej lokalizacji, zmianie czasu i półotwartych zakresach
  (`from` włącznie, `to` wyłącznie), gdy dotyczy to kalendarza.

## 12. Obsługa błędów i bezpieczeństwo

- Każdy request ma określoną ścieżkę błędu: komunikat dla użytkownika,
  możliwość ponowienia lub stan pusty.
- Każdy `catch` propaguje błąd albo jawnie go obsługuje i zapewnia odpowiedni
  komunikat lub status. Nieoczekiwane błędy logujemy z kontekstem, bez haseł,
  tokenów, danych wejściowych i szczegółów zawierających dane osobowe.
  Oczekiwane błędy walidacji i anulowanie żądania można obsłużyć bez logowania,
  jeśli powód jest jasny; nie udajemy sukcesu.
- 401 chronionego żądania kończy sesję zgodnie z mechanizmem auth. 401
  logowania oznacza błędne dane, a nie wygasłą sesję; pozostałe błędy nie
  mogą automatycznie kasować danych sesji.
- Nie commitujemy `.env`, tokenów, haseł ani danych produkcyjnych.
- Dane wejściowe traktujemy jako niezaufane. Nie renderujemy surowego HTML
  bez sanitizacji i uzasadnienia.
- Logujemy tylko informacje potrzebne do diagnozy, bez sekretów i danych
  wrażliwych.

## 13. Zasady zmian i review

Zmiana powinna być możliwie mała, kompletna i ograniczona do celu. Przed
otwarciem PR autor:

1. sprawdza istniejące wzorce i użycia zmienianego kodu,
2. aktualizuje bezpośrednio związane typy, dokumentację i stany UI,
3. uruchamia lint i build,
4. opisuje wpływ na API, migracje, konfigurację i UX,
5. dołącza kroki ręcznego sprawdzenia, gdy dotyczy to interakcji.

W review sprawdzamy przede wszystkim poprawność, granice odpowiedzialności,
obsługę błędów, dostępność, regresje oraz czytelność. Nie mieszamy refaktoru
niezwiązanego z zadaniem z poprawką funkcjonalną.

## 14. Definition of Done

Zmiana jest gotowa, gdy:

- działa dla głównej ścieżki i istotnych stanów brzegowych,
- typy przechodzą w trybie strict, a `npm run lint` nie zgłasza nowych błędów,
- `npm run build` przechodzi lub znana, opisana przyczyna blokuje build,
- nie ma ostrzeżeń o wyciekach listenerów, timerów ani requestów,
- UI zachowuje loading, empty, error i success state,
- kontrolki są dostępne z klawiatury i mają poprawne etykiety,
- dokumentacja i opis wymaganej konfiguracji są aktualne, jeśli zmienił się kontrakt,
- kod jest zrozumiały bez konieczności odtwarzania historii rozmów lub zmian.
