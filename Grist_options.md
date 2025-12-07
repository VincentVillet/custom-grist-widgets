This is the Grist documentation on options:

If your widget needs to store some options, Grist offers a simple key-value storage API for you to use. Here are some JavaScript code snippets that show how to interact with this API:

// Store a simple text value .
await grist.setOption('color', '#FF0000');

// Store complex objects as JSON.
await grist.setOption('settings', {lines: 10, skipFirst: true});

// Read previously saved option
const color = await grist.getOption('color');

// Clear all options.
await grist.clearOptions();

// Get and replace all options.
await grist.getOptions();
await grist.setOptions({...});
You can experiment with this yourself. Here is a test widget that demonstrates how to use this API:

https://gristlabs.github.io/grist-widget/inspect/onOptions.html

When your widget saves or edits some options, the icon on top of the section gets highlighted in green. You can either apply those options to the widget or revert that modification.

unsaved options

This allows viewers (users with read-only access) or collaborators to configure your widget without overwriting original settings. This behavior should look familiar to you and others, as this works like sorting and filtering on table or card views.

Saving current options you will apply them to the widget and make them available to others. Using this menu, you can also clear all options to revert the widget to its initial state. To do this, press the little trash icon and then Save.

Grist will also trigger an event, every time the options are changed (or cleared). Here is how you can subscribe to this event.

grist.onOptions(function(options, interaction) {
  if (options) {
    console.log('Current color', options.color);
  } else {
    // No widget options were saved, fallback to default ones.
  }
});
If you are building your own widget, you generally should not read options directly (using grist.widgetApi.getOption()). A better pattern is to apply them all when they are changed. Using the onOptions handler will make your widget easier to change and understand later.

There is one more scenario to cover. Suppose your widget has some kind of custom configuration screen. In that case, you probably need some button or other UI element that the user can use to show it. This additional UI element will likely be rarely used by you or your collaborators, so it doesn’t make sense to show it all the time. To help with this, Grist offers an additional interaction option you can send as part of the ready message:

grist.ready({
  onEditOptions: function() {
    // Your custom logic to open the custom configuration screen.
  }
});
This will tell Grist to display an additional button Open configuration in the creator panel and the section menu. When clicked, it will trigger your handler, which you can use to show your own custom configuration screen.