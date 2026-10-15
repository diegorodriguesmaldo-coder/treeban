import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { isState, seed } from "./data";
import type { Member, State } from "./data";
import { mergeWorkspace } from "./merge";
import { supabase, WORKSPACE_ID } from "./supabase";

export type SyncStatus = "loading" | "saving" | "saved" | "offline" | "error";
type Row = { document: State; revision: number };
type Profile = { id: string; name: string; color: string };
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const profileMember = (p: Profile): Member => ({
  ...p,
  initials: p.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase(),
});
const draftKey = (userId: string) =>
  `brisa-cloud-draft:${WORKSPACE_ID}:${userId}`;
function canonical(state: State): State {
  return {
    ...state,
    members: [...state.members].sort((a, b) => a.id.localeCompare(b.id)),
    activeBoardId: state.boards[0]?.id || "",
  };
}
function personalized(state: State, userId: string, activeId?: string): State {
  return {
    ...state,
    activeBoardId: state.boards.some((b) => b.id === activeId)
      ? activeId!
      : state.boards[0].id,
    members: [...state.members].sort(
      (a, b) => Number(b.id === userId) - Number(a.id === userId),
    ),
  };
}

export class WorkspaceSync {
  base: State | null = null;
  local: State | null = null;
  revision = 0;
  running = false;
  disposed = false;
  timer: ReturnType<typeof setTimeout> | undefined;
  activeId = "";
  constructor(
    public userId: string,
    public onState: (state: State) => void,
    public onStatus: (status: SyncStatus) => void,
  ) {}
  async fetchRow(): Promise<Row> {
    const { data, error } = await supabase
      .from("workspaces")
      .select("document,revision")
      .eq("id", WORKSPACE_ID)
      .single();
    if (error) throw error;
    return data as Row;
  }
  async profiles(): Promise<Member[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,name,color")
      .order("created_at");
    if (error) throw error;
    return (data as Profile[]).map(profileMember);
  }
  async start() {
    const [row, members] = await Promise.all([
      this.fetchRow(),
      this.profiles(),
    ]);
    if (this.disposed) return;
    let initial = row.document;
    if (!isState(initial)) {
      initial = seed();
      initial.workspace = "Brisa";
      initial.members = members;
      initial.boards = initial.boards.map((b) => ({
        ...b,
        activity: [],
        columns: b.columns.map((c) => ({
          ...c,
          cards: c.cards.map((k) => ({ ...k, members: [], comments: [] })),
        })),
      }));
      const { data, error } = await supabase.rpc("save_workspace_document", {
        expected_revision: row.revision,
        next_document: canonical(initial),
      });
      if (error) throw error;
      const first = (data as Row[])[0] || (await this.fetchRow());
      initial = first.document;
      this.revision = first.revision;
    } else this.revision = row.revision;
    this.base = canonical(initial);
    this.local = canonical({ ...initial, members });
    try {
      const saved = JSON.parse(
        localStorage.getItem(draftKey(this.userId)) || "null",
      );
      if (saved && isState(saved.base) && isState(saved.local))
        this.local = mergeWorkspace(saved.base, saved.local, this.local);
    } catch {
      /* Remote data stays authoritative if an old draft cannot be read. */
    }
    this.emit();
    this.onStatus("saved");
    if (!same(this.base, this.local)) this.schedule();
  }
  emit() {
    if (this.local && !this.disposed)
      this.onState(personalized(this.local, this.userId, this.activeId));
  }
  receive(next: State) {
    this.activeId = next.activeBoardId;
    const value = canonical(next);
    if (same(value, this.local)) return;
    this.local = value;
    this.backup();
    this.schedule();
  }
  backup() {
    if (!this.base || !this.local) return;
    try {
      if (same(this.base, this.local))
        localStorage.removeItem(draftKey(this.userId));
      else
        localStorage.setItem(
          draftKey(this.userId),
          JSON.stringify({ base: this.base, local: this.local }),
        );
    } catch {
      /* Sync status reports remote persistence independently from browser quota. */
    }
  }
  schedule() {
    if (this.disposed) return;
    this.onStatus(navigator.onLine ? "saving" : "offline");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), 450);
  }
  async flush() {
    if (this.running || !this.base || !this.local || this.disposed) return;
    if (!navigator.onLine) {
      this.onStatus("offline");
      return;
    }
    this.running = true;
    try {
      for (
        let attempt = 0;
        attempt < 8 && !same(this.base, this.local);
        attempt++
      ) {
        const base: State = this.base,
          sent: State = structuredClone(this.local);
        const me = sent.members.find((m) => m.id === this.userId),
          oldMe = base.members.find((m) => m.id === this.userId);
        if (
          me &&
          (!oldMe || me.name !== oldMe.name || me.color !== oldMe.color)
        ) {
          const { error } = await supabase
            .from("profiles")
            .update({ name: me.name, color: me.color })
            .eq("id", this.userId);
          if (error) throw error;
        }
        const { data, error } = await supabase.rpc("save_workspace_document", {
          expected_revision: this.revision,
          next_document: sent,
        });
        if (error) throw error;
        if (this.disposed) return;
        const saved = (data as Row[])[0];
        if (saved) {
          this.base = canonical(saved.document);
          this.revision = saved.revision;
          this.local = mergeWorkspace(sent, this.local, this.base);
        } else {
          const latest = await this.fetchRow();
          this.local = mergeWorkspace(
            base,
            this.local,
            canonical(latest.document),
          );
          this.base = canonical(latest.document);
          this.revision = latest.revision;
        }
        this.backup();
        this.emit();
      }
      this.onStatus(same(this.base, this.local) ? "saved" : "saving");
    } catch (error) {
      console.error("Workspace sync failed", error);
      this.backup();
      this.onStatus(navigator.onLine ? "error" : "offline");
    } finally {
      this.running = false;
    }
  }
  async refresh() {
    if (this.running || this.disposed) return;
    try {
      const [row, members] = await Promise.all([
        this.fetchRow(),
        this.profiles(),
      ]);
      if (this.running || this.disposed || !this.base || !this.local) return;
      if (row.revision > this.revision) {
        this.local = mergeWorkspace(
          this.base,
          this.local,
          canonical(row.document),
        );
        this.base = canonical(row.document);
        this.revision = row.revision;
      }
      const known = new Map(this.local.members.map((m) => [m.id, m]));
      this.local = {
        ...this.local,
        members: members.map((m) =>
          m.id === this.userId ? known.get(m.id) || m : m,
        ),
      };
      this.backup();
      this.emit();
      if (!same(this.base, this.local)) await this.flush();
      else this.onStatus("saved");
    } catch {
      this.onStatus(navigator.onLine ? "error" : "offline");
    }
  }
  async finish() {
    clearTimeout(this.timer);
    if (this.running) return false;
    await this.flush();
    return !!this.base && same(this.base, this.local);
  }
  dispose() {
    this.disposed = true;
    clearTimeout(this.timer);
  }
}

