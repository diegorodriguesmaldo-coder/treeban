import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  LayoutGrid,
  List,
  LockKeyhole,
  Menu,
  MessageCircle,
  MoreHorizontal,
  MousePointer2,
  Palette,
  Paperclip,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  Wind,
  X,
} from "lucide-react";
import Brand from "./Brand";
import "./welcome.css";

const demoTasks = [
  {
    id: 1,
    title: "Uma boa ideia começa aqui",
    label: "Estratégia",
    color: "green",
    stage: 0,
    initials: "MC",
    description:
      "Reúna as ideias da campanha e escolha o primeiro passo com a equipe.",
  },
  {
    id: 2,
    title: "Referências para a campanha",
    label: "Inspiração",
    color: "purple",
    stage: 0,
    initials: "AO",
    description:
      "Guarde as referências visuais no mesmo lugar em que o trabalho acontece.",
  },
  {
    id: 3,
    title: "Dar vida à identidade visual",
    label: "Design",
    color: "orange",
    stage: 1,
    initials: "AO",
    description:
      "Escolha uma direção visual e compartilhe a evolução com a equipe.",
  },
  {
    id: 4,
    title: "Escrever a próxima história",
    label: "Conteúdo",
    color: "blue",
    stage: 1,
    initials: "BC",
    description:
      "Do primeiro rascunho à revisão final, deixe o contexto junto da tarefa.",
  },
  {
    id: 5,
    title: "Alinhar o briefing com a equipe",
    label: "Estratégia",
    color: "green",
    stage: 2,
    initials: "MC",
    description: "Objetivos definidos. Todo mundo sabe o que vem a seguir.",
  },
];
const questions = [
  {
    q: "Como funcionam os 15 dias grátis?",
    a: "O período começa quando você cria sua conta. Você pode usar os quadros e os recursos do Brisa durante 15 dias. Ao final, o acesso aos quadros é pausado. Os dados já salvos permanecem guardados e não há cobrança automática.",
  },
  {
    q: "Preciso cadastrar um cartão?",
    a: "Seu cadastro pede apenas nome, e-mail e senha. O teste de 15 dias começa com a criação da conta.",
  },
  {
    q: "Posso deixar o quadro do meu jeito?",
    a: "Pode. Crie, renomeie e reordene colunas, escolha suas cores e mova os cards conforme o seu fluxo. Dentro de cada card, você pode reunir prazos, responsáveis, checklists, comentários e anexos.",
  },
  {
    q: "A equipe consegue acompanhar de outro lugar?",
    a: "Sim. O Brisa funciona no navegador, no computador e no celular. As alterações são sincronizadas no espaço compartilhado da equipe. Cada pessoa entra com sua própria conta.",
  },
];

