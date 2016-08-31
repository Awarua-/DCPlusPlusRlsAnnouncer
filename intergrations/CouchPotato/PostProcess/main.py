from couchpotato.core.event import addEvent
from couchpotato.core.logger import CPLog
from couchpotato.core.plugins.base import Plugin
from subprocess import Popen, PIPE
import traceback
from datetime import datetime
from os import path
import os

log = CPLog(__name__)


class PostProcess(Plugin):

    def __init__(self):
        addEvent("renamer.after", self.callscript)

    def callscript(self, message=None, group=None):
        log.info("Run post process script")
        moviefile = group["renamed_files"]
        date = datetime.now().strftime("%Y-%m-%d")

        scriptDir = None
        releaserDir = os.environ.get("DC_RELEASE_DIR")
        if releaserDir != None:
            scriptDir = releaserDir
        #check for likely locations in home dir
        elif os.path.isdir("~/DCPlusPlusRlsAnnouncer"):
            scriptDir = "~/DCPlusPlusRlsAnnouncer"
        elif os.path.isdir("~/DCPlusPlusRlsAnnouncer-master")
            scriptDir = "~/DCPlusPlusRlsAnnouncer-master"

        if scriptDir == None
            return False

        scriptDir = os.path.abspath(os.path.join(scriptDir, "dcplusplusreleaseannouncer.js"))
        command = ["node", str(scriptDir)]
        movies = []
        movie = None
        for x in moviefile:
            movies.append(x)

        if len(movies) == 1:
            movie = command[0]
        elif len(movies) > 1:
            movie = self.find_largest_file(movies)
        else:
            return False

        command.append(str(os.path.abspath(movie)))
        command.append(date)

        try:
            p = Popen(command, stdout=PIPE)
            res = p.wait()
            if res == 0:
                log.info('PostProcess Script was called successfully')
                return True
            else:
                log.info('PostProcess Script returned an error code: %s', str(res))

        except:
            log.error('Failed to call script: %s', (traceback.format_exc()))

        return False

    def find_largest_file(self, files):
        largest = files[0]
        largestSize = path.getsize(largest)

        for movie in files[1:]:
            current = path.getsize(movie)
            if current > largestSize:
                largest = movie

        return largest
