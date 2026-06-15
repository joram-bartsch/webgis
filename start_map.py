import os
import http.server
import socketserver
import webbrowser
import threading

def open_browser(port):
    url = f"http://localhost:{port}"
    webbrowser.open(url)

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    Handler = http.server.SimpleHTTPRequestHandler

    start_port = 8000
    max_port = 8050
    port = start_port
    httpd = None

    while port <= max_port:
        try:
            httpd = socketserver.TCPServer(("", port), Handler)
            break
        except OSError:
            port += 1

    if httpd is None:
        print("Kein freier Port in der Range")
        return

    print("Start lokalen Server")
    try:
        threading.Timer(1.0, open_browser, args=[port]).start()
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()
        print("Server beendet")


if __name__ == "__main__":
    main()
