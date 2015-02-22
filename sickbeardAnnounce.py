import sys
import subprocess

filePath = sys.argv[1]
airDate = sys.argv[6]

subprocess.call("nodejs ~/DCPlusPlusAnnouncer/src/main/rlsBot.js" + filePath + airDate, shell=True)