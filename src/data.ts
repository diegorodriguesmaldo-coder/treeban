export type Member = {
  id: string;
  name: string;
  initials: string;
  color: string;
  email?: string;
};
export type Label = { id: string; name: string; color: string };
export type ChecklistItem = { id: string; text: string; done: boolean };
export type Comment = {
  id: string;
  text: string;
  memberId: string;
  at: string;
};
export type Attachment = { id: string; name: string; url: string };
export type Card = {
  id: string;
  title: string;
  description: string;
  labels: string[];
  members: string[];
  due: string;
  checklist: ChecklistItem[];
  comments: Comment[];
  attachments: Attachment[];
  cover: string;
  priority: "low" | "normal" | "high";
  archived?: boolean;
  createdAt: string;
};
export type Column = { id: string; name: string; color: string; cards: Card[] };
export type Activity = { id: string; text: string; at: string };
export type Board = {
  id: string;
  name: string;
  description: string;
  color: string;
  background: string;
  starred: boolean;
  columns: Column[];
  activity: Activity[];
  doneColumnId?: string;
};
export type State = {
  version: number;
  boards: Board[];
  members: Member[];
  labels: Label[];
  activeBoardId: string;
  workspace: string;
  autoComplete: boolean;
};
export const uid = () => crypto.randomUUID();
export const day = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const now = () => new Date().toISOString();
export const newCard = (title = ""): Card => ({
  id: uid(),
  title,
  description: "",
  labels: [],
  members: [],
  due: "",
  checklist: [],
  comments: [],
  attachments: [],
  cover: "",
  priority: "normal",
  createdAt: now(),
});
export const labelColors = [
  "#ddf3e6",
  "#dceaff",
  "#fce8cc",
  "#ece4fb",
  "#ffe1e6",
  "#d5f1f1",
];
export const columnColors = [
  "#6488ee",
  "#f2b95a",
  "#ab8bdf",
  "#6db494",
  "#e590a1",
  "#66b6c3",
];
export const backgrounds = [
  { id: "landscape", name: "Horizonte", color: "#e8eafa" },
  { id: "ocean", name: "Oceano", color: "#dbeaf2" },
  { id: "peach", name: "Pôr do sol", color: "#f5e3db" },
  { id: "sage", name: "Jardim", color: "#dfe9e0" },
  { id: "lavender", name: "Lavanda", color: "#e9e1f1" },
  { id: "plain", name: "Minimalista", color: "#edf0f5" },
];
export function seed(): State {
  const members: Member[] = [
    {
      id: "me",
      name: "Marina Costa",
      initials: "MC",
      color: "#efc9b0",
      email: "marina@studio.com",
    },
    {
      id: "ana",
      name: "Ana Oliveira",
      initials: "AO",
      color: "#ded5f2",
      email: "ana@studio.com",
    },
    {
      id: "leo",
      name: "Leo Santos",
      initials: "LS",
      color: "#c5dbd4",
      email: "leo@studio.com",
    },
    {
      id: "bia",
      name: "Bia Costa",
      initials: "BC",
      color: "#c9d9ef",
      email: "bia@studio.com",
    },
  ];
  const labels: Label[] = [
    { id: "design", name: "Design", color: "#ece4fb" },
    { id: "strategy", name: "Estratégia", color: "#dceaff" },
    { id: "content", name: "Conteúdo", color: "#fce8cc" },
    { id: "dev", name: "Desenvolvimento", color: "#ddf3e6" },
    { id: "urgent", name: "Prioridade", color: "#ffe1e6" },
  ];
  const card = (title: string, partial: Partial<Card> = {}): Card => ({
    ...newCard(title),
    ...partial,
  });
  const check = (text: string, done = false) => ({ id: uid(), text, done });
  const site: Board = {
    id: "site",
    name: "Lançamento do site",
    description: "Um espaço para tirar nossas ideias do papel. ✨",
    color: "#6b8ae8",
    background: "landscape",
    starred: true,
    activity: [
      {
        id: uid(),
        text: "Ana adicionou “Criar a identidade visual” em Em andamento.",
        at: now(),
      },
      { id: uid(), text: "Você criou o quadro Lançamento do site.", at: now() },
    ],
    columns: [
      {
        id: "backlog",
        name: "Para começar",
        color: "#6488ee",
        cards: [
          card("Definir os objetivos do projeto", {
            labels: ["strategy"],
            members: ["me", "leo"],
            description:
              "Alinhar a visão do novo site com a equipe. Precisamos definir nosso público, os resultados esperados e as métricas de sucesso.",
            checklist: [
              check("Mapear o público-alvo", true),
              check("Definir métricas de sucesso"),
              check("Validar com a equipe"),
            ],
            due: day(2),
            comments: [
              {
                id: uid(),
                text: "Vamos trazer os aprendizados da última campanha para essa conversa.",
                memberId: "leo",
                at: now(),
              },
            ],
          }),
          card("Explorar referências visuais", {
            cover: "moodboard",
            labels: ["design"],
            members: ["ana"],
            description:
              "Reunir referências de tipografia, paleta de cores e experiências que inspiram nosso próximo capítulo.",
            attachments: [
              {
                id: uid(),
                name: "Referências de design",
                url: "https://www.behance.net/",
              },
            ],
          }),
          card("Escrever os textos das páginas", {
            labels: ["content"],
            members: ["bia"],
            due: day(5),
            checklist: [
              check("Página inicial"),
              check("Sobre o estúdio"),
              check("Nossos projetos"),
              check("Contato"),
            ],
          }),
          card("Mapear a jornada do usuário", {
            labels: ["strategy", "design"],
            members: ["me"],
            description:
              "Desenhar os caminhos que conectam a primeira visita ao primeiro contato.",
          }),
        ],
      },
      {
        id: "progress",
        name: "Em andamento",
        color: "#f2b95a",
        cards: [
          card("Criar a identidade visual", {
            cover: "brand",
            labels: ["design"],
            members: ["ana", "me"],
            due: day(0),
            description:
              "Uma identidade leve, memorável e cheia de personalidade. Explorar uma direção visual que traduza nosso jeito de trabalhar.",
            checklist: [
              check("Exploração de cores", true),
              check("Seleção tipográfica", true),
              check("Sistema de elementos", true),
              check("Aplicações da marca"),
              check("Apresentação final"),
            ],
            comments: [
              {
                id: uid(),
                text: "Adorei a direção das cores! Podemos explorar mais o tom de pêssego?",
                memberId: "me",
                at: now(),
              },
              {
                id: uid(),
                text: "Sim! Vou incluir na próxima versão 🎨",
                memberId: "ana",
                at: now(),
              },
            ],
          }),
          card("Desenvolver a página inicial", {
            labels: ["dev"],
            members: ["leo"],
            due: day(3),
            description:
              "Construir uma página inicial responsiva, acessível e com uma experiência fluida.",
            checklist: [
              check("Estrutura da página", true),
              check("Componentes principais"),
              check("Versão mobile"),
            ],
            priority: "high",
          }),
          card("Organizar o conteúdo do portfólio", {
            labels: ["content"],
            members: ["bia"],
            attachments: [
              {
                id: uid(),
                name: "Pasta de projetos",
                url: "https://drive.google.com/",
              },
            ],
            comments: [
              {
                id: uid(),
                text: "Os três projetos mais recentes já estão separados.",
                memberId: "bia",
                at: now(),
              },
            ],
          }),
        ],
      },
      {
        id: "review",
        name: "Em revisão",
        color: "#ab8bdf",
        cards: [
          card("Validar os wireframes", {
            cover: "wireframe",
            labels: ["design", "strategy"],
            members: ["ana", "leo"],
            due: day(1),
            description:
              "Revisar os fluxos e a hierarquia das informações antes de avançar para o design final.",
            checklist: [
              check("Navegação principal", true),
              check("Fluxo de contato", true),
              check("Revisão da equipe"),
            ],
            comments: [
              {
                id: uid(),
                text: "O fluxo está bem claro. Só tenho um ajuste na navegação.",
                memberId: "leo",
                at: now(),
              },
            ],
          }),
          card("Revisar o tom de voz da marca", {
            labels: ["content"],
            members: ["bia", "me"],
            description:
              "Um tom próximo, confiante e simples. Garantir consistência em todos os pontos de contato.",
            due: day(2),
          }),
        ],
      },
      {
        id: "done",
        name: "Concluído",
        color: "#6db494",
        cards: [
          card("Kick-off com a equipe", {
            labels: ["strategy"],
            members: ["me", "ana", "leo"],
            due: day(-2),
            description:
              "Alinhamos as expectativas, os papéis e o cronograma. Um ótimo começo!",
            checklist: [
              check("Apresentar o projeto", true),
              check("Definir responsabilidades", true),
              check("Alinhar cronograma", true),
            ],
          }),
          card("Pesquisar o mercado", {
            labels: ["strategy"],
            members: ["me"],
            checklist: [
              check("Análise de concorrentes", true),
              check("Entrevistas", true),
              check("Consolidar aprendizados", true),
            ],
            comments: [
              {
                id: uid(),
                text: "Aprendizados compartilhados com toda a equipe!",
                memberId: "me",
                at: now(),
              },
            ],
          }),
          card("Definir a estrutura do site", {
            labels: ["dev"],
            members: ["leo", "ana"],
            attachments: [
              {
                id: uid(),
                name: "Mapa do site",
                url: "https://www.figma.com/",
              },
            ],
          }),
        ],
      },
    ],
  };
  const marketing: Board = {
    id: "marketing",
    name: "Marketing & conteúdo",
    description: "Histórias que conectam. Conteúdo que faz a diferença.",
    color: "#ad89d9",
    background: "peach",
    starred: false,
    activity: [],
    columns: [
      {
        id: uid(),
        name: "Ideias",
        color: columnColors[0],
        cards: [
          card("Planejar a próxima campanha", {
            labels: ["strategy"],
            members: ["bia"],
            due: day(4),
          }),
          card("Série: bastidores do estúdio", {
            labels: ["content"],
            cover: "brand",
            members: ["ana", "bia"],
          }),
        ],
      },
      {
        id: uid(),
        name: "Produção",
        color: columnColors[1],
        cards: [
          card("Escrever a newsletter de outubro", {
            labels: ["content"],
            members: ["bia"],
            due: day(2),
          }),
        ],
      },
      { id: uid(), name: "Publicado", color: columnColors[3], cards: [] },
    ],
  };
  const roadmap: Board = {
    id: "roadmap",
    name: "Roadmap do produto",
    description: "Pequenos passos, grandes possibilidades.",
    color: "#d6a366",
    background: "ocean",
    starred: false,
    activity: [],
    columns: [
      {
        id: uid(),
        name: "Agora",
        color: columnColors[0],
        cards: [
          card("Melhorar o onboarding", {
            labels: ["design", "dev"],
            members: ["ana", "leo"],
          }),
          card("Ouvir nossos usuários", {
            labels: ["strategy"],
            members: ["me"],
            due: day(1),
          }),
        ],
      },
      {
        id: uid(),
        name: "A seguir",
        color: columnColors[1],
        cards: [
          card("Novas integrações", { labels: ["dev"], members: ["leo"] }),
        ],
      },
      {
        id: uid(),
        name: "No horizonte",
        color: columnColors[2],
        cards: [card("Aplicativo mobile", { labels: ["design", "dev"] })],
      },
    ],
  };
  return {
    version: 1,
    boards: [site, marketing, roadmap].map((b) => ({
      ...b,
      doneColumnId: getDoneColumn(b)?.id || "",
    })),
    members,
    labels,
    activeBoardId: "site",
    workspace: "Studio Criativo",
    autoComplete: true,
  };
}
export const STORAGE_KEY = "brisa-workspace-v1";
export function loadState(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (isState(saved))
      return {
        ...saved,
        boards: saved.boards.map((b) => ({
          ...b,
          doneColumnId: getDoneColumn(b)?.id || "",
        })),
      };
  } catch {
    /* Start with a valid workspace if storage is unavailable. */
  }
  return seed();
}
function validAttachment(attachment: Attachment) {
  if (
    !attachment ||
    typeof attachment.id !== "string" ||
    typeof attachment.name !== "string" ||
    typeof attachment.url !== "string"
  )
    return false;
  if (attachment.url.startsWith("data:"))
    return /^data:[^,]*;base64,/.test(attachment.url);
  try {
    const url = new URL(attachment.url);
    return ["https:", "http:"].includes(url.protocol) && !!url.hostname;
  } catch {
    return false;
  }
}
export function isState(value: unknown): value is State {
  if (!value || typeof value !== "object") return false;
  const s = value as State;
  return (
    s.version === 1 &&
    typeof s.workspace === "string" &&
    typeof s.autoComplete === "boolean" &&
    typeof s.activeBoardId === "string" &&
    Array.isArray(s.boards) &&
    s.boards.length > 0 &&
    s.boards.some((b) => b.id === s.activeBoardId) &&
    Array.isArray(s.members) &&
    s.members.every(
      (m) =>
        typeof m.id === "string" &&
        typeof m.name === "string" &&
        typeof m.initials === "string" &&
        typeof m.color === "string",
    ) &&
    Array.isArray(s.labels) &&
    s.labels.every(
      (l) =>
        typeof l.id === "string" &&
        typeof l.name === "string" &&
        typeof l.color === "string",
    ) &&
    s.boards.every(
      (b) =>
        typeof b.id === "string" &&
        typeof b.name === "string" &&
        typeof b.description === "string" &&
        typeof b.color === "string" &&
        typeof b.background === "string" &&
        typeof b.starred === "boolean" &&
        Array.isArray(b.activity) &&
        b.activity.every(
          (a) => typeof a.text === "string" && typeof a.at === "string",
        ) &&
        Array.isArray(b.columns) &&
        b.columns.every(
          (c) =>
            typeof c.id === "string" &&
            typeof c.name === "string" &&
            typeof c.color === "string" &&
            Array.isArray(c.cards) &&
            c.cards.every(
              (k) =>
                typeof k.id === "string" &&
                typeof k.title === "string" &&
                typeof k.description === "string" &&
                typeof k.due === "string" &&
                typeof k.cover === "string" &&
                typeof k.createdAt === "string" &&
                ["low", "normal", "high"].includes(k.priority) &&
                Array.isArray(k.labels) &&
                k.labels.every((l) => typeof l === "string") &&
                Array.isArray(k.members) &&
                k.members.every((m) => typeof m === "string") &&
                Array.isArray(k.checklist) &&
                k.checklist.every(
                  (i) =>
                    typeof i.id === "string" &&
                    typeof i.text === "string" &&
                    typeof i.done === "boolean",
                ) &&
                Array.isArray(k.comments) &&
                k.comments.every(
                  (m) =>
                    typeof m.id === "string" &&
                    typeof m.text === "string" &&
                    typeof m.memberId === "string" &&
                    typeof m.at === "string",
                ) &&
                Array.isArray(k.attachments) &&
                k.attachments.every(validAttachment),
            ),
        ),
    )
  );
}
export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export const getDoneColumn = (board: Board) =>
  board.doneColumnId !== undefined
    ? board.columns.find((c) => c.id === board.doneColumnId)
    : board.columns.find((c) =>
        ["concluido", "concluidos", "feito", "publicado"].includes(
          normalize(c.name),
        ),
      );
export function dueText(due: string) {
  return new Date(due + "T12:00:00")
    .toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
    .replace(".", "");
}
