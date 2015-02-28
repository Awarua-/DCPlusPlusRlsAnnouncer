from couchpotato.core.event import addEvent
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
        date = strftime("%Y-%m-%d", datetime.date.now())

        command = ['nodejs', '~/DCPlusPlusRlsAnnouncer/src/main/rlsBot.js']
        for x in moviefile:
            log.info('moviefile' +str(x))
            command.append(x)

        command.append(date)


        log.info('Command TIME, SON!')
        log.info('files='+str(group['files']))
        log.info('destination_dir='+str(group['destination_dir']))
        log.info('identifier='+str(group['identifier']))
        log.info('media='+str(group['media']))
        log.info('release_download='+str(group['release_download']))
        log.info('identifiers='+str(group['identifiers']))
        log.info('is_dvd='+str(group['is_dvd']))
        log.info('filename='+str(group['filename']))
        log.info('meta_data='+str(group['meta_data']))
        log.info('parentdir='+str(group['parentdir']))
        log.info('renamed_files='+str(group['renamed_files']))
        log.info('before_rename='+str(group['before_rename']))
        log.info('dirname='+str(group['dirname']))
        log.info('subtitle_language='+str(group['subtitle_language']))

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