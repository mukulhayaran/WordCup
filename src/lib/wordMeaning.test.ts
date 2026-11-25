import { describe, expect, it, vi } from "vitest";
import { lookUpMeaning, pickMeaning } from "./wordMeaning";

const crane = [
  {
    word: "crane",
    meanings: [
      {
        partOfSpeech: "noun",
        definitions: [
          { definition: "A large bird with long legs and a long neck." },
          { definition: "Ardea herodias, the great blue heron." },
          { definition: "A machine for lifting heavy loads.", example: "The crane lifted the beam." },
        ],
      },
      { partOfSpeech: "verb", definitions: [{ definition: "To extend (one's neck)." }] },
    ],
  },
  { word: "crane", meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "The cranium." }] }] },
];

describe("picking a meaning", () => {
  it("takes the first meaning of each word type, up to two", () => {
    expect(pickMeaning("crane", crane)).toEqual({
      items: [
        { partOfSpeech: "noun", text: "A large bird with long legs and a long neck." },
        { partOfSpeech: "verb", text: "To extend (one's neck)." },
      ],
      example: "The crane lifted the beam.",
    });
  });

  it("uses two meanings of one word type when that's all there is", () => {
    const reply = [{ meanings: [{ partOfSpeech: "adjective", definitions: [{ definition: "One." }, { definition: "Two." }, { definition: "Three." }] }] }];
    expect(pickMeaning("x", reply).items.map((i) => i.text)).toEqual(["One.", "Two."]);
  });

  it("skips very long meanings and examples that don't use the word", () => {
    const reply = [
      {
        meanings: [
          {
            partOfSpeech: "noun",
            definitions: [{ definition: "x".repeat(300) }, { definition: "Short.", example: "Nothing to see here." }],
          },
        ],
      },
    ];
    expect(pickMeaning("crane", reply)).toEqual({ items: [{ partOfSpeech: "noun", text: "Short." }], example: null });
  });

  it("copes with odd replies", () => {
    expect(pickMeaning("crane", { title: "No Definitions Found" })).toEqual({ items: [], example: null });
    expect(pickMeaning("crane", [{ meanings: [{ definitions: "nope" }] }])).toEqual({ items: [], example: null });
  });
});

describe("looking a word up", () => {
  const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

  it("an unknown word gives an empty meaning", async () => {
    expect(await lookUpMeaning("qzxvw", reply(404, { title: "No Definitions Found" }) as unknown as typeof fetch)).toEqual({ items: [], example: null });
  });

  it("server trouble throws, so nothing gets saved", async () => {
    await expect(lookUpMeaning("crane", reply(500, {}) as unknown as typeof fetch)).rejects.toThrow();
  });

  it("asks for the right word", async () => {
    const f = reply(200, crane);
    await lookUpMeaning("crane", f as unknown as typeof fetch);
    expect(String((f.mock.calls[0] as unknown[])[0])).toBe("https://api.dictionaryapi.dev/api/v2/entries/en/crane");
  });
});
