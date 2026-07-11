# Static Coefficient Calculator

A self-contained browser tool for estimating the static reactivity of garments from their fiber composition.

## Features

- Build a garment blend from common textile fibers
- Adjust material proportions while keeping the total at 100%
- Compare generation potential, retention, moisture regain, and the calculated SC value
- View an explanation of the model inside the app
- Run locally with no build step or external dependencies

## Run locally

Download the project and open `index.html` in a modern web browser.

For a local web server, run:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy with GitHub Pages

1. Push this project to a GitHub repository.
2. Open **Settings → Pages** in the repository.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)`, then save.

## Project structure

```text
static-coefficient-calculator/
├── index.html
├── README.md
└── .gitignore
```

## Model note

The calculator is an illustrative model based on triboelectric position and moisture regain. Its output should not be treated as a laboratory measurement or safety rating.
