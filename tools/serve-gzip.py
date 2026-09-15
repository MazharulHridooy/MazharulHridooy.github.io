#!/usr/bin/env python3
"""Static server with gzip, to approximate GitHub Pages locally for Lighthouse.
python3 -m http.server does not compress, which makes LCP/FCP look worse than
production. Audit harness only - not used by the deployed site."""
import gzip, io, os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

COMPRESSIBLE = ('.html', '.css', '.js', '.json', '.xml', '.svg', '.txt')

class H(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
        if not os.path.isfile(path):
            return super().send_head()
        accepts = 'gzip' in self.headers.get('Accept-Encoding', '')
        if not (accepts and path.endswith(COMPRESSIBLE)):
            return super().send_head()
        body = open(path, 'rb').read()
        buf = io.BytesIO()
        with gzip.GzipFile(fileobj=buf, mode='wb', compresslevel=9) as gz:
            gz.write(body)
        data = buf.getvalue()
        self.send_response(200)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Encoding', 'gzip')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        return io.BytesIO(data)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4174
    ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
