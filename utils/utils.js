const fs = require('fs')
const marked = require('marked')
const plugin = require('revealjs-awesomd/plugin/awesoMD/awesoMD')()
const yaml = require('js-yaml')
const config = require('../config')

const options = {}
const opCoverRegex = /^#\s.*::slide:op-cover$/gm

function readMarkdownFile(file) {
    if (!fs.existsSync(file)) {
        console.error(`Couldn't find the file ${file} in markdown directory.`)
        process.exit(1)
    }
    return fs.readFileSync(file, {
        encoding: 'utf-8',
        flag: 'r',
    })
}

function extractFrontmatter(rawMarkdownContent) {
    return plugin.parseFrontMatter(rawMarkdownContent, options)
}

function getHeadingData(rawMarkdown) {
    const slideSeparator = config.slideSeparator
    const updatedMarkdown = plugin.addSlideSeparator(rawMarkdown, { slideSeparator: slideSeparator })
    const [markdown, frontMatter] = extractFrontmatter(updatedMarkdown)
    const headings = []
    let mainHeadingCounter = 1
    let subHeadingCounter = 1
    let initialLevel
    let initialIndex
    let currentIndex
    let index
    let slideNumberIncrement

    const separatorRegex = new RegExp(`^${slideSeparator}\n`, 'gm')
    const slides = markdown.split(separatorRegex)
    slides.forEach((slide, slideNumber) => {
        const [content, options] = plugin.separateInlineMetadataAndMarkdown(slide, { ...frontMatter })

        if (['cover', 'op-cover'].includes(options.metadata.slide)) {
            slideNumberIncrement = 1
            return
        } else if (options.metadata.slide === 'toc') {
            slideNumberIncrement = 2
            return
        } else {
            slideNumberIncrement = 0
        }

        const slideContents = marked.lexer(content).filter((a) => a.type === 'heading' && a[0] !== null)
        options.metadata['level'] = slideContents[0].depth

        const pushHeadingData = (index, headingText, toc = options.metadata.toc) => {
            headings.push({
                slideNumber: slideNumber + slideNumberIncrement,
                headingLevel: options.metadata.level,
                toc,
                slide: options.metadata.slide || frontMatter.slide,
                background: options.metadata.background,
                pdfbackground: options.metadata.pdfbackground,
                index,
                headingText,
            })
        }
        if (options.metadata.slide === 'image') {
            slideContents.forEach((slideContent) => pushHeadingData('', slideContent.text, 'false'))
            return
        }

        if (options.metadata.level === 1) {
            initialLevel = options.metadata.level
            initialIndex = `${mainHeadingCounter}`
            mainHeadingCounter += 1
            index = `${initialIndex}. `
        } else if (!options.metadata.toc) {
            const level = options.metadata.level
            if (level > initialLevel) {
                subHeadingCounter = 1
                currentIndex = `${initialIndex}.${subHeadingCounter}`
                subHeadingCounter += 1
            } else if (level < initialLevel) {
                const splitIndex = initialIndex.split('.').slice(0, level)
                splitIndex[splitIndex.length - 1] = (Number(splitIndex[splitIndex.length - 1]) + 1).toString()
                currentIndex = splitIndex.join('.')
            } else if ((level > 1 || level === '') && (initialLevel === undefined || initialIndex === '')) {
                currentIndex = ''
            } else {
                const splitIndex = currentIndex.split('.')
                splitIndex[splitIndex.length - 1] = (Number(splitIndex[splitIndex.length - 1]) + 1).toString()
                currentIndex = splitIndex.join('.')
                subHeadingCounter += 1
            }
            initialLevel = level
            initialIndex = currentIndex
            index = currentIndex === '' ? currentIndex : `${currentIndex}. `
        } else {
            index = `${currentIndex}. `
        }
        slideContents.forEach((slideContent) => pushHeadingData(index, slideContent.text))
    })
    return headings
}

