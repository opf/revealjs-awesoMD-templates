const yargs = require('yargs')
const gulp = require('gulp')
const connect = require('gulp-connect')
const utils = require('./testFiles/utils/utils')
const mustache = require('gulp-mustache')
const rename = require('gulp-rename')

const ROOT = yargs.argv.root || '.'
const PORT = yargs.argv.port || 8080
const HOST = yargs.argv.host || 'localhost'

const FILE = yargs.options({
    file: {
        type: 'string',
    },
}).argv.file

function renderIndexHTML(folderName, rawMarkdown) {
    const fmt = utils.extractFrontmatter(rawMarkdown)
    const headingData = utils.getHeadingData(rawMarkdown)

    gulp.src('testFiles/index.example.html')
        .pipe(
            mustache({
                md_content: rawMarkdown,
                headingData: JSON.stringify(headingData),
                presentation_title: fmt[1].metadata.footer,
                imagePath: `markdown/${folderName}`,
                slideNumber: fmt[1].metadata.slidenumber ?? 'yes',
                hideFooter: fmt[1].metadata.footer === undefined || fmt[1].metadata.footer === null,
            })
        )
        .pipe(rename('index.html'))
        .pipe(gulp.dest('.'))
}

function addTOC(folderName, rawMarkdown) {
    const metadata = utils.extractFrontmatter(rawMarkdown)
    const [title, content] = utils.generateTOC(rawMarkdown, 'testFiles/markdown/config.yml')
    gulp.src('testFiles/templates/title-content-template.html')
        .pipe(
            mustache({
                title: title,
                content: content,
                metadata: metadata[1].metadata,
                imagePath: `markdown/${folderName}`,
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
        `testFiles/markdown/${folderName}/${FILE}`,
        'testFiles/markdown/config.yml'
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