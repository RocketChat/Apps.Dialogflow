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

## Pre-Programmed Buttons

These buttons perform a specific action in the app. You can add them by simply pasting the following block in your Quick Replies payload. **Note**: You can change the `text` and `buttonStyle` parameters as per your requirements, but only use the provided `actionId` for the button you want to add.

### Handover Button

- On clicking this button, the visitor will be handed over to another departement. You can set the target department in the app setting called **Target Department for Handover** or add a `departmentName` param in your payload. On failing to provide a department name in either way, will send a request failure message back to the visitor, when visitor clicks the button. 

- Add the following block in your Quick Replies payload, with **actionId** set as `df_perform_handover`, to include this button in your response:

- Parameters:

|      Param Name       |  Dependency  | Param Type |           Acceptable Value          |
|:---------------------:|:------------:|:----------:|:-----------------------------------:|
|       `actionId`      | **Required** |   String   |        `df_perform_handover`        |
|         `text`        | **Required** |   String   |               **Any**               |
|     `buttonStyle`     | **Optional** |   String   |        `primary` or `danger`        |
| `data.departmentName` | **Optional** |   Object   | **Any Omnichannel department name** |

- Example Structure:

```
{
   "text": "Perform Handover",
   "buttonStyle": "primary",
   "actionId": "df_perform_handover",
   "data": {
      "departmentName": "sales"
   }
}
```

### Close Chat Button

- When visitor clicks this button, the chat session will be closed. Add the following block in your Quick Replies payload, with **actionId** set as `df_close_chat`, to include this button in your response:

- Parameters:

|   Param Name  |  Dependency  | Param Type |    Acceptable Value   |
|:-------------:|:------------:|:----------:|:---------------------:|
|   `actionId`  | **Required** |   String   |    `df_close_chat`    |
|     `text`    | **Required** |   String   |        **Any**        |
| `buttonStyle` | **Optional** |   String   | `primary` or `danger` |

- Example Structure:

```
{
   "text": "Close Chat",
   "buttonStyle": "danger",
   "actionId": "df_close_chat"
}
```

## Example

![Pre-Programmed Example Payload](https://user-images.githubusercontent.com/41849970/92283593-d5e70a80-ef1d-11ea-8860-e91a4980515f.png)
