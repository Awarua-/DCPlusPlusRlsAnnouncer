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
        addEvent("renamer.after", self.call_script)

    def call_script(self, message=None, group=None):
        log.info("Run post process script")
        movie_file = group["renamed_files"]
        date = datetime.now().strftime("%Y-%m-%d")

        script_dir = None
        releaser_dir = os.environ.get("DC_RELEASE_DIR")
        if releaser_dir is not None:
            script_dir = releaser_dir
        # check for likely locations in home dir
        elif os.path.isdir("~/DCPlusPlusRlsAnnouncer"):
            script_dir = "~/DCPlusPlusRlsAnnouncer"
        elif os.path.isdir("~/DCPlusPlusRlsAnnouncer-master"):
            script_dir = "~/DCPlusPlusRlsAnnouncer-master"

        if script_dir is None:
            return False

        script_dir = os.path.abspath(os.path.join(script_dir, "dcplusplusreleaseannouncer.js"))
        command = ["node", str(script_dir)]
        movies = []
        for x in movie_file:
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

    @staticmethod
    def find_largest_file(files):
        largest = files[0]
        largest_size = path.getsize(largest)

        for movie in files[1:]:
            current = path.getsize(movie)
            if current > largest_size:
                largest = movie

        return largest