export function useWorkspace(user: User) {
  const [state, setState] = useState<State | null>(null);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [error, setError] = useState("");
  const sync = useRef<WorkspaceSync | null>(null);
  useEffect(() => {
    let alive = true;
    const client = new WorkspaceSync(
      user.id,
      (s) => {
        if (alive) setState(s);
      },
      (s) => {
        if (alive) setStatus(s);
      },
    );
    sync.current = client;
    const start = () =>
      client.start().catch(() => {
        if (alive) {
          setError(
            "Não conseguimos abrir o workspace. Verifique sua conexão e tente novamente.",
          );
          setStatus("error");
        }
      });
    void start();
    const channel = supabase
      .channel(`workspace-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspaces",
          filter: `id=eq.${WORKSPACE_ID}`,
        },
        () => {
          void client.refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          void client.refresh();
        },
      )
      .subscribe();
    const refresh = () => {
      void client.refresh();
    };
    const offline = () => setStatus("offline");
    window.addEventListener("online", refresh);
    window.addEventListener("offline", offline);
    window.addEventListener("focus", refresh);
    const interval = setInterval(refresh, 12000);
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (client.base && client.local && !same(client.base, client.local)) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      alive = false;
      client.dispose();
      void supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", offline);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [user.id]);
  return {
    state,
    status,
    error,
    change: (s: State) => sync.current?.receive(s),
    retry: () => {
      setError("");
      if (sync.current?.local) void sync.current.refresh();
      else
        void sync.current
          ?.start()
          .catch(() =>
            setError("Ainda não foi possível conectar. Tente novamente."),
          );
    },
    finish: () => sync.current?.finish() || Promise.resolve(false),
  };
}
