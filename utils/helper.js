/* global Reveal */

const customSlideNumber = document.getElementsByClassName('custom-slide-number')

// eslint-disable-next-line
function addCustomSlideNumber(event) {
    Array.from(customSlideNumber).forEach(function (currentSlideNumber, index) {
        currentSlideNumber.innerText = index + 2
    })
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
            } else if (heading.slide === 'cover') {
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
                img.src = imagePath + '/' + match[1]
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
function updateImageStructure() {
    const pTags = document.querySelectorAll('p > img')
    pTags.forEach((img) => {
        const pTag = img.parentNode
        const divWrapper = document.createElement('div')
        divWrapper.classList.add('image-wrapper')
        divWrapper.appendChild(img)
        pTag.classList.add('image-container')
        pTag.appendChild(divWrapper)

        const creditWrapper = document.createElement('div')
        creditWrapper.classList.add('image-credit')
        const credit = document.createElement('p')
        credit.textContent = getImageMetadata(img.alt)
        creditWrapper.appendChild(credit)
        divWrapper.appendChild(creditWrapper)
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
