#!/bin/bash

# Test script to send dumps to the integrated dump server using curl

DUMP_URL="http://localhost:9913/dump"

echo "🔍 Testing WP Dump Server Integration with curl..."
echo "📡 Sending test dumps to $DUMP_URL"
echo "Make sure the dump server is started in the Debug Log Watcher app"
echo ""

# Test 1: Standard dump with content field
echo "Sending test dump 1..."
curl -X POST "$DUMP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "time": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
    "content": "<div class=\"sf-dump\"><span class=\"sf-dump-note\">string(11)</span> \"<span class=\"sf-dump-str\">Hello World</span>\"</div>"
  }' \
  -w "\nStatus: %{http_code}\n\n"

sleep 1

# Test 2: Dump with different field name
echo "Sending test dump 2..."
curl -X POST "$DUMP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "time": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
    "dump": "<div class=\"sf-dump\"><span class=\"sf-dump-note\">array:2</span> [<samp>\"<span class=\"sf-dump-key\">user_id</span>\" => <span class=\"sf-dump-num\">123</span>\"<span class=\"sf-dump-key\">name</span>\" => \"<span class=\"sf-dump-str\">John Doe</span>\"</samp>]</div>"
  }' \
  -w "\nStatus: %{http_code}\n\n"

sleep 1

# Test 3: Raw object (will be JSON stringified)
echo "Sending test dump 3..."
curl -X POST "$DUMP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "user": {"id": 456, "name": "Jane Smith", "email": "jane@example.com"},
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"
  }' \
  -w "\nStatus: %{http_code}\n\n"

sleep 1

# Test 4: Simple string dump
echo "Sending test dump 4..."
curl -X POST "$DUMP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Simple text dump without HTML formatting"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 5: Large dump to test scrolling
echo "Sending large dump to test scrolling..."
curl -X POST "$DUMP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "time": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
    "content": "<div class=\"sf-dump\"><span class=\"sf-dump-note\">array:10</span> [<samp>\"<span class=\"sf-dump-key\">item1</span>\" => \"<span class=\"sf-dump-str\">value1</span>\"<br>\"<span class=\"sf-dump-key\">item2</span>\" => \"<span class=\"sf-dump-str\">value2</span>\"<br>\"<span class=\"sf-dump-key\">item3</span>\" => \"<span class=\"sf-dump-str\">value3</span>\"<br>\"<span class=\"sf-dump-key\">item4</span>\" => \"<span class=\"sf-dump-str\">value4</span>\"<br>\"<span class=\"sf-dump-key\">item5</span>\" => \"<span class=\"sf-dump-str\">value5</span>\"<br>\"<span class=\"sf-dump-key\">item6</span>\" => \"<span class=\"sf-dump-str\">value6</span>\"<br>\"<span class=\"sf-dump-key\">item7</span>\" => \"<span class=\"sf-dump-str\">value7</span>\"<br>\"<span class=\"sf-dump-key\">item8</span>\" => \"<span class=\"sf-dump-str\">value8</span>\"<br>\"<span class=\"sf-dump-key\">item9</span>\" => \"<span class=\"sf-dump-str\">value9</span>\"<br>\"<span class=\"sf-dump-key\">item10</span>\" => \"<span class=\"sf-dump-str\">value10</span>\"</samp>]</div>"
  }' \
  -w "\nStatus: %{http_code}\n\n"

sleep 1

# Test 6: Multiple dumps to test container scrolling
echo "Sending multiple dumps to test container scrolling..."
for i in {1..5}; do
  curl -X POST "$DUMP_URL" \
    -H "Content-Type: application/json" \
    -d '{
      "time": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
      "content": "<div class=\"sf-dump\"><span class=\"sf-dump-note\">string('$((10+i))')</span> \"<span class=\"sf-dump-str\">Dump number '$i' for scrolling test</span>\"</div>"
    }' \
    -s > /dev/null
  echo "Sent dump $i/5"
  sleep 0.5
done

echo ""
echo "✨ Test completed! Check the Dumper section in the app to see the results."
echo "The app window should have opened automatically when dumps were received."
echo ""
echo "Expected features:"
echo "- ✅ Proper formatting with syntax highlighting"
echo "- ✅ Individual dump scrolling (for large dumps)"
echo "- ✅ Container scrolling (for multiple dumps)"
echo "- ✅ Responsive layout with proper spacing"
