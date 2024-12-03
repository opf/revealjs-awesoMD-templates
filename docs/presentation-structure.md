# Presentation Markdown Structure

The markdown file consists of two parts:

1. [Default metadata](#default-metadata),
   These are some general settings for the presentation
2. [Slides](#slides) 
   each slide is started with a markdown header of any level (e.g. `#`, `##`, `###`)

## Default Metadata

The `default metadata` is in the front matter format and is used to define the default values for the presentation. It
is enclosed within `---`.
The markdown file should start with the default metadata like this:

```yml
---
description: This is a presentation slide for training materials
footer: OpenProject training
presenter: Peter Lustig
language: en
---
```

### The supported default metadata are as follows:

| Default Metadata | Description                                                                            | Requirement |
|------------------|----------------------------------------------------------------------------------------|-------------|
| `description`    | The brief description of the presentation                                              | optional    |
| `footer`         | The main title of the presentation, that can be seen on bottom-left of the every slide | optional    |
| `presenter`      | The name of the presenter                                                              | mandatory   |
| `slidenumber`    | Option to activate or deactivate slide number. `yes \| no` (default `yes`)             | optional    |
| `language`       | Language of the presentation slide.                                                    | mandatory   |

## Slides

Each slide is started with a markdown header of any level (e.g. `#`, `##`, `###`)

Example code:

```markdown

# This is the title

## This is another tile
```

Would build a presentation with two slides with their respective titles.

### Inline metadata

Sometime you may want to override the default metadata for a specific slide. 
This can be done by adding inline metadata, placed directly after the slide title.

The format for inline metadata is

```
# Title of the slide ::metadata_key:metadata_value ::another_metadata_key:another_metadata_value
```

#### Supported inline metadata

| Default Metadata | Description                                                     |
|------------------|-----------------------------------------------------------------|
| `slide`          | The type of slide, see [slide types](#slide-types)              |
| `toc`            | Should this slide be included in index and the table of content |

##### `slide`

Select a slide type

Code:

```markdown

# This is the title ::slide:section

## This is another tile ::slide:title-content-image
```

The first slide will be a section slide, and the second slide will be a title-content-image slide.

##### `toc`

Slides are automatically included in the table of contents. If you want to exclude a slide from the table of contents, set `toc` to `false`.

Code:

```markdown

# This is the title ::slide:section

## This is another tile ::slide:title-content-image

## This is another tile (Part Two) ::slide:title-content-image ::toc:false

## This is yet another tile ::slide:title-content-image

```

results in:

```
1. This is the title
   1.1 This is another tile
   1.2 This is yet another tile
```

### Inline metadata using config file

Most presentations contain a Cover slide and a Table of Contents slide by default. Defining these default slides in every markdown file seems redundant. To simplify things in the markdown files, you can use a config file where you can define all the default configs for your presentation.

Create `markdown/config.yml`.


#### Supported metadata

| Metadata         | Description                                                                         |
|------------------|-------------------------------------------------------------------------------------|
| `level_to_slide` | Maps what level of heading will correspond to which [slide types](#slide-types)     |
| `slides`         | Types of slides to be added at the beginning of presentation (`toc` and `op-cover`) |

Code:

```yml
default:
   level_to_slide:
      h1: section
      h2: title-content
   slides:
      - op-cover
      - toc
```
Under `level_to_slide`, set slide types to the corresponding heading level. If a slide type for a slide is already defined in the inline metadata, the setting specified in the config file will be ignored.

Under `slides`, define slide types that you want to include at the beginning of a presentation by default. Current default slide types are `op-cover` and `toc`. If these slides are already specified in the markdown file then the settings from the config file will be ignored.

Using the `config.yml` file, the markdown file will be simplified as below:

```md
---
description: This is a presentation slide for training materials
footer: OpenProject training
presenter: Peter Lustig
slide: title-image
---

# This is the title

## This is another tile

# This is the title after another title ::slide:title-content-image

```
With these settings, the Cover slide and the Table of Contents slide will be added at the beginning by default, followed by the `section` slide, `title-content` slide and `title-content-image` slide.

### Images

Image files must be placed in the same folder as the markdown file is. 
Subfolders like `assets` or any paths like `\users\example-user\image.png` are not supported. 
URLs are not supported.

Images are referenced with standard markdown like this:

```markdown
![This is image description](image.png)
```
The description is optional:
```markdown
![](image.png)
```

#### Inline metadata for images

Analog to meta data for slides, you can add metadata for images.

| Inline Metadata | Description                    | Requirement |
|-----------------|--------------------------------|-------------|
| `credit`        | Credit the source of the image | optional    |

Example:

```markdown
![This is image description ::credit: Source: https://www.example.com](image.png)
```

### Heading levels:

For automatic indexing, the heading levels are used. The heading levels are also used to generate the table of contents.

```markdown
# Title

## Another title

### Yet another title

# Heading

## Another heading
```

would be indexed and displayed in the table of content as:

```
1. Title
   1.1 Another title
   1.2 Yet another title
2. Heading
   2.1 Another heading
```

## Slide types

### Supported slide types:

The value of the `slide` type from the default metadata will be used if the `slide` type is not given in the slide's
inline metadata.
The most used slide type can be given in the default metadata, so you don't need to add the `slide` type in every slide.

| Slide Type            | Description                                                      | Usage                         |
|-----------------------|------------------------------------------------------------------|-------------------------------|
| `cover`               | this slide type can be used for cover slide and thank you slide  | `::slide:cover`               |
| `op-cover`            | cover page with OpenProject background image                     | `::slide:op-cover`            |
| `toc`                 | the slide for Table of Contents                                  | `::slide:toc`                 |
| `section`             | the section break for different parts                            | `::slide:section`             |
| `title-content`       | the slide with title and content (content can be images as well) | `::slide:title-content`       |
| `title-content-image` | the slide with title, content, and image                         | `::slide:title-content-image` |

### Slide "Cover"

Preview:

```text
┌────────────────────────────────────────────────────┐
│                                                    │
│                                                    │
│                                                    │
│ PRESENTER NAME                                     │
│ TITLE                                              │
│                                                    │
│                                                    │
├────────────────────────────────────────────────────┤
│                                              LOGO  │
└────────────────────────────────────────────────────┘
```

Code:

```markdown
# TITLE ::slide:cover
```

### Slide "Table of Contents"

Preview:

```text
┌────────────────────────────────────────────────────┐
│ TITLE                                              │
├────────────────────────────────────────────────────┤
│                                                    │
│                                                    │
│ CONTENT (automatically generated)                  │
│                                                    │
│                                                    │
├────────────────────────────────────────────────────┤
│  FOOTER TITLE           PAGENR               LOGO  │
└────────────────────────────────────────────────────┘
```

Code:

```markdown
# TITLE ::slide:toc
```

### Slide "Section"

Preview:

```text
┌────────────────────────────────────────────────────┐
│                                                    │
│                                                    │
│                       TITLE                        │
│                      CONTENT                       │
│                                                    │
│                                                    │
│                                                    │
├────────────────────────────────────────────────────┤
│  FOOTER TITLE           PAGENR               LOGO  │
└────────────────────────────────────────────────────┘
```

Code:

```markdown
# TITLE ::slide:section

CONTENT
```

### Slide "title-content"

Preview:

```text
┌────────────────────────────────────────────────────┐
│ TITLE                                              │
├────────────────────────────────────────────────────┤
│                                                    │
│                                                    │
│ CONTENT                                            │
│                                                    │
│                                                    │
├────────────────────────────────────────────────────┤
│  FOOTER TITLE           PAGENR               LOGO  │
└────────────────────────────────────────────────────┘
```

```markdown
# TITLE ::slide:title-content

CONTENT
```

Image can also be included in the content of the slide.

Preview:

```text
┌────────────────────────────────────────────────────┐
│ TITLE                                              │
├────────────────────────────────────────────────────┤
│ CONTENT                                            │
├────────────────────────────────────────────────────┤
│                                                    │
│                       IMAGE                        │
│                                                    │
├────────────────────────────────────────────────────┤
│  FOOTER TITLE           PAGENR               LOGO  │
└────────────────────────────────────────────────────┘
```

Code:

```markdown
# TITLE ::slide:title-image

CONTENT

![This is image description](image.png)
```

### Slide "title-content-image"

Preview:

```text
┌────────────────────────────────────────────────────┐
│ TITLE                                              │
├──────────────────────────┬─────────────────────────┤
│                          │                         │
│                          │                         │
│  CONTENT                 │          IMAGE          │
│                          │                         │
│                          │                         │
├──────────────────────────┴─────────────────────────┤
│  FOOTER TITLE           PAGENR               LOGO  │
└────────────────────────────────────────────────────┘
```

Code:

```markdown
# TITLE ::slide:title-content-image

CONTENT

![This is image description](image.png)
```

Note: The image will always display at the right side, regardless where it is placed in markdown.

```markdown
# TITLE ::slide:title-content-image

![This is image description](image.png)

CONTENT
```
