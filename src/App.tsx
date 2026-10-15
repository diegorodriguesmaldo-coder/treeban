import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Flag,
  FolderKanban,
  GripVertical,
  ImagePlus,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Link2,
  List,
  LockKeyhole,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Palette,
  Paperclip,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
  Zap,
  Archive,
  AlignLeft,
  CheckSquare2,
  Send,
  Upload,
  Pencil,
  RotateCcw,
  LogOut,
  Cloud,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  backgrounds,
  columnColors,
  day,
  dueText,
  getDoneColumn,
  isState,
  labelColors,
  newCard,
  normalize,
  now,
  uid,
} from "./data";
import type { Board, Card, Column, Member, State } from "./data";
import type { SyncStatus } from "./cloud";
import { mergeChanges, mergeWorkspace } from "./merge";

type CardLocation = { boardId: string; columnId: string; cardId?: string };
type Filters = { labels: string[]; members: string[]; due: string };
type Toast = { message: string; undo?: () => void };
const emptyFilters: Filters = { labels: [], members: [], due: "" };
const safeUrl = (url: string) => /^(https?:\/\/|data:)/i.test(url);

function IconButton({
  icon: Icon,
  title,
  onClick,
  className = "",
  children,
  ...props
}: {
  icon: LucideIcon;
  title: string;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      title={title}
      aria-label={title}
      onClick={onClick}
      {...props}
    >
      <Icon size={18} strokeWidth={1.7} />
      {children}
    </button>
  );
}
function Avatar({
  member,
  small = false,
}: {
  member: Member;
  small?: boolean;
}) {
  return (
    <span
      className={`avatar ${small ? "small" : ""}`}
      style={{ "--avatar-color": member.color } as CSSProperties}
      title={member.name}
    >
      {member.initials}
    </span>
  );
}
function AvatarGroup({
  ids,
  members,
  limit = 3,
}: {
  ids: string[];
  members: Member[];
  limit?: number;
}) {
  return (
    <div className="avatar-group">
      {ids.slice(0, limit).map((id) => {
        const m = members.find((m) => m.id === id);
        return m ? <Avatar key={id} member={m} small /> : null;
      })}
      {ids.length > limit && (
        <span className="avatar small overflow-avatar">
          +{ids.length - limit}
        </span>
      )}
    </div>
  );
}
function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? "brand-small" : ""}`}>
      <span className="brand-symbol">
        <i />
        <i />
        <i />
      </span>
      {!small && (
        <>
          brisa<span className="brand-dot">.</span>
        </>
      )}
    </span>
  );
}
function Modal({
  children,
  onClose,
  className = "",
  label,
}: {
  children: ReactNode;
  onClose: () => void;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = ref.current;
    if (!root?.contains(document.activeElement))
      (
        (root?.querySelector(
          'input:not([type="checkbox"]), textarea, select',
        ) as HTMLElement) || (root?.querySelector("button") as HTMLElement)
      )?.focus();
    const handle = (e: KeyboardEvent) => {
      if (Array.from(document.querySelectorAll(".modal")).at(-1) !== root)
        return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const focusable = Array.from(
          root?.querySelectorAll<HTMLElement>(
            'button:not([disabled]),input:not([disabled]),textarea,select,a[href],[tabindex="0"]',
          ) || [],
        ).filter((el) => el.offsetParent !== null);
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle, true);
    return () => {
      document.body.style.overflow = priorOverflow;
      document.removeEventListener("keydown", handle, true);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}
function Landscape() {
  return (
    <svg
      className="landscape"
      viewBox="0 0 1400 700"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="#e9eafb" />
          <stop offset=".6" stopColor="#f1e8f1" />
          <stop offset="1" stopColor="#f8e4d7" />
        </linearGradient>
        <linearGradient id="mountain" x2="0" y2="1">
          <stop stopColor="#c9c7e3" />
          <stop offset="1" stopColor="#b0b9d8" />
        </linearGradient>
      </defs>
      <rect width="1400" height="700" fill="url(#sky)" />
      <circle cx="1090" cy="428" r="91" fill="#fff4df" opacity=".75" />
      <path
        d="M0 515 Q130 423 253 484 T475 483 Q560 407 651 468 Q757 524 843 452 Q939 351 1052 447 T1400 404 V700 H0Z"
        fill="#d8cede"
      />
      <path
        d="M0 598 Q170 513 327 566 Q491 625 629 530 Q744 451 880 535 Q990 599 1125 488 Q1288 430 1400 519 V700H0Z"
        fill="url(#mountain)"
        opacity=".72"
      />
      <path
        d="M0 678 Q210 565 424 648 Q579 710 755 623 Q887 553 1064 610 Q1205 676 1400 587 V700H0Z"
        fill="#9fabc8"
        opacity=".57"
      />
    </svg>
  );
}

export default function App({
  initialState,
  onStateChange,
  syncStatus,
  userId,
  onSignOut,
  onRetrySync,
}: {
  initialState: State;
  onStateChange: (state: State) => void;
  syncStatus: SyncStatus;
  userId: string;
  onSignOut: () => void;
  onRetrySync: () => void;
}) {
  const [state, setState] = useState<State>(initialState);
  const onChangeRef = useRef(onStateChange);
  onChangeRef.current = onStateChange;
  useEffect(() => {
    setState(initialState);
  }, [initialState]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [section, setSection] = useState("board");
  const [view, setView] = useState("board");
  const [menu, setMenu] = useState<string | null>(null);
  const [cardMenuPosition, setCardMenuPosition] = useState({ left: 0, top: 0 });
  const [cardModal, setCardModal] = useState<CardLocation | null>(null);
  const [dialog, setDialog] = useState<
    "board" | "invite" | "settings" | "help" | "archive" | null
  >(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [boardSearch, setBoardSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnName, setColumnName] = useState("");
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editColumnName, setEditColumnName] = useState("");
  const [drag, setDrag] = useState<{
    type: "card" | "column";
    id: string;
    columnId: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const board =
    state.boards.find((b) => b.id === state.activeBoardId) || state.boards[0];
  const allCards = state.boards.flatMap((b) =>
    b.columns.flatMap((c) =>
      c.cards
        .filter((k) => !k.archived)
        .map((card) => ({ card, column: c, board: b })),
    ),
  );
  const boardCards = board.columns.flatMap((c) =>
    c.cards.filter((k) => !k.archived).map((card) => ({ card, column: c })),
  );
  const completedColumn = getDoneColumn(board);
  const completedCount =
    completedColumn?.cards.filter((c) => !c.archived).length || 0;
  const filterCount =
    filters.labels.length + filters.members.length + (filters.due ? 1 : 0);
  const dueSoon = allCards.filter(
    ({ card, column, board: b }) =>
      card.members.includes(userId) &&
      card.due &&
      card.due <= day(3) &&
      column.id !== getDoneColumn(b)?.id,
  );
  const notify = (message: string, undo?: () => void) =>
    setToast({ message, undo });
  const change = (
    updater: (s: State) => State,
    message?: string,
    undo = false,
  ) => {
    const previous = stateRef.current;
    const next = updater(previous);
    stateRef.current = next;
    setState(next);
    if (message)
      notify(
        message,
        undo
          ? () => {
              const restored = mergeWorkspace(next, previous, stateRef.current);
              stateRef.current = restored;
              setState(restored);
              notify("Ação desfeita.");
            }
          : undefined,
      );
  };
  const updateBoard = (
    fn: (b: Board) => Board,
    message?: string,
    undo = false,
    boardId = board.id,
  ) =>
    change(
      (s) => ({
        ...s,
        boards: s.boards.map((b) => (b.id === boardId ? fn(b) : b)),
      }),
      message,
      undo,
    );
  const withActivity = (b: Board, text: string) => ({
    ...b,
    activity: [{ id: uid(), text, at: now() }, ...b.activity].slice(0, 100),
  });
  const openBoard = (id: string) => {
    change((s) => ({ ...s, activeBoardId: id }));
    setSection("board");
    setView("board");
    setBoardSearch("");
    setFilters(emptyFilters);
    setSidebarOpen(false);
    setMenu(null);
    setActivityOpen(false);
  };
  const matches = (card: Card) =>
    !card.archived &&
    (!boardSearch ||
      normalize(card.title + " " + card.description).includes(
        normalize(boardSearch),
      )) &&
    (!filters.labels.length ||
      filters.labels.some((l) => card.labels.includes(l))) &&
    (!filters.members.length ||
      filters.members.some((m) => card.members.includes(m))) &&
    (!filters.due ||
      (filters.due === "none"
        ? !card.due
        : filters.due === "today"
          ? card.due === day()
          : filters.due === "late"
            ? !!card.due && card.due < day()
            : !!card.due && card.due >= day() && card.due <= day(7)));

  useEffect(() => {
    onChangeRef.current(state);
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".popover, .popover-anchor"))
        setMenu(null);
      if (!(e.target as HTMLElement).closest(".global-search"))
        setSearchOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  useEffect(() => {
    const shortcuts = (e: KeyboardEvent) => {
      const input = (e.target as HTMLElement).closest(
        'input,textarea,select,[contenteditable="true"]',
      );
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (!cardModal && !dialog && !confirm) {
          searchRef.current?.focus();
          setSearchOpen(true);
        }
        return;
      }
      if (input || cardModal || dialog || confirm) return;
      if (e.key === "n" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (board.columns[0])
          setCardModal({ boardId: board.id, columnId: board.columns[0].id });
      }
      if (e.key === "Escape") {
        setMenu(null);
        setActivityOpen(false);
        setSidebarOpen(false);
      }
      if (e.key === "?") setDialog("help");
    };
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [board.id, board.columns, cardModal, dialog, confirm]);

  function saveCard(draft: Card, location: CardLocation, initial?: Card) {
    const b = stateRef.current.boards.find((b) => b.id === location.boardId);
    if (!b) return;
    const current = b.columns
      .flatMap((c) => c.cards)
      .find((k) => k.id === draft.id);
    if (initial && current) draft = mergeChanges(initial, draft, current);
    const exists = b.columns.some((c) =>
      c.cards.some((k) => k.id === draft.id),
    );
    const previousColumn = b.columns.find((c) =>
      c.cards.some((k) => k.id === draft.id),
    );
    const complete =
      stateRef.current.autoComplete &&
      exists &&
      previousColumn?.id !== location.columnId &&
      location.columnId === getDoneColumn(b)?.id;
    const saved = complete
      ? {
          ...draft,
          checklist: draft.checklist.map((i) => ({ ...i, done: true })),
        }
      : draft;
    updateBoard(
      (b) =>
        withActivity(
          {
            ...b,
            columns: b.columns.map((c) => {
              if (c.id === previousColumn?.id && c.id === location.columnId)
                return {
                  ...c,
                  cards: c.cards.map((k) => (k.id === draft.id ? saved : k)),
                };
              return {
                ...c,
                cards: [
                  ...c.cards.filter((k) => k.id !== draft.id),
                  ...(c.id === location.columnId ? [saved] : []),
                ],
              };
            }),
          },
          `Você ${exists ? "atualizou" : "criou"} “${draft.title}”.`,
        ),
      exists
        ? "Card atualizado."
        : "Card criado. Vamos tirar essa ideia do papel!",
      false,
      location.boardId,
    );
    setCardModal(null);
  }
  function archiveCard(card: Card, columnId: string) {
    updateBoard(
      (b) =>
        withActivity(
          {
            ...b,
            columns: b.columns.map((c) =>
              c.id === columnId
                ? {
                    ...c,
                    cards: c.cards.map((k) =>
                      k.id === card.id ? { ...k, archived: true } : k,
                    ),
                  }
                : c,
            ),
          },
          `Você arquivou “${card.title}”.`,
        ),
      "Card arquivado.",
      true,
    );
    setMenu(null);
  }
  function duplicateCard(card: Card, columnId: string) {
    updateBoard(
      (b) => ({
        ...b,
        columns: b.columns.map((c) =>
          c.id === columnId
            ? {
                ...c,
                cards: [
                  ...c.cards,
                  {
                    ...card,
                    id: uid(),
                    title: card.title + " (cópia)",
                    createdAt: now(),
                    comments: [],
                  },
                ],
              }
            : c,
        ),
      }),
      "Uma cópia do card foi criada.",
      true,
    );
    setMenu(null);
  }
  function moveCard(
    cardId: string,
    from: string,
    to: string,
    beforeId?: string,
  ) {
    if (cardId === beforeId) return;
    updateBoard(
      (b) => {
        const card = b.columns
          .find((c) => c.id === from)
          ?.cards.find((c) => c.id === cardId);
        if (!card || !b.columns.some((c) => c.id === to)) return b;
        const complete =
          stateRef.current.autoComplete &&
          to === getDoneColumn(b)?.id &&
          from !== to;
        const moved = complete
          ? {
              ...card,
              checklist: card.checklist.map((i) => ({ ...i, done: true })),
            }
          : card;
        return withActivity(
          {
            ...b,
            columns: b.columns.map((c) => {
              const cards = c.cards.filter((k) => k.id !== cardId);
              if (c.id === to) {
                const index = beforeId
                  ? cards.findIndex((k) => k.id === beforeId)
                  : -1;
                cards.splice(index < 0 ? cards.length : index, 0, moved);
              }
              return { ...c, cards };
            }),
          },
          `Você moveu “${card.title}” para ${b.columns.find((c) => c.id === to)?.name}.`,
        );
      },
      "Card movido.",
      true,
    );
  }
  function drop(columnId: string, beforeId?: string) {
    if (!drag) return;
    if (drag.type === "card")
      moveCard(drag.id, drag.columnId, columnId, beforeId);
    else if (drag.id !== columnId)
      updateBoard(
        (b) => {
          const columns = [...b.columns];
          const from = columns.findIndex((c) => c.id === drag.id);
          const to = columns.findIndex((c) => c.id === columnId);
          if (from < 0 || to < 0) return b;
          columns.splice(to, 0, columns.splice(from, 1)[0]);
          return { ...b, columns };
        },
        "Coluna reordenada.",
        true,
      );
    setDrag(null);
    setDragOver(null);
  }
  function addColumn() {
    if (!columnName.trim()) return;
    updateBoard(
      (b) =>
        withActivity(
          {
            ...b,
            columns: [
              ...b.columns,
              {
                id: uid(),
                name: columnName.trim(),
                color: columnColors[b.columns.length % columnColors.length],
                cards: [],
              },
            ],
          },
          `Você criou a coluna ${columnName.trim()}.`,
        ),
      "Nova coluna criada.",
    );
    setColumnName("");
    setAddingColumn(false);
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(stateRef.current, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brisa-workspace.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Workspace exportado.");
  }
  async function importData(file: File) {
    try {
      const data = JSON.parse(await file.text());
      if (!isState(data)) throw new Error();
      setConfirm({
        title: "Importar workspace?",
        description:
          "Os quadros atuais serão substituídos pelos dados deste arquivo. Você poderá desfazer a importação.",
        action: () => {
          change(
            () => ({ ...data, members: state.members }),
            "Workspace importado.",
            true,
          );
          setDialog(null);
          setSection("board");
          setFilters(emptyFilters);
          setBoardSearch("");
        },
      });
    } catch {
      notify("Esse arquivo não é um backup válido do Brisa.");
    }
    if (importRef.current) importRef.current.value = "";
  }
  const MenuItem = ({
    icon: Icon,
    children,
    onClick,
    danger = false,
  }: {
    icon: LucideIcon;
    children: ReactNode;
    onClick: () => void;
    danger?: boolean;
  }) => (
    <button className={`menu-item ${danger ? "danger" : ""}`} onClick={onClick}>
      <Icon size={16} />
      {children}
    </button>
  );
  const searchResults = globalSearch.trim()
    ? allCards
        .filter(({ card, board: b }) =>
          normalize(card.title + " " + b.name).includes(
            normalize(globalSearch),
          ),
        )
        .slice(0, 7)
    : [];

  function renderCard(card: Card, column: Column) {
    const done = column.id === completedColumn?.id;
    const checked = card.checklist.filter((i) => i.done).length;
    return (
      <div
        key={card.id}
        className={`task-card ${drag?.id === card.id ? "dragging" : ""} ${dragOver === card.id ? "drop-before" : ""}`}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", card.id);
          setDrag({ type: "card", id: card.id, columnId: column.id });
        }}
        onDragEnd={() => {
          setDrag(null);
          setDragOver(null);
        }}
        onDragOver={(e) => {
          if (drag?.type === "card") {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(card.id);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          drop(column.id, card.id);
        }}
        onClick={() =>
          setCardModal({
            boardId: board.id,
            columnId: column.id,
            cardId: card.id,
          })
        }
        onKeyDown={(e) => {
          if (
            e.target === e.currentTarget &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            setCardModal({
              boardId: board.id,
              columnId: column.id,
              cardId: card.id,
            });
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Abrir card ${card.title}`}
      >
        {card.cover && (
          <div className={`card-cover cover-${card.cover}`}>
            <img src={`/covers/${card.cover}.svg`} alt="" draggable={false} />
          </div>
        )}
        <div className="card-content">
          {card.labels.length > 0 && (
            <div className="card-labels">
              {card.labels.map((id) => {
                const label = state.labels.find((l) => l.id === id);
                return label ? (
                  <span
                    className="card-label"
                    key={id}
                    style={{ background: label.color }}
                  >
                    {label.name}
                  </span>
                ) : null;
              })}
            </div>
          )}
          <div className="card-title-row">
            <h3>{card.title}</h3>
            <div className="card-menu-anchor popover-anchor">
              <button
                className="card-more"
                aria-label={`Opções de ${card.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setCardMenuPosition({
                    left: Math.max(
                      12,
                      Math.min(window.innerWidth - 192, rect.right - 180),
                    ),
                    top: Math.max(
                      12,
                      Math.min(window.innerHeight - 138, rect.bottom + 8),
                    ),
                  });
                  setMenu(
                    menu === `card:${card.id}` ? null : `card:${card.id}`,
                  );
                }}
              >
                <MoreHorizontal size={16} />
              </button>
              {menu === `card:${card.id}` &&
                createPortal(
                  <div
                    className="popover card-popover"
                    style={{ ...cardMenuPosition, right: "auto" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MenuItem
                      icon={Pencil}
                      onClick={() => {
                        setCardModal({
                          boardId: board.id,
                          columnId: column.id,
                          cardId: card.id,
                        });
                        setMenu(null);
                      }}
                    >
                      Editar card
                    </MenuItem>
                    <MenuItem
                      icon={Copy}
                      onClick={() => duplicateCard(card, column.id)}
                    >
                      Duplicar
                    </MenuItem>
                    <MenuItem
                      icon={Archive}
                      onClick={() => archiveCard(card, column.id)}
                    >
                      Arquivar
                    </MenuItem>
                  </div>,
                  document.body,
                )}
            </div>
          </div>
          <div className="card-meta">
            <div className="card-meta-left">
              {card.due && (
                <span
                  className={`due-tag ${done ? "done" : card.due < day() ? "overdue" : card.due === day() ? "today" : ""}`}
                  title={
                    done
                      ? "Concluído"
                      : card.due < day()
                        ? "Prazo vencido"
                        : card.due === day()
                          ? "Entrega hoje"
                          : "Prazo de entrega"
                  }
                >
                  {done ? <Check size={12} /> : <Clock3 size={12} />}{" "}
                  {dueText(card.due)}
                </span>
              )}
              {card.description && (
                <AlignLeft size={13} className="meta-description" />
              )}
              {card.checklist.length > 0 && (
                <span
                  className={`meta-item ${checked === card.checklist.length ? "check-complete" : ""}`}
                  title="Checklist"
                >
                  <CheckSquare2 size={13} />
                  {checked}/{card.checklist.length}
                </span>
              )}
              {card.comments.length > 0 && (
                <span className="meta-item" title="Comentários">
                  <MessageCircle size={13} />
                  {card.comments.length}
                </span>
              )}
              {card.attachments.length > 0 && (
                <span className="meta-item" title="Anexos">
                  <Paperclip size={13} />
                  {card.attachments.length}
                </span>
              )}
              {card.priority === "high" && (
                <Flag size={13} className="priority-flag" />
              )}
            </div>
            <AvatarGroup ids={card.members} members={state.members} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <a
          className="logo-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            openBoard(state.activeBoardId);
          }}
          aria-label="Brisa, início"
        >
          <Brand />
        </a>
        <div className="workspace-switch">
          <div className="workspace-icon">
            S<span>✦</span>
          </div>
          <div>
            <strong>{state.workspace}</strong>
            <span>Seu espaço de trabalho</span>
          </div>
          <IconButton
            icon={ChevronDown}
            title="Configurar workspace"
            onClick={() => setDialog("settings")}
          />
        </div>
        <nav className="main-nav" aria-label="Navegação principal">
          <button
            className={section === "overview" ? "active" : ""}
            onClick={() => {
              setSection("overview");
              setSidebarOpen(false);
            }}
          >
            <LayoutDashboard size={18} />
            Visão geral
          </button>
          <button
            className={section === "board" ? "active" : ""}
            onClick={() => openBoard(state.activeBoardId)}
          >
            <FolderKanban size={18} />
            Meus quadros<span className="nav-count">{state.boards.length}</span>
          </button>
          <button
            className={section === "inbox" ? "active" : ""}
            onClick={() => {
              setSection("inbox");
              setSidebarOpen(false);
            }}
          >
            <Inbox size={18} />
            Minhas tarefas
            {dueSoon.length > 0 && (
              <span className="inbox-count">{dueSoon.length}</span>
            )}
          </button>
        </nav>
        <div className="sidebar-section-label">
          <span>SEUS QUADROS</span>
          <IconButton
            icon={Plus}
            title="Criar novo quadro"
            onClick={() => setDialog("board")}
          />
        </div>
        <nav className="boards-nav" aria-label="Quadros">
          {state.boards.map((b) => (
            <button
              key={b.id}
              className={
                section === "board" && board.id === b.id ? "selected" : ""
              }
              onClick={() => openBoard(b.id)}
            >
              <span className="board-dot" style={{ background: b.color }} />
              {b.name}
              {b.starred && (
                <Star
                  size={13}
                  fill="currentColor"
                  className="board-nav-star"
                />
              )}
            </button>
          ))}
          <button className="new-board-link" onClick={() => setDialog("board")}>
            <Plus size={16} />
            Criar novo quadro
          </button>
        </nav>
        <div className="sidebar-section-label team-label">
          <span>NA SUA EQUIPE</span>
          <span className="team-number">{state.members.length}</span>
        </div>
        <div className="sidebar-team">
          {state.members.slice(0, 4).map((m) => (
            <Avatar key={m.id} member={m} />
          ))}
          <button
            className="avatar invite-avatar"
            aria-label="Adicionar pessoa à equipe"
            onClick={() => setDialog("invite")}
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="team-callout">
            <span className="callout-sparkle">
              <Sparkles size={20} />
            </span>
            <strong>Boas ideias crescem juntas.</strong>
            <p>Traga sua equipe para o mesmo espaço.</p>
            <button onClick={() => setDialog("invite")}>
              Convidar pessoas
              <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            className="settings-link"
            onClick={() => setDialog("settings")}
          >
            <Settings2 size={18} />
            Configurações
            <ChevronRight size={15} />
          </button>
          <div className="sidebar-footer">
            <span className="status-dot" />
            Seu trabalho, em sintonia.
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <IconButton
              className="mobile-menu"
              icon={Menu}
              title="Abrir navegação"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            />
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {section === "overview"
                ? "Visão geral"
                : section === "inbox"
                  ? "Minhas tarefas"
                  : "Meus quadros"}
            </strong>
          </div>
          <div className="topbar-actions">
            <div className="global-search">
              <Search size={16} />
              <input
                ref={searchRef}
                aria-label="Buscar em todos os quadros"
                placeholder="Buscar no workspace..."
                value={globalSearch}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setSearchOpen(true);
                }}
              />
              <kbd>Ctrl K</kbd>
              {searchOpen && (
                <div className="popover search-popover">
                  <div className="popover-label">
                    {globalSearch ? "RESULTADOS" : "ENCONTRE SUA PRÓXIMA IDEIA"}
                  </div>
                  {!globalSearch ? (
                    <>
                      <p className="search-hint">
                        Busque cards e quadros pelo nome.
                      </p>
                      {state.boards.map((b) => (
                        <button
                          className="search-result"
                          key={b.id}
                          onClick={() => {
                            openBoard(b.id);
                            setSearchOpen(false);
                          }}
                        >
                          <FolderKanban size={17} />
                          <span>
                            <strong>{b.name}</strong>
                            <small>Quadro · {b.columns.length} colunas</small>
                          </span>
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                    </>
                  ) : searchResults.length ? (
                    searchResults.map(({ card, column, board: b }) => (
                      <button
                        className="search-result"
                        key={card.id}
                        onClick={() => {
                          openBoard(b.id);
                          setCardModal({
                            boardId: b.id,
                            columnId: column.id,
                            cardId: card.id,
                          });
                          setSearchOpen(false);
                          setGlobalSearch("");
                        }}
                      >
                        <LayoutGrid size={17} />
                        <span>
                          <strong>{card.title}</strong>
                          <small>
                            {b.name} · {column.name}
                          </small>
                        </span>
                        <ArrowUpRight size={14} />
                      </button>
                    ))
                  ) : (
                    <p className="search-hint">
                      Nenhum card encontrado. Tente outro termo.
                    </p>
                  )}
                </div>
              )}
            </div>
            <IconButton
              icon={CircleHelp}
              title="Ajuda e atalhos"
              onClick={() => setDialog("help")}
            />
            <div className="popover-anchor notification-anchor">
              <IconButton
                icon={Bell}
                title="Notificações"
                onClick={() =>
                  setMenu(menu === "notifications" ? null : "notifications")
                }
              >
                {dueSoon.length > 0 && <span className="notification-dot" />}
              </IconButton>
              {menu === "notifications" && (
                <div className="popover notification-popover">
                  <div className="popover-heading">
                    De olho nos seus prazos
                    <Clock3 size={16} />
                  </div>
                  {dueSoon.length ? (
                    dueSoon.map(({ card, column, board: b }) => (
                      <button
                        className="notification-item"
                        key={card.id}
                        onClick={() => {
                          openBoard(b.id);
                          setCardModal({
                            boardId: b.id,
                            columnId: column.id,
                            cardId: card.id,
                          });
                          setMenu(null);
                        }}
                      >
                        <span className="notification-icon">
                          <CalendarDays size={17} />
                        </span>
                        <span>
                          <strong>{card.title}</strong>
                          <small>
                            {card.due < day()
                              ? "Prazo vencido"
                              : card.due === day()
                                ? "Entrega hoje"
                                : `Entrega em ${dueText(card.due)}`}
                          </small>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="search-hint">
                      Tudo em dia. Você pode respirar. ☀️
                    </p>
                  )}
                </div>
              )}
            </div>
            <IconButton
              className="logout-button"
              icon={LogOut}
              title="Sair da conta"
              onClick={onSignOut}
            />
            <span className="topbar-divider" />
            <button
              className="user-avatar-button"
              onClick={() => setDialog("settings")}
              aria-label="Meu perfil"
            >
              <Avatar member={state.members[0]} />
            </button>
          </div>
        </header>

        {section === "board" ? (
          <main className="board-page">
            <section className="board-header">
              <div className="board-heading-row">
                <div>
                  <div className="title-line">
                    <h1>{board.name}</h1>
                    <IconButton
                      icon={Star}
                      title={
                        board.starred
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                      className={board.starred ? "starred" : ""}
                      onClick={() =>
                        updateBoard((b) => ({ ...b, starred: !b.starred }))
                      }
                    />
                    <span className="privacy-badge">
                      <Users size={12} />
                      Equipe
                    </span>
                  </div>
                  <p className="board-description">{board.description}</p>
                </div>
                <div className="board-heading-actions">
                  <AvatarGroup
                    ids={state.members.map((m) => m.id)}
                    members={state.members}
                    limit={4}
                  />
                  <button
                    className="button button-invite"
                    onClick={() => setDialog("invite")}
                  >
                    <Users size={15} />
                    Convidar
                  </button>
                  <div className="popover-anchor">
                    <IconButton
                      icon={MoreHorizontal}
                      title="Opções do quadro"
                      onClick={() => setMenu(menu === "board" ? null : "board")}
                    />
                    {menu === "board" && (
                      <div className="popover board-menu">
                        <div className="popover-label">SEU QUADRO</div>
                        <MenuItem
                          icon={Pencil}
                          onClick={() => {
                            setDialog("settings");
                            setMenu(null);
                          }}
                        >
                          Editar nome e descrição
                        </MenuItem>
                        <MenuItem
                          icon={Palette}
                          onClick={() => setMenu("background")}
                        >
                          Personalizar fundo
                        </MenuItem>
                        <MenuItem
                          icon={Clock3}
                          onClick={() => {
                            setActivityOpen(true);
                            setMenu(null);
                          }}
                        >
                          Ver atividade
                        </MenuItem>
                        <MenuItem
                          icon={Archive}
                          onClick={() => {
                            setDialog("archive");
                            setMenu(null);
                          }}
                        >
                          Cards arquivados
                        </MenuItem>
                        <MenuItem
                          icon={Copy}
                          onClick={() => {
                            const copy = {
                              ...board,
                              id: uid(),
                              name: board.name + " (cópia)",
                              starred: false,
                              columns: board.columns.map((c) => ({
                                ...c,
                                id: uid(),
                                cards: c.cards.map((k) => ({
                                  ...k,
                                  id: uid(),
                                })),
                              })),
                              activity: [],
                            };
                            copy.doneColumnId =
                              copy.columns[
                                board.columns.findIndex(
                                  (c) => c.id === completedColumn?.id,
                                )
                              ]?.id || "";
                            change(
                              (s) => ({
                                ...s,
                                boards: [...s.boards, copy],
                                activeBoardId: copy.id,
                              }),
                              "Quadro duplicado.",
                            );
                            setMenu(null);
                          }}
                        >
                          Duplicar quadro
                        </MenuItem>
                        <MenuItem
                          icon={Download}
                          onClick={() => {
                            exportData();
                            setMenu(null);
                          }}
                        >
                          Exportar workspace
                        </MenuItem>
                        {state.boards.length > 1 && (
                          <>
                            <div className="menu-divider" />
                            <MenuItem
                              danger
                              icon={Trash2}
                              onClick={() => {
                                setMenu(null);
                                setConfirm({
                                  title: "Excluir este quadro?",
                                  description: `“${board.name}” e todos os seus cards serão removidos. A ação pode ser desfeita.`,
                                  action: () => {
                                    change(
                                      (s) => ({
                                        ...s,
                                        boards: s.boards.filter(
                                          (b) => b.id !== board.id,
                                        ),
                                        activeBoardId: s.boards.find(
                                          (b) => b.id !== board.id,
                                        )!.id,
                                      }),
                                      "Quadro excluído.",
                                      true,
                                    );
                                    setFilters(emptyFilters);
                                    setBoardSearch("");
                                  },
                                });
                              }}
                            >
                              Excluir quadro
                            </MenuItem>
                          </>
                        )}
                      </div>
                    )}
                    {menu === "background" && (
                      <div className="popover background-popover">
                        <div className="popover-heading">
                          Um fundo com a sua cara
                          <Palette size={16} />
                        </div>
                        <div className="background-options">
                          {backgrounds.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => {
                                updateBoard((b) => ({
                                  ...b,
                                  background: bg.id,
                                }));
                                setMenu(null);
                              }}
                            >
                              <span
                                className={`background-swatch bg-${bg.id}`}
                                style={{ background: bg.color }}
                              >
                                {board.background === bg.id && (
                                  <Check size={18} />
                                )}
                              </span>
                              <small>{bg.name}</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="board-tabs-row">
                <div
                  className="board-tabs"
                  role="tablist"
                  aria-label="Visualização do quadro"
                >
                  {[
                    { id: "board", name: "Quadro", icon: LayoutGrid },
                    { id: "list", name: "Lista", icon: List },
                    { id: "calendar", name: "Calendário", icon: CalendarDays },
                  ].map(({ id, name, icon: Icon }) => (
                    <button
                      role="tab"
                      aria-selected={view === id}
                      className={view === id ? "active" : ""}
                      key={id}
                      onClick={() => setView(id)}
                    >
                      <Icon size={16} />
                      {name}
                    </button>
                  ))}
                </div>
                <div className="board-tools">
                  <div className="popover-anchor">
                    <button
                      className={`text-button automation-button ${menu === "automation" ? "selected" : ""}`}
                      onClick={() =>
                        setMenu(menu === "automation" ? null : "automation")
                      }
                    >
                      <Zap size={15} />
                      Automações<span className="new-badge">NOVO</span>
                    </button>
                    {menu === "automation" && (
                      <div className="popover automation-popover">
                        <div className="popover-heading">
                          <span>
                            <Zap size={17} />
                            Menos cliques, mais fluxo
                          </span>
                        </div>
                        <p>
                          Ao mover um card para a coluna de conclusão, conclua
                          automaticamente seus itens de checklist.
                        </p>
                        <button
                          className={`toggle-row ${state.autoComplete ? "enabled" : ""}`}
                          onClick={() =>
                            change((s) => ({
                              ...s,
                              autoComplete: !s.autoComplete,
                            }))
                          }
                        >
                          <span>Concluir checklist ao finalizar</span>
                          <span className="toggle">
                            <i />
                          </span>
                        </button>
                        <small>
                          {completedColumn
                            ? `A regra vale para “${completedColumn.name}”.`
                            : "Marque uma coluna como conclusão no menu da coluna."}
                        </small>
                      </div>
                    )}
                  </div>
                  <span className="tools-divider" />
                  <div className="popover-anchor">
                    <button
                      className={`text-button ${filterCount ? "filter-active" : ""}`}
                      onClick={() =>
                        setMenu(menu === "filters" ? null : "filters")
                      }
                    >
                      <SlidersHorizontal size={16} />
                      Filtrar
                      {filterCount > 0 && (
                        <span className="filter-counter">{filterCount}</span>
                      )}
                    </button>
                    {menu === "filters" && (
                      <div className="popover filters-popover">
                        <div className="popover-heading">
                          Filtrar cards
                          {filterCount > 0 && (
                            <button
                              className="link-button"
                              onClick={() => setFilters(emptyFilters)}
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                        <label className="field-label">Responsáveis</label>
                        {state.members.map((m) => (
                          <label className="filter-check" key={m.id}>
                            <input
                              type="checkbox"
                              checked={filters.members.includes(m.id)}
                              onChange={() =>
                                setFilters((f) => ({
                                  ...f,
                                  members: f.members.includes(m.id)
                                    ? f.members.filter((id) => id !== m.id)
                                    : [...f.members, m.id],
                                }))
                              }
                            />
                            <Avatar member={m} small />
                            {m.name}
                          </label>
                        ))}
                        <label className="field-label">Etiquetas</label>
                        <div className="filter-label-options">
                          {state.labels.map((l) => (
                            <button
                              key={l.id}
                              className={
                                filters.labels.includes(l.id) ? "selected" : ""
                              }
                              style={{ background: l.color }}
                              onClick={() =>
                                setFilters((f) => ({
                                  ...f,
                                  labels: f.labels.includes(l.id)
                                    ? f.labels.filter((id) => id !== l.id)
                                    : [...f.labels, l.id],
                                }))
                              }
                            >
                              {l.name}
                              {filters.labels.includes(l.id) && (
                                <Check size={12} />
                              )}
                            </button>
                          ))}
                        </div>
                        <label className="field-label" htmlFor="due-filter">
                          Prazo
                        </label>
                        <select
                          id="due-filter"
                          value={filters.due}
                          onChange={(e) =>
                            setFilters((f) => ({ ...f, due: e.target.value }))
                          }
                        >
                          <option value="">Qualquer prazo</option>
                          <option value="today">Hoje</option>
                          <option value="week">Próximos 7 dias</option>
                          <option value="late">Vencidos</option>
                          <option value="none">Sem prazo</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section
              className={`board-canvas bg-${board.background} ${view !== "board" ? "alternate-canvas" : ""}`}
              aria-label="Conteúdo do quadro"
            >
              {board.background === "landscape" && <Landscape />}
              <div className="canvas-toolbar">
                <div className="canvas-context">
                  <span className="live-dot" />
                  Tudo em seu lugar<span className="canvas-dot">·</span>
                  <span>{boardCards.length} cards</span>
                </div>
                <div className="canvas-controls">
                  <div className="board-search">
                    <Search size={14} />
                    <input
                      placeholder="Buscar neste quadro"
                      aria-label="Buscar neste quadro"
                      value={boardSearch}
                      onChange={(e) => setBoardSearch(e.target.value)}
                    />
                    {boardSearch && (
                      <IconButton
                        icon={X}
                        title="Limpar busca"
                        onClick={() => setBoardSearch("")}
                      />
                    )}
                  </div>
                  <IconButton
                    icon={Clock3}
                    title="Atividade do quadro"
                    onClick={() => setActivityOpen(!activityOpen)}
                  />
                </div>
              </div>
              {(filterCount > 0 || boardSearch) && (
                <div className="active-filter-strip">
                  <SlidersHorizontal size={13} />
                  <span>
                    {boardCards.filter(({ card }) => matches(card)).length}{" "}
                    cards encontrados
                  </span>
                  <button
                    onClick={() => {
                      setFilters(emptyFilters);
                      setBoardSearch("");
                    }}
                  >
                    Limpar filtros
                    <X size={12} />
                  </button>
                </div>
              )}
              {view === "board" ? (
                <div className="columns-scroll">
                  <div className="columns-row">
                    {board.columns.map((column) => (
                      <section
                        key={column.id}
                        className={`kanban-column ${dragOver === column.id ? "drop-target" : ""} ${drag?.type === "column" && drag.id === column.id ? "dragging-column" : ""}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (
                            e.target === e.currentTarget ||
                            !(e.target as HTMLElement).closest(".task-card")
                          )
                            setDragOver(column.id);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          drop(column.id);
                        }}
                        aria-label={`Coluna ${column.name}`}
                      >
                        <div
                          className="column-header"
                          draggable={editingColumn !== column.id}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", column.id);
                            setDrag({
                              type: "column",
                              id: column.id,
                              columnId: column.id,
                            });
                          }}
                          onDragEnd={() => {
                            setDrag(null);
                            setDragOver(null);
                          }}
                        >
                          <span
                            className="column-status-dot"
                            style={{ background: column.color }}
                          />
                          {editingColumn === column.id ? (
                            <input
                              className="column-name-input"
                              value={editColumnName}
                              autoFocus
                              onChange={(e) =>
                                setEditColumnName(e.target.value)
                              }
                              onBlur={() => {
                                if (editColumnName.trim())
                                  updateBoard((b) => ({
                                    ...b,
                                    columns: b.columns.map((c) =>
                                      c.id === column.id
                                        ? { ...c, name: editColumnName.trim() }
                                        : c,
                                    ),
                                  }));
                                setEditingColumn(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") e.currentTarget.blur();
                                if (e.key === "Escape") {
                                  setEditingColumn(null);
                                }
                              }}
                            />
                          ) : (
                            <h2
                              onDoubleClick={() => {
                                setEditingColumn(column.id);
                                setEditColumnName(column.name);
                              }}
                              title="Clique duas vezes para renomear"
                            >
                              {column.name}
                            </h2>
                          )}
                          <span className="column-count">
                            {column.cards.filter(matches).length}
                          </span>
                          <div className="column-header-actions">
                            <IconButton
                              icon={Plus}
                              title={`Criar card em ${column.name}`}
                              onClick={() =>
                                setCardModal({
                                  boardId: board.id,
                                  columnId: column.id,
                                })
                              }
                            />
                            <div className="popover-anchor">
                              <IconButton
                                icon={MoreHorizontal}
                                title={`Opções da coluna ${column.name}`}
                                onClick={() =>
                                  setMenu(
                                    menu === `column:${column.id}`
                                      ? null
                                      : `column:${column.id}`,
                                  )
                                }
                              />
                              {menu === `column:${column.id}` && (
                                <div className="popover column-popover">
                                  <div className="popover-label">
                                    PERSONALIZAR COLUNA
                                  </div>
                                  <MenuItem
                                    icon={Pencil}
                                    onClick={() => {
                                      setEditingColumn(column.id);
                                      setEditColumnName(column.name);
                                      setMenu(null);
                                    }}
                                  >
                                    Renomear coluna
                                  </MenuItem>
                                  <div className="column-color-options">
                                    {columnColors.map((color) => (
                                      <button
                                        key={color}
                                        aria-label={`Usar cor ${color}`}
                                        style={{ background: color }}
                                        onClick={() =>
                                          updateBoard((b) => ({
                                            ...b,
                                            columns: b.columns.map((c) =>
                                              c.id === column.id
                                                ? { ...c, color }
                                                : c,
                                            ),
                                          }))
                                        }
                                      >
                                        {color === column.color && (
                                          <Check size={13} />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="menu-divider" />
                                  <MenuItem
                                    icon={CheckCheck}
                                    onClick={() => {
                                      updateBoard(
                                        (b) => ({
                                          ...b,
                                          doneColumnId:
                                            completedColumn?.id === column.id
                                              ? ""
                                              : column.id,
                                        }),
                                        completedColumn?.id === column.id
                                          ? "Coluna de conclusão desmarcada."
                                          : "Coluna de conclusão definida.",
                                      );
                                      setMenu(null);
                                    }}
                                  >
                                    {completedColumn?.id === column.id
                                      ? "Desmarcar conclusão"
                                      : "Marcar como conclusão"}
                                  </MenuItem>
                                  <MenuItem
                                    icon={ArrowUp}
                                    onClick={() => {
                                      updateBoard(
                                        (b) => ({
                                          ...b,
                                          columns: b.columns.map((c) =>
                                            c.id === column.id
                                              ? {
                                                  ...c,
                                                  cards: [...c.cards].sort(
                                                    (a, b) =>
                                                      a.title.localeCompare(
                                                        b.title,
                                                        "pt-BR",
                                                      ),
                                                  ),
                                                }
                                              : c,
                                          ),
                                        }),
                                        "Cards ordenados por nome.",
                                        true,
                                      );
                                      setMenu(null);
                                    }}
                                  >
                                    Ordenar por nome
                                  </MenuItem>
                                  <MenuItem
                                    icon={CalendarDays}
                                    onClick={() => {
                                      updateBoard(
                                        (b) => ({
                                          ...b,
                                          columns: b.columns.map((c) =>
                                            c.id === column.id
                                              ? {
                                                  ...c,
                                                  cards: [...c.cards].sort(
                                                    (a, b) =>
                                                      (
                                                        a.due || "9999"
                                                      ).localeCompare(
                                                        b.due || "9999",
                                                      ),
                                                  ),
                                                }
                                              : c,
                                          ),
                                        }),
                                        "Cards ordenados por prazo.",
                                        true,
                                      );
                                      setMenu(null);
                                    }}
                                  >
                                    Ordenar por prazo
                                  </MenuItem>
                                  <MenuItem
                                    icon={ArrowLeft}
                                    onClick={() => {
                                      const index = board.columns.findIndex(
                                        (c) => c.id === column.id,
                                      );
                                      if (index > 0)
                                        updateBoard(
                                          (b) => {
                                            const columns = [...b.columns];
                                            [
                                              columns[index - 1],
                                              columns[index],
                                            ] = [
                                              columns[index],
                                              columns[index - 1],
                                            ];
                                            return { ...b, columns };
                                          },
                                          "Coluna movida.",
                                          true,
                                        );
                                      setMenu(null);
                                    }}
                                  >
                                    Mover para a esquerda
                                  </MenuItem>
                                  <MenuItem
                                    icon={ArrowRight}
                                    onClick={() => {
                                      const index = board.columns.findIndex(
                                        (c) => c.id === column.id,
                                      );
                                      if (index < board.columns.length - 1)
                                        updateBoard(
                                          (b) => {
                                            const columns = [...b.columns];
                                            [
                                              columns[index + 1],
                                              columns[index],
                                            ] = [
                                              columns[index],
                                              columns[index + 1],
                                            ];
                                            return { ...b, columns };
                                          },
                                          "Coluna movida.",
                                          true,
                                        );
                                      setMenu(null);
                                    }}
                                  >
                                    Mover para a direita
                                  </MenuItem>
                                  <div className="menu-divider" />
                                  <MenuItem
                                    danger
                                    icon={Trash2}
                                    onClick={() => {
                                      setMenu(null);
                                      setConfirm({
                                        title: `Excluir “${column.name}”?`,
                                        description: `A coluna e seus ${column.cards.length} cards serão removidos. Você pode desfazer essa ação.`,
                                        action: () =>
                                          updateBoard(
                                            (b) => ({
                                              ...b,
                                              columns: b.columns.filter(
                                                (c) => c.id !== column.id,
                                              ),
                                            }),
                                            "Coluna excluída.",
                                            true,
                                          ),
                                      });
                                    }}
                                  >
                                    Excluir coluna
                                  </MenuItem>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="column-cards">
                          {column.cards
                            .filter(matches)
                            .map((card) => renderCard(card, column))}
                          {column.cards.filter(matches).length === 0 && (
                            <div className="empty-column">
                              <span>
                                <Sparkles size={19} />
                              </span>
                              <p>
                                {filterCount || boardSearch
                                  ? "Nenhum card neste filtro"
                                  : "Espaço para a próxima ideia"}
                              </p>
                              {!filterCount && !boardSearch && (
                                <small>
                                  Crie um card ou arraste um para cá.
                                </small>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          className="add-card-button"
                          onClick={() =>
                            setCardModal({
                              boardId: board.id,
                              columnId: column.id,
                            })
                          }
                        >
                          <Plus size={16} />
                          Adicionar card
                          <span>
                            <LayoutGrid size={13} />
                          </span>
                        </button>
                      </section>
                    ))}
                    {addingColumn ? (
                      <div className="new-column-form">
                        <label htmlFor="new-column">Uma nova etapa</label>
                        <input
                          id="new-column"
                          autoFocus
                          placeholder="Nome da coluna"
                          value={columnName}
                          onChange={(e) => setColumnName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addColumn();
                            if (e.key === "Escape") setAddingColumn(false);
                          }}
                        />
                        <div>
                          <button
                            className="button button-primary"
                            disabled={!columnName.trim()}
                            onClick={addColumn}
                          >
                            Criar coluna
                          </button>
                          <IconButton
                            icon={X}
                            title="Cancelar nova coluna"
                            onClick={() => setAddingColumn(false)}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        className="add-column-button"
                        onClick={() => setAddingColumn(true)}
                      >
                        <Plus size={19} />
                        <span>Adicionar coluna</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : view === "list" ? (
                <div className="list-view">
                  <div className="list-view-heading">
                    <span>
                      {boardCards.filter(({ card }) => matches(card)).length}{" "}
                      cards no quadro
                    </span>
                    <button
                      className="button button-primary"
                      disabled={!board.columns.length}
                      onClick={() =>
                        setCardModal({
                          boardId: board.id,
                          columnId: board.columns[0].id,
                        })
                      }
                    >
                      <Plus size={15} />
                      Novo card
                    </button>
                  </div>
                  <div className="task-table">
                    <div className="table-heading">
                      <span>Card</span>
                      <span>Status</span>
                      <span>Responsáveis</span>
                      <span>Prazo</span>
                      <span>Etiquetas</span>
                    </div>
                    {boardCards
                      .filter(({ card }) => matches(card))
                      .map(({ card, column }) => (
                        <button
                          className="table-row"
                          key={card.id}
                          onClick={() =>
                            setCardModal({
                              boardId: board.id,
                              columnId: column.id,
                              cardId: card.id,
                            })
                          }
                        >
                          <span className="table-title">
                            <span
                              className="table-check"
                              style={{
                                borderColor: column.color,
                                background:
                                  column.id === completedColumn?.id
                                    ? column.color
                                    : "transparent",
                              }}
                            >
                              {column.id === completedColumn?.id && (
                                <Check size={12} />
                              )}
                            </span>
                            {card.title}
                          </span>
                          <span className="table-status">
                            <i style={{ background: column.color }} />
                            {column.name}
                          </span>
                          <AvatarGroup
                            ids={card.members}
                            members={state.members}
                          />
                          <span
                            className={
                              card.due &&
                              card.due < day() &&
                              column.id !== completedColumn?.id
                                ? "text-danger"
                                : ""
                            }
                          >
                            {card.due ? dueText(card.due) : "—"}
                          </span>
                          <span className="card-labels">
                            {card.labels.map((id) => {
                              const l = state.labels.find((l) => l.id === id);
                              return l ? (
                                <span
                                  key={id}
                                  className="card-label"
                                  style={{ background: l.color }}
                                >
                                  {l.name}
                                </span>
                              ) : null;
                            })}
                          </span>
                        </button>
                      ))}
                  </div>
                  {!boardCards.filter(({ card }) => matches(card)).length && (
                    <div className="empty-state">
                      <Search size={30} />
                      <h3>Nenhum card por aqui</h3>
                      <p>Crie uma tarefa ou ajuste os filtros.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="calendar-view">
                  <div className="calendar-heading">
                    <div>
                      <h2>
                        {month.toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </h2>
                      <p>Uma visão clara dos próximos passos.</p>
                    </div>
                    <div>
                      <button
                        className="button button-white"
                        onClick={() =>
                          setMonth(
                            new Date(
                              new Date().getFullYear(),
                              new Date().getMonth(),
                              1,
                            ),
                          )
                        }
                      >
                        Hoje
                      </button>
                      <IconButton
                        icon={ChevronLeft}
                        title="Mês anterior"
                        onClick={() =>
                          setMonth(
                            new Date(
                              month.getFullYear(),
                              month.getMonth() - 1,
                              1,
                            ),
                          )
                        }
                      />
                      <IconButton
                        icon={ChevronRight}
                        title="Próximo mês"
                        onClick={() =>
                          setMonth(
                            new Date(
                              month.getFullYear(),
                              month.getMonth() + 1,
                              1,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="calendar-weekdays">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                      (d) => (
                        <span key={d}>{d}</span>
                      ),
                    )}
                  </div>
                  <div className="calendar-grid">
                    {Array.from({ length: 42 }, (_, i) => {
                      const date = new Date(
                        month.getFullYear(),
                        month.getMonth(),
                        i - month.getDay() + 1,
                      );
                      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                      return (
                        <div
                          className={`calendar-day ${date.getMonth() !== month.getMonth() ? "other-month" : ""} ${value === day() ? "is-today" : ""}`}
                          key={i}
                        >
                          <div>
                            <span>{date.getDate()}</span>
                            <IconButton
                              icon={Plus}
                              title={`Criar card para ${date.toLocaleDateString("pt-BR")}`}
                              disabled={!board.columns.length}
                              onClick={() =>
                                setCardModal({
                                  boardId: board.id,
                                  columnId: board.columns[0].id,
                                  cardId: `new:${value}`,
                                })
                              }
                            />
                          </div>
                          {boardCards
                            .filter(
                              ({ card }) => card.due === value && matches(card),
                            )
                            .map(({ card, column }) => (
                              <button
                                className="calendar-event"
                                key={card.id}
                                style={{ borderLeftColor: column.color }}
                                onClick={() =>
                                  setCardModal({
                                    boardId: board.id,
                                    columnId: column.id,
                                    cardId: card.id,
                                  })
                                }
                              >
                                {card.title}
                              </button>
                            ))}
                        </div>
                      );
                    })}
                  </div>
                  {boardCards.filter(({ card }) => !card.due && matches(card))
                    .length > 0 && (
                    <div className="unscheduled">
                      <Clock3 size={15} />
                      {
                        boardCards.filter(
                          ({ card }) => !card.due && matches(card),
                        ).length
                      }{" "}
                      cards ainda sem prazo. Abra um card para escolher uma
                      data.
                    </div>
                  )}
                </div>
              )}
              <div className="canvas-footer">
                <button
                  className={`cloud-status sync-${syncStatus}`}
                  onClick={onRetrySync}
                  title="Verificar sincronização"
                >
                  <Cloud size={14} />
                  {syncStatus === "saved"
                    ? "Sincronizado na nuvem"
                    : syncStatus === "saving"
                      ? "Salvando alterações..."
                      : syncStatus === "offline"
                        ? "Offline · sincronização pendente"
                        : "Sincronização pendente"}
                </button>
                <span>
                  Um passo de cada vez. Você está indo bem.
                  <Sparkles size={13} />
                </span>
                <span>
                  <GripVertical size={13} />
                  <span className="desktop-drag">Arraste para organizar</span>
                  <span className="mobile-swipe">Deslize entre colunas</span>
                </span>
              </div>
            </section>
          </main>
        ) : (
          <main className="dashboard-page">
            <div className="dashboard-heading">
              <div className="eyebrow">SEU ESPAÇO, SUAS POSSIBILIDADES</div>
              <h1>
                {section === "overview"
                  ? `Olá, ${state.members[0].name.split(" ")[0]}. Vamos fazer acontecer?`
                  : "Um pouco de foco faz toda a diferença."}
              </h1>
              <p>
                {section === "overview"
                  ? "Tudo o que sua equipe está construindo, em um só lugar."
                  : "Seus cards, seus próximos passos. Um dia de cada vez."}
              </p>
            </div>
            {section === "overview" ? (
              <>
                <div className="stat-grid">
                  <div>
                    <span className="stat-icon blue">
                      <FolderKanban size={20} />
                    </span>
                    <span>
                      <strong>{state.boards.length}</strong>
                      <small>Quadros em movimento</small>
                    </span>
                  </div>
                  <div>
                    <span className="stat-icon purple">
                      <LayoutGrid size={20} />
                    </span>
                    <span>
                      <strong>{allCards.length}</strong>
                      <small>Ideias ganhando forma</small>
                    </span>
                  </div>
                  <div>
                    <span className="stat-icon green">
                      <Users size={20} />
                    </span>
                    <span>
                      <strong>{state.members.length}</strong>
                      <small>Pessoas criando juntas</small>
                    </span>
                  </div>
                </div>
                <div className="dashboard-section-heading">
                  <h2>
                    Seus quadros<span>{state.boards.length}</span>
                  </h2>
                  <button
                    className="button button-primary"
                    onClick={() => setDialog("board")}
                  >
                    <Plus size={16} />
                    Criar quadro
                  </button>
                </div>
                <div className="board-grid">
                  {[...state.boards]
                    .sort((a, b) => Number(b.starred) - Number(a.starred))
                    .map((b) => (
                      <button
                        className="board-tile"
                        key={b.id}
                        onClick={() => openBoard(b.id)}
                      >
                        <div className={`board-tile-cover bg-${b.background}`}>
                          {b.background === "landscape" && <Landscape />}
                          <div className="mini-board">
                            {[0, 1, 2].map((i) => (
                              <span key={i}>
                                <i />
                                <i />
                                <i />
                              </span>
                            ))}
                          </div>
                          {b.starred && <Star size={17} fill="#fff" />}
                        </div>
                        <div className="board-tile-content">
                          <h3>
                            {b.name}
                            <ArrowUpRight size={17} />
                          </h3>
                          <p>{b.description}</p>
                          <span>
                            {b.columns.length} colunas ·{" "}
                            {b.columns.reduce(
                              (n, c) =>
                                n + c.cards.filter((k) => !k.archived).length,
                              0,
                            )}{" "}
                            cards
                          </span>
                        </div>
                      </button>
                    ))}
                  <button
                    className="new-board-tile"
                    onClick={() => setDialog("board")}
                  >
                    <span>
                      <Plus size={26} />
                    </span>
                    <strong>Dê espaço a uma nova ideia</strong>
                    <small>Criar novo quadro</small>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="dashboard-section-heading">
                  <h2>
                    Atribuídos a você
                    <span>
                      {
                        allCards.filter(({ card }) =>
                          card.members.includes(userId),
                        ).length
                      }
                    </span>
                  </h2>
                </div>
                <div className="my-tasks">
                  {allCards
                    .filter(({ card }) => card.members.includes(userId))
                    .sort((a, b) =>
                      (a.card.due || "9999").localeCompare(
                        b.card.due || "9999",
                      ),
                    )
                    .map(({ card, column, board: b }) => (
                      <button
                        className="my-task"
                        key={card.id}
                        onClick={() => {
                          openBoard(b.id);
                          setCardModal({
                            boardId: b.id,
                            columnId: column.id,
                            cardId: card.id,
                          });
                        }}
                      >
                        <span
                          className="my-task-icon"
                          style={{
                            background: column.color + "20",
                            color: column.color,
                          }}
                        >
                          {column.id === getDoneColumn(b)?.id ? (
                            <Check size={19} />
                          ) : (
                            <LayoutGrid size={19} />
                          )}
                        </span>
                        <span>
                          <strong>{card.title}</strong>
                          <small>
                            {b.name} / {column.name}
                          </small>
                        </span>
                        <span className="my-task-date">
                          {card.due ? dueText(card.due) : "Sem prazo"}
                        </span>
                        <ArrowUpRight size={17} />
                      </button>
                    ))}
                  {!allCards.some(({ card }) =>
                    card.members.includes(userId),
                  ) && (
                    <div className="empty-state">
                      <Inbox size={36} />
                      <h3>Sua lista está tranquila</h3>
                      <p>Atribua cards a você para vê-los aqui.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>
        )}
      </div>

      {activityOpen && (
        <aside className="activity-panel">
          <div className="panel-heading">
            <span>
              <Clock3 size={19} />
              Atividade do quadro
            </span>
            <IconButton
              icon={X}
              title="Fechar atividade"
              onClick={() => setActivityOpen(false)}
            />
          </div>
          <p className="panel-subtitle">Cada pequeno passo conta.</p>
          <div className="board-progress">
            <span>
              Progresso do quadro
              <strong>
                {boardCards.length
                  ? Math.round((completedCount / boardCards.length) * 100)
                  : 0}
                %
              </strong>
            </span>
            <div>
              <i
                style={{
                  width: `${boardCards.length ? (completedCount / boardCards.length) * 100 : 0}%`,
                }}
              />
            </div>
            <small>
              {completedCount} de {boardCards.length} cards concluídos
            </small>
          </div>
          <div className="activity-items">
            {board.activity.map((a) => (
              <div className="activity-item" key={a.id}>
                <Avatar member={state.members[0]} small />
                <span>
                  {a.text}
                  <small>
                    {new Date(a.at).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    ·{" "}
                    {new Date(a.at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </span>
              </div>
            ))}
            {!board.activity.length && (
              <div className="empty-state">
                <Clock3 size={30} />
                <p>As novidades deste quadro aparecerão aqui.</p>
              </div>
            )}
          </div>
        </aside>
      )}
      {cardModal &&
        state.boards.some(
          (b) =>
            b.id === cardModal.boardId &&
            b.columns.some((c) => c.id === cardModal.columnId),
        ) && (
          <CardEditor
            state={state}
            location={cardModal}
            onClose={() => setCardModal(null)}
            onSave={saveCard}
            userId={userId}
            onLabelCreate={(label) =>
              change((s) => ({ ...s, labels: [...s.labels, label] }))
            }
          />
        )}
      {dialog === "board" && (
        <NewBoardDialog
          onClose={() => setDialog(null)}
          onCreate={(name, description, background) => {
            const id = uid();
            const b: Board = {
              id,
              name,
              description,
              background,
              color: columnColors[state.boards.length % columnColors.length],
              starred: false,
              activity: [
                { id: uid(), text: `Você criou o quadro ${name}.`, at: now() },
              ],
              columns: ["Para começar", "Em andamento", "Concluído"].map(
                (name, i) => ({
                  id: uid(),
                  name,
                  color: columnColors[i === 2 ? 3 : i],
                  cards: [],
                }),
              ),
            };
            b.doneColumnId = b.columns[2].id;
            change(
              (s) => ({ ...s, boards: [...s.boards, b], activeBoardId: id }),
              "Seu novo quadro está pronto.",
            );
            setDialog(null);
            setSection("board");
            setView("board");
            setFilters(emptyFilters);
            setBoardSearch("");
          }}
        />
      )}
      {dialog === "invite" && (
        <InviteDialog members={state.members} onClose={() => setDialog(null)} />
      )}
      {dialog === "settings" && (
        <SettingsDialog
          state={state}
          board={board}
          onClose={() => setDialog(null)}
          onSave={(workspace, name, description, profileName) => {
            change(
              (s) => ({
                ...s,
                workspace,
                members: s.members.map((m, i) =>
                  i === 0
                    ? {
                        ...m,
                        name: profileName,
                        initials: profileName
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase(),
                      }
                    : m,
                ),
                boards: s.boards.map((b) =>
                  b.id === board.id ? { ...b, name, description } : b,
                ),
              }),
              "Configurações salvas.",
            );
            setDialog(null);
          }}
          onExport={exportData}
          onImport={() => importRef.current?.click()}
        />
      )}
      {dialog === "help" && (
        <Modal
          label="Ajuda e atalhos"
          onClose={() => setDialog(null)}
          className="small-modal"
        >
          <div className="dialog-header">
            <span className="dialog-icon">
              <Sparkles size={23} />
            </span>
            <IconButton
              icon={X}
              title="Fechar ajuda"
              onClick={() => setDialog(null)}
            />
          </div>
          <h2>Seu fluxo, mais leve.</h2>
          <p className="dialog-description">
            Pequenos atalhos para abrir espaço para o que importa.
          </p>
          <div className="shortcuts">
            <span>
              Buscar no workspace<kbd>Ctrl + K</kbd>
            </span>
            <span>
              Criar um novo card<kbd>N</kbd>
            </span>
            <span>
              Fechar modal ou menu<kbd>Esc</kbd>
            </span>
            <span>
              Abrir esta ajuda<kbd>?</kbd>
            </span>
          </div>
          <div className="help-tip">
            <GripVertical size={19} />
            <p>
              Arraste cards entre colunas e arraste o título das colunas para
              mudar a ordem. Clique duas vezes no título para renomear.
            </p>
          </div>
          <p className="local-note">
            <LockKeyhole size={14} />
            Seus dados são sincronizados com a equipe. Exporte um backup nas
            configurações.
          </p>
          <button
            className="button button-primary full-width"
            onClick={() => setDialog(null)}
          >
            Vamos nessa
          </button>
        </Modal>
      )}
      {dialog === "archive" && (
        <Modal
          label="Cards arquivados"
          onClose={() => setDialog(null)}
          className="archive-modal"
        >
          <div className="dialog-heading">
            <h2>
              <Archive size={22} />
              Cards arquivados
            </h2>
            <IconButton
              icon={X}
              title="Fechar arquivo"
              onClick={() => setDialog(null)}
            />
          </div>
          <p className="dialog-description">
            Ideias guardadas, prontas para voltar quando fizer sentido.
          </p>
          {board.columns
            .flatMap((c) =>
              c.cards
                .filter((k) => k.archived)
                .map((card) => ({ card, column: c })),
            )
            .map(({ card, column }) => (
              <div className="archive-row" key={card.id}>
                <div>
                  <strong>{card.title}</strong>
                  <small>{column.name}</small>
                </div>
                <button
                  className="button button-white"
                  onClick={() =>
                    updateBoard(
                      (b) => ({
                        ...b,
                        columns: b.columns.map((c) =>
                          c.id === column.id
                            ? {
                                ...c,
                                cards: c.cards.map((k) =>
                                  k.id === card.id
                                    ? { ...k, archived: false }
                                    : k,
                                ),
                              }
                            : c,
                        ),
                      }),
                      "Card restaurado.",
                      true,
                    )
                  }
                >
                  <RotateCcw size={14} />
                  Restaurar
                </button>
                <IconButton
                  icon={Trash2}
                  title={`Excluir ${card.title} permanentemente`}
                  onClick={() =>
                    setConfirm({
                      title: "Excluir card?",
                      description:
                        "O card será removido do arquivo. Você poderá desfazer essa ação.",
                      action: () =>
                        updateBoard(
                          (b) => ({
                            ...b,
                            columns: b.columns.map((c) => ({
                              ...c,
                              cards: c.cards.filter((k) => k.id !== card.id),
                            })),
                          }),
                          "Card excluído.",
                          true,
                        ),
                    })
                  }
                />
              </div>
            ))}
          {!board.columns.some((c) => c.cards.some((k) => k.archived)) && (
            <div className="empty-state">
              <Archive size={34} />
              <h3>Nada guardado por aqui</h3>
              <p>Os cards que você arquivar aparecerão neste espaço.</p>
            </div>
          )}
        </Modal>
      )}
      {confirm && (
        <Modal
          label={confirm.title}
          onClose={() => setConfirm(null)}
          className="small-modal"
        >
          <div className="dialog-header">
            <span className="dialog-icon warning">
              <Trash2 size={23} />
            </span>
            <IconButton
              icon={X}
              title="Cancelar"
              onClick={() => setConfirm(null)}
            />
          </div>
          <h2>{confirm.title}</h2>
          <p className="dialog-description">{confirm.description}</p>
          <div className="dialog-footer">
            <button
              className="button button-white"
              onClick={() => setConfirm(null)}
            >
              Cancelar
            </button>
            <button
              className="button button-danger"
              onClick={() => {
                confirm.action();
                setConfirm(null);
              }}
            >
              Confirmar
            </button>
          </div>
        </Modal>
      )}
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) void importData(e.target.files[0]);
        }}
      />
      {toast && (
        <div className="toast" role="status">
          <span className="toast-check">
            <Check size={15} />
          </span>
          {toast.message}
          {toast.undo && (
            <button onClick={() => toast.undo?.()}>Desfazer</button>
          )}
          <IconButton
            icon={X}
            title="Fechar mensagem"
            onClick={() => setToast(null)}
          />
        </div>
      )}
    </div>
  );
}

function CardEditor({
  state,
  location,
  onClose,
  onSave,
  onLabelCreate,
  userId,
}: {
  userId: string;
  state: State;
  location: CardLocation;
  onClose: () => void;
  onSave: (card: Card, location: CardLocation, initial?: Card) => void;
  onLabelCreate: (label: State["labels"][number]) => void;
}) {
  const board = state.boards.find((b) => b.id === location.boardId)!;
  const original = board.columns
    .find((c) => c.id === location.columnId)
    ?.cards.find((c) => c.id === location.cardId);
  const [draft, setDraft] = useState<Card>(() =>
    original
      ? structuredClone(original)
      : {
          ...newCard(),
          due: location.cardId?.startsWith("new:")
            ? location.cardId.slice(4)
            : "",
        },
  );
  const [columnId, setColumnId] = useState(location.columnId);
  const [panel, setPanel] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [checkText, setCheckText] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(labelColors[0]);
  const [error, setError] = useState("");
  const [discard, setDiscard] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const initialRef = useRef(JSON.stringify(original || draft));
  const originalRef = useRef(original ? structuredClone(original) : undefined);
  const update = (partial: Partial<Card>) =>
    setDraft((d) => ({ ...d, ...partial }));
  const dirty =
    JSON.stringify(draft) !== initialRef.current ||
    columnId !== location.columnId ||
    comment.trim() !== "" ||
    checkText.trim() !== "";
  const requestClose = () => {
    if (dirty) setDiscard(true);
    else onClose();
  };
  const checked = draft.checklist.filter((i) => i.done).length;
  function save() {
    if (!draft.title.trim()) {
      setError("Dê um nome à sua ideia para criar o card.");
      document.getElementById("card-title")?.focus();
      return;
    }
    const next = {
      ...draft,
      title: draft.title.trim(),
      comments: comment.trim()
        ? [
            ...draft.comments,
            { id: uid(), text: comment.trim(), memberId: userId, at: now() },
          ]
        : draft.comments,
      checklist: checkText.trim()
        ? [
            ...draft.checklist,
            { id: uid(), text: checkText.trim(), done: false },
          ]
        : draft.checklist,
    };
    onSave(next, { ...location, columnId }, originalRef.current);
  }
  function addCheck() {
    if (!checkText.trim()) return;
    update({
      checklist: [
        ...draft.checklist,
        { id: uid(), text: checkText.trim(), done: false },
      ],
    });
    setCheckText("");
  }
  function addLink() {
    try {
      const url = new URL(attachmentUrl);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error();
      update({
        attachments: [
          ...draft.attachments,
          {
            id: uid(),
            name: attachmentName.trim() || url.hostname,
            url: url.href,
          },
        ],
      });
      setAttachmentUrl("");
      setAttachmentName("");
      setPanel(null);
      setError("");
    } catch {
      setError("Use um link válido, começando com https://.");
    }
  }
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!document.querySelector(".discard-modal")) saveRef.current();
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);
  async function addFile(file: File) {
    if (file.size > 800_000) {
      setError("Escolha um arquivo de até 800 KB ou adicione um link.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update({
        attachments: [
          ...draft.attachments,
          { id: uid(), name: file.name, url: String(reader.result) },
        ],
      });
      setPanel(null);
      setError("");
    };
    reader.onerror = () =>
      setError("Não foi possível ler esse arquivo. Tente novamente.");
    reader.readAsDataURL(file);
  }
  return (
    <>
      <Modal
        label={original ? `Editar ${draft.title}` : "Criar novo card"}
        className={`card-editor ${!original ? "is-new" : ""}`}
        onClose={requestClose}
      >
        {draft.cover && (
          <div className={`editor-cover cover-${draft.cover}`}>
            <img src={`/covers/${draft.cover}.svg`} alt="" />
            <button onClick={() => update({ cover: "" })}>
              <X size={14} />
              Remover capa
            </button>
          </div>
        )}
        <div className="editor-topbar">
          <span>
            <LayoutGrid size={16} />
            {original ? "Detalhes do card" : "UMA NOVA IDEIA COMEÇA AQUI"}
          </span>
          <div>
            <button
              className="editor-cover-button"
              onClick={() => setPanel(panel === "cover" ? null : "cover")}
            >
              <ImagePlus size={15} />
              {draft.cover ? "Alterar capa" : "Adicionar capa"}
            </button>
            <IconButton icon={X} title="Fechar card" onClick={requestClose} />
          </div>
        </div>
        <div className="editor-title">
          <textarea
            id="card-title"
            rows={2}
            autoFocus={!original}
            placeholder="O que vamos fazer acontecer?"
            aria-label="Título do card"
            value={draft.title}
            onChange={(e) => {
              update({ title: e.target.value });
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                document.getElementById("card-description")?.focus();
              }
            }}
          />
          <div className="editor-location">
            no quadro <strong>{board.name}</strong>
            <span>·</span>
            <select
              aria-label="Coluna do card"
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
            >
              {board.columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="editor-body">
          <div className="editor-main">
            {(draft.labels.length > 0 ||
              draft.members.length > 0 ||
              draft.due) && (
              <div className="editor-properties">
                {draft.labels.length > 0 && (
                  <div>
                    <span className="property-label">ETIQUETAS</span>
                    <div className="card-labels">
                      {draft.labels.map((id) => {
                        const l = state.labels.find((l) => l.id === id);
                        return l ? (
                          <button
                            className="card-label"
                            key={id}
                            style={{ background: l.color }}
                            onClick={() => setPanel("labels")}
                          >
                            {l.name}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                {draft.members.length > 0 && (
                  <div>
                    <span className="property-label">RESPONSÁVEIS</span>
                    <div className="editor-members">
                      {draft.members.map((id) => {
                        const m = state.members.find((m) => m.id === id);
                        return m ? (
                          <button
                            key={id}
                            onClick={() => setPanel("members")}
                            aria-label={`Responsável: ${m.name}`}
                          >
                            <Avatar member={m} small />
                          </button>
                        ) : null;
                      })}
                      <button
                        className="avatar small invite-avatar"
                        onClick={() => setPanel("members")}
                        aria-label="Adicionar responsável"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                )}
                {draft.due && (
                  <div>
                    <span className="property-label">PRAZO</span>
                    <button
                      className={`editor-due ${draft.due < day() ? "text-danger" : ""}`}
                      onClick={() => setPanel("date")}
                    >
                      <CalendarDays size={14} />
                      {new Date(draft.due + "T12:00:00").toLocaleDateString(
                        "pt-BR",
                        { day: "numeric", month: "long" },
                      )}
                      <ChevronDown size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
            {panel === "cover" && (
              <div className="editor-inline-panel">
                <div className="inline-panel-title">
                  Escolha uma capa
                  <IconButton
                    icon={X}
                    title="Fechar escolha de capa"
                    onClick={() => setPanel(null)}
                  />
                </div>
                <div className="cover-options">
                  {["brand", "moodboard", "wireframe", "waves"].map((cover) => (
                    <button
                      key={cover}
                      className={draft.cover === cover ? "selected" : ""}
                      aria-label={`Capa ${cover}`}
                      onClick={() => {
                        update({ cover });
                        setPanel(null);
                      }}
                    >
                      <img src={`/covers/${cover}.svg`} alt={cover} />
                      {draft.cover === cover && <Check size={18} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {panel === "members" && (
              <div className="editor-inline-panel">
                <div className="inline-panel-title">
                  Quem vai fazer acontecer?
                  <IconButton
                    icon={X}
                    title="Fechar responsáveis"
                    onClick={() => setPanel(null)}
                  />
                </div>
                {state.members.map((m) => (
                  <label className="filter-check" key={m.id}>
                    <input
                      type="checkbox"
                      checked={draft.members.includes(m.id)}
                      onChange={() =>
                        update({
                          members: draft.members.includes(m.id)
                            ? draft.members.filter((id) => id !== m.id)
                            : [...draft.members, m.id],
                        })
                      }
                    />
                    <Avatar member={m} small />
                    {m.name}
                  </label>
                ))}
              </div>
            )}
            {panel === "labels" && (
              <div className="editor-inline-panel">
                <div className="inline-panel-title">
                  Um pouco de cor, mais clareza
                  <IconButton
                    icon={X}
                    title="Fechar etiquetas"
                    onClick={() => setPanel(null)}
                  />
                </div>
                <div className="editor-label-options">
                  {state.labels.map((l) => (
                    <label key={l.id} style={{ background: l.color }}>
                      <input
                        type="checkbox"
                        checked={draft.labels.includes(l.id)}
                        onChange={() =>
                          update({
                            labels: draft.labels.includes(l.id)
                              ? draft.labels.filter((id) => id !== l.id)
                              : [...draft.labels, l.id],
                          })
                        }
                      />
                      {l.name}
                    </label>
                  ))}
                </div>
                <div className="new-label-row">
                  <input
                    aria-label="Nome da nova etiqueta"
                    placeholder="Criar uma nova etiqueta"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                  />
                  <button
                    className="button button-white"
                    disabled={!newLabelName.trim()}
                    onClick={() => {
                      const label = {
                        id: uid(),
                        name: newLabelName.trim(),
                        color: newLabelColor,
                      };
                      onLabelCreate(label);
                      update({ labels: [...draft.labels, label.id] });
                      setNewLabelName("");
                    }}
                  >
                    Criar
                  </button>
                </div>
                <div className="column-color-options">
                  {labelColors.map((c) => (
                    <button
                      key={c}
                      aria-label={`Cor da etiqueta ${c}`}
                      style={{ background: c }}
                      onClick={() => setNewLabelColor(c)}
                    >
                      {newLabelColor === c && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {panel === "date" && (
              <div className="editor-inline-panel">
                <div className="inline-panel-title">
                  Quando essa ideia vai ganhar vida?
                  <IconButton
                    icon={X}
                    title="Fechar prazo"
                    onClick={() => setPanel(null)}
                  />
                </div>
                <div className="date-quick-options">
                  {[
                    { name: "Hoje", date: day() },
                    { name: "Amanhã", date: day(1) },
                    { name: "Em uma semana", date: day(7) },
                  ].map((d) => (
                    <button
                      key={d.name}
                      className="button button-white"
                      onClick={() => {
                        update({ due: d.date });
                        setPanel(null);
                      }}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  aria-label="Data de entrega"
                  value={draft.due}
                  onChange={(e) => update({ due: e.target.value })}
                />
                {draft.due && (
                  <button
                    className="link-button"
                    onClick={() => {
                      update({ due: "" });
                      setPanel(null);
                    }}
                  >
                    Remover prazo
                  </button>
                )}
              </div>
            )}
            {panel === "attachment" && (
              <div className="editor-inline-panel">
                <div className="inline-panel-title">
                  Conecte os detalhes
                  <IconButton
                    icon={X}
                    title="Fechar anexos"
                    onClick={() => setPanel(null)}
                  />
                </div>
                <label className="field-label" htmlFor="attachment-url">
                  Link
                </label>
                <input
                  id="attachment-url"
                  type="url"
                  placeholder="https://..."
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                />
                <label className="field-label" htmlFor="attachment-name">
                  Nome (opcional)
                </label>
                <input
                  id="attachment-name"
                  placeholder="Ex.: Referências do projeto"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                />
                <div className="attachment-actions">
                  <button
                    className="button button-primary"
                    disabled={!attachmentUrl.trim()}
                    onClick={addLink}
                  >
                    <Link2 size={14} />
                    Adicionar link
                  </button>
                  <button
                    className="button button-white"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload size={14} />
                    Enviar arquivo
                  </button>
                </div>
                <small>
                  Arquivos de até 800 KB são sincronizados com a equipe.
                </small>
              </div>
            )}
            <section className="editor-section">
              <h3>
                <AlignLeft size={18} />
                Descrição
              </h3>
              <textarea
                id="card-description"
                className="description-input"
                placeholder="Adicione contexto, organize suas ideias ou escreva o próximo passo..."
                rows={4}
                value={draft.description}
                onChange={(e) => update({ description: e.target.value })}
              />
            </section>
            {(draft.checklist.length > 0 || panel === "checklist") && (
              <section className="editor-section checklist-section">
                <h3>
                  <CheckSquare2 size={18} />
                  Checklist
                  <span>
                    {checked}/{draft.checklist.length}
                  </span>
                </h3>
                {draft.checklist.length > 0 && (
                  <div className="checklist-progress">
                    <span>
                      {Math.round((checked / draft.checklist.length) * 100)}%
                    </span>
                    <div>
                      <i
                        style={{
                          width: `${(checked / draft.checklist.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {draft.checklist.map((item) => (
                  <div
                    className={`checklist-item ${item.done ? "checked" : ""}`}
                    key={item.id}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      aria-label={item.text}
                      onChange={() =>
                        update({
                          checklist: draft.checklist.map((i) =>
                            i.id === item.id ? { ...i, done: !i.done } : i,
                          ),
                        })
                      }
                    />
                    <input
                      aria-label="Texto do item"
                      value={item.text}
                      onChange={(e) =>
                        update({
                          checklist: draft.checklist.map((i) =>
                            i.id === item.id
                              ? { ...i, text: e.target.value }
                              : i,
                          ),
                        })
                      }
                    />
                    <IconButton
                      icon={X}
                      title={`Remover ${item.text}`}
                      onClick={() =>
                        update({
                          checklist: draft.checklist.filter(
                            (i) => i.id !== item.id,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
                <div className="checklist-add">
                  <Plus size={15} />
                  <input
                    aria-label="Novo item do checklist"
                    placeholder="Adicionar um próximo passo..."
                    value={checkText}
                    onChange={(e) => setCheckText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCheck();
                      }
                    }}
                  />
                  {checkText.trim() && (
                    <button onClick={addCheck}>Adicionar</button>
                  )}
                </div>
              </section>
            )}
            {draft.attachments.length > 0 && (
              <section className="editor-section">
                <h3>
                  <Paperclip size={18} />
                  Anexos<span>{draft.attachments.length}</span>
                </h3>
                {draft.attachments.map((a) => (
                  <div className="attachment-item" key={a.id}>
                    <span className="attachment-thumbnail">
                      <Link2 size={19} />
                    </span>
                    <a
                      href={safeUrl(a.url) ? a.url : undefined}
                      target="_blank"
                      rel="noreferrer"
                      download={a.url.startsWith("data:") ? a.name : undefined}
                    >
                      <strong>
                        {a.name}
                        <ExternalLink size={12} />
                      </strong>
                      <small>
                        {a.url.startsWith("data:")
                          ? "Arquivo local"
                          : new URL(a.url).hostname}
                      </small>
                    </a>
                    <IconButton
                      icon={X}
                      title={`Remover anexo ${a.name}`}
                      onClick={() =>
                        update({
                          attachments: draft.attachments.filter(
                            (k) => k.id !== a.id,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </section>
            )}
            <section className="editor-section comments-section">
              <h3>
                <MessageCircle size={18} />
                Conversa<span>{draft.comments.length}</span>
              </h3>
              {draft.comments.map((c) => {
                const m =
                  state.members.find((m) => m.id === c.memberId) ||
                  state.members[0];
                return (
                  <div className="comment" key={c.id}>
                    <Avatar member={m} small />
                    <div>
                      <strong>
                        {m.name}
                        <time>
                          {new Date(c.at).toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </time>
                      </strong>
                      <p>{c.text}</p>
                    </div>
                  </div>
                );
              })}
              <div className="comment-compose">
                <Avatar member={state.members[0]} small />
                <div>
                  <textarea
                    placeholder="Compartilhe uma ideia ou atualização..."
                    aria-label="Novo comentário"
                    value={comment}
                    rows={2}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  {comment.trim() && (
                    <button
                      className="button button-primary"
                      onClick={() => {
                        update({
                          comments: [
                            ...draft.comments,
                            {
                              id: uid(),
                              text: comment.trim(),
                              memberId: userId,
                              at: now(),
                            },
                          ],
                        });
                        setComment("");
                      }}
                    >
                      <Send size={13} />
                      Adicionar comentário
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
          <aside className="editor-side">
            <span className="property-label">ADICIONAR AO CARD</span>
            {[
              { id: "members", icon: Users, label: "Responsáveis" },
              { id: "labels", icon: Palette, label: "Etiquetas" },
              { id: "date", icon: CalendarDays, label: "Prazo" },
              { id: "checklist", icon: CheckSquare2, label: "Checklist" },
              { id: "attachment", icon: Paperclip, label: "Anexos" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                className={panel === id ? "selected" : ""}
                key={id}
                onClick={() => setPanel(panel === id ? null : id)}
              >
                <Icon size={16} />
                {label}
                {(id === "members" && draft.members.length) ||
                (id === "labels" && draft.labels.length) ||
                (id === "date" && draft.due) ||
                (id === "checklist" && draft.checklist.length) ||
                (id === "attachment" && draft.attachments.length) ? (
                  <span className="side-added-dot" />
                ) : null}
              </button>
            ))}
            <span className="property-label priority-label">PRIORIDADE</span>
            <select
              aria-label="Prioridade do card"
              value={draft.priority}
              onChange={(e) =>
                update({ priority: e.target.value as Card["priority"] })
              }
            >
              <option value="low">↓ Baixa</option>
              <option value="normal">— Normal</option>
              <option value="high">⚑ Alta</option>
            </select>
            <div className="editor-side-tip">
              <span>✦</span>
              <p>Uma boa ideia fica ainda melhor com um próximo passo claro.</p>
            </div>
          </aside>
        </div>
        {error && (
          <p role="alert" className="form-error editor-error">
            {error}
          </p>
        )}
        <footer className="editor-footer">
          <span>
            <LockKeyhole size={13} />
            Disponível para sua equipe
          </span>
          <div>
            <button className="button button-white" onClick={requestClose}>
              Cancelar
            </button>
            <button className="button button-primary" onClick={save}>
              {original ? <Check size={16} /> : <Plus size={16} />}{" "}
              {original ? "Salvar alterações" : "Criar card"}
            </button>
          </div>
        </footer>
        <input
          hidden
          ref={fileRef}
          type="file"
          onChange={(e) => {
            if (e.target.files?.[0]) void addFile(e.target.files[0]);
          }}
        />
      </Modal>
      {discard && (
        <Modal
          label="Descartar alterações"
          className="small-modal discard-modal"
          onClose={() => setDiscard(false)}
        >
          <h2>Guardar essa ideia?</h2>
          <p className="dialog-description">
            Você tem alterações que ainda não foram salvas.
          </p>
          <div className="dialog-footer">
            <button className="button button-white" onClick={onClose}>
              Descartar
            </button>
            <button
              className="button button-primary"
              onClick={() => setDiscard(false)}
            >
              Continuar editando
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function NewBoardDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, description: string, background: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState("landscape");
  return (
    <Modal
      label="Criar novo quadro"
      className="small-modal new-board-modal"
      onClose={onClose}
    >
      <div className="dialog-header">
        <span className="dialog-icon">
          <FolderKanban size={24} />
        </span>
        <IconButton
          icon={X}
          title="Fechar criação de quadro"
          onClick={onClose}
        />
      </div>
      <h2>Uma ideia. Muitas possibilidades.</h2>
      <p className="dialog-description">
        Crie um quadro e dê espaço ao seu próximo projeto.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim())
            onCreate(name.trim(), description.trim(), background);
        }}
      >
        <label className="field-label" htmlFor="board-name">
          Nome do quadro <span>*</span>
        </label>
        <input
          id="board-name"
          autoFocus
          required
          maxLength={70}
          placeholder="Ex.: O próximo grande projeto"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="field-label" htmlFor="board-desc">
          Uma breve descrição
        </label>
        <textarea
          id="board-desc"
          rows={2}
          placeholder="O que vamos construir juntos?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="field-label">Escolha um clima para o quadro</label>
        <div className="background-options">
          {backgrounds.map((bg) => (
            <button
              type="button"
              key={bg.id}
              onClick={() => setBackground(bg.id)}
            >
              <span
                className={`background-swatch bg-${bg.id}`}
                style={{ background: bg.color }}
              >
                {background === bg.id && <Check size={18} />}
              </span>
              <small>{bg.name}</small>
            </button>
          ))}
        </div>
        <p className="local-note">
          <LockKeyhole size={13} />
          Seu quadro será compartilhado com a equipe. Personalize tudo depois.
        </p>
        <button
          className="button button-primary full-width"
          disabled={!name.trim()}
          type="submit"
        >
          <Plus size={16} />
          Criar quadro
        </button>
      </form>
    </Modal>
  );
}
function InviteDialog({
  members,
  onClose,
}: {
  members: Member[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const link = location.origin + "/?signup=1";
  return (
    <Modal
      label="Convidar pessoas"
      onClose={onClose}
      className="small-modal invite-modal"
    >
      <div className="dialog-header">
        <span className="dialog-icon">
          <Users size={24} />
        </span>
        <IconButton icon={X} title="Fechar convite" onClick={onClose} />
      </div>
      <h2>Juntos, as ideias vão mais longe.</h2>
      <p className="dialog-description">
        Compartilhe o link de cadastro. Cada pessoa cria sua própria conta e já
        entra no workspace com o mesmo acesso da equipe.
      </p>
      <div className="invite-current-team">
        {members.slice(0, 7).map((m) => (
          <Avatar key={m.id} member={m} />
        ))}
        <span>{members.length} pessoas na equipe</span>
      </div>
      <label className="field-label" htmlFor="invite-link">
        Link para criar uma conta
      </label>
      <input
        id="invite-link"
        readOnly
        value={link}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button
        className="button button-primary full-width"
        onClick={() => {
          void navigator.clipboard
            .writeText(link)
            .then(() => {
              setCopied(true);
              setCopyError(false);
            })
            .catch(() => setCopyError(true));
        }}
      >
        {copied ? <Check size={16} /> : <Link2 size={16} />}{" "}
        {copied ? "Link copiado" : "Copiar link de cadastro"}
      </button>
      {copyError && (
        <p className="form-error">
          Selecione o link acima e copie para compartilhar.
        </p>
      )}
      <p className="local-note">
        <Users size={14} />
        Os novos membros aparecem aqui automaticamente após o cadastro. Todos
        podem criar e editar quadros e cards.
      </p>
    </Modal>
  );
}
function SettingsDialog({
  state,
  board,
  onClose,
  onSave,
  onExport,
  onImport,
}: {
  state: State;
  board: Board;
  onClose: () => void;
  onSave: (
    workspace: string,
    name: string,
    description: string,
    profileName: string,
  ) => void;
  onExport: () => void;
  onImport: () => void;
}) {
  const [workspace, setWorkspace] = useState(state.workspace);
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description);
  const [profileName, setProfileName] = useState(state.members[0].name);
  return (
    <Modal label="Configurações" className="settings-modal" onClose={onClose}>
      <div className="dialog-heading">
        <h2>
          <Settings2 size={23} />
          Tudo do seu jeito
        </h2>
        <IconButton icon={X} title="Fechar configurações" onClick={onClose} />
      </div>
      <p className="dialog-description">
        Pequenos detalhes que deixam o espaço mais seu.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(
            workspace.trim(),
            name.trim(),
            description.trim(),
            profileName.trim(),
          );
        }}
      >
        <div className="settings-grid">
          <div>
            <label className="field-label" htmlFor="workspace-name">
              Nome do workspace
            </label>
            <input
              id="workspace-name"
              required
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="profile-name">
              Seu nome
            </label>
            <input
              id="profile-name"
              required
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>
        </div>
        <label className="field-label" htmlFor="settings-board">
          Nome do quadro atual
        </label>
        <input
          id="settings-board"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="field-label" htmlFor="settings-description">
          Descrição do quadro
        </label>
        <textarea
          id="settings-description"
          value={description}
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="backup-section">
          <span>
            <Download size={20} />
            <strong>Suas ideias, bem guardadas.</strong>
          </span>
          <p>
            O workspace já é sincronizado entre seus dispositivos. Você também
            pode exportar uma cópia de todos os quadros, cards e configurações.
          </p>
          <div>
            <button
              type="button"
              className="button button-white"
              onClick={onExport}
            >
              <Download size={15} />
              Exportar backup
            </button>
            <button
              type="button"
              className="button button-white"
              onClick={onImport}
            >
              <Upload size={15} />
              Importar backup
            </button>
          </div>
        </div>
        <div className="dialog-footer">
          <button
            className="button button-white"
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="button button-primary"
            type="submit"
            disabled={!workspace.trim() || !name.trim() || !profileName.trim()}
          >
            <Check size={15} />
            Salvar alterações
          </button>
        </div>
      </form>
    </Modal>
  );
}
