import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LayoutGrid,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import App from "./App";
import { supabase } from "./supabase";
import { useWorkspace } from "./cloud";
import "./auth.css";

function Logo() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <i />
        <i />
        <i />
      </span>
      brisa<span className="brand-dot">.</span>
    </span>
  );
}
function authError(error: { message: string; code?: string }) {
  if (error.message.includes("Invalid login credentials"))
    return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  if (error.code === "email_not_confirmed")
    return "Confirme seu e-mail antes de entrar. O link está na sua caixa de entrada.";
  if (
    error.code === "user_already_exists" ||
    error.message.includes("already registered")
  )
    return "Já existe uma conta com esse e-mail. Use a opção Entrar.";
  if (
    error.code?.includes("rate_limit") ||
    error.message.toLowerCase().includes("rate limit")
  )
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
  if (error.code === "email_address_not_authorized")
    return "O envio de e-mails ainda precisa ser configurado. Entre em contato com a equipe do Brisa.";
  if (error.message.toLowerCase().includes("password"))
    return "Use uma senha de pelo menos 8 caracteres, com letras e números.";
  if (error.message.includes("fetch"))
    return "Não conseguimos conectar. Verifique sua internet e tente novamente.";
  return "Não foi possível concluir. Confira os dados e tente novamente.";
}

