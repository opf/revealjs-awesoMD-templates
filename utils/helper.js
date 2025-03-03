/* global Reveal */

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
        const paddingTop = parseFloat(style.paddingTop)
        const paddingBottom = parseFloat(style.paddingBottom)
        return element.offsetHeight + marginTop + marginBottom + paddingTop + paddingBottom
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

        const wrapperElements = Array.from(content.children)

        wrapperElements.forEach((wrapperElement) => {
            if (wrapperElement.querySelector('.image-container .image-wrapper .image-credit p')) {
                return
            }
            wrapperElement.style.fontSize = `${fontSize}px`

            const style = getComputedStyle(wrapperElement)
            const marginTop = Math.floor(parseFloat(style.marginTop) * scaleFactor)
            const marginBottom = Math.floor(parseFloat(style.marginBottom) * scaleFactor)
            wrapperElement.style.marginTop = `${marginTop}px`
            wrapperElement.style.marginBottom = `${marginBottom}px`
        })

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

        const canvases = content.querySelectorAll('.image-container .image-wrapper canvas')
        canvases.forEach((canvas) => {
            const currentHeight = parseFloat(canvas.style.height) || canvas.offsetHeight
            canvas.style.height = `${currentHeight * scaleFactor}px`
        })

        const charts = content.querySelectorAll('.mermaid svg')
        charts.forEach((chartElement) => {
            const bbox = chartElement.getBBox()
            chartElement.style.height = `${scaleFactor * bbox.height}px`
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
    const imageMetadataRegex = /::(\w+)(?:\s*(.*?))?:\s*(.*)/m
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
    const imageMetadataRegex = /::(\w+):\s*([^)]+)/m
    if (imageMetadataRegex.test(altText)) {
        const imageMetadata = altText.match(imageMetadataRegex)
        return imageMetadata[2].trim()
    }
}

// eslint-disable-next-line
function annotateImage(imageAnnotationData) {
    const currentSlide = Reveal.getCurrentSlide()
    const imageWrappers = currentSlide.querySelectorAll('.image-wrapper')

    for (const imageWrapper of imageWrappers) {
        // Prevent from re-annotation
        if (imageWrapper.dataset.annotated) {
            continue
        }
        const image = imageWrapper.querySelector('img')
        if (!image) {
            continue
        }

        // Make sure that the images are loaded
        if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
            annotate(imageAnnotationData, currentSlide, imageWrapper, image)
        } else {
            image.onload = () => {
                if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                    annotate(imageAnnotationData, currentSlide, imageWrapper, image)
                } else {
                    imageWrapper.textContent = 'Failed to annotate image.'
                }
            }
        }
    }
}

