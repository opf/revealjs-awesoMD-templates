const fs = require('fs')
const yaml = require('js-yaml')
const utils = require('./utils.js')

const mdDir = fs.readdirSync('markdown/', { withFileTypes: true })

const markdownFiles = {}

let success = true

mdDir.forEach((item) => {
    const ext = item.name.substring(item.name.length - 3)
    if (ext === '.md') {
        markdownFiles[item.name.split('.md')[0]] = utils.readMarkdownFile(item.name)
    }
})

const defaultMeta = ['description', 'footer', 'logo', 'presenter', 'slide']

const slideTypes = ['cover', 'section', 'title-content-image', 'title-content', 'title-image', 'toc']

const extractInlineMeta = (rawMarkdown) => {
    const slideContent = rawMarkdown.split('---\n').slice(2)
    const inlineMetaRegex = /```(yaml|yml)\n([\s\S]*?)```(\n[\s\S]*)?/g

    const inlineMeta = []
    try {
        slideContent.forEach((slide) => {
            inlineMetaRegex.lastIndex = 0
            const markdownParts = inlineMetaRegex.exec(slide)
            if (markdownParts) {
                inlineMeta.push(yaml.load(markdownParts[2]))
            }
        })
        return inlineMeta
    } catch (err) {
        return err
    }
}

function lintMeta(key) {
    const rawMarkdown = utils.readMarkdownFile(`${key}.md`)
    const peekDefaultMeta = utils.extractFrontmatter(rawMarkdown)
    const peekInlineMeta = extractInlineMeta(markdownFiles[key])

    // check if default metadata is extracted properly
    if (peekDefaultMeta instanceof Error && peekDefaultMeta.name === 'YAMLException') {
        console.error(`Invalid default metadata in '${key}.md'\nError: ${peekDefaultMeta.message}\n`)
        success = false
        return
    }

    // check if inline metadata is extracted properly
    if (peekInlineMeta instanceof Error && peekInlineMeta.name === 'YAMLException') {
        console.error(`Invalid inline metadata in "${key}.md"\nError: ${peekInlineMeta.message}\n`)
        success = false
        return
    }

    // check for every required meta inside the peek data
    defaultMeta.forEach((meta) => {
        if (!peekDefaultMeta[meta]) {
            console.error(`Missing required default meta "${meta}" in "${key}"`)
            success = false
        }
    })

    // check if slide type is valid in default metadata
    if (!slideTypes.includes(peekDefaultMeta.slide)) {
        console.error(`Invalid slide type "${peekDefaultMeta.slide}" in default meta in "${key}"`)
        success = false
    }

    // validation for inline metadata
    peekInlineMeta.forEach((inlineMetadata) => {
        // check if slide type is valid in inline metadata
        if (inlineMetadata.slide && !slideTypes.includes(inlineMetadata.slide)) {
            console.error(`Invalid slide type "${inlineMetadata.slide}" in inline metadata "${key}"`)
            success = false
        }

        // check if slide type is null
        if (inlineMetadata.slide === null) {
            console.error(`Missing slide type in ${key}"`)
            success = false
        }

        if (['title-content-image', 'title-image'].includes(inlineMetadata.slide) && inlineMetadata.images === null) {
            console.error(`Image should be provided for "${inlineMetadata.slide}" in "${key}"`)
            success = false
        }
    })
}

Object.keys(markdownFiles).forEach((key) => {
    lintMeta(key)
})

if (success) {
    console.info('All checks passed!')
} else {
    console.info('Markdown lint failed!')
    process.exit(1)
}
