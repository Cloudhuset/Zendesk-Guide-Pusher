# Zendesk Guide Pusher

## What is this?
A tool to help you download and upload zendesk help center, allow you to be able to version control your theme. Note that this is only for `html`, `css` and `js`. For the `assets` and `Appearance` need to be done in the Zendesk theme editor.
At the time of writing, the theme editor is in `Guide` > `Guide Admin` > `Customize design (Eye icon)`


## How to install
Node >= 4  
Add this line to package.json dependencies:
```
"zendesk-guide-pusher": "git+ssh://git@github.com:lusimail/zendesk-guide-pusher.git#master"
```


## Preparing config data
* Login to your Zendesk theme editor with chrome devtools open
* Go to the network tab and check "preserve log"
* Make a change to a file and click save
* Find the PUT request to `https://yourdomain.zendesk.com/hc/admin/help_centers/{your_help_center_id}`.
* Grab the Cookie and X-CSRF-Token from the request headers and the "help center id" and "theme id" from the response, keep them in this format:
  __Note: Cookie and X-CSRF-Token will change everytime you login__
  ```
  {
    HOST: '<yourdomain.zendesk.com>',
    HC_ID: '<your_help_center_id>',
    THEME_ID: '',
    COOKIE: '',
    CSRF_TOKEN: ''
  }
  ```


## Functions

### download(config)
__Returns:__ promise  
Will download the theme files (html, css, js) and saved them in `theme` folder

### upload(config)
__Returns:__ promise  
Will process the theme files and upload (__won't publish__). You can then check your changes in the Zendesk theme editor.  
__Note: Using this function somehow won't change the publish button state in the theme editor. Need to run the publish function below for publishing.__

### publish(config)
__Returns:__ promise  
Will publish whatever in the theme editor.
