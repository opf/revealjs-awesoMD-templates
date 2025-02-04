# revealjs-awesoMD-templates
OpenProject layouts and scripts for the slide generator [revealjs-awesoMD](https://github.com/opf/revealjs-awesoMD).

It is based on [reveal.js](https://revealjs.com/) and have the following features.

- Create presentations from markdown files
- Supports metadata in markdown files
- Customizable layouts for slides
- Export presentations as pdf
- Export presentations as static html

## Prerequisites

- [Node.js](https://nodejs.org/en/) (>= 18.0.0)
- [pnpm](https://pnpm.io/) (>= 9.x)

## Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/opf/training.git
cd training
pnpm install
```

## Build

To build the presentation builder run:

```bash
pnpm build
```

## Setup Presentations Root Directory

First, copy `.env.example` file and set presentations root directory path at `PRESENTATIONS_ROOT`

```bash
cp .env.example .env
```

## Serve

To serve the presentation builder run:

```bash
pnpm start <markdown-filename>
```

Your presentation will be served at http://localhost:8000

## Create a presentation

To create a presentation, see guidelines [here](docs/add-presentation.md).

## Edit a presentation

How to edit a presentation, see guidelines [here](docs/presentation-structure.md).

## Export a presentation

To export a presentation, see guidelines [here](docs/export-presentation.md).

## Run Unit Tests

To run or add unit tests, see guidelines [here](docs/run-tests.md)

