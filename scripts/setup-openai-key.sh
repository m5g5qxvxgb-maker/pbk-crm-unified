#!/bin/bash

# OpenAI API Key Setup Script

echo "=================================================="
echo "  OpenAI API Key Setup"
echo "=================================================="
echo ""

# Check if key provided as argument
if [ -n "$1" ]; then
  NEW_KEY="$1"
else
  # Prompt for key
  echo "Enter your OpenAI API key (starts with sk-):"
  read -r NEW_KEY
fi

# Validate key format
if [[ ! "$NEW_KEY" =~ ^sk- ]]; then
  echo "❌ Error: Invalid key format. OpenAI keys start with 'sk-'"
  exit 1
fi

if [ ${#NEW_KEY} -lt 20 ]; then
  echo "❌ Error: Key too short. Please check the key."
  exit 1
fi

# Backup current .env
if [ -f .env ]; then
  cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
  echo "✅ Backed up .env file"
fi

# Update .env file
if grep -q "^OPENAI_API_KEY=" .env 2>/dev/null; then
  # Replace existing key
  sed -i "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$NEW_KEY|" .env
  echo "✅ Updated OPENAI_API_KEY in .env"
else
  # Add new key
  echo "OPENAI_API_KEY=$NEW_KEY" >> .env
  echo "✅ Added OPENAI_API_KEY to .env"
fi

# Verify
echo ""
echo "Verifying configuration..."
cd backend
node tests/check-ai-status.js

echo ""
echo "=================================================="
echo "  Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Restart backend: npm restart"
echo "2. Test integration: node tests/test-ai-integration.js"
echo ""
