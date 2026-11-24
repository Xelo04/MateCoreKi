// ==========================================
// KOMPONENT: Edytor tekstu i wzorów matematycznych
// ==========================================
// * TipTap edytuje tekst i wzory w jednym bloku, a MathLive umożliwia edycję wzoru.

"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { JSONContent } from "@tiptap/core";
import { InlineMath } from "@tiptap/extension-mathematics";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { MathfieldElement } from "mathlive";
import katex from "katex";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Calculator,
  Delete,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  decodeMathContent,
  encodeMathContent,
  type MathContentPart,
} from "../math-content";
import { MathDisplay } from "./ExerciseContentRenderer";
import styles from "./MathTextEditor.module.css";
import "katex/dist/katex.min.css";
import "mathlive/fonts.css";

// ----- Typy edytora i aktualnie edytowanego wzoru -----

interface MathTextEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly label: string;
}

interface FormulaState {
  readonly latex: string;
  readonly position: number | null;
}

// ----- Symbole i ich grupy w edytorze wzoru -----

const SYMBOLS = {
  fraction: [
    "Ułamek",
    <MathDisplay key="fraction" latex={"\\frac{1}{2}"} />,
    "\\frac{#@}{#?}",
  ],
  power: ["Potęga", "xⁿ", "^{#?}"],
  root: ["Pierwiastek", "√x", "\\sqrt{#0}"],
  nthRoot: ["Pierwiastek stopnia n", "ⁿ√x", "\\sqrt[#?]{#0}"],
  subscript: ["Indeks dolny", "xₙ", "_{#?}"],
  parentheses: ["Nawiasy", "( )", "\\left(#0\\right)"],
  absolute: ["Wartość bezwzględna", "|x|", "\\left|#0\\right|"],
  plus: ["Plus", "+", "+"],
  minus: ["Minus", "−", "-"],
  multiply: ["Mnożenie", "·", "\\cdot"],
  divide: ["Dzielenie", "÷", "\\div"],
  plusMinus: ["Plus minus", "±", "\\pm"],
  equals: ["Równe", "=", "="],
  less: ["Mniejsze", "<", "<"],
  greater: ["Większe", ">", ">"],
  lessEqual: ["Mniejsze lub równe", "≤", "\\le"],
  greaterEqual: ["Większe lub równe", "≥", "\\ge"],
  notEqual: ["Różne", "≠", "\\ne"],
  infinity: ["Nieskończoność", "∞", "\\infty"],
  pi: ["Pi", "π", "\\pi"],
  alpha: ["Alfa", "α", "\\alpha"],
  beta: ["Beta", "β", "\\beta"],
  gamma: ["Gamma", "γ", "\\gamma"],
  smallDelta: ["Mała delta", "δ", "\\delta"],
  delta: ["Delta", "Δ", "\\Delta"],
  epsilon: ["Epsilon", "ε", "\\epsilon"],
  zeta: ["Zeta", "ζ", "\\zeta"],
  eta: ["Eta", "η", "\\eta"],
  theta: ["Theta", "θ", "\\theta"],
  iota: ["Jota", "ι", "\\iota"],
  kappa: ["Kappa", "κ", "\\kappa"],
  lambda: ["Lambda", "λ", "\\lambda"],
  mu: ["Mi", "μ", "\\mu"],
  nu: ["Ni", "ν", "\\nu"],
  xi: ["Ksi", "ξ", "\\xi"],
  rho: ["Ro", "ρ", "\\rho"],
  sigma: ["Sigma", "σ", "\\sigma"],
  tau: ["Tau", "τ", "\\tau"],
  upsilon: ["Ypsilon", "υ", "\\upsilon"],
  phi: ["Fi", "φ", "\\phi"],
  chi: ["Chi", "χ", "\\chi"],
  psi: ["Psi", "ψ", "\\psi"],
  omega: ["Omega", "ω", "\\omega"],
  capitalGamma: ["Wielka gamma", "Γ", "\\Gamma"],
  capitalTheta: ["Wielka theta", "Θ", "\\Theta"],
  capitalLambda: ["Wielka lambda", "Λ", "\\Lambda"],
  capitalXi: ["Wielka ksi", "Ξ", "\\Xi"],
  capitalPi: ["Wielkie pi", "Π", "\\Pi"],
  capitalSigma: ["Wielka sigma", "Σ", "\\Sigma"],
  capitalUpsilon: ["Wielki ypsilon", "Υ", "\\Upsilon"],
  capitalPhi: ["Wielkie fi", "Φ", "\\Phi"],
  capitalPsi: ["Wielkie psi", "Ψ", "\\Psi"],
  capitalOmega: ["Wielka omega", "Ω", "\\Omega"],
  sum: ["Suma", "∑", "\\sum_{#?}^{#?}"],
  reals: ["Liczby rzeczywiste", "ℝ", "\\mathbb{R}"],
  belongs: ["Należy", "∈", "\\in"],
  union: ["Suma zbiorów", "∪", "\\cup"],
  intersection: ["Część wspólna", "∩", "\\cap"],
  sin: ["Sinus", "sin", "\\sin"],
  cos: ["Cosinus", "cos", "\\cos"],
  log: ["Logarytm", "log", "\\log"],
} as const;

