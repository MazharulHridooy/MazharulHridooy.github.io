#!/bin/sh
# Regenerates cv.pdf from index.html's print stylesheet. Needs tools/serve-gzip.py running on 4174.
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --no-pdf-header-footer --print-to-pdf=cv.pdf http://localhost:4174/