function generateTOC(rawMarkdown, configFilePath) {
    const config = getYAMLConfigs(configFilePath)
    const [markdownContent, options] = extractFrontmatter(rawMarkdown)
    const title = `${config.default.toc_heading[options.metadata.language]}\n`
    let content = ''
    const headings = getHeadingData(markdownContent)
    headings.forEach((headingData) => {
        if (!headingData.toc) {
            const tab = '\t'.repeat(headingData.headingLevel - 1)
            content += `${tab}1. ${headingData.headingText}\n`
        }
    })
    return [title, content]
}

function insertTocSlide(rawMarkdown) {
    let tocString = ''
    let regex = /---\s*(?:[a-zA-Z]+:\s*.*\s*)+---/gm
    const tocCoverRegex = /^#\s.*::slide:toc$/gm

    if (!tocCoverRegex.test(rawMarkdown)) {
        tocString += '# ::slide:toc\n\n'
        if (opCoverRegex.test(rawMarkdown)) {
            regex = /#{1,6}\s.+::slide:op-cover.*[^#]*/gm
        }
    }

    return rawMarkdown.replace(regex, (match) => {
        return match + tocString
    })
}

function insertCoverSlide(rawMarkdown) {
    let coverString = ''
    const regex = /---\s*(?:[a-zA-Z]+:\s*.*\s*)+---/gm

    const description = /description:\s+(.*)$/gm.exec(rawMarkdown)?.[1] ?? ''
    const footer = /footer:\s+(.*)$/gm.exec(rawMarkdown)?.[1] ?? ''

    if (!opCoverRegex.test(rawMarkdown)) {
        coverString += `\n# ${footer} ::slide:op-cover\n${description}`
    }

    return rawMarkdown.replace(regex, (match) => {
        return match + coverString
    })
}

function insertSlideTypeAccordingToHeadingLevel(rawMarkdown, levelToSlides, defaultSlide) {
    const headingRegexThatDoesNotContainSlideMetadata = /^(#{1,6})\s(?!.*::slide: *\w+.*).+$/gm
    return rawMarkdown.replace(headingRegexThatDoesNotContainSlideMetadata, (match, hashSymbols) => {
        if (levelToSlides['h' + hashSymbols.length] !== undefined) {
            return match + ` ::slide:${levelToSlides['h' + hashSymbols.length]}`
        }
        {
            return match + ` ::slide:${defaultSlide}`
        }
    })
}

function getYAMLConfigs(configFilePath) {
    if (fs.existsSync(configFilePath)) {
        try {
            return yaml.load(
                fs.readFileSync(configFilePath, {
                    encoding: 'utf-8',
                    flag: 'r',
                })
            )
        } catch (e) {
            console.log(e)
        }
    } else {
        console.info('Config file not found.')
        return
    }
}

function preProcessMarkdown(file, configFile) {
    let rawMarkdown = this.readMarkdownFile(file)
    const ymlConfigs = this.getYAMLConfigs(configFile)
    if (ymlConfigs !== undefined && ymlConfigs !== null) {
        if (
            ymlConfigs.default.level_to_slide !== undefined &&
            ymlConfigs.default.level_to_slide !== null &&
            ymlConfigs.default.default_slide !== undefined &&
            ymlConfigs.default.default_slide !== null
        ) {
            rawMarkdown = insertSlideTypeAccordingToHeadingLevel(
                rawMarkdown,
                ymlConfigs.default.level_to_slide,
                ymlConfigs.default.default_slide
            )
        }
        const slides = ymlConfigs.default.slides
        const validSlides = ['toc', 'op-cover']
        if (slides !== undefined && slides !== null && slides.length > 0) {
            if (!slides.every((slide) => validSlides.includes(slide))) {
                throw new Error('Slides must contain both "toc" and "op-cover" or either one of them')
            }
            if (slides.includes('op-cover')) {
                rawMarkdown = insertCoverSlide(rawMarkdown)
            }
            if (slides.includes('toc')) {
                rawMarkdown = insertTocSlide(rawMarkdown)
            }
        }
    }
    return rawMarkdown
}

module.exports = {
    readMarkdownFile,
    extractFrontmatter,
    generateTOC,
    getHeadingData,
    insertCoverSlide,
    insertTocSlide,
    insertSlideTypeAccordingToHeadingLevel,
    getYAMLConfigs,
    preProcessMarkdown,
}
