import sys
import os
import subprocess

filePath = sys.argv[1]
airDate = sys.argv[6]
dn = os.path.abspath(os.path.join(os.path.join(os.path.realpath(sys.argv[0]), "../../.."), "dcplusplusreleaseannouncer.js"))
print(dn)

subprocess.call(["node", str(dn), str(filePath), str(airDate)])
