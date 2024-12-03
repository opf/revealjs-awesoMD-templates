const { exec } = require('child_process')
const puppeteer = require('puppeteer')
const fs = require('fs-extra')
const prettier = require('prettier')
const { JSDOM } = require('jsdom')

const url = process.env.PRESENTATION_URL || 'http://localhost:8000'
const outputUrl = process.env.OUTPUT_URI || 'exports'

function getExportFileName() {
    const storedFilename = JSON.parse(fs.readFileSync('filenameStore.json', 'utf8'))
    return storedFilename.filename.split('/').pop().split('.')[0]
}

async function exportAsPDF(url, outputUrl, arg) {
    const fileName = await getExportFileName()
    const outputUri = `${outputUrl}/${fileName}/${fileName}.pdf`

    let decktapeCommand
    if (arg === 'pdf') {
        decktapeCommand = `decktape reveal -s 1123x794 --page-load-timeout 30000 --chrome-arg=--no-sandbox ${url} ${outputUri}`
    } else {
        decktapeCommand = `docker run --rm -t --net=host -v \`pwd\`:/slides astefanutti/decktape ${url} ${outputUri}`
    }
    exec(decktapeCommand, (err, stdout, stderr) => {
        if (err) {
            console.error(`${stderr}`)
            console.error(`${stdout.match(/Error: (.*)/g)}`)
            console.error('❌ PDF export failed.')
        } else {
            console.info(`${stdout}`)
            console.info('✅ PDF export completed.')
        }
    })
}

async function exportAsHTML(url, outputUrl) {
    const fileName = await getExportFileName()
    const outputUri = `${outputUrl}/${fileName}/static`
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
    const page = await browser.newPage()
    await page.goto(url)

    const htmlContent = await page.content()
    const dom = new JSDOM(htmlContent)
    const document = dom.window.document
    document.querySelectorAll('.backgrounds').forEach((element) => {
        element.remove()
    })
    const updatedHtmlContent = dom.serialize()
    const formattedHtmlContent = await prettier.format(updatedHtmlContent, { parser: 'html', bracketSameLine: true })

    try {
        fs.mkdirSync(`${outputUri}`, { recursive: true })
        fs.writeFileSync(`${outputUri}/index.html`, formattedHtmlContent)
        await fs.copy('config-reveal.js', `./${outputUri}/config-reveal.js`, { overwrite: false })
        await fs.copy('./dist', `./${outputUri}/dist`, { overwrite: false })
        await fs.copy('./utils/helper.js', `./${outputUri}/utils/helper.js`, { overwrite: false })

        const sourceDir = './markdown/' + fileName
        const destinationDir = `${outputUri}/markdown/`
        await fs.copy(`${sourceDir}/`, `./${destinationDir}/${fileName}`, { overwrite: false })
        await fs.copy('./markdown/assets', `./${destinationDir}/assets`, { overwrite: false })

        console.info('✅ Static HTML export completed.')
        exec(
            `cd ${outputUrl}/${fileName} && zip -r ${fileName}.zip static && cd ../../`,
            {
                encoding: 'utf-8',
            },
            (err, stdout, stderr) => {
                if (err) {
                    console.error(`${stderr}`)
                    console.error(`${stdout.match(/Error: (.*)/g)}`)
                    console.error('❌ zip export failed.')
                } else {
                    console.info(`${stdout}`)
                    console.info('✅ zip export completed.')
                }
            }
        )
    } catch (error) {
        console.error('Error:', error)
        console.error('❌ Static HTML export failed.')
    }
    await browser.close()
}

if (require.main === module) {
    const args = process.argv.slice(2)

    if (['pdf', 'pdf-docker'].includes(args[0])) {
        exportAsPDF(url, outputUrl, args[0])
    } else if (args[0] === 'html') {
        exportAsHTML(url, outputUrl)
    } else {
        console.error('❌ Invalid argument. Please use either "pdf", "pdf-docker" or "html".')
    }
}
