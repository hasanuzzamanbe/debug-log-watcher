#!/bin/bash

# Test script to send Laravel/Symfony dump format to the integrated dump server

DUMP_URL="http://localhost:9913/dump"

echo "🔍 Testing Laravel Dump Format..."
echo "📡 Sending Laravel-style dumps to $DUMP_URL"
echo ""

# Test 1: Laravel Model dump (similar to your example)
echo "Sending Laravel Model dump..."
curl -X POST "$DUMP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "FluentCart\\App\\Models\\Customer {#3205\n  #connection: \"mysql\"\n  #table: \"fct_customers\"\n  #primaryKey: \"id\"\n  #keyType: \"int\"\n  +incrementing: true\n  #with: []\n  #withCount: []\n  +preventsLazyLoading: false\n  #perPage: 15\n  +exists: true\n  +wasRecentlyCreated: false\n  #escapeWhenCastingToString: false\n  #attributes: array:21 [\n    \"id\" => \"1\"\n    \"user_id\" => \"1\"\n    \"contact_id\" => \"0\"\n    \"email\" => \"shamim@authlab.io\"\n    \"first_name\" => \"Hasanuzzaman shamim Franks\"\n    \"last_name\" => \"\"\n    \"status\" => \"active\"\n    \"purchase_value\" => \"{\"USD\": 804900}\"\n    \"purchase_count\" => \"55\"\n    \"ltv\" => \"804900\"\n    \"first_purchase_date\" => \"2025-08-10 05:47:12\"\n    \"last_purchase_date\" => \"2025-08-15 12:18:34\"\n    \"aov\" => null\n    \"notes\" => \"\"\n    \"uuid\" => \"1a4fe0fb40a5e0d554375146eebe9364\"\n    \"country\" => \"BD\"\n    \"city\" => \"Sylhet\"\n    \"state\" => \"BD-60\"\n    \"postcode\" => \"3100\"\n    \"created_at\" => \"2025-08-10 05:47:12\"\n    \"updated_at\" => \"2025-08-15 12:18:34\"\n  ]\n  #original: array:21 [\n    \"id\" => \"1\"\n    \"user_id\" => \"1\"\n    \"email\" => \"shamim@authlab.io\"\n  ]\n  #fillable: array:18 [\n    0 => \"user_id\"\n    1 => \"contact_id\"\n    2 => \"email\"\n    3 => \"first_name\"\n    4 => \"last_name\"\n  ]\n}",
    "source": {
      "file": "/Volumes/Projects/cart/wp-includes/class-wp-hook.php",
      "line": 324
    },
    "time": "20:30:59"
  }' \
  -w "\nStatus: %{http_code}\n\n"

sleep 1

# Test 2: Simple array dump
echo "Sending simple array dump..."
curl -X POST "$DUMP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "array:3 [\n  \"name\" => \"John Doe\"\n  \"email\" => \"john@example.com\"\n  \"role\" => \"admin\"\n]",
    "source": {
      "file": "/path/to/test.php",
      "line": 42
    },
    "time": "'$(date +"%H:%M:%S")'"
  }' \
  -w "\nStatus: %{http_code}\n\n"

sleep 1

# Test 3: Collection dump
echo "Sending Collection dump..."
curl -X POST "$DUMP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "Illuminate\\Support\\Collection {#1234\n  #items: array:3 [\n    0 => \"item1\"\n    1 => \"item2\"\n    2 => \"item3\"\n  ]\n  #escapeWhenCastingToString: false\n}",
    "source": {
      "file": "/app/Http/Controllers/TestController.php",
      "line": 15
    }
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo ""
echo "✨ Laravel dump test completed!"
echo "Check the Dumper section to see properly formatted Laravel dumps with:"
echo "- ✅ Syntax highlighting for classes, properties, and values"
echo "- ✅ Source file information"
echo "- ✅ Proper formatting and indentation"
echo "- ✅ Color-coded visibility modifiers (public +, protected -, private #)"
