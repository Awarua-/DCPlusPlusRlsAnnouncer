from couchpotato.core.event import addEvGent
from couchpotato.core.logger import CPLog
from couchpotato.core.plugins.base import Plugin
from subprocess import Popen, PIPE
import traceback
import datetime
from time import strftime

log = CPLog(__name__)


class PostProcess(Plugin):

    def __init__(self):
        addEvent('renamer.after', self.callscript)

    def callscript(self, message=None, group=None):
        log.info("Run post process script")
        moviefile = group['renamed_files']
        date = strftime("%Y-%m-%d", datetime.now())

        command = ['nodejs', '~/DCPlusPlusRlsAnnouncer/src/main/rlsBot.js']
        for x in moviefile:
            print(x)
            command.append(x)

        command.append(date)

        # try:
        #     p = Popen(command, stdout=PIPE)
        #     res = p.wait()
        #     if res == 0:
        #         log.info('PostProcess Script was called successfully')
        #         return True
        #     else:
        #         log.info('PostProcess Script returned an error code: %s', str(res))
        #
        # except:
        #     log.error('Failed to call script: %s', (traceback.format_exc()))

        return False