export default function AuthRoot() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(
    () =>
      new URLSearchParams(location.hash.slice(1)).get("type") === "recovery",
  );
  const [initialError, setInitialError] = useState(
    () =>
      new URLSearchParams(location.hash.slice(1)).get("error_description") ||
      "",
  );
  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          setSession(data.session);
          setReady(true);
          if (error) setInitialError(authError(error));
        }
      })
      .catch(() => {
        if (active) {
          setReady(true);
          setInitialError(
            "Não foi possível verificar sua sessão. Tente entrar novamente.",
          );
        }
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      if (active) {
        setSession(next);
        setReady(true);
        if (event === "PASSWORD_RECOVERY") setRecovery(true);
        if (event === "SIGNED_OUT") setRecovery(false);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  if (!ready)
    return (
      <div className="auth-loading">
        <Logo />
        <LoaderCircle className="spin" size={23} />
        <p>Preparando seu espaço...</p>
      </div>
    );
  if (recovery && session)
    return (
      <AuthScreen
        mode="update"
        initialError={initialError}
        onPasswordUpdated={() => {
          setRecovery(false);
          history.replaceState(null, "", location.pathname);
        }}
      />
    );
  if (!session) return <AuthScreen initialError={initialError} />;
  return <ConnectedApp key={session.user.id} session={session} />;
}

function ConnectedApp({ session }: { session: Session }) {
  const cloud = useWorkspace(session.user);
  const [logoutError, setLogoutError] = useState("");
  if (!cloud.state)
    return (
      <div className="auth-loading">
        <Logo />
        {cloud.error ? (
          <>
            <p role="alert">{cloud.error}</p>
            <button className="button button-primary" onClick={cloud.retry}>
              Tentar novamente
            </button>
            <button
              className="link-button"
              onClick={() => void supabase.auth.signOut()}
            >
              Voltar ao login
            </button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" size={24} />
            <p>Abrindo seus quadros...</p>
          </>
        )}
      </div>
    );
  async function logout() {
    if (!(await cloud.finish())) {
      setLogoutError(
        "Há alterações aguardando sincronização. Conecte-se e tente sair novamente para salvar seu trabalho.",
      );
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) setLogoutError("Não foi possível sair. Tente novamente.");
  }
  return (
    <>
      {logoutError && (
        <div className="sync-warning" role="alert">
          {logoutError}
          <button onClick={() => setLogoutError("")}>Fechar</button>
        </div>
      )}
      <App
        initialState={cloud.state}
        onStateChange={cloud.change}
        syncStatus={cloud.status}
        userId={session.user.id}
        onSignOut={() => void logout()}
        onRetrySync={cloud.retry}
      />
    </>
  );
}

function AuthScreen({
  mode: initialMode = "login",
  initialError = "",
  onPasswordUpdated,
}: {
  mode?: "login" | "update";
  initialError?: string;
  onPasswordUpdated?: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "update">(
    () =>
      initialMode === "login" &&
      new URLSearchParams(location.search).has("signup")
        ? "signup"
        : initialMode,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");
  function switchMode(next: typeof mode) {
    setMode(next);
    setError("");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (mode === "signup" || mode === "update") {
      if (
        password.length < 8 ||
        !/[a-zA-Z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        setError("Use pelo menos 8 caracteres, incluindo letras e números.");
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas precisam ser iguais.");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: location.origin,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage(
            "Conta criada! Confira seu e-mail para confirmar o cadastro e depois entre com sua senha.",
          );
          setPassword("");
          setConfirmPassword("");
        }
      }
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: location.origin },
        );
        if (error) throw error;
        setMessage(
          "Se houver uma conta com esse e-mail, você receberá as instruções para criar uma nova senha.",
        );
      }
      if (mode === "update") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        onPasswordUpdated?.();
      }
    } catch (e) {
      setError(authError(e as { message: string; code?: string }));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-story">
        <a href="/" aria-label="Brisa">
          <Logo />
        </a>
        <div className="auth-story-content">
          <span className="auth-eyebrow">
            <Sparkles size={14} />
            UM POUCO DE CLAREZA MUDA TUDO
          </span>
          <h1>
            Boas ideias merecem
            <br />
            espaço para <em>acontecer.</em>
          </h1>
          <p>
            Seu time, suas ideias e os próximos passos.
            <br />
            Tudo em sintonia, de onde você estiver.
          </p>
          <div className="auth-mini-board">
            <div>
              <span>
                <i />
                Para começar<b>2</b>
              </span>
              <article>
                <small className="purple-label">Design</small>
                <strong>Imaginar o próximo capítulo</strong>
                <div>
                  <span>✦</span>
                  <span className="fake-avatar">AO</span>
                </div>
              </article>
              <article>
                <small className="blue-label">Estratégia</small>
                <strong>Dar o primeiro passo</strong>
                <div>
                  <span>☑ 1/3</span>
                  <span className="fake-avatar green">LS</span>
                </div>
              </article>
            </div>
            <div>
              <span>
                <i />
                Em andamento<b>1</b>
              </span>
              <article className="auth-featured-card">
                <img
                  src="/covers/brand.svg"
                  alt="Referências visuais para um projeto criativo"
                />
                <div>
                  <small className="purple-label">Design</small>
                  <strong>Criar algo que faz sentido</strong>
                  <div>
                    <span>☑ 3/5</span>
                    <span className="fake-avatar peach">MC</span>
                  </div>
                </div>
              </article>
              <span className="auth-add-card">+ Adicionar uma boa ideia</span>
            </div>
          </div>
          <div className="auth-perks">
            <span>
              <LayoutGrid size={15} />
              Organize com liberdade
            </span>
            <span>
              <Users size={15} />
              Crie em equipe
            </span>
          </div>
        </div>
        <div className="auth-story-footer">
          <span>Um passo de cada vez.</span>
          <Sparkles size={15} />
        </div>
        <div className="auth-hill hill-one" />
        <div className="auth-hill hill-two" />
      </section>
      <section className="auth-form-side">
        <div className="auth-mobile-logo">
          <Logo />
        </div>
        <div className="auth-form-container">
          <span className="auth-form-icon">
            {mode === "signup" ? (
              <Users size={24} />
            ) : mode === "forgot" || mode === "update" ? (
              <LockKeyhole size={24} />
            ) : (
              <Sparkles size={24} />
            )}
          </span>
          <h2>
            {mode === "signup"
              ? "Vamos criar coisas boas?"
              : mode === "forgot"
                ? "Um novo começo para sua senha."
                : mode === "update"
                  ? "Escolha sua nova senha."
                  : "Que bom ter você por aqui."}
          </h2>
          <p className="auth-form-description">
            {mode === "signup"
              ? "Crie sua conta e junte-se ao workspace da equipe."
              : mode === "forgot"
                ? "Informe seu e-mail para receber as instruções."
                : mode === "update"
                  ? "Uma senha forte ajuda a guardar suas ideias."
                  : "Entre na sua conta e dê vida às suas ideias."}
          </p>
          {(mode === "login" || mode === "signup") && (
            <div
              className="auth-tabs"
              role="tablist"
              aria-label="Acesso à conta"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={mode === "login" ? "active" : ""}
                onClick={() => switchMode("login")}
              >
                Entrar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className={mode === "signup" ? "active" : ""}
                onClick={() => switchMode("signup")}
              >
                Criar conta
              </button>
            </div>
          )}
          <form onSubmit={(e) => void submit(e)}>
            {mode === "signup" && (
              <>
                <label className="field-label" htmlFor="auth-name">
                  Seu nome
                </label>
                <input
                  id="auth-name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Como podemos chamar você?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                />
              </>
            )}
            {mode !== "update" && (
              <>
                <label className="field-label" htmlFor="auth-email">
                  Seu e-mail
                </label>
                <div className="auth-input-icon">
                  <Mail size={16} />
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={busy}
                  />
                </div>
              </>
            )}
            {mode !== "forgot" && (
              <>
                <div className="auth-password-label">
                  <label className="field-label" htmlFor="auth-password">
                    {mode === "update" ? "Nova senha" : "Senha"}
                  </label>
                  {mode === "login" && (
                    <button type="button" onClick={() => switchMode("forgot")}>
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="auth-input-icon">
                  <LockKeyhole size={16} />
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={mode === "login" ? 1 : 8}
                    maxLength={128}
                    placeholder={
                      mode === "login" ? "Sua senha" : "Pelo menos 8 caracteres"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {mode !== "login" && (
                  <>
                    <small className="auth-password-hint">
                      Combine letras e números para uma senha mais segura.
                    </small>
                    <label className="field-label" htmlFor="auth-confirm">
                      Confirmar senha
                    </label>
                    <input
                      id="auth-confirm"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      placeholder="Digite sua senha novamente"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={busy}
                    />
                  </>
                )}
              </>
            )}
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            {message && (
              <div className="auth-success" role="status">
                <Check size={18} />
                {message}
              </div>
            )}
            <button
              className="button button-primary auth-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={17} />
                  Só um instante...
                </>
              ) : (
                <>
                  {mode === "signup"
                    ? "Criar minha conta"
                    : mode === "forgot"
                      ? "Enviar instruções"
                      : mode === "update"
                        ? "Salvar nova senha"
                        : "Entrar no meu espaço"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
            {(mode === "forgot" || mode === "update") && (
              <button
                className="auth-back"
                type="button"
                onClick={() =>
                  mode === "update"
                    ? void supabase.auth.signOut()
                    : switchMode("login")
                }
              >
                <ArrowLeft size={14} />
                Voltar para o login
              </button>
            )}
          </form>
          <p className="auth-security">
            <ShieldCheck size={15} />
            Acesso seguro. Suas ideias bem guardadas.
          </p>
          {mode === "signup" && (
            <p className="auth-equal-access">
              Todos os membros têm o mesmo acesso aos quadros da equipe.
            </p>
          )}
        </div>
        <footer className="auth-form-footer">
          Feito para deixar seu trabalho mais leve.<span>brisa.</span>
        </footer>
      </section>
    </main>
  );
}
