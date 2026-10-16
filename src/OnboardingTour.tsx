import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import "./onboarding.css";

const steps = [
  {
    target: "",
    eyebrow: "BEM-VINDO AO BRISA",
    title: "Seu time, no mesmo ritmo.",
    body: "Vamos conhecer seu espaço de trabalho em menos de um minuto. Você pode explorar no seu tempo.",
  },
  {
    target: '[data-tour="views"]',
    eyebrow: "SEU QUADRO",
    title: "Veja o trabalho do seu jeito.",
    body: "Alterne entre quadro, lista e calendário. Tudo continua no mesmo lugar, só muda a forma de acompanhar.",
  },
  {
    target: '[data-tour="column"]',
    eyebrow: "SUAS ETAPAS",
    title: "Colunas mostram o caminho.",
    body: "Cada coluna representa uma etapa. Arraste cards entre elas e personalize nomes, cores e ordem conforme o fluxo do time.",
  },
  {
    target: '[data-tour="add-card"]',
    eyebrow: "HORA DE CRIAR",
    title: "Toda ideia começa num card.",
    body: "Adicione uma tarefa com descrição, responsáveis, prazo, etiquetas e checklist. Depois, mova o card conforme o trabalho avança.",
  },
  {
    target: '[data-tour="team"]',
    eyebrow: "TRABALHO EM EQUIPE",
    title: "Traga as pessoas para perto.",
    body: "Convide colegas, atribua responsáveis aos cards e acompanhe as entregas no mesmo espaço.",
  },
] as const;

type Rect = { top: number; left: number; width: number; height: number };

export default function OnboardingTour({
  step,
  onStepChange,
  onClose,
  onCreateCard,
  canCreateCard,
}: {
  step: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
  onCreateCard: () => void;
  canCreateCard: boolean;
}) {
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const current = steps[step];

  useEffect(() => {
    cardRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (!current.target) {
      setRect(null);
      return;
    }
    const target = document.querySelector<HTMLElement>(current.target);
    if (!target) {
      setRect(null);
      return;
    }
    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
    const update = () => {
      const bounds = target.getBoundingClientRect();
      if (!bounds.width || !bounds.height) {
        setRect(null);
        return;
      }
      setRect({
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(target);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [current.target]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  const isMobile = window.innerWidth <= 680;
  const cardWidth = Math.min(360, window.innerWidth - 32);
  const cardStyle: CSSProperties =
    rect && !isMobile
      ? {
          left: Math.max(
            16,
            Math.min(rect.left, window.innerWidth - cardWidth - 16),
          ),
          top:
            rect.top + rect.height + 316 < window.innerHeight
              ? rect.top + rect.height + 16
              : Math.max(16, rect.top - 306),
          width: cardWidth,
        }
      : {};
  return createPortal(
    <div className="onboarding-layer" role="presentation">
      <div
        className={`onboarding-scrim ${rect && !isMobile ? "has-spotlight" : ""}`}
      />
      {rect && !isMobile && (
        <div
          className="onboarding-spotlight"
          style={{
            top: Math.max(4, rect.top - 6),
            left: Math.max(4, rect.left - 6),
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}
      <section
        ref={cardRef}
        tabIndex={-1}
        className={`onboarding-card ${!rect || isMobile ? "onboarding-card-centered" : ""}`}
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        <div className="onboarding-topline">
          <span className="onboarding-mark">
            <Sparkles size={17} />
          </span>
          <span>{current.eyebrow}</span>
          <button
            type="button"
            className="onboarding-close"
            onClick={onClose}
            aria-label="Pular apresentação"
            title="Pular apresentação"
          >
            <X size={18} />
          </button>
        </div>
        <div
          className="onboarding-progress"
          aria-label={`Etapa ${step + 1} de ${steps.length}`}
        >
          {steps.map((_, index) => (
            <span key={index} className={index <= step ? "active" : ""} />
          ))}
        </div>
        {step === 0 && (
          <img
            className="onboarding-mascot"
            src="/images/brisa-mascot.webp"
            alt=""
          />
        )}
        <h2 id="onboarding-title">{current.title}</h2>
        <p id="onboarding-description">{current.body}</p>
        <div className="onboarding-actions">
          {step > 0 ? (
            <button
              type="button"
              className="onboarding-back"
              onClick={() => onStepChange(step - 1)}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          ) : (
            <button type="button" className="onboarding-skip" onClick={onClose}>
              Pular apresentação
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              type="button"
              className="onboarding-next"
              onClick={() => onStepChange(step + 1)}
            >
              Próximo <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="onboarding-next"
              onClick={canCreateCard ? onCreateCard : onClose}
            >
              {canCreateCard ? "Criar um card" : "Começar"}{" "}
              {canCreateCard ? <ArrowRight size={16} /> : <Check size={16} />}
            </button>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
