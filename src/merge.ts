import type { Card, State } from './data';
type Entity = Record<string, unknown> & { id: string };
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const entities = (v: unknown[]): v is Entity[] =>
  v.every((i) => object(i) && typeof i.id === "string");

/** Apply only local changes to the newest remote state, keeping unrelated changes. */
export function mergeChanges<T>(base: T, local: T, remote: T): T {
  if (equal(base, local)) return structuredClone(remote);
  if (equal(base, remote)) return structuredClone(local);
  if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote)) {
    if (entities(base) && entities(local) && entities(remote)) {
      const b = new Map(base.map((e) => [e.id, e])),
        l = new Map(local.map((e) => [e.id, e])),
        r = new Map(remote.map((e) => [e.id, e]));
      const result = new Map<string, Entity>();
      for (const item of remote) {
        if (b.has(item.id) && !l.has(item.id)) continue;
        result.set(
          item.id,
          l.has(item.id)
            ? (mergeChanges(b.get(item.id), l.get(item.id), item) as Entity)
            : item,
        );
      }
      for (const item of local)
        if (!b.has(item.id) && !r.has(item.id)) result.set(item.id, item);
      const baseOrder = base.filter((e) => l.has(e.id)).map((e) => e.id);
      const localOrder = local.filter((e) => b.has(e.id)).map((e) => e.id);
      const order = equal(baseOrder, localOrder)
        ? [...remote.map((e) => e.id), ...local.map((e) => e.id)]
        : [...local.map((e) => e.id), ...remote.map((e) => e.id)];
      return [...new Set(order)]
        .filter((id) => result.has(id))
        .map((id) => result.get(id)) as T;
    }
    // Labels and assignees are sets; preserve concurrent additions/removals.
    if ([...base, ...local, ...remote].every((i) => typeof i === "string")) {
      return [
        ...new Set([
          ...remote.filter((i) => !base.includes(i) || local.includes(i)),
          ...local.filter((i) => !base.includes(i)),
        ]),
      ] as T;
    }
    return structuredClone(local);
  }
  if (object(base) && object(local) && object(remote)) {
    const result: Record<string, unknown> = { ...remote };
    for (const key of new Set([...Object.keys(base), ...Object.keys(local)])) {
      if (equal(base[key], local[key])) continue;
      if (!(key in local)) delete result[key];
      else result[key] = mergeChanges(base[key], local[key], remote[key]);
    }
    return result as T;
  }
  return structuredClone(local);
}

/** Resolve a card's content and destination together when it moves during an edit. */
export function mergeWorkspace(base:State,local:State,remote:State):State {
  const result=structuredClone(mergeChanges(base,local,remote));
  const index=(state:State)=>new Map(state.boards.flatMap(b=>b.columns.flatMap(c=>c.cards.map(card=>[card.id,{card,columnId:c.id,boardId:b.id}] as const))));
  const b=index(base),l=index(local),r=index(remote),merged=new Map<string,{card:Card;columnId:string;boardId:string}>();
  for(const id of new Set([...l.keys(),...r.keys()])){
    const before=b.get(id),mine=l.get(id),theirs=r.get(id);
    if(before&&(!mine||!theirs))continue; // Deletion wins over editing or moving an existing card.
    if(mine&&theirs&&before){
      const locallyMoved=mine.columnId!==before.columnId||mine.boardId!==before.boardId;
      merged.set(id,{...(locallyMoved?mine:theirs),card:mergeChanges(before.card,mine.card,theirs.card)});
    }else if(mine||theirs)merged.set(id,(mine||theirs)!);
  }
  for(const board of result.boards)for(const column of board.columns){
    column.cards=column.cards.filter(card=>{const target=merged.get(card.id);return target?.boardId===board.id&&target.columnId===column.id;}).map(card=>merged.get(card.id)!.card);
    const present=new Set(column.cards.map(c=>c.id));
    for(const [id,item] of merged)if(item.boardId===board.id&&item.columnId===column.id&&!present.has(id))column.cards.push(item.card);
  }
  return result;
}
