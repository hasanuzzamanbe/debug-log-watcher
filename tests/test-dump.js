// Test script to send dumps to the integrated dump server
const axios = require('axios');

const DUMP_URL = 'http://localhost:9913/dump';

// Sample dump data similar to what the original dump-viewer would receive
function createSampleDump(index) {
  return {
    time: new Date().toISOString(),
    content: `<div class="sf-dump">
      <span class="sf-dump-note">array:3</span> [<samp>
        "<span class="sf-dump-key">user_id</span>" => <span class="sf-dump-num">${123 + index}</span>
        "<span class="sf-dump-key">username</span>" => "<span class="sf-dump-str">user_${index}</span>"
        "<span class="sf-dump-key">data</span>" => <span class="sf-dump-note">array:2</span> [<samp>
          "<span class="sf-dump-key">email</span>" => "<span class="sf-dump-str">user${index}@example.com</span>"
          "<span class="sf-dump-key">role</span>" => "<span class="sf-dump-str">admin</span>"
        </samp>]
      </samp>]
    </div>`
  };
}

const sampleDumps = [
  createSampleDump(1),
  {
    time: new Date().toISOString(),
    content: `<div class="sf-dump">
      <span class="sf-dump-note">string(25)</span> "<span class="sf-dump-str">Hello from WordPress dump!</span>"
    </div>`
  },
  {
    time: new Date().toISOString(),
    content: `<div class="sf-dump">
      <span class="sf-dump-note">object(WP_User)</span> [<samp>
        "<span class="sf-dump-key">ID</span>" => <span class="sf-dump-num">1</span>
        "<span class="sf-dump-key">user_login</span>" => "<span class="sf-dump-str">admin</span>"
        "<span class="sf-dump-key">user_email</span>" => "<span class="sf-dump-str">admin@example.com</span>"
        "<span class="sf-dump-key">user_registered</span>" => "<span class="sf-dump-str">2024-01-01 00:00:00</span>"
      </samp>]
    </div>`
  },
  // Test with different data formats
  {
    time: new Date().toISOString(),
    dump: `<div class="sf-dump"><span class="sf-dump-str">Test with 'dump' field</span></div>`
  },
  {
    data: `<div class="sf-dump"><span class="sf-dump-str">Test with 'data' field</span></div>`
  },
  {
    // Test with raw object (will be JSON stringified)
    user: { id: 123, name: "Test User" },
    timestamp: new Date().toISOString()
  }
];

async function sendTestDump(dumpData) {
  try {
    const response = await axios.post(DUMP_URL, dumpData);
    console.log(`✅ Dump sent successfully: ${response.status}`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - make sure the dump server is running in the app');
    } else {
      console.log(`❌ Error sending dump: ${error.message}`);
    }
    return false;
  }
}

async function runTest() {
  console.log('🔍 Testing WP Dump Server Integration...\n');
  
  console.log('📡 Sending test dumps to http://localhost:9913/dump');
  console.log('Make sure the dump server is started in the WP Debugger app\n');
  
  for (let i = 0; i < sampleDumps.length; i++) {
    console.log(`Sending dump ${i + 1}/${sampleDumps.length}...`);
    await sendTestDump(sampleDumps[i]);
    
    // Wait a bit between dumps
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✨ Test completed! Check the Dumper section in the app to see the results.');
}

// Check if axios is available
try {
  require('axios');
  runTest();
} catch (error) {
  console.log('❌ axios not found. Install it with: npm install axios');
  console.log('Or test manually with curl:');
  console.log('curl -X POST http://localhost:9913/dump -H "Content-Type: application/json" -d \'{"time":"' + new Date().toISOString() + '","content":"<div>Test dump</div>"}\'');
}
