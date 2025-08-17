// Test script to verify clear functionality and scrolling
// Run this in the browser console when the app is open

console.log('=== DEBUGGING CLEAR FUNCTIONALITY AND SCROLLING ===');

// Test 1: Check if elements exist
console.log('1. Checking if elements exist:');
const clearBtn = document.getElementById('clearBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const quickClearBtn = document.getElementById('quickClearBtn');
const logText = document.getElementById('logText');
const logTextContent = document.getElementById('logTextContent');
const homeHeader = document.getElementById('homeHeader');
const logViewHeader = document.getElementById('logViewHeader');
const homeContent = document.getElementById('homeContent');
const logViewContent = document.getElementById('logViewContent');

console.log('clearBtn:', !!clearBtn, clearBtn);
console.log('clearLogBtn:', !!clearLogBtn, clearLogBtn);
console.log('quickClearBtn:', !!quickClearBtn, quickClearBtn);
console.log('logText:', !!logText, logText);
console.log('logTextContent:', !!logTextContent, logTextContent);

// Test 2: Check view state
console.log('\n2. Checking view state:');
console.log('homeHeader display:', homeHeader?.style.display);
console.log('logViewHeader display:', logViewHeader?.style.display);
console.log('homeContent display:', homeContent?.style.display);
console.log('logViewContent display:', logViewContent?.style.display);

// Test 3: Check button event listeners
console.log('\n3. Checking button event listeners:');
if (clearBtn) {
    console.log('clearBtn disabled:', clearBtn.disabled);
    console.log('clearBtn onclick:', clearBtn.onclick);
}
if (clearLogBtn) {
    console.log('clearLogBtn disabled:', clearLogBtn.disabled);
    console.log('clearLogBtn onclick:', clearLogBtn.onclick);
}
if (quickClearBtn) {
    console.log('quickClearBtn disabled:', quickClearBtn.disabled);
    console.log('quickClearBtn onclick:', quickClearBtn.onclick);
}

// Test 4: Check scrolling
console.log('\n4. Checking scrolling:');
if (logTextContent) {
    console.log('logTextContent scrollHeight:', logTextContent.scrollHeight);
    console.log('logTextContent clientHeight:', logTextContent.clientHeight);
    console.log('logTextContent overflow-y:', getComputedStyle(logTextContent).overflowY);
    console.log('logTextContent flex:', getComputedStyle(logTextContent).flex);
}

// Test 5: Manual button click test
console.log('\n5. Manual button click test:');
window.testClearButton = function() {
    console.log('Testing clear button click...');
    if (clearLogBtn && !clearLogBtn.disabled) {
        clearLogBtn.click();
        console.log('clearLogBtn clicked');
    } else {
        console.log('clearLogBtn not available or disabled');
    }
};

console.log('Run testClearButton() to test the clear button manually');
console.log('\n=== DEBUG COMPLETE ===');