const SYMBOL_GROUPS = [
  {
    id: "common",
    label: "Najczęstsze",
    symbols: [
      SYMBOLS.fraction,
      SYMBOLS.power,
      SYMBOLS.nthRoot,
      SYMBOLS.subscript,
      SYMBOLS.parentheses,
      SYMBOLS.absolute,
      SYMBOLS.lessEqual,
      SYMBOLS.greaterEqual,
      SYMBOLS.multiply,
      SYMBOLS.divide,
      SYMBOLS.infinity,
      SYMBOLS.log,
    ],
  },
  {
    id: "operations",
    label: "Działania",
    symbols: [
      SYMBOLS.plus,
      SYMBOLS.minus,
      SYMBOLS.multiply,
      SYMBOLS.divide,
      SYMBOLS.plusMinus,
      SYMBOLS.fraction,
      SYMBOLS.power,
      SYMBOLS.root,
      SYMBOLS.nthRoot,
      SYMBOLS.subscript,
      SYMBOLS.parentheses,
      SYMBOLS.absolute,
      SYMBOLS.sum,
    ],
  },
  {
    id: "relations",
    label: "Porównania",
    symbols: [
      SYMBOLS.equals,
      SYMBOLS.less,
      SYMBOLS.greater,
      SYMBOLS.lessEqual,
      SYMBOLS.greaterEqual,
      SYMBOLS.notEqual,
      SYMBOLS.infinity,
    ],
  },
  {
    id: "greek",
    label: "Litery greckie",
    symbols: [
      SYMBOLS.alpha,
      SYMBOLS.beta,
      SYMBOLS.gamma,
      SYMBOLS.smallDelta,
      SYMBOLS.epsilon,
      SYMBOLS.zeta,
      SYMBOLS.eta,
      SYMBOLS.theta,
      SYMBOLS.iota,
      SYMBOLS.kappa,
      SYMBOLS.lambda,
      SYMBOLS.mu,
      SYMBOLS.nu,
      SYMBOLS.xi,
      SYMBOLS.pi,
      SYMBOLS.rho,
      SYMBOLS.sigma,
      SYMBOLS.tau,
      SYMBOLS.upsilon,
      SYMBOLS.phi,
      SYMBOLS.chi,
      SYMBOLS.psi,
      SYMBOLS.omega,
      SYMBOLS.capitalGamma,
      SYMBOLS.delta,
      SYMBOLS.capitalTheta,
      SYMBOLS.capitalLambda,
      SYMBOLS.capitalXi,
      SYMBOLS.capitalPi,
      SYMBOLS.capitalSigma,
      SYMBOLS.capitalUpsilon,
      SYMBOLS.capitalPhi,
      SYMBOLS.capitalPsi,
      SYMBOLS.capitalOmega,
    ],
  },
  {
    id: "sets",
    label: "Zbiory",
    symbols: [
      SYMBOLS.reals,
      SYMBOLS.belongs,
      SYMBOLS.union,
      SYMBOLS.intersection,
      SYMBOLS.infinity,
    ],
  },
  {
    id: "functions",
    label: "Funkcje",
    symbols: [
      SYMBOLS.sin,
      SYMBOLS.cos,
      SYMBOLS.log,
      SYMBOLS.root,
      SYMBOLS.nthRoot,
      SYMBOLS.absolute,
    ],
  },
] as const;

