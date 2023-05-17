Hardware: 
Currently, the project only supports the Uniden BCD996P2 [19] scanner. If using a Raspberry Pi, you will need an audio capture device, such as the Sabrent U-MMSA [5]. It is recommended you use a Raspberry Pi 2 or 3. 
Setup: 
First install the operating system of your choice on the Pi; Ubuntu [6] is recommended. You will need to connect your scanner to the Raspberry Pi with the USB programming cable. Also you will need to connect the audio port from the scanner to the capture port on your audio capture device. 

Next you will need to install the dependencies of the project. You will need FFmpeg with alsa support. This should be obtained from the standard repository or compiled from source. 
sudo apt-get install ffmpeg
You will also need a Python 3 environment with CherryPy and Pyserial installed. These can both be installed from Python Pip. You could also use a Virtual Environment to manage this. 
	sudo apt-get install python3
sudo apt-get install virtualenv
virtualenv -p python3 envname
source envname/bin/activate            to exit the env    deactivate
	Your terminal should display ‘(envname) user@machine$’ now
	Install CherryPy and Pyserial
		pip install CherryPy
		pip install pyserial

	Clone the source 
		Install git if necessary sudo apt-get install git
git clone https://bitbucket.org/jackscrj/piscannerwebcontrol
 
Usage:
	Ensure your scanner is turned on and connected to the Pi. Ensure the VirtualEnv is activated. 

	Enter the source directory, 
		cd path-to-source/pirscannerwebcontrol
	
	Start the web app
		python scannerapp.py

	You may now navigate to your Raspberry Pi’s address at port 8080 from another client. 
		Ex. http://192.168.1.39:8080
	
	You will be greeted by the web interface. You may press buttons to control the scanner. 

To start an audio stream to your current device click “stream to this device”. Or to stream to another client, type in the address and click “stream to input”. 

To receive the stream, you will need to utilize VLC Player [12], it is available for Windows, OSX, Android and IOS. To open the stream, click open a network stream and type in rtp://@:1234. This needs to be done on the client which the stream is pointed at. 
If you are using desktop click show advanced options and set network-caching to 100ms.

You should now have full control and audio. 

Shutdown and Notes:

To shut down the app send control-c to the web app. 

If the scanner is disconnected or shutoff the web app will need to be restarted to re-enable control. 
