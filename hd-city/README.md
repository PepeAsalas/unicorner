# Hunter Douglas – Sector City (prototype)

An interactive low-poly city. Each building is a sector; click it (or use ← →, keys 1–8) to zoom in and see Derako, HeartFelt and Luxalon projects. Esc goes back to the city.

## Run it
Double-click `index.html` (Chrome or Edge), then press F11 for full screen. Works offline; only the Inter/Roboto web fonts need internet (it falls back to Arial without it).

## Edit content
Everything you'd change is in `content.js`: sector text, bullet points, and projects (`brand`, `title`, `place`, `image`). Put photos in `assets/img/` and set `image: "assets/img/your-photo.jpg"`. `image: null` shows a placeholder.

## Put it on the website
Upload the whole `hd-city` folder as-is to any web host. No build step.