// * Zachowuje kolejność tekstu, wzorów i podziałów wierszy w dokumencie TipTap.
function partsToDocument(parts: readonly MathContentPart[]): JSONContent {
  const content: JSONContent[] = [];
  for (const part of parts) {
    if (part.type === "math") {
      content.push({ type: "inlineMath", attrs: { latex: part.latex } });
      continue;
    }
    const lines = part.text.split("\n");
    lines.forEach((line, index) => {
      if (index > 0) content.push({ type: "hardBreak" });
      if (line) content.push({ type: "text", text: line });
    });
  }
  return { type: "doc", content: [{ type: "paragraph", content }] };
}

// * Odtwarza części treści z dokumentu, także po podziale na akapity.
function documentToParts(document: JSONContent): MathContentPart[] {
  const result: MathContentPart[] = [];
  const appendText = (text: string) => {
    const last = result[result.length - 1];
    if (last?.type === "text") last.text += text;
    else result.push({ type: "text", text });
  };
  document.content?.forEach((paragraph, index) => {
    if (index > 0) appendText("\n");
    paragraph.content?.forEach((node) => {
      if (node.type === "text" && typeof node.text === "string")
        appendText(node.text);
      if (node.type === "hardBreak") appendText("\n");
      if (node.type === "inlineMath" && typeof node.attrs?.latex === "string") {
        result.push({ type: "math", latex: node.attrs.latex });
      }
    });
  });
  return result;
}

// ----- Klawiatura ekranowa wzoru na urządzeniach mobilnych -----

function MobileFormulaKeyboard({
  fieldRef,
  keyboardRef,
}: {
  readonly fieldRef: RefObject<MathfieldElement | null>;
  readonly keyboardRef: RefObject<HTMLDivElement | null>;
}) {
  const [uppercase, setUppercase] = useState(false);
  const keyClass =
    "h-10 min-w-0 rounded-lg border border-border bg-background text-base font-medium active:bg-muted";
  const insert = (text: string) => {
    fieldRef.current?.focus();
    fieldRef.current?.insert(text);
  };
  const key = (character: string) => {
    const displayed = uppercase ? character.toUpperCase() : character;
    return (
      <button
        key={character}
        type="button"
        className={keyClass}
        onClick={() => insert(displayed)}
      >
        {displayed}
      </button>
    );
  };

  return (
    <div
      ref={keyboardRef}
      role="group"
      aria-label="Klawiatura wzoru"
      className="absolute inset-x-0 bottom-0 z-10 space-y-1.5 border-t border-border bg-muted p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg sm:hidden"
      onPointerDown={(event) => event.preventDefault()}
    >
      <div className="grid grid-cols-10 gap-1">
        {Array.from("1234567890", key)}
      </div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from("qwertyuiop", key)}
      </div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from("asdfghjkl", key)}
        <button
          type="button"
          aria-label="Usuń poprzedni znak"
          className={keyClass}
          onClick={() => {
            fieldRef.current?.focus();
            fieldRef.current?.executeCommand("deleteBackward");
          }}
        >
          <Delete className="mx-auto h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-10 gap-1">
        <button
          type="button"
          aria-label="Wielkie litery"
          aria-pressed={uppercase}
          className={`${keyClass} ${uppercase ? "bg-primary text-primary-foreground" : ""}`}
          onClick={() => setUppercase(!uppercase)}
        >
          <ArrowUp className="mx-auto h-5 w-5" aria-hidden="true" />
        </button>
        {Array.from("zxcvbnm", key)}
        <button
          type="button"
          aria-label="Przesuń kursor w lewo"
          className={keyClass}
          onClick={() => {
            fieldRef.current?.focus();
            fieldRef.current?.executeCommand("moveToPreviousChar");
          }}
        >
          <ArrowLeft className="mx-auto h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Przesuń kursor w prawo"
          className={keyClass}
          onClick={() => {
            fieldRef.current?.focus();
            fieldRef.current?.executeCommand("moveToNextChar");
          }}
        >
          <ArrowRight className="mx-auto h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {["+", "-", "=", ".", ","].map((character) => (
          <button
            key={character}
            type="button"
            className={keyClass}
            onClick={() => insert(character === "," ? "{,}" : character)}
          >
            {character}
          </button>
        ))}
      </div>
    </div>
  );
}

