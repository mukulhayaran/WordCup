"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ExtrasFlower, ExtrasResponse, ExtrasVaseState } from "@/lib/apiTypes";
import { GIFT_BY_CODE, VASE_SIZE } from "@/lib/giftCatalog";
import { FlowerParts, GiftArt } from "./GiftArt";

const VASE_COLOURS: Array<[string, string]> = [
  ["Rose Pink", "#c93d66"],
  ["Marigold", "#e7ac43"],
  ["Peacock Blue", "#3f8fb0"],
  ["Tulsi Green", "#6f9148"],
  ["Jamun", "#7d5aa6"],
  ["Terracotta", "#c96a3c"],
];
const colourFor = (i: number) => VASE_COLOURS[i % VASE_COLOURS.length];
const SPOTS = [
  [12, 42],
  [38, 14],
  [63, 2],
  [90, 14],
  [114, 42],
  [63, 40],
];
const kindOf = (f: ExtrasFlower) => GIFT_BY_CODE.get(f.code)?.icon.replace("f:", "") ?? "marigold";

function VaseArt({ vase, color, width = 150 }: { vase: ExtrasVaseState; color: string; width?: number }) {
  return (
    <svg
      role="img"
      aria-label={`Vase with ${vase.flowers.length} of ${VASE_SIZE} flowers`}
      width={width}
      height={Math.round((width * 160) / 150)}
      viewBox="0 0 150 160"
      className="max-w-full"
    >
      {vase.flowers.map((_, i) => {
        const [x, y] = SPOTS[i];
        return <path key={i} d={`M75 96C75 80 ${x + 12} 76 ${x + 12} ${y + 22}`} stroke="#3f8f4f" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      })}
      {vase.flowers.map((f, i) => (
        <g key={i} transform={`translate(${SPOTS[i][0]} ${SPOTS[i][1]})`}>
          <FlowerParts kind={kindOf(f)} />
        </g>
      ))}
      <path d="M52 92h46c1 7-3 11-6 16 7 10 8 24 1 37-2 4-6 7-9 7H66c-3 0-7-3-9-7-7-13-6-27 1-37-3-5-7-9-6-16z" fill={color} />
      <path d="M55 120h40" stroke="#fff" strokeOpacity=".65" strokeWidth="4" strokeLinecap="round" />
      {vase.garlands > 0 &&
        Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={56 + i * 4.8} cy={100 + Math.sin((i / 8) * Math.PI) * 7} r="3.2" fill={i % 2 ? "#facc15" : "#f97316"} />
        ))}
    </svg>
  );
}

export function VaseShelves({ extras }: { extras: ExtrasResponse }) {
  const [open, setOpen] = useState<{ playerId: string; index: number } | null>(null);
  const openPlayer = extras.players.find((p) => p.id === open?.playerId);
  const openVase = open ? extras.vases[open.playerId]?.shelf[open.index] : undefined;

  return (
    <section className="rise-in">
      <div className="grid grid-cols-2 gap-2">
        {extras.players.map((p) => {
          const v = extras.vases[p.id];
          return (
            <div key={p.id} className="flex min-w-0 flex-col items-center rounded-[20px] bg-[var(--madhulika-soft)] px-1 py-2.5">
              <p className="text-center text-[14px] font-bold leading-tight text-ink">
                {p.id === extras.youId ? "Your" : `${p.name}'s`} vase #{v.shelf.length + 1}
              </p>
              <VaseArt vase={v.current} color={colourFor(v.shelf.length)[1]} />
              <div className="mt-0.5 flex gap-[3px]" aria-hidden>
                {Array.from({ length: VASE_SIZE }, (_, i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full border"
                    style={
                      i < v.current.flowers.length
                        ? { background: "var(--correct)", borderColor: "var(--correct)" }
                        : { background: "#fff", borderColor: "#d9b56d" }
                    }
                  />
                ))}
              </div>
              <p className="text-[13px] font-semibold text-ink">
                {v.current.flowers.length} of {VASE_SIZE}
              </p>
            </div>
          );
        })}
      </div>

      {extras.players.map((p) => {
        const shelf = extras.vases[p.id].shelf;
        return (
          <div key={p.id} className="mt-3">
            <p className="mb-0.5 text-[14px] font-bold text-ink">
              {p.id === extras.youId ? "Your" : `${p.name}'s`} shelf{" "}
              <span className="text-muted">
                · {shelf.length} {shelf.length === 1 ? "vase" : "vases"}
              </span>
            </p>
            <div className="flex min-h-[84px] items-end gap-1 overflow-x-auto rounded-[4px] border-b-[9px] border-[#b98a5e] px-1 pt-1">
              {shelf.length === 0 ? (
                <span className="w-full self-center text-center text-[14px] text-muted">The first full vase will stand here</span>
              ) : (
                shelf.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOpen({ playerId: p.id, index: i })}
                    aria-label={`${p.name}'s Vase ${i + 1}, ${colourFor(i)[0]}`}
                    className="flex w-[66px] shrink-0 flex-col items-center"
                  >
                    <VaseArt vase={v} color={colourFor(i)[1]} width={62} />
                    <span className="text-[12px] font-bold leading-none text-ink">#{i + 1}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}

      {open && openVase && openPlayer && (
        <div className="mt-3 rounded-[18px] bg-card p-2.5 shadow-soft">
          <div className="flex items-center gap-2">
            <VaseArt vase={openVase} color={colourFor(open.index)[1]} width={84} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[19px] font-bold text-ink">
                {openPlayer.name}&apos;s Vase #{open.index + 1}
              </p>
              <p className="text-[14px] text-muted">{colourFor(open.index)[0]}</p>
              {openVase.garlands > 0 && <p className="mt-0.5 text-[13px] font-semibold text-ink">Draped with a Garland of Victory</p>}
            </div>
            <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center text-muted">
              <X className="h-5 w-5" strokeWidth={2.6} />
            </button>
          </div>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {openVase.flowers.map((f, i) => {
              const gift = GIFT_BY_CODE.get(f.code);
              return (
                <li key={i} className="flex items-center gap-2.5 border-t border-line pt-1.5">
                  <GiftArt icon={gift?.icon ?? "gift"} size={26} />
                  <span className="min-w-0 leading-tight">
                    <span className="block text-[15px] font-semibold text-ink">{gift?.name}</span>
                    <span className="block text-[12px] text-muted">
                      From {f.fromName}
                      {f.weekNumber ? ` · Week ${f.weekNumber}` : ""}
                    </span>
                    {f.speech && <span className="block text-[13px] italic text-ink break-words">“{f.speech}”</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
