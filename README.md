This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## How guessing works

It works like real Wordle: the phone checks your guesses, and the server keeps the official record.

- When you open the game, the server sends your phone **today's word only**, never another day's. The phone checks each guess against the word list and colours it instantly, even without a connection.
- Every guess is also sent to the server in the background. The server checks it again and saves it, with the same rules as before: one attempt a day, at most 6 guesses, and protection against a double-tapped Enter.
- **The server's saved board is the official one.** Scores, the weekly cup, the duel and history all use only what the server saved. If the phone and the server ever disagree, the phone reloads the server's board.
- If a guess can't be sent (offline, bad signal), it waits on the phone and is sent automatically when the connection comes back. A small "Saving…" label shows while anything is unsaved. The result screen appears only after the server has confirmed every guess.
- Trade-off: a curious player could dig their own day's word out of the browser's developer tools. That only spoils your own game, and it never shows the other player's result. Their result stays hidden until you've both finished, exactly as before.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
