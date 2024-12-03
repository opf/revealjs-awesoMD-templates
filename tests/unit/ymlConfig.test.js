const utils = require('../../utils/utils.js')

const inputMarkdown = `---
description: This is a template for a presentation
footer: OpenProject training
presenter: Robin Wagner
slide: title-content
slidenumber: no
---

# Overview traditional project managements`

const expectedMarkdown = `---
description: This is a template for a presentation
footer: OpenProject training
presenter: Robin Wagner
slide: title-content
slidenumber: no
---
# OpenProject training ::slide:op-cover
This is a template for a presentation

# ::slide:toc

# Overview traditional project managements ::slide:section`

describe('test markdown Presentation', () => {
    it('toc and cover should be added to markdown', () => {
        let markdown = utils.insertCoverSlide(inputMarkdown)
        markdown = utils.insertTocSlide(markdown)
        markdown = utils.insertSlideTypeAccordingToHeadingLevel(markdown, { h1: 'section' })
        expect(markdown).toBe(expectedMarkdown)
    })
})

describe('test config', () => {
    it.each([
        null,
        undefined,
        { default: {} },
        { default: { slides: undefined } },
        { default: { slides: null } },
        { default: { slides: [] } },
        { default: { slides: '' } },
        { default: { level_to_slide: null } },
        { default: { level_to_slide: undefined } },
        { default: { level_to_slide: '' } },
    ])('invalid yml config should not throw an error', (ymlConfigs) => {
        jest.spyOn(utils, 'readMarkdownFile').mockReturnValue(inputMarkdown)
        jest.spyOn(utils, 'getYAMLConfigs').mockReturnValue(ymlConfigs)
        const expectedMarkdown = utils.preProcessMarkdown()
        expect(inputMarkdown).toBe(expectedMarkdown)
    })
})

describe('test slide typo', () => {
    it.each([
        { default: { slides: ['toc', 'opcover'] } },
        { default: { slides: ['tocc'] } },
        { default: { slides: ['op-cove'] } },
        { default: { slides: ['op-cover', 'toc', 'extra'] } },
    ])('invalid yml slides should throw error', (ymlConfigs) => {
        jest.spyOn(utils, 'getYAMLConfigs').mockReturnValue(ymlConfigs)
        expect(() => utils.preProcessMarkdown()).toThrow(
            'Slides must contain both "toc" and "op-cover" or either one of them'
        )
    })
})