export default function Welcome({ signedIn = false }: { signedIn?: boolean }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [demoView, setDemoView] = useState("board");
  const [selected, setSelected] = useState<(typeof demoTasks)[number] | null>(
    null,
  );
  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = document.querySelector<HTMLElement>(".demo-modal");
    root?.querySelector<HTMLElement>("button")?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "Tab") {
        const items = Array.from(
          root?.querySelectorAll<HTMLElement>("button,a[href]") || [],
        );
        const first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [selected]);
  const signup = signedIn ? "/app" : "/cadastro";
  return (
    <div className="welcome-page">
      <a className="welcome-skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="welcome-header">
        <a href="/" aria-label="Brisa, início">
          <Brand />
        </a>
        <nav
          className={mobileMenu ? "welcome-nav is-open" : "welcome-nav"}
          aria-label="Navegação da página"
        >
          <a href="#por-dentro" onClick={() => setMobileMenu(false)}>
            Por dentro do Brisa
          </a>
          <a href="#como-funciona" onClick={() => setMobileMenu(false)}>
            Como funciona
          </a>
          <a href="#teste-gratis" onClick={() => setMobileMenu(false)}>
            15 dias grátis<span className="nav-little-sun">✳</span>
          </a>
        </nav>
        <div className="welcome-nav-actions">
          <a className="welcome-login" href={signedIn ? "/app" : "/login"}>
            {signedIn ? "Meu espaço" : "Entrar"}
            <ArrowUpRight size={15} />
          </a>
          <a className="welcome-button orange nav-trial" href={signup}>
            Experimentar grátis
            <ArrowRight size={16} />
          </a>
          <button
            className="welcome-mobile-toggle"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label={mobileMenu ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenu}
          >
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      <main id="conteudo">
        <section className="welcome-hero">
          <div className="hero-copy">
            <span className="welcome-eyebrow">
              <span className="little-orange-dot" />
              SUAS IDEIAS ESTÃO EM BOA COMPANHIA
            </span>
            <h1>
              Tire as ideias
              <br />
              do papel.
              <br />
              <span>Coloque no Brisa.</span>
              <svg viewBox="0 0 400 20" aria-hidden="true">
                <path d="M4 12Q140-2 285 10T396 9M38 18Q180 8 342 15" />
              </svg>
            </h1>
            <p>
              Organize projetos em quadros, distribua as tarefas e acompanhe
              cada entrega. Sua equipe encontra o próximo passo no mesmo lugar.
            </p>
            <div className="hero-cta">
              <a className="welcome-button orange large" href={signup}>
                {signedIn ? "Abrir meu espaço" : "Começar meus 15 dias grátis"}
                <ArrowRight size={18} />
              </a>
              <a className="hero-explore" href="#por-dentro">
                Dar uma olhada
                <ArrowDown size={15} />
              </a>
            </div>
            <div className="hero-assurances">
              <span>
                <Check size={14} />
                15 dias para experimentar
              </span>
              <span>
                <Check size={14} />
                Sem cartão de crédito
              </span>
            </div>
            <div className="hero-personal-note">
              <span className="note-asterisk">✳</span>
              <span>
                Você cuida das ideias.
                <br />
                <strong>A gente ajuda a organizar o caminho.</strong>
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            aria-label="O mascote do Brisa e uma prévia dos cards"
          >
            <div className="hero-art-circle" />
            <div className="hero-art-dots" />
            <span className="hero-art-spark spark-one">✳</span>
            <span className="hero-art-spark spark-two">✦</span>
            <div className="mascot-speech">
              Bora fazer
              <br />
              acontecer?
              <svg viewBox="0 0 60 40" aria-hidden="true">
                <path d="M5 3Q5 30 48 28m-8-8 10 8-12 7" />
              </svg>
            </div>
            <img
              className="hero-mascot"
              src="/images/brisa-mascot.webp"
              width="720"
              height="900"
              alt="Mascote do Brisa: um criativo de agência com roupa laranja, óculos e um jeito descontraído"
              fetchPriority="high"
            />
            <div className="floating-task floating-idea">
              <span className="floating-task-icon">
                <Sparkles size={18} />
              </span>
              <div>
                <small>IDEIA BOA A GENTE GUARDA</small>
                <strong>Campanha que vai dar o que falar</strong>
                <span className="floating-tag">Criatividade</span>
              </div>
              <button
                aria-label="Conhecer os cards do Brisa"
                onClick={() =>
                  document
                    .getElementById("por-dentro")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="floating-task floating-done">
              <span className="floating-done-icon">
                <Check size={18} />
              </span>
              <span>
                <strong>Mais uma entrega no ar.</strong>
                <small>Deu bom, equipe.</small>
              </span>
              <span className="mini-confetti">✦</span>
            </div>
            <span className="hero-art-caption">
              <Wind size={15} />
              Um respiro no seu dia de trabalho.
            </span>
          </div>
        </section>

        <div className="welcome-benefit-strip">
          <span>
            <LayoutGrid size={18} />
            Cada projeto tem seu espaço.
          </span>
          <i />
          <span>
            <Users size={18} />A equipe acompanha junto.
          </span>
          <i />
          <span>
            <Wind size={20} />O trabalho ganha uma boa Brisa.
          </span>
        </div>

        <section className="welcome-product section-wrap" id="por-dentro">
          <div className="section-intro">
            <span className="welcome-eyebrow">
              ORGANIZAÇÃO QUE DÁ PARA ENXERGAR
            </span>
            <h2>
              Quando tudo tem um lugar,
              <br />
              as ideias <em>ganham espaço.</em>
            </h2>
            <p>
              Cada projeto ganha um quadro. Cada próximo passo vira um card.
              <br />O contexto fica junto da tarefa, onde a equipe precisa dele.
            </p>
          </div>
          <div className="product-preview">
            <div className="preview-top">
              <div>
                <span className="preview-space-icon">
                  B<span>✦</span>
                </span>
                <span>
                  Nosso próximo grande projeto
                  <small>
                    <span className="preview-live-dot" />A equipe está por aqui
                  </small>
                </span>
              </div>
              <div className="preview-collaborators">
                <span>MC</span>
                <span>AO</span>
                <span>BC</span>
                <a href={signup} aria-label="Convidar sua equipe">
                  <Plus size={14} />
                </a>
              </div>
            </div>
            <div
              className="preview-tabs"
              role="tablist"
              aria-label="Explorar as visualizações do Brisa"
            >
              {[
                { id: "board", label: "Quadro", icon: LayoutGrid },
                { id: "list", label: "Lista", icon: List },
                { id: "calendar", label: "Calendário", icon: CalendarDays },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  role="tab"
                  aria-selected={demoView === id}
                  className={demoView === id ? "active" : ""}
                  key={id}
                  onClick={() => setDemoView(id)}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
              <span>
                <MousePointer2 size={13} />
                Pode explorar. A casa é sua.
              </span>
            </div>
            <div className={`preview-body view-${demoView}`}>
              {demoView === "board" ? (
                <div className="preview-columns">
                  {["Boas ideias", "Mãos à obra", "Deu bom"].map(
                    (name, stage) => (
                      <div className="preview-column" key={name}>
                        <div className="preview-column-title">
                          <i className={`stage-${stage}`} />
                          <strong>{name}</strong>
                          <span>
                            {demoTasks.filter((t) => t.stage === stage).length}
                          </span>
                          <MoreHorizontal size={16} />
                        </div>
                        {demoTasks
                          .filter((t) => t.stage === stage)
                          .map((task) => (
                            <button
                              className="preview-task"
                              key={task.id}
                              onClick={() => setSelected(task)}
                            >
                              {task.id === 3 && (
                                <div className="preview-design-cover">
                                  <span>
                                    ideias
                                    <br />
                                    <em>em movimento.</em>
                                  </span>
                                  <span>✳</span>
                                </div>
                              )}
                              <div>
                                <small className={`demo-label ${task.color}`}>
                                  {task.label}
                                </small>
                                <h3>{task.title}</h3>
                                <div className="preview-task-meta">
                                  <span>
                                    {stage === 2 ? (
                                      <CheckCheck size={12} />
                                    ) : (
                                      <Clock3 size={12} />
                                    )}{" "}
                                    {stage === 2
                                      ? "Concluído"
                                      : "Próximo passo"}
                                    <MessageCircle size={12} />
                                  </span>
                                  <span
                                    className={`preview-person ${task.color}`}
                                  >
                                    {task.initials}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        <a className="preview-add" href={signup}>
                          <Plus size={14} />
                          Adicionar uma boa ideia
                        </a>
                      </div>
                    ),
                  )}
                </div>
              ) : demoView === "list" ? (
                <div className="preview-list">
                  <div className="preview-list-heading">
                    <span>O que vamos fazer</span>
                    <span>Etapa</span>
                    <span>Responsável</span>
                  </div>
                  {demoTasks.map((task) => (
                    <button key={task.id} onClick={() => setSelected(task)}>
                      <span>
                        <i className={`stage-${task.stage}`} />
                        {task.title}
                      </span>
                      <span>
                        {["Boas ideias", "Mãos à obra", "Deu bom"][task.stage]}
                      </span>
                      <span className={`preview-person ${task.color}`}>
                        {task.initials}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="preview-calendar">
                  <div className="preview-calendar-heading">
                    <strong>A semana da equipe</strong>
                    <span>Uma entrega de cada vez.</span>
                  </div>
                  <div className="preview-calendar-grid">
                    {["Segunda", "Terça", "Quarta", "Quinta", "Sexta"].map(
                      (name, i) => (
                        <div key={name}>
                          <small>{name}</small>
                          <span>{i + 12}</span>
                          {demoTasks
                            .filter((t) => (t.id - 1) % 5 === i)
                            .map((task) => (
                              <button
                                className={`calendar-demo-event ${task.color}`}
                                key={task.id}
                                onClick={() => setSelected(task)}
                              >
                                {task.title}
                              </button>
                            ))}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="preview-bottom">
              <span>
                <LockKeyhole size={12} />
                Exemplo de um quadro do Brisa
              </span>
              <span>
                O seu pode ter a sua cara.
                <ArrowUpRight size={13} />
              </span>
            </div>
          </div>
          <div className="preview-handwritten-note">
            Seu processo. Seu jeito.
            <svg viewBox="0 0 70 50" aria-hidden="true">
              <path d="M65 40Q37 51 12 10m-1 15L8 6l18 8" />
            </svg>
          </div>
        </section>

        <section className="welcome-features section-wrap">
          <div className="feature-intro">
            <span className="welcome-eyebrow">
              CABE NO SEU JEITO DE TRABALHAR
            </span>
            <h2>
              O projeto é seu.
              <br />O jeito de organizar <em>também.</em>
            </h2>
          </div>
          <div className="features-grid">
            <article>
              <div className="feature-visual visual-columns">
                <span>
                  <i />
                  <i />
                  <i />
                </span>
                <span>
                  <i />
                  <i />
                </span>
                <span>
                  <i />
                </span>
                <span className="visual-mini-plus">
                  <Plus size={15} />
                </span>
              </div>
              <span className="feature-small-icon">
                <Palette size={19} />
              </span>
              <h3>Um fluxo com a cara da equipe.</h3>
              <p>
                Crie colunas, escolha as cores e arraste os cards. O quadro
                acompanha o processo que vocês já usam.
              </p>
            </article>
            <article>
              <div className="feature-visual visual-checklist">
                <span>
                  <i className="is-checked">
                    <Check size={10} />
                  </i>
                  Alinhar o briefing
                  <Check size={13} />
                </span>
                <span>
                  <i className="is-checked">
                    <Check size={10} />
                  </i>
                  Compartilhar referências
                  <Check size={13} />
                </span>
                <span>
                  <i />
                  Criar a próxima versão
                </span>
                <div>
                  <span>
                    <Paperclip size={12} />2 anexos
                  </span>
                  <span>
                    <MessageCircle size={12} />3 ideias novas
                  </span>
                </div>
              </div>
              <span className="feature-small-icon">
                <LayoutGrid size={19} />
              </span>
              <h3>O contexto fica no card.</h3>
              <p>
                Junte descrição, checklist e arquivos à tarefa. Os comentários
                guardam a conversa perto do que precisa ser feito.
              </p>
            </article>
            <article>
              <div className="feature-visual visual-team">
                <span className="team-orbit orbit-one" />
                <span className="team-orbit orbit-two" />
                <span className="visual-team-person one">MC</span>
                <span className="visual-team-person two">AO</span>
                <span className="visual-team-person three">BC</span>
                <span className="team-central-check">
                  <CheckCheck size={25} />
                </span>
                <span className="team-sync-caption">
                  <span />
                  Todo mundo na mesma página
                </span>
              </div>
              <span className="feature-small-icon">
                <Users size={19} />
              </span>
              <h3>O time acompanha junto.</h3>
              <p>
                Defina responsáveis e prazos. As atualizações chegam ao espaço
                da equipe, no computador ou no celular.
              </p>
            </article>
          </div>
        </section>

        <section className="welcome-how section-wrap" id="como-funciona">
          <div>
            <span className="welcome-eyebrow">DA IDEIA AO PRIMEIRO CARD</span>
            <h2>
              Começar pode ser
              <br />
              <em>uma Brisa.</em>
            </h2>
            <p>
              Você já sabe o que quer fazer.
              <br />
              Agora é só dar um lugar para isso.
            </p>
            <a className="welcome-text-link" href={signup}>
              Criar minha conta
              <ArrowUpRight size={17} />
            </a>
          </div>
          <ol className="how-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Entre no espaço da equipe.</h3>
                <p>
                  Crie sua conta com nome, e-mail e senha. Seus primeiros 15
                  dias são grátis.
                </p>
              </div>
              <div className="how-step-icon">
                <Users size={20} />
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Abra um quadro para o projeto.</h3>
                <p>
                  Escolha as etapas do trabalho e transforme as ideias em cards.
                </p>
              </div>
              <div className="how-step-icon">
                <LayoutGrid size={20} />
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Faça o trabalho andar.</h3>
                <p>
                  Combine os próximos passos, mova os cards e acompanhe cada
                  entrega.
                </p>
              </div>
              <div className="how-step-icon">
                <ArrowRight size={20} />
              </div>
            </li>
          </ol>
        </section>

        <section className="welcome-trial section-wrap" id="teste-gratis">
          <div className="trial-number">
            <span>15</span>
            <strong>dias de Brisa.</strong>
            <span className="trial-sun">✳</span>
            <svg viewBox="0 0 280 30" aria-hidden="true">
              <path d="M5 20Q130 1 275 15" />
            </svg>
          </div>
          <div className="trial-copy">
            <span className="welcome-eyebrow">
              O PRIMEIRO PASSO É POR NOSSA CONTA
            </span>
            <h2>
              Experimente no ritmo
              <br />
              do seu trabalho.
            </h2>
            <p>
              Traga um projeto de verdade. Crie os cards, organize as etapas e
              veja como o Brisa cabe no dia da equipe.
            </p>
            <a className="welcome-button white large" href={signup}>
              Quero meus 15 dias grátis
              <ArrowRight size={18} />
            </a>
            <span className="trial-fine-print">
              <ShieldCheck size={14} />
              Você começa com nome, e-mail e senha.
            </span>
          </div>
        </section>

        <section className="welcome-faq section-wrap">
          <div>
            <span className="welcome-eyebrow">
              PODE CHEGAR, A GENTE EXPLICA
            </span>
            <h2>
              Antes de dar
              <br />o próximo <em>passo.</em>
            </h2>
            <span className="faq-doodle">
              <Wind size={54} />
            </span>
          </div>
          <div className="faq-items">
            {questions.map(({ q, a }) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="welcome-last-call section-wrap">
          <span className="last-call-star">✳</span>
          <span className="welcome-eyebrow">TEM IDEIA BOA ESPERANDO AÍ?</span>
          <h2>
            Dê um lugar para o seu
            <br />
            <em>próximo grande projeto.</em>
          </h2>
          <a className="welcome-button orange large" href={signup}>
            Começar meus 15 dias grátis
            <ArrowRight size={18} />
          </a>
          <p>Seu teste de 15 dias começa no cadastro.</p>
        </section>
      </main>
      <footer className="welcome-footer">
        <div>
          <a href="/" aria-label="Brisa, início">
            <Brand />
          </a>
          <p>
            Seu trabalho encontra espaço.
            <br />
            Sua equipe encontra o próximo passo.
          </p>
        </div>
        <div>
          <span>PODE ENTRAR</span>
          <a href={signedIn ? "/app" : "/login"}>
            {signedIn ? "Abrir meu espaço" : "Fazer login"}
            <ArrowUpRight size={13} />
          </a>
          <a href={signup}>
            Criar minha conta
            <ArrowUpRight size={13} />
          </a>
        </div>
        <div>
          <span>CONHEÇA O BRISA</span>
          <a href="#por-dentro">Por dentro do produto</a>
          <a href="#teste-gratis">Teste de 15 dias</a>
          <a href="#como-funciona">Como funciona</a>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Brisa. Feito para trabalhar junto.
          </span>
          <span>
            Uma boa ideia merece uma boa Brisa.
            <Wind size={14} />
          </span>
        </div>
      </footer>
      {selected && (
        <div
          className="demo-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelected(null);
          }}
        >
          <div
            className="demo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-card-title"
          >
            <button
              className="demo-modal-close"
              autoFocus
              aria-label="Fechar prévia do card"
              onClick={() => setSelected(null)}
            >
              <X size={20} />
            </button>
            <span className={`demo-label ${selected.color}`}>
              {selected.label}
            </span>
            <h2 id="demo-card-title">{selected.title}</h2>
            <p>{selected.description}</p>
            <div className="demo-modal-checklist">
              <Check size={16} />
              Descrição, checklist, prazo e responsáveis no mesmo card.
            </div>
            <a className="welcome-button orange" href={signup}>
              Criar meus próprios cards
              <ArrowRight size={16} />
            </a>
            <small>
              Esta é uma prévia. Seus cards ficam no espaço da equipe.
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
