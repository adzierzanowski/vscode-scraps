# VSCode Scraps

This extension adds a panel with different kind of items such as

- shortcuts to files
- website links
- terminal commands
- vscode commands
- todo items
- markdown notes

![Scraps Panel](./assets/readme/panel.png)

## Features

There are different kinds of scraps which can perform different actions.

### File

Opens file in editor.

To create a File scrap you can:

- drag a file from the explorer and drop it into the scrap tree
- drag an opened tab and drop it into the scrap tree
- use the **Add current line as Scrap** command

| field       |                          | example               |
| ----------- | ------------------------ | --------------------- |
| name        |                          |                       |
| description |                          |                       |
| uri         | URI of the file location | `file:///foo.txt#L10` |

### Group

Group is just a container for other scraps.

| field       |                                    | example |
| ----------- | ---------------------------------- | ------- |
| name        |                                    |         |
| description |                                    |         |
| color       | color of the icon in the tree view | `cyan`  |

### Link

Opens a link in the browser.

| field       |      | example              |
| ----------- | ---- | -------------------- |
| name        |      |                      |
| description |      |                      |
| uri         | link | `https://vscode.dev` |

### Note

Opens a markdown preview of its content.

| field       |                 | example |
| ----------- | --------------- | ------- |
| name        |                 |         |
| description |                 |         |
| content     | markdown string |         |

### Shell

Executes a command in the integrated terminal.

| field       |                    | example       |
| ----------- | ------------------ | ------------- |
| name        |                    |               |
| description |                    |               |
| command     | command to execute | `echo foobar` |

### Todo

An item with checkbox.

| field       |     | example |
| ----------- | --- | ------- |
| name        |     |         |
| description |     |         |

### VScommand

Executes a VSCode command.

| field       |                    | example                                        |
| ----------- | ------------------ | ---------------------------------------------- |
| name        |                    |                                                |
| description |                    |                                                |
| command     | command to execute | `workbench.action.findInFiles`                 |
| args        | list of arguments  | `[{"query": "console.log", "isRegex": false}]` |

The argument list is in JSON format and is an array of strings or objects. If
the command doesn't need any arguments, you may leave the field empty or pass an
empty array `[]`.

## Extension Settings

This extension contributes the following settings:

- `doublefloat.scraps.path`: Path to the scrapbook data file
- `doublefloat.scraps.saveOnChange`: Save scrapbook state automatically
- `doublefloat.scraps.confirmRemoval`: Set confirmation dialog behavior on scrap
  removal
- `doublefloat.scraps.sortingMethod`: Set ordering of the scraps in the tree

## Release Notes

See [changelog](CHANGELOG.md)
