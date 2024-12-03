const http = require('http')
const killPort = require('kill-port')
const fs = require('fs-extra')
const path = require('path')
const net = require('net')

const isServerReady = async (url) => {
    return new Promise((resolve) => {
        const check = () => {
            http.get(url, (res) => {
                if (res.statusCode === 200) {
                    resolve(true)
                } else {
                    setTimeout(check, 100)
                }
            }).on('error', () => {
                setTimeout(check, 100)
            })
        }
        check()
    })
}

const copyAssets = async () => {
    const sourceDir = '../..'
    const targetDir = '../unit/testFiles'
    const itemsToCopy = ['dist', 'templates', 'utils', 'config-reveal.js']
    try {
        for (const item of itemsToCopy) {
            const sourcePath = path.join(sourceDir, item)
            const targetPath = path.join(targetDir, item)
            await fs.copy(sourcePath, targetPath)
        }
    } catch (error) {
        console.error(error)
    }
}

const deleteAssets = async () => {
    const targetDir = '../unit/testFiles'
    const itemsToDelete = ['dist', 'templates', 'utils', 'config-reveal.js']
    try {
        for (const item of itemsToDelete) {
            const targetPath = path.join(targetDir, item)
            await fs.remove(targetPath)
        }
    } catch (error) {
        console.error(error)
    }
}

const killPortIfInUse = async (port) => {
    const inUse = new Promise((resolve) => {
        const server = net.createServer()
        server.once('error', (err) => {
            resolve(err.code === 'EADDRINUSE')
        })
        server.once('listening', () => {
            server.close(() => resolve(false))
        })
        server.listen(port)
    })
    if (inUse) {
        killPort(port)
    }
}

const waitForTransitionEnd = async (page, element) => {
    await page.evaluate((element) => {
        return new Promise((resolve) => {
            const transition = document.querySelector(element)
            const onEnd = function () {
                transition.removeEventListener('transitionend', onEnd)
                resolve()
            }
            transition.addEventListener('transitionend', onEnd)
        })
    }, element)
}

/**
 * Check if screen/viewport size is as expected
 * @param width
 * @param height
 * @returns {boolean}
 */
const isViewportSize = (width, height) => {
    const body = document.querySelector('body')
    const style = getComputedStyle(body)
    return (
        style.getPropertyValue('--viewport-width') === width + 'px' &&
        style.getPropertyValue('--viewport-height') === height + 'px'
    )
}

module.exports = {
    isServerReady,
    copyAssets,
    deleteAssets,
    killPortIfInUse,
    waitForTransitionEnd,
    isViewportSize,
}
