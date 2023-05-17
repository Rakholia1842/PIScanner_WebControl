import cherrypy
import os
import subprocess
import threading
from unidencontroller import unidencontroller


class ScannerWebApp(object):
	controller = None
	
	def __init__(self): 
		self.controller = unidencontroller()
		self.stream = None
		self.stream_url = None
		self.stream_port = None
		#'plughw:1,0' for raspberry pi
		self.alsaplug = 'plughw:1,0'

	@cherrypy.expose
	def index(self):
		return open('index.html')
		
	@cherrypy.expose
	def command(self, cmd):
		return self.controller.command(cmd)

	@cherrypy.expose
	def serial_status(self):
		if self.controller.get_serial_status():
			return 'CONNECTED'
		else:
			return 'NOT_CONNECTED'
		
	@cherrypy.expose
	def close_serial_connection(self):
		if self.controller.disconnect_serial():
			return 'OK'
		else:
			return 'FAILED'
		
	@cherrypy.expose
	def open_serial_connection(self):
		if self.controller.connect_serial():
			return 'OK'
		else:
			return 'FAILED'
		
	@cherrypy.expose
	def setup_stream(self, host):
		rhost = cherrypy.request.remote.ip
		if host=='this_client':
			host = rhost
						
		if self.stream != None:
			self.close_stream()
		
		port = '1234'
		self.open_stream(host, port) 
		
		rtn = 'Active at other client: ' if host != rhost else 'Active at your Client: '
		return rtn + self.stream_url + ":" + port;
	
	@cherrypy.expose
	def stream_status(self):
		rhost = cherrypy.request.remote.ip
		if self.stream_url == None:
			return 'No Stream Active'
		rtn = 'Active at other client: ' if self.stream_url != rhost else 'Active at your Client: '
		return rtn + self.stream_url + ":" + self.stream_port
		
	@cherrypy.expose
	def disconnect_stream(self):
		self.close_stream()
		return 'OK'
		
	def close_stream(self):
		self.stream.terminate()
		self.stream.wait(100)
		self.stream = None
		self.stream_url = None
		self.stream_port = None
		
	def open_stream(self, host, port):
		self.stream = subprocess.Popen(("ffmpeg -re -f alsa -i " + self.alsaplug + " -codec libmp3lame -f rtp rtp://"
				+ host + ":" + port).split())
		self.stream_url = host 
		self.stream_port = port
		

if __name__ == '__main__':
	conf = {
		'/': {
             'tools.staticdir.root': os.path.abspath(os.getcwd())
         },
         '/static': {
             'tools.staticdir.on': True,
             'tools.staticdir.dir': './public'
         }
     }
	 
	cherrypy.config.update({'server.socket_host': '0.0.0.0'})
	cherrypy.quickstart(ScannerWebApp(), '/', conf)
