const yargs = require('yargs')

const gulp = require('gulp')
const eslint = require('gulp-eslint')
const minify = require('gulp-clean-css')
const connect = require('gulp-connect')
const autoprefixer = require('gulp-autoprefixer')
const prettier = require('gulp-prettier')
const stylelint = require('gulp-stylelint')
const htmlhint = require('gulp-htmlhint')
const uglify = require('gulp-uglify')
const sass = require('gulp-sass')(require('sass'))
const sourcemaps = require('gulp-sourcemaps')
const concat = require('gulp-concat')
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')

const vendorScripts = require('./js/vendor')
const utils = require('./utils/utils.js')
const fs = require('fs-extra')
const mustache = require('gulp-mustache')
const rename = require('gulp-rename')
const env = require('dotenv').config()
const config = require('./config')

const ROOT = yargs.argv.root || config.root
const PORT = yargs.argv.port || config.port
const HOST = yargs.argv.host || config.host
const FILE = yargs.options({
    file: {
        type: 'string',
    },
}).argv.file
const presentationsRoot = env.parsed.PRESENTATIONS_ROOT || 'markdown'

function compileToCSS() {
    return gulp
        .src(['css/**/*.scss', 'css/**/*.sass'])
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(minify({ compatibility: 'ie9' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist/css'))
}

function compileJsScript() {
    return gulp.src(vendorScripts).pipe(concat('vendor.js')).pipe(uglify()).pipe(gulp.dest('dist/js'))
}

function browserifyUtils() {
    return browserify()
        .require([
            {
                file: './utils/utils.js',
                expose: 'utils',
            },
        ])
        .bundle()
        .pipe(source('utils.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('./dist/js'))
}

gulp.task('browserifyUtils', () => browserifyUtils())

function renderIndexHTML(folderName, rawMarkdown) {
    const fmt = utils.extractFrontmatter(rawMarkdown)
    const headingData = utils.getHeadingData(rawMarkdown)
    const [markdown, imageAnnotationData] = utils.getImageAnnotationData(rawMarkdown)

    gulp.src('index.example.html')
        .pipe(
            mustache({
                md_content: markdown,
                headingData: JSON.stringify(headingData),
                presentation_title: fmt[1].metadata.footer,
                imagePath: `${presentationsRoot}/${folderName}`,
                slideNumber: fmt[1].metadata.slidenumber ?? 'yes',
                hideFooter: fmt[1].metadata.footer === undefined || fmt[1].metadata.footer === null,
                config: config,
                imageAnnotationData: JSON.stringify(imageAnnotationData),
            })
        )
        .pipe(rename('index.html'))
        .pipe(gulp.dest('.'))
}

function addTOC(folderName, rawMarkdown) {
    const metadata = utils.extractFrontmatter(rawMarkdown)
    const [title, content] = utils.generateTOC(rawMarkdown, `${presentationsRoot}/config.yml`)
    gulp.src('templates/title-content-template.html')
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

// save the markdown filename to make filename accessible during pdf/html export
function storeFilename(file) {
    try {
        const storeFilename = { filename: file }
        fs.writeFileSync('filenameStore.json', JSON.stringify(storeFilename, null, 2))
    } catch (err) {
        console.error(err)
    }
}

gulp.task('copyAssets', async () => {
    await fs.copy('./templates/assets', './dist/templates/assets', { overwrite: false })
})

gulp.task('js', () => compileJsScript())

gulp.task('compileToCSS', () => compileToCSS())

gulp.task('css', () => gulp.src(['css/**/*.css']).pipe(gulp.dest('./dist/css')))

gulp.task('build', gulp.series('compileToCSS', 'css', 'js', 'browserifyUtils', 'copyAssets'))

gulp.task('lint:js', () =>
    gulp
        .src([
            './**/*.js',
            '!node_modules/**',
            '!dist/**',
            '!exports/**',
            '!tests/unit/node_modules/**',
            '!tests/unit/testFiles/dist/**',
        ])
        .pipe(eslint())
        .pipe(eslint.format())
)

gulp.task('lint:css', () =>
    gulp
        .src(['./css/**/*.{scss,css}'])
        .pipe(stylelint({ failAfterError: true, reporters: [{ formatter: 'string', console: true }] }))
)

gulp.task('lint:html', () => gulp.src(['./index.example.html']).pipe(htmlhint()).pipe(htmlhint.failAfterError()))

gulp.task('lint', gulp.parallel('lint:js', 'lint:css', 'lint:html'))

gulp.task('format', () =>
    gulp
        .src([
            './**/*.{js,html,css,scss}',
            '!node_modules/**',
            '!dist/**',
            '!templates/**',
            '!tests/unit/node_modules/**',
            '!tests/unit/testFiles/dist/**',
            '!tests/unit/coverage/**',
        ])
        .pipe(prettier())
        .pipe(gulp.dest('.'))
)

gulp.task('reload', () => gulp.src(['*.html', 'css/**', 'js/**']).pipe(connect.reload()))

gulp.task('serve', () => {
    if (!FILE) {
        console.error('Markdown filename is missing.')
        process.exit(1)
    }
    storeFilename(FILE)
    const folderName = FILE.split('.md')[0]
    const rawMarkdown = utils.preProcessMarkdown(
        `${presentationsRoot}/${folderName}/${FILE}`,
        `${presentationsRoot}/config.yml`
    )
    browserifyUtils()
    addTOC(folderName, rawMarkdown)
    renderIndexHTML(folderName, rawMarkdown)

    connect.server({
        root: ROOT,
        port: PORT,
        host: HOST,
        livereload: true,
    })

    const slidesRoot = ROOT.endsWith('/') ? ROOT : ROOT + '/'

    gulp.watch(
        [
            slidesRoot + '**/*.html',
            slidesRoot + '**/*.md',
            `!${slidesRoot}**/node_modules/**`, // ignore node_modules
        ],
        gulp.series('reload')
    )

    gulp.watch(['js/**'], gulp.series('build', 'reload', 'lint:js'))

    gulp.watch(['css/**'], gulp.series('build', 'reload', 'lint:css'))
})
