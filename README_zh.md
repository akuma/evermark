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

> 将 markdown 笔记同步到 Evernote 的命令行工具 :elephant:

一些功能特性：

- [x] 支持发布 markdown 笔记到 evernote
- [x] 支持从 evernote 取消发布 markdown 笔记
- [x] 支持添加笔记本和标签
- [x] 支持代码高亮，表格和插入图像
- [x] 支持 todo-list 和 LaTeX 表达式
- [x] 支持流程图、序列图和甘特图

-------------------

## 安装

```bash
npm install -g evermark
```

## 命令

### 初始化 Evermark 目录

初始化 **Evermark** 目录, 将配置信息保存到 `evermark.json` 文件。

```bash
evermark init <destination>
```

1. 首先，按照提示选择是使用 Evernote International 还是印象笔记。
1. 然后使用您的帐户从自动打开的页面登录，生成 `developerToken` 并复制它。
1. 最后，根据提示粘贴上一步复制的 `developerToken`。

生成 `developerToken` 的链接地址：

- [Evernote International](https://www.evernote.com/api/DeveloperToken.action)
- [印象笔记](https://app.yinxiang.com/api/DeveloperToken.action)

### 查看或修改配置

```bash
evermark config [name] [value]
```

### 添加笔记

在 **Evermark** 目录的 `notes` 目录下创建一个空的 markdown 笔记。

```bash
evermark new <title>
```

### 发布笔记

将 markdown 笔记发布到 Evernote 或者更新已发布的 markdown 笔记。

```bash
evermark publish <file_or_directory>
```

### 取消发布笔记

删除 markdown 笔记对应的 Evernote 笔记，markdown 笔记文件不会被删除。

```bash
evermark unpublish <file_or_directory>
```

### 查看帮助

```bash
evermark help [command]
```

## 支持的 Markdown 语法

### 标题

```
# H1
## H2
### H3
#### H4
##### H5
###### H6
```

### 强调

```
*This text will be italic*
_This will also be italic_

**This text will be bold**
__This will also be bold__

~~This text will be crossed~~

_You **can** combine ~~them~~_
```

### 上标和下标

```
19^th^
H~2~O
```

### 表情符

```
:smile: :heart: :sunny: :watermelon: :cn:
```

### 链接

```
http://github.com - automatic!
[GitHub](http://github.com)
```

### 引用

```
As Kanye West said:

> We're living the future so
> the present is our past.
```

### 列表

#### 无须列表

```
- Item 1
- Item 2
  - Item 2a
  - Item 2b
```

#### 有序列表

```
1. Item 1
1. Item 2
1. Item 3
   - Item 3a
   - Item 3b
```

### 任务列表

```
- [x] Write blog post with :heart:
- [x] Create sample **gist**
- [ ] Take screenshots for blog post
```

### 表格

```
First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column
```

### 图片

```
![Image of Test](img/test.png "Image of Test")
![GitHub Logo](https://assets-cdn.github.com/images/modules/logos_page/Octocat.png "GitHub Logo")
```

### 行内代码

```
This is an inline code: `var example = true`
```

### 代码块

    ```js
    console.log('Hello world!')
    ```

### 图表

**Evermark** 通过 [mermaid](https://github.com/knsv/mermaid) 来支持流程图、序列表和甘特图。<br>
具体语法请查看 [mermaid 文档](http://knsv.github.io/mermaid/)。

#### 流程图

    ```
    graph LR
        A[Square Rect] -- Link text --> B((Circle))
        A --> C(Round Rect)
        B --> D{Rhombus}
        C --> D
    ```

<img src="media/flow-diagram.png" alt="Flow Diagram" width="414">

#### 序列图

    ```
    sequenceDiagram
        participant Alice
        participant Bob
        Alice->>John: Hello John, how are you?
        loop Healthcheck
            John->>John: Fight against hypochondria
        end
        Note right of John: Rational thoughts<br/>prevail...
        John-->>Alice: Great!
        John->>Bob: How about you?
        Bob-->>John: Jolly good!
    ```

<img src="media/sequence-diagram.png" alt="Sequence Diagram" width="421">

#### 甘特图

    ```
    gantt
        title A Gantt Diagram

        section Section
        A task           :a1, 2014-01-01, 30d
        Another task     :after a1  , 20d

        section Another
        Task in sec      :2014-01-12, 12d
        anther task      : 24d
    ```

<img src="media/gantt-diagram.png" alt="Gantt Diagram" width="555">

### 数学公式

**Evermark** supports LaTeX expression for math.

#### 行内公式

```
When $a \ne 0$, there are two solutions to $ax^2 + bx + c = 0$ and they are
$x = {-b \pm \sqrt {b^2-4ac} \over 2a}$.
```

<img src="media/inline-math-equations.png" alt="Inline Math Equations" width="659">

#### 公式块

```
$$
\displaystyle \frac{1}{\Bigl(\sqrt{\phi \sqrt{5}}-\phi\Bigr) e^{\frac25 \pi}} =
1+\frac{e^{-2\pi}} {1+\frac{e^{-4\pi}} {1+\frac{e^{-6\pi}} {1+\frac{e^{-8\pi}} {1+\cdots} } } }
$$

$$
\displaystyle \left( \sum_{k=1}^n a_k b_k \right)^2 \leq
\left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
$$
```

<img src="media/block-math-equations.png" alt="Block Math Equations" width="270">

### 原始 HTML

```
<div style="color: red;">This is a <strong>html</strong> code.</div>
```

### 其他语法

#### 笔记本和标签

**Evermark** 使用 @(Notebook)[tag1|tag2|tag3] 语法来选择笔记本并为笔记设置标签。

#### 标题

**Evermark** 以 markdown 笔记内容中的第一个标题作为笔记名称。

## License

[MIT](LICENSE)
