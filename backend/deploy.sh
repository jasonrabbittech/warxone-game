#!/bin/bash
# WarXOne - SCF Function Deploy Script
# Packages each SCF function into a zip and uploads to COS,
# then triggers SCF function code update.
#
# Prerequisites:
#   - tencentcloud CLI (tccli) installed and configured
#   - OR: COSCMD installed for upload, then use console/API to update SCF
#   - Node.js dependencies installed: cd backend && npm install
#
# Usage:
#   ./deploy.sh [function-name]   # Deploy a single function
#   ./deploy.sh all               # Deploy all functions
#   ./deploy.sh                   # Same as 'all'

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR"
SHARED_DIR="$BACKEND_DIR/shared"
BUILD_DIR="$BACKEND_DIR/.build"
REGION="${TENCENT_REGION:-ap-hongkong}"
COS_BUCKET="${COS_DEPLOY_BUCKET:-warxone-scf-deploy}"

# All SCF function names
ALL_FUNCTIONS=(
  auth-register
  auth-login
  auth-google
  auth-refresh
  auth-logout
  game-save
  game-load
  game-delete
)

# Determine which functions to deploy
if [ -z "${1:-}" ] || [ "$1" = "all" ]; then
  FUNCTIONS=("${ALL_FUNCTIONS[@]}")
else
  FUNCTIONS=("$1")
fi

echo "=== WarXOne SCF Deploy ==="
echo "Region: $REGION"
echo "Functions: ${FUNCTIONS[*]}"
echo ""

# Install dependencies if needed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo ">>> Installing dependencies..."
  cd "$BACKEND_DIR"
  npm install --production
fi

# Create build directory
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

for FUNC in "${FUNCTIONS[@]}"; do
  echo ">>> Packaging warxone-${FUNC}..."

  FUNC_DIR="$BACKEND_DIR/function/$FUNC"
  if [ ! -d "$FUNC_DIR" ]; then
    echo "    ERROR: Function directory not found: $FUNC_DIR"
    continue
  fi

  # Create temp package directory
  PKG_DIR="$BUILD_DIR/$FUNC"
  rm -rf "$PKG_DIR"
  mkdir -p "$PKG_DIR"

  # Copy function code
  cp "$FUNC_DIR/index.js" "$PKG_DIR/"

  # Copy shared modules (flatten into package root so require('./shared/db') works)
  # We restructure: shared/ -> node_modules/warxone-shared/
  mkdir -p "$PKG_DIR/shared"
  cp "$SHARED_DIR"/*.js "$PKG_DIR/shared/"

  # Copy node_modules (mysql2 etc.)
  if [ -d "$BACKEND_DIR/node_modules" ]; then
    cp -r "$BACKEND_DIR/node_modules" "$PKG_DIR/"
  fi

  # Create zip
  ZIP_FILE="$BUILD_DIR/warxone-${FUNC}.zip"
  cd "$PKG_DIR"
  zip -r -q "$ZIP_FILE" .
  cd "$BACKEND_DIR"

  ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
  echo "    Created: $ZIP_FILE ($ZIP_SIZE)"

  # Upload to COS using coscmd
  if command -v coscmd &>/dev/null; then
    echo "    Uploading to COS..."
    coscmd upload "$ZIP_FILE" "/functions/warxone-${FUNC}.zip" -b "${COS_BUCKET}-${APPID:-1376958570}" -r "$REGION" 2>/dev/null || {
      echo "    WARNING: COS upload failed. Upload manually or check coscmd config."
    }
  else
    echo "    NOTE: coscmd not found. Upload $ZIP_FILE to COS bucket manually:"
    echo "          coscmd upload $ZIP_FILE /functions/warxone-${FUNC}.zip"
  fi

  # Update SCF function code
  if command -v tccli &>/dev/null; then
    echo "    Updating SCF function..."
    tccli scf UpdateFunctionCode \
      --FunctionName "warxone-${FUNC}" \
      --CosBucketName "${COS_BUCKET}-${APPID:-1376958570}" \
      --CosObjectName "functions/warxone-${FUNC}.zip" \
      --CosBucketRegion "$REGION" \
      --Region "$REGION" \
      2>/dev/null || {
      echo "    WARNING: SCF update failed. Update manually via console."
    }
  else
    echo "    NOTE: tccli not found. Update SCF function code manually via console."
  fi

  echo "    Done: warxone-${FUNC}"
  echo ""
done

echo "=== Deploy Complete ==="
echo "Build artifacts in: $BUILD_DIR/"
echo ""
echo "Next steps:"
echo "  1. Ensure Terraform infrastructure is applied (warxone-infra repo)"
echo "  2. Upload zips to COS if not done automatically"
echo "  3. Test API endpoints via API Gateway URL"
