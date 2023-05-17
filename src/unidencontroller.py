import time
import serial
import threading

class unidencontroller(object):
	#lock for the serial connection
	lock_scanner_ser = threading.Lock()
	ser = None	#serial connection
	ser_status = False 
	
	#thread which polls for display status
	thread_status_updater = None
	
	#locks were considered for display_status and quit, 
	#however there should only be one writer so they were not used
	display_status = '' 				#current updated display
	update_display_status = True		#whether to continue updating the display
	#TODO: implement system to stop updating if no clients are requesting. 
		
	
	
	def connect_serial(self):
		self.ser = serial.Serial(
			port='/dev/ttyACM0',
			baudrate=115200,
			parity=serial.PARITY_NONE,
			stopbits=serial.STOPBITS_ONE,
			bytesize=serial.EIGHTBITS
		)
		if(self.ser.is_open):
			self.ser_status = True
			self.update_display_status = True
			self.thread_status_updater = threading.Thread(target=self.status_updater) #TODO: does this actually exit when parent quits
			self.thread_status_updater.start()
			print("BCD996P2CONTROLLER Initialized")
			return True
		else:
			print("bcd966p2controller failed to initialize")
			return False
			
	
	def disconnect_serial(self):
		print("stopping display updates...")
		self.update_display_status = False
		self.thread_status_updater.join()
		print("display updates stopped.")
		if self.ser.is_open:
			self.ser.close()
		self.ser_status = False
			
		return True
			
	#TODO: doesn't handle a serial error, such as unplug or power off
	def get_serial_status(self):
		return self.ser_status
	
	
	#TODO: handle case when serial error occurs
	def status_updater(self):
		while self.update_display_status:
			self.display_status = self.get_status()
			time.sleep(.3)
		return
		
	
	#accept and handle a command
	def command(self, cmd):
		if self.ser_status != True:
			return 'Error - serial not connected'
		if cmd == 'get_status':
			status = self.display_status
			return status
		else:
			return self.send_command(cmd)

	#TODO: handle case when serial error occurs
	#send command to scanner, returns response
	def send_command(self, cmd):
		self.lock_scanner_ser.acquire()
		cmd += '\r\n'
		self.ser.write(cmd.encode())
		response = self.get_response()
		self.lock_scanner_ser.release()
		if len(response) == 0:
			return b'Error: Scanner did not respond'
		return response

	#get serial response
	def get_response(self):
		out = bytes()
		time.sleep(.1)
		while self.ser.inWaiting() > 0:
			out += self.ser.read(1)
		return out

	#get STS from scanner
	def get_status(self):
		sts = self.send_command('STS\r\n')
		if sts == b'Error: Scanner did not respond':
			return sts
			
		sts = self.clean_text(sts)
		#refer to API to understand formating of return information
		stslist = sts.split(',')
		numrows = len(stslist[1])
		dsplist = list()
		
		#format display text
		j = 2
		for i in range(numrows):
			cur_row = ''
			if stslist[j+1] == '________________':
				cur_row = '<u>' + stslist[j] + '</u><br>'
			elif stslist[j+1] == '****************':
				cur_row = '<span class="highlight">' + stslist[j] + '</span><br>'
			else:
				cur_row = stslist[j] + '<br>'	
			dsplist.append(cur_row)
			j += 2
		dispstring = ''.join(dsplist)
		return dispstring
	
	#remove special character mappings and replace mappable ones
	def clean_text(self, txt):
		txt = txt.replace(b'\x8D\x8E\x8F\x90',b'HOLD')

		#RSI levels
		txt = txt.replace(b'\xA6', b'Rx: 1')
		txt = txt.replace(b'\xA7', b'Rx: 2')
		txt = txt.replace(b'\xA8\xA9', b'Rx: 3')
		txt = txt.replace(b'\xAA\xAB', b'Rx: 4')
		txt = txt.replace(b'\xAC\xAD', b'Rx: 5')

		#PRI
		txt = txt.replace(b'\xA1\xA2', b'PRI')

		#ATT
		txt = txt.replace(b'\xa3\xa4\xa5', b'ATT')

		#L/O
		txt = txt.replace(b'\x95\x96\x97', b'L/O')
		txt = txt.replace(b'\xDD\xDE\xDF', b'L/O')

		#NAC
		txt = txt.replace(b'\xD4\xd5\xd6', b'NAC:')

		#MAX
		txt = txt.replace(b'\xd0\xd1\xd2\xd3', b'MAX')

		#REP
		txt = txt.replace(b'\xcd\xce\xcf', b'REP')

		#scr
		txt = txt.replace(b'\xc8\xc9\xca', b'SCR')

		#IFX
		txt = txt.replace(b'\xc5\xc6\xc7', b'IFX')
		
		#SRCH
		txt = txt.replace(b'\xc1\xc2\xc3\xc4', b'SRCH')

		#DSKP
		txt = txt.replace(b'\x91\x92\x93\x94', b'DSKP')

		#AM FM NFM WFM FMB
		txt = txt.replace(b'\x98\x99\x9a', b' AM')
		txt = txt.replace(b'\x9B\x9C\x9a', b' FM')
		txt = txt.replace(b'\x9D\x9E\x9C\x9a', b'NFM')
		txt = txt.replace(b'\x9f\xa0\x9c\x9a', b'WFM')
		txt = txt.replace(b'\x9b\x9c\xb9\xba', b'FMB')

		txt = txt.decode('utf-8', 'ignore')
		return txt
		
