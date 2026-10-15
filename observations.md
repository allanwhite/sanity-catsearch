# Honest Observations

Version 1. Just me, a terminal, and a browser console. 

## Critical problems

- Welp, that app crashes almost immediately. WTF? Two characters in, boom. 
- Oh I waited for a few seconds before it crashed... now it's showing results. A search engine that breaks after 2 characters, that's a new one!
- The Console is full of red! But some helpful bits. `UseEffect` is...used incorrectly here it seems. 

## Problem approach
1. Fix the crash. The user must at least be able to see the app. 
2. It's hitting the API right away, without any tests, checks, conditionals — no resilience at all. APIs could be milliseconds or many seconds before data is returned.
3. I'd focus on first not crashing the whole app. The crash radius seems to hit the entire app. not good.
4. `src/searchApiClient.js` has some notes about an unstable API. The rest of the app doesn't seem to have many comments or observations to guide someone using it. 
5. In the olden days, I would hit up StackOverflow and look for similar problems, or hit up Github to look for more robust examples. Or bug the senior eng. in the cubicle next to mine, whom I would bribe with my ham sandwich. Programming rituals must be respected. 
---

And then, of course, what we would actually do today. Codex: 

> this repo is old, and when run, doesn't work. 2 characters in and it fails. analyze

> break down the primary issues with this repo in order of importance. /plan mode

> Fix the P0 on a feature branch

After fixing the P0 bug, then we can actually start to enhance it with more resilience, user feedback, address a11y issues, and finally, enhance it with some proper cat images.