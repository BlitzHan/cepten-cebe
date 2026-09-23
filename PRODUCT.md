# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS, no build step. Deployed to GitHub Pages from `main` root (https://blitzhan.github.io/cepten-cebe/).

## What it is

Cepten Cebe is a browser idle/clicker game in Turkish about running a phone business: you click to buy a phone and click to sell it, then automate both sides (supply units that buy, sales channels that sell), balance stock against a depot, raise phone condition (grade) to raise sell prices, move through phone eras (tuşlu → kapaklı → dokunmatik → akıllı → amiral gemisi → katlanır), hire crew, react to random events, and eventually go public (halka arz) for a prestige reset. Inspired by Dr. Meth's two-button make/sell loop.

## Players

Friends and anyone the link is shared with. They may not know the phone trade, so the Turkish phone-shop world (elden satış, telefoncu, mahalle dükkânı, AVM, kondisyon notları) must read as flavor anyone understands, not insider jargon.

## Operating context

Played equally on a Mac laptop (a tab left open, clicked now and then, must fit a ~1280×720 to 1440×800 viewport without page scrolling) and on a phone (one-handed, single column). Sessions are short and frequent; the game also progresses offline.

## Constraints

- Keep the game logic, balance (js/data.js, js/engine.js) and all features intact.
- Three-column desktop layout that fits the screen without page scroll; single column on mobile.
- All copy in Turkish.

## Anti-references (from the user)

- Dark purple ground with neon-glow rounded cards, generic dashboard feel.
- No identity: looks like any clicker; no phone-shop / esnaf / Turkish street feel.
