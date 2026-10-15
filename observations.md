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
5. I did notice that typing could easily overwhelm a form; there's no debouncing or serialization in place to ensure the input streams into the function without overwhelming it. 
5. In the olden days, I would hit up StackOverflow and look for similar problems, or hit up Github to look for more robust examples. Or bug the senior eng. in the cubicle next to mine, whom I would bribe with my ham sandwich. Programming rituals must be respected. 
---

And then, of course, what we would actually do today. Codex: 

> this repo is old, and when run, doesn't work. 2 characters in and it fails. analyze

> break down the primary issues with this repo in order of importance. /plan mode

> Fix the P0 on a feature branch

After fixing the P0 bug, then we can actually start to enhance it with more resilience, user feedback, address a11y issues, and finally, enhance it with some proper cat images. But let's fix the P1 => P4 bugs first to ensure we're on solid ground. I find it best to get a proper "hello world" functioning before there's any other improvements. 

More `/plan` mode. Consider all the angles and best practices before any commits. 

After addressing critical issues, we can now start to add some loading states. Even if the search tool isn't actually _responding_ yet, communicating to the human user what's happening is key — or they'll abandon the all-important search for cats. 
- Added `errorBoundary.jsx` to better manage crashes and add resilience to the app. If a component crashes, it won't kill the app. Main picks up the component
- Not much to see in an a11y audit, but the first pass is much improved. There's a simple [x] to clear the field, and a few other loading-state messages. UX begins with content!

> Tackle the remaining issues before we enhance

1-4 of the recommendations are programming best practices. It really really wants to start enhancing that UX!

Testing and data flow best practices are the top remaining issues, and essential to improve before we continue. Let's do that now. from the list, I'll point out `<waves hands>` yeah write the tests. I would have brought coffee to the Sr. Eng. to help me do that anyway. 

The other issues are actually kind of interesting. 

```
1. do it
2. add timeout of 5s // I'd play with this value, but really, how much time does one need to type a proper cat breed? maybe 30s. 
3. regex (only letters)? Other ideas? // It didn't like my regex idea. Yes, spaces exist, but do we really want numbers, symbols, or a SQL injection or XSS attack? On our cats?? I'm right to push back.
4. Would clicking x in form do? // worth a shot, it isn't the right solution.
5. defer
6. Defer
```
🤔 curious: why when I type `Russian White` do we get lots of results without that string? Let's crack open the React Components tab. 

Well look at that! There's a fair bit of data in each result. 

```
breed: "Khao Manee"
country: "Thailand"
origin: "Natural"
body type: ""
coat: "Short"
pattern: "Solid white"
```

Well, instead of reaching for some other, cooler cat search API, let's bring this data to the _people_ in this app. 

> For each result, spit out a table with the other key-value pairs. 

Now we are talking. It looks dreadful — but the hidden data is there!

Aside:

```
function formatFieldName(fieldName) {
  return fieldName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
```
Look at this. We live in the future. I probably in the past would have just made a lookup table of field labels (like a form has) instead of regexing the hell out of the slugs. But `¯\_(ツ)_/¯`

---

Ok we have some core functionality in place. It's getting late and I have to persuade very smart people that I can l33tcode first thing in the morning. Let's CatAPI this thang.

> Ok let's use the Cat API instead so we can get some fun pictures. thecatapi.com. I have an API key. Use https://docs.thecatapi.com/docs/guides/breed-data breed data

It helpfully points out that the API key will be visible in the browser. Go for it! (Several approaches to prevent this in a *real* app).

😳 Ok there _IS_ such a thing as too much content, and too much Siamese (aside: I used to have one as a kid. Its name was Margaret "Maggie" Thatcher. My dad was a fan.). Let's UI this thing.

> Install DaisyUI

> Then replace the tables with https://daisyui.com/components/card/ card. Display in a CSS grid.

> make sure the images lazy load, using a proper `<picture/>` tag, and image sizing and compression using their images API

The form sucks. It's also returning fewer cats, which is a big problem in this house. 

> make the form look better, using  https://daisyui.com/components/input/#search-input-with-icon center on the top of the page