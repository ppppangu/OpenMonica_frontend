#!/usr/bin/env python3
"""
简单的本地HTTP服务器
用于解决本地开发时的CORS问题
"""

import http.server
import socketserver
import os
import sys

# 设置端口
PORT = 8000

# 切换到脚本所在目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加CORS头
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"服务器启动成功！")
            print(f"请在浏览器中访问: http://localhost:{PORT}")
            print(f"按 Ctrl+C 停止服务器")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except OSError as e:
        if e.errno == 10048:  # Windows端口被占用
            print(f"端口 {PORT} 已被占用，请尝试其他端口")
        else:
            print(f"启动服务器时出错: {e}")
