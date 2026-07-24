# No-cache dev server for the simulator.
#
# Why this exists: `python -m http.server` sends only Last-Modified, so browsers
# apply HEURISTIC caching — a module untouched for a week gets cached for ~14
# hours without revalidation. With agents editing modules daily this produced
# "the requested module does not provide an export" ghosts and invisible UI
# changes until caches were manually cleared. Cache-Control: no-store makes
# every plain refresh pick up the current files.
#
# Usage:  python serve.py [port]     (default 8080)
# Then open http://localhost:8080/simulator.html
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    # bind 0.0.0.0 explicitly: the modern default ('::') is IPv6-only on
    # Windows, which makes LAN addresses like 192.168.x.x refuse connections
    http.server.test(HandlerClass=NoCacheHandler, port=port, bind='0.0.0.0')
