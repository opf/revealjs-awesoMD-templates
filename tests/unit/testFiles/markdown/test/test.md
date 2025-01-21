---
description: some description
footer: footer content
presenter: presenter name
language: en
---

# Section Slide

## Title Content Slide
some content

## Title Image Slide ::toc:false
![this: simple image description](test-image.jpg)

## Title Image Slide to test image description & credit ::toc:false
![image description with credit ::credit: Source: https://www.example.com](test-image.jpg)

## Title Image Slide to test image credit ::toc:false
![::credit: Source: https://www.example.com](test-image.jpg)

## Title Image Slide to test image credit without value::toc:false
![::credit:](test-image.jpg)

## Title Image Slide to test invalid image metadata ::toc:false
![::credit this to someone: Source: https://www.example.com](test-image.jpg)

## Title Content Image Slide ::slide:title-content-image
some content

![](test-image.jpg)

## Title Content Image Slide - scale down font ::slide:title-content-image

**this line should be visible**

- Lorem
- ipsum
- dolor
- sit
- amet
- consectetur
- adipisicing
- elit
- sed
- eiusmod
- tempor
- incidunt
- ut
- labore
- et
- dolore
- magna
- aliqua.
- Ut
- enim
- ad
- minim
- veniam

Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

**this line should be visible**

![](test-image.jpg)

## ::slide:image ::background:test-16-9.png ::pdfbackground:test-4-3.png

This is some content.

## ::slide:image
some content

# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC
# Section Slide for long TOC

## Mermaid JS

```mermaid
flowchart TD
   A[Start] --> B{Is it?};
   B -- Yes --> C[OK];
   C --> D[Rethink];
   D --> B;
   B -- No ----> E[End];
```