// ----- Modal wstawiania i edycji pojedynczego wzoru -----

function FormulaEditor({
  initialValue,
  onCancel,
  onSave,
}: {
  readonly initialValue: string;
  readonly onCancel: () => void;
  readonly onSave: (latex: string) => void;
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const fieldRef = useRef<MathfieldElement | null>(null);
  const keyboardRef = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // * Inicjuje MathLive po zamontowaniu kontenera; cleanup usuwa pole i listenery.
  useEffect(() => {
    let active = true;
    let field: MathfieldElement | null = null;
    if (!container) return;
    const target = container;
    async function setup() {
      try {
        const { MathfieldElement } = await import("mathlive");
        if (!active) return;
        MathfieldElement.fontsDirectory = null;
        MathfieldElement.soundsDirectory = null;
        field = new MathfieldElement();
        field.value = initialValue;
        field.mathVirtualKeyboardPolicy = "manual";
        field.setAttribute("aria-label", "Wzór matematyczny");
        field.className = styles.mathField;
        field.style.width = "100%";
        field.style.minHeight = "5rem";
        field.addEventListener("input", onInput);
        field.addEventListener("focusin", onFocus);
        field.addEventListener("focusout", onBlur);
        field.addEventListener("pointerdown", onFocus);
        document.addEventListener("pointerdown", onPointerDown);
        fieldRef.current = field;
        target.appendChild(field);
        setReady(true);
        field.focus();
      } catch (err) {
        console.error("Nie udało się uruchomić edytora wzorów:", err);
        if (active) setError("Nie udało się uruchomić edytora wzorów.");
      }
    }
    function onInput() {
      if (field) {
        setValue(field.value);
        setError(null);
      }
    }
    function onFocus() {
      setKeyboardOpen(true);
    }
    function onBlur(event: FocusEvent) {
      if (
        event.relatedTarget instanceof Node &&
        keyboardRef.current?.contains(event.relatedTarget)
      )
        return;
      setKeyboardOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      const path = event.composedPath();
      if (
        field &&
        !path.includes(field) &&
        (!keyboardRef.current || !path.includes(keyboardRef.current))
      ) {
        setKeyboardOpen(false);
      }
    }
    void setup();
    return () => {
      active = false;
      if (field) {
        field.removeEventListener("input", onInput);
        field.removeEventListener("focusin", onFocus);
        field.removeEventListener("focusout", onBlur);
        field.removeEventListener("pointerdown", onFocus);
        field.remove();
      }
      document.removeEventListener("pointerdown", onPointerDown);
      fieldRef.current = null;
    };
  }, [container, initialValue]);

  return (
    <ModalShell
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      onClose={onCancel}
      title={initialValue ? "Edytuj wzór" : "Wstaw wzór"}
      icon={<Calculator className="h-6 w-6 text-white" aria-hidden="true" />}
      hideFooter
      className="max-sm:left-0 max-sm:top-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none"
    >
      <div className="space-y-4 max-sm:pb-[calc(16rem+env(safe-area-inset-bottom))]">
        <p className="text-sm text-muted-foreground">
          Wpisuj liczby i litery. Aby dodać ułamek, potęgę lub inny symbol,
          wybierz go poniżej. Kliknij puste pole we wzorze, aby je uzupełnić.
        </p>
        {/* * Kontener pola MathLive oraz komunikat walidacji wzoru. */}
        <div
          ref={setContainer}
          className="rounded-xl border border-border p-2"
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {/* * Kategorie symboli wstawiają szablony do pola wzoru. */}
        <Tabs defaultValue="common">
          <TabsList
            cols={3}
            aria-label="Kategorie symboli matematycznych"
            className="grid-cols-2 rounded-xl sm:grid-cols-3"
          >
            {SYMBOL_GROUPS.map((group) => (
              <TabsTrigger
                key={group.id}
                value={group.id}
                className="h-auto min-h-11 whitespace-normal rounded-lg px-2 text-center"
              >
                {group.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {SYMBOL_GROUPS.map((group) => (
            <TabsContent key={group.id} value={group.id} className="mt-3">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {group.symbols.map(([label, symbol, latex]) => (
                  <Button
                    key={label}
                    type="button"
                    variant="outline"
                    className="h-auto min-h-16 min-w-0 flex-col gap-1 whitespace-normal px-2 py-2"
                    disabled={!ready}
                    onClick={() => {
                      fieldRef.current?.focus();
                      fieldRef.current?.insert(latex);
                    }}
                  >
                    <span className="text-lg leading-none" aria-hidden="true">
                      {symbol}
                    </span>
                    <span className="w-full min-w-0 wrap-break-word text-center text-xs leading-tight">
                      {label}
                    </span>
                  </Button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        {/* * Zapis sprawdza poprawność wzoru przed przekazaniem go do TipTap. */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Anuluj
          </Button>
          <Button
            type="button"
            disabled={!ready || !value.trim() || Boolean(error)}
            onClick={() => {
              try {
                if (value.includes("\\placeholder"))
                  throw new Error("Nieuzupełnione pola wzoru");
                katex.renderToString(value, {
                  throwOnError: true,
                  trust: false,
                });
                setError(null);
                onSave(value);
              } catch {
                setError(
                  "Uzupełnij wszystkie pola i popraw wzór przed wstawieniem.",
                );
              }
            }}
          >
            {initialValue ? "Zapisz wzór" : "Wstaw wzór"}
          </Button>
        </div>
        {keyboardOpen && (
          <MobileFormulaKeyboard
            fieldRef={fieldRef}
            keyboardRef={keyboardRef}
          />
        )}
      </div>
    </ModalShell>
  );
}

// ----- Edytor bloku tekstowego z wzorami inline -----

export default function MathTextEditor(props: MathTextEditorProps) {
  return (
    <MathTextEditorBody
      {...props}
      initialParts={decodeMathContent(props.value)}
    />
  );
}

function MathTextEditorBody({
  onChange,
  label,
  initialParts,
}: MathTextEditorProps & {
  readonly initialParts: MathContentPart[];
}) {
  const [formula, setFormula] = useState<FormulaState | null>(null);
  const [initialDocument] = useState(() => partsToDocument(initialParts));
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bold: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        italic: false,
        link: false,
        listItem: false,
        orderedList: false,
        strike: false,
        underline: false,
      }),
      InlineMath.configure({
        katexOptions: { throwOnError: false, trust: false },
        onClick: (node, position) => {
          if (typeof node.attrs.latex === "string") {
            setFormula({ latex: node.attrs.latex, position });
          }
        },
      }),
    ],
    content: initialDocument,
    editorProps: {
      attributes: {
        "aria-label": label,
        class:
          "min-h-24 rounded-xl border border-border bg-background p-3 whitespace-pre-wrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      },
      // * Wklejanie przyjmuje wyłącznie tekst, bez obcego formatowania HTML.
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain");
        if (text === undefined) return false;
        view.dispatch(view.state.tr.insertText(text));
        return true;
      },
    },
    onUpdate: ({ editor: current }) =>
      onChange(encodeMathContent(documentToParts(current.getJSON()))),
  });

  if (!editor)
    return (
      <Loader2
        className="h-5 w-5 animate-spin"
        aria-label="Ładowanie edytora"
      />
    );

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Pisz tekst, a w miejscu kursora wstaw wzór. Kliknij wzór, aby go
        edytować.
      </p>
      {/* * Treść bloku i akcja dodania wzoru w pozycji kursora. */}
      <EditorContent editor={editor} />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 sm:w-auto"
          onClick={() => setFormula({ latex: "", position: null })}
        >
          <Plus aria-hidden="true" /> Wstaw wzór matematyczny
        </Button>
      </div>
      {/* * Modal rozróżnia wstawienie nowego wzoru od edycji istniejącego. */}
      {formula && (
        <FormulaEditor
          key={`${formula.position ?? "new"}-${formula.latex}`}
          initialValue={formula.latex}
          onCancel={() => setFormula(null)}
          onSave={(latex) => {
            if (formula.position === null) {
              editor.chain().focus().insertInlineMath({ latex }).run();
            } else {
              editor
                .chain()
                .focus()
                .setNodeSelection(formula.position)
                .updateInlineMath({ latex })
                .run();
            }
            setFormula(null);
          }}
        />
      )}
    </div>
  );
}
