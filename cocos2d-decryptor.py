import frida
import sys
import json
import os

# remote frida server running on Android device
DEVICE_IP = "192.168.1.215:27043"         
# Android package name of Cocos2d game
PACKAGE_NAME = "com.my.cocos2d.game" 
# accompanied JS script (do not change)
SCRIPT_PATH = "cocos2d-decryptor.js"     
# where to save decrypted source code files 
OUTPUT_FOLDER = "./cocos2dgame-files"     

def on_message(message, data):
    if message['type'] == 'send':
        data = json.loads(message['payload'])
        file = data['file']
        contents = data['content']

        local_file = OUTPUT_FOLDER + file

        directory = os.path.dirname(local_file)
        if not os.path.exists(directory):
            os.makedirs(directory)

        open(local_file, "wb").write(bytes.fromhex(contents))
        print("Saved: " + local_file)
    else:
        print("[*] {}".format(message))


def attach_to_device_by_ip(device_ip, process_name, js_script_path):
    session = frida.get_device_manager().add_remote_device(device_ip)
    pid = session.spawn([process_name])
    process = session.attach(pid)
    script_code = open(js_script_path, 'r').read()
    script = process.create_script(script_code)
    script.on('message', on_message)
    script.load()
    session.resume(pid)
    sys.stdin.read()


if __name__ == "__main__":
    attach_to_device_by_ip(DEVICE_IP, PACKAGE_NAME, SCRIPT_PATH)