#!/bin/bash

# Test script to verify main container scrolling (not individual dump scrolling)

DUMP_URL="http://localhost:9913/dump"

echo "🔍 Testing Main Container Scrolling..."
echo "📡 Sending multiple large dumps to test container scrolling"
echo ""

# Send multiple large dumps to test main container scrolling
for i in {1..8}; do
  echo "Sending large dump $i/8..."
  
  curl -X POST "$DUMP_URL" \
    -H "Content-Type: application/json" \
    -d '{
      "html": "FluentCart\\App\\Models\\Customer {#'$((3200 + i))'\n  #connection: \"mysql\"\n  #table: \"fct_customers\"\n  #primaryKey: \"id\"\n  #keyType: \"int\"\n  +incrementing: true\n  #with: []\n  #withCount: []\n  +preventsLazyLoading: false\n  #perPage: 15\n  +exists: true\n  +wasRecentlyCreated: false\n  #escapeWhenCastingToString: false\n  #attributes: array:25 [\n    \"id\" => \"'$i'\"\n    \"user_id\" => \"'$i'\"\n    \"contact_id\" => \"0\"\n    \"email\" => \"user'$i'@example.com\"\n    \"first_name\" => \"User Number '$i'\"\n    \"last_name\" => \"Test User\"\n    \"status\" => \"active\"\n    \"purchase_value\" => \"{\\\"USD\\\": '$((100000 * i))'}\"\n    \"purchase_count\" => \"'$((10 * i))'\"\n    \"ltv\" => \"'$((100000 * i))'\"\n    \"first_purchase_date\" => \"2025-08-10 05:47:12\"\n    \"last_purchase_date\" => \"2025-08-15 12:18:34\"\n    \"aov\" => null\n    \"notes\" => \"This is a test note for user '$i' with some additional content to make the dump larger and test the scrolling behavior properly\"\n    \"uuid\" => \"'$(uuidgen | tr '[:upper:]' '[:lower:]')'\"\n    \"country\" => \"BD\"\n    \"city\" => \"Sylhet\"\n    \"state\" => \"BD-60\"\n    \"postcode\" => \"3100\"\n    \"metadata\" => array:5 [\n      \"source\" => \"test_script\"\n      \"iteration\" => \"'$i'\"\n      \"timestamp\" => \"'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'\"\n      \"large_field\" => \"This is a very long text field that contains a lot of information to make the dump content larger and test how the scrolling behaves when there is substantial content in each dump. This should help verify that the main container scrolls properly while individual dumps display their full content without internal scrolling.\"\n      \"additional_data\" => \"More test data to increase dump size\"\n    ]\n    \"created_at\" => \"2025-08-10 05:47:12\"\n    \"updated_at\" => \"2025-08-15 12:18:34\"\n  ]\n  #original: array:25 [\n    \"id\" => \"'$i'\"\n    \"user_id\" => \"'$i'\"\n    \"email\" => \"user'$i'@example.com\"\n    \"first_name\" => \"User Number '$i'\"\n    \"status\" => \"active\"\n  ]\n  #changes: []\n  #casts: []\n  #classCastCache: []\n  #attributeCastCache: []\n  #dates: []\n  #dateFormat: null\n  #fillable: array:18 [\n    0 => \"user_id\"\n    1 => \"contact_id\"\n    2 => \"email\"\n    3 => \"first_name\"\n    4 => \"last_name\"\n    5 => \"status\"\n    6 => \"purchase_value\"\n    7 => \"purchase_count\"\n    8 => \"ltv\"\n    9 => \"notes\"\n    10 => \"uuid\"\n    11 => \"country\"\n    12 => \"city\"\n    13 => \"state\"\n    14 => \"postcode\"\n  ]\n  #guarded: array:2 [\n    0 => \"id\"\n    1 => \"ID\"\n  ]\n}",
      "source": {
        "file": "/test/scrolling-test.php",
        "line": '$((100 + i))'
      },
      "time": "'$(date +"%H:%M:%S")'"
    }' \
    -s > /dev/null
  
  sleep 0.3
done

echo ""
echo "✨ Scrolling test completed!"
echo ""
echo "Expected behavior in the dumper:"
echo "- ✅ Main container should be scrollable (vertical scroll bar on right)"
echo "- ✅ Individual dumps should display full content without internal scrolling"
echo "- ✅ Each dump card should expand to show all content"
echo "- ✅ You should be able to scroll through all 8 dumps in the main container"
echo "- ❌ Individual dump cards should NOT have their own scroll bars"
