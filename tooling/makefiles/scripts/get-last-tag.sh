#!/bin/zsh
# Usage: ./get-last-tag.sh <PREFIX>
# Example: ./get-last-tag.sh clawmore (gets clawmore-v*)
# Example: ./get-last-tag.sh clawmore-dev (gets clawmore-dev-v*)

PREFIX=$1
if [ -z "$PREFIX" ]; then
    echo "Usage: $0 <PREFIX>"
    exit 1
fi

# Find the most recent tag matching the prefix and vX.X.X pattern
# Using -v:refname for proper version sorting
LAST_TAG=$(git tag -l "$PREFIX-v*" --sort=-v:refname | head -n 1)

if [ -n "$LAST_TAG" ]; then
    # Extract version part (everything after the prefix and -v)
    VERSION=${LAST_TAG#$PREFIX-v}
    echo "$VERSION"
else
    # No tag found, output a safe base version or empty
    echo "0.0.0"
fi
