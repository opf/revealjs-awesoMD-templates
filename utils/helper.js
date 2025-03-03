/* global Reveal */

const imageMetadataRegex = /::(\w[\w-]*):\s?([^:\]\)]+(?:[:|,][^:\]\)]+)*)/gm
const customSlideNumber = document.getElementsByClassName('custom-slide-number')

// eslint-disable-next-line
function addCustomSlideNumber(event) {
    const allSlides = Reveal.getSlides()
    for (const [slideNumber, slide] of Array.from(allSlides).entries()) {
        const customSlideNumber = slide.querySelector('.custom-slide-number')
        if (!customSlideNumber) {
            continue
        }
        customSlideNumber.textContent = slideNumber + 1
    }
}

// eslint-disable-next-line
function adjustFontSize() {
    const currentSlide = Reveal.getCurrentSlide()

    function getTotalHeightOfChildren(container) {
        let totalHeight = 0
        for (const child of container.children) {
            if (currentSlide.classList.contains('title-content-image')) {
                if (child.className !== 'image-container') {
                    totalHeight += getHeightWithMargin(child)
                }
            } else {
                totalHeight += getHeightWithMargin(child)
            }
        }
        return totalHeight
    }

    function getHeightWithMargin(element) {
        const style = getComputedStyle(element)
        const marginTop = parseFloat(style.marginTop)
        const marginBottom = parseFloat(style.marginBottom)
        return element.offsetHeight + marginTop + marginBottom
    }

    const contentWrapper = currentSlide.querySelector('.content-wrapper')
    const contentWrapperHeight = contentWrapper.offsetHeight

    const content = currentSlide.querySelector('.content')
    let totalHeight = getTotalHeightOfChildren(content)

    // set minimum font size from where the image starts to get reduced as well
    // this is to prevent the font size to get too small and becomes hard to read
    const fontSizeToStartReducingImage = 14
    let fontSize = parseFloat(getComputedStyle(content).fontSize)

    while (totalHeight > contentWrapperHeight) {
        const scaleFactor = contentWrapperHeight / totalHeight

        fontSize = Math.floor(scaleFactor * fontSize)
        Array.from(content.children)
            .filter(
                (wrapperElement) => !wrapperElement.querySelector('.image-container .image-wrapper .image-credit p')
            )
            .forEach((wrapperElement) => {
                wrapperElement.style.fontSize = `${fontSize}px`

                // reduce the margin values
                const style = getComputedStyle(wrapperElement)
                const marginTop = Math.floor(parseFloat(style.marginTop) * scaleFactor)
                const marginBottom = Math.floor(parseFloat(style.marginBottom) * scaleFactor)
                wrapperElement.style.marginTop = `${marginTop}px`
                wrapperElement.style.marginBottom = `${marginBottom}px`

                // reduce image size if font size gets smaller than minimum font size
                const images = content.querySelectorAll('.image-container .image-wrapper img')
                if (fontSize <= fontSizeToStartReducingImage && images.length > 0) {
                    images.forEach((image) => {
                        const currentWidth = image.offsetWidth
                        const currentHeight = image.offsetHeight
                        image.style.width = `${Math.floor(currentWidth * scaleFactor)}px`
                        image.style.height = `${Math.floor(currentHeight * scaleFactor)}px`
                    })
                }

                // reduce chart size if font size gets smaller than minimum font size
                const charts = wrapperElement.querySelectorAll('.mermaid')
                if (fontSize <= fontSizeToStartReducingImage && charts.length > 0) {
                    charts.forEach((chart) => {
                        const chartElement = chart.querySelector('svg')
                        const bbox = chartElement.getBBox()
                        const chartHeight = bbox.height
                        chartElement.style.height = `${scaleFactor * chartHeight}px`
                    })
                }
            })

        totalHeight = getTotalHeightOfChildren(content)
    }
}

// eslint-disable-next-line
function fitContent() {
    const images = document.querySelectorAll('img')
    let imagesLoaded = 0

    images.forEach((img) => {
        if (img.complete) {
            imagesLoaded++
        } else {
            img.addEventListener('load', () => {
                imagesLoaded++
                if (imagesLoaded === images.length) {
                    adjustFontSize()
                }
            })
        }
    })

    if (images.length === 0) {
        adjustFontSize()
    }
}

