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

- 支持基于命令行添加、发布笔记，同时会自动添加在笔记内容中指定的笔记本和标签。
- 支持转换 Markdown 格式的笔记，支持高亮代码块、引用网络图片、本地图片、任务列表等。

-------------------

## 安装方法

```bash
npm install -g evermark
```

## 命令说明

### 初始化 Evermark 文件夹

执行完后需要修改该目录下的 `evermark.json`，填写你的 `developerToken`。

```bash
evermark init <destination>
```

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
evermark publish <file>
```

### 撤销笔记

在 Evernote 中删除 markdown 文件对应的笔记，markdown 文件不会删除。

```bash
evermark unpublish <file>
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

### Raw HTML

```
<div style="color: red;">This is a <strong>html</strong> code.</div>
```

### Notebooks & Tags

- **Evermark** 自动使用文档内出现的第一个标题作为笔记标题。
- **Evermark** 支持 `@(笔记本)[标签 A|标签 B]` 语法, 以选择笔记本和添加标签。

## License

[MIT](LICENSE)