function annotate(imageAnnotationData, currentSlide, imageWrapper, image) {
    const padding = 100
    const dotRadius = 5
    const textPadding = 10
    const boxMargin = 20
    const fontSize = 22
    const fontFamily = 'sans-serif'
    const maxBoxWidth = 250
    const lineHeight = fontSize * 1.2
    const minPadding = 10

    const imgWidth = image.naturalWidth
    const imgHeight = image.naturalHeight

    const currentSlideIndex = Reveal.getIndices(currentSlide)
    const annotations = imageAnnotationData[currentSlideIndex.h]?.[image.src.split('/').pop()]
    const hasAnnotations = annotations && annotations.length > 0

    // Don't create canvas when there are no annotation for the image
    if (!hasAnnotations) {
        return
    }
    const effectivePadding = hasAnnotations ? padding : 0

    const canvas = document.createElement('canvas')
    canvas.width = imgWidth + effectivePadding * 2
    canvas.height = imgHeight + effectivePadding * 2

    image.remove()
    imageWrapper.appendChild(canvas)
    const imageCredit = imageWrapper.querySelector('.image-credit')
    if (imageCredit) imageWrapper.appendChild(imageCredit)
    imageWrapper.dataset.annotated = 'true'

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, effectivePadding, effectivePadding, imgWidth, imgHeight)

    const boxPositions = []
    ctx.font = `${fontSize}px ${fontFamily}`

    function getTextDimensions(text) {
        const words = text.split(' ')
        const lines = []
        let currentLine = words[0]

        for (let i = 1; i < words.length; i++) {
            const word = words[i]
            const testLine = `${currentLine} ${word}`
            const width = ctx.measureText(testLine).width
            if (width > maxBoxWidth - textPadding * 2) {
                lines.push(currentLine)
                currentLine = word
            } else {
                currentLine = testLine
            }
        }
        lines.push(currentLine)
        const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '')
        const textWidth = Math.min(ctx.measureText(longestLine).width, maxBoxWidth - textPadding * 2)
        const boxWidth = textWidth + textPadding * 2
        const boxHeight = lines.length * lineHeight + textPadding * 2
        return { lines, boxWidth, boxHeight }
    }

    // checks if the annotation boxes overlaps
    function boxesOverlap(box1, box2) {
        return (
            box1.x < box2.x + box2.width &&
            box1.x + box1.width > box2.x &&
            box1.y < box2.y + box2.height &&
            box1.y + box1.height > box2.y
        )
    }

    const imgLeft = effectivePadding
    const imgRight = effectivePadding + imgWidth
    const imgTop = effectivePadding
    const imgBottom = effectivePadding + imgHeight

    function isOutsideImage(x, y, width, height) {
        return x + width <= imgLeft || x >= imgRight || y + height <= imgTop || y >= imgBottom
    }

    // Sort annotations by box size for better positioning of the boxes
    annotations.sort((box1, box2) => {
        const box1Size = box1.text.length
        const box2Size = box2.text.length
        return box1Size - box2Size
    })

    for (const { x, y, text } of annotations) {
        const dotX = Number(x) + effectivePadding
        const dotY = Number(y) + effectivePadding

        // Draw red dot
        ctx.fillStyle = 'red'
        ctx.beginPath()
        ctx.arc(dotX, dotY, dotRadius, 0, 2 * Math.PI)
        ctx.fill()

        const { lines, boxWidth, boxHeight } = getTextDimensions(text)

        // Calculate available space in each region
        const spaceTop = Math.max(0, imgTop - minPadding - boxHeight - boxMargin)
        const spaceBottom = Math.max(0, canvas.height - imgBottom - minPadding - boxHeight - boxMargin)
        const spaceLeft = Math.max(0, imgLeft - minPadding - boxWidth - boxMargin)
        const spaceRight = Math.max(0, canvas.width - imgRight - minPadding - boxWidth - boxMargin)

        const possiblePositions = [
            // Top positions
            {
                x: dotX - boxWidth / 2,
                y: imgTop - boxHeight - boxMargin,
                region: 'top',
                score:
                    spaceTop * 2 +
                    (boxHeight <= spaceTop ? 100 : 0) +
                    (boxWidth <= canvas.width - minPadding * 2 ? 50 : 0),
            },
            {
                x: minPadding,
                y: imgTop - boxHeight - boxMargin,
                region: 'top-left',
                score: spaceTop * 1.5 + (boxHeight <= spaceTop ? 80 : 0),
            },
            {
                x: canvas.width - minPadding - boxWidth,
                y: imgTop - boxHeight - boxMargin,
                region: 'top-right',
                score: spaceTop * 1.5 + (boxHeight <= spaceTop ? 80 : 0),
            },

            // Bottom positions
            {
                x: dotX - boxWidth / 2,
                y: imgBottom + boxMargin,
                region: 'bottom',
                score:
                    spaceBottom * 2 +
                    (boxHeight <= spaceBottom ? 100 : 0) +
                    (boxWidth <= canvas.width - minPadding * 2 ? 50 : 0),
            },
            {
                x: minPadding,
                y: imgBottom + boxMargin,
                region: 'bottom-left',
                score: spaceBottom * 1.5 + (boxHeight <= spaceBottom ? 80 : 0),
            },
            {
                x: canvas.width - minPadding - boxWidth,
                y: imgBottom + boxMargin,
                region: 'bottom-right',
                score: spaceBottom * 1.5 + (boxHeight <= spaceBottom ? 80 : 0),
            },

            // Side positions
            {
                x: imgRight + boxMargin,
                y: dotY - boxHeight / 2,
                region: 'right',
                score: spaceRight * 1.2 + (boxWidth <= spaceRight ? 70 : -100),
            },
            {
                x: imgLeft - boxWidth - boxMargin,
                y: dotY - boxHeight / 2,
                region: 'left',
                score: spaceLeft * 1.2 + (boxWidth <= spaceLeft ? 70 : -100),
            },
        ]

        const validPositions = possiblePositions
            .map((pos) => ({
                ...pos,
                x: Math.max(minPadding, Math.min(pos.x, canvas.width - minPadding - boxWidth)),
                y: Math.max(minPadding, Math.min(pos.y, canvas.height - minPadding - boxHeight)),
            }))
            .filter(
                (pos) =>
                    isOutsideImage(pos.x, pos.y, boxWidth, boxHeight) &&
                    pos.x >= minPadding &&
                    pos.y >= minPadding &&
                    pos.x + boxWidth <= canvas.width - minPadding &&
                    pos.y + boxHeight <= canvas.height - minPadding
            )
            .sort((a, b) => b.score - a.score)

        let boxPosition = null

        for (const pos of validPositions) {
            const candidateBox = {
                x: pos.x,
                y: pos.y,
                width: boxWidth,
                height: boxHeight,
            }

            const overlaps = boxPositions.some((b) => boxesOverlap(b, candidateBox))
            if (!overlaps) {
                boxPosition = pos
                break
            }
        }

        boxPosition.x = Math.max(minPadding, Math.min(boxPosition.x, canvas.width - minPadding - boxWidth))
        boxPosition.y = Math.max(minPadding, Math.min(boxPosition.y, canvas.height - minPadding - boxHeight))

        boxPositions.push({
            x: boxPosition.x,
            y: boxPosition.y,
            width: boxWidth,
            height: boxHeight,
        })

        // Draw connecting line with possible angles
        ctx.strokeStyle = 'red'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(dotX, dotY)

        if (boxPosition.region.includes('top')) {
            // Connect to bottom of top-positioned box
            const targetY = boxPosition.y + boxHeight
            const targetX = Math.max(boxPosition.x, Math.min(boxPosition.x + boxWidth, dotX))
            ctx.lineTo(targetX, targetY)
        } else if (boxPosition.region.includes('bottom')) {
            // Connect to top of bottom-positioned box
            const targetY = boxPosition.y
            const targetX = Math.max(boxPosition.x, Math.min(boxPosition.x + boxWidth, dotX))
            ctx.lineTo(targetX, targetY)
        } else if (boxPosition.region === 'right') {
            // Connect to left of right-positioned box
            const targetX = boxPosition.x
            const targetY = Math.max(boxPosition.y, Math.min(boxPosition.y + boxHeight, dotY))
            ctx.lineTo(targetX, targetY)
        } else if (boxPosition.region === 'left') {
            // Connect to right of left-positioned box
            const targetX = boxPosition.x + boxWidth
            const targetY = Math.max(boxPosition.y, Math.min(boxPosition.y + boxHeight, dotY))
            ctx.lineTo(targetX, targetY)
        }

        ctx.stroke()

        // Draw annotation box
        ctx.fillStyle = 'white'
        ctx.fillRect(boxPosition.x, boxPosition.y, boxWidth, boxHeight)
        ctx.strokeStyle = 'red'
        ctx.strokeRect(boxPosition.x, boxPosition.y, boxWidth, boxHeight)

        // Draw wrapped text
        ctx.fillStyle = 'black'
        lines.forEach((line, i) => {
            ctx.fillText(line, boxPosition.x + textPadding, boxPosition.y + textPadding + i * lineHeight + fontSize)
        })
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
        credit.textContent = getImageMetadata(img.alt)
        creditWrapper.appendChild(credit)
        divWrapper.appendChild(creditWrapper)
        divContainer.appendChild(divWrapper)
        pTag.replaceWith(divContainer)
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
