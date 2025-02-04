const yargs = require('yargs')
const gulp = require('gulp')
const connect = require('gulp-connect')
const utils = require('./testFiles/utils/utils')
const mustache = require('gulp-mustache')
const rename = require('gulp-rename')
const env = require('dotenv').config()
const config = require('./testFiles/config')

const ROOT = yargs.argv.root || config.root
const PORT = yargs.argv.port || config.port
const HOST = yargs.argv.host || config.host

const FILE = yargs.options({
    file: {
        type: 'string',
    },
}).argv.file
const presentationsRoot = env.parsed.PRESENTATIONS_ROOT || 'markdown'

function renderIndexHTML(folderName, rawMarkdown) {
    const fmt = utils.extractFrontmatter(rawMarkdown)
    const headingData = utils.getHeadingData(rawMarkdown)

    gulp.src('testFiles/index.example.html')
        .pipe(
            mustache({
                md_content: rawMarkdown,
                headingData: JSON.stringify(headingData),
                presentation_title: fmt[1].metadata.footer,
                imagePath: `${presentationsRoot}/${folderName}`,
                slideNumber: fmt[1].metadata.slidenumber ?? 'yes',
                hideFooter: fmt[1].metadata.footer === undefined || fmt[1].metadata.footer === null,
                config: config,
            })
        )
        .pipe(rename('index.html'))
        .pipe(gulp.dest('.'))
}

function addTOC(folderName, rawMarkdown) {
    const metadata = utils.extractFrontmatter(rawMarkdown)
    const [title, content] = utils.generateTOC(rawMarkdown, `testFiles/${presentationsRoot}/config.yml`)
    gulp.src('testFiles/templates/title-content-template.html')
        .pipe(
            mustache({
                title: title,
                content: content,
                metadata: metadata[1].metadata,
                imagePath: `${presentationsRoot}/${folderName}`,
            })
        )
        .pipe(rename('toc-template.html'))
        .pipe(gulp.dest('templates/'))
}

gulp.task('serve', () => {
    if (!FILE) {
        console.error('Markdown filename is missing.')
        process.exit(1)
    }
    const folderName = FILE.split('.md')[0]
    const rawMarkdown = utils.preProcessMarkdown(
        `testFiles/${presentationsRoot}/${folderName}/${FILE}`,
        `testFiles/${presentationsRoot}/config.yml`
    )
    addTOC(folderName, rawMarkdown)
    renderIndexHTML(folderName, rawMarkdown)

    process.chdir('testFiles/')
    connect.server({
        root: ROOT,
        port: PORT,
        host: HOST,
        livereload: true,
    })
})
