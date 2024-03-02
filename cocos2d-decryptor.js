/*
* Find offset of "xxtea_decrypt" in your version of libcocos2dlua.so
*
* https://github.com/xpol/lua-cocos2d-x-xxtea/blob/66c3b2eb75a864baf350a191eb5a807f2028ff99/xxtea.h#L45
*/
const XXTEA_DECRYPT_OFFSET = "0x007EB4A8"
/* 
* Library name of Cocos2D engine, most probably does not requires changes
*/
const COCOS2D_LIB_NAME = 'libcocos2dlua.so'

var LAST_OPENED_LUAC_FILE = null
var FIRST_DETECT = true;

function stringToHex(inputString) {
    var hexString = '';
    for (var i = 0; i < inputString.length; i++) {
        var hex = inputString.charCodeAt(i).toString(16);
        hexString += hex.padStart(2, '0');
    }
    return hexString;
}


function intercept_xxtea_decryptor() {
  const cocosLib = Module.findBaseAddress(COCOS2D_LIB_NAME)

  // xxtea_decrypt
  Interceptor.attach(cocosLib.add(ptr(XXTEA_DECRYPT_OFFSET)), {
    onEnter: function (args) {
      console.log(parseInt(args[3]))
      var key = Memory.readCString(args[2], 16)
      console.log('xxtea_decrypt: file=' + LAST_OPENED_LUAC_FILE + ", key = " + key + ", keyLen = " + args[3]);
    },
    onLeave: function(retval) {
        const content = Memory.readCString(retval);
        send(JSON.stringify({"file": LAST_OPENED_LUAC_FILE, "content": stringToHex(content)}))
    }
  });
}


Interceptor.attach(Module.findExportByName(null, 'open'), {
    onEnter: function (args) {
        var filePath = Memory.readUtf8String(args[0]);
        if (filePath.indexOf(".luac") > -1) {
          LAST_OPENED_LUAC_FILE = filePath
          if(FIRST_DETECT){
            intercept_xxtea_decryptor()
          }
          FIRST_DETECT = false;
        }
    },
});