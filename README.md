# Evermark

[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]
[![Windows Build Status][build-image-win]][build-url-win]
[![Coverage Status][coverage-image]][coverage-url]
[![Dependency Status][david-image]][david-url]
[![Dependency Status][david-dev-image]][david-dev-url]

[npm-image]: https://img.shields.io/npm/v/evermark.svg
[npm-url]: https://npmjs.org/package/evermark
[build-image]: https://travis-ci.org/akuma/evermark.svg?branch=master
[build-url]: https://travis-ci.org/akuma/evermark
[build-image-win]: https://ci.appveyor.com/api/projects/status/qy14tkl3qk8f5nl3/branch/master?svg=true
[build-url-win]: https://ci.appveyor.com/project/akuma/evermark/branch/master
[coverage-image]: https://coveralls.io/repos/github/akuma/evermark/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/akuma/evermark?branch=master
[david-image]: https://david-dm.org/akuma/evermark.svg
[david-url]: https://david-dm.org/akuma/evermark
[david-dev-image]: https://david-dm.org/akuma/evermark/dev-status.svg
[david-dev-url]: https://david-dm.org/akuma/evermark#info=devDependencies

> A command line tool for syncing markdown files to Evernote :elephant:

**Evermark** 是一款基于 Evernote 的 Markdown 笔记命令行工具，简单实用。

- [x] 支持基于命令行添加、发布 Markdown 格式的笔记
- [x] 支持自动添加在笔记内容中指定的笔记本和标签
- [x] 支持发布或撤销某个目录下的所有 Markdown 笔记
- [x] 支持高亮代码块、图片引用、表格等
- [x] 支持任务列表
- [x] 支持数学公式
- [x] 支持流程图、序列图、甘特图

-------------------

## 安装方法

```bash
npm install -g evermark
```

## 命令说明

### 初始化 Evermark 文件夹

初始化 Evermark 文件夹，保存配置信息到 `evermark.json` 文件。

```bash
evermark init <destination>
```

1. 首先根据提示选择你使用的是 Evernote International 还是印象笔记；
2. 然后在自动打开的网页里输入账号密码后生成 `developerToken` 并复制；
3. 最后根据提示粘贴刚刚复制的 `developerToken`。

`developerToken` 的生成链接：

- [Evernote International](https://www.evernote.com/api/DeveloperToken.action)
- [印象笔记](https://app.yinxiang.com/api/DeveloperToken.action)

### 查看或修改配置

```bash
evermark config [name] [value]
```

### 添加笔记文件

创建一个 markdown 文件，存放在 Evermark 文件夹的 `notes` 目录下。

```bash
evermark new <title>
```

### 发布笔记

将 markdown 文件发布到 Evernote，对于已发布过的文件会采取更新操作。

```bash
evermark publish <file_or_directory>
```

### 撤销笔记

在 Evernote 中删除 markdown 文件对应的笔记，markdown 文件不会删除。

```bash
evermark unpublish <file_or_directory>
```

### 查看帮助

```bash
evermark help [command]
```

## Evermark 支持的 Markdown 语法

### Headers

```
# H1
## H2
### H3
#### H4
##### H5
###### H6
```

### Emphasis

```
*This text will be italic*
_This will also be italic_

**This text will be bold**
__This will also be bold__

~~This text will be crossed~~

_You **can** combine ~~them~~_
```

### Sups & Subs

```
19^th^
H~2~O
```

### Emoji

```
:smile: :heart: :sunny: :watermelon: :cn:
```

### Links

```
http://github.com - automatic!
[GitHub](http://github.com)
```

### Blockquotes

```
As Kanye West said:

> We're living the future so
> the present is our past.
```

### Lists

#### Unordered

```
- Item 1
- Item 2
  - Item 2a
  - Item 2b
```

#### Ordered

```
1. Item 1
1. Item 2
1. Item 3
   - Item 3a
   - Item 3b
```

### Task Lists

```
- [x] Write blog post with :heart:
- [x] Create sample **gist**
- [ ] Take screenshots for blog post
```

### Tables

```
First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column
```

### Images

```
![Image of Test](img/test.png "Image of Test")
![GitHub Logo](https://assets-cdn.github.com/images/modules/logos_page/Octocat.png "GitHub Logo")
```

### Inline Code

```
This is an inline code: `var example = true`
```

### Block Code

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

## Math Equations

### Inline

```
When $a \ne 0$, there are two solutions to $ax^2 + bx + c = 0$ and they are
$x = {-b \pm \sqrt {b^2-4ac} \over 2a}$.
```

### Block

```
$$
\displaystyle \left( \sum_{k=1}^n a_k b_k \right)^2 \leq
\left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
$$
```

### Raw HTML

```
<div style="color: red;">This is a <strong>html</strong> code.</div>
```

### Notebooks & Tags

- **Evermark** 自动使用文档内出现的第一个标题作为笔记标题。
- **Evermark** 支持 `@(笔记本)[标签A|标签B]` 语法, 以选择笔记本和添加标签。

## License

[MIT](LICENSE)
