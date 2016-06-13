# Evermark

> A command line tool for syncing markdown files to Evernote.

**Evermark** 是一款基于印象笔记（Evernote）的 Markdown 笔记命令行工具，简单实用。

- 支持基于命令行添加、发布笔记，同时会自动添加在笔记内容中指定的笔记本和标签；
- 支持转换 Markdown 格式的笔记，支持高亮代码块、引用网络图片（本地图片暂不支持）；

-------------------

## 安装方法

``` sh
npm install -g evermark
```

## 命令说明

初始化         `evermark init <destination>`
查看或修改配置   `evermark config [name] [value]`
添加笔记        `evermark new <title>`
发布笔记        `evermark publish <file>`
查看帮助        `evermark help [command]`

## Markdown 简介

> Markdown 是一种轻量级标记语言，它允许人们使用易读易写的纯文本格式编写文档，然后转换成格式丰富的HTML页面。  —— [维基百科](https://zh.wikipedia.org/wiki/Markdown)

正如您在阅读的这份文档，它使用简单的符号标识不同的标题，将某些文字标记为 **粗体** 或者 *斜体*，创建一个[链接](http://www.example.com)。下面是几个 **Evermark** 支持的高级功能。

### 代码块

``` python
@requires_authorization
def somefunc(param1='', param2=0):
    '''A docstring'''
    if param1 > param2: # interesting
        print 'Greater'
    return (param2 - param1 + 1) or None
class SomeClass:
    pass
>>> message = '''interpreter
... prompt'''
```

### 表格

| Item      |    Value | Qty  |
| :-------- | --------:| :--: |
| Computer  | 1600 USD |  5   |
| Phone     |   12 USD |  12  |
| Pipe      |    1 USD | 234  |

## 印象笔记相关

- **Evermark** 支持 `@(笔记本)[标签 A|标签 B]` 语法, 以选择笔记本和添加标签。
- **Evermark** 自动使用文档内出现的第一个标题作为笔记标题。例如本文，就是第一行的 `Evermark`。
