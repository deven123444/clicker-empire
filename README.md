# Cosmic Core: Ultra Clicker

A polished clicker/idle game starter that is ready for GitHub.

## Included
- `index.html`
- `styles.css`
- `app.js`
- `firebase-config.js`

## Features
- polished UI
- login/register screen
- local account mode
- optional Firebase cloud mode
- local fallback leaderboard/chat
- prestige, ascension, rebirth
- bosses
- admin panel for the owner email
- export/import save

## Owner panel
The owner email is:
`deavonvanschaik2@gmail.com`

## Deploy to GitHub Pages
1. Create a new GitHub repo
2. Upload all files
3. Commit
4. In GitHub repo settings, enable Pages from the main branch

## Enable real online features
Edit `firebase-config.js` and add your Firebase config.
Then also include the Firebase SDK tags in `index.html` before `app.js` if you want live cloud mode:

```html
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
```

Add those right before:
```html
<script src="firebase-config.js"></script>
<script src="app.js"></script>
```

## Notes
This production zip is GitHub-ready and works immediately in local mode.
Cloud multiplayer features only activate after Firebase is configured.
