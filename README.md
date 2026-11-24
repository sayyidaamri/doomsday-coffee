# Doomsday Coffee Roasters: static site

![Homepage preview](docs/preview/homepage.gif)

This is an original static site for a fictional brand, **Doomsday Coffee Roasters**. It is plain HTML/CSS/JS with no hosting or build step needed to view it.

## How to open
Open `index.html` directly in Chrome or Edge (double-click it). Every link is relative, so the site works from `file://`. The folder can also be uploaded as-is to any static host.

## Folder layout
```
index.html  shop.html  locations.html  about.html  subscribe.html  blog.html  contact.html
franchise.html  404.html  credits.html                      ← 35 HTML pages in total
products/<roast>.html (12) + products/gift-card.html
blog/<post>.html (6)    policies/*.html (4)    account/login.html  account/register.html
assets/
  css/   main.css (tokens, nav, menu, cart, popup, transitions, footer)
         sections.css (home)  pages.css (shop)  pdp.css (product)  info.css (other pages)
  js/    main.js (global behaviour)  pages.js (shop)  pdp.js (product)  info.js (info pages + 404 game)
         data.js (cart catalogue)
  img/u    Unsplash photos      img/gen   original art (bags, beans, seal, illustrations; SVG + PNG)
  video    Mixkit clips         fonts     self-hosted Google Fonts (see fonts/fonts.css)
  vendor   Lenis, Matter.js
```

## Editing
The pages are static, hand-editable HTML. The generator (`build/`) and the `docs/` folder that earlier versions of this README described are no longer in this folder, so edit the HTML files, CSS and JS directly.

- Copy and markup: edit the relevant `.html` file. Shared parts (nav, menu, cart, popup, footer) are repeated in every page, so change them in each file.
- Cart catalogue (names, prices, sizes): `assets/js/data.js`.
- Bag, bean and seal art: `assets/img/gen`.

## Interactive states that are included
- First-visit popup in 3 steps (choose a roast → email with validation → code), plus a "%" chip to reopen it
- Slide-out menu with a torn edge (drops from the top on mobile), and a cart drawer: qty, size, grind, subscription + frequency, remove, clear, an empty state with a rotating icon, and a sign-in / create account / reset password panel
- Wipe page transition with the page title between pages
- 3D "lazy susan" bag carousel (auto, drag, arrows, keyboard), review marquee, UFO beam carousel with a cursor pop-up
- Sticky steps with scroll snapping, horizontal timeline pinned to scroll, Matter.js bean physics (drag/push with the mouse)
- Shop: roast-level filter, 6/12 oz toggle, coffee quiz modal, bundle ring, Big Bang + "what's inside" modal, 4-step build-your-bundle
- Product page: size/grind/subscription/qty with price animation, info modal, video lightbox, prev/next roast navigation, paginated reviews and a write-review modal
- Info pages: today's open/closed status, FAQ accordion (mobile), tabbed contact form, blog filter + pagination, 3-step franchise form, account sub-views (`#recover`)
- 404: the **Bean Blaster** mini game on a canvas (arrows/WASD + space, Esc to quit, touch supported, best score saved)
- Every form validates but never sends anything. The cart is saved in localStorage.

## Placeholders to replace
Brand name, seal and bag art (`assets/img/gen`), email `hello@doomsdaycoffee.example`, the 555 phone numbers, the "Palm Hollow, FL" addresses, team names, reviews, the App Store / DoorDash / Maps links (they point to generic pages), and the policy text.
