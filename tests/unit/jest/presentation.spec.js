const puppeteer = require('puppeteer')
const pti = require('puppeteer-to-istanbul')
const { exec } = require('child_process')
const beautify = require('js-beautify').html
const testHelper = require('../testHelper')
const config = require('../testFiles/config')

const controller = new AbortController()
const { signal } = controller
const port = config.port
const screenWidth = config.screenWidth
const screenHeight = config.screenHeight
const pdfWidth = 1123
const pdfHeight = 794
const testUrl = config.testUrl
let browser
let page

const startTestServer = async (file) => {
    await exec(`pnpm start ${file}`, { signal }, (error) => {
        if (error.name !== 'AbortError') {
            console.error(error)
        }
    })

    const serverReady = await testHelper.isServerReady(testUrl)
    if (!serverReady) {
        throw new Error('Server is not ready')
    }
}
const setScreenSize = async (screenWidth, screenHeight) => {
    // Set screen size. And wait for the transition to finish
    // When changing the screen/viewport size, the transition takes some time to finish.
    // If we check snapshots too early, the test results might be flaky
    await page.setViewport({ width: screenWidth, height: screenHeight })
    await page.waitForFunction(testHelper.isViewportSize, {}, screenWidth, screenHeight)
}

beforeAll(async () => {
    await testHelper.copyAssets()
    await startTestServer('test.md')
}, 30000)

afterAll(async () => {
    await controller.abort()
    await testHelper.killPortIfInUse(port)
    await testHelper.deleteAssets()
}, 30000)

afterEach(async () => {
    const jsCoverage = await page.coverage.stopJSCoverage()
    pti.write([...jsCoverage], { includeHostname: true, storagePath: './.nyc_output' })
    await browser.close()
})

beforeEach(async () => {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
    page = await browser.newPage()
    await page.coverage.startJSCoverage({ resetOnNavigation: false })
    await page.goto(testUrl, { waitUntil: 'networkidle0' })
})

describe('test markdown presentation', () => {
    it('should render markdown presentation', async () => {
        await setScreenSize(screenWidth, screenHeight)
        expect(beautify(await page.content())).toMatchSnapshot()

        for (let i = 0; i < 30; i++) {
            const element = await page.waitForSelector('.navigate-right')
            await element.click()
            await testHelper.waitForTransitionEnd(page, '.progress')
            expect(beautify(await page.content())).toMatchSnapshot()
        }
    }, 60000)

    it('should use 16:9 dimension image for normal window size', async () => {
        await setScreenSize(screenWidth, screenHeight)
        const backgroundImage = await page.evaluate(() => {
            const imageSlide = document.querySelector('.backgrounds .image')
            const computedStyle = getComputedStyle(imageSlide)
            return computedStyle.backgroundImage
        })
        expect(backgroundImage).toBe('url("http://localhost:8080/markdown/test/test-16-9.png")')
    }, 60000)

    it('should use 4:3 dimension image when the window size changes to pdf size', async () => {
        await setScreenSize(pdfWidth, pdfHeight)
        const backgroundImage = await page.evaluate(() => {
            const imageSlide = document.querySelector('.backgrounds .image')
            const computedStyle = getComputedStyle(imageSlide)
            return computedStyle.backgroundImage
        })
        expect(backgroundImage).toBe('url("http://localhost:8080/markdown/test/test-4-3.png")')
    }, 60000)
})
