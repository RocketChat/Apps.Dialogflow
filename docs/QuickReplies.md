### Quick Replies Structure
```
{
  "quickReplies": {
    "title": string,
    "quickReplies": [
      string
    ]
  }
}
```

### Field description

1. `title`

- **Type**: string
- **Description**:  The title of the collection of quick replies

2. `quickReplies[]`
- **Type**: Array of string
- **Description**:  The collection of quick replies.

### Example
In this example, there are 2 simple text messages and one `quickReply` message
#### Dialogflow Dashboard 
![image](./images/QuickRepliesDialogflowDashboard.png)
#### Corresponding Livechat widget
![image](./images/QuickRepliesLivechatWidget.png)
