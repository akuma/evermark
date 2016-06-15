# Evermark

> A command line tool for syncing markdown files to Evernote.

**Evermark** 是一款基于 Evernote 的 Markdown 笔记命令行工具，简单实用。

- 支持基于命令行添加、发布笔记，同时会自动添加在笔记内容中指定的笔记本和标签。
- 支持转换 Markdown 格式的笔记，支持高亮代码块、引用网络图片（本地图片暂不支持）。

-------------------

## 安装方法

```bash
npm install -g evermark
```

## 命令说明

初始化笔记目录

```bash
evermark init <destination>
```

查看或修改配置

```bash
evermark config [name] [value]
```

添加笔记文件（创建一个本地的 markdown 文件）

```bash
evermark new <title>
```

发布笔记（将 markdown 文件发布到 Evernote，对于已发布过的文件会采取更新操作）

```bash
evermark publish <file>
```

查看帮助

```bash
evermark help [command]
```

## Markdown 简介

> Markdown 是一种轻量级标记语言，它允许人们使用易读易写的纯文本格式编写文档，然后转换成格式丰富的HTML页面。  —— [维基百科](https://zh.wikipedia.org/wiki/Markdown)

正如您在阅读的这份文档，它使用简单的符号标识不同的标题，将某些文字标记为 **粗体** 或者 *斜体*，创建一个[链接](http://www.example.com)。下面是几个 **Evermark** 支持的高级功能。

### 代码块

```javascript
var s = "JavaScript syntax highlighting";
alert(s);
```

```python
s = "Python syntax highlighting"
print s
```

```
No language indicated, so no syntax highlighting.
But let's throw in a <b>tag</b>.
```

### 表格

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

Markdown | Less | Pretty
--- | --- | ---
*Still* | `renders` | **nicely**
1 | 2 | 3

## Evernote 相关

- **Evermark** 支持 `@(笔记本)[标签 A|标签 B]` 语法, 以选择笔记本和添加标签。
- **Evermark** 自动使用文档内出现的第一个标题作为笔记标题。例如本文，就是第一行的 `Evermark`。
