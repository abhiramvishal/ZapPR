#!/bin/bash
# Publishes app for Expo Go and prints share link.
# Prerequisites: npx expo login, eas init (to set project ID)
set -e
cd "$(dirname "$0")/.."
npx eas update --branch default --message "Update"
echo ""
echo "Share this URL with testers: https://expo.dev/$(node -p "require('./app.json').expo.owner || 'YOUR_USERNAME')/$(node -p "require('./app.json').expo.slug")"
