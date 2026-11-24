This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

W pliku `.env` ustaw `API_URL` na docelowy adres backendu FastAPI:

```env
API_URL=https://jukuspace.duckdns.org
```

`API_URL` jest używany wyłącznie po stronie serwera Next.js. Podczas pracy nad
aplikacją korzystamy z docelowego backendu, bez lokalnego serwera API.

Logowanie, weryfikacja sesji, zmiana hasła i wylogowanie przechodzą przez
serwer Next.js. Token jest zapisywany w ciasteczku sesyjnym HttpOnly (Secure w
produkcji). Czas działania sesji zależy od tokena i zachowania przeglądarki;
przywrócenie sesji przez przeglądarkę może zachować ciasteczko po jej zamknięciu.
Obecnie panel jest dostępny wyłącznie dla roli `tutor`. JWT jest bezstanowy:
wylogowanie usuwa lokalną sesję, ale samo nie unieważnia wydanego tokena.
Backend odpowiada za egzekwowanie uprawnień, czasu życia tokenów i ograniczanie
prób logowania. Reset hasła i Google OAuth nie są jeszcze dostępne.

Zalogowany użytkownik otwiera zmianę hasła w modalu panelu. Jeśli backend
wymaga zmiany hasła, dostęp do panelu jest zablokowany i formularz pojawia
się na osobnym ekranie z możliwością wylogowania. Strony logowania, rejestracji
i odzyskiwania hasła przekierowują aktywną sesję do panelu albo do wymaganej
zmiany hasła.

### Wspólny klient API

Serwisy uruchamiane w przeglądarce używają `apiClient` z
`src/lib/api/api-client.ts`. Podają ścieżkę backendu i dane, bez tokena:

```ts
const students = await apiClient.get<ApiStudent[]>("/students/");
await apiClient.post("/students/", { body: student });
```

Klient kieruje żądanie do `/api/backend/*` na serwerze Next.js. Pośrednik
sprawdza sesję i rolę, przekazuje token jako Bearer oraz zwraca odpowiedź API.
Chronione operacje wymagają roli `tutor` i zakończonej zmiany hasła. API
logowania ma osobną obsługę ustawiania i usuwania ciasteczka.

Pośrednik dopuszcza wyłącznie określone ścieżki i metody z kontraktu API.
Dodając nowy endpoint, należy zaktualizować listę w
`src/lib/api/backend-proxy.ts` oraz testy. Obsługiwane są żądania
JSON oraz przesyłanie i pobieranie plików zadań; Socket.IO nie należy do tego przepływu. Kod serwerowy nie
powinien używać przeglądarkowego `apiClient` z względnym adresem.

### Baza zadań i zapis wzorów

Baza korzysta z API zadań, tagów i działów. Lista pobiera wszystkie strony,
a wyszukiwanie i filtrowanie odbywa się lokalnie. Backend określa źródło
zadania; edycja, usuwanie i zmiana tagów w tym widoku są dostępne właścicielowi.
Filtry bazy są zachowywane podczas nawigacji w aplikacji (do odświeżenia strony).
W szczegółach przyciski poprzedniego i następnego zadania używają pełnej,
posortowanej listy z aktywnymi filtrami. Liczniki poziomów, działów i typów
uwzględniają wybory w pozostałych dwóch z tych grup, niezależnie od wyszukiwania
i pozostałych filtrów; licznik działu obejmuje też jego poddziały.
Formularz wymaga działu i dopuszcza
maksymalnie 100 punktów, 10 działów, 7 tagów i 100 bloków na sekcję.
Formularz prowadzi kolejno przez dane, treść i opcjonalne rozwiązanie;
przejście do następnego etapu wymaga poprawnych danych bieżącego etapu.

W bloku tekstu przycisk „Wstaw wzór matematyczny” otwiera edytor z symbolami matematycznymi.
Symbole są pogrupowane w zakładkach; pierwsza zawiera najczęściej używane.
Na małych ekranach po wybraniu pola wzoru pojawia się klawiatura ekranowa.
Wzory można umieszczać między fragmentami tekstu i edytować przez kliknięcie.
Teksty z poprawnymi wzorami między pojedynczymi znakami `$` są wyświetlane
i otwierane w edytorze jako wzory.

Format pola `text` bloku API jest następujący:

- Tekst i wzory są zapisywane razem, np. `Oblicz $x^2 + 1$.`.
- Dosłowny znak dolara w tekście jest zapisywany jako `\$`; odwrotne ukośniki
  bezpośrednio przed dolarem są escapowane, aby ich nie utracić.
- Nieprawidłowe i niezamknięte znaczniki pozostają tekstem.
- Limit 10 000 znaków dotyczy całego pola `text` wraz ze znacznikami wzorów.
  Backend traktuje pole jako tekst, w tym składnię LaTeX.

W treści i rozwiązaniu można dodać obrazy PNG, JPEG, WebP oraz pliki PDF
o wielkości do 10 MB. Są przesyłane dopiero podczas zapisu zadania;
podgląd formularza i szczegóły zadania wyświetlają obrazy oraz PDF.
Pośrednik Next.js uwierzytelnia dostęp do plików bez udostępniania tokena przeglądarce.
Usunięcie bloku usuwa odwołanie z zadania, nie usuwa automatycznie pliku
z backendu, ponieważ plik może być używany także gdzie indziej.
Eksport zadania do PDF pozostaje odłożony do czasu dodania endpointu.
Atrapy zestawów używają innych identyfikatorów niż API zadań i nie zostały
jeszcze zintegrowane.

Testy klienta i autoryzacji uruchamia `npm run test:auth`; skrypt najpierw
wykonuje build, a następnie korzysta z izolowanej atrapy API. Atrapa jest
uruchamiana tylko na czas testów, aby nie wysyłać testowych danych do
docelowego backendu.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

`npm run dev` korzysta z Turbopacka. Po zmianie konfiguracji uruchom ponownie
działający serwer; strony nadal kompilują się przy pierwszym otwarciu.

Wersje `@radix-ui/react-dismissable-layer` i `@radix-ui/react-focus-scope`
są przypięte, aby dialogi, menu i popovery współdzieliły obsługę fokusu
i interakcji. Po aktualizacji Radix sprawdź `node --test tests/modal-dependencies.test.mjs`.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
