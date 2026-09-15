from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
class H(BaseHTTPRequestHandler):
    def do_POST(self):
        n=int(self.headers.get('Content-Length','0'))
        data=self.rfile.read(n)
        out=Path('_generated/problem-illustration-selected-tiny.zip')
        out.write_bytes(data)
        self.send_response(200); self.end_headers(); self.wfile.write(str(len(data)).encode())
        self.server.shutdown_requested=True
    def do_GET(self):
        self.send_response(200); self.end_headers(); self.wfile.write(b'OK')
    def log_message(self,*args): pass
srv=HTTPServer(('0.0.0.0',8766),H)
srv.handle_request()
