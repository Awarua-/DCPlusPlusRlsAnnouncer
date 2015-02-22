import sys
import subprocess

filePath = sys.argv[1]
airDate = sys.argv[6]

subprocess.call("nodejs ~/DCPlusPlusRlsAnnouncer/src/main/rlsBot.js " + str(filePath) + " " + str(airDate), shell=True)