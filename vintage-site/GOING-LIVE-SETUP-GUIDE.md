# Going live with auto-updating content

This guide covers one-time setup for hosting your site with GitHub + Netlify, so that after today, adding new photos/videos/PDFs/songs is just: drop file into a folder, upload to GitHub, wait ~30 seconds. No HTML editing, ever.

## What's new in your site folder

- **`content/`** — a new folder. Every subfolder you create in here (via GitHub) shows up automatically as a folder on your site, inside a new desktop icon called **My Files**.
- **`build-manifests.js`** — a small script that scans `content/` and writes out what's in it. Netlify will run this automatically every time you upload something. You should never need to run it yourself.
- **`netlify.toml`** — tells Netlify to run that script automatically. Already set up, nothing to configure.

## One-time setup

### Step 1: Create a GitHub account
Go to [github.com](https://github.com) and sign up (free). Skip this if you already have one.

### Step 2: Create a new repository
Click the **+** icon (top right) → **New repository**. Give it any name (e.g. `my-site`). Choose **Public** or **Private** (either works). Click **Create repository**.

### Step 3: Upload your site folder to GitHub
On your new repository's page, click **uploading an existing file** (or the **Add file → Upload files** button). Drag your entire `vintage-site` folder's contents in — `index.html`, `audio/`, `content/`, `build-manifests.js`, `netlify.toml`, everything. Scroll down and click **Commit changes**.

(GitHub's uploader flattens folder structure sometimes depending on your browser — if drag-and-drop from Finder doesn't preserve the `audio/` and `content/` subfolders, let me know and I'll walk you through GitHub Desktop instead, which handles folders more reliably.)

### Step 4: Create a Netlify account
Go to [netlify.com](https://netlify.com) and sign up — choose **"Sign up with GitHub"** so the two are connected from the start.

### Step 5: Connect your repository
In Netlify, click **Add new site → Import an existing project → Deploy with GitHub**. Pick the repository you just created. Netlify will detect the `netlify.toml` file automatically and pre-fill the build settings — you shouldn't need to change anything. Click **Deploy**.

Within a minute or two, Netlify gives you a live URL (something like `random-name-123.netlify.app`). Your site is now live.

### Step 6 (optional): Custom domain
If you own a domain name, Netlify's dashboard has a **Domain settings** section to connect it. Ask me if you'd like help with this part when you get there.

## Adding content going forward

1. In GitHub, open your repository and navigate into `content/`.
2. If it's a brand new category (e.g. "vacation photos"), click **Add file → Create new file**, type `vacation-photos/.gitkeep` as the filename (this creates the folder), and commit. From then on that folder exists and you can upload straight into it.
3. Open the folder, click **Add file → Upload files**, drag in your photos/videos/PDFs/songs, and commit.
4. Wait about 30 seconds — Netlify detects the change, runs the build script, and republishes automatically.
5. Refresh your live site. Open **My Files** — your new folder and its contents are there.

No editing `index.html` required for any of this.

## One important limitation

Testing the site by double-clicking `index.html` on your own computer will **not** show synced content — browsers block that kind of file-reading for security reasons when a page is opened directly from disk. Synced folders only work once the site is actually live (or run through a local dev server, which I can help set up if you ever want that for testing).

Everything else about the site — Paint, Solitaire, the password gate, existing pictures/PDFs/videos that were embedded directly — works exactly the same as before, live or locally.
