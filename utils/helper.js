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
function adjustFontSize(imageAnnotationData) {
    const currentSlide = Reveal.getCurrentSlide()
    const currentSlideIndex = Reveal.getIndices()

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
                        // save the original dimension of image
                        const [initialImageWidth, initialImageHeight] = getInitialImageDimension(image)
                        const currentWidth = image.offsetWidth
                        const currentHeight = image.offsetHeight
                        image.style.width = `${Math.floor(currentWidth * scaleFactor)}px`
                        image.style.height = `${Math.floor(currentHeight * scaleFactor)}px`

                        // get the reduced dimension of image, and
                        // add annotation at the relative position after the image size is reduced
                        const updatedImageWidth = image.offsetWidth
                        const updatedImageHeight = image.offsetHeight
                        const imageWrapper = image.parentElement
                        if (
                            imageWrapper.querySelectorAll('.annotation').length > 0 &&
                            (initialImageWidth !== updatedImageWidth || initialImageHeight !== updatedImageHeight)
                        ) {
                            const scaleX = updatedImageWidth / initialImageWidth
                            const scaleY = updatedImageHeight / initialImageHeight
                            const annotationBoxes = imageWrapper.querySelectorAll('.annotation')
                            const annotationDataArray =
                                imageAnnotationData[currentSlideIndex.h][image.src.split('/').pop()]
                            for (const annotationBox of annotationBoxes) {
                                const annotationCoordinates = annotationDataArray.find(
                                    (item) => item.text === annotationBox.textContent.trim()
                                )
                                const originalX = annotationCoordinates.x
                                const originalY = annotationCoordinates.y
                                const newX = originalX * scaleX
                                const newY = originalY * scaleY

                                const escapedClass = CSS.escape(`${originalX}-${originalY}`)
                                const dotElement = imageWrapper.querySelector(`.dot.${escapedClass}`)
                                const lineElement = imageWrapper.querySelector(`.line.${escapedClass}`)
                                const annotationBoxElement = imageWrapper.querySelector(`.annotation.${escapedClass}`)
                                if (dotElement) {
                                    dotElement.remove()
                                }
                                if (lineElement) {
                                    lineElement.remove()
                                }
                                if (annotationBoxElement) {
                                    annotationBoxElement.remove()
                                }

                                updateAnnotation(
                                    newX,
                                    newY,
                                    annotationBox.textContent,
                                    imageWrapper,
                                    image,
                                    originalX,
                                    originalY
                                )
                                const updatedAnnotationBox = imageWrapper.querySelector(`.annotation.${escapedClass}`)
                                updatedAnnotationBox.style.fontSize = `${fontSize}px`
                            }
                        }
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
function fitContent(imageAnnotationData) {
    const images = document.querySelectorAll('img')
    let imagesLoaded = 0

    images.forEach((img) => {
        if (img.complete) {
            imagesLoaded++
        } else {
            img.addEventListener('load', () => {
                imagesLoaded++
                if (imagesLoaded === images.length) {
                    adjustFontSize(imageAnnotationData)
                }
            })
        }
    })

    if (images.length === 0) {
        adjustFontSize(imageAnnotationData)
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
function addAnnotation(imageAnnotationData) {
    console.log(imageAnnotationData)
    const allSlides = Reveal.getSlides()
    for (const [slideNumber, slide] of allSlides.entries()) {
        const annotationData = imageAnnotationData[slideNumber]
        if (annotationData && Object.keys(annotationData).length > 0) {
            const imageContainers = slide.querySelectorAll('.image-container')
            for (const imageContainer of imageContainers) {
                const imageWrapper = imageContainer.querySelector('.image-wrapper')
                const image = imageWrapper.querySelector('img')
                const annotationBoxes = imageWrapper.querySelectorAll('.annotation')
                const annotationDataArray = imageAnnotationData[slideNumber][image.src.split('/').pop()]

                // prevent addition of same annotation box over the existing annotation box
                if (
                    !annotationDataArray ||
                    (annotationBoxes && annotationBoxes.length === annotationDataArray.length)
                ) {
                    return
                }

                for (const annotationData of annotationDataArray) {
                    const x = annotationData.x
                    const y = annotationData.y
                    const annotationText = annotationData.text
                    if (!x && !y && !annotationText) {
                        return
                    }
                    updateAnnotation(x, y, annotationText, imageWrapper, image)
                }
            }
        }
    }
}

function updateAnnotation(x, y, annotationText, imageWrapper, image, originalX = x, originalY = y) {
    const imageCredit = imageWrapper.querySelector('.image-credit')

    // add dot on the x and y coordinate
    const dot = document.createElement('div')
    dot.classList.add('dot', `${originalX}-${originalY}`)
    dot.style.position = 'absolute'
    dot.style.left = `${x}px`
    dot.style.top = `${y}px`
    dot.style.width = '8px'
    dot.style.height = '8px'
    dot.style.borderRadius = '50%'
    dot.style.backgroundColor = 'red'

    // annotation box
    const annotationBox = document.createElement('div')
    annotationBox.classList.add('annotation', `${originalX}-${originalY}`)
    annotationBox.textContent = annotationText
    annotationBox.style.color = 'black'
    annotationBox.style.padding = '5px'
    annotationBox.style.border = '2px solid red'
    annotationBox.style.fontSize = '22px'
    annotationBox.style.width = 'fit-content'

    // // position annotation box near the dot without overlapping and not above the dot.
    // let boxLeft, boxTop
    // let overlap = false
    // let isAboveDot = false
    // let attempts = 0
    // const existingBoxes = []
    //
    // do {
    //     const offsetX = Math.random() * 50
    //     const offsetY = Math.random() * 50
    //     const signX = Math.random() < 0.5 ? -1 : 1
    //     const signY = Math.random() < 0.5 ? -1 : 1
    //     boxLeft = Number(x) + offsetX * signX
    //     boxTop = Number(y) + offsetY * signY
    //     overlap = existingBoxes.some((existingBox) => {
    //         const existingLeft = existingBox.left
    //         const existingTop = existingBox.top
    //         const existingWidth = existingBox.width
    //         const existingHeight = existingBox.height
    //         const currentWidth = annotationBox.offsetWidth
    //         const currentHeight = annotationBox.offsetHeight
    //         return (
    //             boxLeft < existingLeft + existingWidth &&
    //             boxLeft + currentWidth > existingLeft &&
    //             boxTop < existingTop + existingHeight &&
    //             boxTop + currentHeight > existingTop
    //         )
    //     })
    //     // Ensure annotation box is not created above the dot.
    //     isAboveDot = boxTop < y
    //     attempts++ // try max attempts to prevent infinite loops
    // } while ((overlap || isAboveDot) && attempts < 100)
    //
    // annotationBox.style.left = `${boxLeft}px`
    // annotationBox.style.top = `${boxTop}px`
    //
    // // store position of created annotation boxes
    // existingBoxes.push({
    //     left: boxLeft,
    //     top: boxTop,
    //     width: annotationBox.offsetWidth,
    //     height: annotationBox.offsetHeight,
    // })
    //
    // // draw a line from dot to annotation box
    // const deltaX = boxLeft - Number(x)
    // const deltaY = boxTop - Number(y)
    // const lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    // const angle = Math.atan2(deltaY, deltaX)
    //
    // const line = document.createElement('div')
    // line.classList.add('line')
    // line.classList.add(`${originalX}-${originalY}`)
    // line.style.position = 'absolute'
    // line.style.width = `${lineLength}px`
    // line.style.height = '0px'
    // line.style.transformOrigin = '0 0'
    // line.style.transform = `rotate(${angle}rad)`
    // line.style.left = `${Number(x) + 2.5}px`
    // line.style.top = `${Number(y) + 2.5}px`
    // line.style.border = '1px solid red'
    // line.style.backgroundColor = 'red'

    if (imageCredit) {
        imageWrapper.insertBefore(dot, imageCredit)
        imageWrapper.insertBefore(annotationBox, imageCredit)
        // imageWrapper.insertBefore(line, imageCredit)
    } else {
        imageWrapper.insertBefore(dot, image.nextSibling)
        imageWrapper.insertBefore(annotationBox, image.nextSibling)
        // imageWrapper.insertBefore(line, image.nextSibling)
    }
    imageWrapper.style.position = 'relative'
}

function getInitialImageDimension(image) {
    if (!image.dataset.initialWidth || !image.dataset.initialHeight) {
        image.dataset.initialWidth = image.offsetWidth
        image.dataset.initialHeight = image.offsetHeight
    }
    return [parseFloat(image.dataset.initialWidth), parseFloat(image.dataset.initialHeight)]
}

function updateImageStructure(imageAnnotationData) {
    const allSlides = Reveal.getSlides()
    for (const [slideNumber, slide] of allSlides.entries()) {
        // console.log(slide)
        const images = slide.querySelectorAll('p > img')
        for (const image of images) {
            const pTag = image.parentNode
            pTag.remove()

            const imageContainer = document.createElement('div')
            imageContainer.classList.add('image-container')

            const imageWrapper = document.createElement('div')
            imageWrapper.classList.add('image-wrapper')

            const imageCredit = document.createElement('div')
            imageCredit.classList.add('image-credit')
            const credit = document.createElement('p')
            credit.classList.add('credit')
            credit.textContent = getImageMetadata(image.alt)
            imageCredit.appendChild(credit)

            const annotationDataArray = imageAnnotationData[slideNumber][image.src.split('/').pop()]
            for (const annotationData of annotationDataArray) {
                const x = annotationData.x
                const y = annotationData.y
                const text = annotationData.text
                if(!x && !y && !text) {
                    return
                }

                updateAnnotation(x, y, text, imageWrapper, image)
            }

            imageWrapper.appendChild(image)
            imageWrapper.appendChild(imageCredit)
            imageContainer.appendChild(imageWrapper)

            const content = slide.querySelector('.content')
            content.appendChild(imageContainer)
        }
    }
}

// eslint-disable-next-line
// function updateImageStructure() {
//     const pTags = document.querySelectorAll('p > img')
//     pTags.forEach((img) => {
//         const pTag = img.parentNode
//         const divContainer = document.createElement('div')
//         divContainer.classList.add('image-container')
//         const divWrapper = document.createElement('div')
//         divWrapper.classList.add('image-wrapper')
//         divWrapper.appendChild(img)
//         const creditWrapper = document.createElement('div')
//         creditWrapper.classList.add('image-credit')
//         const credit = document.createElement('p')
//         credit.textContent = getImageMetadata(img.alt)
//         creditWrapper.appendChild(credit)
//         divWrapper.appendChild(creditWrapper)
//         divContainer.appendChild(divWrapper)
//         pTag.replaceWith(divContainer)
//     })
// }

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