// eslint-disable-next-line
function setIndex(headingData) {
    const currentSlideIndex = Reveal.getIndices()
    const currentSlide = Reveal.getCurrentSlide()
    headingData
        .filter((heading) => heading.slideNumber === currentSlideIndex.h)
        .forEach((heading) => {
            if (heading.headingLevel === 1 && heading.slide === 'section') {
                const content = currentSlide.querySelector('.content')
                if (!content.querySelector('.section-index')) {
                    const sectionIndex = document.createElement('h1')
                    sectionIndex.classList.add('section-index')
                    sectionIndex.textContent = heading.index
                    content.insertBefore(sectionIndex, content.firstChild)
                }
            } else if (['cover', 'image'].includes(heading.slide)) {
                return
            } else {
                const headingElement = currentSlide.querySelector('h1')
                headingElement.textContent = `${heading.index}${heading.headingText}`
            }
        })
}

// eslint-disable-next-line
function updateImageUrl(imagePath) {
    const images = document.querySelectorAll('.image-wrapper img')
    images.forEach((img) => {
        const url = new URL(img.src)

        if (['http:', 'https:'].includes(url.protocol)) {
            img.src = imagePath + '/' + url.pathname.replace(/^\/+/, '')
        } else {
            const match = url.pathname.match(/static\/(.+)/)
            if (match && match[1]) {
                img.src = match[1]
            }
        }

        img.alt = img.alt.replace(imageMetadataRegex, '').trim()
    })
}

function getImageMetadata(altText) {
    const imageMetadata = {}
    let match
    while ((match = imageMetadataRegex.exec(altText)) !== null) {
        imageMetadata[match[1]] = match[2].trim()
    }
    // console.log(imageMetadata)
    return imageMetadata
}

function getImageAnnotationData(imageData) {
    if (!imageData.comment) {
        return []
    }
    const imageDataArray = imageData.comment.split(',').map((data) => data.trim())
    return imageDataArray.map((item) => {
        const [x, y, text] = item.split('|')
        return { x, y, text }
    })
}

function addAnnotation(imageData, img, imageWrapper) {
    // const currentSlide = Reveal.getCurrentSlide()
    // const img = currentSlide.querySelector('img')
    // if (!img) {
    //     return
    // }
    // const imageWrapper = currentSlide.querySelector('.image-wrapper')
    //
    // // get coordinates and text for annotation
    // const imageData = getImageMetadata(img.alt)

    const annotationDataArray = getImageAnnotationData(imageData)
    console.log(annotationDataArray)
    for (const annotationData of annotationDataArray) {
        const x = annotationData.x
        const y = annotationData.y
        const annotateText = annotationData.text
        if (!x && !y && !annotateText) {
            return
        }

        // create annotation box
        const annotationBox = document.createElement('div')
        annotationBox.textContent = annotateText
        annotationBox.style.position = 'absolute'
        annotationBox.style.left = `${x}px`
        annotationBox.style.top = `${y}px`
        annotationBox.style.color = 'black'
        annotationBox.style.padding = '5px'
        annotationBox.style.border = '2px solid red'
        annotationBox.style.fontSize = '22px'

        // append the annotationBox as image overlay
        imageWrapper.insertBefore(annotationBox, img.nextSibling)
        imageWrapper.style.position = 'relative'
    }
}

// eslint-disable-next-line
function updateImageStructure() {
    const pTags = document.querySelectorAll('p > img')
    pTags.forEach((img) => {
        const pTag = img.parentNode
        const divContainer = document.createElement('div')
        divContainer.classList.add('image-container')
        const divWrapper = document.createElement('div')
        divWrapper.classList.add('image-wrapper')
        divWrapper.appendChild(img)
        const creditWrapper = document.createElement('div')
        creditWrapper.classList.add('image-credit')
        const credit = document.createElement('p')
        const imageMetadata = getImageMetadata(img.alt)
        credit.textContent = imageMetadata.credit
        creditWrapper.appendChild(credit)
        divWrapper.appendChild(creditWrapper)
        divContainer.appendChild(divWrapper)
        pTag.replaceWith(divContainer)

        // add annotation
        addAnnotation(imageMetadata, img, divWrapper)
    })
}

