y**# Debug Instructions for Clear Button and Scrolling Issues

## Steps to Test:

1. **Open the Debug Log Watcher application**
2. **Open Developer Tools** (Cmd+Option+I on Mac)
3. **Add the test log file**:
   - Click "Add Log File"
   - Browse and select `test-debug.log`
   - Click "Add File"

4. **Test Home View**:
   - You should see only the "Test Notification" button
   - No clear buttons should be visible

5. **Select the log file**:
   - Click on the log file in the sidebar
   - This should switch to single log view

6. **Check if buttons are visible**:
   - Look for "Clear" button in the header
   - Look for "Clear Log File" button in the content header
   - Look for floating clear button (🗑️) in bottom right

7. **Test scrolling**:
   - The log content should be scrollable if it's long enough
   - Try scrolling up and down in the log content area

8. **Test clear functionality**:
   - Try clicking each clear button
   - Check browser console for any errors

## Debug Commands (Run in Browser Console):

```javascript
// Check element visibility
console.log('Clear buttons visible:');
console.log('clearBtn:', document.getElementById('clearBtn')?.offsetParent !== null);
console.log('clearLogBtn:', document.getElementById('clearLogBtn')?.offsetParent !== null);
console.log('quickClearBtn:', document.getElementById('quickClearBtn')?.offsetParent !== null);

// Check view state
console.log('View state:');
console.log('homeHeader display:', document.getElementById('homeHeader')?.style.display);
console.log('logViewHeader display:', document.getElementById('logViewHeader')?.style.display);
console.log('homeContent display:', document.getElementById('homeContent')?.style.display);
console.log('logViewContent display:', document.getElementById('logViewContent')?.style.display);

// Test clear function manually
if (window.clearCurrentLog) {
    console.log('Testing clear function...');
    window.clearCurrentLog();
}

// Check scrolling
const logTextContent = document.getElementById('logTextContent');
if (logTextContent) {
    console.log('Scroll info:');
    console.log('scrollHeight:', logTextContent.scrollHeight);
    console.log('clientHeight:', logTextContent.clientHeight);
    console.log('Can scroll:', logTextContent.scrollHeight > logTextContent.clientHeight);
}
```

## Expected Behavior:

1. **Home view**: Only test notification button visible
2. **Log view**: All action buttons visible (clear, export, refresh, etc.)
3. **Scrolling**: Log content should scroll when content exceeds container height
4. **Clear buttons**: Should work and clear the log file content

## Common Issues to Check:

1. **Element not found**: Check if DOM elements exist
2. **CSS display issues**: Check if elements are hidden by CSS
3. **Event listeners**: Check if click handlers are attached
4. **View switching**: Check if view state changes properly
5. **Flex layout**: Check if CSS flex properties are correct
