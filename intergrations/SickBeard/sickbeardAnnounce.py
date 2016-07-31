import sys
import subprocess

filePath = sys.argv[1]
airDate = sys.argv[6]

subprocess.call("node ~/DCPlusPlusRlsAnnouncer/dcplusplusreleaseannouncer.js \"" + str(filePath) + "\" \"" + str(airDate) + "\"", shell=True)