// eslint-disable-next-line
function showHideFooterAndSlideNumber(slideNumber, hideFooter) {
    if (slideNumber === 'no' && customSlideNumber.length > 0) {
        Array.from(customSlideNumber).forEach(function (currentSlideNumber) {
            currentSlideNumber.style.visibility = 'hidden'
        })
    }

    const footerElements = document.getElementsByTagName('footer')
    if (hideFooter) {
        Array.from(footerElements).forEach((footer) => {
            footer.style.visibility = 'hidden'
        })
    }
}

// eslint-disable-next-line
function addBackgroundOverlay() {
    const bgElement = document.querySelector('.backgrounds .op-cover .slide-background-content')
    if (!bgElement) {
        return
    }
    // we have used the addBackgroundOverlay function in two events 'ready' and 'resize'
    // because of this the image overlay might get duplicated
    // to avoid duplication of image overlay first check if image overlay exists
    // only create image overlay if it doesn't exist
    let imageOverlayContainer = bgElement.querySelector('.image-overlay-container')
    if (!imageOverlayContainer) {
        imageOverlayContainer = document.createElement('div')
        imageOverlayContainer.classList.add('image-overlay-container')
        bgElement.appendChild(imageOverlayContainer)

        const imageContainer = document.createElement('div')
        imageContainer.classList.add('image-container')
        imageOverlayContainer.appendChild(imageContainer)

        const img = document.createElement('img')
        imageContainer.appendChild(img)

        img.src = 'templates/assets/OpenProject-Screen.png'
        img.alt = 'cover page'

        img.style.borderRadius = '15px 0 0 15px'
    }
}

// eslint-disable-next-line
function setFullPageBackground(headingData, imagePath, pdfWidth, pdfHeight) {
    const slideBackgrounds = document.getElementsByClassName('slide-background')
    for (const [index, slideBackground] of Array.from(slideBackgrounds).entries()) {
        const slide = slideBackground.classList.value
            .replace('slide-background', '')
            .replace(/(past|present|future)/, '')
            .trim()
        if (slide === 'image') {
            // the slideNumber starts form 2 for presentation containing cover and toc, i.e. the first headingData refers to the third slide
            // the slideNumber starts from 1 for presentation containing cover but no toc, i.e. the first headingData refers to the second slide
            // so getting slide specific data from headingData by subtracting index value by first value of slideNumber
            const slideData = headingData[index - headingData[0].slideNumber]
            if (slideData.background && slideData.pdfbackground) {
                slideBackground.style.backgroundImage = `url('${imagePath}/${slideData.background}')`
                slideBackground.style.backgroundRepeat = 'no-repeat'
                slideBackground.style.backgroundSize = 'cover'
                slideBackground.style.backgroundPosition = 'center'

                // update the background only when the window size changes to pdf size
                // for normal browser window size, or if the browser is minimized do not update the image
                if (window.innerWidth === pdfWidth && window.innerHeight === pdfHeight) {
                    slideBackground.style.backgroundImage = `url('${imagePath}/${slideData.pdfbackground}')`
                    slideBackground.style.backgroundSize = '100% 100%'
                }
            } else {
                const slideBackgroundContent = slideBackground.querySelector('.slide-background-content')
                slideBackgroundContent.textContent = 'Please provide background image for this slide'
            }
        }
    }
}

// The static html has already rendered svg element and on opening the static html file it tries to re-render the mermaid js block.
// Here, mermaid tries to render the svg element and cannot interpret it as a diagram
// This results in giving the error: 'No diagram type detected matching given configuration for text:'
// Only removing this error didn't work and need to get and again add the svg element inside mermaid code block
// This issue only exists in the static html so this function will only trigger while opening the static html file
// eslint-disable-next-line
function reappendSvgElement() {
    const mermaidElements = document.querySelectorAll('.mermaid')
    for (const mermaidElement of mermaidElements) {
        const svgElement = mermaidElement.querySelector('svg')
        mermaidElement.innerHTML = ''
        mermaidElement.appendChild(svgElement)
    }
}
