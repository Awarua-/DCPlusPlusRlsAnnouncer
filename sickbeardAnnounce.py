import sys
import subprocess

filePath = sys.argv[1]
airDate = sys.argv[6]
print(filePath)
print(airDate)

subprocess.call("nodejs ~/DCPlusPlusAnnouncer/src/main/rlsBot.js" + str(filePath) + str(airDate), shell=True)