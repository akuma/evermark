# Markdown Syntax

## Emphasis

*This text will be italic*
_This will also be italic_

**This text will be bold**
__This will also be bold__

~~This text will be crossed~~

_You **can** combine ~~them~~_

## Sups & Subs

19^th^ H~2~O

## Emojis

:smile: :smiling_imp: :heart: :sunny: :watermelon: :cn:

## Links

http://github.com - automatic!
[GitHub](http://github.com)

## Blockquotes

As Kanye West said:

> We're living the future so
> the present is our past.

## Lists

### Unordered

- Item 1
- Item 2
  - Item 2a
  - Item 2b

### Ordered

1. Item 1
1. Item 2
1. Item 3
  - Item 3a
  - Item 3b

## Task lists

- [x] Write blog post with :heart:
- [x] Create sample **gist**
- [ ] Take screenshots for blog post

## Tables

First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column

## Images

![Image of test](img/test.png "test image")

## Inline code

This is an inline code: `var example = true`

## Block code

```
console.log('Hello world!')
```

```js
console.log('Hello world!')
```

## Diagrams

```
graph LR
  A-->B
  B-->C
  C-->A
  D-->C
```

```
sequenceDiagram
  Alice->>John: Hello John, how are you?
  John-->>Alice: Great!
```

```
gantt
  title A Gantt Diagram

  section Section
  A task           :a1, 2014-01-01, 30d
  Another task     :after a1  , 20d
  section Another
  Task in sec      :2014-01-12  , 12d
  anther task      : 24d
```

## HTML

<div style="color: red;">This is a <strong>html</strong> code.</div>
