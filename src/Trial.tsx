import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Wind,
} from "lucide-react";
import Brand from "./Brand";
import { supabase } from "./supabase";

export type TrialStatus = {
  started_at: string;
  ends_at: string;
  server_time: string;
  is_active: boolean;
  days_remaining: number;
};
export default function TrialGate({
  session,
  children,
}: {
  session: Session;
  children: (trial: TrialStatus) => ReactNode;
}) {
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_trial_status");
    if (error || !data?.[0]) {
      setError(
        "Não conseguimos verificar seu período de teste. Confira a conexão e tente novamente.",
      );
      return;
    }
    const status = data[0] as TrialStatus;
    setTrial(status);
    setExpired(!status.is_active);
    setError("");
  }, []);
  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    const channel = supabase
      .channel(`trial-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "workspace_trials",
        },
        onFocus,
      )
      .subscribe();
    const interval = setInterval(onFocus, 60000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [refresh, session.user.id]);
  useEffect(() => {
    if (!trial || !trial.is_active) return;
    const remaining = Date.parse(trial.ends_at) - Date.parse(trial.server_time);
    const timeout = setTimeout(
      () => {
        setExpired(true);
        void refresh();
      },
      Math.min(Math.max(remaining, 0), 2147483646),
    );
    return () => clearTimeout(timeout);
  }, [trial, refresh]);
  if (!trial)
    return (
      <div className="auth-loading">
        <Brand />
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button
              className="button button-primary"
              onClick={() => void refresh()}
            >
              Tentar novamente
            </button>
            <button
              className="link-button"
              onClick={() => void supabase.auth.signOut()}
            >
              Sair da conta
            </button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" size={24} />
            <p>Preparando seus próximos passos...</p>
          </>
        )}
      </div>
    );
  if (expired)
    return (
      <main className="trial-expired-page">
        <a href="/" className="expired-brand">
          <Brand />
        </a>
        <div className="trial-expired-card">
          <span className="trial-expired-icon">
            <Wind size={34} />
          </span>
          <span className="welcome-eyebrow">SOBRE O SEU PERÍODO DE TESTE</span>
          <h1>
            Seus 15 dias de
            <br />
            <em>Brisa chegaram ao fim.</em>
          </h1>
          <p>
            O acesso aos quadros está pausado. Os dados que já foram salvos
            continuam guardados.
          </p>
          <div className="expired-next-step">
            <LockKeyhole size={20} />
            <span>
              Para continuar, fale com a pessoa responsável pelo Brisa na sua
              equipe.
            </span>
          </div>
          <small>
            O teste terminou em{" "}
            {new Date(trial.ends_at).toLocaleDateString("pt-BR")}. Não há
            cobrança automática.
          </small>
          <div>
            <a className="welcome-button orange" href="/">
              Voltar ao Brisa
              <ArrowRight size={16} />
            </a>
            <button
              className="expired-logout"
              onClick={() => void supabase.auth.signOut()}
            >
              <LogOut size={15} />
              Sair da conta
            </button>
          </div>
        </div>
        <a className="expired-back" href="/">
          <ArrowLeft size={14} />
          Conhecer o Brisa
        </a>
      </main>
    );
  return (
    <div className="trial-layout">
      <div className="trial-notice">
        <span>
          <Clock3 size={13} />
          <strong>Seu teste está valendo.</strong>
          <span>
            {trial.days_remaining === 1
              ? "Você tem mais 1 dia para explorar."
              : `Você tem mais ${trial.days_remaining} dias para explorar.`}
          </span>
        </span>
        <a href="/#teste-gratis">
          Sobre os 15 dias grátis
          <ArrowRight size={12} />
        </a>
      </div>
      {children(trial)}
    </div>
  );
}
