# Export Presentation
To export the presentation either as PDF or static HTML, it must be [build](../README.md#build) and [serve](../README.md#serve) first.

## 1. Export as PDF
The PDF export can be done locally or through Docker.

- **Locally**
    ```console
    npm run export-pdf
    ```

- **Docker**

    [Docker](https://docs.docker.com/get-docker/) need to be installed and then the following command can be run:
    
    ```console
    npm run export-pdf-docker
    ```

## 2. Export as Static HTML
To export the presentation as static HTML, simply run:

```console
npm run export-html
```

## 3. Export as PDF and Static HTML at once:
To export the presentation as PDF and Static HTML at once, run the command:

```console
npm run export
```

# Usage

The exported presentations are stored in the `exports` folder, and presentation will be exported with the same name as markdown file. The folder structure is as follows:

```console
exports
└── <markdown-filename>
      ├── static (html export)
      │   ├── dist
      │   │   ├── css
      │   │   │   ├── metadata.css
      │   │   │   └── vendor.css
      │   │   └── js
      │   │       └── vendor.js
      │   ├── markdown
      │   │   └── assets
      │   ├── config-reveal.js
      │   └── index.html
      └── <markdown-filename>.pdf
```

## 1. PDF
The exported PDF file can be open in a PDF viewer.

## 2. Static HTML
The `static/index.html` file can be open in a browser.
