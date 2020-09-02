# Quick Replies

## Required Structure
```
{
  "quickReplies": {
    "text": string,
    "options": [
      array of objects
    ]
  }
}
```

## Params

| **Param Name** | **Param Type** |                **Description**                | **Dependency** |                                                                         **Example**                                                                         |
|:--------------:|:--------------:|:---------------------------------------------:|:--------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------------------:|
|     `text`     |     String     | The title of the collection of quick replies. |    Required    |                                 ``` "text": "Sorry I don't know the answer. Please select one of the following options:" ```                                |
|    `options`   |      Array     |    The collection of quick replies objects.   |    Required    | ``` "options": [       {         "text": "Start chat with agent",         "actionId": "sflaia-start-chat",         "buttonStyle" : "primary"       }  ] ``` |

## `options` Params

| **Param Name** | **Param Type** |                                                                      **Description**                                                                     | **Dependency** | **Acceptable Values** |               **Example**               |
|:--------------:|:--------------:|:--------------------------------------------------------------------------------------------------------------------------------------------------------:|:--------------:|:---------------------:|:---------------------------------------:|
|     `text`     |     String     |                                                            Title of the quick replies action.                                                            |    Required    |          Any          |       ``` "text": "Start Chat" ```      |
|   `actionId`   |     String     |                                                              Id of the quick replies action.                                                             |    Optional    |          Any          | ``` "actionId": "sflaia-start-chat" ``` |
|  `buttonStyle` |     String     | Button style of your quick replies action. Use `danger` to render a red colour action and `primary` for an action that matches your Livechat Bar colour. |    Optional    | `danger` or `primary` |     ``` "buttonStyle": "primary" ```    |
### Example

![Quick Replies Example](https://user-images.githubusercontent.com/41849970/91997140-62939c00-ed57-11ea-8b27-82e650a502f0.png)
